// AI-01 (KAN-83) — the benchmark harness's typed state seams. The owning stores
// (permitted sources, candidate runners) implement these at integration; the
// in-memory implementation is contract-true and fails closed.
import type { BenchmarkCandidate, BenchmarkScenario, DimensionScores } from './benchmark-types';

export interface BenchmarkStore {
  /** True only when the source is a permitted benchmark source. */
  isPermittedSource(sourceId: string): Promise<boolean>;
  /** Run one candidate against one scenario (the live-API adapter at integration). */
  runCandidate(candidate: BenchmarkCandidate, scenario: BenchmarkScenario): Promise<DimensionScores>;
}

/** Contract-true in-memory store; the runner is injected (no live calls here). */
export class InMemoryBenchmarkStore implements BenchmarkStore {
  constructor(
    private readonly permittedSources: readonly string[],
    private readonly runner: (candidate: BenchmarkCandidate, scenario: BenchmarkScenario) => DimensionScores,
  ) {}

  async isPermittedSource(sourceId: string): Promise<boolean> {
    return this.permittedSources.includes(sourceId);
  }

  async runCandidate(candidate: BenchmarkCandidate, scenario: BenchmarkScenario): Promise<DimensionScores> {
    return this.runner(candidate, scenario);
  }
}
