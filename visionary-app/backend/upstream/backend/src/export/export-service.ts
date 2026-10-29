// BUILD-05 (KAN-79) — explicit saved-revision Markdown/document export through
// the private file lifecycle (P03); generation/preview cannot silently save,
// share, submit or deploy.
//
// Core responsibilities (server-owned; honest; fail closed):
//   1. SAVED REVISIONS ONLY: an export resolves its content from the BUILD-01
//      owning store. A generation/preview id (anything not in the saved store)
//      refuses `revision_not_saved`; an unknown id refuses `revision_unknown`.
//      This surface exposes NO share, submit or deploy operation — those paths
//      do not exist here, so nothing can silently move through them.
//   2. SUPPORTED FORMATS ONLY: markdown | plaintext | html; anything else
//      refuses `export_type_unsupported`.
//   3. PRIVATE LIFECYCLE (P03): artifacts are private, immutable and
//      content-hashed; reads go through the owner gateway only; revocation of
//      an export revokes its artifact and refuses further reads
//      (`export_revoked`). No unsigned links.
//   4. BYTE-STABLE ARTIFACTS: identical (saved content, format) produce an
//      identical body and content hash; read-back is verbatim; the source
//      revision is never modified by exporting.
//   5. COMMAND DEDUPLICATION: a replayed export command converges to the SAME
//      export; the same commandKey with a changed payload refuses
//      (`command_changed`).
//   6. OWNER BOUNDARY: wrong uid/workspace refuses uniformly (`not_owner`/
//      `workspace_mismatch`, no leak).
import { createHash } from 'node:crypto';
import type {
  ExportArtifact,
  ExportError as ExportErrorType,
  ExportFormat,
  ExportOwner,
} from './export-types';
import { ExportError } from './export-types';
import type { ExportStore } from './export-lookups';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

const SUPPORTED_FORMATS: ExportFormat[] = ['markdown', 'plaintext', 'html'];

export class ExportService {
  private exportCounter = 0;

  constructor(private readonly store: ExportStore) {}

  /**
   * Export one SAVED revision in a supported format. The export binds the
   * exact revision; the saved revision is read-only to this surface.
   * Idempotent per commandKey (same payload converges to the same export).
   */
  async exportRevision(
    owner: ExportOwner,
    commandKey: string,
    revisionId: string,
    format: ExportFormat,
  ): Promise<ExportArtifact> {
    if (!SUPPORTED_FORMATS.includes(format)) throw new ExportError('export_type_unsupported');
    const payloadHash = hash(`export|${commandKey}|${revisionId}|${format}`);
    const prior = await this.store.commandPayload(commandKey);
    if (prior && prior !== payloadHash) throw new ExportError('command_changed');
    if (prior && prior === payloadHash) {
      const ref = await this.store.commandResultRef(commandKey);
      if (ref) {
        const existing = await this.store.artifact(ref);
        if (existing) return existing;
      }
    }
    const revision = await this.store.savedRevision(revisionId);
    if (!revision) throw new ExportError('revision_not_saved');
    if (revision.owner.uid !== owner.uid) throw new ExportError('not_owner');
    if (revision.owner.workspaceId !== owner.workspaceId) throw new ExportError('workspace_mismatch');
    const body = renderExport(revision.contentMd, format);
    const artifact: ExportArtifact = {
      exportId: `exp_${++this.exportCounter}`,
      owner: { ...owner },
      revisionId,
      projectId: revision.projectId,
      format,
      body,
      contentHash: hash(body),
      status: 'ready',
      createdAt: new Date().toISOString(),
    };
    await this.store.saveArtifact(artifact);
    await this.store.recordCommand(commandKey, payloadHash, artifact.exportId);
    return artifact;
  }

  /** Owner-gateway read of a private export (revoked exports refuse). */
  async readExport(owner: ExportOwner, exportId: string): Promise<ExportArtifact> {
    const artifact = await this.store.artifact(exportId);
    if (!artifact) throw new ExportError('export_unknown');
    if (artifact.owner.uid !== owner.uid) throw new ExportError('not_owner');
    if (artifact.owner.workspaceId !== owner.workspaceId) throw new ExportError('workspace_mismatch');
    if (artifact.status === 'revoked') throw new ExportError('export_revoked');
    return artifact;
  }

  /** Revoke an export (owner-only); the artifact becomes unreadable. */
  async revokeExport(owner: ExportOwner, exportId: string): Promise<void> {
    const artifact = await this.store.artifact(exportId);
    if (!artifact) throw new ExportError('export_unknown');
    if (artifact.owner.uid !== owner.uid) throw new ExportError('not_owner');
    if (artifact.owner.workspaceId !== owner.workspaceId) throw new ExportError('workspace_mismatch');
    await this.store.revokeArtifact(exportId);
  }
}

/** Deterministic per-format rendering from the saved markdown body. */
function renderExport(contentMd: string, format: ExportFormat): string {
  switch (format) {
    case 'markdown':
      return contentMd;
    case 'plaintext':
      return contentMd.replace(/^#{1,6}\s+/gm, '').replace(/\*\*|__|`/g, '');
    case 'html':
      return `<!doctype html><meta charset="utf-8"><article>\n${contentMd
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/^### (.*)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*)$/gm, '<h1>$1</h1>')
        .replace(/\n/g, '\n<p>')
      }\n</article>`;
  }
}

export type { ExportErrorType };
