// AI-13 (KAN-142) — the versioned product-capability scorecard types.
//
// The checkpoint here is an honest, versioned capability-evaluation contract
// for novel learning/Build tasks — NOT a capability claim machine:
//   - VERSIONED scorecards: definitions are append-only per version; the same
//     version cannot be silently redefined (conflict refused; identical
//     re-set idempotent). A run binds ONE explicit version — no drift.
//   - SIX dimensions: reasoning, planning/replanning, permitted memory, tool
//     execution, feedback-driven correction, transfer across tasks/languages.
//   - HELD-OUT families + CONTAMINATION controls: every evaluated family must
//     be held-out; a family whose content hash is contaminated refuses — and
//     contamination discovered later excludes those trials at report time.
//   - REPEATED trials with observed final state: each case repeats; a result
//     without an OBSERVED final outcome (evidence + outcome) is refused —
//     claims never substitute for observations.
//   - PRODUCT RELIABILITY vs GENERALIZATION are separate sections computed
//     from disjoint trial sets (released-category vs novel held-out families).
//     The verdict comes from RELIABILITY alone against REVIEWED thresholds;
//     the generalization section is observation-only by construction — it
//     carries no capability/AGI verdict and no API can produce one.
//   - REVIEWED THRESHOLDS BEFORE RELEASE: an unreviewed threshold set computes
//     scores but the verdict stays `pending_review` (reason recorded).
//
// Exit: measured product reliability evidence with honest scoping; no runtime
// capability or AGI claim is completed by this task.

/** The authenticated caller. */
export interface ScoreOwner {
  uid: string;
  workspaceId: string;
}

/** The six scorecard dimensions (AI-13 requirement, fixed set). */
export type ScoreDimension =
  | 'reasoning'
  | 'planning_replanning'
  | 'permitted_memory'
  | 'tool_execution'
  | 'feedback_correction'
  | 'transfer';

export const ALL_DIMENSIONS: readonly ScoreDimension[] = [
  'reasoning',
  'planning_replanning',
  'permitted_memory',
  'tool_execution',
  'feedback_correction',
  'transfer',
];

/** Reviewed pass thresholds (set BEFORE release; review recorded). */
export interface Thresholds {
  /** Minimum mean score (0..100) per dimension over released-category trials. */
  perDimensionMin: Partial<Record<ScoreDimension, number>>;
  /** Minimum overall score (0..100) over released-category trials. */
  overallMin: number;
}

/** One versioned scorecard definition (append-only per version). */
export interface ScorecardDefinition {
  scorecardId: string;
  version: number;
  dimensions: readonly ScoreDimension[];
  /** Required repeats per (family, language) case — repeated trials. */
  trialsPerCase: number;
  /** Hard budget: attempts beyond this refuse (bounded evaluation). */
  trialBudgetPerCase: number;
  thresholds: Thresholds;
  /** Threshold review recorded by a named reviewer BEFORE release use. */
  reviewedBy: string | null;
}

/** An evaluation task family (held-out; contamination-keyed). */
export interface TaskFamily {
  familyId: string;
  title: string;
  /** Held-out: excluded from teaching/training material by registration. */
  heldOut: boolean;
  /** Contamination key (content hash checked against the registry). */
  contentHash: string;
  /** True when the family models a RELEASED product task category. */
  categoryReleased: boolean;
  languages: readonly string[];
  dimensions: readonly ScoreDimension[];
  /** Human/teacher baseline where appropriate (0..100). */
  baseline: { who: 'human' | 'teacher'; score: number } | null;
  /** Transfer families must reference the source family + language. */
  transferFrom: { familyId: string; language: string } | null;
}

/** One recorded evaluation trial (observed final state only). */
export interface TrialRecord {
  trialId: string;
  familyId: string;
  language: string;
  dimension: ScoreDimension;
  /** Which repeat of the case (1..trialsPerCase). */
  attempt: number;
  observed: {
    outcome: 'succeeded' | 'failed' | 'partial';
    evidence: string;
  };
  /** Measured score (0..100) for the observed final state. */
  score: number;
}

export interface ScoreRun {
  runId: string;
  owner: ScoreOwner;
  scorecardId: string;
  /** The ONE bound scorecard version (immutable for the run). */
  scorecardVersion: number;
  status: 'running' | 'reported' | 'stopped';
  trials: TrialRecord[];
}

/** Per-dimension measured aggregate. */
export interface DimensionScore {
  dimension: ScoreDimension;
  mean: number | null;
  trials: number;
}

export interface ScoreReport {
  runId: string;
  scorecardId: string;
  scorecardVersion: number;
  /** PRODUCT RELIABILITY: released-category trials only. */
  reliability: {
    perDimension: DimensionScore[];
    overall: number | null;
    baselineComparison: { dimension: ScoreDimension; baseline: number; observed: number; delta: number }[];
  };
  /** GENERALIZATION: novel held-out trials only — observation, never a verdict. */
  generalization: {
    perDimension: DimensionScore[];
    overall: number | null;
    familiesCount: number;
    /** Fixed by design: no capability/AGI verdict exists in this contract. */
    verdict: 'not_adjudicated_by_design';
  };
  excludedContaminatedTrials: number;
  verdict:
    | { verdict: 'meets_product_threshold' | 'below_product_threshold'; reason: string }
    | { verdict: 'pending_review'; reason: string };
}

export class ScorecardError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_run'
      | 'unknown_family'
      | 'unknown_trial'
      | 'scorecard_version_conflict'
      | 'scorecard_version_unknown'
      | 'definition_invalid'
      | 'family_incomplete'
      | 'not_held_out'
      | 'contaminated'
      | 'observation_required'
      | 'score_out_of_range'
      | 'duplicate_trial'
      | 'trial_bound_exceeded'
      | 'dimension_not_in_family'
      | 'language_not_covered'
      | 'transfer_source_invalid'
      | 'reviewer_required'
      | 'run_not_active'
  ) {
    super(code);
  }
}
