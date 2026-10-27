// LEARN-07 (KAN-73) — verify the composed learner journey:
// concept → check/practice → private project → save → second-device resume,
// including source withdrawal, concurrent edits, failed saves and session
// expiry.
//
// The checkpoint here is ONE server-owned journey contract that composes the
// lane's established semantics end to end:
//   - The journey starts ONLY from a released (concept, source revision) —
//     server-side eligibility, never a frontend label.
//   - Check/practice attempts are idempotent by submission id (LEARN-02) and
//     revision-fenced; a private project draft saves under the same fencing.
//   - Concurrent edits: a stale revision is refused with the local draft
//     preserved VISIBLY and the committed revision returned for rebase.
//   - Failed saves: a store failure preserves the learner's local work
//     visibly — nothing partial is ever persisted.
//   - Source withdrawal is SERVER-LIVE: once the source is withdrawn, new
//     practice/draft commands are denied (preserved local), while the
//     committed journey stays resumable with honest `withdrawn` availability.
//   - Session expiry: an expired journey refuses new commands; the committed
//     state remains resumable and reports `expired` honestly.
//   - Every refusal preserves the local work visibly; wrong users are denied.
//
// Exit: a committed learner journey resumes correctly on another device.

/** Server-owned journey authority. */
export interface JourneyOwner {
  uid: string;
  workspaceId: string;
}

export type JourneyState = 'active' | 'completed' | 'cancelled' | 'expired';

/** Server-live source availability for the pinned revision. */
export type SourceAvailability = 'available' | 'withdrawn';

/** A committed practice attempt inside the journey. */
export interface JourneyAttempt {
  submissionId: string;
  checkId: string;
  answer: unknown;
  revision: number;
  committedAt: string;
}

/** The private project draft saved inside the journey. */
export interface JourneyDraft {
  draftId: string;
  payload: unknown;
  revision: number;
  savedAt: string;
}

/** The committed journey state another device resumes from. */
export interface JourneyResume {
  journeyId: string;
  conceptId: string;
  sourceVersion: string;
  state: JourneyState;
  /** Server-live availability of the pinned source right now. */
  sourceAvailability: SourceAvailability;
  revision: number;
  attempts: readonly JourneyAttempt[];
  latestDraft: JourneyDraft | null;
}

export type JourneyOutcome = 'committed' | 'duplicate';

export interface JourneyCommandResult {
  outcome: JourneyOutcome;
  journeyId: string;
  revision: number;
}

/** Visible unsaved-local recovery on any refusal. */
export interface JourneyRefusal {
  ok: false;
  reason:
    | 'not_owner'
    | 'unknown_journey'
    | 'revision_conflict'
    | 'source_withdrawn'
    | 'journey_expired'
    | 'journey_closed'
    | 'save_failed'
    | 'source_revision_unknown';
  /** The learner's local work is preserved and visible, never silently dropped. */
  preservedLocal: true;
  /** Current committed revision for rebase (present on revision_conflict). */
  currentRevision?: number;
}

export class JourneyError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_journey'
      | 'revision_conflict'
      | 'source_withdrawn'
      | 'journey_expired'
      | 'journey_closed'
      | 'save_failed'
      | 'source_revision_unknown'
  ) {
    super(code);
  }
}
