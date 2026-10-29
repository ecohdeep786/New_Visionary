/**
 * ROLE-10 (KAN-160) — teachers' private ongoing subject/pedagogy learning and
 * evidence-based coaching. Privacy/employment/work boundary contracts:
 *   - explicit personal goals from CURRENTLY-PERMITTED class summaries only;
 *   - personal learning separate from class preparation/learner reports/org
 *     employment (workspace/ownership separation, uniform no-leak refusal);
 *   - scoped assessed practice / teach-back-Build / reflection checkpoints;
 *   - NO random tips: an accepted connected adapter gives evidence-based
 *     suggestions; otherwise an authored, clearly-generic suggestion;
 *   - understandable reasons + manual correction;
 *   - revocation / changed employment / two-device resume;
 *   - no inferred teaching-quality ranking, credential or private-learner-doubt
 *     disclosure.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));
const { CoachingService } = req('./dist/src/coaching/coaching-service.js');
const { InMemoryCoachingStore } = req('./dist/src/coaching/coaching-lookups.js');

const TEACHER = { uid: 'uid_teacher_1', workspaceId: 'ws_personal' };
const OTHER = { uid: 'uid_teacher_2', workspaceId: 'ws_personal' };
const CLASS_SUMMARY = 'class_7_math_summary_v3';

function makeService(accepted = false) {
  const store = new InMemoryCoachingStore();
  store.seedClassSummary(TEACHER.uid, CLASS_SUMMARY);
  store.setConnectedAdapterAccepted(accepted);
  const service = new CoachingService(store);
  return { store, service };
}

// ---------------------------------------------------------------------------

test('EXPLICIT personal goals require a CURRENTLY-PERMITTED class summary', async () => {
  const { store, service } = makeService();
  // A summary not seeded for this teacher refuses.
  await assert.rejects(
    () => service.createGoal(TEACHER, 'subject', 'fractions mastery', 'class_other_math'),
    (e) => e.code === 'class_summary_not_permitted',
  );
  // A permitted summary creates the goal, which records the explicit choice.
  const goal = await service.createGoal(TEACHER, 'subject', 'fractions mastery', CLASS_SUMMARY);
  assert.equal(goal.status, 'active');
  assert.equal(goal.chosenClassSummary, CLASS_SUMMARY);
  assert.equal(goal.owner.uid, TEACHER.uid);
  void store;
});

test('PERSONAL learning is separated from class prep / org employment: workspace + ownership boundaries, uniform no-leak refusal', async () => {
  const { service } = makeService();
  const goal = await service.createGoal(TEACHER, 'subject', 'fractions mastery', CLASS_SUMMARY);
  // Another teacher (different uid) cannot read/revise/revoke — uniform not_owner.
  await assert.rejects(() => service.addCheckpoint(OTHER, goal.goalId, 'reflection', 'reflected'), (e) => e.code === 'not_owner');
  await assert.rejects(() => service.revokeGoal(OTHER, goal.goalId), (e) => e.code === 'not_owner');
  await assert.rejects(() => service.resumeCoach(OTHER, goal.goalId), (e) => e.code === 'not_owner');
  // Same teacher, but a CLASS-preparation workspace is a different scope.
  const classWorkspace = { uid: TEACHER.uid, workspaceId: 'ws_class_7' };
  await assert.rejects(() => service.resumeCoach(classWorkspace, goal.goalId), (e) => e.code === 'workspace_mismatch');
});

test('SCOPED checkpoints: assessed practice / teach-back-Build / reflection against the explicit goal; private-learner-doubt content refuses', async () => {
  const { service } = makeService();
  const goal = await service.createGoal(TEACHER, 'pedagogy', 'questioning technique', CLASS_SUMMARY);
  const practice = await service.addCheckpoint(TEACHER, goal.goalId, 'assessed_practice', '6 students attempted; 4 corrected', 'chk_evidence_1');
  assert.equal(practice.kind, 'assessed_practice');
  const build = await service.addCheckpoint(TEACHER, goal.goalId, 'teachback_build', 'retold the worked example in own words');
  assert.equal(build.kind, 'teachback_build');
  const reflect = await service.addCheckpoint(TEACHER, goal.goalId, 'reflection', 'confident about the extension; need more reps on the base');
  assert.equal(reflect.kind, 'reflection');
  // Private learner doubt disclosure refuses (no leak).
  await assert.rejects(
    () => service.addCheckpoint(TEACHER, goal.goalId, 'reflection', 'this learner revealed a doubt I should not share'),
    (e) => e.code === 'private_learner_doubt_forbidden',
  );
});

test('NO RANDOM TIPS with an accepted adapter: evidence-based suggestion cites the currently-permitted summary and carries a reason', async () => {
  const { service } = makeService(true);
  const goal = await service.createGoal(TEACHER, 'subject', 'fractions mastery', CLASS_SUMMARY);
  await service.addCheckpoint(TEACHER, goal.goalId, 'assessed_practice', '2 of 3 correct on fraction addition');
  const suggestion = await service.suggest(TEACHER, goal.goalId);
  assert.equal(suggestion.source, 'connected_adapter');
  assert.ok(suggestion.body.includes('fractions mastery'));
  assert.ok(suggestion.reason.includes(CLASS_SUMMARY));
  assert.ok(suggestion.reason.length > 0); // understandable reason
});

test('NO RANDOM TIPS without an accepted adapter: an authored, clearly-generic suggestion is produced (never a random tip)', async () => {
  const { service } = makeService(false);
  const goal = await service.createGoal(TEACHER, 'subject', 'fractions mastery', CLASS_SUMMARY);
  await service.addCheckpoint(TEACHER, goal.goalId, 'assessed_practice', '2 of 3 correct');
  const suggestion = await service.suggest(TEACHER, goal.goalId);
  assert.equal(suggestion.source, 'generic_authored');
  assert.ok(suggestion.body.toLowerCase().includes('generic'));
  assert.ok(suggestion.body.toLowerCase().includes('not a personalized recommendation'));
  // Unavailable evidence yields the same authored, clearly-generic suggestion.
  const noEvGoal = await service.createGoal(TEACHER, 'pedagogy', 'questioning technique', CLASS_SUMMARY);
  const generic = await service.suggest(TEACHER, noEvGoal.goalId);
  assert.equal(generic.source, 'generic_authored');
  assert.ok(generic.body.toLowerCase().includes('generic'));
  // The reason is always present and understandable.
  assert.ok(generic.reason.length > 0);
});

test('NO INFERRED teaching-quality ranking or credential is ever produced', async () => {
  const { service } = makeService(true);
  const goal = await service.createGoal(TEACHER, 'subject', 'fractions mastery', CLASS_SUMMARY);
  await service.addCheckpoint(TEACHER, goal.goalId, 'assessed_practice', '2 of 3 correct');
  const suggestion = await service.suggest(TEACHER, goal.goalId);
  const flat = JSON.stringify(suggestion).toLowerCase();
  assert.ok(!flat.includes('rank'));
  assert.ok(!flat.includes('credential'));
  assert.ok(!flat.includes('qualified_teacher'));
  assert.ok(!flat.includes('teaching_quality'));
});

test('MANUAL correction: the teacher corrects a suggestion (append-only, marked corrected)', async () => {
  const { service } = makeService(false);
  const goal = await service.createGoal(TEACHER, 'subject', 'fractions mastery', CLASS_SUMMARY);
  const suggestion = await service.suggest(TEACHER, goal.goalId);
  const corrected = await service.correctSuggestion(TEACHER, suggestion.suggestionId, 'Actually focus on denominator equivalence first.');
  assert.equal(corrected.corrected, true);
  assert.equal(corrected.body, 'Actually focus on denominator equivalence first.');
  // A different teacher cannot correct.
  await assert.rejects(
    () => service.correctSuggestion(OTHER, suggestion.suggestionId, 'mine'),
    (e) => e.code === 'not_owner',
  );
});

test('REVOCATION: revoking the goal makes further coaching refuse (goal_revoked)', async () => {
  const { service } = makeService(true);
  const goal = await service.createGoal(TEACHER, 'subject', 'fractions mastery', CLASS_SUMMARY);
  const revoked = await service.revokeGoal(TEACHER, goal.goalId);
  assert.equal(revoked.status, 'revoked');
  await assert.rejects(() => service.addCheckpoint(TEACHER, goal.goalId, 'reflection', 'x'), (e) => e.code === 'goal_revoked');
  await assert.rejects(() => service.suggest(TEACHER, goal.goalId), (e) => e.code === 'goal_revoked');
});

test('CHANGED EMPLOYMENT / revoked summary: coaching refuses class_summary_not_permitted and never reuses the old summary', async () => {
  const { store, service } = makeService(true);
  const goal = await service.createGoal(TEACHER, 'subject', 'fractions mastery', CLASS_SUMMARY);
  // Employment/summary permission revoked after the goal is created.
  store.revokeClassSummary(TEACHER.uid, CLASS_SUMMARY);
  await assert.rejects(
    () => service.addCheckpoint(TEACHER, goal.goalId, 'assessed_practice', 'x'),
    (e) => e.code === 'class_summary_not_permitted',
  );
  // The suggestion, too, refuses rather than reusing the old summary.
  await assert.rejects(() => service.suggest(TEACHER, goal.goalId), (e) => e.code === 'class_summary_not_permitted');
});

test('TWO-DEVICE resume: two controllers over the same store observe the identical byte-stable history', async () => {
  const { store, service } = makeService(true);
  const goal = await service.createGoal(TEACHER, 'subject', 'fractions mastery', CLASS_SUMMARY);
  await service.addCheckpoint(TEACHER, goal.goalId, 'assessed_practice', '2 of 3 correct');
  await service.suggest(TEACHER, goal.goalId);
  const deviceA = await service.resumeCoach(TEACHER, goal.goalId);
  // Second controller (fresh service instance over the SAME store) resumes identically.
  const store2 = store;
  const service2 = new CoachingService(store2);
  const deviceB = await service2.resumeCoach(TEACHER, goal.goalId);
  assert.equal(deviceA.digest, deviceB.digest);
  assert.deepEqual(deviceA.journal.map((j) => j.entryType), deviceB.journal.map((j) => j.entryType));
});

test('INDEPENDENT review: append-only journal is readable for teacher-usefulness/outcome review', async () => {
  const { service } = makeService(false);
  const goal = await service.createGoal(TEACHER, 'subject', 'fractions mastery', CLASS_SUMMARY);
  await service.addCheckpoint(TEACHER, goal.goalId, 'reflection', 'reflected');
  await service.suggest(TEACHER, goal.goalId);
  const journal = await service.reviewJournal(TEACHER, goal.goalId);
  const types = journal.map((j) => j.entryType);
  assert.ok(types.includes('goal_created'));
  assert.ok(types.includes('checkpoint'));
  assert.ok(types.includes('suggestion'));
  // Another teacher cannot read the journal.
  await assert.rejects(() => service.reviewJournal(OTHER, goal.goalId), (e) => e.code === 'not_owner');
});
