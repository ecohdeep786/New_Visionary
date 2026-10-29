// BUILD-05 (KAN-79) — explicit saved-revision Markdown/document export and
// supported assets through the private file lifecycle (P03).
//
// Design constraints (server-owned; honest; fail closed):
//   - EXPLICIT SAVED REVISIONS ONLY: an export operates on a SAVED project
//     revision (the BUILD-01 owning store). A generation/preview id is not a
//     saved revision and refuses (`revision_not_saved`) — generation/preview
//     CANNOT silently save, share, submit or deploy. There is no share, submit
//     or deploy path on this surface at all.
//   - SUPPORTED FORMATS ONLY: markdown, plaintext and html document exports;
//     anything else refuses (`export_type_unsupported`).
//   - PRIVATE LIFECYCLE (P03): an export is a private artifact with an
//     immutable content hash; reads go through the owning-store gateway only
//     (no unsigned links); a revoked export refuses reads (`export_revoked`)
//     and the underlying artifact is revoked with it.
//   - BYTE-STABLE ARTIFACTS: identical (revision content, format) produce an
//     identical artifact body and hash; read-back is verbatim.
//   - COMMAND DEDUPLICATION: export commands carry a stable commandKey; a
//     replayed command converges to the SAME export; a changed payload refuses
//     (`command_changed`).
//   - OWNER BOUNDARY: exports are private per-UID, workspace-scoped; wrong
//     uid/workspace refuses uniformly (`not_owner`/`workspace_mismatch`).
export interface ExportOwner {
  uid: string;
  workspaceId: string;
}

/** Supported export formats (bounded, explicit). */
export type ExportFormat = 'markdown' | 'plaintext' | 'html';

/** A SAVED project revision in the BUILD-01 owning store (seam input). */
export interface SavedRevision {
  revisionId: string;
  owner: ExportOwner;
  projectId: string;
  /** The committed document body (markdown source of truth). */
  contentMd: string;
  committedAt: string;
}

/** A private export artifact (immutable body + content hash). */
export interface ExportArtifact {
  exportId: string;
  owner: ExportOwner;
  revisionId: string;
  projectId: string;
  format: ExportFormat;
  /** The exported document body (verbatim, byte-stable). */
  body: string;
  contentHash: string;
  status: 'ready' | 'revoked';
  createdAt: string;
}

export class ExportError extends Error {
  readonly code:
    | 'not_owner'
    | 'workspace_mismatch'
    | 'revision_unknown'
    | 'revision_not_saved'
    | 'export_type_unsupported'
    | 'export_unknown'
    | 'export_revoked'
    | 'command_changed';
  constructor(code: ExportError['code']) {
    super(code);
    this.code = code;
  }
}
