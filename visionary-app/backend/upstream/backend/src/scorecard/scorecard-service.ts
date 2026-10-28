// AI-13 (KAN-142) — the versioned product-capability scorecard service.
//
// Core responsibilities (server-owned; honest scoping; fail closed):
//   1. defineScorecard: append-only per version — a conflicting same-version
//      definition refuses (`scorecard_version_conflict`); an identical re-set
//      is idempotent; repeats >= 2 and a trial budget are required
//      (`definition_invalid`).
//   2. reviewThresholds: a named reviewer records the threshold review BEFORE
//      release use (`reviewer_required`); the review is idempotent.
//   3. registerFamily: held-out flag, content hash, language and dimension
//      coverage are required (`family_incomplete`); transfer families must
//      reference an EXISTING registered source family+language
//      (`transfer_source_invalid`).
//   4. startRun: binds ONE explicit scorecard version
//      (`scorecard_version_unknown`); the bound definition is immutable for
//      the run.
//   5. recordTrial: held-out families only (`not_held_out`); contamination
//      checked per call (`contaminated`); OBSERVED final outcome with
//      evidence required (`observation_required`); score 0..100
//      (`score_out_of_range`); duplicate (family, language, attempt) refused
//      (`duplicate_trial`); attempts beyond the budget refuse
//      (`trial_bound_exceeded`); dimension and language coverage enforced.
//   6. report: reliability aggregates RELEASED-category trials; generalization
//      aggregates NOVEL held-out trials — disjoint sets, separate sections;
//      contamination discovered later EXCLUDES those trials and is counted;
//      the verdict comes from reliability against the thresholds — pending
//      while thresholds are unreviewed or released coverage is incomplete —
//      and the generalization section carries
//      `not_adjudicated_by_design` (no capability/AGI verdict exists here).
//   7. stop: owner stop; a stopped run accepts no further trials.
//   8. Uniform denial: unknown run, wrong uid and foreign workspace are the
//      same `not_owner` (no existence leak).
import type {
  DimensionScore,
  ScoreOwner,
  ScoreReport,
  ScoreRun,
  ScorecardDefinition,
  ScorecardError as ScorecardErrorType,
  ScoreDimension,
  TaskFamily,
  TrialRecord,
} from './scorecard-types';
import { ScorecardError } from './scorecard-types';
import type { ScorecardStore } from './scorecard-lookups';

export interface TrialInput {
  familyId: string;
  language: string;
  dimension: ScoreDimension;
  attempt: number;
  observed: { outcome: 'succeeded' | 'failed' | 'partial'; evidence: string };
  score: number;
}

export class ScorecardService {
  private runCounter = 0;

  constructor(private readonly store: ScorecardStore) {}

  /** Register one versioned scorecard definition (append-only). */
  async defineScorecard(def: ScorecardDefinition): Promise<ScorecardDefinition> {
    if (
      !def.scorecardId ||
      !Number.isInteger(def.version) ||
      def.version < 1 ||
      !def.dimensions?.length ||
      !Number.isInteger(def.trialsPerCase) ||
      def.trialsPerCase < 2 ||
      !Number.isInteger(def.trialBudgetPerCase) ||
      def.trialBudgetPerCase < def.trialsPerCase ||
      !def.thresholds
    ) {
      throw new ScorecardError('definition_invalid');
    }
    const existing = await this.store.definition(def.scorecardId, def.version);
    if (existing) {
      // Identical re-set is idempotent; a silent redefinition refuses. The
      // review field is excluded — a later review must not break re-sets.
      const strip = (d: ScorecardDefinition) => {
        const copy: Record<string, unknown> = { ...d };
        delete copy.reviewedBy;
        return JSON.stringify(copy);
      };
      if (strip(existing) !== strip(def)) {
        throw new ScorecardError('scorecard_version_conflict');
      }
      return existing;
    }
    await this.store.saveDefinition({ ...def, dimensions: [...def.dimensions], reviewedBy: null });
    return def;
  }

  /** Record the threshold review (named reviewer, before release use). */
  async reviewThresholds(
    scorecardId: string,
    version: number,
    reviewer: string,
  ): Promise<ScorecardDefinition> {
    if (!reviewer || !reviewer.trim()) throw new ScorecardError('reviewer_required');
    const def = await this.getDefinition(scorecardId, version);
    const updated: ScorecardDefinition = { ...def, reviewedBy: reviewer };
    await this.store.saveDefinition(updated);
    return updated;
  }

