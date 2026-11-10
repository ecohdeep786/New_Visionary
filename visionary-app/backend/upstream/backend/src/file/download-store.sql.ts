// FILE-03 — durable PostgreSQL download store (the owning-store adapter).
//
// Implements the DownloadStore surface over the download_grants /
// download_exports tables (migration 20261106000004_file_03_downloads) with
// the identical fenced semantics as the synthetic store:
//   - consumeGrant locks the row before its conditional update: the row is consumed only
//     while it is ACTIVE, owned, unrevoked, unexpired and within its read
//     budget, so a read paused across a concurrent revocation can never
//     resurrect a revoked grant or overwrite its state (review 10583),
//   - updateGrant(activeOnly) refuses to touch a row that is no longer
//     ACTIVE, so a paused revoke cannot overwrite REVOKED with ACTIVE,
//   - recordExportDelivery uses the same lock-first transaction for exports,
//   - expiry is judged by the database clock cast to UTC (Prisma DateTime
//     columns are UTC timestamp-without-time-zone; a bare timestamptz
//     comparison would shift with the connection timezone).
import { PrismaClient, Prisma } from '@prisma/client';
import type { DownloadGrant, ExportRecord } from './download-types';
import type { DownloadStore, ExportWriteResult, GrantWriteResult } from './download-store';

type Row = Record<string, unknown>;

// Domain counters stay JSON-safe numbers; PostgreSQL persists them as BIGINT.
function byteCount(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('invalid byte count');
  return value;
}

const iso = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value);
const isoOrNull = (value: unknown): string | null => (value === null || value === undefined ? null : iso(value));

function grantFrom(row: Row): DownloadGrant {
  return {
    id: String(row.id),
    ownerUid: String(row.ownerUid),
    objectId: String(row.objectId),
    generation: Number(row.generation),
    digest: String(row.digest),
    size: Number(row.size),
    type: String(row.type),
    channel: row.channel === 'signed_link' ? 'signed_link' : 'gateway',
    state: row.state as DownloadGrant['state'],
    expiresAt: iso(row.expiresAt),
    token: row.token === null || row.token === undefined ? null : String(row.token),
    remainingReads: Number(row.remainingReads),
    revokedAt: isoOrNull(row.revokedAt),
    lastReadAt: isoOrNull(row.lastReadAt),
    bytesDelivered: byteCount(Number(row.bytesDelivered)),
    createdAt: iso(row.createdAt),
  };
}

function exportFrom(row: Row): ExportRecord {
  return {
    id: String(row.id),
    ownerUid: String(row.ownerUid),
    objects: (typeof row.objects === 'string' ? JSON.parse(row.objects) : row.objects) as ExportRecord['objects'],
    state: row.state as ExportRecord['state'],
    expiresAt: iso(row.expiresAt),
    createdAt: iso(row.createdAt),
    deliveredBytes: byteCount(Number(row.deliveredBytes)),
  };
}

/** UTC wall clock as a timestamp-without-time-zone literal, matching the
 * Prisma TIMESTAMP(3) columns regardless of the connection timezone. */
const UTC_NOW = "(clock_timestamp() AT TIME ZONE 'UTC')";

export class PostgresDownloadStore implements DownloadStore {
  constructor(private readonly db: PrismaClient) {}

  async insert(grant: DownloadGrant): Promise<void> {
    await this.db.downloadGrant.create({
      data: {
        id: grant.id, ownerUid: grant.ownerUid, objectId: grant.objectId, generation: grant.generation,
        digest: grant.digest, size: grant.size, type: grant.type, channel: grant.channel, state: grant.state,
        expiresAt: new Date(grant.expiresAt), token: grant.token, remainingReads: grant.remainingReads,
        revokedAt: grant.revokedAt ? new Date(grant.revokedAt) : null, lastReadAt: null,
        bytesDelivered: BigInt(byteCount(grant.bytesDelivered)), createdAt: new Date(grant.createdAt),
      },
    });
  }

  async grant(id: string): Promise<DownloadGrant | null> {
    const row = await this.db.downloadGrant.findUnique({ where: { id } });
    return row ? grantFrom(row as unknown as Row) : null;
  }

