// PRIV-03 (KAN-112) — the restore domain's typed state seams. The owning
// stores (tombstones, current policy, permitted fields) implement these at
// integration; the in-memory implementation is contract-true and fails closed.
import type { RestoreOwner, Tombstone } from './restore-tombstone-types';

export interface RestoreStore {
  tombstones(ownerUid: string): Promise<Tombstone[]>;
  /** The CURRENT policy's permitted fields per data class (privacy core). */
  permittedFields(dataClass: string): Promise<readonly string[] | null>;
  /** Whether this data class is DERIVED (caches/artifacts — never revived). */
  isDerived(dataClass: string): Promise<boolean>;
  /** Commit one restored record. */
  restoreRecord(dataClass: string, ownerUid: string, payload: Record<string, unknown>): Promise<void>;
}

/** Contract-true in-memory store; tombstones outlive backups. */
export class InMemoryRestoreStore implements RestoreStore {
  private tombs: Tombstone[] = [];
  private fieldPolicy: Record<string, readonly string[] | null> = {};
  private derived = new Set<string>(['caches', 'model_artifacts']);
  private restored: { dataClass: string; ownerUid: string; payload: Record<string, unknown> }[] = [];

  seedTombstone(t: Tombstone): void {
    this.tombs = [...this.tombs, { ...t }];
  }

  seedFieldPolicy(dataClass: string, fields: readonly string[] | null): void {
    this.fieldPolicy[dataClass] = fields;
  }

  markDerived(dataClass: string): void {
    this.derived.add(dataClass);
  }

  async tombstones(ownerUid: string): Promise<Tombstone[]> {
    return this.tombs.filter((t) => t.ownerUid === ownerUid).map((t) => ({ ...t }));
  }

  async permittedFields(dataClass: string): Promise<readonly string[] | null> {
    return this.fieldPolicy[dataClass] ?? null;
  }

  async isDerived(dataClass: string): Promise<boolean> {
    return this.derived.has(dataClass);
  }

  async restoreRecord(dataClass: string, ownerUid: string, payload: Record<string, unknown>): Promise<void> {
    this.restored = [...this.restored, { dataClass, ownerUid, payload: { ...payload } }];
  }

  restoredRecords(): readonly { dataClass: string; ownerUid: string; payload: Record<string, unknown> }[] {
    return this.restored;
  }
}
