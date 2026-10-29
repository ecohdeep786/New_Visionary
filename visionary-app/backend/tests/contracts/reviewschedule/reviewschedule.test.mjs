/**
 * LEARN-11 (KAN-147) — versioned durable review scheduling from assessed
 * evidence with bounded baseline SRS rules, due-queue projections, command
 * deduplication, timezone/quiet/preference handling and two-device recovery.
 *   - scheduling only from ASSESSED evidence (self-rating never reschedules);
 *   - bounded versioned baseline (never unvalidated exponential);
 *   - calibration before personalized claims;
 *   - command dedup (same key + same payload idempotent; changed payload refuses);
 *   - deterministic due queue with understandable reasons;
 *   - quiet-hours/timezone preference handling;
 *   - two-device byte-stable recovery;
 *   - no retention TTLs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));
const { ReviewScheduleService } = req('./dist/src/reviewschedule/reviewschedule-service.js');
const { InMemoryReviewScheduleStore } = req('./dist/src/reviewschedule/reviewschedule-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_1' };
const OTHER = { uid: 'uid_learner_2', workspaceId: 'ws_1' };
const ws2 = { uid: 'uid_learner_1', workspaceId: 'ws_2' };

// Bounded, approved baseline ladder: again < hard <= good <= easy.
const RULES = { rulesId: 'baseline_v1', version: 1, ladder: { again: 1, hard: 3, good: 5, easy: 10 }, maxIntervalDays: 30 };

async function makeService() {
  const store = new InMemoryReviewScheduleStore();
  const service = new ReviewScheduleService(store);
  await service.defineBaselineRules(RULES, 'approver_srs_board');
  return { store, service };
}

function fixedNow(iso = '2026-10-01T10:00:00.000Z') {
  return new Date(iso);
}

// ---------------------------------------------------------------------------

test('BOUNDED baseline SRS: an unapproved/unknown/invalid ladder refuses scheduling', async () => {
  const { service } = await makeService();
  // Unknown rules version.
  await assert.rejects(() => service.projectDueQueue(OWNER, 'baseline_v1', 99, ['c1']), (e) => e.code === 'rules_unknown');
  // Unapproved baseline (empty approver) refuses.
  const store2 = new InMemoryReviewScheduleStore();
  const s2 = new ReviewScheduleService(store2);
  await assert.rejects(() => s2.defineBaselineRules(RULES, '  '), (e) => e.code === 'rules_not_approved');
  // Invalid ladder (not monotonic / over max) refuses.
  await assert.rejects(
    () => s2.defineBaselineRules({ ...RULES, ladder: { again: 10, hard: 3, good: 5, easy: 10 } }, 'approver'),
    (e) => e.code === 'rules_invalid',
  );
  await assert.rejects(
    () => s2.defineBaselineRules({ ...RULES, ladder: { again: 1, hard: 60, good: 70, easy: 80 }, maxIntervalDays: 30 }, 'approver'),
    (e) => e.code === 'rules_invalid',
  );
  void service;
});

test('CALIBRATION before personalized claim: uncalibrated baseline carries no personalized claim; calibrate() enables it', async () => {
  const { service } = await makeService();
  await service.recordAssessedEvidence(OWNER, 'cmd-1', 'c1', 'good', 1);
  // Uncalibrated: the due item reason explicitly says "uncalibrated baseline ... no personalized claim".
  const uncal = await service.projectDueQueue(OWNER, 'baseline_v1', 1, ['c1'], fixedNow().toISOString());
  assert.equal(uncal.rules.calibrated, false);
  assert.ok(uncal.items[0].reason.includes('uncalibrated baseline'));
  // Uncalibrated explicitly declines any personalized claim.
  assert.ok(uncal.items[0].reason.includes('no personalized claim'));
  // Calibrate (measured), then the projection carries the calibrated baseline.
  await service.calibrateBaseline('baseline_v1', 1, 'measurement_team');
  const cal = await service.projectDueQueue(OWNER, 'baseline_v1', 1, ['c1'], fixedNow().toISOString());
  assert.equal(cal.rules.calibrated, true);
  assert.ok(cal.items[0].reason.includes('calibrated baseline v1'));
});

test('SCHEDULING FROM ASSESSED EVIDENCE ONLY: self-rating never reschedules', async () => {
  const { service } = await makeService();
  await service.recordAssessedEvidence(OWNER, 'cmd-2', 'c1', 'good', 1);
  const before = await service.projectDueQueue(OWNER, 'baseline_v1', 1, ['c1'], fixedNow().toISOString());
  // Record a self-rating for the same concept — the due date must NOT change.
  await service.recordSelfRating(OWNER, 'cmd-3', 'c1', 'easy', 1);
  const after = await service.projectDueQueue(OWNER, 'baseline_v1', 1, ['c1'], fixedNow().toISOString());
  const strip = (prj) => JSON.stringify(prj.items.map((i) => i.dueAt));
  assert.equal(strip(before), strip(after)); // self-rating changed nothing
});

test('COMMAND DEDUP: same key + same payload is idempotent; changed payload refuses', async () => {
  const { service } = await makeService();
  await service.recordAssessedEvidence(OWNER, 'dedup-1', 'c1', 'good', 1);
  // Replay the same command with the same payload — converges (no refusal).
  await service.recordAssessedEvidence(OWNER, 'dedup-1', 'c1', 'good', 1);
  // Same command key but a CHANGED payload — refuses.
  await assert.rejects(
    () => service.recordAssessedEvidence(OWNER, 'dedup-1', 'c1', 'easy', 1),
    (e) => e.code === 'command_changed',
  );
});

test('DETERMINISTIC due queue: projection is byte-stable and carries understandable reasons', async () => {
  const { service } = await makeService();
  await service.recordAssessedEvidence(OWNER, 'cmd-4', 'c1', 'good', 1);
  await service.recordAssessedEvidence(OWNER, 'cmd-5', 'c2', 'again', 1);
  const p1 = await service.projectDueQueue(OWNER, 'baseline_v1', 1, ['c1', 'c2'], fixedNow().toISOString());
  const p2 = await service.projectDueQueue(OWNER, 'baseline_v1', 1, ['c1', 'c2'], fixedNow().toISOString());
  // Same inputs -> identical digest + items.
  assert.equal(p1.digest, p2.digest);
  assert.deepEqual(p1.items, p2.items);
  // Sorted by dueAt; each item has an understandable reason.
  assert.ok(p1.items[0].dueAt <= p1.items[1].dueAt);
  for (const item of p1.items) assert.ok(item.reason.length > 0);
});

test('PREFERENCES: quiet hours shift a due-at into the quiet window to the allowed boundary', async () => {
  const { service } = await makeService();
  // Assessed at 10:00Z, good -> due in 5 days = 10:00Z (still "quiet": 09:00-11:00).
  const assessedAt = fixedNow('2026-10-01T10:00:00.000Z');
  await service.recordAssessedEvidence(OWNER, 'cmd-6', 'c1', 'good', 1);
  // Force assessedAt to the fixed clock by re-recording via a controlled service.
  const store2 = new InMemoryReviewScheduleStore();
  const s2 = new ReviewScheduleService(store2, () => assessedAt);
  await s2.defineBaselineRules(RULES, 'approver_srs_board');
  await s2.recordAssessedEvidence(OWNER, 'cmd-6', 'c1', 'good', 1);
  await s2.setPreferences(OWNER, 'Asia/Kolkata', 9 * 60, 11 * 60); // quiet 09:00-11:00 UTC
  const p = await s2.projectDueQueue(OWNER, 'baseline_v1', 1, ['c1'], assessedAt.toISOString());
  // Due lands on 2026-10-06T10:00Z which is inside quiet -> shifted to 11:00Z.
  assert.equal(p.items[0].dueAt, '2026-10-06T11:00:00.000Z');
});

test('TWO-DEVICE RECOVERY: two controllers over the same store observe the identical byte-stable queue', async () => {
  const { store, service } = await makeService();
  await service.recordAssessedEvidence(OWNER, 'cmd-7', 'c1', 'good', 1);
  await service.projectDueQueue(OWNER, 'baseline_v1', 1, ['c1'], fixedNow().toISOString());
  const deviceA = await service.resumeQueue(OWNER);
  const service2 = new ReviewScheduleService(store);
  const deviceB = await service2.resumeQueue(OWNER);
  assert.equal(deviceA.digest, deviceB.digest);
  assert.equal(deviceA.count, deviceB.count);
});

test('NO RETENTION TTL: no purge is applied; evidence and projections persist', async () => {
  const { store, service } = await makeService();
  await service.recordAssessedEvidence(OWNER, 'cmd-8', 'c1', 'good', 1);
  await service.projectDueQueue(OWNER, 'baseline_v1', 1, ['c1'], fixedNow().toISOString());
  const evidence = await store.latestAssessedEvidence(OWNER, 'c1');
  assert.ok(evidence); // evidence still present (no TTL purge)
  const projections = await store.projectionsFor(OWNER);
  assert.equal(projections.length, 1);
});

test('WORKSPACE/OWNER boundary: wrong owner or workspace cannot read the queue (no leak)', async () => {
  const { service } = await makeService();
  await service.recordAssessedEvidence(OWNER, 'cmd-9', 'c1', 'good', 1);
  const p = await service.projectDueQueue(OWNER, 'baseline_v1', 1, ['c1'], fixedNow().toISOString());
  // Projection owner-bound: other uid can't see it in their resume.
  const rOther = await service.resumeQueue(OTHER);
  assert.equal(rOther.count, 0);
  const rWs2 = await service.resumeQueue(ws2);
  assert.equal(rWs2.count, 0);
  void p;
});
