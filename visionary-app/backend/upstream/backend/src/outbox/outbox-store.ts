// JOB-01/JOB-02 — outbox/job store contract + in-memory synthetic implementation.
// The Cloud SQL adapter implements the same surface over the DATA-01
// outbox_events / command_results rows. Durable cursor, lease ownership and
// attempt tokens let the enabler reproduce commit/dispatch/ack crash recovery
// and lease/fencing/sweeper behavior without a live DB.
import type { BackoffPolicy, Job, JobState, OutboxEvent, OutboxStatus } from './outbox-types';
import { DEFAULT_BACKOFF } from './outbox-types';

/** Outcome of a fenced/conditional state transition. */
export type JobWriteResult =
  | { ok: true; job: Job }
  | { ok: false; reason: 'not_found' | 'conflict' | 'fenced' };

/** Patchable job fields (all durable store columns the enabler may set). */
export type JobPatch = Partial<
  Pick<Job, 'state' | 'attempt' | 'claimedUntil' | 'leaseToken' | 'attemptToken' | 'cleanupAttempts' | 'cleanupError' | 'runBy' | 'completedAt' | 'cancellationToken' | 'lastError' | 'nextAttemptAt'>
>;

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
  updateJob(id: string, patch: JobPatch): Promise<Job | null>;
  /**
   * Fenced, conditional transition. Applies `patch` only when the row's current
   * state is in `from` AND its lease token matches `expectedToken` (when
   * non-null). This is the single enforcement point for attempt fencing: a stale
   * worker whose token no longer matches cannot mutably complete a job.
   */
  transition(id: string, from: JobState[], expectedToken: string | null, patch: JobPatch): Promise<JobWriteResult>;
  /** Jobs in specific states (sweeper scan for orphaned stuck work). */
  jobsInStates(states: JobState[]): Promise<Job[]>;
  /** Jobs whose lease expired before `nowIso` (stuck runners to reclaim). */
  staleClaimedJobs(nowIso: string): Promise<Job[]>;
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
  async updateJob(id: string, patch: JobPatch): Promise<Job | null> {
    const cur = this.jobs.get(id);
    if (!cur) return null;
    const next = { ...cur, ...patch } as Job;
    this.jobs.set(id, next);
    return next;
  }
  async transition(id: string, from: JobState[], expectedToken: string | null, patch: JobPatch): Promise<JobWriteResult> {
    const cur = this.jobs.get(id);
    if (!cur) return { ok: false, reason: 'not_found' };
    if (!from.includes(cur.state)) return { ok: false, reason: 'conflict' };
    if (expectedToken !== null && cur.leaseToken !== expectedToken) return { ok: false, reason: 'fenced' };
    const next = { ...cur, ...patch } as Job;
    this.jobs.set(id, next);
    return { ok: true, job: next };
  }
  async jobsInStates(states: JobState[]): Promise<Job[]> {
    return [...this.jobs.values()].filter((j) => states.includes(j.state));
  }
  async staleClaimedJobs(nowIso: string): Promise<Job[]> {
    const now = Date.parse(nowIso);
    return [...this.jobs.values()].filter(
      (j) => (j.state === 'CLAIMED' || j.state === 'RUNNING') && j.claimedUntil !== null && Date.parse(j.claimedUntil) < now,
    );
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
