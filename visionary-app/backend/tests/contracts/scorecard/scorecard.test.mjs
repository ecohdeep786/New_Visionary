/**
 * AI-13 (KAN-142) — the versioned product-capability scorecard for novel
 * learning/Build tasks: reasoning, planning/replanning, permitted memory, tool
 * execution, feedback-driven correction and transfer across released
 * tasks/languages; held-out task families, contamination controls,
 * human/teacher baselines, repeated trials and observed final state; product
 * reliability separated from broad AGI/generalization evidence; reviewed
 * thresholds before release.
 *
 * Proven here:
 *   1.  VERSIONED definitions: conflicting same-version redefinition refuses;
 *       identical re-set is idempotent; the review survives re-sets.
 *   2.  A run binds ONE explicit scorecard version; unknown versions refuse.
 *   3.  Threshold review requires a named reviewer and is recorded.
 *   4.  Family intake is complete-or-refused (held-out flag, content hash,
 *       languages, dimensions).
 *   5.  Transfer families must reference an existing source family+language.
 *   6.  HELD-OUT enforcement: evaluation on a non-held-out family refuses.
 *   7.  CONTAMINATION: a contaminated family refuses trials; contamination
 *       discovered later excludes recorded trials and is counted.
 *   8.  OBSERVED final state required — claims never substitute.
 *   9.  REPEATED trials: duplicates refuse; the trial budget bounds attempts;
 *       a verdict is pending while repeats are incomplete.
 *   10. Dimension/language coverage enforced per family.
 *   11. ONE context owner: uniform denial, no existence leak.
 *   12. VERDICT gating: unreviewed thresholds stay pending_review; reviewed
 *       thresholds decide meets/below deterministically.
 *   13. RELIABILITY/GENERALIZATION separation; generalization is
 *       not_adjudicated_by_design (no capability/AGI verdict exists); a
 *       stopped run accepts no further trials; reports are byte-stable.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { ScorecardService } = req('./dist/src/scorecard/scorecard-service.js');
const { InMemoryScorecardStore } = req('./dist/src/scorecard/scorecard-lookups.js');
const { ALL_DIMENSIONS } = req('./dist/src/scorecard/scorecard-types.js');

const OWNER = { uid: 'uid_eval_1', workspaceId: 'ws_eval' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_eval' };
const FOREIGN_WS = { uid: 'uid_eval_1', workspaceId: 'ws_other' };

const THRESHOLDS = {
  perDimensionMin: {
    reasoning: 60,
    planning_replanning: 60,
    permitted_memory: 60,
    tool_execution: 60,
    feedback_correction: 60,
    transfer: 60,
  },
  overallMin: 65,
};

function definition(overrides = {}) {
  return {
    scorecardId: 'product_capability',
    version: 1,
    dimensions: ALL_DIMENSIONS,
    trialsPerCase: 2,
    trialBudgetPerCase: 3,
    thresholds: THRESHOLDS,
    reviewedBy: null,
    ...overrides,
  };
}

async function makeService() {
  const store = new InMemoryScorecardStore();
  const service = new ScorecardService(store);
  await service.defineScorecard(definition());
  return { store, service };
}

function family(overrides = {}) {
  return {
    familyId: 'fam_rel_reason',
    title: 'Released reasoning case',
    heldOut: true,
    contentHash: 'hash_reason',
    categoryReleased: true,
    languages: ['en-IN'],
    dimensions: ['reasoning'],
    baseline: { who: 'human', score: 70 },
    transferFrom: null,
    ...overrides,
  };
}

function trial(overrides = {}) {
  return {
    familyId: 'fam_rel_reason',
    language: 'en-IN',
    dimension: 'reasoning',
    attempt: 1,
    observed: { outcome: 'succeeded', evidence: 'observed final state: task completed' },
    score: 80,
    ...overrides,
  };
}

/** Register the six released families (one per dimension) + one novel family. */
async function seedFamilies(service) {
  const dims = ['reasoning', 'planning_replanning', 'permitted_memory', 'tool_execution', 'feedback_correction'];
  for (const d of dims) {
    await service.registerFamily(family({
      familyId: d === 'reasoning' ? 'fam_rel_reason' : `fam_rel_${d}`,
      title: `Released ${d} case`,
      contentHash: `hash_${d}`,
      dimensions: [d],
      baseline: d === 'reasoning' ? { who: 'human', score: 70 } : null,
    }));
  }
  await service.registerFamily(family({
    familyId: 'fam_rel_transfer',
    title: 'Released transfer case (reasoning en-IN to bn)',
    contentHash: 'hash_transfer',
    languages: ['en-IN', 'bn'],
    dimensions: ['transfer'],
    transferFrom: { familyId: 'fam_rel_reason', language: 'en-IN' },
  }));
  await service.registerFamily(family({
    familyId: 'fam_novel_reason',
    title: 'Novel held-out reasoning case (not a released category)',
    contentHash: 'hash_novel',
    categoryReleased: false,
    dimensions: ['reasoning'],
    baseline: null,
  }));
}

