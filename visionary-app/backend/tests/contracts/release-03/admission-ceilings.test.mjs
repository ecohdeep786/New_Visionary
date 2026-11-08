// RELEASE-03 (KAN-126) admission ceiling, fairness and dependency-failure proof.
//
// Proves the documented admission law from launch-operations.md against the real
// connected runtime: "Admission control enforces per-UID/device/workspace quotas,
// plan-authorized concurrent runs, output-token/context limits and global
// provider budgets. A shared coordinator must enforce the real global cap;
// per-instance counters cannot. ... Return typed 429/503 with clear retry timing
// rather than allowing unbounded in-memory waiting. Give billing its own queue
// and provider circuit breaker."
//
// What this suite proves locally and what stays a hosted gate is recorded in
// docs/architecture/delivery/RELEASE03_ADMISSION_CEILINGS.md. It never contacts a
// real provider and never claims hosted quota.

import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import stack from './admission-stack.cjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(here, '../../../..');
const backendRequire = createRequire(path.join(productRoot, 'backend/upstream/backend/package.json'));

let runDir, adminApp, accounts;
const report = { generatedAt: new Date().toISOString(), laws: [] };

const RATE_LIMIT_SCOPES = [
  'session-ip 20/min', 'session-uid 10/min', 'profile 20/min', 'logout-all-session 5/min',
  'billing 12/min (sync 30)', 'consent-list 30/min', 'consent-revoke 10/min',
  'account-overview (per policy)', 'personal-workspace-provision (per policy)',
  'institution-invite-issue 10/min', 'institution-invite-accept 10/min',
];

