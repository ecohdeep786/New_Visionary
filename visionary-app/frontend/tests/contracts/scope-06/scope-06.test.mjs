// SCOPE-06 (KAN-33) — executable frontend vertical-slice contract/deny cases.
//
// The synthetic vertical slice selected here is the existing fixture's
// fictional board 'Fictional framework' / sourceId 'book-fixture' version '1',
// language 'en', class 6 Mathematics — a clearly fictional, synthetic slice
// (final released-source selection remains KAN-29's founder decision).
//
// These are distinct frontend classroom-service scenarios, not the backend
// LearningController API or a shared wire-case matrix. They exercise local
// submission/replay/revision/class access and owning-store recovery.
// Preview/local fixtures are shape-and-flow evidence, not server
// authorization proof (v1 README boundary note).
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { storage, fixture, reset } from '../../fixtures/classCurriculum.mjs';
import * as w from '../../../src/services/workspaceService.ts';
import { submitClassworkResponses } from '../../../src/services/classroomService.js';

beforeEach(reset);

async function setup() {
  const f = await fixture();
  storage.set('visionary_session_token', f.learner.personId);
  return f;
}

const submissions = () => JSON.parse(storage.get('visionary_entity_Submission') || '[]');

test('SC06-01 positive: learner submit persists exactly one owning-store submission row', async () => {
  const f = await setup();
  const submission = await submitClassworkResponses(f.learner, { assignmentId: f.assignment.id, text: 'One half divides the whole equally.', selfReview: { parts: 'Two equal parts.' } });
  const rows = submissions();
  assert.equal(rows.length, 1);
  assert.equal(submission.id, rows[0].id);
  assert.equal(rows[0].status, 'submitted');
  assert.equal(rows[0].attempt || 1, 1);
  assert.equal(rows[0].assignment_id, f.assignment.id);
  assert.equal(rows[0].student_email, 'adult@visionary.test'); // the fixture's default learner persona
});

test('SC06-04 idempotent replay: the same response returns the retained submission with no duplicate row', async () => {
  const f = await setup();
  const first = await submitClassworkResponses(f.learner, { assignmentId: f.assignment.id, text: 'One half divides the whole equally.', selfReview: { parts: 'Two equal parts.' } });
  const replay = await submitClassworkResponses(f.learner, { assignmentId: f.assignment.id, text: 'One half divides the whole equally.', selfReview: { parts: 'Two equal parts.' } });
  assert.equal(replay.id, first.id);
  assert.equal(submissions().length, 1);
  assert.equal(submissions()[0].attempt || 1, 1);
});

test('SC06-06 changed payload under the same key conflicts; the retained submission is the recovery point', async () => {
  const f = await setup();
  const first = await submitClassworkResponses(f.learner, { assignmentId: f.assignment.id, text: 'One half divides the whole equally.', selfReview: { parts: 'Two equal parts.' } });
  await assert.rejects(
    () => submitClassworkResponses(f.learner, { assignmentId: f.assignment.id, text: 'A different answer under the same submission key.', selfReview: { parts: 'Two equal parts.' } }),
    /A different response is already submitted/,
  );
  const rows = submissions();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, first.id);
  // The retained submission keeps its original answer (the service appends
  // the assigned criterion self-review text); the changed payload never
  // replaced it.
  assert.ok(rows[0].text.startsWith('One half divides the whole equally.'));
  assert.ok(!rows[0].text.includes('A different answer'));
});

test('SC06-03 stale expected revision denies; the response is retained for recovery', async () => {
  const f = await setup();
  await assert.rejects(
    () => submitClassworkResponses(f.learner, { assignmentId: f.assignment.id, text: 'One half divides the whole equally.', selfReview: { parts: 'Two equal parts.' }, expectedRevision: 1 }),
    /The assigned content changed/,
  );
  assert.equal(submissions().length, 0); // nothing persisted from the stale command
});

test('frontend class-access deny: an authenticated outsider cannot submit; this is not a revoked-consent test', async () => {
  const f = await setup();
  // An authenticated learner with their own workspace, but NO enrollment in
  // this class — the enrollment boundary is what must deny here.
  const outsiderPersona = w.bootstrapPerson({ id: 'demo-outsider', email: 'outsider@visionary.test', identity: 'student' });
  const outsiderSpace = outsiderPersona.workspaces[0];
  const db = JSON.parse(storage.get('visionary_workspace_v2'));
  db.active['demo-outsider'] = outsiderSpace.id;
  storage.set('visionary_workspace_v2', JSON.stringify(db));
  const users = JSON.parse(storage.get('visionary_users'));
  users.push({ id: 'demo-outsider', email: 'outsider@visionary.test', identity: 'student', roles: ['student'], age_band: outsiderPersona.person.ageBand, onboarding_complete: true });
  storage.set('visionary_users', JSON.stringify(users));
  const sessions = JSON.parse(storage.get('visionary_sessions'));
  sessions.push({ token: 'demo-outsider', userId: 'demo-outsider', email: 'outsider@visionary.test', expiresAt: Date.now() + 86400000 });
  storage.set('visionary_sessions', JSON.stringify(sessions));
  storage.set('visionary_session_token', 'demo-outsider');
  const outsider = { personId: 'demo-outsider', workspaceId: outsiderSpace.id, role: 'student', locale: 'en' };
  // The class-scoping boundary denies first: the assignment is not open for
  // submissions to learners outside its class (the enrollment check sits
  // behind this gate in the service).
  await assert.rejects(
    () => submitClassworkResponses(outsider, { assignmentId: f.assignment.id, text: 'I am not enrolled.' }),
    /not open for submissions in your class/,
  );
  assert.equal(submissions().length, 0);
  // The class and assignment records are untouched by the denied command.
  const classroomRows = JSON.parse(storage.get('visionary_entity_Classroom'));
  assert.equal(classroomRows.length, 1);
});
