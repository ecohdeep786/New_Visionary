// ROLE-10 (KAN-160) — the teacher coaching domain's typed state seams.
import type {
  CoachingCheckpoint,
  CoachingCorrection,
  CoachingJournalEntry,
  CoachingSuggestion,
  CoachOwner,
  TeachingGoal,
} from './coaching-types';

export interface CoachingStore {
  saveGoal(goal: TeachingGoal): Promise<void>;
  goal(goalId: string): Promise<TeachingGoal | undefined>;
  saveCheckpoint(checkpoint: CoachingCheckpoint): Promise<void>;
  checkpoints(goalId: string): Promise<CoachingCheckpoint[]>;
  saveSuggestion(suggestion: CoachingSuggestion): Promise<void>;
  suggestion(suggestionId: string): Promise<CoachingSuggestion | undefined>;
  saveCorrection(correction: CoachingCorrection): Promise<void>;
  corrections(suggestionId: string): Promise<CoachingCorrection[]>;
  appendJournalEntry(entry: CoachingJournalEntry): Promise<void>;
  journal(goalId: string): Promise<CoachingJournalEntry[]>;
  /**
   * Whether the chosen class summary is CURRENTLY permitted for this teacher —
   * the seam that binds the real ROLE-01 classroom / ROLE-06 organization
   * relationship stores at cutover. Changed employment or revocation flips the
   * answer and the coaching service must stop using that summary.
   */
  isClassSummaryCurrentlyPermitted(teacherUid: string, classSummaryRef: string): Promise<boolean>;
  /** Whether an evaluated, accepted connected coaching adapter is available. */
  connectedAdapterAccepted(): boolean;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class InMemoryCoachingStore implements CoachingStore {
  private goalsById = new Map<string, TeachingGoal>();
  private checkpointsByGoal = new Map<string, CoachingCheckpoint[]>();
  private suggestionsById = new Map<string, CoachingSuggestion>();
  private correctionsBySuggestion = new Map<string, CoachingCorrection[]>();
  private journalByGoal = new Map<string, CoachingJournalEntry[]>();
  /** teacherUid|classSummaryRef → permitted */
  private permittedSummaries = new Set<string>();
  private adapterAccepted = false;

  seedClassSummary(teacherUid: string, classSummaryRef: string): void {
    this.permittedSummaries.add(`${teacherUid}|${classSummaryRef}`);
  }
  /** REVOKE the permission (changed employment / revocation / class change). */
  revokeClassSummary(teacherUid: string, classSummaryRef: string): void {
    this.permittedSummaries.delete(`${teacherUid}|${classSummaryRef}`);
  }
  setConnectedAdapterAccepted(accepted: boolean): void {
    this.adapterAccepted = accepted;
  }

  async saveGoal(goal: TeachingGoal): Promise<void> {
    this.goalsById.set(goal.goalId, clone(goal));
  }
  async goal(goalId: string): Promise<TeachingGoal | undefined> {
    const found = this.goalsById.get(goalId);
    return found ? clone(found) : undefined;
  }
  async saveCheckpoint(checkpoint: CoachingCheckpoint): Promise<void> {
    const list = this.checkpointsByGoal.get(checkpoint.goalId) ?? [];
    list.push(clone(checkpoint));
    this.checkpointsByGoal.set(checkpoint.goalId, list);
  }
  async checkpoints(goalId: string): Promise<CoachingCheckpoint[]> {
    return clone(this.checkpointsByGoal.get(goalId) ?? []);
  }
  async saveSuggestion(suggestion: CoachingSuggestion): Promise<void> {
    this.suggestionsById.set(suggestion.suggestionId, clone(suggestion));
  }
  async suggestion(suggestionId: string): Promise<CoachingSuggestion | undefined> {
    const found = this.suggestionsById.get(suggestionId);
    return found ? clone(found) : undefined;
  }
  async saveCorrection(correction: CoachingCorrection): Promise<void> {
    const list = this.correctionsBySuggestion.get(correction.suggestionId) ?? [];
    list.push(clone(correction));
    this.correctionsBySuggestion.set(correction.suggestionId, list);
  }
  async corrections(suggestionId: string): Promise<CoachingCorrection[]> {
    return clone(this.correctionsBySuggestion.get(suggestionId) ?? []);
  }
  async appendJournalEntry(entry: CoachingJournalEntry): Promise<void> {
    const list = this.journalByGoal.get(entry.goalId) ?? [];
    list.push(clone(entry));
    this.journalByGoal.set(entry.goalId, list);
  }
  async journal(goalId: string): Promise<CoachingJournalEntry[]> {
    return clone(this.journalByGoal.get(goalId) ?? []);
  }
  async isClassSummaryCurrentlyPermitted(teacherUid: string, classSummaryRef: string): Promise<boolean> {
    return this.permittedSummaries.has(`${teacherUid}|${classSummaryRef}`);
  }
  connectedAdapterAccepted(): boolean {
    return this.adapterAccepted;
  }
}
