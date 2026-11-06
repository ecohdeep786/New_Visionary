// DATA-06 — command result / outbox / tombstone store contract + in-memory
// synthetic implementation. The Cloud SQL adapter implements the same contract
// against the DATA-01 command_results / outbox_events / deletion_tombstones
// tables, so the enabler's logic runs unchanged on GCP. The unique `commandId`
// constraint is modeled explicitly so duplicate-command behavior is enforced
// by the store, not only by hope.
import type { CommandResult, DeletionTombstone, DomainCommand, OutboxEvent } from './command-types';

export type CommittedCommand = 'command_results' | 'outbox_events';

/** Everything the owning-store transaction needs to commit one command.
 * The REVISION IS ASSIGNED INSIDE THE TRANSACTION (review 10581): the store
 * locks the uid anchor, reads the current max revision for uid+kind in the
 * same transaction, verifies the caller's expectation and assigns
 * max+1 (or expected+1) atomically — two independent connections can never
 * both commit the same next revision. */
export interface CommitCommandInput {
  result: Omit<CommandResult, 'revision'>;
  event: OutboxEvent;
  /** Optimistic concurrency verified inside the transaction. */
  expectedRevision?: number;
}

export interface CommandStore {
  /** Insert a command result. Throws DUPLICATE if the commandId is already present. */
  insertResult(result: CommandResult): Promise<void>;
  /** Replace a result already present under the same commandId (for retried FAILED rows). */
  updateResult(id: string, patch: Partial<Pick<CommandResult, 'status' | 'resultJson' | 'error' | 'committedAt' | 'revision'>>): Promise<CommandResult | null>;
  resultByCommandId(commandId: string): Promise<CommandResult | null>;
  resultsByUid(uid: string): Promise<CommandResult[]>;
  /** Highest revision for `uid + kind`; null when none. Used for conditional revisions. */
  maxRevision(uid: string, kind: string): Promise<number | null>;
  /** Append an outbox event inside the same transaction as the command result. */
  appendOutbox(event: OutboxEvent): Promise<void>;
  outboxByCursor(cursor: number): Promise<OutboxEvent | null>;
  pendingOutbox(batchSize: number): Promise<OutboxEvent[]>;
  markOutbox(cursor: number, patch: Partial<Pick<OutboxEvent, 'status' | 'dispatchedAt' | 'failureReason'>>): Promise<OutboxEvent | null>;
  insertTombstone(tombstone: DeletionTombstone): Promise<void>;
  tombstoneByResource(uid: string, resourceType: string, resourceId: string): Promise<DeletionTombstone | null>;
  /** Commit result + outbox event atomically; the revision is compared and
   * assigned INSIDE the transaction. On outbox failure or a revision
   * mismatch nothing is committed (rollback / stale rejection). */
  commitTransaction(input: CommitCommandInput): Promise<CommandResult>;
}

/** Thrown inside the transaction when the caller's expected revision no longer
 * matches the store's current max revision for uid+kind. */
export class CommandStaleRevision extends Error {
  constructor(public readonly currentRevision: number | null) {
    super(`STALE_REVISION: store revision is ${currentRevision ?? 'none'}.`);
  }
}

/** Wraps an in-memory insert that violates the unique commandId constraint. */
export class CommandUniqueViolation extends Error {
  constructor(public readonly commandId: string) {
    super(`DUPLICATE_COMMAND: command key "${commandId}" already committed.`);
  }
}

export class InMemoryCommandStore implements CommandStore {
  readonly results = new Map<string, CommandResult>(); // by commandId (unique)
  readonly resultsById = new Map<string, CommandResult>();
  readonly outbox = new Map<number, OutboxEvent>();
  readonly tombstones = new Map<string, DeletionTombstone>();
  private seq = 0;
  /** When true, appending an outbox event fails to emulate a mid-transaction outage. */
  failOutbox = false;

  private nextId(prefix: string) { return `${prefix}_${++this.seq}`; }

