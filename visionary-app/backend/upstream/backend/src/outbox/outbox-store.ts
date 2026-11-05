// JOB-01 — outbox/job store contract + in-memory synthetic implementation.
// The Cloud SQL adapter implements the same surface over the DATA-01
// outbox_events / job_attempts tables. Durable cursor + acked state lets
// the enabler reproduce commit/dispatch/ack crash recovery without a live DB.
//
// Review rework (10582): the owning store now owns the ATOMIC DUE CLAIM.
// claimDueOutbox transitions a due row PENDING/DISPATCHED -> DISPATCHED with
// attempts+1 and a recovery lease in one mutation, so two concurrent dispatch
// polls can never claim the same event, and a poll before nextAttemptAt can
// never touch the row. ackOutbox is the only DONE writer and can fail
// (crash), leaving the row DISPATCHED under its lease for recovery.
import type { BackoffPolicy, Job, JobState, OutboxEvent, OutboxStatus } from './outbox-types';
import { DEFAULT_BACKOFF } from './outbox-types';

export interface OutboxStore {
  // ---- outbox_events ----
  appendOutbox(event: OutboxEvent): Promise<void>;
  pendingOutbox(limit: number): Promise<OutboxEvent[]>;
  outboxByCursor(cursor: number): Promise<OutboxEvent | null>;
  markOutbox(cursor: number, patch: Partial<Pick<OutboxEvent, 'status' | 'dispatchedAt' | 'attempts' | 'nextAttemptAt' | 'lastError'>>): Promise<OutboxEvent | null>;
  /**
   * Atomic due claim. Selects rows that are (PENDING or DISPATCHED) and due
   * (nextAttemptAt null or <= now) with attempts < maxAttempts, and in ONE
   * mutation marks each DISPATCHED with attempts+1 and a recovery lease
   * (nextAttemptAt = now + leaseMs). A DISPATCHED row past its lease is an
   * ack-crash recovery candidate and is re-claimed exactly like a fresh row.
   * Returns the claimed rows; each is claimed by exactly one caller.
   */
  claimDueOutbox(limit: number, now: Date, maxAttempts: number, leaseMs: number): Promise<OutboxEvent[]>;
  /**
   * Due rows that have burned their attempt ceiling: the dispatcher
   * quarantines these FAILED without claiming them again.
   */
  exhaustedOutbox(now: Date, maxAttempts: number): Promise<OutboxEvent[]>;
  /**
   * The only DONE writer. Fails (throws) on a simulated ack crash; otherwise
   * commits DONE for a row currently DISPATCHED and reports whether the ack
   * committed. A lost ack leaves the row DISPATCHED under its lease.
   */
  ackOutbox(cursor: number, now: Date): Promise<boolean>;
  // ---- jobs ----
  createJob(job: Job): Promise<void>;
  jobById(id: string): Promise<Job | null>;
  jobsInQueue(queue: string): Promise<Job[]>;
  updateJob(id: string, patch: Partial<Pick<Job, 'state' | 'attempt' | 'claimedUntil' | 'completedAt' | 'cancellationToken' | 'lastError'>> & { lastError?: string }): Promise<Job | null>;
  /** Per-workload queues that hold runnable jobs. */
  queues(): Promise<string[]>;
  /** Client-supplied uid and queue must align with the owning store (server-side). */
  assertAuthorized(uid: string, queue: string): Promise<boolean>;
}

export class InMemoryOutboxStore implements OutboxStore {
  readonly outbox = new Map<number, OutboxEvent>();
  readonly jobs = new Map<string, Job>();
  /** Simulate an ack crash: the delivery ran, but the DONE ack is lost. */
  failDispatchAfterWrite = false;
  crashOnAppend = false;

  private nextCursor = 0;

