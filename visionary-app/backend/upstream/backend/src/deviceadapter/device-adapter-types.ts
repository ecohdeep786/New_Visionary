// BUILD-08 (KAN-82) — real API adapters on two devices: edge-case proofs for
// duplicate accept, stale proposal, cancellation/restart, account switch,
// restore/export failure and revoked share behavior.
//
// The checkpoint here is the DEVICE ADAPTER layer — the typed seam a real
// client (browser tab on device A, tab on device B, a different account on the
// same device) talks to. It composes the durable-run (KAN-78), private-project
// (KAN-75) and exact-revision sharing (KAN-80) contracts over ONE owning store,
// and adds two adapter-level guards the integration must enforce:
//   - Sessions are DEVICE- AND ACCOUNT-BOUND: every adapter carries an explicit
//     device identity; closing a session (account switch) denies every further
//     call with `session_closed`, and a different account is denied everywhere.
//   - RESTORE/EXPORT are manifest-verified: an export (or restore from a
//     revision) recomputes the SHA-256 digest and fails closed on tampered
//     data — it never hands out or restores corrupted bytes.
//
// Exit: current-document Build is server-backed without weakening existing
// privacy/recovery rules.

/** Actor/workspace ownership plus the explicit device identity. */
export interface DeviceActor {
  uid: string;
  workspaceId: string;
  /** e.g. 'device_a' / 'device_b' / 'mobile' — never inferred from a token. */
  deviceId: string;
}

export type AdapterErrorCode =
  | 'session_closed'           // the account switched / session ended on this device
  | 'not_owner'                // wrong uid or workspace for this operation
  | 'unknown_project'
  | 'unknown_revision'
  | 'revision_conflict'
  | 'unknown_run'
  | 'unknown_proposal'
  | 'base_revision_moved'      // proposal is stale: new edits landed after it
  | 'permission_revoked'
  | 'run_cancelled'
  | 'cancelled_run_no_proposal'
  | 'recipient_not_accepted'
  | 'unknown_share'
  | 'consent_not_active'
  | 'export_integrity_failed'; // manifest digest mismatch (tampered payload)

export class AdapterError extends Error {
  constructor(public readonly code: AdapterErrorCode) {
    super(code);
  }
}

/** One authenticated device session. */
export interface DeviceSession {
  sessionId: string;
  actor: DeviceActor;
  openedAt: string;
  open: boolean;
}

/** The typed operations a real device adapter exposes. */
export interface DeviceAdapter {
  session: DeviceSession;
  createProject(title: string): Promise<{ projectId: string; currentRevision: number }>;
  saveDraft(input: {
    projectId: string;
    saveId: string;
    payload: unknown;
    expectedBaseRevision: number;
  }): Promise<{ outcome: 'committed' | 'duplicate'; revisionNo: number }>;
  history(projectId: string): Promise<unknown[]>;
  restore(input: {
    projectId: string;
    saveId: string;
    fromRevisionNo: number;
    expectedBaseRevision: number;
  }): Promise<{ outcome: 'committed'; revisionNo: number }>;
  startRun(projectId: string, baseRevision: number): Promise<{ runId: string; baseRevision: number; status: string }>;
  transition(runId: string, status: string, detail: string): Promise<{ runId: string; status: string }>;
  propose(runId: string, payload: unknown): Promise<{ proposalId: string; baseRevision: number }>;
  acceptProposal(proposalId: string, decisionId: string): Promise<{ outcome: 'committed' | 'duplicate'; newRevisionNo: number | null }>;
  rejectProposal(proposalId: string, decisionId: string): Promise<{ outcome: 'committed' | 'duplicate' }>;
  shareRevision(projectId: string, revisionNo: number, recipients: readonly string[]): Promise<{ shareId: string }>;
  viewShared(shareId: string): Promise<{ revisionNo: number; payload: unknown }>;
  exportRevision(projectId: string, revisionNo: number): Promise<{ payload: unknown; contentDigest: string }>;
  closeSession(): Promise<void>;
}
