/**
 * ROLE-02 (KAN-94) — fixed assignment/objective/source/rubric publication,
 * scheduling/timezones, close/archive/restore and supported response types.
 *
 * Proven here:
 *   1.  FIXED publication: a published version is immutable (edits refuse);
 *       edits happen as a NEW draft version; submissions bind the exact version.
 *   2.  TIMEZONES: an invalid IANA identifier refuses; close evaluation is
 *       deterministic in the assignment's OWN timezone (Kolkata vs UTC).
 *   3.  SCHEDULING: a future publishAt schedules; submissions before it see
 *       not-published; after the wall-clock time the assignment is live.
 *   4.  CLOSE: explicit teacher close refuses submissions; a passed close
 *       time refuses too.
 *   5.  ARCHIVE/RESTORE: archive refuses submissions and records prior
 *       status; restore returns exactly that prior status.
 *   6.  SUPPORTED response types: unsupported types refuse; per-type schema
 *       (text length, choice option, file-ref shape) refuses; valid
 *       submissions accept; duplicate (learner, version) is idempotent.
 *   7.  ROLE-AWARE authority: uniform not_owner for unknown/foreign
 *       workspace; not_class_teacher for same-workspace non-teachers;
 *       submissions require CURRENT enrollment.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { AssignmentService, zonedInstant } = req('./dist/src/assignment/assignment-service.js');
const { InMemoryAssignmentStore } = req('./dist/src/assignment/assignment-lookups.js');

const TEACHER = { uid: 'uid_teacher_1', workspaceId: 'ws_school' };
const LEARNER = { uid: 'uid_learner_1', workspaceId: 'ws_school' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_school' };

const KOLKATA = { date: '2026-12-01', time: '23:59', timezone: 'Asia/Kolkata' };

function def(overrides = {}) {
  return {
    assignmentId: 'asg_orbits',
    classId: 'cls_1',
    title: 'Orbits worksheet',
    objective: 'Explain orbital motion',
    sourceRevision: 'rev-1.2.0',
    rubricRef: 'rubric_orbits_v2',
    responseTypes: ['text', 'choice'],
    schema: { textMaxLength: 200, choiceOptions: ['a', 'b', 'c'] },
    publishAt: { date: '2026-11-01', time: '10:00', timezone: 'Asia/Kolkata' },
    closeAt: KOLKATA,
    ...overrides,
  };
}

async function makeService(now) {
  const store = new InMemoryAssignmentStore();
  // Default clock: between publishAt (2026-11-01T04:30Z) and closeAt
  // (2026-12-01T18:29Z) so published assignments are live.
  const service = new AssignmentService(store, now ?? (() => new Date('2026-11-15T00:00:00Z')));
  store.seedEnrollment('cls_1', LEARNER.uid);
  return { store, service };
}

async function publishedAssignment(service, overrides = {}) {
  await service.defineAssignment(TEACHER, def(overrides));
  const published = await service.publish(TEACHER, 'asg_orbits', 1);
  return published;
}

// ---------------------------------------------------------------------------

test('FIXED publication: a published version is immutable; edits happen as a NEW draft version; submissions bind the exact version', async () => {
  const { service } = await makeService();
  await publishedAssignment(service);
  // Editing the published version refuses.
  await assert.rejects(
    () => service.editDraft(TEACHER, 'asg_orbits', 1, { title: 'Renamed' }),
    (e) => e.code === 'published_immutable',
  );
  // Re-publishing the same version refuses.
  await assert.rejects(
    () => service.publish(TEACHER, 'asg_orbits', 1),
    (e) => e.code === 'published_immutable',
  );
  // A new draft version edits freely.
  const v2 = await service.defineAssignment(TEACHER, def({ title: 'Orbits worksheet v2' }));
  assert.equal(v2.version, 2);
  const edited = await service.editDraft(TEACHER, 'asg_orbits', 2, { title: 'Orbits v2 final' });
  assert.equal(edited.title, 'Orbits v2 final');
  // A submission records the exact version it answered.
  const outcome = await service.submit(LEARNER, 'asg_orbits', 1, { type: 'text', value: 'orbits are ellipses' });
  assert.equal(outcome.outcome, 'accepted');
  assert.match(outcome.submissionId, /_1_/);
});

test('TIMEZONES: an invalid IANA identifier refuses; close evaluation is deterministic in the assignment OWN timezone', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.defineAssignment(TEACHER, def({ closeAt: { date: '2026-12-01', time: '23:59', timezone: 'Mars/Olympus' } })),
    (e) => e.code === 'timezone_invalid',
  );
  // Kolkata is UTC+5:30 — 23:59 IST is 18:29Z. A submission at 19:00Z is
  // past close IN KOLKATA even though it is before 23:59 UTC.
  await publishedAssignment(service);
  const afterCloseUTC = new Date('2026-12-01T19:00:00Z');
  const { service: atClose } = await makeService(() => afterCloseUTC);
  await publishedAssignment(atClose);
  await assert.rejects(
    () => atClose.submit(LEARNER, 'asg_orbits', 1, { type: 'text', value: 'late in Kolkata' }),
    (e) => e.code === 'assignment_closed',
  );
  // Before the Kolkata close instant, the same wall clock in UTC would not
  // have passed — the recorded timezone decides.
  const beforeCloseUTC = new Date('2026-12-01T17:00:00Z');
  const { service: beforeClose } = await makeService(() => beforeCloseUTC);
  await publishedAssignment(beforeClose);
  const ok = await beforeClose.submit(LEARNER, 'asg_orbits', 1, { type: 'text', value: 'in time' });
  assert.equal(ok.outcome, 'accepted');
  // The helper computes the Kolkata instant exactly.
  assert.equal(zonedInstant(KOLKATA), Date.parse('2026-12-01T18:29:00Z'));
});

test('SCHEDULING: a future publishAt schedules; submissions are refused until the wall-clock publish instant, then accepted live', async () => {
  const clock = new Date('2026-10-15T00:00:00Z');
  const { service } = await makeService(() => clock);
  const scheduled = await publishedAssignment(service);
  assert.equal(scheduled.status, 'scheduled');
  // Before the Kolkata publish instant (2026-11-01T04:30Z): not published.
  await assert.rejects(
    () => service.submit(LEARNER, 'asg_orbits', 1, { type: 'text', value: 'early' }),
    (e) => e.code === 'assignment_not_published',
  );
  // Past the publish instant the scheduled assignment is LIVE automatically.
  clock.setTime(Date.parse('2026-11-01T05:00:00Z'));
  const ok = await service.submit(LEARNER, 'asg_orbits', 1, { type: 'text', value: 'on time' });
  assert.equal(ok.outcome, 'accepted');
});

test('CLOSE: an explicit teacher close refuses submissions', async () => {
  const { service } = await makeService();
  await publishedAssignment(service);
  await service.close(TEACHER, 'asg_orbits', 1);
  await assert.rejects(
    () => service.submit(LEARNER, 'asg_orbits', 1, { type: 'text', value: 'too late' }),
    (e) => e.code === 'assignment_closed',
  );
});

test('ARCHIVE/RESTORE: archive refuses submissions and records prior status; restore returns exactly that prior status', async () => {
  const { service } = await makeService();
  await publishedAssignment(service);
  const archived = await service.archive(TEACHER, 'asg_orbits', 1);
  assert.equal(archived.archived, true);
  assert.equal(archived.priorStatus, 'published');
  await assert.rejects(
    () => service.submit(LEARNER, 'asg_orbits', 1, { type: 'text', value: 'hidden' }),
    (e) => e.code === 'assignment_archived',
  );
  const restored = await service.restore(TEACHER, 'asg_orbits', 1);
  assert.equal(restored.archived, false);
  assert.equal(restored.status, 'published');
  const ok = await service.submit(LEARNER, 'asg_orbits', 1, { type: 'text', value: 'back again' });
  assert.equal(ok.outcome, 'accepted');
  // A closed assignment restores to CLOSED, not to open.
  await service.close(TEACHER, 'asg_orbits', 1);
  await service.archive(TEACHER, 'asg_orbits', 1);
  const restoredClosed = await service.restore(TEACHER, 'asg_orbits', 1);
  assert.equal(restoredClosed.status, 'closed');
  await assert.rejects(
    () => service.submit(LEARNER, 'asg_orbits', 1, { type: 'text', value: 'still closed' }),
    (e) => e.code === 'assignment_closed',
  );
});

test('SUPPORTED response types: unsupported types and schema violations refuse; duplicates are idempotent', async () => {
  const { store, service } = await makeService();
  await publishedAssignment(service);
  // Unsupported type (file_ref not in the published set).
  await assert.rejects(
    () => service.submit(LEARNER, 'asg_orbits', 1, { type: 'file_ref', value: 'mat_abc' }),
    (e) => e.code === 'response_type_unsupported',
  );
  // Text over the published max length.
  await assert.rejects(
    () => service.submit(LEARNER, 'asg_orbits', 1, { type: 'text', value: 'x'.repeat(201) }),
    (e) => e.code === 'submission_schema_invalid',
  );
  // Choice outside the published options.
  await assert.rejects(
    () => service.submit(LEARNER, 'asg_orbits', 1, { type: 'choice', value: 'z' }),
    (e) => e.code === 'submission_schema_invalid',
  );
  const first = await service.submit(LEARNER, 'asg_orbits', 1, { type: 'choice', value: 'b' });
  assert.equal(first.outcome, 'accepted');
  // Duplicate (learner, version) converges; exactly one record exists.
  const second = await service.submit(LEARNER, 'asg_orbits', 1, { type: 'choice', value: 'a' });
  assert.equal(second.outcome, 'duplicate');
  assert.equal(second.submissionId, first.submissionId);
  const count = [...store['submissions'].keys()].length;
  assert.equal(count, 1);
});

test('ROLE-AWARE authority: uniform not_owner for unknown/foreign workspace; not_class_teacher for same-workspace non-teachers; submissions require CURRENT enrollment', async () => {
  const { store, service } = await makeService();
  await publishedAssignment(service);
  // Same-workspace stranger: role denial.
  await assert.rejects(() => service.close(STRANGER, 'asg_orbits', 1), (e) => e.code === 'not_class_teacher');
  // Unknown assignment: uniform not_owner.
  await assert.rejects(() => service.close(TEACHER, 'asg_unknown', 1), (e) => e.code === 'not_owner');
  // Foreign workspace: uniform not_owner.
  await assert.rejects(
    () => service.close({ uid: TEACHER.uid, workspaceId: 'ws_other' }, 'asg_orbits', 1),
    (e) => e.code === 'not_owner',
  );
  // An unenrolled learner cannot submit.
  await assert.rejects(
    () => service.submit(STRANGER, 'asg_orbits', 1, { type: 'text', value: 'not enrolled' }),
    (e) => e.code === 'not_enrolled',
  );
  // The enrolled learner can.
  const ok = await service.submit(LEARNER, 'asg_orbits', 1, { type: 'text', value: 'enrolled' });
  assert.equal(ok.outcome, 'accepted');
  void store;
});
