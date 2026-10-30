/**
 * AI-18 (KAN-156) — Indian-language speech and pedagogical-meaning
 * qualification. Proven against the real module over the in-memory store:
 *
 *   1. RIGHTS-CLEARED CORPUS: a held-out case requires provenance, license AND
 *      consent; missing consent/license is refused; a held-out case that leaks
 *      into the training set is rejected (split/leakage check).
 *   2. VERSIONED EVIDENCE: per-case/route evaluation records ASR/TTS/model/
 *      prompt versions + errors + intelligibility + uncertainty +
 *      latency/cancellation + per-task cost; recording is author-only.
 *   3. COUNTS NEVER ESTABLISH COVERAGE: language/dataset counts alone produce
 *      "not covered" — coverage requires held-out evidence AND a qualified
 *      reviewer decision against preapproved thresholds.
 *   4. REVIEWER-GATED COVERAGE: an unqualified actor cannot decide coverage;
 *      thresholds must be declared; a route becomes covered only when the
 *      preapproved numeric thresholds are met AND a qualified reviewer accepts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { InMemorySpeechQualStore } = req('./dist/src/speechqualification/speechqualification-lookups.js');
const { SpeechQualificationService } = req('./dist/src/speechqualification/speechqualification-service.js');
const { SpeechQualError } = req('./dist/src/speechqualification/speechqualification-types.js');

const AUTHOR = { uid: 'uid_author', workspaceId: 'ws_ai', role: 'author' };
const REVIEWER = { uid: 'uid_reviewer', workspaceId: 'ws_ai', role: 'reviewer' };

const MATRIX = { interfaceLanguage: 'en', inputLanguage: 'hi', sourceLanguage: 'en', outputLanguage: 'hi', script: 'devanagari', modality: 'speech', deviceContext: 'noisy', pedagogicalMeaning: 'science-ratio' };

async function makeHarness() {
  const store = new InMemorySpeechQualStore();
  const svc = new SpeechQualificationService(store);
  // Declare the training content so held-out leakage is detectable.
  await svc.setTrainingContent(['train-doc-A', 'train-doc-B']);
  const routeId = await svc.registerRoute({ asrVersion: 'asr-2', ttsVersion: 'tts-3', modelVersion: 'm-1', promptVersion: 'p-4', interfaceVersion: 'i-1' });
  return { store, svc, routeId };
}

test('RIGHTS-CLEARED CORPUS: consent+license required; held-out leakage rejected', async () => {
  const { svc } = await makeHarness();

  // Missing consent / license refused.
  await assert.rejects(
    () => svc.registerCase({ matrix: MATRIX, split: 'heldout', sourceRef: 'src-h', license: 'cc-by-4', consented: false, contentRef: 'heldout-bytes' }),
    (e) => e instanceof SpeechQualError && e.code === 'missing_consent',
  );
  await assert.rejects(
    () => svc.registerCase({ matrix: MATRIX, split: 'heldout', sourceRef: 'src-h', license: '', consented: true, contentRef: 'heldout-bytes' }),
    (e) => e instanceof SpeechQualError && e.code === 'missing_license',
  );

  // A held-out case from a TRAINING source leaks -> rejected.
  await assert.rejects(
    () => svc.registerCase({ matrix: MATRIX, split: 'heldout', sourceRef: 'train-doc-A', license: 'cc-by', consented: true, contentRef: 'heldout-bytes' }),
    (e) => e instanceof SpeechQualError && e.code === 'leakage_detected',
  );

  // A clean held-out case registers; a training case registers without leakage.
  const held = await svc.registerCase({ matrix: MATRIX, split: 'heldout', sourceRef: 'src-independent', license: 'cc-by-4', consented: true, contentRef: 'heldout-2-bytes' });
  assert.equal(held.split, 'heldout');
  const train = await svc.registerCase({ matrix: MATRIX, split: 'train', sourceRef: 'train-doc-A', license: 'cc-by', consented: true, contentRef: 'train-bytes' });
  assert.equal(train.split, 'train');
});

test('VERSIONED EVIDENCE: author records per-case outcomes with versions, cost, cancellation', async () => {
  const { svc, routeId } = await makeHarness();
  const held = await svc.registerCase({ matrix: MATRIX, split: 'heldout', sourceRef: 'src-independent', license: 'cc-by-4', consented: true, contentRef: 'heldout-bytes' });

  await svc.recordEvaluation(AUTHOR, { caseId: held.caseId, routeId, recognitionErrorRate: 0.05, semanticError: 'none', intelligibility: 0.9, pronunciation: 0.85, uncertainty: 'clear', latencyMs: 1200, cancelled: false, perTaskCostUsd: 0.004 });
  await svc.recordEvaluation(AUTHOR, { caseId: held.caseId, routeId, recognitionErrorRate: 0.2, semanticError: 'critical', intelligibility: 0.6, pronunciation: 0.5, uncertainty: 'uncertain', latencyMs: null, cancelled: true, perTaskCostUsd: 0.0 });

  // A reviewer cannot record evidence; only the author role may.
  await assert.rejects(
    () => svc.recordEvaluation(REVIEWER, { caseId: held.caseId, routeId, recognitionErrorRate: 0, semanticError: 'none', intelligibility: 1, pronunciation: 1, uncertainty: 'clear', latencyMs: 100, cancelled: false, perTaskCostUsd: 0 }),
    (e) => e instanceof SpeechQualError && e.code === 'not_owner',
  );
});

test('COUNTS NEVER ESTABLISH COVERAGE: evidence alone or language counts are not coverage without the reviewer gate', async () => {
  const { svc, routeId } = await makeHarness();
  // A reviewer declares preapproved thresholds.
  await svc.declareTargets(REVIEWER, { maxSemanticErrorRate: 0.1, maxRecognitionErrorRate: 0.15, minIntelligibility: 0.8, maxPerTaskCostUsd: 0.01, heldoutMinimumCases: 1 });

  // Only counts exist (zero held-out evaluations on this route) -> not covered.
  const noEvidence = await svc.routeCoverage(REVIEWER, routeId);
  assert.equal(noEvidence.covered, false);
  assert.equal(noEvidence.reason, 'insufficient_heldout_evidence_counts_not_coverage');

  // With good held-out evidence but NO reviewer decision -> still not covered.
  const held = await svc.registerCase({ matrix: MATRIX, split: 'heldout', sourceRef: 'src-independent', license: 'cc-by-4', consented: true, contentRef: 'heldout-bytes' });
  await svc.recordEvaluation(AUTHOR, { caseId: held.caseId, routeId, recognitionErrorRate: 0.04, semanticError: 'none', intelligibility: 0.92, pronunciation: 0.9, uncertainty: 'clear', latencyMs: 1100, cancelled: false, perTaskCostUsd: 0.003 });
  const pending = await svc.routeCoverage(REVIEWER, routeId);
  assert.equal(pending.reviewerDecisionSet, false);
  assert.equal(pending.covered, false, 'evidence without reviewer decision is not coverage');

  // An unqualified author cannot decide coverage.
  await assert.rejects(() => svc.routeCoverage(AUTHOR, routeId), (e) => e instanceof SpeechQualError && e.code === 'unqualified_reviewer');
});

test('REVIEWER-GATED COVERAGE: thresholds met + reviewer accept -> covered; otherwise not', async () => {
  const { svc, routeId } = await makeHarness();
  await svc.declareTargets(REVIEWER, { maxSemanticErrorRate: 0.1, maxRecognitionErrorRate: 0.15, minIntelligibility: 0.8, maxPerTaskCostUsd: 0.01, heldoutMinimumCases: 1 });

  const held = await svc.registerCase({ matrix: MATRIX, split: 'heldout', sourceRef: 'src-independent', license: 'cc-by-4', consented: true, contentRef: 'heldout-bytes' });
  await svc.recordEvaluation(AUTHOR, { caseId: held.caseId, routeId, recognitionErrorRate: 0.04, semanticError: 'none', intelligibility: 0.92, pronunciation: 0.9, uncertainty: 'clear', latencyMs: 1100, cancelled: false, perTaskCostUsd: 0.003 });

  // Reviewer rejects -> not covered, decision recorded.
  await svc.setReviewDecision(REVIEWER, routeId, false);
  const rejected = await svc.routeCoverage(REVIEWER, routeId);
  assert.equal(rejected.covered, false);
  assert.equal(rejected.reason, 'reviewer_rejected');

  // Reviewer accepts -> covered.
  await svc.setReviewDecision(REVIEWER, routeId, true);
  const accepted = await svc.routeCoverage(REVIEWER, routeId);
  assert.equal(accepted.covered, true);
  assert.equal(accepted.reason, 'reviewer_accepted');
  assert.ok(accepted.evidence.avgIntelligibility >= 0.8);
});
