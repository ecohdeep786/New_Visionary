// AI-13 (KAN-142) — the scorecard domain's typed state seams. The owning store
// (versioned definitions, family registry, contamination registry, runs)
// implements these at integration; the in-memory implementation is
// contract-true and fails closed.
import type {
  ScorecardDefinition,
  ScoreRun,
  TaskFamily,
} from './scorecard-types';

export interface ScorecardStore {
  // Versioned append-only scorecard definitions.
  saveDefinition(def: ScorecardDefinition): Promise<void>;
  definition(scorecardId: string, version: number): Promise<ScorecardDefinition | undefined>;

  // Task family registry.
  saveFamily(family: TaskFamily): Promise<void>;
  family(familyId: string): Promise<TaskFamily | undefined>;

  // Contamination registry (content hashes).
  markContaminated(contentHash: string): Promise<void>;
  isContaminated(contentHash: string): Promise<boolean>;

  // Runs.
  insertRun(run: ScoreRun): Promise<void>;
  saveRun(run: ScoreRun): Promise<void>;
  run(runId: string): Promise<ScoreRun | undefined>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Contract-true in-memory store; every seam fails closed. */
export class InMemoryScorecardStore implements ScorecardStore {
  private definitions = new Map<string, ScorecardDefinition>();
  private families = new Map<string, TaskFamily>();
  private contaminated = new Set<string>();
  private runs = new Map<string, ScoreRun>();

  async saveDefinition(def: ScorecardDefinition): Promise<void> {
    this.definitions.set(`${def.scorecardId}@${def.version}`, clone(def));
  }

  async definition(scorecardId: string, version: number): Promise<ScorecardDefinition | undefined> {
    const found = this.definitions.get(`${scorecardId}@${version}`);
    return found ? clone(found) : undefined;
  }

  async saveFamily(family: TaskFamily): Promise<void> {
    this.families.set(family.familyId, clone(family));
  }

  async family(familyId: string): Promise<TaskFamily | undefined> {
    const found = this.families.get(familyId);
    return found ? clone(found) : undefined;
  }

  async markContaminated(contentHash: string): Promise<void> {
    this.contaminated.add(contentHash);
  }

  async isContaminated(contentHash: string): Promise<boolean> {
    return this.contaminated.has(contentHash);
  }

  async insertRun(run: ScoreRun): Promise<void> {
    this.runs.set(run.runId, clone(run));
  }

  async saveRun(run: ScoreRun): Promise<void> {
    this.runs.set(run.runId, clone(run));
  }

  async run(runId: string): Promise<ScoreRun | undefined> {
    const found = this.runs.get(runId);
    return found ? clone(found) : undefined;
  }
}
