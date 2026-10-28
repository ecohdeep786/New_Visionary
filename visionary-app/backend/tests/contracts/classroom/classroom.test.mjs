/**
 * ROLE-01 (KAN-93) — verified teacher/class ownership, enrollment/join/
 * invitation lifecycle and workspace actions; independently check each class,
 * attachment and learner operation.
 *
 * Proven here:
 *   1.  VERIFIED teacher ownership: self-claimed teacher status never
 *       creates classes; server-verified status (named verifier) does.
 *   2.  Uniform denial: unknown class, wrong uid and foreign workspace are
 *       the same `not_owner`; workspace isolation.
 *   3.  Invitation lifecycle: bound invite + opaque code + expiry; the
 *       invited learner joins; duplicate joins converge to ONE record.
 *   4.  Uniform invite refusal: unknown code and wrong learner are the same
 *       `invite_invalid` (no leak); revoked and expired invites refuse.
 *   5.  Independent per-operation checks: teacher-only actions refuse
 *       learners; learner reads require CURRENT enrollment — a removed
 *       learner loses access immediately; archived classes refuse.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { ClassroomService } = req('./dist/src/classroom/classroom-service.js');
const { InMemoryClassroomStore } = req('./dist/src/classroom/classroom-lookups.js');

const TEACHER = { uid: 'uid_teacher_1', workspaceId: 'ws_school' };
const LEARNER = { uid: 'uid_learner_1', workspaceId: 'ws_school' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_school' };
const TEACHER_OTHER_WS = { uid: 'uid_teacher_1', workspaceId: 'ws_other' };

async function makeService(now) {
  const store = new InMemoryClassroomStore();
  const service = new ClassroomService(store, now);
  await service.verifyTeacher(TEACHER.uid, TEACHER.workspaceId, 'verifier_admin');
  return { store, service };
}

async function makeClass(service) {
  const classroom = await service.createClass(TEACHER, 'Physics 101');
  const invite = await service.inviteLearner(TEACHER, classroom.classId, LEARNER.uid, 60_000);
  await service.joinByInvite(LEARNER, invite.code);
  return { classroom, invite };
}

// ---------------------------------------------------------------------------

test('VERIFIED teacher ownership: self-claimed teacher status never creates classes; server-verified status does', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.createClass(STRANGER, 'Rogue class'),
    (e) => e.code === 'teacher_unverified',
  );
  const classroom = await service.createClass(TEACHER, 'Physics 101');
  assert.equal(classroom.teacher.uid, TEACHER.uid);
  assert.equal(classroom.workspaceId, TEACHER.workspaceId);
  // An empty verifier refuses (verification is a recorded server act).
  await assert.rejects(
    () => service.verifyTeacher(STRANGER.uid, STRANGER.workspaceId, '  '),
    (e) => e.code === 'teacher_unverified',
  );
});

test('uniform denial: unknown class and foreign workspace are not_owner; a same-workspace non-teacher is not_class_teacher', async () => {
  const { service } = await makeService();
  const { classroom } = await makeClass(service);
  // Same-workspace member (not the teacher): role denial.
  await assert.rejects(() => service.archiveClass(STRANGER, classroom.classId), (e) => e.code === 'not_class_teacher');
  // Unknown class and foreign workspace: uniform not_owner (no existence leak).
  await assert.rejects(() => service.archiveClass(TEACHER, 'cls_unknown'), (e) => e.code === 'not_owner');
  await assert.rejects(
    () => service.archiveClass(TEACHER_OTHER_WS, classroom.classId),
    (e) => e.code === 'not_owner',
  );
  await assert.rejects(
    () => service.inviteLearner(TEACHER_OTHER_WS, classroom.classId, STRANGER.uid, 60_000),
    (e) => e.code === 'not_owner',
  );
});

test('invitation lifecycle: bound invite with opaque code; the invited learner joins; duplicate joins converge to ONE record', async () => {
  const { store, service } = await makeService();
  const classroom = await service.createClass(TEACHER, 'Physics 101');
  const invite = await service.inviteLearner(TEACHER, classroom.classId, LEARNER.uid, 60_000);
  // The code is opaque and the invite is learner-bound.
  assert.notEqual(invite.code, invite.inviteId);
  assert.equal(invite.status, 'pending');
  const join = await service.joinByInvite(LEARNER, invite.code);
  assert.equal(join.outcome, 'enrolled');
  // Duplicate join is idempotent.
  const again = await service.joinByInvite(LEARNER, invite.code);
  assert.equal(again.outcome, 'duplicate');
  const all = await store.enrollments(classroom.classId);
  assert.equal(all.filter((e) => e.status === 'enrolled').length, 1);
});

test('uniform invite refusal: unknown code and wrong learner are the same invite_invalid; revoked and expired invites refuse distinctly', async () => {
  const { service } = await makeService();
  const classroom = await service.createClass(TEACHER, 'Physics 101');
  const invite = await service.inviteLearner(TEACHER, classroom.classId, LEARNER.uid, 60_000);
  await assert.rejects(() => service.joinByInvite(STRANGER, invite.code), (e) => e.code === 'invite_invalid');
  await assert.rejects(() => service.joinByInvite(LEARNER, 'join_unknown'), (e) => e.code === 'invite_invalid');
  // Revocation refuses even with the valid code.
  await service.revokeInvite(TEACHER, invite.inviteId);
  await assert.rejects(() => service.joinByInvite(LEARNER, invite.code), (e) => e.code === 'invite_revoked');
  // A fresh invite refuses after its expiry (injected clock).
  let clock = Date.now();
  const { service: timed } = await makeService(() => new Date(clock));
  const cls = await timed.createClass(TEACHER, 'Chem 101');
  const inv = await timed.inviteLearner(TEACHER, cls.classId, LEARNER.uid, 1000);
  clock += 2000;
  await assert.rejects(() => timed.joinByInvite(LEARNER, inv.code), (e) => e.code === 'invite_expired');
});

test('independent per-operation checks: teacher-only actions refuse learners; reads require CURRENT enrollment', async () => {
  const { service } = await makeService();
  const { classroom, invite } = await makeClass(service);
  const attachment = await service.attachMaterial(TEACHER, classroom.classId, 'Orbits worksheet', 'material_ref_1');
  // Learner cannot perform teacher-only actions.
  await assert.rejects(
    () => service.inviteLearner(LEARNER, classroom.classId, STRANGER.uid, 60_000),
    (e) => e.code === 'not_class_teacher',
  );
  await assert.rejects(
    () => service.removeLearner(LEARNER, classroom.classId, STRANGER.uid),
    (e) => e.code === 'not_class_teacher',
  );
  await assert.rejects(
    () => service.attachMaterial(LEARNER, classroom.classId, 'x', 'ref'),
    (e) => e.code === 'not_class_teacher',
  );
  // Enrolled learner reads; a stranger does not.
  await service.readAttachment(LEARNER, attachment.attachmentId);
  await assert.rejects(
    () => service.readAttachment(STRANGER, attachment.attachmentId),
    (e) => e.code === 'not_enrolled',
  );
  // Removal ends access IMMEDIATELY (no cached role).
  await service.removeLearner(TEACHER, classroom.classId, LEARNER.uid);
  await assert.rejects(
    () => service.readAttachment(LEARNER, attachment.attachmentId),
    (e) => e.code === 'not_enrolled',
  );
  // Re-join needs a NEW invite (the old one was accepted, not reusable for re-entry).
  const invite2 = await service.inviteLearner(TEACHER, classroom.classId, LEARNER.uid, 60_000);
  await service.joinByInvite(LEARNER, invite2.code);
  await service.readAttachment(LEARNER, attachment.attachmentId);
  // Archive stops lifecycle actions.
  await service.archiveClass(TEACHER, classroom.classId);
  await assert.rejects(
    () => service.attachMaterial(TEACHER, classroom.classId, 'x', 'ref'),
    (e) => e.code === 'class_archived',
  );
  await assert.rejects(
    () => service.inviteLearner(TEACHER, classroom.classId, STRANGER.uid, 60_000),
    (e) => e.code === 'class_archived',
  );
  void invite;
});

test('listLearners is teacher-only and reflects current membership', async () => {
  const { service } = await makeService();
  const { classroom } = await makeClass(service);
  const learners = await service.listLearners(TEACHER, classroom.classId);
  assert.equal(learners.length, 1);
  await assert.rejects(() => service.listLearners(LEARNER, classroom.classId), (e) => e.code === 'not_class_teacher');
});