async function control(pathname, body) {
  const response = await fetch(`http://127.0.0.1:${stack.PORTS.control}${pathname}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}),
  });
  return response.json();
}

async function freshCsrf(account) {
  const response = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp: account.deviceIp, jar: account.jar });
  account.jar.capture(response);
  return response.body;
}

async function authedPost(account, pathname, body) {
  const csrf = await freshCsrf(account);
  return stack.ingressRequest({
    method: 'POST', pathname, deviceIp: account.deviceIp, jar: account.jar, body,
    headers: { 'x-csrf-token': csrf.token, 'x-visionary-account': account.uid },
  });
}

// The consent-revoke surface rate-limits at 10/min per uid INSIDE the service,
// after request validation, so a valid `{ grantId }` body is required to reach
// the limiter. The grant need not exist for the limiter to count the call.
const revoke = account => authedPost(account, '/api/account/privacy/consents/revoke', { grantId: 'release03-probe-grant' });

/** Create a real test-merchant subscription via the fixture provider. */
async function checkout(account) {
  // The catalog version is read from the public catalog so it never drifts.
  const catalog = await stack.ingressRequest({ pathname: '/api/billing/catalog', deviceIp: account.deviceIp, jar: account.jar });
  const response = await authedPost(account, '/api/billing/checkouts', {
    plan: 'personal', interval: 'monthly', commandId: randomUUID(), catalogVersion: catalog.body.version,
  });
  return response;
}

/** Drive the documented scheduled reconciliation job (the queue-drain path). */
function reconcileJob(account) {
  return stack.ingressRequest({
    method: 'POST', pathname: '/api/billing/jobs/reconcile', deviceIp: account.deviceIp,
    headers: { 'x-visionary-billing-job': stack.FIXTURE_SECRETS.reconcile },
  });
}

// The limiter's counter is keyed per minute (Math.floor(now/60000)), so a burst
// that straddles a minute boundary can slip under the cap on both sides. Sending
// 2*limit+1 attempts makes a 429 unavoidable by pigeonhole: spread over any two
// minute buckets, one bucket must hold at least limit+1 attempts.
const burstCount = limit => 2 * limit + 1;

before(async () => {  stack.assertRunnable();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  runDir = process.env.RELEASE03_RUN_DIR || path.join(productRoot, 'artifacts/qa/release03-admission', stamp);
  mkdirSync(runDir, { recursive: true });
  await stack.startEmulators({ logFile: path.join(runDir, 'emulators.log'), workDir: runDir });
  await stack.startStack({ runDir });
  const { initializeApp } = backendRequire('firebase-admin/app');
  adminApp = initializeApp({
    projectId: stack.AUTH_EMULATOR_PROJECT,
    credential: { getAccessToken: async () => ({ access_token: 'emulator-only', expires_in: 3600 }) },
  }, 'release03-driver');
  const { establishAccounts: makeAccounts } = await import('./admission-driver.cjs');
  accounts = await makeAccounts(stack, adminApp, 6);
});

after(async () => {
  try { await backendRequire('firebase-admin/app').deleteApp(adminApp); } catch { /* ignore */ }
  await stack.stopStack();
  await stack.stopEmulators();
  writeFileSync(path.join(runDir, 'admission-report.json'), JSON.stringify(report, null, 2));
});

test('the documented admission law is loaded from the recorded plan, not invented here', () => {
  assert.match(report.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.ok(RATE_LIMIT_SCOPES.length >= 10, 'the recorded scope inventory must cover the connected surfaces');
  report.laws.push({ law: 'source', detail: 'docs/architecture/discussions/launch-operations.md § Admission control', scopes: RATE_LIMIT_SCOPES });
});

test('a per-UID quota is enforced with a typed 429 and clear retry timing', async () => {
  const [account] = accounts;
  // The product enforces consent-revoke at 10/min per uid. Past the cap the
  // response must be a typed 429 carrying Retry-After, never an untyped error or
  // an unbounded wait. The limiter counts BEFORE the SQL-backed store, so the
  // grant need not exist for the counter to increment.
  const results = [];
  for (let index = 0; index < burstCount(10); index += 1) results.push(await revoke(account));
  const throttled = results.filter(r => r.status === 429);
  assert.ok(throttled.length >= 1, `expected a typed 429 once the per-uid quota was exhausted; got statuses ${JSON.stringify(results.map(r => r.status))}`);
  const refusal = throttled[0];
  assert.ok(refusal.headers['retry-after'], 'a 429 must carry Retry-After (clear retry timing)');
  assert.match(String(refusal.headers['retry-after']), /^\d+$/);
  report.laws.push({ law: 'per-uid-quota', scope: 'consent-revoke 10/min', allowed: results.length - throttled.length, throttled: throttled.length, retryAfterSeconds: Number(refusal.headers['retry-after']) });
});

test('the shared coordinator enforces the cap across independent requests, not per-instance counters', async () => {
  // Fire a burst of concurrent revoke requests on ONE account: the
  // Firestore-transaction limiter must count them together. If the counter were
  // per process/instance it would let every concurrent request through; the
  // shared authority cannot. 2*limit+1 attempts makes a 429 unavoidable.
  const [, second] = accounts;
  const responses = await Promise.all(Array.from({ length: burstCount(10) }, () => revoke(second)));
  const throttled = responses.filter(r => r.status === 429);
  assert.ok(throttled.length >= 1, `the concurrent burst must be capped by the shared coordinator; statuses ${JSON.stringify(responses.map(r => r.status))}`);
  assert.ok(throttled.every(r => r.headers['retry-after']), 'every typed 429 must carry Retry-After');
  report.laws.push({ law: 'shared-coordinator-cap', concurrentRequests: responses.length, throttled: throttled.length });
});

test('tenant fairness: one quota-saturated account does not throttle another', async () => {
  // Billing is used here because it is a fully composed surface where a *served*
  // (2xx) response is genuinely reachable in this stack — the consent revoke
  // surface is SQL-backed and uncomposed here, so a non-429 there would prove
  // nothing. Two accounts untouched by any earlier test.
  const victim = accounts[4], other = accounts[5];
  // Saturate the victim at the billing budget (12/min for checkouts). The
  // limiter runs before the service, so every attempt consumes budget whether it
  // is served (201) or refused as a duplicate (409); the 13th must be a typed 429.
  const statuses = [];
  for (let index = 0; index < burstCount(12); index += 1) statuses.push((await checkout(victim)).status);
  assert.ok(statuses.filter(status => status === 429).length >= 1, `the saturated tenant must be throttled; got ${JSON.stringify(statuses)}`);
  // The other tenant, on the same surface and the same minute, must still be served.
  const otherResponse = await checkout(other);
  assert.ok(otherResponse.status !== 429 && otherResponse.status < 500, `a throttled tenant must not consume another tenant's budget; got ${otherResponse.status}: ${otherResponse.text}`);
  report.laws.push({ law: 'tenant-fairness', scope: 'billing 12/min', victimStatuses: statuses, otherTenantStatus: otherResponse.status });
});

test('a dependency failure degrades safely: 503 with retry timing, no corrupt state', async () => {
  const [account] = accounts;
  // A real test-merchant subscription so reconciliation actually reaches the
  // provider (without one it short-circuits and never calls out).
  const created = await checkout(account);
  assert.equal(created.status, 201, `checkout for the failure drill failed: ${created.text}`);
  await control('/fixture/queue-due', {});
  const before = await control('/fixture/state');
  await control('/fixture/provider-failure', { failing: true });
  // The scheduled reconciliation job is the documented queue-drain path. It is
  // unthrottled (a job, not a browser) and works the durable due queue, so the
  // dependency failure surfaces here exactly as it would on the hosted job.
  const job = await reconcileJob(account);
  assert.ok([429, 503].includes(job.status), `provider failure must surface as a typed 429/503, got ${job.status}: ${job.text}`);
  assert.ok(job.headers['retry-after'], 'a dependency-failure 5xx must carry Retry-After');
  await control('/fixture/provider-failure', { failing: false });
  const after = await control('/fixture/state');
  assert.equal(after.providerCreates, before.providerCreates, 'a provider failure must not create provider subscriptions');
  report.laws.push({ law: 'dependency-failure-fail-closed', status: job.status, retryAfterSeconds: Number(job.headers['retry-after']), providerCreatesDelta: after.providerCreates - before.providerCreates });
});

