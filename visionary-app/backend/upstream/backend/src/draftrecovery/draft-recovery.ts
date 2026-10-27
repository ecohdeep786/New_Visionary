// BUILD-02 (KAN-76) — per-tab draft recovery, conflict compare/resolve, and
// reviewed import of local originals.
//
// Core responsibilities (server-owned; private; append-only):
//   1. registerTabDraft: per-tab original-base registration (explicit base
//      revision); byte-exact recovery by (project, tab) at any time.
//   2. saveFromTab: the first tab from a base commits; a tab whose base was
//      overtaken receives an explicit DraftConflict carrying BOTH payloads.
//   3. resolveConflict: deliberate 'server' | 'tab' | 'merged' disposition that
//      APPENDS a new revision with resolution provenance; a resolved conflict
//      cannot resolve twice; history never rewrites.
//   4. importOriginals: ONLY through a reviewed ownership mapping bound to this
//      owner; idempotent by import id; every batch verified by declared count
//      AND digest before acceptance.
import { createHash } from 'node:crypto';
import type {
  ConflictResolution,
  DraftConflict,
  DraftRecoveryError as DraftRecoveryErrorType,
  ImportBatch,
  ImportResult,
  OwnershipMapping,
  RecoveryOwner,
  TabDraft,
} from './draft-recovery-types';
import { DraftRecoveryError } from './draft-recovery-types';
import type { DraftRecoveryStore } from './draft-recovery-lookups';

function digestOriginals(originals: readonly { originalId: string; payload: unknown }[]): string {
  const canonical = originals
    .map((o) => `${o.originalId}:${JSON.stringify(o.payload ?? null)}`)
    .sort()
    .join(';');
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export class DraftRecoveryService {
  private conflictCounter = 0;
  private resolutionCounter = 0;
  constructor(
    private readonly store: DraftRecoveryStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Register a tab's draft against an explicit base revision. */
  async registerTabDraft(owner: RecoveryOwner, projectId: string, tabId: string, baseRevision: number, payload: unknown): Promise<TabDraft> {
    const draft: TabDraft = { projectId, tabId, owner: { ...owner }, baseRevision, payload, registeredAt: this.now().toISOString() };
    await this.store.saveTabDraft(draft);
    return draft;
  }

  /** Byte-exact recovery of a tab's draft (owner-scoped). */
  async recoverDraft(owner: RecoveryOwner, projectId: string, tabId: string): Promise<TabDraft> {
    const draft = await this.store.tabDraft(projectId, tabId);
    if (!draft) throw new DraftRecoveryError('unknown_tab');
    if (draft.owner.uid !== owner.uid || draft.owner.workspaceId !== owner.workspaceId) throw new DraftRecoveryError('not_owner');
    return draft;
  }

  /**
   * Save a tab's draft: the first save from a base commits; a tab whose base
   * was overtaken gets an explicit conflict (both payloads, for compare).
   */
  async saveFromTab(owner: RecoveryOwner, projectId: string, tabId: string): Promise<{ committed: true; revisionNo: number } | DraftConflict> {
    const draft = await this.store.tabDraft(projectId, tabId);
    if (!draft) throw new DraftRecoveryError('unknown_tab');
    if (draft.owner.uid !== owner.uid || draft.owner.workspaceId !== owner.workspaceId) throw new DraftRecoveryError('not_owner');

    const current = await this.store.currentRevision(projectId);
    if (current === draft.baseRevision) {
      const revisionNo = await this.store.appendRevision(projectId, draft.payload);
      return { committed: true, revisionNo };
    }
    const conflict: DraftConflict = {
      conflictId: `cfl_${++this.conflictCounter}`,
      projectId,
      tabId,
      owner: { ...owner },
      baseRevision: draft.baseRevision,
      serverRevision: current,
      serverPayload: await this.store.payloadAt(projectId, current),
      tabPayload: draft.payload,
      raisedAt: this.now().toISOString(),
      resolvedAt: null,
    };
    await this.store.saveConflict(conflict);
    return conflict;
  }

  /** Resolve a conflict deliberately; the resolution appends a new revision. */
  async resolveConflict(owner: RecoveryOwner, conflictId: string, disposition: 'server' | 'tab' | 'merged', mergedPayload?: unknown): Promise<ConflictResolution> {
    const conflict = await this.store.byConflictId(conflictId);
    if (!conflict) throw new DraftRecoveryError('unknown_conflict');
    if (conflict.owner.uid !== owner.uid || conflict.owner.workspaceId !== owner.workspaceId) throw new DraftRecoveryError('not_owner');
    if (conflict.resolvedAt) throw new DraftRecoveryError('conflict_resolved');

    const payload =
      disposition === 'server' ? conflict.serverPayload
      : disposition === 'tab' ? conflict.tabPayload
      : mergedPayload;
    const newRevisionNo = await this.store.appendRevision(conflict.projectId, payload);
    const resolution: ConflictResolution = {
      resolutionId: `res_${++this.resolutionCounter}`,
      conflictId,
      disposition,
      payload,
      newRevisionNo,
      resolvedBy: { ...owner },
      resolvedAt: this.now().toISOString(),
    };
    await this.store.saveResolution(resolution);
    return resolution;
  }

  /** Review a mapping (integration/review records the ownership decision). */
  async recordOwnershipMapping(mapping: OwnershipMapping): Promise<void> {
    await this.store.saveMapping(mapping);
  }

  /**
   * Import local originals: ONLY through a reviewed ownership mapping bound to
   * this owner; idempotent by import id; count AND digest verified first.
   */
  async importOriginals(batch: ImportBatch): Promise<ImportResult> {
    const existingCount = await this.store.importedOriginalCount(batch.importId);
    if (existingCount > 0) return { outcome: 'duplicate', importId: batch.importId, importedCount: existingCount };

    const mapping = await this.store.mapping(batch.mappingId);
    if (!mapping || !mapping.reviewedRef) throw new DraftRecoveryError('mapping_not_reviewed');
    if (mapping.owner.uid !== batch.owner.uid || mapping.owner.workspaceId !== batch.owner.workspaceId) {
      throw new DraftRecoveryError('not_owner');
    }
    if (batch.originals.length !== batch.declaredCount) throw new DraftRecoveryError('batch_verification_failed');
    if (digestOriginals(batch.originals) !== batch.declaredDigest) throw new DraftRecoveryError('batch_verification_failed');

    await this.store.saveImportedOriginals(batch.importId, batch.owner, batch.originals);
    return { outcome: 'imported', importId: batch.importId, importedCount: batch.originals.length };
  }
}

export type { DraftRecoveryErrorType };
