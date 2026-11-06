// DATA-06 — durable PostgreSQL command store (the owning-store adapter).
//
// Implements the CommandStore surface over the DATA-01 command_results /
// outbox_events / deletion_tombstones tables with the review-10581 semantics:
//   - commitTransaction locks the canonical Person row (the same UID anchor
//     order the domain repositories use), reads the max revision for
//     uid+kind INSIDE the transaction, verifies the caller's expectation and
//     assigns the revision atomically — two independent connections racing
//     the same uid+kind cannot both commit the same next revision,
//   - the unique commandId constraint is enforced by the table; a duplicate
//     aborts the whole transaction,
//   - the outbox event commits in the same transaction; a failure rolls the
//     result back,
//   - timestamps are the database clock inside the transaction.
import { PrismaClient, Prisma } from '@prisma/client';
import type { CommandResult, DeletionTombstone, OutboxEvent } from './command-types';
import type { CommitCommandInput, CommandStore } from './command-store';
import { CommandStaleRevision, CommandUniqueViolation } from './command-store';

type Row = Record<string, unknown>;

const iso = (value: unknown): string => (value instanceof Date ? value.toISOString() : String(value));
const isoOrNull = (value: unknown): string | null => (value === null || value === undefined ? null : iso(value));

function resultFrom(row: Row): CommandResult {
  return {
    id: String(row.id),
    uid: String(row.uid),
    workspaceId: row.workspaceId === null || row.workspaceId === undefined ? null : String(row.workspaceId),
    commandId: String(row.commandId),
    kind: String(row.kind),
    payloadDigest: String(row.payloadDigest),
    status: row.status as CommandResult['status'],
    resultJson: typeof row.resultJson === 'string' ? JSON.parse(row.resultJson) : row.resultJson,
    error: isoOrNull(row.error),
    attemptedAt: iso(row.attemptedAt),
    committedAt: isoOrNull(row.committedAt),
    revision: Number(row.revision),
  };
}

function eventFrom(row: Row): OutboxEvent {
  return {
    id: String(row.id),
    uid: String(row.uid),
    workspaceId: row.workspaceId === null || row.workspaceId === undefined ? null : String(row.workspaceId),
    topic: String(row.topic),
    payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
    cursor: Number(row.cursor),
    status: row.status as OutboxEvent['status'],
    createdAt: iso(row.createdAt),
    dispatchedAt: isoOrNull(row.dispatchedAt),
    failureReason: isoOrNull(row.failureReason),
  };
}

function tombstoneFrom(row: Row): DeletionTombstone {
  return {
    id: String(row.id),
    uid: String(row.uid),
    resourceType: String(row.resourceType),
    resourceId: String(row.resourceId),
    reason: isoOrNull(row.reason),
    createdAt: iso(row.createdAt),
    expiresAt: isoOrNull(row.expiresAt),
  };
}

export class PostgresCommandStore implements CommandStore {
  constructor(private readonly db: PrismaClient) {}