  async appendOutbox(event: OutboxEvent): Promise<void> {
    if (this.crashOnAppend) throw new Error('SIMULATED_CRASH: append lost in commit');
    this.outbox.set(event.cursor, event);
  }
  async pendingOutbox(limit: number): Promise<OutboxEvent[]> {
    return [...this.outbox.values()]
      .filter((e) => e.status === 'PENDING')
      .sort((a, b) => a.cursor - b.cursor)
      .slice(0, limit);
  }
  async outboxByCursor(cursor: number): Promise<OutboxEvent | null> { return this.outbox.get(cursor) ?? null; }
  async markOutbox(cursor: number, patch: Partial<Pick<OutboxEvent, 'status' | 'dispatchedAt' | 'attempts' | 'nextAttemptAt' | 'lastError'>>): Promise<OutboxEvent | null> {
    const cur = this.outbox.get(cursor);
    if (!cur) return null;
    const next = { ...cur, ...patch };
    this.outbox.set(cursor, next);
    return next;
  }

  private due(e: OutboxEvent, now: Date): boolean {
    if (e.status !== 'PENDING' && e.status !== 'DISPATCHED') return false;
    if (!e.nextAttemptAt) return true;
    return Date.parse(e.nextAttemptAt) <= now.getTime();
  }

  async claimDueOutbox(limit: number, now: Date, maxAttempts: number, leaseMs: number): Promise<OutboxEvent[]> {
    // Single synchronous section: JS runs this without interleaving, which is
    // the in-memory stand-in for one SQL UPDATE ... WHERE due RETURNING claim.
    const claimed: OutboxEvent[] = [];
    for (const e of [...this.outbox.values()].sort((a, b) => a.cursor - b.cursor)) {
      if (claimed.length >= limit) break;
      if (!this.due(e, now) || e.attempts >= maxAttempts) continue;
      const next: OutboxEvent = {
        ...e,
        status: 'DISPATCHED',
        attempts: e.attempts + 1,
        nextAttemptAt: new Date(now.getTime() + leaseMs).toISOString(),
        dispatchedAt: now.toISOString(),
      };
      this.outbox.set(next.cursor, next);
      claimed.push(next);
    }
    return claimed;
  }

  async exhaustedOutbox(now: Date, maxAttempts: number): Promise<OutboxEvent[]> {
    return [...this.outbox.values()]
      .filter((e) => (e.status === 'PENDING' || e.status === 'DISPATCHED') && e.attempts >= maxAttempts && this.due(e, now))
      .sort((a, b) => a.cursor - b.cursor);
  }

  async ackOutbox(cursor: number, now: Date): Promise<boolean> {
    // Ack crash: the delivery ran, but the DONE marker is lost before it commits.
    if (this.failDispatchAfterWrite) throw new Error('SIMULATED_CRASH: dispatch ack not committed');
    const cur = this.outbox.get(cursor);
    if (!cur || cur.status !== 'DISPATCHED') return false;
    this.outbox.set(cursor, { ...cur, status: 'DONE', dispatchedAt: now.toISOString() });
    return true;
  }

  async createJob(job: Job): Promise<void> { this.jobs.set(job.id, job); }
  async jobById(id: string): Promise<Job | null> { return this.jobs.get(id) ?? null; }
  async jobsInQueue(queue: string): Promise<Job[]> { return [...this.jobs.values()].filter((j) => j.queue === queue); }
  async updateJob(id: string, patch): Promise<Job | null> {
    const cur = this.jobs.get(id);
    if (!cur) return null;
    const next = { ...cur, ...patch } as Job;
    this.jobs.set(id, next);
    return next;
  }
  async queues(): Promise<string[]> {
    return [...new Set([...this.jobs.values()].map((j) => j.queue))];
  }
  async assertAuthorized(uid: string, queue: string): Promise<boolean> {
    // Server-side rule: a queue name is only valid when it carries the owning
    // editorial uid namespace. This is the enabler's authority shim.
    return queue.startsWith(`${uid}:`) || queue === `global:${uid}`;
  }
}

/** Bounded exponential backoff for one event/job. */
export function backoffDelay(policy: BackoffPolicy, attempt: number): number {
  const exponent = Math.max(0, attempt - 1);
  const base = policy.baseDelayMs * Math.pow(policy.multiplier, exponent);
  return Math.min(policy.maxDelayMs, base);
}

export type { JobState, OutboxStatus };
export { DEFAULT_BACKOFF };
