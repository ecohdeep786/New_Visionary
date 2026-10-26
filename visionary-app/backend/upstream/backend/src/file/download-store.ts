// FILE-03 — download/export store contract + in-memory synthetic implementation.
// The Cloud SQL/private-object adapter implements the same surface over
// FILE/DATA-01 download grants, exports and object rows at integration.
//
// Fenced transitions enforce the server-authoritative owner check and lifecycle
// ordering; a non-owner cannot deliver, revoke or expire another uid's grant.
// The store is deliberately small: all delivery policy lives in the service so
// a durable adapter can reproduce the identical behavior.
import type { DownloadGrant, DownloadState, ExportRecord } from './download-types';

export type GrantWriteResult = { ok: true; grant: DownloadGrant } | { ok: false; reason: 'not_found' | 'conflict' | 'unauthorized' };
export type ExportWriteResult = { ok: true; record: ExportRecord } | { ok: false; reason: 'not_found' | 'conflict' | 'unauthorized' };

export interface DownloadStore {
  insert(grant: DownloadGrant): Promise<void>;
  grant(id: string): Promise<DownloadGrant | null>;
  /** Fenced update: applies `patch` only when owned by `ownerUid`. */
  updateGrant(id: string, ownerUid: string, patch: Partial<Pick<DownloadGrant, 'state' | 'remainingReads' | 'bytesDelivered' | 'lastReadAt' | 'revokedAt'>>): Promise<GrantWriteResult>;
  grantTokens(ownerUid: string): Promise<DownloadGrant[]>;
  /** Grants that are ACTIVE but already past their expiry (for the sweep step). */
  activeExpired(now: string): Promise<DownloadGrant[]>;

  insertExport(record: ExportRecord): Promise<void>;
  exportById(id: string): Promise<ExportRecord | null>;
  updateExport(id: string, ownerUid: string, patch: Partial<Pick<ExportRecord, 'state' | 'deliveredBytes'>>): Promise<ExportWriteResult>;
  exportsFor(ownerUid: string): Promise<ExportRecord[]>;
  exportedExpired(now: string): Promise<ExportRecord[]>;
}

export class InMemoryDownloadStore implements DownloadStore {
  readonly grants = new Map<string, DownloadGrant>();
  readonly exports = new Map<string, ExportRecord>();

  async insert(grant: DownloadGrant): Promise<void> { this.grants.set(grant.id, grant); }
  async grant(id: string): Promise<DownloadGrant | null> { return this.grants.get(id) ?? null; }

  async updateGrant(id: string, ownerUid: string, patch: Partial<Pick<DownloadGrant, 'state' | 'remainingReads' | 'bytesDelivered' | 'lastReadAt' | 'revokedAt'>>): Promise<GrantWriteResult> {
    const cur = this.grants.get(id);
    if (!cur) return { ok: false, reason: 'not_found' };
    if (cur.ownerUid !== ownerUid) return { ok: false, reason: 'unauthorized' };
    const next = { ...cur, ...patch, ownerUid: cur.ownerUid } as DownloadGrant;
    this.grants.set(id, next);
    return { ok: true, grant: next };
  }
  async grantTokens(ownerUid: string): Promise<DownloadGrant[]> {
    return [...this.grants.values()].filter((g) => g.ownerUid === ownerUid);
  }
  async activeExpired(now: string): Promise<DownloadGrant[]> {
    return [...this.grants.values()].filter((g) => g.state === 'ACTIVE' && g.expiresAt <= now);
  }

  async insertExport(record: ExportRecord): Promise<void> { this.exports.set(record.id, record); }
  async exportById(id: string): Promise<ExportRecord | null> { return this.exports.get(id) ?? null; }
  async updateExport(id: string, ownerUid: string, patch: Partial<Pick<ExportRecord, 'state' | 'deliveredBytes'>>): Promise<ExportWriteResult> {
    const cur = this.exports.get(id);
    if (!cur) return { ok: false, reason: 'not_found' };
    if (cur.ownerUid !== ownerUid) return { ok: false, reason: 'unauthorized' };
    const next = { ...cur, ...patch, ownerUid: cur.ownerUid } as ExportRecord;
    this.exports.set(id, next);
    return { ok: true, record: next };
  }
  async exportsFor(ownerUid: string): Promise<ExportRecord[]> {
    return [...this.exports.values()].filter((e) => e.ownerUid === ownerUid);
  }
  async exportedExpired(now: string): Promise<ExportRecord[]> {
    return [...this.exports.values()].filter((e) => e.state === 'ACTIVE' && e.expiresAt <= now);
  }
}