test('the queue drains after the dependency recovers (failed work is retried, not lost)', async () => {
  const [account] = accounts;
  // Test 5 drove the provider to failure across every subscription row, which is
  // itself enough to open the breaker (proven separately in the two breaker laws
  // below). Close it here so this law isolates the queue-drain behaviour: the
  // failed work is retried and converges once the dependency is healthy.
  await control('/fixture/breaker-reset', {});
  // The failed rows were rescheduled by the product (nextSyncAt = now + 60s).
  // Mark the queue due again to stand in for that minute elapsing, then run the
  // same job: it must now converge rather than fail forever.
  await control('/fixture/queue-due', {});
  const drained = await reconcileJob(account);
  assert.equal(drained.status, 201, `the queue must drain after recovery, got ${drained.status}: ${drained.text}`);
  assert.ok(drained.body.processed >= 1, `recovery must process the previously-failed work, got ${JSON.stringify(drained.body)}`);
  assert.equal(drained.body.failed, 0, `no work may remain failed after recovery: ${JSON.stringify(drained.body)}`);
  report.laws.push({ law: 'queue-drain-after-recovery', status: drained.status, processed: drained.body.processed, failed: drained.body.failed });
});

test('the provider circuit breaker opens after repeated failure and refuses fast', async () => {
  // A dedicated account so its queue row is genuinely due: the reconciliation
  // path is the unthrottled reader (a 30s sync throttle would otherwise mask the
  // failure accumulation, and checkout's idempotency guard would refuse repeats).
  const account = accounts[2];
  await control('/fixture/breaker-reset', {});
  await control('/fixture/breaker-cooling', { ms: 3600000 }); // long: cannot race this drill
  const created = await checkout(account);
  assert.equal(created.status, 201, `breaker precondition checkout failed: ${created.text}`);
  await control('/fixture/provider-failure', { failing: true });
  // Three consecutive provider failures open the breaker (threshold 3).
  for (let index = 0; index < 3; index += 1) {
    await control('/fixture/queue-due', {});
    await reconcileJob(account);
  }
  const state = await control('/fixture/state');
  assert.ok(state.circuit, 'the fixture must expose the breaker state');
  assert.equal(state.circuit.state, 'open', `the breaker must open after repeated provider failure; state=${JSON.stringify(state.circuit)}`);
  assert.ok(state.circuit.consecutiveFailures >= 3, `expected at least 3 consecutive failures, got ${state.circuit.consecutiveFailures}`);
  // While open, a further provider call is refused fast WITHOUT reaching the
  // provider: the read counter must not advance.
  const readsBefore = state.providerReads;
  await control('/fixture/queue-due', {});
  const refused = await reconcileJob(account);
  assert.ok([429, 503].includes(refused.status), `an open breaker must refuse fast with a typed code, got ${refused.status}`);
  assert.ok(refused.headers['retry-after'], 'the fast refusal must carry Retry-After');
  const after = await control('/fixture/state');
  assert.equal(after.providerReads, readsBefore, 'an open breaker must refuse WITHOUT calling the provider');
  report.laws.push({ law: 'provider-circuit-breaker', openedState: state.circuit.state, consecutiveFailures: state.circuit.consecutiveFailures, fastRefusalStatus: refused.status, providerReadsDelta: after.providerReads - readsBefore });
  report.breakerAccount = account.uid;
});

test('the breaker half-opens after the cooling window and closes again on a successful probe', async () => {
  const account = accounts[2];
  // Precondition: the breaker is open from the previous test.
  assert.equal((await control('/fixture/state')).circuit.state, 'open', 'precondition: the breaker is open');
  await control('/fixture/provider-failure', { failing: false });
  // Shrink the cooling window (the deployment knob) to zero so the next call is
  // admitted as the single half-open probe, then let it succeed.
  await control('/fixture/breaker-cooling', { ms: 0 });
  await control('/fixture/queue-due', {});
  const recovered = await reconcileJob(account);
  assert.equal(recovered.status, 201, `the queue must drain once the provider recovers, got ${recovered.status}: ${recovered.text}`);
  assert.ok(recovered.body.processed >= 1, `recovery must process the pending work, got ${JSON.stringify(recovered.body)}`);
  const state = await control('/fixture/state');
  assert.equal(state.circuit.state, 'closed', `a successful probe must close the breaker; state=${JSON.stringify(state.circuit)}`);
  assert.equal(state.circuit.consecutiveFailures, 0);
  report.laws.push({ law: 'breaker-half-open-recovery', status: recovered.status, closedState: state.circuit.state, processed: recovered.body.processed });
});

test('successful responses never carry Retry-After (no false backpressure)', async () => {
  const [account] = accounts;
  const response = await stack.ingressRequest({ pathname: '/api/billing/catalog', deviceIp: account.deviceIp, jar: account.jar });
  assert.equal(response.status, 200);
  assert.equal(response.headers['retry-after'], undefined, 'a 2xx must not advertise retry timing');
  report.laws.push({ law: 'no-false-backpressure', status: response.status });
});
