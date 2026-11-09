// ACCEPT-01 (KAN-117) connected journey rehearsal.
//
// Exercises the RELEASED journey chain end to end over the real production
// composition (configureProductionHttp) on the canonical loopback origin with
// the authorized local identity plane (Firebase Auth + Firestore emulators) and
// a REAL SQL-backed personal-workspace provisioning target:
//
//   public pricing → auth/verification → onboarding → Free profile →
//   test subscription → invoice → learning → project → second-device resume,
//
// plus the failure states the acceptance names: wrong-user denials on
// owner-scoped reads, duplicate checkout refusal, stale-revision conflict and
// cancellation behaviour.
//
// What stays a hosted gate is recorded in
// docs/architecture/delivery/ACCEPT01_JOURNEY_REHEARSAL.md: the same walk on
// the hosted system with real adapters/staging data is the ACCEPT-01 exit; this
// rehearsal proves the connected product behaviour locally and never claims
// hosted acceptance.

import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import stack from './journey-stack.cjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(here, '../../../..');
const backendRequire = createRequire(path.join(productRoot, 'backend/upstream/backend/package.json'));

let runDir, adminApp, env, accounts;
const report = { generatedAt: new Date().toISOString(), journey: [], failures: [] };

const PASS = 'accept01-journey-Pass1';

/** Create one verified emulator identity and sign it in through the product. */
async function establish(label, { deviceIp }) {
  const { getAuth } = backendRequire('firebase-admin/auth');
  const email = `accept01-${randomUUID()}@example.invalid`;
  await getAuth(adminApp).createUser({ email, password: PASS, emailVerified: true });
  const jar = stack.cookieJar();
  const csrf = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp });
  jar.capture(csrf);
  const signIn = await fetch(`http://127.0.0.1:${stack.PORTS.auth}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASS, returnSecureToken: true }),
  });
  assert.equal(signIn.status, 200, 'the emulator sign-in must succeed');
  const { idToken } = await signIn.json();
  const session = await stack.ingressRequest({
    pathname: '/api/auth/session', method: 'POST', deviceIp, jar,
    body: { idToken }, headers: { 'x-csrf-token': csrf.body.token },
  });
  assert.equal(session.status, 201, `the product session must start: ${session.text}`);
  jar.capture(session);
  return { label, email, uid: session.body.id, jar, deviceIp };
}

async function freshCsrf(account) {
  const response = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp: account.deviceIp, jar: account.jar });
  account.jar.capture(response);
  return response.body;
}

/** Fixture control-plane call (the /fixture/* endpoints live on the control
 * server, NOT the product ingress — they are test-only knobs for the fictional
 * provider and are never shipped). */
async function control(pathname, body) {
  const response = await fetch(`http://127.0.0.1:${stack.PORTS.control}${pathname}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}),
  });
  return response.json();
}

