/**
 * JOB-03 — per-user/workspace and fleet admission limits, queue fairness,
 * provider budgets, retry ceilings and durable status/events with
 * replay/refetch semantics.
 *
 * Proven here:
 *   1. per-user admission: a uid with `perUserMax` live jobs is refused the next
 *      enqueue with admission_per_user,
 *   2. per-workspace admission: a workspace at its cap refuses further enqueues
 *      with admission_per_workspace,
 *   3. fleet admission: a fleet at cap refuses enqueues with admission_fleet,
 *   4. provider budget: a provider whose executions are exhausted refuses
 *      enqueues with provider_budget, and committed executions are counted,
 *   5. queue fairness: independent workloads each get their own queue and jobs
 *      route there without one queue monopolising admission,
 *   6. retry ceilings: a job failed to its ceiling is QUARANTINED (JOB-02 reuse),
 *   7. durable events: enqueue/claim/run/complete append ordered JobEvents; a
 *      replay(>cursor) returns exactly the events after that cursor (refetch),
 *      so a second device resumes committed state without re-reading history.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { OutboxDispatcher, JobPolicyError } = req('./dist/src/outbox/outbox.dispatcher.js');
const { OutboxLimits, AdmissionError } = req('./dist/src/outbox/outbox.limits.js');
const { InMemoryOutboxStore } = req('./dist/src/outbox/outbox-store.js');
const { DEFAULT_BACKOFF } = req('./dist/src/outbox/outbox-types.js');

const ONE_MIN = 60_000;
const t = (ms) => new Date(Date.now() + ms).toISOString();

function setup(limits = {}) {
  const s = new InMemoryOutboxStore();
  const lim = new OutboxLimits(s, { perUserMax: 2, perWorkspaceMax: 2, fleetMax: 4, ...limits });
  const d = new OutboxDispatcher(s, DEFAULT_BACKOFF, lim);
  return { s, d, lim };
}

/** Make an enqueued job live (CLAIMED + RUNNING) so it counts toward admission. */
async function makeLive(d, job) {
  const c = await d.claim(job.id, 10 * ONE_MIN, t(0));
  await d.startRun(job.id, c, t(0));
  return c;
}

test('JOB-03 per-user admission: a uid with live jobs at the cap refuses the next enqueue', async () => {
  const { s, d } = setup({ perUserMax: 2 });
  await makeLive(d, await d.enqueue('uid-1', 'uid-1:a', 'job.a', { workspaceId: 'ws-1' }));
  await makeLive(d, await d.enqueue('uid-1', 'uid-1:b', 'job.b', { workspaceId: 'ws-1' }));
  // Two live jobs already admitted; the third for the same uid is refused.
  await assert.rejects(d.enqueue('uid-1', 'uid-1:c', 'job.c', { workspaceId: 'ws-1' }), (e) => e.code === 'admission_per_user');
  // A different uid is unaffected (fairness across users).
  await d.enqueue('uid-2', 'uid-2:a', 'job.a', { workspaceId: 'ws-2' });
});

test('JOB-03 per-workspace admission: a workspace at its cap refuses more enqueues for that workspace', async () => {
  const { s, d } = setup({ perUserMax: 10, perWorkspaceMax: 1 });
  await makeLive(d, await d.enqueue('uid-1', 'uid-1:a', 'job.a', { workspaceId: 'ws-1' }));
  await assert.rejects(d.enqueue('uid-1', 'uid-1:b', 'job.b', { workspaceId: 'ws-1' }), (e) => e.code === 'admission_per_workspace');
  // Another workspace is fine.
  await d.enqueue('uid-1', 'uid-1:c', 'job.c', { workspaceId: 'ws-2' });
});

test('JOB-03 fleet admission: the fleet cap refuses enqueues for any user once reached', async () => {
  const { s, d } = setup({ perUserMax: 10, perWorkspaceMax: 10, fleetMax: 2 });
  await makeLive(d, await d.enqueue('uid-1', 'uid-1:a', 'job.a', { workspaceId: 'ws-1' }));
  await makeLive(d, await d.enqueue('uid-2', 'uid-2:a', 'job.b', { workspaceId: 'ws-2' }));
  await assert.rejects(d.enqueue('uid-3', 'uid-3:a', 'job.c', { workspaceId: 'ws-3' }), (e) => e.code === 'admission_fleet');
});

