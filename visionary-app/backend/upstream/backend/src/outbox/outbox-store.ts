// JOB-01 — outbox/job store contract + in-memory synthetic implementation.
// The Cloud SQL adapter implements the same surface over the DATA-01
// outbox_events / job_attempts tables. Durable cursor + facsimacked state lets
// the enabler reproduce commit/dispatch/ack crash recovery without a live DB.
import type { BackoffPolicy, Job, JobState, OutboxEvent, OutboxStatus } from './outbox-types';
import { DEFAULT_BACKOFF } from './outbox-types';

export interface OutboxStore {
  // ---- outbox_events ----
  appendOutbox(event: OutboxEvent): Promise<void>;
  pendingOutbox(limit: number): Promise<OutboxEvent[]>;
  outboxByCursor(cursor: number): Promise<OutboxEvent | null>;
  markOutbox(cursor: number, patch: Partial<Pick<OutboxEvent, 'status' | 'dispatchedAt' | 'attempts' | 'nextAttemptAt' | 'lastError'>>): Promise<OutboxEvent | null>;
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
  /** Simulate an ack crash: the dispatch claim applied, but the DONE ack is lost. */
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
    // Ack crash: the claim write is durable, but the DONE marker is lost before the ack commits.
    if (this.failDispatchAfterWrite && patch.status === 'DONE') throw new Error('SIMULATED_CRASH: dispatch ack not committed');
    const next = { ...cur, ...patch };
    this.outbox.set(cursor, next);
    return next;
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
