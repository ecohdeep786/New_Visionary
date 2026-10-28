/**
 * ROLE-08 (KAN-100) — released role screens bind through the membership gate:
 * pending/expired/revoked states tested while reads/writes/jobs are in
 * flight, across released categories/languages, consistent on two devices.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { RoleAccessController } from '../src/services/roleScreenAdapters.ts';

const MEMBER = 'uid_learner_1|cls_1';

test('released role screens register; an unregistered role/locale refuses', () => {
  const controller = new RoleAccessController();
  controller.registerRoleScreen({ role: 'learner', surface: 'classroom', locale: 'en-IN' });
  assert.equal(controller.isRegistered('learner', 'classroom', 'en-IN'), true);
  // An unreleased locale cannot register.
  assert.throws(
    () => controller.registerRoleScreen({ role: 'learner', surface: 'classroom', locale: 'fr' }),
    (e) => e.code === 'role_screen_unregistered',
  );
});

test('PENDING membership: no data access — reads, writes and jobs all refuse', () => {
  const controller = new RoleAccessController();
  controller.applyMembershipEvent(MEMBER, 'pending');
  assert.throws(
    () => controller.beginOperation(MEMBER, 'classroom', 'read', 'en-IN'),
    (e) => e.code === 'membership_pending',
  );
  assert.throws(
    () => controller.beginOperation(MEMBER, 'classroom', 'write', 'en-IN'),
    (e) => e.code === 'membership_pending',
  );
  assert.throws(
    () => controller.beginOperation(MEMBER, 'classroom', 'job', 'en-IN'),
    (e) => e.code === 'membership_pending',
  );
});

test('ACTIVE membership: reads, writes and jobs flow', () => {
  const controller = new RoleAccessController();
  controller.applyMembershipEvent(MEMBER, 'active');
  const read = controller.beginOperation(MEMBER, 'classroom', 'read', 'en-IN');
  const write = controller.beginOperation(MEMBER, 'classroom', 'write', 'en-IN');
  const job = controller.beginOperation(MEMBER, 'classroom', 'job', 'en-IN');
  assert.ok(read.opId && write.opId && job.opId);
  assert.equal(controller.inFlightOperations().length, 3);
  controller.completeOperation(read.opId);
  controller.completeOperation(write.opId);
  controller.completeOperation(job.opId);
  assert.equal(controller.inFlightOperations().length, 0);
});

test('EXPIRED membership: new writes and jobs refuse; the renewal read still works', () => {
  const controller = new RoleAccessController();
  controller.applyMembershipEvent(MEMBER, 'expired');
  assert.throws(
    () => controller.beginOperation(MEMBER, 'classroom', 'write', 'en-IN'),
    (e) => e.code === 'membership_expired',
  );
  assert.throws(
    () => controller.beginOperation(MEMBER, 'classroom', 'job', 'en-IN'),
    (e) => e.code === 'membership_expired',
  );
  const read = controller.beginOperation(MEMBER, 'classroom', 'read', 'en-IN');
  controller.completeOperation(read.opId);
});

test('REVOKED mid-flight: in-flight operations abort as honest partials and everything further refuses', () => {
  const controller = new RoleAccessController();
  controller.applyMembershipEvent(MEMBER, 'active');
  const read = controller.beginOperation(MEMBER, 'classroom', 'read', 'en-IN');
  const write = controller.beginOperation(MEMBER, 'classroom', 'write', 'en-IN');
  const job = controller.beginOperation(MEMBER, 'classroom', 'job', 'en-IN');
  void read; void write; void job;
  const aborted = controller.revokeMidFlight(MEMBER);
  assert.equal(aborted.length, 3);
  assert.ok(aborted.every((r) => r.outcome === 'aborted_partial'));
  assert.equal(controller.inFlightOperations().length, 0);
  assert.throws(
    () => controller.beginOperation(MEMBER, 'classroom', 'read', 'en-IN'),
    (e) => e.code === 'membership_revoked',
  );
  // Re-activation is a fresh feed event.
  controller.applyMembershipEvent(MEMBER, 'active');
  const resumed = controller.beginOperation(MEMBER, 'classroom', 'read', 'en-IN');
  controller.completeOperation(resumed.opId);
});

test('TWO DEVICES: the same membership event moves both controllers consistently; other state stays per-device', () => {
  const deviceA = new RoleAccessController();
  const deviceB = new RoleAccessController();
  for (const controller of [deviceA, deviceB]) {
    controller.registerRoleScreen({ role: 'learner', surface: 'classroom', locale: 'en-IN' });
    controller.applyMembershipEvent(MEMBER, 'active');
  }
  // The same feed event applied to both devices moves both to revoked.
  for (const controller of [deviceA, deviceB]) {
    controller.applyMembershipEvent(MEMBER, 'revoked');
  }
  for (const controller of [deviceA, deviceB]) {
    assert.equal(controller.stateOf(MEMBER), 'revoked');
    assert.throws(
      () => controller.beginOperation(MEMBER, 'classroom', 'read', 'en-IN'),
      (e) => e.code === 'membership_revoked',
    );
  }
  // A membership state set only on device A stays per-device.
  deviceA.applyMembershipEvent(MEMBER, 'active');
  assert.equal(deviceA.stateOf(MEMBER), 'active');
  assert.equal(deviceB.stateOf(MEMBER), 'revoked');
});

test('RELEASED categories/languages: the gate behaves identically across released locales', () => {
  const controller = new RoleAccessController();
  controller.registerRoleScreen({ role: 'teacher', surface: 'classroom', locale: 'en-IN' });
  controller.registerRoleScreen({ role: 'teacher', surface: 'classroom', locale: 'bn' });
  controller.applyMembershipEvent('uid_teacher_1|cls_1', 'active');
  const en = controller.beginOperation('uid_teacher_1|cls_1', 'classroom', 'write', 'en-IN');
  const bn = controller.beginOperation('uid_teacher_1|cls_1', 'classroom', 'write', 'bn');
  controller.completeOperation(en.opId);
  controller.completeOperation(bn.opId);
  // An unreleased locale refuses regardless of membership.
  assert.throws(
    () => controller.beginOperation('uid_teacher_1|cls_1', 'classroom', 'write', 'fr'),
    (e) => e.code === 'role_screen_unregistered',
  );
});
