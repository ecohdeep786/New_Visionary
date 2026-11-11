// BUILD-02 (KAN-76) — the draft-recovery domain's typed state seams. The owning
// stores (per-tab drafts, conflicts, resolutions, ownership mappings, imported
// originals, project revisions) implement these at integration; the in-memory
// implementation is contract-true and fails closed.
import type {
  ConflictResolution,
  DraftConflict,
  OwnershipMapping,
  RecoveryOwner,
  TabDraft,
} from './draft-recovery-types';

export interface DraftRecoveryStore {
  saveTabDraft(draft: TabDraft): Promise<void>;
  tabDraft(projectId: string, tabId: string): Promise<TabDraft | undefined>;
  currentRevision(projectId: string): Promise<number>;
  payloadAt(projectId: string, revisionNo: number): Promise<unknown | undefined>;
  appendRevision(projectId: string, payload: unknown): Promise<number>;
  saveConflict(conflict: DraftConflict): Promise<void>;
  byConflictId(conflictId: string): Promise<DraftConflict | undefined>;
  saveResolution(resolution: ConflictResolution): Promise<void>;
  saveMapping(mapping: OwnershipMapping): Promise<void>;
  mapping(mappingId: string): Promise<OwnershipMapping | undefined>;
  saveImportedOriginals(importId: string, owner: RecoveryOwner, originals: readonly { originalId: string; payload: unknown }[]): Promise<void>;
  /** CAS append: applies only when the project's CURRENT revision count equals
   * expectedCurrent — two concurrent appends can never both claim the same
   * next revision number. (SQL adapter: one conditional INSERT ... SELECT with
   * the count computed in-transaction.) */
  appendRevisionCas(projectId: string, payload: unknown, expectedCurrent: number): Promise<{ ok: true; revisionNo: number } | { ok: false; current: number }>;
  /** Atomic conflict-resolution claim: a conflict cannot resolve twice. */
  claimResolution(conflictId: string): Promise<{ ok: true } | { ok: false; reason: 'conflict_resolved' }>;
  /** Atomic import claim: unseen importId is claimed; an existing import returns
   * its committed count (idempotent). */
  claimImport(importId: string, owner: RecoveryOwner, originals: readonly { originalId: string; payload: unknown }[]): Promise<{ ok: true; importedCount: number } | { ok: false; reason: 'duplicate'; importedCount: number }>;
  importedOriginalCount(importId: string): Promise<number>;
}

/** Contract-true in-memory store; append-only revisions, never rewritten. */
export class InMemoryDraftRecoveryStore implements DraftRecoveryStore {
  private drafts = new Map<string, TabDraft>();
  private revisions = new Map<string, unknown[]>();
  private conflicts = new Map<string, DraftConflict>();
  private resolutions: ConflictResolution[] = [];
  private mappings = new Map<string, OwnershipMapping>();
  private imports = new Map<string, { owner: RecoveryOwner; originals: { originalId: string; payload: unknown }[] }>();

  async saveTabDraft(draft: TabDraft): Promise<void> {
    this.drafts.set(`${draft.projectId}|${draft.tabId}`, { ...draft, owner: { ...draft.owner } });
  }

  async tabDraft(projectId: string, tabId: string): Promise<TabDraft | undefined> {
    const found = this.drafts.get(`${projectId}|${tabId}`);
    return found ? { ...found, owner: { ...found.owner } } : undefined;
  }

  async currentRevision(projectId: string): Promise<number> {
    return (this.revisions.get(projectId) ?? []).length;
  }

  async payloadAt(projectId: string, revisionNo: number): Promise<unknown | undefined> {
    const list = this.revisions.get(projectId) ?? [];
    return list[revisionNo - 1];
  }

  async appendRevisionCas(projectId: string, payload: unknown, expectedCurrent: number): Promise<{ ok: true; revisionNo: number } | { ok: false; current: number }> {
    const current = (this.revisions.get(projectId) ?? []).length;
    if (current !== expectedCurrent) return { ok: false, current };
    const list = this.revisions.get(projectId) ?? [];
    list.push(payload);
    this.revisions.set(projectId, list);
    return { ok: true, revisionNo: list.length };
  }
  async claimResolution(conflictId: string): Promise<{ ok: true } | { ok: false; reason: 'conflict_resolved' }> {
    const conflict = this.conflicts.get(conflictId);
    if (conflict && conflict.resolvedAt) return { ok: false, reason: 'conflict_resolved' };
    return { ok: true };
  }
  async claimImport(importId: string, owner: RecoveryOwner, originals: readonly { originalId: string; payload: unknown }[]): Promise<{ ok: true; importedCount: number } | { ok: false; reason: 'duplicate'; importedCount: number }> {
    const existing = this.imports.get(importId);
    if (existing) return { ok: false, reason: 'duplicate', importedCount: existing.originals.length };
    this.imports.set(importId, { owner: { ...owner }, originals: originals.map((o) => ({ ...o })) });
    return { ok: true, importedCount: originals.length };
  }
  async appendRevision(projectId: string, payload: unknown): Promise<number> {
    const list = this.revisions.get(projectId) ?? [];
    list.push(payload);
    this.revisions.set(projectId, list);
    return list.length;
  }

  async saveConflict(conflict: DraftConflict): Promise<void> {
    this.conflicts.set(conflict.conflictId, { ...conflict, owner: { ...conflict.owner } });
  }

  async byConflictId(conflictId: string): Promise<DraftConflict | undefined> {
    const found = this.conflicts.get(conflictId);
    return found ? { ...found, owner: { ...found.owner } } : undefined;
  }

  async saveResolution(resolution: ConflictResolution): Promise<void> {
    this.resolutions = [...this.resolutions, { ...resolution, resolvedBy: { ...resolution.resolvedBy } }];
    const conflict = this.conflicts.get(resolution.conflictId);
    if (conflict) this.conflicts.set(resolution.conflictId, { ...conflict, resolvedAt: resolution.resolvedAt });
  }

  async saveMapping(mapping: OwnershipMapping): Promise<void> {
    this.mappings.set(mapping.mappingId, { ...mapping, owner: { ...mapping.owner } });
  }

  async mapping(mappingId: string): Promise<OwnershipMapping | undefined> {
    const found = this.mappings.get(mappingId);
    return found ? { ...found, owner: { ...found.owner } } : undefined;
  }

  async saveImportedOriginals(importId: string, owner: RecoveryOwner, originals: readonly { originalId: string; payload: unknown }[]): Promise<void> {
    this.imports.set(importId, { owner: { ...owner }, originals: originals.map((o) => ({ ...o })) });
  }

  async importedOriginalCount(importId: string): Promise<number> {
    return this.imports.get(importId)?.originals.length ?? 0;
  }
}
