/**
 * LEARN-04 (KAN-70) — persist permitted goals/daily plans/review scheduling and
 * eligible discovery results with understandable reasons; a rebuilding
 * projection must not overwrite evidence.
 *
 * Proven here:
 *   1. goals are permitted only for released concepts; wrong users denied,
 *   2. daily plans rebuild deterministically from goals + due reviews, and
 *      every item carries an understandable reason,
 *   3. THE INVARIANT: a rebuilding projection must not overwrite evidence —
 *      the evidence ledger stays byte-identical across rebuilds,
 *   4. plan versions append and never rewrite past versions,
 *   5. review scheduling only from real due reasons; consumption never due,
 *   6. discovery returns only eligible released concepts with reasons.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { DailyPlanService } = req('./dist/src/dailyplan/daily-plan.js');
const { DailyPlanError } = req('./dist/src/dailyplan/daily-plan-types.js');
const { InMemoryPlanStore } = req('./dist/src/dailyplan/daily-plan-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const TODAY = '2026-10-27';

function makeService(released = ['c_algebra', 'c_graphs'], due = []) {
  const store = new InMemoryPlanStore();
  const svc = new DailyPlanService(store, InMemoryPlanStore.eligibility(released), InMemoryPlanStore.reviewDue(due));
  return { store, svc };
}

// ---------------------------------------------------------------------------

test('goals are permitted only for released concepts; wrong users cannot see another learner\'s goals', async () => {
  const { store, svc } = makeService();
  const goal = await svc.setGoal(OWNER, 'goal_1', 'c_algebra', 'Master linear equations this week');
  assert.equal(goal.conceptId, 'c_algebra');

  await assert.rejects(
    () => svc.setGoal(OWNER, 'goal_2', 'c_unreleased', 'x'),
    (e) => e instanceof DailyPlanError && e.code === 'concept_not_eligible',
    'a goal may not target an unreleased concept',
  );

  const mine = await store.goalsFor(OWNER);
  const theirs = await store.goalsFor(OTHER);
  assert.equal(mine.length, 1);
  assert.equal(theirs.length, 0, 'goals are owner-scoped');
});

test('daily plans rebuild deterministically from goals + due reviews with understandable reasons', async () => {
  const { svc } = makeService(['c_algebra', 'c_graphs'], [{ conceptId: 'c_graphs', reason: 'assessed_not_passed_retry' }]);
  await svc.setGoal(OWNER, 'goal_1', 'c_algebra', 'Master linear equations this week');
  const plan = await svc.buildDailyPlan(OWNER, TODAY);

  assert.equal(plan.version, 1);
  assert.equal(plan.planDate, TODAY);
  const byOrigin = new Map(plan.items.map((i) => [i.origin, i]));
  assert.equal(byOrigin.get('goal').conceptId, 'c_algebra');
  assert.match(byOrigin.get('goal').reason, /Master linear equations/, 'goal reason is understandable');
  assert.equal(byOrigin.get('review').conceptId, 'c_graphs');
  assert.match(byOrigin.get('review').reason, /Review due — assessed_not_passed_retry/, 'review reason carries the evidence-derived why');
});

test('a rebuilding projection must not overwrite evidence: the ledger stays byte-identical across rebuilds', async () => {
  const { store, svc } = makeService();
  await svc.setGoal(OWNER, 'goal_1', 'c_algebra', 'Weekly goal');
  store.appendEvidence(`${OWNER.uid}|attempt|c_algebra|1`);
  store.appendEvidence(`${OWNER.uid}|assessed|c_algebra|pass`);
  const digestBefore = await store.evidenceDigest(OWNER);

  // Rebuild the plan twice — planning is read-only over evidence.
  await svc.buildDailyPlan(OWNER, TODAY);
  await svc.buildDailyPlan(OWNER, TODAY);

  const digestAfter = await store.evidenceDigest(OWNER);
  assert.equal(digestAfter, digestBefore, 'evidence untouched by plan rebuilds');
  assert.ok(await svc.evidenceUnchanged(OWNER, digestBefore));
});

test('plan versions append and never rewrite past versions', async () => {
  const { svc } = makeService(['c_algebra'], []);
  await svc.setGoal(OWNER, 'goal_1', 'c_algebra', 'Weekly goal');
  const v1 = await svc.buildDailyPlan(OWNER, TODAY);
  const v2 = await svc.buildDailyPlan(OWNER, TODAY);
  assert.equal(v1.version, 1);
  assert.equal(v2.version, 2, 'each rebuild appends the next version');

  const versions = await svc['store'].plansFor(OWNER, TODAY);
  assert.equal(versions.length, 2, 'both versions retained');
  assert.equal(versions[0].version, 1, 'earliest version unchanged');
  assert.deepEqual(versions[0].items, v1.items, 'v1 content byte-stable after v2 build');
});

test('review scheduling only from real due reasons; consumption-only or non-due concepts refused', async () => {
  const { svc } = makeService(['c_algebra', 'c_consumed'], [{ conceptId: 'c_algebra', reason: 'assessed_passed_refresh' }]);
  const review = await svc.scheduleReview(OWNER, 'c_algebra');
  assert.equal(review.conceptId, 'c_algebra');
  assert.equal(review.reason, 'assessed_passed_refresh', 'the reason travels from the projection');

  await assert.rejects(
    () => svc.scheduleReview(OWNER, 'c_consumed'),
    (e) => e instanceof DailyPlanError && e.code === 'review_not_due',
    'a concept with no due state (e.g. consumption only) is never scheduled',
  );
  await assert.rejects(
    () => svc.scheduleReview(OWNER, 'c_ghost'),
    (e) => e instanceof DailyPlanError && e.code === 'review_not_due',
  );
});

test('discovery returns only eligible released concepts, each with an understandable reason', async () => {
  const { svc } = makeService(['c_algebra', 'c_graphs']);
  const results = await svc.discover(OWNER, ['c_algebra', 'c_unreleased', 'c_graphs']);
  assert.deepEqual(results.map((r) => r.conceptId), ['c_algebra', 'c_graphs'], 'ineligible concepts filtered');
  for (const r of results) assert.match(r.reason, /Released source available/, 'every result explains why');
});

test('plans and reviews are owner-scoped: a stranger reads nothing of another learner', async () => {
  const { store, svc } = makeService(['c_algebra'], [{ conceptId: 'c_algebra', reason: 'self_review_follow_up' }]);
  await svc.setGoal(OWNER, 'goal_1', 'c_algebra', 'Weekly goal');
  await svc.buildDailyPlan(OWNER, TODAY);
  await svc.scheduleReview(OWNER, 'c_algebra');

  assert.equal((await store.plansFor(OTHER, TODAY)).length, 0);
  assert.equal((await store.reviewsFor(OTHER)).length, 0);
  assert.equal((await store.goalsFor(OTHER)).length, 0);
});
