// LEARN-07 (KAN-73) — the journey contract's typed state seams. The owning
// stores (journeys, attempts, drafts, source availability) implement these at
// integration; the in-memory implementation is contract-true and fails closed.
import type { JourneyAttempt, JourneyDraft, JourneyOwner } from './journey-types';

/** The stored attempt row: journey-scoped and owner-stamped. */
export type StoredAttempt = JourneyAttempt & { journeyId: string; owner: JourneyOwner };

export interface JourneyRecord {
  journeyId: string;
  owner: JourneyOwner;
  conceptId: string;
  sourceVersion: string;
  state: 'active' | 'completed' | 'cancelled' | 'expired';
  revision: number;
}

export interface JourneyStore {
  insertJourney(record: JourneyRecord): Promise<void>;
  byJourneyId(journeyId: string): Promise<JourneyRecord | undefined>;
  updateJourney(record: JourneyRecord): Promise<void>;
  insertAttempt(attempt: StoredAttempt): Promise<void>;
  bySubmissionId(journeyId: string, submissionId: string): Promise<StoredAttempt | undefined>;
  attemptsFor(journeyId: string): Promise<StoredAttempt[]>;
  saveDraft(journeyId: string, draft: JourneyDraft): Promise<void>;
  draftsFor(journeyId: string): Promise<JourneyDraft[]>;
  /** Server-live source availability (retrieval-gate integration). */
  isSourceAvailable(conceptId: string, sourceVersion: string): Promise<boolean>;
  setSourceAvailable(conceptId: string, sourceVersion: string, available: boolean): Promise<void>;
}

/** Contract-true in-memory store; tests drive the full contract without a DB. */
export class InMemoryJourneyStore implements JourneyStore {
  private journeys = new Map<string, JourneyRecord>();
  private attemptRows = new Map<string, StoredAttempt>();
  private draftRows = new Map<string, JourneyDraft>();
  private availability = new Set<string>();

  async insertJourney(record: JourneyRecord): Promise<void> {
    this.journeys.set(record.journeyId, { ...record, owner: { ...record.owner } });
  }

  async byJourneyId(journeyId: string): Promise<JourneyRecord | undefined> {
    const found = this.journeys.get(journeyId);
    return found ? { ...found, owner: { ...found.owner } } : undefined;
  }

  async updateJourney(record: JourneyRecord): Promise<void> {
    this.journeys.set(record.journeyId, { ...record, owner: { ...record.owner } });
  }

  async insertAttempt(attempt: StoredAttempt): Promise<void> {
    this.attemptRows.set(`${attempt.journeyId}|${attempt.submissionId}`, { ...attempt, owner: { ...attempt.owner } });
  }

  async bySubmissionId(journeyId: string, submissionId: string): Promise<StoredAttempt | undefined> {
    const found = this.attemptRows.get(`${journeyId}|${submissionId}`);
    return found ? { ...found, owner: { ...found.owner } } : undefined;
  }

  async attemptsFor(journeyId: string): Promise<StoredAttempt[]> {
    return [...this.attemptRows.values()]
      .filter((a) => a.journeyId === journeyId)
      .map((a) => ({ ...a, owner: { ...a.owner } }))
      .sort((a, b) => a.revision - b.revision);
  }

  async saveDraft(journeyId: string, draft: JourneyDraft): Promise<void> {
    this.draftRows.set(`${journeyId}|${draft.draftId}`, { ...draft });
  }

  async draftsFor(journeyId: string): Promise<JourneyDraft[]> {
    return [...this.draftRows.values()]
      .filter((d) => this.draftRows.get(`${journeyId}|${d.draftId}`) !== undefined)
      .map((d) => ({ ...d }))
      .sort((a, b) => a.revision - b.revision);
  }

  async isSourceAvailable(conceptId: string, sourceVersion: string): Promise<boolean> {
    return this.availability.has(`${conceptId}@${sourceVersion}`);
  }

  async setSourceAvailable(conceptId: string, sourceVersion: string, available: boolean): Promise<void> {
    if (available) this.availability.add(`${conceptId}@${sourceVersion}`);
    else this.availability.delete(`${conceptId}@${sourceVersion}`);
  }

  static journey(input: { journeyId: string; owner: JourneyOwner; conceptId: string; sourceVersion?: string; state?: JourneyRecord['state']; revision?: number }): JourneyRecord {
    return {
      journeyId: input.journeyId,
      owner: input.owner,
      conceptId: input.conceptId,
      sourceVersion: input.sourceVersion ?? '1.0.0',
      state: input.state ?? 'active',
      revision: input.revision ?? 1,
    };
  }
}