  async insertResult(result: CommandResult): Promise<void> {
    if (this.results.has(result.commandId)) throw new CommandUniqueViolation(result.commandId);
    this.results.set(result.commandId, result);
    this.resultsById.set(result.id, result);
  }

  async updateResult(id: string, patch: Partial<Pick<CommandResult, 'status' | 'resultJson' | 'error' | 'committedAt' | 'revision'>>): Promise<CommandResult | null> {
    const existing = this.resultsById.get(id);
    if (!existing) return null;
    const next = { ...existing, ...patch };
    this.results.set(next.commandId, next);
    this.resultsById.set(id, next);
    return next;
  }

  async resultByCommandId(commandId: string): Promise<CommandResult | null> {
    return this.results.get(commandId) ?? null;
  }

  async resultsByUid(uid: string): Promise<CommandResult[]> {
    return [...this.results.values()].filter((r) => r.uid === uid);
  }

  async maxRevision(uid: string, kind: string): Promise<number | null> {
    const matches = [...this.results.values()].filter((r) => r.uid === uid && r.kind === kind);
    if (matches.length === 0) return null;
    return Math.max(...matches.map((r) => r.revision));
  }

  async appendOutbox(event: OutboxEvent): Promise<void> {
    if (this.failOutbox) throw new Error('SIMULATED_OUTBOX_FAILURE: outbox append failed in-transaction');
    this.outbox.set(event.cursor, event);
  }

  async outboxByCursor(cursor: number): Promise<OutboxEvent | null> {
    return this.outbox.get(cursor) ?? null;
  }

  async pendingOutbox(batchSize: number): Promise<OutboxEvent[]> {
    return [...this.outbox.values()]
      .filter((e) => e.status === 'PENDING')
      .sort((a, b) => a.cursor - b.cursor)
      .slice(0, batchSize);
  }

  async markOutbox(cursor: number, patch: Partial<Pick<OutboxEvent, 'status' | 'dispatchedAt' | 'failureReason'>>): Promise<OutboxEvent | null> {
    const existing = this.outbox.get(cursor);
    if (!existing) return null;
    const next = { ...existing, ...patch };
    this.outbox.set(cursor, next);
    return next;
  }

  async insertTombstone(tombstone: DeletionTombstone): Promise<void> {
    const key = `${tombstone.uid}|${tombstone.resourceType}|${tombstone.resourceId}`;
    this.tombstones.set(key, tombstone);
  }

  async tombstoneByResource(uid: string, resourceType: string, resourceId: string): Promise<DeletionTombstone | null> {
    return this.tombstones.get(`${uid}|${resourceType}|${resourceId}`) ?? null;
  }

  async commitTransaction(input: CommitCommandInput): Promise<CommandResult> {
    const { result, event, expectedRevision } = input;
    // The unique commandId constraint is checked first; a violation aborts the
    // whole transaction (DUPLICATE) and nothing is committed.
    if (this.results.has(result.commandId)) throw new CommandUniqueViolation(result.commandId);
    // Revision comparison + assignment happen INSIDE the transaction: the
    // in-memory store's synchronous section stands in for the SQL anchor lock.
    const matches = [...this.results.values()].filter((r) => r.uid === result.uid && r.kind === result.kind);
    const maxRev = matches.length ? Math.max(...matches.map((r) => r.revision)) : null;
    if (expectedRevision !== undefined && maxRev !== null && maxRev !== expectedRevision) {
      throw new CommandStaleRevision(maxRev);
    }
    const revision = (expectedRevision ?? maxRev ?? 0) + 1;
    if (revision < 1 || revision > 1_000_000) throw new CommandStaleRevision(maxRev);
    const committed: CommandResult = { ...result, revision };
    this.results.set(committed.commandId, committed);
    this.resultsById.set(committed.id, committed);
    if (this.failOutbox) {
      // Roll back: remove the result row we just staged.
      this.results.delete(committed.commandId);
      this.resultsById.delete(committed.id);
      throw new Error('SIMULATED_OUTBOX_FAILURE: outbox append failed, transaction rolled back');
    }
    this.outbox.set(event.cursor, event);
    return committed;
  }
}
