/**
 * AI-12 (KAN-138) — replace unsafe legacy quality export before ML integration.
 *
 * Proven here:
 *   1. the legacy raw-text quality export path is PERMANENTLY disconnected —
 *     raw dumps, global-key exports and training-style dataset generation all
 *      refuse (`legacy_export_disconnected`), for any requester,
 *   2. the ordinary authenticated identity is NOT sufficient — collection/export
 *      require a DISTINCT scoped operator carrying quality.review:<purposeId>,
 *   3. collection only through an APPROVED, ACTIVE purpose bound to explicit
 *      scope filters; a revoked purpose refuses immediately,
 *   4. ground truth requires a HUMAN review record — the feedback judge's
 *      generated response is refused (`not_ground_truth`),
 *   5. raw private-text fields (rawQuery/rawResponse/retrievedContext/
 *      fullTranscript) are forbidden in collected entries,
 *   6. an entry beyond the approved scope filters refuses.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { QualityScopeService } = req('./dist/src/qualityscope/quality-scope.js');
const { InMemoryQualityScopeStore } = req('./dist/src/qualityscope/quality-scope-lookups.js');

const OPERATOR = { operatorId: 'op_quality_1', scopes: ['quality.review:purp_1'] };
const ORDINARY_USER = { operatorId: 'uid_regular', scopes: [] };

async function makeService() {
  const store = new InMemoryQualityScopeStore();
  const svc = new QualityScopeService(store);
  await svc.recordPurpose({
    purposeId: 'purp_1',
    purposeStatement: 'Evaluate teaching quality on released grade-7 science, reviewed responses only',
    scopeFilters: { conceptId: 'c_orbits', sourceVersion: '1.1.0', locale: 'en' },
    status: 'active',
  });
  return { store, svc };
}

function entry(overrides = {}) {
  return {
    entryId: 'q1',
    purposeId: 'purp_1',
    conceptId: 'c_orbits',
    sourceVersion: '1.1.0',
    locale: 'en',
    response: { verdict: 'correct', notes: 'clean explanation' },
    reviewedRef: 'human-review-2026-10-28',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------

test('the legacy raw-text quality export path is PERMANENTLY disconnected — any requester, any filters', async () => {
  const { svc } = await makeService();
  await assert.rejects(
    () => svc.legacyExport({ uid: 'uid_admin' }, { globalKeys: true, rawRecords: true, generateTrainingDataset: true }),
    (e) => e.code === 'legacy_export_disconnected',
    'raw query/response/context dumps and training-style dataset generation stay disconnected',
  );
  await assert.rejects(() => svc.legacyExport(OPERATOR, {}), (e) => e.code === 'legacy_export_disconnected');
});

test('the ordinary authenticated identity is NOT sufficient — collection/export require the scoped operator', async () => {
  const { svc } = await makeService();
  await assert.rejects(
    () => svc.collect({ operator: ORDINARY_USER, entry: entry() }),
    (e) => e.code === 'operator_scope_required',
    'quality export routes are not part of the ordinary gateway authority',
  );
  await assert.rejects(
    () => svc.exportDataset(ORDINARY_USER, 'purp_1'),
    (e) => e.code === 'operator_scope_required',
  );
});

test('collection only through an approved ACTIVE purpose; a revoked purpose refuses immediately', async () => {
  const { store, svc } = await makeService();
  const collected = await svc.collect({ operator: OPERATOR, entry: entry() });
  assert.equal(collected.entryId, 'q1');

  // Revoke the purpose: collection and export refuse immediately.
  await store.savePurpose({ purposeId: 'purp_1', purposeStatement: 'x', scopeFilters: {}, status: 'revoked' });
  await assert.rejects(
    () => svc.collect({ operator: OPERATOR, entry: entry({ entryId: 'q2' }) }),
    (e) => e.code === 'purpose_not_active',
  );
  await assert.rejects(() => svc.exportDataset(OPERATOR, 'purp_1'), (e) => e.code === 'purpose_not_active');
});

test('ground truth requires a HUMAN review record — the judge-generated response is refused', async () => {
  const { svc } = await makeService();
  await assert.rejects(
    () => svc.collect({ operator: OPERATOR, entry: entry({ reviewedRef: null, response: { verdict: 'generated', source: 'feedback-judge' } }) }),
    (e) => e.code === 'not_ground_truth',
    'the feedback judge generated GoldenResponse is not reviewed ground truth',
  );
});

test('raw private-text fields are forbidden in collected entries', async () => {
  const { svc } = await makeService();
  await assert.rejects(
    () => svc.collect({ operator: OPERATOR, entry: entry({ rawQuery: 'everything the learner typed' }) }),
    (e) => e.code === 'raw_text_forbidden',
  );
  await assert.rejects(
    () => svc.collect({ operator: OPERATOR, entry: entry({ retrievedContext: 'full retrieved chunks' }) }),
    (e) => e.code === 'raw_text_forbidden',
  );
});

test('an entry beyond the approved scope filters refuses', async () => {
  const { svc } = await makeService();
  await assert.rejects(
    () => svc.collect({ operator: OPERATOR, entry: entry({ conceptId: 'c_algebra' }) }),
    (e) => e.code === 'beyond_approved_scope',
  );
  await assert.rejects(
    () => svc.collect({ operator: OPERATOR, entry: entry({ locale: 'hi' }) }),
    (e) => e.code === 'beyond_approved_scope',
  );
});
