// DATA-06 — scoped command results, conditional revisions, trusted timestamps,
// unique constraints, transactional outbox and deletion tombstones.
//
// These shapes mirror the DATA-01 DDL (KAN-36) command_results / outbox_events /
// deletion_tombstones tables so the enabler maps 1:1 onto Prisma rows at
// integration. Every timestamp is server-derived inside the service; a client
// cannot inject a clock value.

/** Mirrors the DATA-01 CommandStatus enum. */
export type CommandStatus = 'PENDING' | 'COMMITTED' | 'FAILED' | 'DUPLICATE' | 'CONFLICT';

/** Mirrors the DATA-01 OutboxStatus enum. */
export type OutboxStatus = 'PENDING' | 'DISPATCHED' | 'FAILED';

/** Mirrors the DATA-01 AuditOutcome enum. */
export type AuditOutcome = 'SUCCESS' | 'DENIED' | 'FAILED';

/** A committed (or failed/rejected) domain command result, scoped to a uid. */
export interface CommandResult {
  id: string;
  uid: string;
  workspaceId: string | null;
  commandId: string;
  kind: string;
  payloadDigest: string;
  status: CommandStatus;
  resultJson: unknown;
  error: string | null;
  attemptedAt: string;
  committedAt: string | null;
  revision: number;
}

/** A durable outbox event produced inside the same transaction as a command result. */
export interface OutboxEvent {
  id: string;
  uid: string;
  workspaceId: string | null;
  topic: string;
  payload: unknown;
  cursor: number;
  status: OutboxStatus;
  createdAt: string;
  dispatchedAt: string | null;
  failureReason: string | null;
}

/** A deletion tombstone that blocks recreate/ghost rows until it expires. */
export interface DeletionTombstone {
  id: string;
  uid: string;
  resourceType: string;
  resourceId: string;
  reason: string | null;
  createdAt: string;
  expiresAt: string | null;
}

/**
 * A command input from a server-verified actor. `expectedRevision` makes a
 * commit conditional: a mismatched store revision is rejected. Timestamps are
 * never accepted from the client — server now() is the only clock.
 */
export interface DomainCommand {
  /** Stable unique command key. Reusing a key with a changed payload is rejected. */
  commandId: string;
  /** Command kind, e.g. 'provision.personal' | 'invite.accept' | 'consent.grant'. */
  kind: string;
  payload: unknown;
  workspaceId?: string | null;
  /** Optimistic concurrency: require the store revision to equal this. */
  expectedRevision?: number;
}

export interface CommandOutcome {
  commandId: string;
  kind: string;
  uid: string;
  workspaceId: string | null;
  status: CommandStatus;
  revision: number;
  resultJson: unknown;
  replayed: boolean;
  outboxEventId: string | null;
  committedAt: string | null;
}