/** Full released coverage: 2 repeats per (family, en-IN) at the given score. */
async function fullReleasedRun(service, score, extraTrialOverrides = {}) {
  const run = await service.startRun(OWNER, 'product_capability', 1);
  const fams = ['reasoning', 'planning_replanning', 'permitted_memory', 'tool_execution', 'feedback_correction'];
  let attempt = 1;
  for (const f of fams) {
    const fid = f === 'reasoning' ? 'fam_rel_reason' : `fam_rel_${f}`;
    for (const a of [1, 2]) {
      await service.recordTrial(run.runId, OWNER, trial({
        familyId: fid, dimension: f, attempt: a, score, ...extraTrialOverrides,
      }));
    }
  }
  for (const a of [1, 2]) {
    await service.recordTrial(run.runId, OWNER, trial({
      familyId: 'fam_rel_transfer', dimension: 'transfer', attempt: a, score,
    }));
  }
  return run;
}

// ---------------------------------------------------------------------------

test('VERSIONED definitions: a conflicting same-version redefinition refuses; an identical re-set is idempotent and preserves the review', async () => {
  const { service } = await makeService();
  // Conflicting content for the same version refuses (no silent redefinition).
  await assert.rejects(
    () => service.defineScorecard(definition({ thresholds: { ...THRESHOLDS, overallMin: 99 } })),
    (e) => e.code === 'scorecard_version_conflict',
  );
  // A new version is the append path.
  const v2 = await service.defineScorecard(definition({ version: 2, thresholds: { ...THRESHOLDS, overallMin: 70 } }));
  assert.equal(v2.version, 2);
  // Review, then an identical re-set: idempotent, review preserved.
  await service.reviewThresholds('product_capability', 1, 'reviewer_founder');
  const again = await service.defineScorecard(definition());
  assert.equal(again.version, 1);
  const stored = await service.reviewThresholds('product_capability', 1, 'reviewer_founder');
  assert.equal(stored.reviewedBy, 'reviewer_founder');
});

test('a run binds ONE explicit scorecard version; an unknown version refuses', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.startRun(OWNER, 'product_capability', 99),
    (e) => e.code === 'scorecard_version_unknown',
  );
  await service.defineScorecard(definition({ version: 2, thresholds: { ...THRESHOLDS, overallMin: 70 } }));
  const run = await service.startRun(OWNER, 'product_capability', 1);
  assert.equal(run.scorecardVersion, 1);
  // Invalid definitions refuse outright.
  await assert.rejects(
    () => service.defineScorecard(definition({ version: 3, trialsPerCase: 1 })),
    (e) => e.code === 'definition_invalid',
  );
  await assert.rejects(
    () => service.defineScorecard(definition({ version: 3, trialBudgetPerCase: 1 })),
    (e) => e.code === 'definition_invalid',
  );
});

test('threshold review requires a named reviewer and is recorded before release use', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.reviewThresholds('product_capability', 1, '  '),
    (e) => e.code === 'reviewer_required',
  );
  const reviewed = await service.reviewThresholds('product_capability', 1, 'reviewer_founder');
  assert.equal(reviewed.reviewedBy, 'reviewer_founder');
});

test('family intake is complete-or-refused: held-out flag, content hash, languages and dimensions are required', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.registerFamily(family({ title: '' })),
    (e) => e.code === 'family_incomplete',
  );
  await assert.rejects(
    () => service.registerFamily(family({ contentHash: '' })),
    (e) => e.code === 'family_incomplete',
  );
  await assert.rejects(
    () => service.registerFamily(family({ languages: [] })),
    (e) => e.code === 'family_incomplete',
  );
  await assert.rejects(
    () => service.registerFamily(family({ dimensions: [] })),
    (e) => e.code === 'family_incomplete',
  );
  const ok = await service.registerFamily(family());
  assert.equal(ok.familyId, 'fam_rel_reason');
});

test('transfer families must reference an EXISTING registered source family+language', async () => {
  const { service } = await makeService();
  await service.registerFamily(family()); // the source family (fam_rel_reason)
  await assert.rejects(
    () => service.registerFamily(family({ familyId: 'fam_t1', dimensions: ['transfer'], transferFrom: null })),
    (e) => e.code === 'transfer_source_invalid',
  );
  await assert.rejects(
    () =>
      service.registerFamily(family({
        familyId: 'fam_t1',
        dimensions: ['transfer'],
        transferFrom: { familyId: 'fam_unknown', language: 'en-IN' },
      })),
    (e) => e.code === 'transfer_source_invalid',
  );
  const ok = await service.registerFamily(family({
    familyId: 'fam_t1',
    contentHash: 'hash_t1',
    dimensions: ['transfer'],
    transferFrom: { familyId: 'fam_rel_reason', language: 'en-IN' },
  }));
  assert.equal(ok.transferFrom.familyId, 'fam_rel_reason');
});

