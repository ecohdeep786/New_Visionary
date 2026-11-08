// RELEASE-02 (KAN-125) realistic load and soak acceptance.
//
// Drives the DOCUMENTED launch baseline (docs/architecture/discussions/
// launch-operations.md, D-075) against the real connected runtime over the
// canonical TLS ingress with the real identity plane, and reports achieved
// percentiles, error rate, typed-overload behaviour and the honest scaling
// arithmetic. It never claims hosted capacity: the loopback host is one
// "worker" of a fleet the blueprint sizes at 2/30 API + 2/60 AI instances, and
// the SQL pool budget is a separate hosted gate.

import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import stack from './load-stack.cjs';
import { documented, coreMix, aiMix, scaledProfiles, baselineProfiles } from './profiles.cjs';
import { summarise, queueAge } from './metrics.cjs';
import { establishAccounts, runArrivals, postWebhook, issue, freshCsrf } from './driver.cjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(here, '../../../..');
const backendRequire = createRequire(path.join(productRoot, 'backend/upstream/backend/package.json'));

let runDir, adminApp, accounts;
const report = { generatedAt: new Date().toISOString(), baseline: documented, profiles: [], notes: [] };

function bodyFor(spec, { account }) {
  const uuid = randomUUID();
  if (spec.command === 'start') return { version: 1, commandId: uuid, workspaceId: `ws-${account.uid}`, conceptId: 'fractions-equivalent', sourceVersion: 'content-v1', criteriaVersion: 'rubric-v1', provider: 'authored-sample', sourceId: 'sample:fractions' };
  if (spec.id === 'feedback-note') return { version: 1, commandId: uuid, surface: 'learn', rating: 'good', comment: '', locale: 'en' };
  return undefined;
}

before(async () => {
  stack.assertRunnable();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  runDir = process.env.RELEASE02_RUN_DIR || path.join(productRoot, 'artifacts/qa/release02-load-soak', stamp);
  mkdirSync(runDir, { recursive: true });
  await stack.startEmulators({ logFile: path.join(runDir, 'emulators.log'), workDir: runDir });
  await stack.startStack({ runDir });

  const { initializeApp } = backendRequire('firebase-admin/app');
  adminApp = initializeApp({
    projectId: stack.AUTH_EMULATOR_PROJECT,
    credential: { getAccessToken: async () => ({ access_token: 'emulator-only', expires_in: 3600 }) },
  }, 'release02-driver');

  accounts = await establishAccounts(stack, adminApp, Number(process.env.RELEASE02_ACCOUNTS || 8));
});

after(async () => {
  try {
    const { deleteApp } = backendRequire('firebase-admin/app');
    await deleteApp(adminApp);
  } catch { /* ignore */ }
  await stack.stopStack();
  await stack.stopEmulators();
  writeFileSync(path.join(runDir, 'load-report.json'), JSON.stringify(report, null, 2));
});

test('the documented baseline is loaded from the recorded plan, not invented here', () => {
  assert.equal(report.baseline.corePerSecond, 150);
  assert.equal(report.baseline.aiRunsPerSecond, 16.7);
  assert.equal(report.baseline.coreBurstPerSecond, 300);
  assert.equal(report.baseline.aiBurstPerSecond, 33.4);
  assert.equal(report.baseline.classEventUsers, 1000);
  assert.match(report.baseline.source, /launch-operations\.md$/);
  const scaled = scaledProfiles(1).map(p => p.id);
  assert.deepEqual(scaled, ['core-sustained', 'core-burst', 'ai-sustained', 'payment-storm', 'class-start']);
});

