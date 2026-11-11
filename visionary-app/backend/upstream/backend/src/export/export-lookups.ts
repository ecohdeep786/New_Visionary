// BUILD-05 (KAN-79) — the document-export domain's typed state seams.
// The owning stores (saved revisions from BUILD-01, private artifacts from the
// P03 file lifecycle) implement these at integration; the in-memory
// implementation is contract-true and fails closed.
import type {
  ExportArtifact,
  ExportOwner,
  SavedRevision,
} from './export-types';

export interface ExportStore {
  /** SAVED revisions only (BUILD-01 owning store) — previews never appear. */
  savedRevision(revisionId: string): Promise<SavedRevision | undefined>;
  saveArtifact(artifact: ExportArtifact): Promise<void>;
  artifact(exportId: string): Promise<ExportArtifact | undefined>;
  revokeArtifact(exportId: string): Promise<void>;
  commandPayload(commandKey: string): Promise<string | undefined>;
  recordCommand(commandKey: string, payloadHash: string, resultRef: string): Promise<void>;
  commandResultRef(commandKey: string): Promise<string | undefined>;

  /** ATOMIC command claim: unseen key is claimed and 'new'; a seen key with the
   * SAME payload hash returns its result ref ('existing'); a seen key with a
   * DIFFERENT payload is 'changed'. (SQL adapter: INSERT ... ON CONFLICT DO
   * NOTHING then read, in one statement.) */
  claimCommand(commandKey: string, payloadHash: string): Promise<{ state: 'new' } | { state: 'existing'; resultRef: string | undefined } | { state: 'changed' }>;}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Contract-true in-memory store; tests drive the full domain without a DB. */
export class InMemoryExportStore implements ExportStore {
  private revisions = new Map<string, SavedRevision>();
  private artifacts = new Map<string, ExportArtifact>();
  private commands = new Map<string, { hash: string; resultRef: string }>();

  /** Test/ingestion helper: seed a SAVED revision (as BUILD-01 would have). */
  seedSavedRevision(revision: SavedRevision): void {
    this.revisions.set(revision.revisionId, clone(revision));
  }

  async savedRevision(revisionId: string): Promise<SavedRevision | undefined> {
    const found = this.revisions.get(revisionId);
    return found ? clone(found) : undefined;
  }
  async saveArtifact(artifact: ExportArtifact): Promise<void> {
    this.artifacts.set(artifact.exportId, clone(artifact));
  }
  async artifact(exportId: string): Promise<ExportArtifact | undefined> {
    const found = this.artifacts.get(exportId);
    return found ? clone(found) : undefined;
  }
  async revokeArtifact(exportId: string): Promise<void> {
    const found = this.artifacts.get(exportId);
    if (found) {
      found.status = 'revoked';
      this.artifacts.set(exportId, clone(found));
    }
  }
  async commandPayload(commandKey: string): Promise<string | undefined> {
    return this.commands.get(commandKey)?.hash;
  }
  async claimCommand(commandKey: string, payloadHash: string): Promise<{ state: 'new' } | { state: 'existing'; resultRef: string | undefined } | { state: 'changed' }> {
    const prior = this.commands.get(commandKey);
    if (prior && prior.hash !== payloadHash) return { state: 'changed' };
    if (prior) return { state: 'existing', resultRef: prior.resultRef || undefined };
    this.commands.set(commandKey, { hash: payloadHash, resultRef: '' });
    return { state: 'new' };
  }
  async recordCommand(commandKey: string, payloadHash: string, resultRef: string): Promise<void> {
    const prior = this.commands.get(commandKey);
    this.commands.set(commandKey, { hash: payloadHash, resultRef: resultRef || prior?.resultRef || '' });
  }
  async commandResultRef(commandKey: string): Promise<string | undefined> {
    const ref = this.commands.get(commandKey)?.resultRef;
    return ref || undefined;
  }
}
