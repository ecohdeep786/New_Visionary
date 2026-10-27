// LEARN-01 (KAN-67) — owned learning sessions, selected source/revision,
// checkpoints and resume cursors behind current frontend facades.
//
// The checkpoint here is a server-owned session domain (parent KAN-7, P05):
//   - A session is OWNED by one uid in one workspace; every command is
//     owner-scoped — a wrong uid or workspace is refused (server-derived
//     authority; preview membership is not permission).
//   - The session is PINNED to an exact released source revision (conceptId +
//     sourceVersion). A pin to an unknown/unreleased revision is refused — a
//     journey never binds to content the server cannot prove.
//   - Checkpoints are idempotent by client command id: a retried/duplicated
//     command converges to the same committed outcome (no duplicate rows, no
//     double-advance), and stale revisions are refused with optimistic
//     fencing (the committed revision is returned so the client can rebase).
//   - The resume cursor is the COMMITTED journey state: latest checkpoint
//     payload, committed revision, committing device. A second device resumes
//     the same committed cursor — a committed learner journey resumes
//     correctly on another device (the exit).
//   - Unsaved local recovery is visible: every refusal echoes back the local
//     draft as preserved (`preservedLocal: true`) with the honest reason —
//     a failed command never silently drops the learner's local work.
//
// Exit: a committed learner journey resumes correctly on another device.

/** Server-owned authority: one uid in one workspace owns the session. */
export interface SessionOwner {
  uid: string;
  workspaceId: string;
}

/** The exact released source revision a session is pinned to. */
export interface SourcePin {
  conceptId: string;
  /** The selected source revision (source_version) for this journey. */
  sourceVersion: string;
}

export type SessionStatus = 'active' | 'completed' | 'cancelled';

/** An owned learning session pinned to a source revision. */
export interface LearningSession {
  sessionId: string;
  owner: SessionOwner;
  pin: SourcePin;
  status: SessionStatus;
  /** Optimistic-concurrency revision; advances on every committed command. */
  revision: number;
  createdAt: string;
  updatedAt: string;
}

/** A committed checkpoint (the durable unit of journey progress). */
export interface Checkpoint {
  /** Client-supplied idempotency key — replays converge to this row. */
  commandId: string;
  sessionId: string;
  committedBy: SessionOwner;
  /** Device that committed (two-device recovery observation). */
  deviceId: string;
  payload: unknown;
  revision: number;
  committedAt: string;
}

/** The committed journey state another device resumes from. */
export interface ResumeCursor {
  sessionId: string;
  pin: SourcePin;
  status: SessionStatus;
  revision: number;
  /** Latest committed checkpoint payload, or null for a fresh session. */
  latestPayload: unknown;
  latestCommandId: string | null;
  latestDeviceId: string | null;
  committedAt: string | null;
}

export type CommandOutcome = 'committed' | 'duplicate';

/** A committed (or idempotently replayed) checkpoint result. */
export interface CheckpointResult {
  outcome: CommandOutcome;
  sessionId: string;
  revision: number;
  commandId: string;
}

/** Visible unsaved-local recovery: a refusal that preserves the local draft. */
export interface PreservedLocalRefusal {
  ok: false;
  reason:
    | 'not_owner'
    | 'unknown_session'
    | 'revision_conflict'
    | 'session_cancelled'
    | 'session_completed';
  /** The learner's local work is preserved and visible, never silently dropped. */
  preservedLocal: true;
  /** Current committed revision for rebase (present on revision_conflict). */
  currentRevision?: number;
}

export class LearningSessionError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_session'
      | 'revision_conflict'
      | 'session_cancelled'
      | 'session_completed'
      | 'source_revision_unknown'
  ) {
    super(code);
  }
}
