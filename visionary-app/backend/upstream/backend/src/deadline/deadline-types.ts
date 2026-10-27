// AI-08 (KAN-90) — reconcile the whole-request teaching deadline and
// cancellation with provider work; long Build jobs use their own durable
// protocol; preserve partial/final distinction and disconnect cleanup.
//
// The checkpoint here is honest deadline/cancel semantics:
//   - Teaching requests carry a WHOLE-REQUEST DEADLINE: when the deadline
//     passes, the request terminates honestly — a partial answer (if any was
//     produced) is delivered marked `partial`, never presented as final.
//   - Cancellation propagates: a cancelled request stops provider work at the
//     next checkpoint; after cancellation, nothing new is produced and any
//     produced partial is still honestly marked.
//   - Long Build jobs DO NOT ride the whole-request deadline: they use their
//     own DURABLE protocol (durable runs from BUILD-04) — attempting to bind a
//     long job to the teaching deadline is refused (wrong protocol).
//   - Disconnect cleanup: when the caller disconnects, in-flight partial state
//     is cleaned up (no orphaned reservations, no dangling partial presented
//     as final), and the outcome records `disconnected` honestly.
//   - Partial/final distinction is preserved end to end: every outcome carries
//     `final: true|false` and the reason (completed | deadline | cancelled |
//     disconnected).
//
// Exit: evaluated, authorized assistance with bounded costs and no cross-user
// leakage.

/** The authenticated teaching caller. */
export interface DeadlineOwner {
  uid: string;
  workspaceId: string;
}

export type OutcomeReason = 'completed' | 'deadline' | 'cancelled' | 'disconnected';

/** The reconciled request outcome: partial/final distinction preserved. */
export interface RequestOutcome {
  requestId: string;
  /** false = partial (deadline/cancel/disconnect); true = completed. */
  final: boolean;
  reason: OutcomeReason;
  /** The partial body produced before termination, if any (marked partial). */
  partialBody: unknown | null;
  /** Provider work stopped at the checkpoint (no new work after termination). */
  providerWorkStopped: boolean;
}

export class DeadlineError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_request'
      | 'long_job_requires_durable_protocol'
      | 'already_terminated'
  ) {
    super(code);
  }
}
