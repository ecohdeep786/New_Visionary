// LEARN-02 (KAN-68) — the attempt domain's typed state seams. The owning store
// (private attempts, revision history, command outcomes) implements these at
// integration; the in-memory implementation is contract-true and fails closed.
import type { Attempt, AttemptHistoryEntry, AttemptOwner, CheckRef } from './attempt-types';

/** Eligibility facts the attempt service validates server-side before recording. */
export interface AttemptEligibilityLookup {
  /** The learner owns this active session (uid+workspace bound). */
  sessionOwner(sessionId: string): Promise<AttemptOwner | undefined>;
  /** True only when this exact concept+version is a released, eligible revision. */
  isReleasedRevision(conceptId: string, sourceVersion: string): Promise<boolean>;
  /** True only when the check exists on that concept's revision. */
  checkExists(check: CheckRef): Promise<boolean>;
}

export interface AttemptStore {
  insertAttempt(attempt: Attempt): Promise<void>;
  bySubmissionId(submissionId: string): Promise<Attempt | undefined>;
  attemptsFor(owner: AttemptOwner, check: CheckRef): Promise<Attempt[]>;
  appendHistory(entry: AttemptHistoryEntry): Promise<void>;
  historyFor(owner: AttemptOwner, check: CheckRef): Promise<AttemptHistoryEntry[]>;
}

/** Contract-true in-memory store; tests drive the full domain without a DB. */
export class InMemoryAttemptStore implements AttemptStore {
  private attempts = new Map<string, Attempt>();
  private history: AttemptHistoryEntry[] = [];

  async insertAttempt(attempt: Attempt): Promise<void> {
    this.attempts.set(attempt.submissionId, { ...attempt, owner: { ...attempt.owner }, check: { ...attempt.check }, evidence: { ...attempt.evidence } });
  }

  async bySubmissionId(submissionId: string): Promise<Attempt | undefined> {
    const found = this.attempts.get(submissionId);
    return found ? { ...found, owner: { ...found.owner }, check: { ...found.check }, evidence: { ...found.evidence } } : undefined;
  }

  async attemptsFor(owner: AttemptOwner, check: CheckRef): Promise<Attempt[]> {
    return [...this.attempts.values()]
      .filter((a) => a.owner.uid === owner.uid && a.owner.workspaceId === owner.workspaceId && a.check.checkId === check.checkId)
      .map((a) => ({ ...a, owner: { ...a.owner }, check: { ...a.check }, evidence: { ...a.evidence } }))
      .sort((a, b) => a.attemptNo - b.attemptNo);
  }

  async appendHistory(entry: AttemptHistoryEntry): Promise<void> {
    // Append-only: the array is replaced with a new tail entry, never rewritten.
    this.history = [...this.history, { ...entry, check: { ...entry.check }, evidence: { ...entry.evidence } }];
  }

  async historyFor(owner: AttemptOwner, check: CheckRef): Promise<AttemptHistoryEntry[]> {
    return this.history
      .filter((h) => h.check.checkId === check.checkId)
      .map((h) => ({ ...h, check: { ...h.check }, evidence: { ...h.evidence } }));
  }

  /** Helpers to build eligibility facts (see tests). */
  static eligibility(input: {
    sessions?: readonly { sessionId: string; owner: AttemptOwner }[];
    released?: readonly { conceptId: string; sourceVersion: string }[];
    checks?: readonly CheckRef[];
  }): AttemptEligibilityLookup {
    const sessions = new Map((input.sessions ?? []).map((s) => [s.sessionId, s.owner]));
    const released = new Set((input.released ?? []).map((r) => `${r.conceptId}@${r.sourceVersion}`));
    const checks = new Set((input.checks ?? []).map((c) => `${c.conceptId}@${c.sourceVersion}|${c.checkId}`));
    return {
      async sessionOwner(sessionId: string) {
        const owner = sessions.get(sessionId);
        return owner ? { ...owner } : undefined;
      },
      async isReleasedRevision(conceptId: string, sourceVersion: string) {
        return released.has(`${conceptId}@${sourceVersion}`);
      },
      async checkExists(check: CheckRef) {
        return checks.has(`${check.conceptId}@${check.sourceVersion}|${check.checkId}`);
      },
    };
  }
}