  /** Register one evaluation task family. */
  async registerFamily(family: TaskFamily): Promise<TaskFamily> {
    if (
      !family.familyId ||
      !family.title ||
      typeof family.heldOut !== 'boolean' ||
      !family.contentHash ||
      !family.languages?.length ||
      !family.dimensions?.length
    ) {
      throw new ScorecardError('family_incomplete');
    }
    if (family.dimensions.includes('transfer')) {
      if (!family.transferFrom) throw new ScorecardError('transfer_source_invalid');
      const source = await this.store.family(family.transferFrom.familyId);
      if (!source || !source.languages.includes(family.transferFrom.language)) {
        throw new ScorecardError('transfer_source_invalid');
      }
    }
    await this.store.saveFamily({
      ...family,
      languages: [...family.languages],
      dimensions: [...family.dimensions],
    });
    return family;
  }

  /** Mark a content hash contaminated (contamination control). */
  async markContaminated(contentHash: string): Promise<void> {
    await this.store.markContaminated(contentHash);
  }

  /** Start a run bound to ONE explicit scorecard version. */
  async startRun(owner: ScoreOwner, scorecardId: string, version: number): Promise<ScoreRun> {
    const def = await this.store.definition(scorecardId, version);
    if (!def) throw new ScorecardError('scorecard_version_unknown');
    const run: ScoreRun = {
      runId: `score_${++this.runCounter}`,
      owner: { ...owner },
      scorecardId,
      scorecardVersion: version,
      status: 'running',
      trials: [],
    };
    await this.store.insertRun(run);
    return run;
  }

  /** Record one observed trial (repeated trials; fail closed). */
  async recordTrial(runId: string, owner: ScoreOwner, input: TrialInput): Promise<ScoreRun> {
    const run = await this.getOwned(runId, owner);
    if (run.status !== 'running') throw new ScorecardError('run_not_active');
    const def = await this.getDefinition(run.scorecardId, run.scorecardVersion);
    const family = await this.store.family(input.familyId);
    if (!family) throw new ScorecardError('unknown_family');
    // Held-out task families only (contamination-resistant evaluation).
    if (!family.heldOut) throw new ScorecardError('not_held_out');
    // Contamination control on EVERY trial.
    if (await this.store.isContaminated(family.contentHash)) {
      throw new ScorecardError('contaminated');
    }
    if (!family.dimensions.includes(input.dimension)) {
      throw new ScorecardError('dimension_not_in_family');
    }
    if (!family.languages.includes(input.language)) {
      throw new ScorecardError('language_not_covered');
    }
    // Observed final state only — claims never substitute for observations.
    const outcome = input.observed?.outcome;
    if (
      !input.observed ||
      (outcome !== 'succeeded' && outcome !== 'failed' && outcome !== 'partial') ||
      !input.observed.evidence?.trim()
    ) {
      throw new ScorecardError('observation_required');
    }
    if (!Number.isFinite(input.score) || input.score < 0 || input.score > 100) {
      throw new ScorecardError('score_out_of_range');
    }
    if (!Number.isInteger(input.attempt) || input.attempt < 1) {
      throw new ScorecardError('trial_bound_exceeded');
    }
    if (input.attempt > def.trialBudgetPerCase) throw new ScorecardError('trial_bound_exceeded');
    const duplicate = run.trials.some(
      (t) =>
        t.familyId === input.familyId &&
        t.language === input.language &&
        t.attempt === input.attempt,
    );
    if (duplicate) throw new ScorecardError('duplicate_trial');
    const trial: TrialRecord = {
      trialId: `${run.runId}_t${run.trials.length + 1}`,
      familyId: input.familyId,
      language: input.language,
      dimension: input.dimension,
      attempt: input.attempt,
      observed: { ...input.observed },
      score: input.score,
    };
    run.trials.push(trial);
    await this.store.saveRun(run);
    return run;
  }

