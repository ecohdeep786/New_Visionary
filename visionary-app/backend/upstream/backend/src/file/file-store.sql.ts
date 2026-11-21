import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import type { FilePatch, FileStore, StoredChunk, UploadPart } from './file-store';
import type { FileRecord } from './file-types';

type UploadRow = Omit<FileRecord, 'createdAt' | 'expiresAt'> & { createdAt: Date; expiresAt: Date };
const record = (row: UploadRow): FileRecord => ({
  ...row, createdAt: row.createdAt.toISOString(), expiresAt: row.expiresAt.toISOString(),
});
const scoped = (uid: Prisma.Sql, workspace: Prisma.Sql) => Prisma.sql`
  EXISTS (SELECT 1 FROM persons p WHERE p.uid = ${uid})
  AND NOT EXISTS (SELECT 1 FROM deletion_tombstones t WHERE t.uid = ${uid} AND t."resourceType" = 'person')
  AND (${workspace} IS NULL OR EXISTS (
    SELECT 1 FROM workspaces w WHERE w.id = ${workspace}
    AND NOT EXISTS (
      SELECT 1 FROM deletion_tombstones t WHERE t.uid = w.uid AND t."resourceType" = 'workspace' AND t."resourceId" = w.id
    )
    AND (w.uid = ${uid} OR EXISTS (
      SELECT 1 FROM workspace_memberships m
      WHERE m."workspaceId" = w.id AND m.uid = ${uid} AND m.role IN ('MEMBER', 'ADMIN')
    ))
  ))
`;
const available = Prisma.sql`${scoped(Prisma.sql`u.uid`, Prisma.sql`u."workspaceId"`)}`;
const writable = {
  state: Prisma.sql`state`, digest: Prisma.sql`digest`, sniffedType: Prisma.sql`"sniffedType"`,
  scanResult: Prisma.sql`"scanResult"`, rejectionReason: Prisma.sql`"rejectionReason"`,
  parserOutputBytes: Prisma.sql`"parserOutputBytes"`, archiveEntries: Prisma.sql`"archiveEntries"`,
} satisfies Record<keyof FilePatch, Prisma.Sql>;

async function lockScope(tx: Prisma.TransactionClient, uid: string, workspaceId: string | null) {
  const [owner] = await tx.$queryRaw<Array<{ uid: string }>>`SELECT uid FROM persons WHERE uid = ${uid} FOR UPDATE`;
  if (!owner) return false;
  if (workspaceId !== null) {
    await tx.$queryRaw`SELECT id FROM workspaces WHERE id = ${workspaceId} FOR SHARE`;
    await tx.$queryRaw`
      SELECT id FROM workspace_memberships WHERE uid = ${uid} AND "workspaceId" = ${workspaceId} FOR SHARE
    `;
  }
  const [row] = await tx.$queryRaw<Array<{ allowed: boolean }>>`
    SELECT (${scoped(Prisma.sql`${uid}`, Prisma.sql`${workspaceId}::text`)}) AS allowed
  `;
  return row.allowed;
}

async function lockUpload(tx: Prisma.TransactionClient, uid: string, id: string) {
  const [upload] = await tx.$queryRaw<Array<{ workspaceId: string | null }>>`
    SELECT "workspaceId" FROM file_uploads WHERE id = ${id} AND uid = ${uid}
  `;
  if (!upload || !await lockScope(tx, uid, upload.workspaceId)) return false;
  await tx.$queryRaw`SELECT id FROM file_uploads WHERE id = ${id} AND uid = ${uid} FOR UPDATE`;
  return true;
}

export class PostgresFileStore implements FileStore {
  constructor(private readonly db: PrismaClient) {}

  async clock(): Promise<Date> {
    const [row] = await this.db.$queryRaw<Array<{ now: Date }>>`SELECT clock_timestamp() AS now`;
    return row.now;
  }

  async create(upload: FileRecord): Promise<boolean> {
    return this.db.$transaction(async tx => {
      if (!await lockScope(tx, upload.uid, upload.workspaceId)) return false;
      await tx.$executeRaw`
        INSERT INTO file_uploads (id, uid, "workspaceId", name, "declaredType", "declaredSize", "expectedDigest",
          "createdAt", "expiresAt", "chunkBytes", "maxParserOutputBytes", "maxArchiveEntries")
        VALUES (${upload.id}, ${upload.uid}, ${upload.workspaceId}, ${upload.name}, ${upload.declaredType}, ${upload.declaredSize},
          ${upload.expectedDigest}, ${new Date(upload.createdAt)}, ${new Date(upload.expiresAt)}, ${upload.chunkBytes},
          ${upload.maxParserOutputBytes}, ${upload.maxArchiveEntries})
      `;
      return true;
    });
  }

  async get(uid: string, id: string): Promise<FileRecord | null> {
    const [row] = await this.db.$queryRaw<UploadRow[]>`
      SELECT u.* FROM file_uploads u WHERE u.id = ${id} AND u.uid = ${uid} AND ${available}
    `;
    return row ? record(row) : null;
  }

