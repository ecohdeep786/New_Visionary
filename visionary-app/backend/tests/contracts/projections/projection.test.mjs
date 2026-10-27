/**
 * LEARN-03 (KAN-69) — versioned mastery/progress/review projections from
 * immutable evidence; distinguish consumption, attempts, self-review and
 * assessed outcomes.
 *
 * Proven here:
 *   1. the four evidence classes stay distinct and are never conflated,
 *   2. only assessed outcomes with rubric evidence are mastery-eligible —
 *      consumption/self-review/model signals NEVER mark mastery,
 *   3. projections are versioned and deterministic (same evidence => same
 *      version; new evidence advances it),
 *   4. evidence is immutable — projection never rewrites it,
 *   5. review scheduling comes with explicit reasons; consumption never
 *      schedules review,
 *   6. an assessed event without rubric provenance is refused,
 *   7. empty evidence reports an honest zero projection.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { ProjectionService } = req('./dist/src/projections/projection-service.js');
const { InMemoryProjectionStore } = req('./dist/src/projections/projection-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const CONCEPT = 'concept_int';

function makeService() {
  const store = new InMemoryProjectionStore();
  return { store, svc: new ProjectionService(store, store) };
}

let evCounter = 0;
function ev(overrides = {}) {
  return {
    eventId: overrides.eventId ?? `ev_${++evCounter}`,
    owner: OWNER,
    conceptId: CONCEPT,
    evidenceClass: 'consumption',
    rubricRef: null,
    passed: null,
    recordedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------

test('four evidence classes stay distinct in the projection and are never conflated', async () => {
  const { svc } = makeService();
  await svc.record(ev({ evidenceClass: 'consumption' }));
  await svc.record(ev({ evidenceClass: 'attempt' }));
  await svc.record(ev({ evidenceClass: 'self_review' }));
  await svc.record(ev({ evidenceClass: 'assessed', rubricRef: 'rubric_1', passed: true }));

  const snap = await svc.project(OWNER, CONCEPT);
  const p = snap.projection;
  assert.equal(p.consumptionCount, 1);
  assert.equal(p.attemptCount, 1);
  assert.equal(p.selfReviewCount, 1);
  assert.deepEqual(p.assessed, { total: 1, passed: 1 });
});

test('only assessed outcomes with rubric evidence are mastery-eligible; consumption/self-review never mark mastery', async () => {
  const { svc } = makeService();
  // Consumed + self-reviewed only: NO mastery, honestly reported.
  await svc.record(ev({ evidenceClass: 'consumption' }));
  await svc.record(ev({ evidenceClass: 'consumption' }));
  await svc.record(ev({ evidenceClass: 'self_review' }));
  let snap = await svc.project(OWNER, CONCEPT);
  assert.equal(snap.projection.masteryState, 'self_reviewed');
  assert.equal(snap.projection.masteryEligible, false, 'consumption/self-review are never mastery');

  // Attempts without assessed outcome: practiced, still not mastery-eligible.
  await svc.record(ev({ evidenceClass: 'attempt' }));
  snap = await svc.project(OWNER, CONCEPT);
  assert.equal(snap.projection.masteryState, 'practiced');
  assert.equal(snap.projection.masteryEligible, false);

  // Assessed failure: assessed_not_passed, still not mastery-eligible.
  await svc.record(ev({ evidenceClass: 'assessed', rubricRef: 'rubric_1', passed: false }));
  snap = await svc.project(OWNER, CONCEPT);
  assert.equal(snap.projection.masteryState, 'assessed_not_passed');
  assert.equal(snap.projection.masteryEligible, false);

  // Assessed pass with rubric: the ONLY mastery-eligible state.
  await svc.record(ev({ evidenceClass: 'assessed', rubricRef: 'rubric_2', passed: true }));
  snap = await svc.project(OWNER, CONCEPT);
  assert.equal(snap.projection.masteryState, 'assessed_passed');
  assert.equal(snap.projection.masteryEligible, true, 'rubric-backed assessed pass is the only mastery evidence');
});

test('projections are versioned and deterministic: same evidence yields the same version; new evidence advances it', async () => {
  const { svc } = makeService();
  await svc.record(ev({ evidenceClass: 'attempt' }));
  const first = await svc.project(OWNER, CONCEPT);
  assert.equal(first.projectionVersion, 1);

  // Re-project with NO new evidence: identical snapshot (no version churn).
  const same = await svc.project(OWNER, CONCEPT);
  assert.equal(same.projectionVersion, 1, 'identical evidence => identical version');
  assert.equal(same.evidenceFingerprint, first.evidenceFingerprint);

  // New evidence: version advances deterministically.
  await svc.record(ev({ evidenceClass: 'assessed', rubricRef: 'rubric_1', passed: true }));
  const second = await svc.project(OWNER, CONCEPT);
  assert.equal(second.projectionVersion, 2, 'new evidence advances the version');
  assert.notEqual(second.evidenceFingerprint, first.evidenceFingerprint);
});

test('evidence is immutable — projection reads never rewrite the append-only ledger', async () => {
  const { store, svc } = makeService();
  await svc.record(ev({ evidenceClass: 'attempt' }));
  await svc.project(OWNER, CONCEPT);
  const events = await store.eventsFor(OWNER, CONCEPT);
  const before = JSON.stringify(events);
  await svc.project(OWNER, CONCEPT);
  await svc.project(OWNER, CONCEPT);
  const after = await store.eventsFor(OWNER, CONCEPT);
  assert.equal(JSON.stringify(after), before, 'evidence ledger unchanged by projection reads');
});

test('review scheduling has explicit reasons and never comes from consumption', async () => {
  const { svc } = makeService();
  await svc.record(ev({ evidenceClass: 'consumption' }));
  let snap = await svc.project(OWNER, CONCEPT);
  assert.equal(snap.projection.reviewDue.due, false, 'consumption never schedules review');
  assert.equal(snap.projection.reviewDue.reason, null);

  await svc.record(ev({ evidenceClass: 'self_review' }));
  snap = await svc.project(OWNER, CONCEPT);
  assert.equal(snap.projection.reviewDue.reason, 'self_review_follow_up');

  await svc.record(ev({ evidenceClass: 'assessed', rubricRef: 'r1', passed: false }));
  snap = await svc.project(OWNER, CONCEPT);
  assert.equal(snap.projection.reviewDue.reason, 'assessed_not_passed_retry', 'assessed failure demands retry review');
});

test('an assessed event without rubric provenance is refused (mastery evidence must be rubric-backed)', async () => {
  const { svc } = makeService();
  await assert.rejects(
    () => svc.record(ev({ evidenceClass: 'assessed', rubricRef: null, passed: true })),
    (e) => e.code === 'assessed_without_rubric',
  );
});

test('empty evidence reports an honest zero projection (no invented mastery)', async () => {
  const { svc } = makeService();
  const snap = await svc.project(OWNER, CONCEPT);
  const p = snap.projection;
  assert.equal(p.masteryState, 'not_started');
  assert.equal(p.masteryEligible, false);
  assert.equal(p.consumptionCount + p.attemptCount + p.selfReviewCount + p.assessed.total, 0);
  assert.equal(p.reviewDue.due, false);
});