test('a realistic core request mix is served at the worker rate with acceptable latency', async () => {
  const profile = scaledProfiles(1).find(p => p.id === 'core-sustained');
  const { results } = await runArrivals({ stack, accounts, profile, mix: coreMix, makeBody: bodyFor, seed: 11, maxInFlight: 48 });
  const summary = summarise(profile, results, { acceptedLatencyMs: 500 });
  report.profiles.push(summary);
  assert.equal(summary.buckets.server, 0, `core sustained produced server errors: ${JSON.stringify(summary.buckets)}`);
  assert.equal(summary.buckets.transport, 0, `core sustained produced transport errors: ${JSON.stringify(summary.buckets)}`);
  // Every request is either served or refused by a TYPED control (e.g. the real
  // per-uid feedback admission limit); nothing may be lost.
  const controlled = (summary.buckets.success + summary.buckets.overload + summary.buckets.client) / summary.issued;
  assert.ok(controlled >= 0.999, `core sustained lost requests: ${JSON.stringify(summary.buckets)}`);
  assert.ok(summary.successRate >= 90, `core sustained success rate too low: ${summary.successRate}%`);
  assert.ok(summary.latency.p95 !== null && summary.latency.p95 <= 500, `core sustained p95 over the 500ms objective: ${summary.latency.p95}`);
});

test('the AI-run substitute (durable teaching loop) is served without server errors', async () => {
  const profile = scaledProfiles(1).find(p => p.id === 'ai-sustained');
  const { results } = await runArrivals({ stack, accounts, profile, mix: aiMix, makeBody: bodyFor, seed: 23, maxInFlight: 32 });
  const summary = summarise(profile, results, { acceptedLatencyMs: 1500 });
  report.profiles.push(summary);
  assert.equal(summary.buckets.server, 0, `learning runs produced server errors: ${JSON.stringify(summary.buckets)}`);
  assert.equal(summary.buckets.transport, 0, `learning runs produced transport errors: ${JSON.stringify(summary.buckets)}`);
  const controlled = (summary.buckets.success + summary.buckets.overload + summary.buckets.client) / summary.issued;
  assert.ok(controlled >= 0.999, `learning runs lost requests: ${JSON.stringify(summary.buckets)}`);
  assert.ok(summary.successRate >= 80, `learning-run success rate too low: ${summary.successRate}%`);
});

test('an isolated payment webhook storm is absorbed with the idempotency law intact', async () => {
  const secret = stack.FIXTURE_SECRETS.webhook;
  const total = 60;
  const durationSeconds = 3;                       // paced at 20 deliveries/s
  const intervalMs = (durationSeconds * 1000) / total;
  // Deterministic provider-shaped stream: every event id is delivered TWICE with
  // IDENTICAL bytes (the documented 100k duplicate deliveries/hour). Identical
  // duplicates must be absorbed idempotently; only a same-id/different-bytes
  // delivery is a 409.
  const deliveries = [];
  for (let index = 0; index < total / 2; index += 1) {
    const eventId = `evt_load_${index}`;
    const raw = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: `pay_load_${index}`, amount: 29900 } } } }), 'utf8');
    deliveries.push({ eventId, event: raw }, { eventId, event: raw });
  }
  const results = [];
  const inFlight = new Set();
  const start = Date.now();
  for (let index = 0; index < deliveries.length; index += 1) {
    const wait = start + index * intervalMs - Date.now();
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    const pending = postWebhook(stack, { ...deliveries[index], secret }).then(r => results.push(r));
    inFlight.add(pending); pending.finally(() => inFlight.delete(pending));
    while (inFlight.size >= 16) await Promise.race(inFlight);
  }
  await Promise.all([...inFlight]);
  const summary = summarise({ id: 'payment-storm', label: 'payment webhook storm', kind: 'webhook', arrivalPerSecond: total / durationSeconds, durationSeconds }, results, { acceptedLatencyMs: 2000 });
  report.profiles.push(summary);
  assert.equal(summary.buckets.server, 0, `webhook storm produced server errors: ${JSON.stringify(summary.buckets)}`);
  assert.equal(summary.buckets.transport, 0, `webhook storm produced transport errors: ${JSON.stringify(summary.buckets)}`);
  assert.ok(summary.successRate >= 95, `webhook storm success rate too low: ${summary.successRate}%`);
  assert.ok(summary.latency.p95 !== null && summary.latency.p95 <= 2000, `webhook p95 over the 2s durable-ack objective: ${summary.latency.p95}`);
});

