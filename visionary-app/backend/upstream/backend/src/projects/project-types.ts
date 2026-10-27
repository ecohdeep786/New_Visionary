// BUILD-01 (KAN-75) — private projects, immutable revisions/manifests,
// conditional draft saves, history and restore-as-new-revision with
// actor/workspace ownership.
//
// The checkpoint here is a server-owned private Build project domain:
//   - Projects are PRIVATE and owner-scoped: every operation verifies the
//     actor's uid AND workspace; a wrong actor/workspace is denied before
//     anything persists.
//   - Revisions are IMMUTABLE: every accepted save appends a new revision with
//     a manifest (content digest, byte size, provenance). Earlier revisions are
//     never rewritten — history is append-only and byte-stable.
//   - Conditional draft saves: a save applies only against the expected base
//     revision; a stale base is refused with the local draft preserved visibly
//     and the current revision returned for rebase (conflict detection).
//   - Duplicate saves are idempotent by client save id: a retried save
//     converges to the same committed revision (no duplicate rows).
//   - RESTORE-AS-NEW-REVISION: restoring an earlier revision appends a NEW
//     revision whose manifest records `restoredFrom` — history is never
//     rewritten to restore.
//   - Manifest integrity: each revision's manifest carries the SHA-256 digest
//     of the exact payload; a tampered payload is detectable by re-digesting.
//
// Exit: current-document Build is server-backed without weakening existing
// privacy/recovery rules.

/** Actor/workspace ownership (server-derived authority). */
export interface ProjectOwner {
  uid: string;
  workspaceId: string;
}

/** The immutable manifest recorded with every revision. */
export interface RevisionManifest {
  /** SHA-256 digest of the exact saved payload. */
  contentDigest: string;
  byteSize: number;
  /** Present only on restore revisions: the revision this was restored from. */
  restoredFrom: number | null;
}

/** One immutable project revision. */
export interface ProjectRevision {
  projectId: string;
  revisionNo: number;
  payload: unknown;
  manifest: RevisionManifest;
  savedBy: ProjectOwner;
  /** Client save id — idempotency key for retried saves. */
  saveId: string;
  savedAt: string;
}

/** A private Build project. */
export interface BuildProject {
  projectId: string;
  owner: ProjectOwner;
  title: string;
  currentRevision: number;
  createdAt: string;
}

/** Result of a conditional draft save. */
export interface SaveResult {
  outcome: 'committed' | 'duplicate';
  projectId: string;
  revisionNo: number;
  manifest: RevisionManifest;
}

/** Honest denial — nothing recorded; local draft preserved visibly. */
export interface SaveRefusal {
  ok: false;
  reason:
    | 'not_owner'
    | 'unknown_project'
    | 'revision_conflict'
    | 'duplicate_project';
  preservedLocal: true;
  /** Current committed revision for rebase (present on revision_conflict). */
  currentRevision?: number;
}

export class ProjectError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_project'
      | 'revision_conflict'
      | 'duplicate_project'
      | 'unknown_revision'
  ) {
    super(code);
  }
}
