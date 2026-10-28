/**
 * ROLE-03 (KAN-95) — immutable submission copies, duplicate-safe submit,
 * teacher draft/release/return/request-revision and retained attempt/feedback
 * history; no silent resubmission replacement.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { SubmissionsService } = req('./dist/src/submissions/submissions-service.js');
const { InMemorySubmissionsStore } = req('./dist/src/submissions/submissions-lookups.js');

const TEACHER = { uid: 'uid_teacher_1', workspaceId: 'ws_school' };
const LEARNER = { uid: 'uid_learner_1', workspaceId: 'ws_school' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_school' };

async function makeService() {
  const store = new InMemorySubmissionsStore();
  const service = new SubmissionsService(store);
  store.seedAssignment('asg_1', 1, 'cls_1', TEACHER, true);
  store.seedEnrollment('cls_1', LEARNER.uid);
  return { store, service };
}

function submitInput(overrides = {}) {
  return { assignmentId: 'asg_1', version: 1, response: { type: 'text', value: 'answer v1' }, ...overrides };
}

// ---------------------------------------------------------------------------

test('immutable copies: a resubmission WITHOUT a teacher revision request refuses; the first attempt stays byte-stable', async () => {
  const { store, service } = await makeService();
  const first = await service.submit(LEARNER, submitInput());
  assert.equal(first.attemptNo, 1);
  await assert.rejects(
    () => service.submit(LEARNER, submitInput({ response: { type: 'text', value: 'silent replacement' } })),
    (e) => e.code === 'revision_not_requested',
  );
  const history = await store.attempts('asg_1', 1, LEARNER.uid);
  assert.equal(history.length, 1);
  assert.equal(JSON.stringify(history[0]), JSON.stringify(first));
});

test('after a teacher request-revision the resubmission creates attempt 2; attempt 1 is unchanged; the bound is enforced', async () => {
  const { service } = await makeService();
  const first = await service.submit(LEARNER, submitInput());
  await service.saveDraftGrade(TEACHER, first.attemptId, 4, 'needs work on part 2');
  const { grade, grantedAttempts } = await service.requestRevision(TEACHER, first.attemptId, 'fix part 2 and resubmit');
  assert.equal(grantedAttempts, 2);
  assert.equal(grade.status, 'revision_requested');
  const second = await service.submit(LEARNER, submitInput({ response: { type: 'text', value: 'answer v1 improved' } }));
  assert.equal(second.attemptNo, 2);
  assert.equal(second.answersRevisionNo, 1);
  // The bound: attempt 3 needs ANOTHER revision request.
  await assert.rejects(
    () => service.submit(LEARNER, submitInput({ response: { type: 'text', value: 'unbounded' } })),
    (e) => e.code === 'attempt_bound_exceeded',
  );
  const history = await service.learnerHistory(LEARNER, 'asg_1', 1);
  assert.equal(history.length, 2);
  assert.equal(JSON.stringify(history[0].attempt), JSON.stringify(first));
});

test('duplicate-safe submit: the same idempotency key converges to the SAME attempt (first wins); no double records', async () => {
  const { store, service } = await makeService();
  const key = 'client-op-42';
  const a = await service.submit(LEARNER, submitInput({ idempotencyKey: key }));
  const b = await service.submit(LEARNER, submitInput({ idempotencyKey: key, response: { type: 'text', value: 'retry payload' } }));
  assert.equal(b.attemptId, a.attemptId);
  assert.equal(b.response.value, 'answer v1');
  assert.equal((await store.attempts('asg_1', 1, LEARNER.uid)).length, 1);
});

test('teacher grading lifecycle: mutable draft → release → immutable; returned feedback becomes visible', async () => {
  const { service } = await makeService();
  const first = await service.submit(LEARNER, submitInput());
  await service.saveDraftGrade(TEACHER, first.attemptId, 5, 'good');
  const redrafted = await service.saveDraftGrade(TEACHER, first.attemptId, 6, 'good, adjusted');
  assert.equal(redrafted.score, 6);
  const released = await service.releaseGrade(TEACHER, first.attemptId);
  assert.equal(released.status, 'released');
  await assert.rejects(
    () => service.saveDraftGrade(TEACHER, first.attemptId, 9, 'tamper'),
    (e) => e.code === 'grade_released_immutable',
  );
  await assert.rejects(
    () => service.releaseGrade(TEACHER, first.attemptId),
    (e) => e.code === 'grade_released_immutable',
  );
  const returned = await service.returnGrade(TEACHER, first.attemptId);
  assert.equal(returned.status, 'returned');
  // The learner now sees the returned feedback; before that it was hidden.
  const history = await service.learnerHistory(LEARNER, 'asg_1', 1);
  assert.equal(history[0].feedbackVisible, true);
  assert.equal(history[0].grade.score, 6);
});

test('feedback is hidden from the learner until returned/revision_requested', async () => {
  const { service } = await makeService();
  const first = await service.submit(LEARNER, submitInput());
  await service.saveDraftGrade(TEACHER, first.attemptId, 3, 'draft notes');
  let history = await service.learnerHistory(LEARNER, 'asg_1', 1);
  assert.equal(history[0].feedbackVisible, false);
  assert.equal(history[0].grade, null);
  await service.releaseGrade(TEACHER, first.attemptId);
  history = await service.learnerHistory(LEARNER, 'asg_1', 1);
  assert.equal(history[0].feedbackVisible, false);
  await service.returnGrade(TEACHER, first.attemptId);
  history = await service.learnerHistory(LEARNER, 'asg_1', 1);
  assert.equal(history[0].feedbackVisible, true);
});

test('authority: wrong learner/teacher denials are uniform and leak nothing', async () => {
  const { service } = await makeService();
  const first = await service.submit(LEARNER, submitInput());
  // A stranger learner sees no attempts (uniform not_owner, no leak).
  await assert.rejects(
    () => service.learnerHistory(STRANGER, 'asg_1', 1),
    (e) => e.code === 'not_owner',
  );
  // A same-workspace non-teacher cannot grade: role denial.
  await assert.rejects(
    () => service.saveDraftGrade(STRANGER, first.attemptId, 1, 'nope'),
    (e) => e.code === 'not_class_teacher',
  );
  // A foreign-workspace "teacher": uniform not_owner.
  await assert.rejects(
    () => service.saveDraftGrade({ uid: TEACHER.uid, workspaceId: 'ws_other' }, first.attemptId, 1, 'nope'),
    (e) => e.code === 'not_owner',
  );
  // Closed/unpublished assignment gate refuses submissions.
  const { service: closed } = await makeService();
  await assert.rejects(
    () => closed.submit(LEARNER, submitInput({ assignmentId: 'asg_missing' })),
    (e) => e.code === 'not_owner',
  );
});

test('unenrolled learners cannot submit; the teacher sees the full retained history', async () => {
  const { store, service } = await makeService();
  await service.submit(LEARNER, submitInput());
  const secondLearner = { uid: 'uid_learner_2', workspaceId: 'ws_school' };
  await assert.rejects(
    () => service.submit(secondLearner, submitInput()),
    (e) => e.code === 'not_enrolled',
  );
  const all = await service.teacherHistory(TEACHER, 'asg_1', 1);
  assert.equal(all.length, 1);
  assert.equal(all[0].learnerUid, LEARNER.uid);
  await assert.rejects(
    () => service.teacherHistory(STRANGER, 'asg_1', 1),
    (e) => e.code === 'not_class_teacher',
  );
  void store;
});