test('HELD-OUT enforcement: evaluation on a non-held-out family refuses', async () => {
  const { service } = await makeService();
  await service.registerFamily(family({ familyId: 'fam_open', contentHash: 'hash_open', heldOut: false }));
  const run = await service.startRun(OWNER, 'product_capability', 1);
  await assert.rejects(
    () => service.recordTrial(run.runId, OWNER, trial({ familyId: 'fam_open' })),
    (e) => e.code === 'not_held_out',
  );
});

test('CONTAMINATION: a contaminated family refuses trials; contamination found later excludes recorded trials and is counted', async () => {
  const { store, service } = await makeService();
  await seedFamilies(service);
  await store.markContaminated('hash_planning_replanning');
  const run = await service.startRun(OWNER, 'product_capability', 1);
  await assert.rejects(
    () =>
      service.recordTrial(run.runId, OWNER, trial({ familyId: 'fam_rel_planning_replanning', dimension: 'planning_replanning' })),
    (e) => e.code === 'contaminated',
  );
  // Record clean trials, then discover contamination on that family.
  for (const a of [1, 2]) {
    await service.recordTrial(run.runId, OWNER, trial({ attempt: a }));
  }
  await store.markContaminated('hash_reasoning');
  const report = await service.report(run.runId, OWNER);
  assert.equal(report.excludedContaminatedTrials, 2);
  assert.equal(report.reliability.perDimension.find((d) => d.dimension === 'reasoning').mean, null);
});

test('OBSERVED final state required — a claim without evidence never substitutes for an observation', async () => {
  const { service } = await makeService();
  await service.registerFamily(family());
  const run = await service.startRun(OWNER, 'product_capability', 1);
  await assert.rejects(
    () =>
      service.recordTrial(run.runId, OWNER, trial({ observed: { outcome: 'succeeded', evidence: '' } })),
    (e) => e.code === 'observation_required',
  );
  await assert.rejects(
    () =>
      service.recordTrial(run.runId, OWNER, trial({
        observed: { outcome: 'predicted_success', evidence: 'model claims it would pass' },
      })),
    (e) => e.code === 'observation_required',
  );
  const ok = await service.recordTrial(run.runId, OWNER, trial());
  assert.equal(ok.trials[0].observed.outcome, 'succeeded');
  assert.ok(ok.trials[0].observed.evidence.length > 0);
});

test('REPEATED trials: duplicates refuse, the budget bounds attempts, scores are range-checked', async () => {
  const { service } = await makeService();
  await service.registerFamily(family());
  const run = await service.startRun(OWNER, 'product_capability', 1);
  await service.recordTrial(run.runId, OWNER, trial({ attempt: 1 }));
  // Same (family, language, attempt) refuses.
  await assert.rejects(
    () => service.recordTrial(run.runId, OWNER, trial({ attempt: 1 })),
    (e) => e.code === 'duplicate_trial',
  );
  // Attempt beyond the budget refuses (budget 3).
  await assert.rejects(
    () => service.recordTrial(run.runId, OWNER, trial({ attempt: 4 })),
    (e) => e.code === 'trial_bound_exceeded',
  );
  await assert.rejects(
    () => service.recordTrial(run.runId, OWNER, trial({ attempt: 0 })),
    (e) => e.code === 'trial_bound_exceeded',
  );
  // Scores outside 0..100 refuse.
  await assert.rejects(
    () => service.recordTrial(run.runId, OWNER, trial({ attempt: 2, score: 140 })),
    (e) => e.code === 'score_out_of_range',
  );
});

test('dimension and language coverage are enforced per family', async () => {
  const { service } = await makeService();
  await service.registerFamily(family());
  const run = await service.startRun(OWNER, 'product_capability', 1);
  await assert.rejects(
    () => service.recordTrial(run.runId, OWNER, trial({ dimension: 'transfer' })),
    (e) => e.code === 'dimension_not_in_family',
  );
  await assert.rejects(
    () => service.recordTrial(run.runId, OWNER, trial({ language: 'bn' })),
    (e) => e.code === 'language_not_covered',
  );
});

