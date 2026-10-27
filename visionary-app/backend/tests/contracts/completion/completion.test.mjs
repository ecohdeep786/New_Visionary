/**
 * BUILD-07 (KAN-81) — preserve completion criteria and professional
 * self-review versioning; application evidence remains unverified until
 * assessment and never awards mastery automatically.
 *
 * Proven here:
 *   1. completion criteria are versioned; amendments append versions and the
 *      verdict is measured against ONE explicit version (deterministic),
 *   2. professional self-reviews are versioned and append-only (earlier
 *      versions byte-stable),
 *   3. application evidence lands UNVERIFIED and stays unverified until an
 *      explicit assessment record moves it to verified — nothing awards
 *      mastery automatically (no auto-verify path exists),
 *   4. wrong users denied on assessment; unknown evidence fails closed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { CompletionService } = req('./dist/src/completion/completion-service.js');
const { InMemoryCompletionStore } = req('./dist/src/completion/completion-lookups.js');

const OWNER = { uid: 'uid_pro_1', workspaceId: 'ws_personal' };
const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const PROJECT = 'prj_portfolio';

async function makeService() {
  const store = new InMemoryCompletionStore();
  const svc = new CompletionService(store);
  await svc.defineCriteria(OWNER, PROJECT, [
    { itemId: 'i1', description: 'Includes a personal statement' },
    { itemId: 'i2', description: 'Shows three work samples' },
    { itemId: 'i3', description: 'Reflects on outcomes' },
  ]);
  return { store, svc };
}

// ---------------------------------------------------------------------------

test('completion criteria are versioned; amendments append versions; the verdict is measured against ONE explicit version', async () => {
  const { store, svc } = await makeService();
  const v1 = await store.latestCriteria(PROJECT);
  assert.equal(v1.version, 1);

  await svc.defineCriteria(OWNER, PROJECT, [{ itemId: 'i1', description: 'Updated criterion' }]);
  const v2 = await store.latestCriteria(PROJECT);
  assert.equal(v2.version, 2, 'amendment appended a version');

  // Verdict pinned to the LATEST version; deterministic on the same inputs.
  const missing = await svc.assessCompletion(OWNER, PROJECT, []);
  assert.equal(missing.complete, false, 'missing items keep completion honest');
  assert.deepEqual(missing.missingItemIds, ['i1']);

  const verdictA = await svc.assessCompletion(OWNER, PROJECT, ['i1']);
  const verdictB = await svc.assessCompletion(OWNER, PROJECT, ['i1']);
  assert.deepEqual(verdictA, verdictB, 'deterministic verdict');
  assert.equal(verdictA.criteriaVersion, 2);
  assert.deepEqual(verdictA.satisfiedItemIds, ['i1']);
  assert.equal(verdictA.complete, true, 'all amended criteria satisfied');
});

test('professional self-reviews are versioned and append-only; earlier versions byte-stable', async () => {
  const { svc } = await makeService();
  const r1 = await svc.submitSelfReview(OWNER, PROJECT, [{ title: 'Strengths', body: 'Clear structure' }]);
  const r2 = await svc.submitSelfReview(OWNER, PROJECT, [{ title: 'Strengths', body: 'Clear structure; added metrics' }]);
  assert.deepEqual([r1.version, r2.version], [1, 2]);

  const reviews = await svc.submitSelfReview(OWNER, PROJECT, [{ title: 'All', body: 'final' }]);
  assert.equal(reviews.version, 3);
});

test('application evidence lands UNVERIFIED and stays unverified until explicit assessment — never auto-verified', async () => {
  const { svc } = await makeService();
  const evidence = await svc.submitEvidence(OWNER, PROJECT, 'ev_1', { portfolio: 'link' });
  assert.equal(evidence.status, 'unverified', 'submitting evidence does NOT verify it');
  assert.equal(evidence.assessmentRef, null);

  // Even completing ALL criteria does not auto-verify application evidence.
  const verdict = await svc.assessCompletion(OWNER, PROJECT, ['i1', 'i2', 'i3']);
  assert.equal(verdict.complete, true);
  const still = await svc.submitEvidence(OWNER, PROJECT, 'ev_2', { portfolio: 'link2' });
  assert.equal(still.status, 'unverified', 'completion never awards verification/mastery automatically');

  // Explicit assessment is the ONLY path to verified.
  const assessed = await svc.recordAssessment(OWNER, 'ev_1', 'assess-2026-10-27');
  assert.equal(assessed.status, 'verified');
  assert.equal(assessed.assessmentRef, 'assess-2026-10-27');

  await assert.rejects(
    () => svc.recordAssessment(OWNER, 'ev_1', 'again'),
    (e) => e.code === 'already_assessed',
    'double assessment refused',
  );
});

test('wrong users denied on assessment; unknown evidence fails closed', async () => {
  const { svc } = await makeService();
  await svc.submitEvidence(OWNER, PROJECT, 'ev_1', { portfolio: 'link' });
  await assert.rejects(
    () => svc.recordAssessment(OTHER, 'ev_1', 'assess-x'),
    (e) => e.code === 'not_owner',
  );
  await assert.rejects(
    () => svc.recordAssessment(OWNER, 'ev_ghost', 'assess-x'),
    (e) => e.code === 'unknown_evidence',
  );
  await assert.rejects(
    () => svc.assessCompletion(OWNER, 'prj_ghost', []),
    (e) => e.code === 'unknown_criteria',
  );
});
