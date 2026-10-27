// AI-12 (KAN-138) — the quality-scope domain's typed state seams. The owning
// store (approved purposes, collected entries) implements this at integration;
// the in-memory implementation is contract-true and fails closed.
import type { ApprovedPurpose, QualityEntry } from './quality-scope-types';

export interface QualityScopeStore {
  savePurpose(purpose: ApprovedPurpose): Promise<void>;
  purpose(purposeId: string): Promise<ApprovedPurpose | undefined>;
  saveEntry(entry: QualityEntry): Promise<void>;
  entriesFor(purposeId: string): Promise<QualityEntry[]>;
}

/** Contract-true in-memory store; collected entries are scoped state. */
export class InMemoryQualityScopeStore implements QualityScopeStore {
  private purposes = new Map<string, ApprovedPurpose>();
  private entries: QualityEntry[] = [];

  async savePurpose(purpose: ApprovedPurpose): Promise<void> {
    this.purposes.set(purpose.purposeId, { ...purpose, scopeFilters: { ...purpose.scopeFilters } });
  }

  async purpose(purposeId: string): Promise<ApprovedPurpose | undefined> {
    const found = this.purposes.get(purposeId);
    return found ? { ...found, scopeFilters: { ...found.scopeFilters } } : undefined;
  }

  async saveEntry(entry: QualityEntry): Promise<void> {
    this.entries = [...this.entries, { ...entry }];
  }

  async entriesFor(purposeId: string): Promise<QualityEntry[]> {
    return this.entries.filter((e) => e.purposeId === purposeId).map((e) => ({ ...e }));
  }
}