  async consumeGrant(id: string, ownerUid: string, deliveredBytes: number): Promise<GrantWriteResult> {
    byteCount(deliveredBytes);
    return this.db.$transaction(async tx => {
      const locked = await tx.$queryRaw<Row[]>`SELECT * FROM "download_grants" WHERE "id" = ${id} AND "ownerUid" = ${ownerUid} FOR UPDATE`;
      if (locked.length && !Number.isSafeInteger(Number(locked[0].bytesDelivered) + deliveredBytes)) {
        return { ok: false, reason: 'conflict' };
      }
    // Lock first, then evaluate wall time in a later statement: a concurrent revoke that
    // commits first makes this UPDATE match zero rows; a read paused between
    // the grant check and this write cannot resurrect the grant.
    const updated = await tx.$queryRawUnsafe<Row[]>(`
      UPDATE "download_grants" SET
        "remainingReads" = "remainingReads" - 1,
        "bytesDelivered" = "bytesDelivered" + ${Number(deliveredBytes)},
        "lastReadAt" = ${UTC_NOW},
        "state" = CASE WHEN "remainingReads" = 1 THEN 'USED' ELSE "state" END
      WHERE "id" = ${this.sqlString(id)} AND "ownerUid" = ${this.sqlString(ownerUid)}
        AND "state" = 'ACTIVE' AND "revokedAt" IS NULL
        AND "remainingReads" > 0 AND "expiresAt" > ${UTC_NOW}
      RETURNING *`);
    if (Array.isArray(updated) && updated.length) return { ok: true, grant: grantFrom(updated[0]) };
    return { ok: false, ...(await this.classifyGrant(id, ownerUid, tx)) };
    });
  }

  private async classifyGrant(id: string, ownerUid: string, db: Pick<PrismaClient, "downloadGrant"> = this.db): Promise<{ reason: 'not_found' | 'conflict' | 'unauthorized' | 'revoked' | 'expired' | 'used' }> {
    const row = await db.downloadGrant.findUnique({ where: { id } });
    if (!row) return { reason: 'not_found' };
    if ((row as unknown as Row).ownerUid !== ownerUid) return { reason: 'unauthorized' };
    const g = grantFrom(row as unknown as Row);
    if (g.state === 'REVOKED' || g.revokedAt) return { reason: 'revoked' };
    if (g.state === 'USED' || g.remainingReads <= 0) return { reason: 'used' };
    return { reason: 'expired' };
  }

  async updateGrant(id: string, ownerUid: string, patch: Pick<DownloadGrant, 'state'> & Partial<Pick<DownloadGrant, 'revokedAt'>>, activeOnly = false): Promise<GrantWriteResult> {
    if (!activeOnly) {
      // Unconditional owner-scoped transition (expiry sweep, revoke replay).
      const cur = await this.db.downloadGrant.findUnique({ where: { id } });
      if (!cur) return { ok: false, reason: 'not_found' };
      if ((cur as unknown as Row).ownerUid !== ownerUid) return { ok: false, reason: 'unauthorized' };
      const g = grantFrom(cur as unknown as Row);
      if (g.state === 'REVOKED' && patch.state === 'REVOKED') return { ok: true, grant: g };
      const updated = await this.db.downloadGrant.update({
        where: { id },
        data: { state: patch.state, revokedAt: patch.revokedAt === undefined ? undefined : (patch.revokedAt ? new Date(patch.revokedAt) : null) },
      });
      return { ok: true, grant: grantFrom(updated as unknown as Row) };
    }
    const updated = await this.db.$queryRawUnsafe<Row[]>(`
      UPDATE "download_grants" SET
        "state" = ${this.sqlString(patch.state)},
        "revokedAt" = ${patch.revokedAt === undefined
          ? (patch.state === 'REVOKED' ? UTC_NOW : '"revokedAt"')
          : (patch.revokedAt === null ? 'NULL' : `${this.sqlString(patch.revokedAt)}::TIMESTAMP(3)`)}
      WHERE "id" = ${this.sqlString(id)} AND "ownerUid" = ${this.sqlString(ownerUid)}
        AND "state" = 'ACTIVE' AND "revokedAt" IS NULL
      RETURNING *`);
    if (Array.isArray(updated) && updated.length) return { ok: true, grant: grantFrom(updated[0]) };
    return { ok: false, ...(await this.classifyGrant(id, ownerUid)) };
  }

  /** Atomic read consumption: one conditional UPDATE re-checks ACTIVE + unexpired
   * + remaining budget against the CURRENT row and decrements once — concurrent
   * readers can never both spend the same unit (double-spend would need two rows
   * to pass WHERE "remainingReads" > 0 at the same unit). */
  async consumeRead(id: string, ownerUid: string, deliveredBytes: number): Promise<GrantWriteResult> {
    const updated = await this.db.$queryRawUnsafe<Row[]>(`
      UPDATE "download_grants" SET
        "remainingReads" = "remainingReads" - 1,
        "bytesDelivered" = "bytesDelivered" + ${BigInt(Math.max(0, Math.floor(deliveredBytes)))},
        "lastReadAt" = ${UTC_NOW},
        "state" = CASE WHEN "remainingReads" - 1 <= 0 THEN 'USED' ELSE "state" END
      WHERE "id" = ${this.sqlString(id)} AND "ownerUid" = ${this.sqlString(ownerUid)}
        AND "state" = 'ACTIVE' AND "expiresAt" > ${UTC_NOW} AND "remainingReads" > 0
      RETURNING *`);
    if (Array.isArray(updated) && updated.length) return { ok: true, grant: grantFrom(updated[0]) };
    return { ok: false, ...(await this.classifyGrant(id, ownerUid)) };
  }

