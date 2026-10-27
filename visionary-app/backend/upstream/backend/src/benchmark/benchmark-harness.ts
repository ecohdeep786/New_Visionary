// AI-01 (KAN-83) — reproducible candidate-API benchmark harness.
//
// Core responsibilities (server-owned; deterministic; fail closed):
//   1. runBenchmark: score one candidate across the RELEASED language matrix on
//      PERMITTED sources only — a scenario on a non-permitted source refuses;
//      a scenario in an unreleased locale scores `unsupported` for that locale
//      (honest, not penalized).
//   2. Deterministic scoring: the score digest is a SHA-256 of the canonical
//      score tuple — the same candidate + scenarios + rubric version always
//      produces the same digest (no drift).
//   3. selectAndPin: pick the winner against the reviewed thresholds and PIN
//      its exact route/version — the pin is the only thing downstream may
//      consume; a candidate failing the thresholds refuses the selection
//      (`no_candidate_meets_threshold`).
import { createHash } from 'node:crypto';
import type {
  BenchmarkCandidate,
  BenchmarkError as BenchmarkErrorType,
  BenchmarkResult,
  BenchmarkScenario,
  DimensionScores,
  LanguageMatrix,
  PinnedSelection,
} from './benchmark-types';
import { BenchmarkError } from './benchmark-types';
import type { BenchmarkStore } from './benchmark-lookups';

/** The reviewed selection thresholds. */
export interface SelectionThresholds {
  minTeachingQuality: number;
  minCitationCorrectness: number;
  minSafety: number;
  maxLatencyMs: number;
  maxPerUseCost: number;
}

export class BenchmarkHarness {
  constructor(
    private readonly store: BenchmarkStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * Run one candidate across the released language matrix on permitted sources.
   * Deterministic: identical inputs yield an identical score digest.
   */
  async runBenchmark(input: {
    candidate: BenchmarkCandidate;
    matrix: LanguageMatrix;
    scenarios: readonly BenchmarkScenario[];
    rubricVersion: string;
  }): Promise<BenchmarkResult> {
    const perLocale: { locale: string; supported: boolean; scores: DimensionScores | null }[] = [];
    const scoreTuples: string[] = [];
    for (const locale of input.matrix.releasedLocales) {
      const localeScenarios = input.scenarios.filter((s) => s.locale === locale);
      if (localeScenarios.length === 0) {
        // Honest: no scenarios for this released locale → unsupported, not guessed.
        perLocale.push({ locale, supported: false, scores: null });
        continue;
      }
      let agg = { teachingQuality: 0, citationCorrectness: 0, safety: 0, latencyMs: 0, cost: 0, quotaOk: true, count: 0 };
      for (const scenario of localeScenarios) {
        if (!(await this.store.isPermittedSource(scenario.sourceId))) {
          throw new BenchmarkError('source_not_permitted');
        }
        const scores = await this.store.runCandidate(input.candidate, scenario);
        agg.teachingQuality += scores.teachingQuality;
        agg.citationCorrectness += scores.citationCorrectness;
        agg.safety += scores.safety;
        agg.latencyMs += scores.latencyMs;
        agg.cost += scores.totalPerUseCost;
        agg.quotaOk = agg.quotaOk && scores.quotaRespected;
        agg.count += 1;
        scoreTuples.push(`${scenario.scenarioId}|${scores.teachingQuality}|${scores.citationCorrectness}|${scores.safety}|${scores.latencyMs}|${scores.totalPerUseCost}`);
      }
      perLocale.push({
        locale,
        supported: true,
        scores: {
          teachingQuality: round1(agg.teachingQuality / agg.count),
          citationCorrectness: round1(agg.citationCorrectness / agg.count),
          safety: round1(agg.safety / agg.count),
          latencyMs: Math.round(agg.latencyMs / agg.count),
          quotaRespected: agg.quotaOk,
          totalPerUseCost: round2(agg.cost / agg.count),
        },
      });
    }

    const canonical = `${input.rubricVersion}|${input.candidate.candidateId}|${input.candidate.route}|${input.candidate.version}|${scoreTuples.sort().join(';')}`;
    const scoreDigest = createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 32);
    return {
      candidateId: input.candidate.candidateId,
      route: input.candidate.route,
      version: input.candidate.version,
      rubricVersion: input.rubricVersion,
      perLocale,
      scoreDigest,
    };
  }

  /** Select the winner against thresholds and PIN its exact route/version. */
  selectAndPin(input: {
    operator: { operatorId: string };
    results: readonly BenchmarkResult[];
    thresholds: SelectionThresholds;
  }): PinnedSelection {
    for (const result of input.results) {
      const meets = result.perLocale
        .filter((l) => l.supported)
        .every((l) => {
          const s = l.scores as DimensionScores;
          return (
            s.teachingQuality >= input.thresholds.minTeachingQuality &&
            s.citationCorrectness >= input.thresholds.minCitationCorrectness &&
            s.safety >= input.thresholds.minSafety &&
            s.latencyMs <= input.thresholds.maxLatencyMs &&
            s.totalPerUseCost <= input.thresholds.maxPerUseCost &&
            s.quotaRespected
          );
        });
      if (meets && result.perLocale.some((l) => l.supported)) {
        return {
          candidateId: result.candidateId,
          provider: result.candidateId.split(':')[0] ?? result.candidateId,
          route: result.route,
          version: result.version,
          rubricVersion: result.rubricVersion,
          pinnedAt: this.now().toISOString(),
        };
      }
    }
    throw new BenchmarkError('no_candidate_meets_threshold');
  }
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

export type { BenchmarkErrorType };
