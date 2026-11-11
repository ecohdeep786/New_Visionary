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

  /** Atomic revision-fenced attempt commit: unseen submissionId required; the
   * journey's CURRENT revision must equal expectedRevision; the attempt row and
   * the revision advance apply together. Two concurrent commands with the same
   * expectedRevision can never both advance. (SQL adapter: one conditional
   * UPDATE ... WHERE revision = expectedRevision inside the insert transaction.) */
  commitAttempt(input: { journeyId: string; ownerUid: string; submissionId: string; checkId: string; answer: unknown; expectedRevision: number; committedAt: string }): Promise<{ ok: true; revision: number } | { ok: false; reason: 'unknown_journey' | 'duplicate' | 'revision_conflict' }>;
  /** Atomic revision-fenced draft save: the draft row and the revision advance
   * apply together under the same fence as commitAttempt. */
  commitDraft(input: { journeyId: string; ownerUid: string; draftId: string; payload: unknown; expectedRevision: number; savedAt: string }): Promise<{ ok: true; revision: number } | { ok: false; reason: 'unknown_journey' | 'revision_conflict' }>;
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

  async commitAttempt(input: { journeyId: string; ownerUid: string; submissionId: string; checkId: string; answer: unknown; expectedRevision: number; committedAt: string }): Promise<{ ok: true; revision: number } | { ok: false; reason: 'unknown_journey' | 'duplicate' | 'revision_conflict' }> {
    const journey = this.journeys.get(input.journeyId);
    if (!journey) return { ok: false, reason: 'unknown_journey' };
    if (this.attemptRows.has(`${input.journeyId}|${input.submissionId}`)) return { ok: false, reason: 'duplicate' };
    if (journey.revision !== input.expectedRevision) return { ok: false, reason: 'revision_conflict' };
    const revision = journey.revision + 1;
    this.attemptRows.set(`${input.journeyId}|${input.submissionId}`, { journeyId: input.journeyId, owner: { uid: input.ownerUid, workspaceId: journey.owner.workspaceId }, submissionId: input.submissionId, checkId: input.checkId, answer: input.answer, revision, committedAt: input.committedAt });
    this.journeys.set(input.journeyId, { ...journey, revision });
    return { ok: true, revision };
  }
  async commitDraft(input: { journeyId: string; ownerUid: string; draftId: string; payload: unknown; expectedRevision: number; savedAt: string }): Promise<{ ok: true; revision: number } | { ok: false; reason: 'unknown_journey' | 'revision_conflict' }> {
    const journey = this.journeys.get(input.journeyId);
    if (!journey) return { ok: false, reason: 'unknown_journey' };
    if (journey.revision !== input.expectedRevision) return { ok: false, reason: 'revision_conflict' };
    const revision = journey.revision + 1;
    this.draftRows.set(`${input.journeyId}|${input.draftId}`, { draftId: input.draftId, payload: input.payload, revision, savedAt: input.savedAt });
    this.journeys.set(input.journeyId, { ...journey, revision });
    return { ok: true, revision };
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
