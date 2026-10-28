/**
 * ROLE-07 (KAN-99) — authorized teacher/guardian/organization reports with
 * provenance, permitted periods and approved aggregation/suppression rules;
 * private learner chat and drafts excluded by default.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));
const { ReportsService } = req('./dist/src/reports/reports-service.js');
const { InMemoryReportsStore } = req('./dist/src/reports/reports-lookups.js');

const TEACHER = { uid: 'uid_teacher_1', workspaceId: 'ws_school' };

const RULES = { rulesId: 'class_reports', version: 1, minCohortSize: 3, periodMaxDays: 30 };

function rows() {
  return [
    { learnerUid: 'l1', cohort: 'class_1', metric: 'practice_accuracy', value: 0.8 },
    { learnerUid: 'l2', cohort: 'class_1', metric: 'practice_accuracy', value: 0.9 },
    { learnerUid: 'l3', cohort: 'class_1', metric: 'practice_accuracy', value: 0.7 },
    { learnerUid: 'l4', cohort: 'class_1', metric: 'attempts', value: 12 },
    { learnerUid: 'l5', cohort: 'tiny_cohort', metric: 'practice_accuracy', value: 0.4 },
  ];
}

const PERIOD = { from: '2026-10-01T00:00:00Z', to: '2026-10-31T00:00:00Z' };

async function makeService() {
  const store = new InMemoryReportsStore();
  const service = new ReportsService(store);
  await service.defineRules(RULES, null);
  await service.approveRules(RULES.rulesId, RULES.version, 'approver_privacy_board');
  store.seedAuthorization('teacher', TEACHER.uid, 'cls_1');
  return { store, service };
}

// ---------------------------------------------------------------------------

test('APPROVED rules required: an unapproved or unknown rules version refuses generation', async () => {
  const { store, service } = await makeService();
  // Unapproved version 2.
  await service.defineRules({ ...RULES, version: 2, minCohortSize: 2 }, null);
  await assert.rejects(
    () => service.generateReport(TEACHER, 'teacher', TEACHER.uid, 'cls_1', PERIOD, RULES.rulesId, 2, rows()),
    (e) => e.code === 'rules_not_approved',
  );
  // Unknown rules id.
  await assert.rejects(
    () => service.generateReport(TEACHER, 'teacher', TEACHER.uid, 'cls_1', PERIOD, 'rules_unknown', 1, rows()),
    (e) => e.code === 'rules_version_unknown',
  );
  // Approving requires a named approver.
  await assert.rejects(
    () => service.approveRules(RULES.rulesId, 2, '  '),
    (e) => e.code === 'rules_not_approved',
  );
  void store;
});

test('AUTHORIZED recipients only: unauthorized recipients refuse uniformly (no leak)', async () => {
  const { service } = await makeService();
  const stranger = { uid: 'uid_stranger', workspaceId: 'ws_school' };
  await assert.rejects(
    () => service.generateReport(stranger, 'teacher', stranger.uid, 'cls_1', PERIOD, RULES.rulesId, 1, rows()),
    (e) => e.code === 'recipient_not_authorized',
  );
  // A teacher authorized for cls_1 is NOT authorized for another subject.
  await assert.rejects(
    () => service.generateReport(TEACHER, 'teacher', TEACHER.uid, 'cls_other', PERIOD, RULES.rulesId, 1, rows()),
    (e) => e.code === 'recipient_not_authorized',
  );
});

test('PERMITTED periods: unbounded/inverted/over-max periods refuse', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.generateReport(TEACHER, 'teacher', TEACHER.uid, 'cls_1', { from: '2026-10-10T00:00:00Z', to: '2026-10-01T00:00:00Z' }, RULES.rulesId, 1, rows()),
    (e) => e.code === 'period_invalid',
  );
  await assert.rejects(
    () => service.generateReport(TEACHER, 'teacher', TEACHER.uid, 'cls_1', { from: '2026-01-01T00:00:00Z', to: '2026-12-01T00:00:00Z' }, RULES.rulesId, 1, rows()),
    (e) => e.code === 'period_invalid',
  );
});

test('private learner chat and drafts are excluded BY DEFAULT — no override exists', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.generateReport(TEACHER, 'teacher', TEACHER.uid, 'cls_1', PERIOD, RULES.rulesId, 1, [
      ...rows(),
      { learnerUid: 'l1', cohort: 'class_1', metric: 'learner_chat_volume', value: 5 },
    ]),
    (e) => e.code === 'private_content_forbidden',
  );
  await assert.rejects(
    () => service.generateReport(TEACHER, 'teacher', TEACHER.uid, 'cls_1', PERIOD, RULES.rulesId, 1, [
      ...rows(),
      { learnerUid: 'l1', cohort: 'draft_review', metric: 'practice_accuracy', value: 1 },
    ]),
    (e) => e.code === 'private_content_forbidden',
  );
});

test('APPROVED aggregation/suppression: cohorts below minCohortSize suppress (listed, never silently merged); provenance recorded; deterministic', async () => {
  const { service } = await makeService();
  const report = await service.generateReport(TEACHER, 'teacher', TEACHER.uid, 'cls_1', PERIOD, RULES.rulesId, 1, rows());
  // class_1 (3 learners) aggregates; tiny_cohort (1 learner) suppresses.
  assert.equal(report.aggregated['class_1.practice_accuracy'], 0.8);
  assert.equal(report.aggregated['class_1.attempts'], 12);
  assert.deepEqual(report.suppressedBuckets, ['tiny_cohort']);
  // Provenance: rules id/version, period, generated-by/time.
  assert.equal(report.provenance.rulesId, RULES.rulesId);
  assert.equal(report.provenance.rulesVersion, 1);
  assert.equal(report.provenance.generatedBy, TEACHER.uid);
  assert.deepEqual(report.provenance.period, PERIOD);
  // Deterministic: the same inputs produce a byte-stable report body.
  const report2 = await service.generateReport(TEACHER, 'teacher', TEACHER.uid, 'cls_1', PERIOD, RULES.rulesId, 1, rows());
  const strip = (r) => JSON.stringify({ ...r, reportId: null, provenance: null });
  assert.equal(strip(report), strip(report2));
});

test('append-only history: reports are recipient-scoped on read', async () => {
  const { service } = await makeService();
  const report = await service.generateReport(TEACHER, 'teacher', TEACHER.uid, 'cls_1', PERIOD, RULES.rulesId, 1, rows());
  await service.getReport(TEACHER, report.reportId);
  const stranger = { uid: 'uid_stranger', workspaceId: 'ws_school' };
  await assert.rejects(() => service.getReport(stranger, report.reportId), (e) => e.code === 'not_owner');
});