  async grantTokens(ownerUid: string): Promise<DownloadGrant[]> {
    const rows = await this.db.downloadGrant.findMany({ where: { ownerUid }, orderBy: { createdAt: 'asc' } });
    return rows.map((r) => grantFrom(r as unknown as Row));
  }

  async activeExpired(now: string): Promise<DownloadGrant[]> {
    const rows = await this.db.downloadGrant.findMany({ where: { state: 'ACTIVE', expiresAt: { lte: new Date(now) } } });
    return rows.map((r) => grantFrom(r as unknown as Row));
  }

  async insertExport(record: ExportRecord): Promise<void> {
    await this.db.downloadExport.create({
      data: {
        id: record.id, ownerUid: record.ownerUid, objects: record.objects as unknown as Prisma.InputJsonValue,
        state: record.state, expiresAt: new Date(record.expiresAt),
        createdAt: new Date(record.createdAt), deliveredBytes: BigInt(byteCount(record.deliveredBytes)),
      },
    });
  }

  async exportById(id: string): Promise<ExportRecord | null> {
    const row = await this.db.downloadExport.findUnique({ where: { id } });
    return row ? exportFrom(row as unknown as Row) : null;
  }

  async recordExportDelivery(id: string, ownerUid: string, deliveredBytes: number): Promise<ExportWriteResult> {
    byteCount(deliveredBytes);
    return this.db.$transaction(async tx => {
      const locked = await tx.$queryRaw<Row[]>`SELECT * FROM "download_exports" WHERE "id" = ${id} AND "ownerUid" = ${ownerUid} FOR UPDATE`;
      if (locked.length && !Number.isSafeInteger(Number(locked[0].deliveredBytes) + deliveredBytes)) {
        return { ok: false, reason: 'conflict' };
      }
    const updated = await tx.$queryRawUnsafe<Row[]>(`
      UPDATE "download_exports" SET
        "deliveredBytes" = "deliveredBytes" + ${Number(deliveredBytes)}
      WHERE "id" = ${this.sqlString(id)} AND "ownerUid" = ${this.sqlString(ownerUid)}
        AND "state" = 'ACTIVE' AND "expiresAt" > ${UTC_NOW}
      RETURNING *`);
    if (Array.isArray(updated) && updated.length) return { ok: true, record: exportFrom(updated[0]) };
    const row = await tx.downloadExport.findUnique({ where: { id } });
    if (!row) return { ok: false, reason: 'not_found' };
    if ((row as unknown as Row).ownerUid !== ownerUid) return { ok: false, reason: 'unauthorized' };
    const e = exportFrom(row as unknown as Row);
    if (e.state === 'REVOKED') return { ok: false, reason: 'revoked' };
    return { ok: false, reason: 'expired' };
    });
  }

  async updateExport(id: string, ownerUid: string, patch: Pick<ExportRecord, 'state'>, activeOnly = false): Promise<ExportWriteResult> {
    if (!activeOnly) {
      const cur = await this.db.downloadExport.findUnique({ where: { id } });
      if (!cur) return { ok: false, reason: 'not_found' };
      if ((cur as unknown as Row).ownerUid !== ownerUid) return { ok: false, reason: 'unauthorized' };
      const updated = await this.db.downloadExport.update({ where: { id }, data: { state: patch.state } });
      return { ok: true, record: exportFrom(updated as unknown as Row) };
    }
    const updated = await this.db.$queryRawUnsafe<Row[]>(`
      UPDATE "download_exports" SET "state" = ${this.sqlString(patch.state)}
      WHERE "id" = ${this.sqlString(id)} AND "ownerUid" = ${this.sqlString(ownerUid)}
        AND "state" = 'ACTIVE'
      RETURNING *`);
    if (Array.isArray(updated) && updated.length) return { ok: true, record: exportFrom(updated[0]) };
    const row = await this.db.downloadExport.findUnique({ where: { id } });
    if (!row) return { ok: false, reason: 'not_found' };
    if ((row as unknown as Row).ownerUid !== ownerUid) return { ok: false, reason: 'unauthorized' };
    return { ok: false, reason: 'conflict' };
  }

  async exportsFor(ownerUid: string): Promise<ExportRecord[]> {
    const rows = await this.db.downloadExport.findMany({ where: { ownerUid }, orderBy: { createdAt: 'asc' } });
    return rows.map((r) => exportFrom(r as unknown as Row));
  }

  async exportedExpired(now: string): Promise<ExportRecord[]> {
    const rows = await this.db.downloadExport.findMany({ where: { state: 'ACTIVE', expiresAt: { lte: new Date(now) } } });
    return rows.map((r) => exportFrom(r as unknown as Row));
  }

  /** Strict allow-list for identifiers embedded in the raw conditional
   * statements: grant/export ids and Firebase uids only. */
  private sqlString(value: string): string {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(value)) throw new Error('invalid identifier');
    return `'${value}'`;
  }
}
