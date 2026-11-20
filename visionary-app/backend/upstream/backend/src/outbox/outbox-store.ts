// JOB-01 — outbox/job store contract + in-memory synthetic implementation.
// The Cloud SQL adapter implements the same surface over the DATA-01
// outbox_events / job_attempts tables. Durable cursor + acked state lets
// the enabler reproduce commit/dispatch/ack crash recovery without a live DB.
//
// Review rework (10582): the owning store now owns the ATOMIC DUE CLAIM.
// claimDueOutbox transitions a due row PENDING/DISPATCHED -> DISPATCHED with
// attempts+1 and a recovery lease in one mutation, so two concurrent dispatch
// polls can never claim the same event, and a poll before nextAttemptAt can
// never touch the row. Only the current claim can settle the event.
import type { BackoffPolicy, Job, JobState, OutboxEvent, OutboxStatus } from './outbox-types';
import { DEFAULT_BACKOFF } from './outbox-types';

type OutboxSettlement = Pick<OutboxEvent, 'nextAttemptAt' | 'lastError'> & {
  status: Exclude<OutboxStatus, 'DISPATCHED'>;
};

type JobSettlement = Pick<Job, 'completedAt' | 'lastError'> & {
  state: 'PENDING' | 'DONE' | 'FAILED';
};

export interface OutboxStore {
  // ---- outbox_events ----
  appendOutbox(event: OutboxEvent): Promise<void>;
  outboxByCursor(cursor: number): Promise<OutboxEvent | null>;
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
   * Mark up to limit due, exhausted rows FAILED in the owning store.
   */
  quarantineDueOutbox(limit: number, now: Date, maxAttempts: number): Promise<OutboxEvent[]>;
  /**
   * Settle only the current DISPATCHED attempt. A stale dispatcher must
   * leave a newer claim or terminal state untouched.
   */
  settleOutbox(cursor: number, attempt: number, settlement: OutboxSettlement): Promise<OutboxEvent | null>;
  // ---- jobs ----
  createJob(job: Job): Promise<void>;
  jobById(id: string): Promise<Job | null>;
  jobsInQueue(queue: string): Promise<Job[]>;
  claimJob(id: string, options: { hasHandler: boolean; cancelToken?: string }): Promise<Job | null>;
  settleJob(id: string, attempt: number, settlement: JobSettlement): Promise<void>;
  cancelJob(id: string, cancelToken: string): Promise<void>;
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

  async appendOutbox(event: OutboxEvent): Promise<void> {
    if (this.crashOnAppend) throw new Error('SIMULATED_CRASH: append lost in commit');
    if (this.outbox.has(event.cursor)) throw new Error('OUTBOX_CURSOR_ALREADY_EXISTS');
    this.outbox.set(event.cursor, event);
  }
  async outboxByCursor(cursor: number): Promise<OutboxEvent | null> { return this.outbox.get(cursor) ?? null; }

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

  async quarantineDueOutbox(limit: number, now: Date, maxAttempts: number): Promise<OutboxEvent[]> {
    const due = [...this.outbox.values()]
      .filter((event) => event.attempts >= maxAttempts && this.due(event, now))
      .sort((left, right) => left.cursor - right.cursor)
      .slice(0, limit);
    return due.map((event) => {
      const next: OutboxEvent = { ...event, status: 'FAILED', nextAttemptAt: null, lastError: 'MAX_ATTEMPTS_REACHED' };
      this.outbox.set(next.cursor, next);
      return next;
    });
  }

  async settleOutbox(cursor: number, attempt: number, settlement: OutboxSettlement): Promise<OutboxEvent | null> {
    const cur = this.outbox.get(cursor);
    if (!cur || cur.status !== 'DISPATCHED' || cur.attempts !== attempt) return null;
    if (settlement.status === 'DONE' && this.failDispatchAfterWrite) {
      throw new Error('SIMULATED_CRASH: dispatch ack not committed');
    }
    const next = { ...cur, ...settlement };
    this.outbox.set(cursor, next);
    return next;
  }

  async createJob(job: Job): Promise<void> { this.jobs.set(job.id, job); }
  async jobById(id: string): Promise<Job | null> { return this.jobs.get(id) ?? null; }
  async jobsInQueue(queue: string): Promise<Job[]> { return [...this.jobs.values()].filter((j) => j.queue === queue); }
  async claimJob(id: string, { hasHandler, cancelToken }: { hasHandler: boolean; cancelToken?: string }): Promise<Job | null> {
    const current = this.jobs.get(id);
    if (!current || current.state !== 'PENDING' ||
        (current.cancellationToken && current.cancellationToken !== cancelToken)) return null;
    if (!hasHandler) {
      this.jobs.set(id, { ...current, lastError: 'NO_JOB_HANDLER' });
      return null;
    }
    if (current.attempt >= current.maxAttempts) {
      this.jobs.set(id, { ...current, state: 'FAILED', lastError: 'MAX_ATTEMPTS_REACHED' });
      return null;
    }
    const claimed: Job = { ...current, state: 'RUNNING', attempt: current.attempt + 1, lastError: null };
    this.jobs.set(id, claimed);
    return claimed;
  }
  async settleJob(id: string, attempt: number, settlement: JobSettlement): Promise<void> {
    const current = this.jobs.get(id);
    if (!current || current.state !== 'RUNNING' || current.attempt !== attempt) return;
    this.jobs.set(id, { ...current, ...settlement });
  }
  async cancelJob(id: string, cancelToken: string): Promise<void> {
    const current = this.jobs.get(id);
    if (!current || current.state === 'DONE' || current.state === 'FAILED' || current.state === 'CANCELLED') return;
    this.jobs.set(id, { ...current, state: 'CANCELLED', cancellationToken: cancelToken });
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
