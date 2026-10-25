// JOB-01/JOB-02 — owning-store outbox dispatch and durable job delivery.
//
// Mirrors the DATA-01 outbox_events / command_results shape so the enabler maps
// 1:1 onto Prisma rows at integration. Covers: owning-store outbox dispatch,
// private authenticated task delivery shims, per-workload queues, bounded
// retry/backoff, idempotent completion, recovery after commit/dispatch/ack
// crashes (JOB-01), plus leases, attempt fencing, deadlines, cancellation,
// quarantine of failed cleanup and a sweeper for orphaned/stuck work (JOB-02).
// A socket/event/lease is never authority on its own; delivery always resolves
// durable owning-store state.

/** Mirrors the DATA-01 OutboxStatus enum. */
export type OutboxStatus = 'PENDING' | 'DISPATCHED' | 'FAILED' | 'DONE';

/** Mirrors the DATA-01 command_results job state; extended for lease/fencing. */
export type JobState =
  | 'PENDING'
  | 'CLAIMED' // one worker holds an unexpired lease
  | 'RUNNING'
  | 'DONE'
  | 'FAILED'
  | 'CANCELLED'
  | 'QUARANTINED'; // failed cleanup or past ceiling; never silently dropped

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

/**
 * A delivered job. JOB-02 adds the durable lease/fencing fields:
 * - `leaseToken` + `claimedUntil`: a job is only run by the worker holding the
 *   current lease token, and only while the lease is unexpired. A stale worker
 *   (expired lease, replaced token, or cancellation) cannot mutate the job.
 * - `attempt` + `attemptToken`: every attempt earns a new token; idempotent
 *   completion is keyed on (id, attemptToken) so a duplicated ack can never
 *   complete a job twice. The attempt counter is advanced by fail()/sweep.
 * - `runBy`: hard deadline; a job still un-DONE after `runBy` is reclaimed by
 *   the sweeper, not executed.
 * - `cleanupAttempts` + `cleanupError`: failed post-run cleanup is retried a
 *   bounded number of times and then quarantined, never silently dropped.
 */
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
  /** Lease ownership + expiry for fencing. */
  claimedUntil: string | null;
  leaseToken: string | null;
  /** Idempotency key for this attempt's completion. */
  attemptToken: string | null;
  /** Number of failed post-run cleanup attempts so far. */
  cleanupAttempts: number;
  cleanupError: string | null;
  /** Hard deadline; past it the sweeper reclaims (does not run) the job. */
  runBy: string | null;
  completedAt: string | null;
  cancellationToken: string | null;
  lastError: string | null;
  nextAttemptAt: string | null;
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

/** Lease policy: how long a worker may hold a job before the sweeper reclaims it. */
export interface LeasePolicy {
  /** Default lease duration (ms) for `claim` when none is supplied. */
  leaseMs: number;
  /** Max number of post-run cleanup attempts before quarantine. */
  maxCleanupAttempts: number;
}

export const DEFAULT_BACKOFF: BackoffPolicy = { maxAttempts: 5, baseDelayMs: 200, multiplier: 2, maxDelayMs: 60_000 };

export const DEFAULT_LEASE: LeasePolicy = { leaseMs: 30_000, maxCleanupAttempts: 3 };
