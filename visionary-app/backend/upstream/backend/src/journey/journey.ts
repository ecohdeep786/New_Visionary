// LEARN-07 (KAN-73) — the composed learner-journey contract.
//
// Core responsibilities (server-owned; every refusal preserves local work):
//   1. startJourney: only from a RELEASED (concept, source revision) — a pin to
//      unavailable content is refused before anything persists.
//   2. practice: idempotent by submission id, revision-fenced; denied while the
//      source is withdrawn (server-live) or the journey expired/closed.
//   3. saveDraft: the private project draft saves under the same fencing; a
//      store failure is a VISIBLE preserved-local refusal — nothing partial
//      persists.
//   4. resume: the committed journey (attempts + latest draft + server-live
//      source availability + state) — exactly what a second device needs.
//   5. expire: session expiry refuses new commands honestly while the committed
//      state stays resumable.
import type {
  JourneyAttempt,
  JourneyCommandResult,
  JourneyDraft,
  JourneyError as JourneyErrorType,
  JourneyOwner,
  JourneyRefusal,
  JourneyResume,
} from './journey-types';
import { JourneyError } from './journey-types';
import type { JourneyStore } from './journey-lookups';

export class LearnerJourneyService {
  private journeyCounter = 0;
  constructor(
    private readonly store: JourneyStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Start a journey from a released (concept, source revision). */
  async startJourney(owner: JourneyOwner, conceptId: string, sourceVersion: string): Promise<string> {
    if (!(await this.store.isSourceAvailable(conceptId, sourceVersion))) {
      throw new JourneyError('source_revision_unknown');
    }
    const journeyId = `jn_${++this.journeyCounter}`;
    await this.store.insertJourney({ journeyId, owner: { ...owner }, conceptId, sourceVersion, state: 'active', revision: 1 });
    return journeyId;
  }

  /** Commit a practice attempt: idempotent, revision-fenced, withdrawal-aware. */
  async practice(input: {
    journeyId: string;
    owner: JourneyOwner;
    submissionId: string;
    checkId: string;
    answer: unknown;
    expectedRevision: number;
  }): Promise<JourneyCommandResult | JourneyRefusal> {
    const journey = await this.store.byJourneyId(input.journeyId);
    if (!journey) return this.refusal('unknown_journey');
    if (journey.owner.uid !== input.owner.uid || journey.owner.workspaceId !== input.owner.workspaceId) return this.refusal('not_owner');

    const existing = await this.store.bySubmissionId(input.journeyId, input.submissionId);
    if (existing) return { outcome: 'duplicate', journeyId: input.journeyId, revision: existing.revision };

    const guard = await this.commandGuard(journey);
    if (guard) return guard;
    if (journey.revision !== input.expectedRevision) {
      return { ok: false, reason: 'revision_conflict', preservedLocal: true, currentRevision: journey.revision };
    }
    if (!(await this.store.isSourceAvailable(journey.conceptId, journey.sourceVersion))) {
      return this.refusal('source_withdrawn');
    }

    const revision = journey.revision + 1;
    const attempt: JourneyAttempt = {
      submissionId: input.submissionId,
      checkId: input.checkId,
      answer: input.answer,
      revision,
      committedAt: this.now().toISOString(),
    };
    await this.store.insertAttempt({ ...attempt, journeyId: input.journeyId, owner: { ...input.owner } });
    await this.store.updateJourney({ ...journey, revision });
    return { outcome: 'committed', journeyId: input.journeyId, revision };
  }

  /**
   * Save the private project draft: revision-fenced; a store failure is a
   * visible preserved-local refusal (nothing partial persists).
   */
  async saveDraft(input: {
    journeyId: string;
    owner: JourneyOwner;
    draftId: string;
    payload: unknown;
    expectedRevision: number;
    /** Test/integration fault injection for failed-save semantics. */
    failSave?: boolean;
  }): Promise<JourneyCommandResult | JourneyRefusal> {
    const journey = await this.store.byJourneyId(input.journeyId);
    if (!journey) return this.refusal('unknown_journey');
    if (journey.owner.uid !== input.owner.uid || journey.owner.workspaceId !== input.owner.workspaceId) return this.refusal('not_owner');

    const guard = await this.commandGuard(journey);
    if (guard) return guard;
    if (journey.revision !== input.expectedRevision) {
      return { ok: false, reason: 'revision_conflict', preservedLocal: true, currentRevision: journey.revision };
    }
    if (!(await this.store.isSourceAvailable(journey.conceptId, journey.sourceVersion))) {
      return this.refusal('source_withdrawn');
    }
    if (input.failSave) {
      // The store refused the write: nothing persisted; local work preserved.
      return this.refusal('save_failed');
    }

    const revision = journey.revision + 1;
    const draft: JourneyDraft = { draftId: input.draftId, payload: input.payload, revision, savedAt: this.now().toISOString() };
    await this.store.saveDraft(input.journeyId, draft);
    await this.store.updateJourney({ ...journey, revision });
    return { outcome: 'committed', journeyId: input.journeyId, revision };
  }

  /** The committed journey — what a second device resumes (owner-only). */
  async resume(journeyId: string, owner: JourneyOwner): Promise<JourneyResume | JourneyRefusal> {
    const journey = await this.store.byJourneyId(journeyId);
    if (!journey) return this.refusal('unknown_journey');
    if (journey.owner.uid !== owner.uid || journey.owner.workspaceId !== owner.workspaceId) return this.refusal('not_owner');
    const attempts = await this.store.attemptsFor(journeyId);
    const drafts = await this.store.draftsFor(journeyId);
    return {
      journeyId,
      conceptId: journey.conceptId,
      sourceVersion: journey.sourceVersion,
      state: journey.state,
      sourceAvailability: (await this.store.isSourceAvailable(journey.conceptId, journey.sourceVersion)) ? 'available' : 'withdrawn',
      revision: journey.revision,
      attempts: attempts.map((a) => ({ submissionId: a.submissionId, checkId: a.checkId, answer: a.answer, revision: a.revision, committedAt: a.committedAt })),
      latestDraft: drafts.length ? drafts[drafts.length - 1] : null,
    };
  }

  /** Expire the journey (session expiry): new commands refused; resume honest. */
  async expire(journeyId: string, owner: JourneyOwner): Promise<{ ok: true; state: 'expired' } | JourneyRefusal> {
    const journey = await this.store.byJourneyId(journeyId);
    if (!journey) return this.refusal('unknown_journey');
    if (journey.owner.uid !== owner.uid || journey.owner.workspaceId !== owner.workspaceId) return this.refusal('not_owner');
    if (journey.state === 'expired') return { ok: true, state: 'expired' };
    await this.store.updateJourney({ ...journey, state: 'expired' });
    return { ok: true, state: 'expired' };
  }

  /** Withdraw the pinned source (server-live gate; retrieval-gate integration). */
  async withdrawSource(conceptId: string, sourceVersion: string): Promise<void> {
    await this.store.setSourceAvailable(conceptId, sourceVersion, false);
  }

  private async commandGuard(journey: { state: string }): Promise<JourneyRefusal | null> {
    if (journey.state === 'expired') return this.refusal('journey_expired');
    if (journey.state === 'cancelled' || journey.state === 'completed') return this.refusal('journey_closed');
    return null;
  }

  private refusal(reason: JourneyRefusal['reason']): JourneyRefusal {
    return { ok: false, reason, preservedLocal: true };
  }
}

export type { JourneyErrorType };