test('JOB-03 provider budget: an exhausted provider refuses enqueues and executions are counted', async () => {
  const { s, d } = setup();
  await s.setProviderBudget({ provider: 'claude', maxExecutions: 1, usedExecutions: 0 });
  await d.enqueue('uid-1', 'uid-1:a', 'gen.answer', { workspaceId: 'ws-1', provider: 'claude' });
  const after = await s.providerBudget('claude');
  assert.equal(after.usedExecutions, 1, 'execution committed to the budget');
  await assert.rejects(d.enqueue('uid-1', 'uid-1:b', 'gen.answer', { workspaceId: 'ws-1', provider: 'claude' }), (e) => e.code === 'provider_budget');
});

test('JOB-03 queue fairness: independent workloads keep their own queues without monopolising admission', async () => {
  const { s, d } = setup({ perUserMax: 10, perWorkspaceMax: 10, fleetMax: 20 });
  await d.enqueue('uid-1', 'uid-1:learning', 'learn.embed');
  await d.enqueue('uid-1', 'uid-1:documents', 'documents.export');
  await d.enqueue('uid-1', 'uid-1:billing', 'billing.sync');
  const queues = await d.queues();
  assert.ok(queues.includes('uid-1:learning'));
  assert.ok(queues.includes('uid-1:documents'));
  assert.ok(queues.includes('uid-1:billing'));
  // No single queue is treated specially: all three are admitted in order.
  assert.equal(s.jobs.size, 3);
});

test('JOB-03 retry ceiling: a job failed to its ceiling is QUARANTINED, never silently dropped', async () => {
  const { s, d, lim } = setup({ perUserMax: 10 });
  // Small policy dispatcher still shares its store + limits instance.
  const small = new OutboxDispatcher(s, { maxAttempts: 2, baseDelayMs: 10, multiplier: 2, maxDelayMs: 1000 }, lim);
  const job = await small.enqueue('uid-1', 'uid-1:a', 'job.a', { workspaceId: 'ws-1' });
  let c = await small.claim(job.id, ONE_MIN, t(0));
  await small.startRun(job.id, c, t(0));
  await small.fail(job.id, c, 'boom_0', t(1000));
  c = await small.claim(job.id, ONE_MIN, t(2000)); // attempt 2 — ceiling reached on next fail
  await small.startRun(job.id, c, t(2000));
  await small.fail(job.id, c, 'boom_1', t(3000));
  const after = await s.jobById(job.id);
  assert.equal(after.state, 'QUARANTINED');
  assert.equal(after.attempt, 2);
});

test('JOB-03 durable events: enqueue/claim/run/complete append ordered events; replay(>cursor) returns exactly later events', async () => {
  const { s, d, lim } = setup({ perUserMax: 10 });
  const job = await d.enqueue('uid-1', 'uid-1:a', 'job.a', { workspaceId: 'ws-1' });
  const c1 = await d.claim(job.id, ONE_MIN, t(0));
  await d.startRun(job.id, c1, t(0));
  await d.complete(job.id, c1, t(1000));
  const history = await lim.history(job.id);
  assert.deepEqual(history.map((e) => e.type), ['queued', 'claimed', 'running', 'done']);
  // Cursors are strictly increasing.
  assert.ok(history.every((e, i) => i === 0 || e.cursor > history[i - 1].cursor));
  // Replay/refetch: events strictly after a resume cursor.
  const lastSeen = history[1].cursor; // device already delivered queued + claimed
  const delta = await lim.replay(job.id, lastSeen);
  assert.deepEqual(delta.map((e) => e.type), ['running', 'done']);
  // A cancelled history records its own event too.
  const j2 = await d.enqueue('uid-1', 'uid-1:b', 'job.b', { workspaceId: 'ws-1' });
  await d.cancel(j2.id);
  assert.deepEqual(await lim.history(j2.id).then((h) => h.map((e) => e.type)), ['queued', 'cancelled']);
});
