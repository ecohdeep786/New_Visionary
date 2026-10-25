// JOB-01 — owning-store outbox dispatch and durable job delivery.
//
// Mirrors the DATA-01 outbox_events / command_results shape so the enabler maps
// 1:1 onto Prisma rows at integration. Covers: owning-store outbox dispatch,
// private authenticated task delivery shims, per-workload queues, bounded
// retry/backoff, idempotent completion, and recovery after commit/dispatch/ack
// crashes. A socket/event is never authority on its own; delivery always
// resolves durable owning-store state.

/** Mirrors the DATA-01 OutboxStatus enum. */
export type OutboxStatus = 'PENDING' | 'DISPATCHED' | 'FAILED' | 'DONE';

export type JobState = 'PENDING' | 'CLAIMED' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED';

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
  /** Bounded, non-negative delivery attempts (0 = never dispatched). */
  attempts: number;
  nextAttemptAt: string | null;
  lastError: string | null;
}

export interface Job {
  id: string;
  uid: string;
  workspaceId: string | null;
  queue: string; // per-workload queue name
  kind: string;
  state: JobState;
  attempt: number;
  maxAttempts: number;
  createdAt: string;
  claimedUntil: string | null;
  completedAt: string | null;
  cancellationToken: string | null;
  lastError: string | null;
}

/** Bounded retry/backoff policy (per-workload). */
export interface BackoffPolicy {
  /** Max attempts per job/event before it is quarantined. */
  maxAttempts: number;
  /** Base delay (ms) for the first retry; grows with backoffExponent. */
  baseDelayMs: number;
  /** Exponential growth factor: delay = base * multiplier^(attempt-1). */
  multiplier: number;
  /** Hard ceiling on any single delay (ms). */
  maxDelayMs: number;
}

export const DEFAULT_BACKOFF: BackoffPolicy = { maxAttempts: 5, baseDelayMs: 200, multiplier: 2, maxDelayMs: 60_000 };
