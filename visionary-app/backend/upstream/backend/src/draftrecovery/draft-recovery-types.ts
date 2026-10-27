// BUILD-02 (KAN-76) — per-tab original-base draft recovery, compare/resolve
// conflicts, and reviewed import of local originals.
//
// The checkpoint here is honest draft recovery and conflict resolution:
//   - Per-tab original-base drafts: every editing tab registers its draft
//     against an explicit base revision; the draft stays RECOVERABLE byte-exactly
//     by (project, tab) — a disconnected tab loses nothing.
//   - Compare/resolve conflicts: when two tabs save from the same base, the
//     first commits and the second receives an explicit conflict carrying BOTH
//     payloads (server + tab) for comparison. Resolution is a deliberate choice
//     — server / tab / merged — and APPENDS a new revision with resolution
//     provenance. History is never rewritten.
//   - Import local originals ONLY through a REVIEWED ownership mapping: an
//     import without a reviewed mapping binding those originals to this owner
//     is refused. Transfer is idempotent by import id (a retried import
//     converges; no duplicate originals), and every batch is verified by
//     declared count AND digest before anything is accepted.
//
// Exit: current-document Build is server-backed without weakening existing
// privacy/recovery rules.

/** Actor/workspace ownership. */
export interface RecoveryOwner {
  uid: string;
  workspaceId: string;
}

/** A tab's unsaved draft, registered against an explicit base revision. */
export interface TabDraft {
  projectId: string;
  tabId: string;
  owner: RecoveryOwner;
  /** The project revision this tab's draft is based on. */
  baseRevision: number;
  payload: unknown;
  registeredAt: string;
}

/** An explicit conflict carrying BOTH payloads for comparison. */
export interface DraftConflict {
  conflictId: string;
  projectId: string;
  tabId: string;
  owner: RecoveryOwner;
  /** The revision the tab based its draft on. */
  baseRevision: number;
  /** The server revision that won the race. */
  serverRevision: number;
  serverPayload: unknown;
  tabPayload: unknown;
  raisedAt: string;
  resolvedAt: string | null;
}

/** A deliberate conflict resolution (append-only; provenance recorded). */
export interface ConflictResolution {
  resolutionId: string;
  conflictId: string;
  /** 'server' keeps the server payload; 'tab' keeps the tab's; 'merged' uses the supplied payload. */
  disposition: 'server' | 'tab' | 'merged';
  payload: unknown;
  /** The new revision the resolution appended. */
  newRevisionNo: number;
  resolvedBy: RecoveryOwner;
  resolvedAt: string;
}

/** A REVIEWED ownership mapping: local originals bound to this owner. */
export interface OwnershipMapping {
  mappingId: string;
  owner: RecoveryOwner;
  /** Review record reference (who reviewed this ownership mapping). */
  reviewedRef: string;
  reviewedAt: string;
}

/** An import batch of local originals. */
export interface ImportBatch {
  importId: string;
  owner: RecoveryOwner;
  mappingId: string;
  originals: readonly { originalId: string; payload: unknown }[];
  declaredCount: number;
  /** SHA-256 digest of the canonical original list — verified on import. */
  declaredDigest: string;
}

export interface ImportResult {
  outcome: 'imported' | 'duplicate';
  importId: string;
  importedCount: number;
}

export class DraftRecoveryError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_project'
      | 'unknown_tab'
      | 'unknown_conflict'
      | 'conflict_resolved'
      | 'mapping_not_reviewed'
      | 'batch_verification_failed'
  ) {
    super(code);
  }
}