test('synchronized class-start burst degrades only through typed overload, never silent 5xx', async () => {
  const profile = scaledProfiles(1).find(p => p.id === 'class-start');
  const { results } = await runArrivals({ stack, accounts, profile, mix: coreMix, makeBody: bodyFor, seed: 41, maxInFlight: 96 });
  const summary = summarise(profile, results, { acceptedLatencyMs: 500 });
  report.profiles.push(summary);
  assert.equal(summary.buckets.server, 0, `class-start burst produced server errors: ${JSON.stringify(summary.buckets)}`);
  assert.equal(summary.buckets.transport, 0, `class-start burst produced transport errors: ${JSON.stringify(summary.buckets)}`);
  // Under a burst the honest outcomes are success or a TYPED control code.
  const controlled = (summary.buckets.success + summary.buckets.overload + summary.buckets.client) / summary.issued;
  assert.ok(controlled >= 0.999, `class-start burst lost requests: ${JSON.stringify(summary.buckets)}`);
});

test('queue age of an authoritative write is measured, not assumed', async () => {
  // A dedicated account: the real product enforces a 10-notes/hour admission
  // limit per uid, which earlier profiles would otherwise consume.
  const [account] = await establishAccounts(stack, adminApp, 1, { deviceIps: ['203.0.113.250'] });
  const samples = [];
  for (let index = 0; index < 8; index += 1) {
    const started = Date.now();
    const csrf = await freshCsrf(stack, account.jar, account.deviceIp);
    const response = await stack.ingressRequest({
      pathname: '/api/account/feedback', method: 'POST', deviceIp: account.deviceIp, jar: account.jar,
      body: { version: 1, commandId: randomUUID(), surface: 'general', rating: 'good', comment: '', locale: 'en' },
      headers: { 'x-csrf-token': csrf.token, 'x-visionary-account': account.uid },
      agent: stack.LOAD_AGENT,
    });
    assert.equal(response.status, 201, `authoritative write failed: ${response.text}`);
    samples.push(Date.now() - started);
  }
  const age = queueAge(samples);
  report.notes.push({ queueAgeOfAuthoritativeWriteMs: age });
  assert.ok(age.p95 !== null && age.p95 <= 1500, `authoritative write age p95 too high: ${age.p95}`);
  assert.equal(age.count, 8);
});

test('the saturation path refuses with typed overload codes and never a silent 5xx', async () => {
  // Push FAR past the worker rate so the runtime is genuinely saturated. The
  // point is not throughput here — it is the degradation LAW: when the runtime
  // cannot serve a request it must answer with a typed, retryable control code
  // (429/503), never an unhandled 5xx, an empty body or a dropped connection.
  const profile = { id: 'saturation', label: 'saturation burst (>=8x worker rate)', kind: 'core', arrivalPerSecond: 200, durationSeconds: 4 };
  const { results } = await runArrivals({ stack, accounts, profile, mix: coreMix, makeBody: bodyFor, seed: 3, maxInFlight: 256 });
  const summary = summarise(profile, results, { acceptedLatencyMs: 500 });
  report.profiles.push(summary);
  report.saturationLaw = {
    issued: summary.issued, successRate: summary.successRate,
    overloadCodes: summary.overloadCodes, server: summary.buckets.server, transport: summary.buckets.transport,
    verdict: summary.verdict,
  };
  assert.equal(summary.buckets.server, 0, `saturation produced server errors (silent 5xx): ${JSON.stringify(summary.buckets)}`);
  assert.equal(summary.buckets.transport, 0, `saturation dropped connections: ${JSON.stringify(summary.buckets)}`);
  // The LAW is: never a silent 5xx, never a dropped connection, and any refusal
  // is a typed retryable code. Whether the host actually saturates varies with
  // load, so 'ok' (served everything) and 'degraded' (typed refusals) are both
  // correct; only 'failed' (unhandled 5xx / transport loss) is a violation.
  assert.notEqual(summary.verdict, 'failed', `saturation failed rather than degrading: ${JSON.stringify(summary.buckets)}`);
  assert.ok(summary.overloadCodes.every(code => [429, 503].includes(code.status)), `unexpected overload code: ${JSON.stringify(summary.overloadCodes)}`);
  assert.equal(summary.buckets.other, 0, `saturation produced unclassified outcomes: ${JSON.stringify(summary.buckets)}`);
  // Every request reached a terminal, accounted-for outcome.
  const classified = Object.values(summary.buckets).reduce((a, b) => a + b, 0);
  assert.equal(classified, summary.issued);
});

