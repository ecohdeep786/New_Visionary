// FILE-03 — download/export store contract + in-memory synthetic implementation.
// The Cloud SQL/private-object adapter implements the same surface over
// FILE/DATA-01 download grants, exports and object rows at integration.
//
// Fenced transitions enforce the server-authoritative owner check and lifecycle
// ordering; a non-owner cannot deliver, revoke or expire another uid's grant.
// The store is deliberately small: all delivery policy lives in the service so
// a durable adapter can reproduce the identical behavior.
import type { DownloadGrant, ExportRecord } from './download-types';

type WriteFailure = { ok: false; reason: 'not_found' | 'conflict' | 'unauthorized' | 'revoked' | 'expired' | 'used' };
export type GrantWriteResult = { ok: true; grant: DownloadGrant } | WriteFailure;
export type ExportWriteResult = { ok: true; record: ExportRecord } | WriteFailure;

export interface DownloadStore {
  insert(grant: DownloadGrant): Promise<void>;
  grant(id: string): Promise<DownloadGrant | null>;
  /** Check ownership, revocation, expiry and budget and consume a read in one write. */
  consumeGrant(id: string, ownerUid: string, deliveredBytes: number): Promise<GrantWriteResult>;
  updateGrant(id: string, ownerUid: string, patch: Pick<DownloadGrant, 'state'> & Partial<Pick<DownloadGrant, 'revokedAt'>>, activeOnly?: boolean): Promise<GrantWriteResult>;
  grantTokens(ownerUid: string): Promise<DownloadGrant[]>;
  /** Grants that are ACTIVE but already past their expiry (for the sweep step). */
  activeExpired(now: string): Promise<DownloadGrant[]>;

  insertExport(record: ExportRecord): Promise<void>;
  exportById(id: string): Promise<ExportRecord | null>;
  /** Check current export state and account for delivery in one write. */
  recordExportDelivery(id: string, ownerUid: string, deliveredBytes: number): Promise<ExportWriteResult>;
  updateExport(id: string, ownerUid: string, patch: Pick<ExportRecord, 'state'>, activeOnly?: boolean): Promise<ExportWriteResult>;
  exportsFor(ownerUid: string): Promise<ExportRecord[]>;
  exportedExpired(now: string): Promise<ExportRecord[]>;
}

export class InMemoryDownloadStore implements DownloadStore {
  readonly grants = new Map<string, DownloadGrant>();
  readonly exports = new Map<string, ExportRecord>();

  async insert(grant: DownloadGrant): Promise<void> { this.grants.set(grant.id, grant); }
  async grant(id: string): Promise<DownloadGrant | null> { return this.grants.get(id) ?? null; }

  async consumeGrant(id: string, ownerUid: string, deliveredBytes: number): Promise<GrantWriteResult> {
    const cur = this.grants.get(id);
    const now = new Date().toISOString();
    if (!cur) return { ok: false, reason: 'not_found' };
    if (cur.ownerUid !== ownerUid) return { ok: false, reason: 'unauthorized' };
    if (cur.state === 'REVOKED' || cur.revokedAt) return { ok: false, reason: 'revoked' };
    if (cur.state === 'USED' || cur.remainingReads <= 0) return { ok: false, reason: 'used' };
    if (cur.state !== 'ACTIVE' || cur.expiresAt <= now) return { ok: false, reason: 'expired' };
    const remainingReads = cur.remainingReads - 1;
    const next: DownloadGrant = { ...cur, remainingReads, state: remainingReads === 0 ? 'USED' : 'ACTIVE',
      bytesDelivered: cur.bytesDelivered + deliveredBytes, lastReadAt: now };
    this.grants.set(id, next);
    return { ok: true, grant: next };
  }

  async updateGrant(id: string, ownerUid: string, patch: Pick<DownloadGrant, 'state'> & Partial<Pick<DownloadGrant, 'revokedAt'>>, activeOnly = false): Promise<GrantWriteResult> {
    const cur = this.grants.get(id);
    if (!cur) return { ok: false, reason: 'not_found' };
    if (cur.ownerUid !== ownerUid) return { ok: false, reason: 'unauthorized' };
    if (activeOnly && (cur.state !== 'ACTIVE' || cur.revokedAt)) return { ok: false, reason: 'conflict' };
    if (cur.state === 'REVOKED' && patch.state === 'REVOKED') return { ok: true, grant: cur };
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
  async recordExportDelivery(id: string, ownerUid: string, deliveredBytes: number): Promise<ExportWriteResult> {
    const cur = this.exports.get(id);
    if (!cur) return { ok: false, reason: 'not_found' };
    if (cur.ownerUid !== ownerUid) return { ok: false, reason: 'unauthorized' };
    if (cur.state === 'REVOKED') return { ok: false, reason: 'revoked' };
    if (cur.state !== 'ACTIVE' || cur.expiresAt <= new Date().toISOString()) return { ok: false, reason: 'expired' };
    const next = { ...cur, deliveredBytes: cur.deliveredBytes + deliveredBytes };
    this.exports.set(id, next);
    return { ok: true, record: next };
  }

  async updateExport(id: string, ownerUid: string, patch: Pick<ExportRecord, 'state'>, activeOnly = false): Promise<ExportWriteResult> {
    const cur = this.exports.get(id);
    if (!cur) return { ok: false, reason: 'not_found' };
    if (cur.ownerUid !== ownerUid) return { ok: false, reason: 'unauthorized' };
    if (activeOnly && cur.state !== 'ACTIVE') return { ok: false, reason: 'conflict' };
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
