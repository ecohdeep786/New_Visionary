// AI-01 (KAN-83) — benchmark candidate APIs on permitted sources, teaching
// quality, released languages, citation correctness, safety, latency, quotas
// and total per-use cost; pin the selected route/version.
//
// The checkpoint here is a reproducible, honest benchmark harness:
//   - Candidates are benchmarked ONLY on PERMITTED sources (the approved,
//     reviewed corpus for the language matrix) — never on raw private text.
//   - The language matrix is the ACTUAL RELEASED languages (en/hi/bn where
//     released) — a candidate claiming an unreleased language is scored
//     `unsupported` for it, not penalized or guessed.
//   - Scores cover the six reviewed dimensions: teaching quality, citation
//     correctness, safety, latency, quota behavior, total per-use cost.
//   - REPRODUCIBLE: the same candidate + scenario set + rubric version always
//     produces the same score digest (deterministic scoring; no drift).
//   - SELECTION PINS the route/version: the winner is recorded with its exact
//     route and version — the pin is the only thing downstream may consume.
//   - Every benchmark run is scored against a versioned rubric; a rubric
//     version change is visible in the result.
//   - Wrong actors denied; fail closed.
//
// Exit: evaluated, authorized assistance — the pinned route/version is the
// auditable selection.

/** A benchmark candidate API. */
export interface BenchmarkCandidate {
  candidateId: string;
  provider: string;
  /** The exact route/version pin for this candidate. */
  route: string;
  version: string;
}

/** The released language matrix (actual released languages only). */
export interface LanguageMatrix {
  releasedLocales: readonly string[];
}

/** One benchmark scenario: a question against a permitted source. */
export interface BenchmarkScenario {
  scenarioId: string;
  locale: string;
  sourceId: string;
  question: string;
  /** The reviewed expected-evidence reference (permitted source content). */
  expectedEvidenceRef: string;
}

/** Measured dimensions for one candidate × scenario run. */
export interface DimensionScores {
  teachingQuality: number;
  citationCorrectness: number;
  safety: number;
  latencyMs: number;
  quotaRespected: boolean;
  totalPerUseCost: number;
}

/** The benchmark result for one candidate across the matrix. */
export interface BenchmarkResult {
  candidateId: string;
  route: string;
  version: string;
  rubricVersion: string;
  perLocale: readonly { locale: string; supported: boolean; scores: DimensionScores | null }[];
  /** Deterministic digest of the scores — same inputs, same digest. */
  scoreDigest: string;
}

/** The pinned selection. */
export interface PinnedSelection {
  candidateId: string;
  provider: string;
  route: string;
  version: string;
  rubricVersion: string;
  pinnedAt: string;
}

export class BenchmarkError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'source_not_permitted'
      | 'locale_not_released'
      | 'no_candidate_meets_threshold'
  ) {
    super(code);
  }
}