  async insertResult(result: CommandResult): Promise<void> {
    try {
      await this.db.commandResult.create({
        data: {
          id: result.id, uid: result.uid, workspaceId: result.workspaceId, commandId: result.commandId,
          kind: result.kind, payloadDigest: result.payloadDigest, status: result.status,
          resultJson: (result.resultJson ?? null) as Prisma.InputJsonValue, error: result.error,
          attemptedAt: new Date(result.attemptedAt), committedAt: result.committedAt ? new Date(result.committedAt) : null,
          revision: result.revision,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new CommandUniqueViolation(result.commandId);
      }
      throw error;
    }
  }

  async updateResult(id: string, patch: Partial<Pick<CommandResult, 'status' | 'resultJson' | 'error' | 'committedAt' | 'revision'>>): Promise<CommandResult | null> {
    const updated = await this.db.commandResult.update({
      where: { id },
      data: {
        status: patch.status,
        resultJson: patch.resultJson === undefined ? undefined : (patch.resultJson as Prisma.InputJsonValue),
        error: patch.error,
        committedAt: patch.committedAt === undefined ? undefined : (patch.committedAt ? new Date(patch.committedAt) : null),
        revision: patch.revision,
      },
    }).catch(() => null);
    return updated ? resultFrom(updated as unknown as Row) : null;
  }

  async resultByCommandId(commandId: string): Promise<CommandResult | null> {
    const row = await this.db.commandResult.findUnique({ where: { commandId } });
    return row ? resultFrom(row as unknown as Row) : null;
  }

  async resultsByUid(uid: string): Promise<CommandResult[]> {
    const rows = await this.db.commandResult.findMany({ where: { uid }, orderBy: { revision: 'asc' } });
    return rows.map((r) => resultFrom(r as unknown as Row));
  }

  async maxRevision(uid: string, kind: string): Promise<number | null> {
    const [row] = await this.db.$queryRawUnsafe<{ max: number | null }[]>(
      'SELECT MAX("revision") AS max FROM "command_results" WHERE "uid" = $1 AND "kind" = $2', uid, kind);
    return row?.max === null || row?.max === undefined ? null : Number(row.max);
  }

  async appendOutbox(event: OutboxEvent): Promise<void> {
    await this.db.outboxEvent.create({
      data: {
        id: event.id, uid: event.uid, workspaceId: event.workspaceId, topic: event.topic,
        payload: (event.payload ?? null) as Prisma.InputJsonValue, status: event.status,
        createdAt: new Date(event.createdAt), dispatchedAt: event.dispatchedAt ? new Date(event.dispatchedAt) : null,
        failureReason: event.failureReason,
      },
    });
  }

  async outboxByCursor(cursor: number): Promise<OutboxEvent | null> {
    const row = await this.db.outboxEvent.findUnique({ where: { cursor: BigInt(cursor) } });
    return row ? eventFrom(row as unknown as Row) : null;
  }

  async pendingOutbox(batchSize: number): Promise<OutboxEvent[]> {
    const rows = await this.db.outboxEvent.findMany({ where: { status: 'PENDING' }, orderBy: { cursor: 'asc' }, take: batchSize });
    return rows.map((r) => eventFrom(r as unknown as Row));
  }

  async markOutbox(cursor: number, patch: Partial<Pick<OutboxEvent, 'status' | 'dispatchedAt' | 'failureReason'>>): Promise<OutboxEvent | null> {
    const updated = await this.db.outboxEvent.update({
      where: { cursor: BigInt(cursor) },
      data: {
        status: patch.status,
        dispatchedAt: patch.dispatchedAt === undefined ? undefined : (patch.dispatchedAt ? new Date(patch.dispatchedAt) : null),
        failureReason: patch.failureReason,
      },
    }).catch(() => null);
    return updated ? eventFrom(updated as unknown as Row) : null;
  }

  async insertTombstone(tombstone: DeletionTombstone): Promise<void> {
    await this.db.deletionTombstone.create({
      data: {
        id: tombstone.id, uid: tombstone.uid, resourceType: tombstone.resourceType,
        resourceId: tombstone.resourceId, reason: tombstone.reason,
        createdAt: new Date(tombstone.createdAt), expiresAt: tombstone.expiresAt ? new Date(tombstone.expiresAt) : null,
      },
    });
  }

  async tombstoneByResource(uid: string, resourceType: string, resourceId: string): Promise<DeletionTombstone | null> {
    const row = await this.db.deletionTombstone.findUnique({
      where: { uid_resourceType_resourceId: { uid, resourceType, resourceId } },
    });
    return row ? tombstoneFrom(row as unknown as Row) : null;
  }

  async commitTransaction(input: CommitCommandInput): Promise<CommandResult> {
    const { result, event, expectedRevision } = input;
    try {
      return await this.db.$transaction(async (tx) => {
        // Canonical UID anchor: serialize commands for this uid (same lock
        // order as the domain repositories) so the revision read below is
        // stable against concurrent commits until this transaction commits.
        const anchored = await tx.$queryRawUnsafe<Row[]>(
          'SELECT "uid" FROM "persons" WHERE "uid" = $1 FOR UPDATE', result.uid);
        if (!anchored.length) throw new Error(`UNKNOWN_UID: no person row for ${result.uid.slice(0, 12)}`);
        const [maxRow] = await tx.$queryRawUnsafe<{ max: number | null }[]>(
          'SELECT MAX("revision") AS max FROM "command_results" WHERE "uid" = $1 AND "kind" = $2', result.uid, result.kind);
        const maxRev = maxRow?.max === null || maxRow?.max === undefined ? null : Number(maxRow.max);
        if (expectedRevision !== undefined && maxRev !== null && maxRev !== expectedRevision) {
          throw new CommandStaleRevision(maxRev);
        }
        const revision = (expectedRevision ?? maxRev ?? 0) + 1;
        if (revision < 1 || revision > 1_000_000) throw new CommandStaleRevision(maxRev);
        const [inserted] = await tx.$queryRawUnsafe<Row[]>(`
          INSERT INTO "command_results"
            ("id","uid","workspaceId","commandId","kind","payloadDigest","status","resultJson","error","attemptedAt","committedAt","revision")
          VALUES ($1,$2,$3,$4,$5,$6,'COMMITTED',$7::jsonb,$8,$9,$9,$10)
          RETURNING *`,
          result.id, result.uid, result.workspaceId, result.commandId, result.kind, result.payloadDigest,
          JSON.stringify(result.resultJson ?? null), result.error, new Date(result.attemptedAt), revision);
        await tx.outboxEvent.create({
          data: {
            id: event.id, uid: event.uid, workspaceId: event.workspaceId, topic: event.topic,
            payload: (event.payload ?? null) as Prisma.InputJsonValue, status: event.status,
            createdAt: new Date(event.createdAt), failureReason: event.failureReason,
          },
        });
        return resultFrom(inserted);
      }, { maxWait: 5000, timeout: 10000 });
    } catch (error) {
      if (error instanceof CommandStaleRevision) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new CommandUniqueViolation(result.commandId);
      }
      throw error;
    }
  }
}