test('ONE context owner: unknown run, wrong uid and foreign workspace deny uniformly (no existence leak)', async () => {
  const { service } = await makeService();
  await service.registerFamily(family());
  const run = await service.startRun(OWNER, 'product_capability', 1);
  await assert.rejects(
    () => service.recordTrial(run.runId, STRANGER, trial()),
    (e) => e.code === 'not_owner',
  );
  await assert.rejects(
    () => service.recordTrial('score_unknown', OWNER, trial()),
    (e) => e.code === 'not_owner',
  );
  await assert.rejects(
    () => service.recordTrial(run.runId, FOREIGN_WS, trial()),
    (e) => e.code === 'not_owner',
  );
  await assert.rejects(() => service.report(run.runId, STRANGER), (e) => e.code === 'not_owner');
  await assert.rejects(() => service.stop(run.runId, FOREIGN_WS), (e) => e.code === 'not_owner');
});

test('VERDICT gating: unreviewed thresholds stay pending_review; incomplete repeats stay pending; reviewed thresholds decide deterministically', async () => {
  const { service } = await makeService();
  await seedFamilies(service);
  // Unreviewed thresholds: scores compute, verdict stays pending.
  const run1 = await fullReleasedRun(service, 80);
  const report1 = await service.report(run1.runId, OWNER);
  assert.equal(report1.verdict.verdict, 'pending_review');
  assert.equal(report1.verdict.reason, 'thresholds_unreviewed');
  // Reviewed thresholds + full repeats + scores above thresholds → meets.
  await service.reviewThresholds('product_capability', 1, 'reviewer_founder');
  const report2 = await service.report(run1.runId, OWNER);
  assert.equal(report2.verdict.verdict, 'meets_product_threshold');
  assert.equal(report2.verdict.reason, 'all_reviewed_thresholds_met');
  // Deterministic: the same inputs produce the byte-stable verdict.
  const report2again = await service.report(run1.runId, OWNER);
  assert.equal(JSON.stringify(report2), JSON.stringify(report2again));
  // Incomplete repeats (1 of 2) on a new run stay pending even when reviewed.
  const run2 = await service.startRun(OWNER, 'product_capability', 1);
  await service.recordTrial(run2.runId, OWNER, trial({ attempt: 1 }));
  const report3 = await service.report(run2.runId, OWNER);
  assert.equal(report3.verdict.verdict, 'pending_review');
  assert.equal(report3.verdict.reason, 'incomplete_released_coverage');
});

test('reviewed thresholds produce a BELOW verdict when a dimension or the overall is under the minimum', async () => {
  const { service } = await makeService();
  await seedFamilies(service);
  await service.reviewThresholds('product_capability', 1, 'reviewer_founder');
  // Reasoning at 50 < 60.
  const run = await fullReleasedRun(service, 55);
  const report = await service.report(run.runId, OWNER);
  assert.equal(report.verdict.verdict, 'below_product_threshold');
  assert.match(report.verdict.reason, /below_min/);
});

test('RELIABILITY/GENERALIZATION separation: disjoint trial sets; the generalization section is not_adjudicated_by_design (no capability/AGI verdict exists)', async () => {
  const { service } = await makeService();
  await seedFamilies(service);
  const run = await service.startRun(OWNER, 'product_capability', 1);
  // Released-category trials (reliability set).
  for (const a of [1, 2]) {
    await service.recordTrial(run.runId, OWNER, trial({ attempt: a, score: 80 }));
  }
  // Novel held-out trials (generalization set).
  for (const a of [1, 2]) {
    await service.recordTrial(run.runId, OWNER, trial({ familyId: 'fam_novel_reason', attempt: a, score: 30 }));
  }
  const report = await service.report(run.runId, OWNER);
  // Reliability saw ONLY the released-family trials.
  assert.equal(report.reliability.perDimension.find((d) => d.dimension === 'reasoning').mean, 80);
  // Generalization saw ONLY the novel-family trials.
  assert.equal(report.generalization.perDimension.find((d) => d.dimension === 'reasoning').mean, 30);
  assert.equal(report.generalization.familiesCount, 1);
  assert.equal(report.generalization.verdict, 'not_adjudicated_by_design');
  // The verdict comes from reliability alone; no AGI key exists anywhere.
  const serialized = JSON.stringify(report);
  assert.ok(!serialized.includes('"agi"'));
  assert.ok(!serialized.includes('agi_verdict'));
  // Human/teacher baseline comparison is reported where present.
  assert.equal(report.reliability.baselineComparison[0].dimension, 'reasoning');
  assert.equal(report.reliability.baselineComparison[0].baseline, 70);
  assert.equal(report.reliability.baselineComparison[0].observed, 80);
  assert.equal(report.reliability.baselineComparison[0].delta, 10);
  // A stopped run accepts no further trials.
  await service.stop(run.runId, OWNER);
  await assert.rejects(
    () => service.recordTrial(run.runId, OWNER, trial({ familyId: 'fam_novel_reason', attempt: 3, score: 30 })),
    (e) => e.code === 'run_not_active',
  );
});
