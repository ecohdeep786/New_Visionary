/**
 * AI-08 (KAN-90) — reconcile the whole-request teaching deadline and
 * cancellation with provider work; long Build jobs use their own durable
 * protocol; preserve partial/final distinction and disconnect cleanup.
 *
 * Proven here:
 *   1. a completed request is final; a request whose deadline passed at the
 *      provider checkpoint delivers its partial honestly (final: false,
 *      reason: deadline, provider work stopped),
 *   2. cancellation stops provider work and any partial stays partial,
 *   3. a provider finishing AFTER the deadline delivers partial, never final,
 *   4. disconnect cleanup: work stopped, partial not presented as final,
 *      honest disconnected reason,
 *   5. long Build jobs are refused the teaching deadline (durable protocol),
 *   6. terminated requests accept no further transitions; wrong users denied.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { DeadlineReconciliationService } = req('./dist/src/deadline/deadline-service.js');
const { InMemoryDeadlineStore } = req('./dist/src/deadline/deadline-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };

async function makeService(deadlineInMs = 10_000) {
  const store = new InMemoryDeadlineStore();
  const svc = new DeadlineReconciliationService(store, () => Date.now());
  const requestId = await svc.begin(OWNER, Date.now() + deadlineInMs);
  return { store, svc, requestId };
}

// ---------------------------------------------------------------------------

test('a completed request is FINAL (reason completed); the deadline passing at a checkpoint delivers the partial honestly', async () => {
  const { svc, requestId } = await makeService(10_000);
  await svc.recordPartial(requestId, OWNER, { answer: 'half-written explanation' });

  // Still within deadline: no termination.
  const early = await svc.onProviderCheckpoint(requestId, OWNER, true);
  assert.equal(early, null, 'within the deadline the request continues');

  const completed = await svc.complete(requestId, OWNER, { answer: 'full explanation' });
  assert.equal(completed.final, true);
  assert.equal(completed.reason, 'completed');
  assert.equal(completed.partialBody, null, 'the final body replaces any partial');
});

test('the deadline passing at a provider checkpoint delivers the PARTIAL, stops provider work', async () => {
  const { svc, requestId } = await makeService(-1); // deadline already passed
  await svc.recordPartial(requestId, OWNER, { answer: 'partial explanation' });

  const outcome = await svc.onProviderCheckpoint(requestId, OWNER, true);
  assert.ok(outcome, 'deadline hit terminates the request');
  assert.equal(outcome.final, false, 'the partial is NEVER presented as final');
  assert.equal(outcome.reason, 'deadline');
  assert.deepEqual(outcome.partialBody, { answer: 'partial explanation' });
  assert.equal(outcome.providerWorkStopped, true, 'provider work stops at the checkpoint');

  // A terminated request accepts no further transitions.
  await assert.rejects(() => svc.cancel(requestId, OWNER, true), (e) => e.code === 'already_terminated');
});

test('cancellation stops provider work; any partial stays partial', async () => {
  const { svc, requestId } = await makeService();
  await svc.recordPartial(requestId, OWNER, { answer: 'so far' });
  const cancelled = await svc.cancel(requestId, OWNER, true);
  assert.equal(cancelled.final, false);
  assert.equal(cancelled.reason, 'cancelled');
  assert.deepEqual(cancelled.partialBody, { answer: 'so far' });
  assert.equal(cancelled.providerWorkStopped, true);
});

test('a provider finishing AFTER the deadline delivers partial, never final', async () => {
  const { svc, requestId } = await makeService(-1); // deadline already passed
  const outcome = await svc.complete(requestId, OWNER, { answer: 'late full answer' });
  assert.equal(outcome.final, false, 'late completion is delivered as partial');
  assert.equal(outcome.reason, 'deadline');
  assert.deepEqual(outcome.partialBody, { answer: 'late full answer' });
});

test('disconnect cleanup: provider work stopped, partial not presented as final, honest reason', async () => {
  const { svc, requestId } = await makeService();
  await svc.recordPartial(requestId, OWNER, { answer: 'in-flight' });
  const outcome = await svc.onDisconnect(requestId, OWNER, true);
  assert.equal(outcome.final, false);
  assert.equal(outcome.reason, 'disconnected');
  assert.equal(outcome.providerWorkStopped, true, 'no orphaned provider work');
  assert.deepEqual(outcome.partialBody, { answer: 'in-flight' });
});

test('long Build jobs are refused the teaching deadline (they use the durable protocol); wrong users denied', async () => {
  const { store, svc } = await makeService();
  store.registerDurableRun('run_long_build');
  await assert.rejects(
    () => svc.beginForLongJob(OWNER, 'run_long_build'),
    (e) => e.code === 'long_job_requires_durable_protocol',
    'long jobs ride the durable run protocol, not the whole-request deadline',
  );
  // Even an unknown job id is refused the teaching deadline protocol.
  await assert.rejects(() => svc.beginForLongJob(OWNER, 'run_unknown'), (e) => e.code === 'long_job_requires_durable_protocol');

  const { requestId } = await makeService();
  await assert.rejects(() => svc.cancel(requestId, OTHER, true), (e) => e.code === 'not_owner');
  await assert.rejects(() => svc.complete('req_ghost', OWNER, {}), (e) => e.code === 'unknown_request');
});