test('a bounded soak holds latency and leaks nothing over a sustained window', async () => {
  // The release matrix calls for a 24h soak. On one host that is not run here;
  // this bounded soak proves stability of the same path (no latency creep, no
  // 5xx, no transport loss) over a shortened window, and the report records the
  // full 24h soak as a hosted gate.
  const seconds = Number(process.env.RELEASE02_SOAK_SECONDS || 20);
  const profile = { id: 'soak-bounded', label: `bounded soak (${seconds}s)`, kind: 'core', arrivalPerSecond: 20, durationSeconds: seconds };
  const { results } = await runArrivals({ stack, accounts, profile, mix: coreMix, makeBody: bodyFor, seed: 97, maxInFlight: 48 });
  const summary = summarise(profile, results, { acceptedLatencyMs: 500 });
  report.profiles.push(summary);
  report.soak = { boundedSeconds: seconds, issued: summary.issued, successRate: summary.successRate, latency: summary.latency,
    note: 'Bounded on this host. Run the recorded 24h soak against the hosted fleet; record DB/pool/quota/cost at each stage (release matrix).' };
  assert.equal(summary.buckets.server, 0, `soak produced server errors: ${JSON.stringify(summary.buckets)}`);
  assert.equal(summary.buckets.transport, 0, `soak produced transport errors: ${JSON.stringify(summary.buckets)}`);
  const controlled = (summary.buckets.success + summary.buckets.overload + summary.buckets.client) / summary.issued;
  assert.ok(controlled >= 0.999, `soak lost requests: ${JSON.stringify(summary.buckets)}`);
  assert.ok(summary.successRate >= 90, `soak success rate too low: ${summary.successRate}%`);
}, { timeout: (Number(process.env.RELEASE02_SOAK_SECONDS || 20) + 60) * 1000 });

test('the baseline-to-worker scaling arithmetic is recorded for the hosted gate', () => {
  const workerCore = scaledProfiles(1).find(p => p.id === 'core-sustained').arrivalPerSecond;
  const workerAi = scaledProfiles(1).find(p => p.id === 'ai-sustained').arrivalPerSecond;
  report.scaling = {
    coreWorkersForBaseline: Math.ceil(documented.corePerSecond / workerCore),
    aiWorkersForBaseline: Math.ceil(documented.aiRunsPerSecond / workerAi),
    note: 'One loopback worker is not a hosted instance; the fleet is sized by the blueprint (2/30 API + 2/60 AI). This arithmetic only shows the baseline is reachable by horizontal scaling, and never certifies hosted capacity.',
  };
  assert.ok(report.scaling.coreWorkersForBaseline >= 1);
});

test('the documented baseline profiles are recorded for the hosted load gate', () => {
  report.hostedGateProfiles = baselineProfiles();
  report.notes.push({ externalGate: 'Run the recorded baseline profiles (150+16.7 sustained 60min, 300/33.4 burst 5min, 24h soak) against the hosted autoscaled fleet and a sized SQL pool; this loopback harness proves the runtime path and degradation law, not hosted capacity.' });
  assert.equal(report.hostedGateProfiles.find(p => p.id === 'core-sustained').durationSeconds, 3600);
});