  /** Compute the separated reliability/generalization report + verdict. */
  async report(runId: string, owner: ScoreOwner): Promise<ScoreReport> {
    const run = await this.getOwned(runId, owner);
    const def = await this.getDefinition(run.scorecardId, run.scorecardVersion);
    const families = new Map<string, TaskFamily>();
    for (const trial of run.trials) {
      if (!families.has(trial.familyId)) {
        families.set(trial.familyId, await this.store.family(trial.familyId));
      }
    }

    // Contamination discovered AFTER recording excludes those trials (counted).
    const usable: { trial: TrialRecord; family: TaskFamily }[] = [];
    let excludedContaminatedTrials = 0;
    for (const trial of run.trials) {
      const family = families.get(trial.familyId)!;
      if (await this.store.isContaminated(family.contentHash)) {
        excludedContaminatedTrials += 1;
        continue;
      }
      usable.push({ trial, family });
    }

    const reliabilityTrials = usable.filter((u) => u.family.categoryReleased);
    const generalizationTrials = usable.filter((u) => !u.family.categoryReleased);
    const generalizationFamilies = new Set(generalizationTrials.map((u) => u.family.familyId));

    const reliability = this.aggregate(reliabilityTrials, def.dimensions);
    const generalization = this.aggregate(generalizationTrials, def.dimensions);

    // Baseline comparison where a family carries a human/teacher baseline.
    const baselineComparison = def.dimensions
      .map((dimension) => {
        const trials = reliabilityTrials.filter((u) => u.trial.dimension === dimension);
        const withBaseline = trials.filter((u) => u.family.baseline);
        if (!withBaseline.length) return null;
        const baselineMean =
          withBaseline.reduce((s, u) => s + (u.family.baseline?.score ?? 0), 0) / withBaseline.length;
        const observedMean = trials.reduce((s, u) => s + u.trial.score, 0) / trials.length;
        return {
          dimension,
          baseline: Math.round(baselineMean * 100) / 100,
          observed: Math.round(observedMean * 100) / 100,
          delta: Math.round((observedMean - baselineMean) * 100) / 100,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    // Repeats check: every started case must have the full repeat count
    // before any verdict is produced (repeated trials, honestly enforced).
    const caseCounts = new Map<string, number>();
    for (const { trial } of reliabilityTrials) {
      const key = `${trial.familyId}|${trial.language}`;
      caseCounts.set(key, (caseCounts.get(key) ?? 0) + 1);
    }
    const incompleteRepeats = [...caseCounts.values()].some((n) => n < def.trialsPerCase);

    let verdict: ScoreReport['verdict'];
    if (!def.reviewedBy) {
      verdict = { verdict: 'pending_review', reason: 'thresholds_unreviewed' };
    } else if (incompleteRepeats || reliability.means.every((m) => m.mean === null)) {
      verdict = { verdict: 'pending_review', reason: 'incomplete_released_coverage' };
    } else {
      const dims = reliability.means.filter((m) => m.mean !== null) as (DimensionScore & { mean: number })[];
      const below = dims.filter((m) => m.mean < (def.thresholds.perDimensionMin[m.dimension] ?? 0));
      const overall = reliability.overall ?? 0;
      if (below.length || overall < def.thresholds.overallMin) {
        verdict = {
          verdict: 'below_product_threshold',
          reason: below.length
            ? `below_min:${below.map((m) => m.dimension).join(',')}`
            : `overall_below_min:${def.thresholds.overallMin}`,
        };
      } else {
        verdict = { verdict: 'meets_product_threshold', reason: 'all_reviewed_thresholds_met' };
      }
    }

    const report: ScoreReport = {
      runId: run.runId,
      scorecardId: run.scorecardId,
      scorecardVersion: run.scorecardVersion,
      reliability: {
        perDimension: reliability.means,
        overall: reliability.overall,
        baselineComparison,
      },
      generalization: {
        perDimension: generalization.means,
        overall: generalization.overall,
        familiesCount: generalizationFamilies.size,
        verdict: 'not_adjudicated_by_design',
      },
      excludedContaminatedTrials,
      verdict,
    };
    if (run.status === 'running') {
      run.status = 'reported';
      await this.store.saveRun(run);
    }
    return report;
  }

  /** Owner stop; a stopped run accepts no further trials. */
  async stop(runId: string, owner: ScoreOwner): Promise<ScoreRun> {
    const run = await this.getOwned(runId, owner);
    run.status = 'stopped';
    await this.store.saveRun(run);
    return run;
  }

  /** Uniform denial: unknown run and wrong owner are the same `not_owner`. */
  private async getOwned(runId: string, owner: ScoreOwner): Promise<ScoreRun> {
    const run = await this.store.run(runId);
    if (!run || run.owner.uid !== owner.uid || run.owner.workspaceId !== owner.workspaceId) {
      throw new ScorecardError('not_owner');
    }
    return run;
  }

  private async getDefinition(scorecardId: string, version: number): Promise<ScorecardDefinition> {
    const def = await this.store.definition(scorecardId, version);
    if (!def) throw new ScorecardError('scorecard_version_unknown');
    return def;
  }

  /** Per-dimension means + overall over one disjoint trial set. */
  private aggregate(
    trials: { trial: TrialRecord; family: TaskFamily }[],
    dimensions: readonly ScoreDimension[],
  ): { means: DimensionScore[]; overall: number | null } {
    const means: DimensionScore[] = dimensions.map((dimension) => {
      const inDim = trials.filter((u) => u.trial.dimension === dimension);
      if (!inDim.length) return { dimension, mean: null, trials: 0 };
      const mean = inDim.reduce((s, u) => s + u.trial.score, 0) / inDim.length;
      return { dimension, mean: Math.round(mean * 100) / 100, trials: inDim.length };
    });
    const measured = means.filter((m) => m.mean !== null) as (DimensionScore & { mean: number })[];
    const overall = measured.length
      ? Math.round((measured.reduce((s, m) => s + m.mean, 0) / measured.length) * 100) / 100
      : null;
    return { means, overall };
  }
}

export type { ScorecardErrorType };
