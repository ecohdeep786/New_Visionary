import { Prisma } from '@prisma/client';
import type { OutboxDeliveryStatus, PrismaClient } from '@prisma/client';
import type { OutboxDeliveryStore, OutboxSettlement } from './outbox-store';
import type { OutboxCursor, OutboxEvent } from './outbox-types';
import { outboxCursorKey } from './outbox-types';

export const CONSENT_REVOCATION_TOPIC = 'consent.revoked';

type DeliveryRow = Pick<OutboxEvent, 'id' | 'uid' | 'workspaceId' | 'topic' | 'payload'> & {
  cursor: bigint;
  status: OutboxDeliveryStatus;
  createdAt: Date;
  claimedAt: Date | null;
  availableAt: Date;
  attempts: number;
  lastError: string | null;
};

const eventFields = Prisma.sql`e.id, e.uid, e."workspaceId", e.topic, e.payload, e."createdAt"`;

function toEvent(row: DeliveryRow): OutboxEvent {
  return {
    id: row.id, uid: row.uid, workspaceId: row.workspaceId, topic: row.topic, payload: row.payload,
    cursor: row.cursor, status: row.status === 'LEASED' ? 'DISPATCHED' : row.status,
    createdAt: row.createdAt.toISOString(), dispatchedAt: row.claimedAt?.toISOString() ?? null,
    attempts: row.attempts, lastError: row.lastError,
    nextAttemptAt: row.status === 'PENDING' || row.status === 'LEASED' ? row.availableAt.toISOString() : null,
  };
}

/** Tracks delivery state without changing the source event or its cursor. */
export class PostgresOutboxDeliveryStore implements OutboxDeliveryStore {
  constructor(private readonly db: PrismaClient, private readonly afterCursor: bigint) {
    if (afterCursor < 0n) throw Error('Outbox replay cursor must be non-negative.');
  }

  async outboxByCursor(cursor: OutboxCursor): Promise<OutboxEvent | null> {
    const [row] = await this.db.$queryRaw<DeliveryRow[]>`
      SELECT ${eventFields}, d.* FROM outbox_deliveries d JOIN outbox_events e USING (cursor)
      WHERE d.cursor = ${outboxCursorKey(cursor)} AND d.cursor > ${this.afterCursor} AND e.topic = ${CONSENT_REVOCATION_TOPIC}
    `;
    return row ? toEvent(row) : null;
  }

  async claimDueOutbox(limit: number, now: Date, maxAttempts: number, leaseMs: number): Promise<OutboxEvent[]> {
    if (limit <= 0) return [];
    const leaseUntil = new Date(now.getTime() + leaseMs);
    return this.db.$transaction(async tx => {
      await tx.$executeRaw`
        INSERT INTO outbox_deliveries (cursor, "availableAt")
        SELECT e.cursor, timezone('UTC', ${now}::timestamptz) FROM outbox_events e
        WHERE e.topic = ${CONSENT_REVOCATION_TOPIC} AND e.status = 'PENDING' AND e.cursor > ${this.afterCursor}
          AND NOT EXISTS (SELECT 1 FROM outbox_deliveries d WHERE d.cursor = e.cursor)
        ORDER BY e.cursor LIMIT ${limit}
        ON CONFLICT (cursor) DO NOTHING
      `;
      return this.transitionDue(tx, limit, now, Prisma.sql`d.attempts < ${maxAttempts}`,
        Prisma.sql`status = 'LEASED', "availableAt" = timezone('UTC', ${leaseUntil}::timestamptz),
          "claimedAt" = timezone('UTC', ${now}::timestamptz), attempts = d.attempts + 1`);
    });
  }

  quarantineDueOutbox(limit: number, now: Date, maxAttempts: number): Promise<OutboxEvent[]> {
    return this.transitionDue(this.db, limit, now, Prisma.sql`d.attempts >= ${maxAttempts}`,
      Prisma.sql`status = 'FAILED', "lastError" = 'MAX_ATTEMPTS_REACHED'`);
  }

  private async transitionDue(db: Prisma.TransactionClient, limit: number, now: Date, attempts: Prisma.Sql, change: Prisma.Sql) {
    const rows = await db.$queryRaw<DeliveryRow[]>`
      WITH due AS (
        SELECT d.cursor FROM outbox_deliveries d JOIN outbox_events e USING (cursor)
        WHERE e.topic = ${CONSENT_REVOCATION_TOPIC} AND d.cursor > ${this.afterCursor}
          AND d.status IN ('PENDING', 'LEASED') AND d."availableAt" <= timezone('UTC', ${now}::timestamptz) AND ${attempts}
        ORDER BY d.cursor LIMIT ${limit} FOR UPDATE OF d SKIP LOCKED
      ), changed AS (
        UPDATE outbox_deliveries d SET ${change} FROM due WHERE d.cursor = due.cursor RETURNING d.*
      )
      SELECT ${eventFields}, changed.* FROM changed JOIN outbox_events e USING (cursor) ORDER BY cursor
    `;
    return rows.map(toEvent);
  }

  async settleOutbox(cursor: OutboxCursor, attempt: number, settlement: OutboxSettlement): Promise<OutboxEvent | null> {
    // Only the receiver can commit DONE, in the same transaction as its effect.
    if (settlement.status === 'DONE') return null;
    const retryAt = settlement.nextAttemptAt ? new Date(settlement.nextAttemptAt) : null;
    const [row] = await this.db.$queryRaw<DeliveryRow[]>`
      UPDATE outbox_deliveries d SET status = ${settlement.status}::"OutboxDeliveryStatus",
        "availableAt" = COALESCE(timezone('UTC', ${retryAt}::timestamptz), d."availableAt"), "lastError" = ${settlement.lastError}
      FROM outbox_events e WHERE e.cursor = d.cursor AND d.cursor = ${outboxCursorKey(cursor)}
        AND d.cursor > ${this.afterCursor} AND e.topic = ${CONSENT_REVOCATION_TOPIC}
        AND d.status = 'LEASED' AND d.attempts = ${attempt}
      RETURNING ${eventFields}, d.*
    `;
    return row ? toEvent(row) : null;
  }
}
