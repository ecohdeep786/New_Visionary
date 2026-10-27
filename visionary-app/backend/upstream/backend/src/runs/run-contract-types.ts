// BUILD-04 (KAN-78) — durable run/status/event and proposal accept/reject
// contracts. AI proposals are bound to a base revision; new edits or revoked
// permission block acceptance.
//
// The checkpoint here is the durable Build-run + AI-proposal contract:
//   - A run is DURABLE: it records status transitions (queued → running →
//     succeeded/failed/cancelled) as an immutable event list — status is
//     derived from events, never mutated in place.
//   - An AI proposal is BOUND TO A BASE REVISION: the proposal records exactly
//     which project revision it was generated against.
//   - Acceptance is GUARDED: a proposal can be accepted only while
//     (a) the project's current revision still equals the proposal's base
//     revision (new edits block acceptance), and
//     (b) the actor's permission for AI proposals on this project has not been
//     revoked (revoked permission blocks acceptance).
//   - Acceptance APPENDS a new revision (apply-as-new-revision, BUILD-01
//     semantics); rejection records the decision without touching history.
//   - Duplicate/cancelled run behavior: a cancelled run yields no proposals;
//     an accept/reject decision is idempotent per decision id.
//   - Wrong users denied; fail closed.
//
// Exit: current-document Build is server-backed without weakening existing
// privacy/recovery rules.

/** Actor/workspace ownership. */
export interface RunOwner {
  uid: string;
  workspaceId: string;
}

export type RunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

/** An immutable run event (status is derived from these, never mutated). */
export interface RunEvent {
  eventId: string;
  runId: string;
  status: RunStatus;
  detail: string;
  at: string;
}

/** A durable Build run. */
export interface BuildRun {
  runId: string;
  owner: RunOwner;
  projectId: string;
  /** The project revision the run started from. */
  baseRevision: number;
  /** Derived from the event list — the latest event's status. */
  status: RunStatus;
  events: readonly RunEvent[];
}

/** An AI proposal bound to a base revision. */
export interface AiProposal {
  proposalId: string;
  runId: string;
  owner: RunOwner;
  projectId: string;
  /** The exact revision this proposal was generated against. */
  baseRevision: number;
  payload: unknown;
  status: 'pending' | 'accepted' | 'rejected';
}

/** The result of accepting a proposal (apply-as-new-revision). */
export interface AcceptResult {
  decisionId: string;
  proposalId: string;
  outcome: 'committed' | 'duplicate';
  newRevisionNo: number | null;
}

export class RunContractError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_run'
      | 'unknown_proposal'
      | 'base_revision_moved'
      | 'permission_revoked'
      | 'run_cancelled'
      | 'proposal_decided'
      | 'cancelled_run_no_proposal'
  ) {
    super(code);
  }
}