/** Sign an ALREADY-CREATED emulator identity in on a fresh device jar. */
async function signInExisting(label, { email, deviceIp }) {
  const jar = stack.cookieJar();
  const csrf = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp });
  jar.capture(csrf);
  const signIn = await fetch(`http://127.0.0.1:${stack.PORTS.auth}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASS, returnSecureToken: true }),
  });
  assert.equal(signIn.status, 200, 'the emulator sign-in must succeed');
  const { idToken } = await signIn.json();
  const session = await stack.ingressRequest({
    pathname: '/api/auth/session', method: 'POST', deviceIp, jar,
    body: { idToken }, headers: { 'x-csrf-token': csrf.body.token },
  });
  assert.equal(session.status, 201, `the product session must start: ${session.text}`);
  jar.capture(session);
  return { email, uid: session.body.id, jar, deviceIp };
}

async function authedPost(account, pathname, body) {
  const csrf = await freshCsrf(account);
  return stack.ingressRequest({
    method: 'POST', pathname, deviceIp: account.deviceIp, jar: account.jar, body,
    headers: { 'x-csrf-token': csrf.token, 'x-visionary-account': account.uid },
  });
}

async function authedGet(account, pathname) {
  return stack.ingressRequest({ pathname, deviceIp: account.deviceIp, jar: account.jar, headers: { 'x-visionary-account': account.uid } });
}

before(async () => {
  stack.assertRunnable();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  runDir = process.env.ACC01_RUN_DIR || path.join(productRoot, 'artifacts/qa/accept01-journey', stamp);
  mkdirSync(runDir, { recursive: true });
  await stack.startEmulators({ logFile: path.join(runDir, 'emulators.log'), workDir: runDir });
  // The "project" step provisions a REAL SQL-backed workspace through the
  // product's synthetic local mode against a disposable staging schema (the
  // data-02 fixture lineage). Without DATA_TEST_DATABASE_URL the stack starts
  // with provisioning disabled and the journey proves its typed 503 instead —
  // both are honest outcomes; the runner requires the database so the full
  // journey is the default.
  if (process.env.DATA_TEST_DATABASE_URL) {
    const fixture = await import('../data-02/postgres-fixture.cjs');
    const { MigrationRunner } = backendRequire('./dist/src/data/migration-runner.js');
    const { canonicalMigrations } = backendRequire('./dist/src/data/migration-registry.js');
    env = await fixture.stagingDatabase();
    await new MigrationRunner(env.store(), canonicalMigrations(fixture.backend)).applyAll();
    await env.grantRuntime();
  }
  // The product's PersonalWorkspaceService enforces bounded connection params
  // on the synthetic SQL target (connection_limit<=3, pool_timeout/connect_timeout
  // within 1..15). The staging URL only carries schema+connection_limit, so add
  // the explicit pool/connect timeouts the product requires before handing it
  // to the real service.
  const workspace = env ? {
    runtimeUrl: (() => { const u = new URL(env.config.runtimeUrl); u.searchParams.set('pool_timeout', '15'); u.searchParams.set('connect_timeout', '15'); return String(u); })(),
    role: env.runtimeRole, schema: env.schema,
  } : null;
  await stack.startStack({ runDir, workspace });
  const { initializeApp } = backendRequire('firebase-admin/app');
  adminApp = initializeApp({
    projectId: stack.AUTH_EMULATOR_PROJECT,
    credential: { getAccessToken: async () => ({ access_token: 'emulator-only', expires_in: 3600 }) },
  }, 'accept01-journey-driver');
  accounts = {
    learner: await establish('learner', { deviceIp: '203.0.113.10' }),
    secondDevice: null,
    stranger: await establish('stranger', { deviceIp: '203.0.113.11' }),
  };
});

after(async () => {
  try { await backendRequire('firebase-admin/app').deleteApp(adminApp); } catch { /* ignore */ }
  await stack.stopStack();
  await stack.stopEmulators();
  if (env) await env.close();
  writeFileSync(path.join(runDir, 'journey-report.json'), JSON.stringify(report, null, 2));
});

test('public pricing is reachable without any session and reports the test catalog', async () => {
  const response = await stack.ingressRequest({ pathname: '/api/billing/catalog', deviceIp: '203.0.113.10' });
  assert.equal(response.status, 200);
  assert.equal(response.body.mode, 'test');
  assert.ok(Array.isArray(response.body.plans) && response.body.plans.length >= 2, 'the public catalog lists the plans');
  report.journey.push({ step: 'public-pricing', status: response.status, mode: response.body.mode });
});

test('auth/verification starts a real session with HttpOnly cookies on the canonical origin', async () => {
  const account = accounts.learner;
  const me = await authedGet(account, '/api/auth/me');
  assert.equal(me.status, 200, `the session must resolve the account: ${me.text}`);
  assert.equal(me.body.id, account.uid, 'the profile identifies the same account');
  const cookies = account.jar.header();
  assert.match(cookies, /__Host-|HttpOnly/i, 'the session must be cookie-bound');
  report.journey.push({ step: 'auth-verification', uid: account.uid });
});

test('onboarding completes the bounded role profile', async () => {
  const account = accounts.learner;
  const response = await authedPost(account, '/api/auth/onboarding', {
    identity: 'professional', age_band: 'adult', full_name: 'Journey Learner', preferred_language: 'English',
  });
  assert.equal(response.status, 201, `onboarding must complete: ${response.text}`);
  const me = await authedGet(account, '/api/auth/me');
  assert.equal(me.body.onboarding_complete, true, 'the profile reports onboarding complete');
  report.journey.push({ step: 'onboarding', status: response.status });
});

test('the Free profile exists under the verified account before any purchase', async () => {
  const account = accounts.learner;
  const response = await authedGet(account, '/api/billing/account');
  assert.equal(response.status, 200, `the billing account must exist: ${response.text}`);
  assert.equal(response.body.plan, 'start', 'a fresh account is on the Free plan');
  assert.equal(response.body.entitlement?.source, 'free');
  assert.equal(response.body.subscription, null);
  report.journey.push({ step: 'free-profile', plan: response.body.plan });
});

test('the test subscription is created, completed and synced to a paid period', async () => {
  const account = accounts.learner;
  const catalog = await stack.ingressRequest({ pathname: '/api/billing/catalog', deviceIp: account.deviceIp, jar: account.jar });
  const checkout = await authedPost(account, '/api/billing/checkouts', {
    plan: 'personal', interval: 'monthly', commandId: randomUUID(), catalogVersion: catalog.body.version,
  });
  assert.equal(checkout.status, 201, `checkout must start: ${checkout.text}`);
  assert.ok(checkout.body.attemptId && checkout.body.subscriptionId, 'the checkout view names the attempt and subscription');
  // The fictional provider completes the payment and signs the callback the
  // way the hosted provider page would (control plane, not the product ingress).
  const complete = await control('/fixture/complete-payment', { subscriptionId: checkout.body.subscriptionId });
  assert.ok(complete.razorpay_subscription_id, `fixture completion must succeed: ${JSON.stringify(complete)}`);
  const verify = await authedPost(account, '/api/billing/verify', {
    attemptId: checkout.body.attemptId,
    razorpay_payment_id: complete.razorpay_payment_id,
    razorpay_subscription_id: complete.razorpay_subscription_id,
    razorpay_signature: complete.razorpay_signature,
  });
  assert.equal(verify.status, 201, `verification must sync: ${verify.text}`);
  assert.equal(verify.body.subscription?.status, 'active', 'the synced subscription is active');
  assert.ok(verify.body.subscription?.paidThrough, 'the paid period is recorded');
  report.journey.push({ step: 'test-subscription', subscriptionId: checkout.body.subscriptionId, status: verify.body.subscription.status });
});

test('the invoice is recorded and owner-readable', async () => {
  const account = accounts.learner;
  const listing = await authedGet(account, '/api/account/invoices');
  assert.equal(listing.status, 200, `the account invoice listing must exist: ${listing.text}`);
  const rows = listing.body.items || listing.body.invoices || [];
  assert.ok(rows.length >= 1, 'the paid subscription recorded an invoice');
  const id = rows[0].id;
  const own = await authedGet(account, `/api/billing/invoices/${id}`);
  assert.equal(own.status, 200, `the owner reads the invoice: ${own.text}`);
  assert.equal(own.body.id, id);
  assert.equal(own.body.uid, account.uid);
  report.journey.push({ step: 'invoice', invoiceId: id });
});

test('the durable learning loop starts, presents a check and assesses it', async () => {
  const account = accounts.learner;
  const start = await authedPost(account, '/api/account/learning/sessions', {
    version: 1, commandId: randomUUID(), workspaceId: 'accept01-journey-ws', conceptId: 'concept-photosynthesis',
    sourceVersion: 'source-2026-11', criteriaVersion: 'criteria-v1', provider: 'fixture', sourceId: 'fixture-source',
  });
  assert.equal(start.status, 201, `the learning session must start: ${start.text}`);
  const sessionId = start.body.sessionId;
  assert.ok(sessionId, 'the session reference is returned');
  const present = await authedPost(account, `/api/account/learning/sessions/${sessionId}/checks`, {
    version: 1, commandId: randomUUID(), expectedRevision: start.body.revision ?? 0,
    workspaceId: 'accept01-journey-ws', sourceVersion: 'source-2026-11', criteriaVersion: 'criteria-v1',
    strategy: 'socratic', validation: 'passed', checkId: 'check-1',
    prompt: 'What do plants use light for?', options: ['Making food', 'Cooling leaves'], answerIndex: 0,
  });
  assert.equal(present.status, 201, `the check must present: ${present.text}`);
  const revision = present.body.revision ?? start.body.revision ?? 0;
  const assess = await authedPost(account, `/api/account/learning/sessions/${sessionId}/assessments`, {
    version: 1, commandId: randomUUID(), expectedRevision: revision,
    workspaceId: 'accept01-journey-ws', sourceVersion: 'source-2026-11', criteriaVersion: 'criteria-v1',
    checkId: 'check-1', selection: 0,
  });
  assert.equal(assess.status, 201, `the server must assess: ${assess.text}`);
  report.journey.push({ step: 'learning', sessionId, phase: assess.body.phase || assess.body.loop?.phase || 'assessed' });
});

test('the project step provisions a REAL SQL-backed personal workspace and replays idempotently', async () => {
  const account = accounts.learner;
  if (!env) {
    // Without a staging SQL target the product must refuse with a typed 503,
    // never a fabricated success.
    const refused = await authedPost(account, '/api/account/workspace/provision', { commandId: randomUUID(), payload: { source: 'manual' } });
    assert.equal(refused.status, 503, 'disabled provisioning refuses with a typed 503');
    report.journey.push({ step: 'project', mode: 'disabled-503' });
    return;
  }
  const commandId = randomUUID();
  const provision = await authedPost(account, '/api/account/workspace/provision', { commandId, payload: { source: 'manual' } });
  assert.equal(provision.status, 201, `the workspace must provision: ${provision.text}`);
  assert.ok(provision.body.personalWorkspaceId, 'the provisioned workspace has an id');
  const replay = await authedPost(account, '/api/account/workspace/provision', { commandId, payload: { source: 'manual' } });
  assert.equal(replay.status, 201, 'the same command replays');
  assert.equal(replay.body.replay, true, 'the replay is acknowledged as a replay');
  assert.equal(replay.body.personalWorkspaceId, provision.body.personalWorkspaceId, 'the replay returns the same workspace');
  report.journey.push({ step: 'project', workspaceId: provision.body.personalWorkspaceId, replay: true });
});

test('a second device signs in on the same account and resumes the same state', async () => {
  const account = accounts.learner;
  const device = await signInExisting('second-device', { email: account.email, deviceIp: '203.0.113.12' });
  assert.equal(device.uid, account.uid, 'the second device resolves the SAME account');
  const billing = await authedGet(device, '/api/billing/account');
  assert.equal(billing.status, 200);
  assert.equal(billing.body.subscription?.status, 'active', 'the subscription is visible from the second device');
  const listing = await authedGet(device, '/api/account/invoices');
  assert.equal(listing.status, 200, 'the invoice history is visible from the second device');
  accounts.secondDevice = device;
  report.journey.push({ step: 'second-device-resume', uid: account.uid, subscriptionVisible: true });
});

test('wrong-user: a stranger cannot read another account\'s invoice or learning session', async () => {
  const stranger = accounts.stranger, learner = accounts.learner;
  const listing = await authedGet(learner, '/api/account/invoices');
  const rows = listing.body.items || listing.body.invoices || [];
  const invoiceId = rows[0].id;
  const foreignInvoice = await authedGet(stranger, `/api/billing/invoices/${invoiceId}`);
  assert.equal(foreignInvoice.status, 404, 'a stranger cannot read another account\'s invoice');
  const sessions = await authedGet(learner, '/api/account/learning/sessions');
  const sessionId = (sessions.body.items || [])[0]?.sessionId;
  assert.ok(sessionId, 'the learner has a learning session to protect');
  const foreignSession = await authedGet(stranger, `/api/account/learning/sessions/${sessionId}`);
  assert.equal(foreignSession.status, 404, 'a stranger cannot read another account\'s learning session');
  report.failures.push({ failure: 'wrong-user', invoice: 404, learning: 404 });
});

test('failure states: duplicate checkout is refused, stale revision conflicts, cancellation is revision-bound', async () => {
  const account = accounts.learner;
  const catalog = await stack.ingressRequest({ pathname: '/api/billing/catalog', deviceIp: account.deviceIp, jar: account.jar });
  const duplicate = await authedPost(account, '/api/billing/checkouts', {
    plan: 'family', interval: 'annual', commandId: randomUUID(), catalogVersion: catalog.body.version,
  });
  assert.equal(duplicate.status, 409, 'an active subscription refuses another checkout');
  const accountView = await authedGet(account, '/api/billing/account');
  const revision = accountView.body.revision;
  const stale = await authedPost(account, '/api/billing/cancel', { subscriptionId: accountView.body.subscription.id, revision: revision + 1000 });
  assert.equal(stale.status, 409, 'a stale revision cannot cancel');
  const cancel = await authedPost(account, '/api/billing/cancel', { subscriptionId: accountView.body.subscription.id, revision });
  assert.equal(cancel.status, 201, `cancellation succeeds on the current revision: ${cancel.text}`);
  assert.equal(cancel.body.subscription?.cancelAtPeriodEnd, true, 'the cancellation is recorded at period end');
  assert.equal(cancel.body.plan, 'personal', 'paid access is retained through the paid period');
  report.failures.push({ failure: 'duplicate-checkout-409', staleRevision: 409, cancelAtPeriodEnd: true });
});
