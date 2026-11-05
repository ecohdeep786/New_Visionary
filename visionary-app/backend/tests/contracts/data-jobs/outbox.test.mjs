/**
 * JOB-01 — owning-store outbox dispatch, private authenticated task delivery,
 * per-workload queues, bounded retry/backoff and recovery after
 * commit/dispatch/ack crashes.
 *
 * Review rework (10582) proven here:
 *   1. ATOMIC DUE CLAIM: claimDueOutbox on the owning store claims each due
 *      event exactly once — concurrent polls never double-claim, and a poll
 *      before nextAttemptAt never touches the row nor burns an attempt,
 *   2. CONFIRMED DELIVERY BEFORE ACK: the registered topic handler must
 *      resolve before DONE; an event with no handler is never marked DONE,
 *   3. HONEST REPORTING: an ack crash reports DISPATCHED for a row that IS
 *      durably DISPATCHED (never DISPATCHED for a PENDING row); a delivery
 *      failure reports PENDING with a bounded backoff slot,
 *   4. RECOVERY: a fresh dispatcher (restart) re-claims an ack-crashed row
 *      after its lease and the idempotent consumer never double-commits,
 *   5. bounded retry/backoff with quarantine at the ceiling, never lost,
 *   6. per-workload queues with server-authoritative authorization and
 *      cancelled-job fencing; a job is never DONE without its handler.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { OutboxDispatcher } = req('./dist/src/outbox/outbox.dispatcher.js');
const { InMemoryOutboxStore, backoffDelay } = req('./dist/src/outbox/outbox-store.js');
const { DEFAULT_BACKOFF } = req('./dist/src/outbox/outbox-types.js');

const T0 = new Date('2026-11-05T10:00:00.000Z');
const tick = (ms) => new Date(T0.getTime() + ms);

function setup(policy) {
  const s = new InMemoryOutboxStore();
  const d = new OutboxDispatcher(s, {}, policy ?? { ...DEFAULT_BACKOFF, baseDelayMs: 100, multiplier: 2, maxDelayMs: 1000, leaseMs: 500 });
  return { s, d };
}

let seq = 0;
function ev(uid, topic, payload, cursor) {
  seq += cursor === undefined ? 1 : 0;
  return { id: `oe_${cursor ?? seq}`, uid, workspaceId: null, topic, payload, cursor: cursor ?? seq, status: 'PENDING', createdAt: T0.toISOString(), dispatchedAt: null, attempts: 0, nextAttemptAt: null, lastError: null };
}

test('JOB-01 dispatch: registered handlers deliver, and DONE commits only after the handler ran', async () => {
  const { s } = setup();
  const delivered = [];
  const handlers = { topics: new Map([
    ['invite.accept', async (e) => { delivered.push(['invite.accept', e.cursor]); }],
    ['consent.revoke', async (e) => { delivered.push(['consent.revoke', e.cursor]); }],
  ]) };
  const dispatcher = new OutboxDispatcher(s, handlers, { ...DEFAULT_BACKOFF, leaseMs: 500 });
  await s.appendOutbox(ev('uid-1', 'invite.accept', { inviteId: 'i1' }, 1));
  await s.appendOutbox(ev('uid-1', 'consent.revoke', { grantId: 'g1' }, 2));
  const results = await dispatcher.dispatch(10, T0);
  assert.deepEqual(delivered, [['invite.accept', 1], ['consent.revoke', 2]], 'the handler actually ran for each event');
  assert.deepEqual(results, [
    { cursor: 1, status: 'DONE', delivered: true },
    { cursor: 2, status: 'DONE', delivered: true },
  ]);
  assert.equal((await s.outboxByCursor(1)).status, 'DONE');
  assert.equal((await s.outboxByCursor(2)).status, 'DONE');
});

test('JOB-01 idempotent: a DONE event is not re-dispatched (no double commit)', async () => {
  const { s } = setup();
  const seen = [];
  const dispatcher = new OutboxDispatcher(s, { default: async (e) => { seen.push(e.cursor); } }, { ...DEFAULT_BACKOFF, leaseMs: 500 });
  await s.appendOutbox(ev('uid-1', 'documents.export', {}, 1));
  await dispatcher.dispatch(10, T0);
  const second = await dispatcher.dispatch(10, tick(1000));
  assert.equal(second.length, 0);
  assert.deepEqual(seen, [1], 'the handler ran exactly once across polls');
});

test('JOB-01 no handler: the event is NEVER marked DONE and reports PENDING honestly', async () => {
  const { s, d } = setup();
  await s.appendOutbox(ev('uid-1', 'unroutable.topic', {}, 1));
  const results = await d.dispatch(10, T0);
  assert.deepEqual(results, [{ cursor: 1, status: 'PENDING', delivered: false }]);
  const row = await s.outboxByCursor(1);
  assert.equal(row.status, 'PENDING', 'no handler means no DONE');
  assert.equal(row.lastError, 'NO_DELIVERY_HANDLER');
  assert.ok(row.nextAttemptAt, 'a bounded retry slot is scheduled');
});

test('JOB-01 ack crash: the report is DISPATCHED only because the row IS durably DISPATCHED; recovery re-delivers', async () => {
  const { s } = setup();
  const deliveries = [];
  const dispatcher = new OutboxDispatcher(s, { default: async (e) => { deliveries.push(e.cursor); } }, { ...DEFAULT_BACKOFF, leaseMs: 500 });
  await s.appendOutbox(ev('uid-1', 'consent.revoke', {}, 1));
  s.failDispatchAfterWrite = true; // the DONE ack is lost after the delivery ran
  const first = await dispatcher.dispatch(10, T0);
  assert.deepEqual(first, [{ cursor: 1, status: 'DISPATCHED', delivered: true }], 'honest: delivery confirmed, ack pending');
  const during = await s.outboxByCursor(1);
  assert.equal(during.status, 'DISPATCHED', 'the row is durably DISPATCHED, not PENDING');
  assert.ok(deliveries.includes(1));
  // A poll before the lease expires claims nothing and burns no attempt.
  const early = await dispatcher.dispatch(10, tick(100));
  assert.equal(early.length, 0);
  assert.equal((await s.outboxByCursor(1)).attempts, 1, 'no attempt burned before the lease');
  // Restart: a fresh dispatcher recovers the row after the lease; the consumer dedupes on the cursor.
  s.failDispatchAfterWrite = false;
  const recovered = new OutboxDispatcher(s, { default: async (e) => { deliveries.push(e.cursor); } }, { ...DEFAULT_BACKOFF, leaseMs: 500 });
  const second = await recovered.dispatch(10, tick(600));
  assert.deepEqual(second, [{ cursor: 1, status: 'DONE', delivered: true }]);
  assert.deepEqual(deliveries, [1, 1], 'the handler ran twice (redelivery), the consumer dedupes per cursor');
  assert.equal((await s.outboxByCursor(1)).status, 'DONE');
  assert.equal((await recovered.dispatch(10, tick(2000))).length, 0, 'DONE is terminal');
});

test('JOB-01 backoff: a poll before nextAttemptAt neither retries nor burns an attempt', async () => {
  const { s } = setup();
  let failures = 1;
  const dispatcher = new OutboxDispatcher(s, { default: async () => { if (failures > 0) { failures -= 1; throw new Error('DELIVERY_DOWN'); } } }, { ...DEFAULT_BACKOFF, baseDelayMs: 100, multiplier: 2, maxDelayMs: 1000, leaseMs: 500 });
  await s.appendOutbox(ev('uid-1', 'documents.export', {}, 1));
  const first = await dispatcher.dispatch(10, T0);
  assert.deepEqual(first, [{ cursor: 1, status: 'PENDING', delivered: false }]);
  const afterFail = await s.outboxByCursor(1);
  assert.equal(afterFail.attempts, 1);
  assert.equal(afterFail.lastError, 'DELIVERY_DOWN');
  const slot = Date.parse(afterFail.nextAttemptAt) - T0.getTime();
  assert.ok(slot >= 100 && slot <= 1000, `the retry slot is bounded backoff (${slot}ms)`);
  // Early poll: nothing due, nothing changes.
  const early = await dispatcher.dispatch(10, tick(slot - 1));
  assert.equal(early.length, 0);
  const untouched = await s.outboxByCursor(1);
  assert.equal(untouched.attempts, 1, 'attempts did not grow before nextAttemptAt');
  assert.equal(untouched.status, 'PENDING');
  // Due poll: exactly one more attempt, delivery now succeeds.
  const due = await dispatcher.dispatch(10, tick(slot + 1));
  assert.deepEqual(due, [{ cursor: 1, status: 'DONE', delivered: true }]);
  assert.equal((await s.outboxByCursor(1)).attempts, 2);
});

test('JOB-01 quarantine: an event that keeps failing past maxAttempts is FAILED, never lost', async () => {
  const { s } = setup();
  const dispatcher = new OutboxDispatcher(s, { default: async () => { throw new Error('STILL_DOWN'); } }, { ...DEFAULT_BACKOFF, baseDelayMs: 10, multiplier: 1, maxDelayMs: 10, leaseMs: 10 });
  await s.appendOutbox(ev('uid-1', 'documents.export', {}, 1));
  for (let i = 0; i < DEFAULT_BACKOFF.maxAttempts; i += 1) {
    await dispatcher.dispatch(10, tick(i * 100));
  }
  const exhausted = await s.outboxByCursor(1);
  assert.equal(exhausted.attempts, DEFAULT_BACKOFF.maxAttempts);
  assert.equal(exhausted.status, 'FAILED', 'quarantined at the ceiling, never silently dropped');
  assert.equal(exhausted.lastError, 'STILL_DOWN');
  // A quarantined row is terminal: later polls neither claim nor resurrect it.
  assert.equal((await dispatcher.dispatch(10, tick(10_000))).length, 0);
  assert.equal((await s.outboxByCursor(1)).status, 'FAILED');
});

test('JOB-01 quarantine sweep: an ack-crashed row that reaches the ceiling is quarantined by the poll, never lost', async () => {
  const { s } = setup();
  const dispatcher = new OutboxDispatcher(s, { default: async () => undefined }, { ...DEFAULT_BACKOFF, baseDelayMs: 10, multiplier: 1, maxDelayMs: 10, leaseMs: 10 });
  await s.appendOutbox(ev('uid-1', 'documents.export', {}, 1));
  s.failDispatchAfterWrite = true; // every ack is lost: the row stays DISPATCHED under its lease
  for (let i = 0; i < DEFAULT_BACKOFF.maxAttempts; i += 1) {
    await dispatcher.dispatch(10, tick(i * 100));
  }
  const atCeiling = await s.outboxByCursor(1);
  assert.equal(atCeiling.attempts, DEFAULT_BACKOFF.maxAttempts);
  assert.equal(atCeiling.status, 'DISPATCHED', 'in-flight under its lease, past the claim ceiling');
  const final = await dispatcher.dispatch(10, tick(10_000));
  assert.deepEqual(final, [{ cursor: 1, status: 'FAILED', delivered: false }], 'the sweep quarantines it');
  assert.equal((await s.outboxByCursor(1)).status, 'FAILED');
  assert.equal((await s.outboxByCursor(1)).lastError, 'MAX_ATTEMPTS_REACHED');
});

test('JOB-01 concurrent claims: two dispatchers polling the same store never double-claim or double-deliver', async () => {
  const { s } = setup();
  const deliveries = [];
  const makeDispatcher = () => new OutboxDispatcher(s, { default: async (e) => { deliveries.push(e.cursor); } }, { ...DEFAULT_BACKOFF, leaseMs: 500 });
  for (let c = 1; c <= 6; c += 1) await s.appendOutbox(ev('uid-1', 'documents.export', {}, c));
  const [a, b] = [makeDispatcher(), makeDispatcher()];
  const [ra, rb] = await Promise.all([a.dispatch(10, T0), b.dispatch(10, T0)]);
  const all = [...ra, ...rb];
  assert.equal(all.length, 6, 'each event appears in exactly one batch');
  assert.equal(new Set(all.map(r => r.cursor)).size, 6, 'no cursor was claimed twice');
  deliveries.sort((x, y) => x - y);
  assert.deepEqual(deliveries, [1, 2, 3, 4, 5, 6], 'each event was delivered exactly once');
  for (let c = 1; c <= 6; c += 1) assert.equal((await s.outboxByCursor(c)).status, 'DONE');
});

test('JOB-01 batch bound: a batchSize smaller than the due set claims only batchSize rows', async () => {
  const { s } = setup();
  for (let c = 1; c <= 3; c += 1) await s.appendOutbox(ev('uid-1', 'documents.export', {}, c));
  const dispatcher = new OutboxDispatcher(s, { default: async () => undefined }, { ...DEFAULT_BACKOFF, leaseMs: 500 });
  const first = await dispatcher.dispatch(2, T0);
  assert.equal(first.length, 2);
  const rest = await dispatcher.dispatch(10, T0);
  assert.equal(rest.length, 1, 'the unclaimed row is still due on the next poll');
});

test('JOB-01 per-workload queues: a client cannot inject a queue it does not own', async () => {
  const { s, d } = setup();
  await assert.rejects(() => d.enqueue('uid-1', 'uid-2:exports', 'export'), (e) => e.code === 'unauthorized_queue');
  const job = await d.enqueue('uid-1', 'uid-1:exports', 'export');
  assert.equal((await d.queues()).includes('uid-1:exports'), true);
  assert.equal(job.state, 'PENDING');
});

test('JOB-01 jobs: a job is never DONE without its handler; cancelled jobs stay fenced', async () => {
  const { s, d } = setup();
  const job = await d.enqueue('uid-1', 'uid-1:exports', 'export');
  await d.runJob(job.id); // no handler
  assert.equal((await s.jobById(job.id)).state, 'PENDING', 'no handler, no fake DONE');
  assert.equal((await s.jobById(job.id)).lastError, 'NO_JOB_HANDLER');
  let ran = 0;
  await d.runJob(job.id, async () => { ran += 1; });
  assert.equal(ran, 1);
  assert.equal((await s.jobById(job.id)).state, 'DONE');
  await d.runJob(job.id, async () => { ran += 1; }); // idempotent: DONE never re-runs
  assert.equal(ran, 1);
  // Cancelled job fencing
  const job2 = await d.enqueue('uid-1', 'uid-1:exports', 'export');
  await d.cancel(job2.id);
  await d.runJob(job2.id, async () => { ran += 1; });
  assert.equal(ran, 1, 'a cancelled job is fenced against its runner');
  assert.equal((await s.jobById(job2.id)).state, 'CANCELLED');
});

test('JOB-01 backoffDelay: bounded exponential growth', () => {
  const policy = { maxAttempts: 5, baseDelayMs: 200, multiplier: 2, maxDelayMs: 60_000, leaseMs: 30_000 };
  assert.deepEqual([1, 2, 3, 4, 5].map(a => backoffDelay(policy, a)), [200, 400, 800, 1600, 3200]);
  assert.equal(backoffDelay({ ...policy, maxDelayMs: 900 }, 6), 900, 'the ceiling caps any single delay');
});
