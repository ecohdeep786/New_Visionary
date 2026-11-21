/**
 * JOB-02 — leases, attempt fencing, idempotent completion, deadlines,
 * cancellation, quarantine of failed cleanup and a sweeper for
 * orphaned/stuck work.
 *
 * Proven here:
 *   1. a job is claimed with a lease token and only the holder can start/complete
 *      it — a second claim conflicts,
 *   2. attempt fencing: a stale runner whose lease token changed is refused
 *      (startRun/complete/fail/heartbeat), so a cancelled or reclaimed job is
 *      never completed by a zombie,
 *   3. idempotent completion: a job already DONE stays DONE and a stale attempt
 *      token cannot re-complete it (no double execution),
 *   4. heartbeat extends a lease and the sweeper reclaims an expired lease,
 *      resetting the job to PENDING for a fresh claim with a new token,
 *   5. hard deadlines: a job past `runBy` is failed by the sweeper, never run
 *      late,
 *   6. bounded cancellation fenced at the store,
 *   7. quarantine of failed cleanup: `maxCleanupAttempts` exceeded → QUARANTINED,
 *   8. the sweeper quarantines stale work past the attempt ceiling instead of
 *      silently dropping it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { OutboxDispatcher, JobPolicyError } = req('./dist/src/outbox/outbox.dispatcher.js');
const { OutboxSweeper } = req('./dist/src/outbox/outbox.sweeper.js');
const { InMemoryOutboxStore } = req('./dist/src/outbox/outbox-store.js');

function setup() {
  const s = new InMemoryOutboxStore();
  const d = new OutboxDispatcher(s);
  const w = new OutboxSweeper(s);
  return { s, d, w };
}

const ONE_MIN = 60_000;
const t = (ms) => new Date(Date.now() + ms).toISOString();

test('JOB-02 claim: a job is claimed with a lease token and the same holder can run+complete it', async () => {
  const { s, d } = setup();
  const job = await d.enqueue('uid-1', 'uid-1:learning', 'learning.state.commit');
  const c1 = await d.claim(job.id, ONE_MIN, t(0));
  assert.equal(c1.job.state, 'CLAIMED');
  assert.ok(c1.leaseToken, 'lease token minted');
  assert.ok(c1.attemptToken, 'attempt token minted');
  const running = await d.startRun(job.id, c1, t(1000));
  assert.equal(running.state, 'RUNNING');
  const done = await d.complete(job.id, c1, t(2000));
  assert.equal(done.state, 'DONE');
  assert.ok(done.completedAt);
});

test('JOB-02 attempt fencing: a stale lease holder cannot start/complete after the token changed (e.g. sweeper reclaim)', async () => {
  const { s, d, w } = setup();
  const job = await d.enqueue('uid-1', 'uid-1:learning', 'learning.state.commit', { runBy: null });
  const c1 = await d.claim(job.id, 1000, t(0)); // tiny lease
  await d.startRun(job.id, c1, t(0));
  // Lease expires; sweeper reclaims → PENDING with a NEW token, fencing c1.
  const sweep = await w.sweep(t(5000));
  assert.equal(sweep.reclaimed.length, 1);
  const afterReclaim = await s.jobById(job.id);
  assert.equal(afterReclaim.state, 'PENDING');
  assert.notEqual(afterReclaim.leaseToken, c1.leaseToken);
  // Old holder tries to complete — fenced.
  await assert.rejects(d.complete(job.id, c1, t(6000)), (e) => e.code === 'fenced');
  const still = await s.jobById(job.id);
  assert.equal(still.state, 'PENDING', 'zombie did not complete the job');
});

test('JOB-02 idempotent completion: a DONE job stays DONE and a second complete is a no-op, not a re-run', async () => {
  const { s, d } = setup();
  const job = await d.enqueue('uid-1', 'uid-1:documents', 'documents.export');
  const c1 = await d.claim(job.id, ONE_MIN, t(0));
  await d.startRun(job.id, c1, t(0));
  const done = await d.complete(job.id, c1, t(0));
  assert.equal(done.state, 'DONE');
  // A duplicate ack from the same holder never re-executes; the row is already DONE.
  const again = await d.complete(job.id, c1, t(1000));
  assert.equal(again.state, 'DONE');
  // A brand new holder cannot claim a DONE job either.
  await assert.rejects(d.claim(job.id, ONE_MIN, t(2000)), (e) => e.code === 'conflict');
});

test('JOB-02 fencing: a stale worker holding an old token cannot complete after cancel', async () => {
  const { s, d } = setup();
  const job = await d.enqueue('uid-1', 'uid-1:learning', 'learning.state.commit');
  const c1 = await d.claim(job.id, ONE_MIN, t(0));
  await d.startRun(job.id, c1, t(0));
  await d.cancel(job.id, t(100));
  const cancelled = await s.jobById(job.id);
  assert.equal(cancelled.state, 'CANCELLED');
  await assert.rejects(d.complete(job.id, c1, t(200)), (e) => e.code === 'fenced' || e.code === 'conflict');
  const after = await s.jobById(job.id);
  assert.equal(after.state, 'CANCELLED');
});

test('JOB-02 heartbeat extends a lease so a progressing job is not reclaimed', async () => {
  const { s, d, w } = setup();
  const job = await d.enqueue('uid-1', 'uid-1:classroom', 'grades.publish');
  const c1 = await d.claim(job.id, 1000, t(0));
  await d.startRun(job.id, c1, t(0));
  await d.heartbeat(job.id, c1, 5000, t(500));
  const hb = await s.jobById(job.id);
  assert.ok(Date.parse(hb.claimedUntil) > Date.parse(t(2500)), 'lease still valid after heartbeat');
  const sweep = await w.sweep(t(3000));
  assert.equal(sweep.reclaimed.length, 0, 'live heartbeat not reclaimed');
  assert.equal(sweep.deadlineExpired.length, 0);
});

test('JOB-02 sweeper: expired lease reclaim requeues for a fresh claim; bogus token is fenced', async () => {
  const { s, d, w } = setup();
  const job = await d.enqueue('uid-1', 'uid-1:billing', 'billing.sync');
  const c1 = await d.claim(job.id, 500, t(0)); // long-expired by sweep time
  const sweep = await w.sweep(t(10_000));
  assert.equal(sweep.reclaimed.length, 1);
  const back = await s.jobById(job.id);
  assert.equal(back.state, 'PENDING');
  assert.ok(back.lastError.includes('lease_expired'));
  // Old token can no longer complete; a fresh claim works.
  await assert.rejects(d.complete(job.id, c1, t(11_000)), (e) => e.code === 'fenced');
  const c2 = await d.claim(job.id, ONE_MIN, t(11_000));
  assert.ok(c2.leaseToken !== c1.leaseToken);
  await d.startRun(job.id, c2, t(11_100));
  const done = await d.complete(job.id, { leaseToken: c2.leaseToken, attemptToken: c2.attemptToken }, t(12_000));
  assert.equal(done.state, 'DONE');
});

test('JOB-02 deadline: a job past runBy is failed by the sweeper, never run late', async () => {
  const { s, d, w } = setup();
  const job = await d.enqueue('uid-1', 'uid-1:learning', 'learning.state.commit', { runBy: t(60_000) });
  const past = await s.jobById(job.id);
  assert.equal(past.state, 'PENDING');
  const sweep = await w.sweep(t(120_000)); // runBy long passed
  assert.equal(sweep.deadlineExpired.length, 1);
  const after = await s.jobById(job.id);
  assert.equal(after.state, 'FAILED');
  assert.equal(after.lastError, 'deadline_exceeded');
  await assert.rejects(d.claim(job.id, ONE_MIN, t(121_000)), (e) => e.code === 'conflict');
});

test('JOB-02 quarantine of failed cleanup: bounded retries then QUARANTINED, never silently dropped', async () => {
  const { s, d } = setup();
  const job = await d.enqueue('uid-1', 'uid-1:documents', 'documents.export');
  const c1 = await d.claim(job.id, ONE_MIN, t(0));
  await d.startRun(job.id, c1, t(0));
  await d.complete(job.id, c1, t(0));
  // Cleanup fails 3 times (maxCleanupAttempts=3 → 3rd call quarantines).
  await d.failCleanup(job.id, 'cleanup_timeout', 3, t(100));
  await d.failCleanup(job.id, 'cleanup_timeout', 3, t(200));
  const stillRetrying = await s.jobById(job.id);
  assert.equal(stillRetrying.state, 'DONE', 'still DONE while cleanup retries');
  assert.equal(stillRetrying.cleanupAttempts, 2);
  await d.failCleanup(job.id, 'cleanup_timeout', 3, t(300));
  const quarantined = await s.jobById(job.id);
  assert.equal(quarantined.state, 'QUARANTINED', 'quarantined, never dropped');
  assert.equal(quarantined.cleanupError, 'cleanup_timeout');
});

test('JOB-02 sweeper: stale work past the attempt ceiling is QUARANTINED, never lost', async () => {
  const s = new InMemoryOutboxStore();
  const smallPolicy = { maxAttempts: 3, baseDelayMs: 10, multiplier: 2, maxDelayMs: 1000, leaseMs: 500 };
  const d = new OutboxDispatcher(s, {}, smallPolicy);
  const w = new OutboxSweeper(s, smallPolicy);
  const job = await d.enqueue('uid-1', 'uid-1:learning', 'learning.embed', { runBy: null });
  // Drive the job to attempt 3 across retry claims, then let
  // its lease expire so the sweeper must decide: retry or quarantine.
  let c1 = await d.claim(job.id, 500, t(0));
  await d.startRun(job.id, c1, t(0));
  for (let i = 0; i < 2; i++) {
    await d.fail(job.id, c1, `boom_${i}`, t(i * 200 + 50));
    c1 = await d.claim(job.id, 500, t(i * 200 + 200));
    await d.startRun(job.id, c1, t(i * 200 + 210));
  }
  const live = await s.jobById(job.id);
  assert.equal(live.attempt, 3);
  // Lease expires with the job at the ceiling → sweeper quarantines.
  const sweep = await w.sweep(t(60_000));
  const after = await s.jobById(job.id);
  assert.equal(sweep.quarantinedStale.length, 1);
  assert.equal(after.state, 'QUARANTINED');
  assert.ok(after.lastError.includes('lease'));
});

test('JOB-02 expired holders cannot revive, run or settle a job before a sweep', async () => {
  const { s, d } = setup();
  const job = await d.enqueue('uid-1', 'uid-1:learning', 'learning.embed');
  const now = Date.now();
  const time = ms => new Date(now + ms).toISOString();
  const claim = await d.claim(job.id, 500, time(0));
  await d.startRun(job.id, claim, time(1));
  for (const operation of [
    () => d.heartbeat(job.id, claim, 1000, time(500)),
    () => d.complete(job.id, claim, time(500)),
    () => d.fail(job.id, claim, 'late', time(500)),
  ]) await assert.rejects(operation, error => error.code === 'fenced');
  assert.equal((await s.jobById(job.id)).state, 'RUNNING');
});

test('JOB-02 a deadline gates initial claim and an unrelated holder cannot replay completion', async () => {
  const { d } = setup();
  const job = await d.enqueue('uid-1', 'uid-1:learning', 'learning.embed', { runBy: t(2_000) });
  await assert.rejects(d.claim(job.id, ONE_MIN, job.runBy), error => error.code === 'deadline_exceeded');
  const now = new Date(Date.parse(job.runBy) - 1_000).toISOString();
  const claim = await d.claim(job.id, ONE_MIN, now);
  assert.equal(claim.job.claimedUntil, job.runBy);
  await d.startRun(job.id, claim, now);
  await d.complete(job.id, claim, now);
  await assert.rejects(d.complete(job.id, { ...claim, attemptToken: 'attempt_unrelated' }, now), error => error.code === 'fenced');
});

test('JOB-02 the sweeper cannot overwrite a heartbeat committed after its scan', async () => {
  const start = Date.now();
  const time = ms => new Date(start + ms).toISOString();
  class DelayedScanStore extends InMemoryOutboxStore {
    async dueJobs(now, limit) {
      const snapshot = await super.dueJobs(now, limit);
      await dispatcher.heartbeat(job.id, lease, 1000, time(400));
      return snapshot;
    }
  }
  const store = new DelayedScanStore();
  const dispatcher = new OutboxDispatcher(store);
  const job = await dispatcher.enqueue('uid-1', 'uid-1:learning', 'learning.embed');
  const lease = await dispatcher.claim(job.id, 500, time(0));
  await dispatcher.startRun(job.id, lease, time(10));
  const swept = await new OutboxSweeper(store).sweep(time(500));
  assert.deepEqual(swept.reclaimed, []);
  const live = await store.jobById(job.id);
  assert.equal(live.state, 'RUNNING');
  assert.equal(live.claimedUntil, time(1400));
});
