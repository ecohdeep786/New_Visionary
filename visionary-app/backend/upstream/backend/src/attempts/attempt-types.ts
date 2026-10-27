// LEARN-02 (KAN-68) — persist checks, answers, attempts, rubric/evidence
// references and revision history; validate eligibility server-side and
// deduplicate repeat submissions.
//
// The checkpoint here is private, server-owned attempt persistence (parent
// KAN-7, P05):
//   - Eligibility is validated SERVER-SIDE before anything is recorded: a
//     submission is accepted only when the learner owns the session AND the
//     pinned (concept, source revision) is released/eligible AND the check
//     belongs to that concept's revision. Denied submissions never consume an
//     attempt number (fail closed, nothing recorded).
//   - Repeat submissions are DEDUPLICATED by client submission id: a retried
//     submission converges to the same committed attempt (no duplicate rows,
//     no attempt-number inflation, no double-counted evidence).
//   - Attempts are private to the learner's workspace; a wrong uid/workspace is
//     refused before anything is persisted.
//   - Rubric/evidence references are preserved verbatim on the attempt — the
//     attempt is evidence-backed, not a bare score.
//   - Revision history is IMMUTABLE and append-only: every accepted submission
//     appends one entry; earlier entries are never rewritten (later reads see
//     exactly what was committed at the time).
//
// Exit: distinct learning evidence the projections (LEARN-03) can trust.

/** Server-owned authority for attempt persistence. */
export interface AttemptOwner {
  uid: string;
  workspaceId: string;
}

/** The check being answered (belongs to a concept's source revision). */
export interface CheckRef {
  conceptId: string;
  sourceVersion: string;
  checkId: string;
}

/** Rubric/evidence references preserved verbatim (LEARN-03 consumes these). */
export interface EvidenceRefs {
  rubricRef: string | null;
  evidenceRef: string | null;
}

/** An accepted, deduplicated attempt. */
export interface Attempt {
  submissionId: string;
  owner: AttemptOwner;
  sessionId: string;
  check: CheckRef;
  /** The exact submitted answer payload (read-back verbatim). */
  answer: unknown;
  evidence: EvidenceRefs;
  /** 1-based per (owner, check); denied submissions never consume a number. */
  attemptNo: number;
  submittedAt: string;
}

/** Immutable revision-history entry (append-only ledger of accepted attempts). */
export interface AttemptHistoryEntry {
  submissionId: string;
  attemptNo: number;
  check: CheckRef;
  answer: unknown;
  evidence: EvidenceRefs;
  committedAt: string;
}

export type AttemptOutcome = 'committed' | 'duplicate';

export interface SubmitResult {
  outcome: AttemptOutcome;
  submissionId: string;
  attemptNo: number;
}

/** Honest denial — nothing recorded, no attempt consumed. */
export interface AttemptDenial {
  ok: false;
  reason:
    | 'not_owner'
    | 'unknown_session'
    | 'concept_not_eligible'
    | 'source_revision_unknown'
    | 'check_unknown';
}

export class AttemptError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_session'
      | 'concept_not_eligible'
      | 'source_revision_unknown'
      | 'check_unknown'
  ) {
    super(code);
  }
}
