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
import type { BackoffPolicy, Job, JobState, OutboxCursor, OutboxEvent, OutboxStatus } from './outbox-types';
import { DEFAULT_BACKOFF, outboxCursorKey } from './outbox-types';

export type OutboxSettlement = Pick<OutboxEvent, 'nextAttemptAt' | 'lastError'> & {
  status: Exclude<OutboxStatus, 'DISPATCHED'>;
};

export type JobPatch = Partial<Pick<Job, 'state' | 'attempt' | 'claimedUntil' | 'leaseToken' | 'attemptToken' |
  'nextAttemptAt' | 'completedAt' | 'cancellationToken' | 'lastError' | 'cleanupAttempts' | 'cleanupError'>>;

export interface OutboxDeliveryStore {
  outboxByCursor(cursor: OutboxCursor): Promise<OutboxEvent | null>;
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
  settleOutbox(cursor: OutboxCursor, attempt: number, settlement: OutboxSettlement): Promise<OutboxEvent | null>;
}

export interface JobStore {
  clock(): Promise<Date>;
  createJob(job: Job): Promise<void>;
  jobById(id: string): Promise<Job | null>;
  jobsInQueue(queue: string): Promise<Job[]>;
  /** Replace only the exact revision used to authorize a state change. */
  compareJob(id: string, revision: number, patch: JobPatch, validUntil?: string | null, fair?: boolean): Promise<Job | null>;
  nextReadyJob?(): Promise<string | null>;
  dueJobs(now: Date, limit: number): Promise<Job[]>;
  /** Per-workload queues that hold runnable jobs. */
  queues(): Promise<string[]>;
  /** Client-supplied uid and queue must align with the owning store (server-side). */
  assertAuthorized(uid: string, queue: string): Promise<boolean>;
}

export interface OutboxStore extends OutboxDeliveryStore, JobStore {
  appendOutbox(event: OutboxEvent): Promise<void>;
}

export function ownsJobQueue(uid: string, queue: string): boolean {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) return false;
  if (queue.startsWith('global:')) return queue === `global:${uid}`;
  return queue.startsWith(`${uid}:`) && /^[a-zA-Z0-9_-]{1,80}$/.test(queue.slice(uid.length + 1));
}

export class InMemoryOutboxStore implements OutboxStore {
  readonly outbox = new Map<bigint, OutboxEvent>();
  private readonly jobs = new Map<string, Job>();
  /** Simulate an ack crash: the delivery ran, but the DONE ack is lost. */
  failDispatchAfterWrite = false;
  crashOnAppend = false;

  async appendOutbox(event: OutboxEvent): Promise<void> {
    if (this.crashOnAppend) throw new Error('SIMULATED_CRASH: append lost in commit');
    const cursor = outboxCursorKey(event.cursor);
    if (this.outbox.has(cursor)) throw new Error('OUTBOX_CURSOR_ALREADY_EXISTS');
    this.outbox.set(cursor, event);
  }
  async outboxByCursor(cursor: OutboxCursor): Promise<OutboxEvent | null> { return this.outbox.get(outboxCursorKey(cursor)) ?? null; }

  private orderedOutbox(): OutboxEvent[] {
    return [...this.outbox.values()].sort((left, right) => left.cursor < right.cursor ? -1 : left.cursor > right.cursor ? 1 : 0);
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
    for (const e of this.orderedOutbox()) {
      if (claimed.length >= limit) break;
      if (!this.due(e, now) || e.attempts >= maxAttempts) continue;
      const next: OutboxEvent = {
        ...e,
        status: 'DISPATCHED',
        attempts: e.attempts + 1,
        nextAttemptAt: new Date(now.getTime() + leaseMs).toISOString(),
        dispatchedAt: now.toISOString(),
      };
      this.outbox.set(outboxCursorKey(next.cursor), next);
      claimed.push(next);
    }
    return claimed;
  }

  async quarantineDueOutbox(limit: number, now: Date, maxAttempts: number): Promise<OutboxEvent[]> {
    const due = this.orderedOutbox()
      .filter((event) => event.attempts >= maxAttempts && this.due(event, now))
      .slice(0, limit);
    return due.map((event) => {
      const next: OutboxEvent = { ...event, status: 'FAILED', nextAttemptAt: null, lastError: 'MAX_ATTEMPTS_REACHED' };
      this.outbox.set(outboxCursorKey(next.cursor), next);
      return next;
    });
  }

  async settleOutbox(cursor: OutboxCursor, attempt: number, settlement: OutboxSettlement): Promise<OutboxEvent | null> {
    const key = outboxCursorKey(cursor);
    const cur = this.outbox.get(key);
    if (!cur || cur.status !== 'DISPATCHED' || cur.attempts !== attempt) return null;
    if (settlement.status === 'DONE' && this.failDispatchAfterWrite) {
      throw new Error('SIMULATED_CRASH: dispatch ack not committed');
    }
    const next = { ...cur, ...settlement };
    this.outbox.set(key, next);
    return next;
  }

  async createJob(job: Job): Promise<void> {
    if (this.jobs.has(job.id)) throw Error('JOB_ID_ALREADY_EXISTS');
    this.jobs.set(job.id, { ...job });
  }
  async clock(): Promise<Date> { return new Date(); }
  async jobById(id: string): Promise<Job | null> {
    const job = this.jobs.get(id);
    return job ? { ...job } : null;
  }
  async jobsInQueue(queue: string): Promise<Job[]> {
    return [...this.jobs.values()].filter(job => job.queue === queue).map(job => ({ ...job }));
  }
  async compareJob(id: string, revision: number, patch: JobPatch): Promise<Job | null> {
    const current = this.jobs.get(id);
    if (!current || current.revision !== revision) return null;
    const updated = { ...current, ...patch, revision: revision + 1 };
    this.jobs.set(id, updated);
    return { ...updated };
  }
  async dueJobs(now: Date, limit: number): Promise<Job[]> {
    return [...this.jobs.values()].filter(job => {
      if (!['PENDING', 'CLAIMED', 'RUNNING'].includes(job.state)) return false;
      return Boolean(job.runBy && Date.parse(job.runBy) <= now.getTime()) ||
        (job.state !== 'PENDING' && Boolean(job.claimedUntil && Date.parse(job.claimedUntil) <= now.getTime()));
    }).slice(0, limit).map(job => ({ ...job }));
  }
  async queues(): Promise<string[]> {
    return [...new Set([...this.jobs.values()].map((j) => j.queue))];
  }
  async assertAuthorized(uid: string, queue: string): Promise<boolean> {
    // Server-side rule: a queue name is only valid when it carries the owning
    // editorial uid namespace. This is the enabler's authority shim.
    return ownsJobQueue(uid, queue);
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
