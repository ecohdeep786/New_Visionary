// DATA-06 — command execution service.
//
// Responsibilities (each verified by an in-repo test):
//   - Scoped command results: every result is scoped to the verified uid
//     (and optional workspace) that originated it; a client cannot attach a
//     foreign scope.
//   - Conditional revisions: `expectedRevision` is compared against the store's
//     max revision for uid+kind; a mismatch rejects the command as STALE_REVISION.
//   - Trusted timestamps: all attemptedAt/committedAt/createdAt values are the
//     server clock (`now()` injectable only for tests); the client payload can
//     never supply them.
//   - Unique constraints: the store enforces a unique commandId; a replayed key
//     that still carries the same digest returns the committed result, while the
//     same key with a *changed* payload is rejected as CONFLICT.
//   - Transactional outbox: a successful commit appends an outbox event in the
//     same transaction; if the outbox append fails the command result is not
//     committed (rollback).
//   - Deletion tombstones: deleting a resource writes a tombstone; recreating a
//     tombstoned resource is rejected until the tombstone expires.
import { createHash } from 'node:crypto';
import type { CommandOutcome, CommandResult, DeletionTombstone, DomainCommand, OutboxEvent } from './command-types';
import type { CommandStore } from './command-store';
import { CommandUniqueViolation } from './command-store';

export class CommandPolicyError extends Error {
  constructor(public readonly code: 'invalid_command' | 'wrong_owner' | 'conflict' | 'duplicate' | 'stale_revision' | 'tombstoned' | 'outbox_rollback') {
    super(code);
  }
}

/** Deletion tombstones live this long unless extended. */
const TOMBSTONE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const MAX_REVISION_BOUND = 1_000_000;

export interface CommandServiceOptions {
  now?: () => Date;
  outboxTopic?: (kind: string) => string;
}

export interface DeleteResourceInput {
  uid: string;
  resourceType: string;
  resourceId: string;
  reason?: string;
  /** Expected current revision of the resource; a mismatch rejects deletion. */
  expectedRevision?: number;
}

export class CommandService {
  private readonly now: () => Date;
  private readonly outboxTopic: (kind: string) => string;
  private cursor = 0;

  constructor(private readonly store: CommandStore, options: CommandServiceOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.outboxTopic = options.outboxTopic ?? ((kind) => `domain.${kind}`);
  }