  async chunk(uid: string, id: string, offset: number): Promise<StoredChunk | null> {
    const [row] = await this.db.$queryRaw<StoredChunk[]>`
      SELECT c.offset, c.size, c.digest, c."objectName", c.generation
      FROM file_upload_chunks c JOIN file_uploads u ON c."uploadId" = u.id
      WHERE u.id = ${id} AND u.uid = ${uid} AND c.offset = ${offset} AND c.generation IS NOT NULL AND ${available}
    `;
    return row ?? null;
  }

  async chunks(uid: string, id: string): Promise<StoredChunk[]> {
    return this.db.$queryRaw<StoredChunk[]>`
      SELECT c.offset, c.size, c.digest, c."objectName", c.generation
      FROM file_upload_chunks c JOIN file_uploads u ON c."uploadId" = u.id
      WHERE u.id = ${id} AND u.uid = ${uid} AND c.generation IS NOT NULL AND ${available}
      ORDER BY c.offset LIMIT 128
    `;
  }

  async reserve(uid: string, id: string, revision: number, part: UploadPart): Promise<boolean> {
    return this.db.$transaction(async tx => {
      if (!await lockUpload(tx, uid, id)) return false;
      const [row] = await tx.$queryRaw<Array<{ reserved: boolean }>>`
        WITH eligible AS (
          SELECT u.id FROM file_uploads u
          WHERE u.id = ${id} AND u.uid = ${uid} AND u.revision = ${revision} AND u.state IN ('INTENT', 'UPLOADING')
            AND ${part.offset} = u."bytesReceived"
            AND ${part.size} = LEAST(u."chunkBytes", u."declaredSize" - u."bytesReceived")
            AND clock_timestamp() < u."expiresAt" AND ${available}
        ), inserted AS (
          INSERT INTO file_upload_chunks ("uploadId", "offset", size, digest, "objectName")
          SELECT id, ${part.offset}, ${part.size}, ${part.digest}, ${part.objectName} FROM eligible
          ON CONFLICT ("uploadId", "offset") DO NOTHING RETURNING "uploadId"
        )
        SELECT EXISTS (SELECT 1 FROM inserted) OR EXISTS (
          SELECT 1 FROM file_upload_chunks c JOIN eligible e ON e.id = c."uploadId"
          WHERE c.offset = ${part.offset} AND c.size = ${part.size} AND c.digest = ${part.digest}
            AND c."objectName" = ${part.objectName} AND c.generation IS NULL
        ) AS reserved
      `;
      return row.reserved;
    });
  }

  async append(uid: string, id: string, revision: number, chunk: StoredChunk): Promise<FileRecord | null> {
    return this.db.$transaction(async tx => {
      if (!await lockUpload(tx, uid, id)) return null;
      const [row] = await tx.$queryRaw<UploadRow[]>`
        UPDATE file_uploads u SET state = 'UPLOADING', "bytesReceived" = "bytesReceived" + ${chunk.size},
          revision = revision + 1
        WHERE u.id = ${id} AND u.uid = ${uid} AND u.revision = ${revision} AND u.state IN ('INTENT', 'UPLOADING')
          AND ${chunk.offset} = "bytesReceived" AND ${chunk.size} = LEAST("chunkBytes", "declaredSize" - "bytesReceived")
          AND clock_timestamp() < "expiresAt" AND ${available}
        RETURNING u.*
      `;
      if (!row) return null;
      const confirmed = await tx.$executeRaw`
        UPDATE file_upload_chunks SET generation = ${chunk.generation}
        WHERE "uploadId" = ${id} AND "offset" = ${chunk.offset} AND size = ${chunk.size}
          AND digest = ${chunk.digest} AND "objectName" = ${chunk.objectName} AND generation IS NULL
      `;
      if (confirmed !== 1) throw Error('Quarantine reservation changed.');
      return record(row);
    });
  }

  async transition(uid: string, id: string, revision: number, patch: FilePatch): Promise<FileRecord | null> {
    const assignments = (Object.keys(writable) as Array<keyof FilePatch>)
      .filter(field => patch[field] !== undefined)
      .map(field => field === 'state' ? Prisma.sql`state = ${patch.state}::"FileUploadState"` :
        Prisma.sql`${writable[field]} = ${patch[field]}`);
    assignments.push(Prisma.sql`revision = revision + 1`);
    return this.db.$transaction(async tx => {
      if (!await lockUpload(tx, uid, id)) return null;
      const [row] = await tx.$queryRaw<UploadRow[]>`
        UPDATE file_uploads u SET ${Prisma.join(assignments)}
        WHERE u.id = ${id} AND u.uid = ${uid} AND u.revision = ${revision} AND ${available}
          AND (${patch.state}::"FileUploadState" = 'CANCELLED' OR clock_timestamp() < "expiresAt")
          AND CASE ${patch.state}::"FileUploadState"
            WHEN 'SCANNING' THEN u.state = 'UPLOADING'
            WHEN 'READY' THEN u.state = 'SCANNING'
            WHEN 'REJECTED' THEN u.state IN ('UPLOADING', 'SCANNING')
            WHEN 'CANCELLED' THEN u.state IN ('INTENT', 'UPLOADING', 'SCANNING')
            ELSE FALSE
          END
        RETURNING u.*
      `;
      return row ? record(row) : null;
    });
  }
}
