/**
 * PLAT-07 (KAN-51) — redacted traces/metrics, synthetic health checks and
 * bounded dashboards:
 *   - FAIL-CLOSED redaction: prompt bodies, payment secrets/tokens and raw
 *     private learning text refuse the WHOLE record (no silent drops);
 *   - approved policy required; unapproved/unknown refuses;
 *   - bounded vocabulary: declared levels/events only;
 *   - health checks degrade automatically over their declared budget;
 *   - dashboards are operator-scoped and derive bounded p50/p95/error/queue/
 *     cost metrics with the stream digest (tamper-evident);
 *   - command dedup: replayed emits/health checks converge; changed payload
 *     refuses.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));
const { ObservabilityService } = req('./dist/src/observability/observability-service.js');
const { InMemoryObservabilityStore } = req('./dist/src/observability/observability-lookups.js');

const OPERATOR = { uid: 'uid_operator', role: 'operator' };
const LEARNER = { uid: 'uid_learner', role: 'learner' };

const POLICY = {
  policyId: 'redaction_v1',
  version: 1,
  deniedKeyPatterns: ['prompt', 'body', 'payment', 'secret', 'token', 'answer', 'self_review', 'learner_text', 'criterion'],
  deniedValuePatterns: ['sk-live-', '-----begin', 'private_learner_text:'],
};

async function makeService() {
  const store = new InMemoryObservabilityStore();
  store.seedOperator(OPERATOR.uid);
  const service = new ObservabilityService(store);
  await service.definePolicy(POLICY, 'approver_privacy_board');
  return { store, service };
}

const safeRecord = {
  level: 'info',
  event: 'http_request',
  fields: { route: '/api/auth/me', status: 200, latencyMs: 12 },
  latencyMs: 12,
};

// ---------------------------------------------------------------------------

test('FAIL-CLOSED redaction: prompt bodies, payment secrets and raw private learning text refuse the WHOLE record', async () => {
  const { store, service } = await makeService();
  // Prompt body in a field key.
  await assert.rejects(
    () => service.emit('redaction_v1', 1, 'cmd-1', { ...safeRecord, fields: { prompt: 'full learner prompt text' } }),
    (e) => e.code === 'redacted_field_forbidden',
  );
  // Payment token in a field key.
  await assert.rejects(
    () => service.emit('redaction_v1', 1, 'cmd-2', { ...safeRecord, fields: { payment_token: 'tok_x' } }),
    (e) => e.code === 'redacted_field_forbidden',
  );
  // Raw private learning text in a SAFE key's VALUE.
  await assert.rejects(
    () => service.emit('redaction_v1', 1, 'cmd-3', { ...safeRecord, fields: { detail: 'private_learner_text: my struggle with fractions' } }),
    (e) => e.code === 'redacted_field_forbidden',
  );
  // Payment secret VALUE hiding under a safe-looking key.
  await assert.rejects(
    () => service.emit('redaction_v1', 1, 'cmd-4', { ...safeRecord, fields: { detail: 'sk-live-abc123' } }),
    (e) => e.code === 'redacted_field_forbidden',
  );
  // Nothing entered the stream — redaction is refusal, never a silent drop.
  assert.equal(await store.logCount(), 0);
});

test('POLICY GATE: unapproved policy refuses emission; unknown policy refuses', async () => {
  const store = new InMemoryObservabilityStore();
  store.seedOperator(OPERATOR.uid);
  const service = new ObservabilityService(store);
  // Unknown policy.
  await assert.rejects(
    () => service.emit('redaction_v1', 1, 'cmd-1', safeRecord),
    (e) => e.code === 'policy_unknown',
  );
  // Defined but unapproved (empty approver).
  await assert.rejects(
    () => service.definePolicy(POLICY, '  '),
    (e) => e.code === 'policy_not_approved',
  );
});

test('SAFE records emit; bounded vocabulary enforces declared levels/events', async () => {
  const { service } = await makeService();
  const rec = await service.emit('redaction_v1', 1, 'cmd-1', safeRecord);
  assert.equal(rec.level, 'info');
  assert.equal(rec.event, 'http_request');
  await assert.rejects(
    () => service.emit('redaction_v1', 1, 'cmd-2', { ...safeRecord, level: 'verbose' }),
    (e) => e.code === 'log_invalid',
  );
  await assert.rejects(
    () => service.emit('redaction_v1', 1, 'cmd-3', { ...safeRecord, event: 'database_dump' }),
    (e) => e.code === 'log_invalid',
  );
});

test('HEALTH CHECKS: within budget healthy, over budget auto-degrades with the reason recorded', async () => {
  const { service } = await makeService();
  const healthy = await service.runHealthCheck(OPERATOR, 'hcmd-1', 'check_db', 500, 120);
  assert.equal(healthy.status, 'healthy');
  const degraded = await service.runHealthCheck(OPERATOR, 'hcmd-2', 'check_api', 200, 950);
  assert.equal(degraded.status, 'degraded');
  assert.equal(degraded.latencyMs, 950);
  assert.equal(degraded.budgetMs, 200);
  // Invalid checks refuse.
  await assert.rejects(
    () => service.runHealthCheck(OPERATOR, 'hcmd-3', 'check_x', 0, 10),
    (e) => e.code === 'check_invalid',
  );
  await assert.rejects(
    () => service.runHealthCheck(OPERATOR, 'hcmd-4', 'check_x', 500, -5),
    (e) => e.code === 'check_invalid',
  );
});

test('OPERATOR-SCOPED READS: product actors are refused uniformly (no leak)', async () => {
  const { service } = await makeService();
  await service.runHealthCheck(OPERATOR, 'hcmd-1', 'check_db', 500, 120);
  await assert.rejects(() => service.readHealth(LEARNER, 'check_db'), (e) => e.code === 'not_operator');
  await assert.rejects(
    () => service.dashboard(LEARNER, { maxErrorRate: 1, maxQueueDepth: 100, maxCostUsd: 100 }),
    (e) => e.code === 'not_operator',
  );
  await assert.rejects(() => service.runHealthCheck(LEARNER, 'hcmd-2', 'check_x', 500, 10), (e) => e.code === 'not_operator');
});

test('BOUNDED DASHBOARD: p50/p95/error-rate/queue/cost derived from the cleared stream, tamper-evident digest', async () => {
  const { service } = await makeService();
  await service.emit('redaction_v1', 1, 'cmd-1', { level: 'info', event: 'http_request', fields: { route: '/a' }, latencyMs: 100 });
  await service.emit('redaction_v1', 1, 'cmd-2', { level: 'info', event: 'http_request', fields: { route: '/b' }, latencyMs: 200 });
  await service.emit('redaction_v1', 1, 'cmd-3', { level: 'error', event: 'command_denied', fields: { route: '/c' }, latencyMs: 50 });
  await service.emit('redaction_v1', 1, 'cmd-4', { level: 'info', event: 'job_enqueued', fields: { job: 'j1' } });
  await service.emit('redaction_v1', 1, 'cmd-5', { level: 'info', event: 'job_completed', fields: { job: 'j1' } });
  const d1 = await service.dashboard(OPERATOR, { maxErrorRate: 1, maxQueueDepth: 100, maxCostUsd: 100 });
  const d2 = await service.dashboard(OPERATOR, { maxErrorRate: 1, maxQueueDepth: 100, maxCostUsd: 100 });
  assert.equal(d1.windowRecords, 5);
  assert.equal(d1.errorRate, 0.2); // 1 error of 5
  assert.equal(d1.queueDepth, 0);
  assert.equal(d1.p50LatencyMs, 100);
  assert.equal(d1.digest, d2.digest); // byte-stable for the same prefix
  // Out-of-bounds metrics refuse.
  await assert.rejects(
    () => service.dashboard(OPERATOR, { maxErrorRate: 0.1, maxQueueDepth: 100, maxCostUsd: 100 }),
    (e) => e.code === 'metric_out_of_bounds',
  );
});

test('COMMAND DEDUP: replayed emit/health converge to the original record; changed payload refuses', async () => {
  const { service } = await makeService();
  const first = await service.emit('redaction_v1', 1, 'dedup-1', safeRecord);
  const replay = await service.emit('redaction_v1', 1, 'dedup-1', safeRecord);
  assert.equal(replay.logId, first.logId);
  await assert.rejects(
    () => service.emit('redaction_v1', 1, 'dedup-1', { ...safeRecord, fields: { route: '/changed' } }),
    (e) => e.code === 'log_invalid',
  );
  const h1 = await service.runHealthCheck(OPERATOR, 'hdedup-1', 'check_db', 500, 100);
  const h1replay = await service.runHealthCheck(OPERATOR, 'hdedup-1', 'check_db', 500, 100);
  assert.equal(h1replay.at, h1.at);
});