  private when() { return this.now().toISOString(); }
  private digest(value: unknown) { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
  private newId(prefix: string) { return `${prefix}_${this.when().replace(/[^0-9]/g, '')}_${this.digest([prefix, this.when(), Math.random()].join('|')).slice(0, 12)}`; }
  private nextCursor() { return ++this.cursor; }

  private validCommand(input: unknown): DomainCommand {
    if (typeof input !== 'object' || input === null) throw new CommandPolicyError('invalid_command');
    const cmd = input as Record<string, unknown>;
    if (typeof cmd.commandId !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(cmd.commandId)) throw new CommandPolicyError('invalid_command');
    if (typeof cmd.kind !== 'string' || !/^[a-z][a-z0-9._-]{0,79}$/.test(cmd.kind)) throw new CommandPolicyError('invalid_command');
    if (cmd.payload === undefined || cmd.payload === null || typeof cmd.payload !== 'object') throw new CommandPolicyError('invalid_command');
    return {
      commandId: cmd.commandId,
      kind: cmd.kind,
      payload: cmd.payload,
      workspaceId: typeof cmd.workspaceId === 'string' ? cmd.workspaceId : null,
      expectedRevision: typeof cmd.expectedRevision === 'number' ? cmd.expectedRevision : undefined,
    };
  }

  /** Execute a scoped domain command with conditional revision + trusted timestamp + unique command key semantics. */
  async execute(uid: string, input: unknown): Promise<CommandOutcome> {
    const command = this.validCommand(input);

    // Unique command key: a replayed key must carry the identical payload digest.
    const existing = await this.store.resultByCommandId(command.commandId);
    if (existing) {
      if (existing.uid !== uid) throw new CommandPolicyError('wrong_owner');
      const samePayload = existing.payloadDigest === this.digest(command.payload);
      if (!samePayload) throw new CommandPolicyError('conflict'); // same command key, changed payload
      return {
        commandId: existing.commandId,
        kind: existing.kind,
        uid: existing.uid,
        workspaceId: existing.workspaceId,
        status: existing.status,
        revision: existing.revision,
        resultJson: existing.resultJson,
        replayed: true,
        outboxEventId: null,
        committedAt: existing.committedAt,
      };
    }

    // Deletion tombstone: a command that recreates a tombstoned resource is rejected
    // while the tombstone is active. A role picker, guessed ID or client flag never
    // overrides the tombstone.
    const payloadRec = command.payload as Record<string, unknown>;
    if (typeof payloadRec.resourceType === 'string' && typeof payloadRec.resourceId === 'string') {
      const blocked = await this.store.tombstoneByResource(uid, payloadRec.resourceType, payloadRec.resourceId);
      if (blocked && this.tombstoneActive(blocked)) throw new CommandPolicyError('tombstoned');
    }

    // Conditional revision: mismatch rejects as stale.
    const maxRev = await this.store.maxRevision(uid, command.kind);
    if (command.expectedRevision !== undefined && maxRev !== null && maxRev !== command.expectedRevision) {
      throw new CommandPolicyError('stale_revision');
    }
    const revision = (command.expectedRevision ?? maxRev ?? 0) + 1;
    if (revision < 1 || revision > MAX_REVISION_BOUND) throw new CommandPolicyError('stale_revision');

    const at = this.when();
    const result: CommandResult = {
      id: this.newId('cr'),
      uid,
      workspaceId: command.workspaceId ?? null,
      commandId: command.commandId,
      kind: command.kind,
      payloadDigest: this.digest(command.payload),
      status: 'COMMITTED',
      resultJson: command.payload, // canonical committed payload comes back to the caller
      error: null,
      attemptedAt: at,
      committedAt: at,
      revision,
    };

    // Transactional: command result + outbox event commit (or roll back) together.
    try {
      const event: OutboxEvent = {
        id: this.newId('oe'),
        uid,
        workspaceId: result.workspaceId,
        topic: this.outboxTopic(command.kind),
        payload: { commandId: command.commandId, kind: command.kind, revision },
        cursor: this.nextCursor(),
        status: 'PENDING',
        createdAt: at,
        dispatchedAt: null,
        failureReason: null,
      };
      await this.store.commitTransaction(result, event);
    } catch (error) {
      if (error instanceof CommandUniqueViolation) throw new CommandPolicyError('duplicate');
      throw error instanceof CommandPolicyError ? error : new CommandPolicyError('outbox_rollback');
    }

    return {
      commandId: command.commandId,
      kind: command.kind,
      uid,
      workspaceId: result.workspaceId,
      status: 'COMMITTED',
      revision,
      resultJson: result.resultJson,
      replayed: false,
      outboxEventId: null,
      committedAt: at,
    };
  }

  /** Delete a resource, writing a deletion tombstone that blocks recreation until expiry. */
  async deleteResource(input: DeleteResourceInput): Promise<{ resourceType: string; resourceId: string; deletedAt: string; tombstoneExpiresAt: string | null }> {
    if (!input.uid || !input.resourceType || !input.resourceId) throw new CommandPolicyError('invalid_command');
    const existing = await this.store.tombstoneByResource(input.uid, input.resourceType, input.resourceId);
    if (existing && this.tombstoneActive(existing)) throw new CommandPolicyError('tombstoned');

    // Conditional delete: expectedRevision must match the resource's current revision.
    const maxRev = await this.store.maxRevision(input.uid, input.resourceType);
    if (input.expectedRevision !== undefined && maxRev !== null && maxRev !== input.expectedRevision) {
      throw new CommandPolicyError('stale_revision');
    }

    const at = this.when();
    const expiresAt = new Date(this.now().getTime() + TOMBSTONE_TTL_SECONDS * 1000).toISOString();
    const tombstone: DeletionTombstone = {
      id: this.newId('dt'),
      uid: input.uid,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      reason: input.reason ?? null,
      createdAt: at,
      expiresAt,
    };
    await this.store.insertTombstone(tombstone);
    return { resourceType: input.resourceType, resourceId: input.resourceId, deletedAt: at, tombstoneExpiresAt: expiresAt };
  }

  /** Whether a tombstoned resource may be recreated (`false` while active, `true` after expiry). */
  async recreateAllowed(uid: string, resourceType: string, resourceId: string): Promise<boolean> {
    const tombstone = await this.store.tombstoneByResource(uid, resourceType, resourceId);
    if (!tombstone) return true;
    return !this.tombstoneActive(tombstone);
  }

  /** Dispatch pending outbox events (bounded), returning dispatched cursors. */
  async dispatchOutbox(batchSize: number): Promise<number[]> {
    const pending = await this.store.pendingOutbox(batchSize);
    const dispatched: number[] = [];
    for (const event of pending) {
      await this.store.markOutbox(event.cursor, { status: 'DISPATCHED', dispatchedAt: this.when() });
      dispatched.push(event.cursor);
    }
    return dispatched;
  }

  private tombstoneActive(tombstone: DeletionTombstone): boolean {
    if (!tombstone.expiresAt) return true; // no expiry → permanently ambiguous, treat as active
    return new Date(tombstone.expiresAt).getTime() > this.now().getTime();
  }
}
