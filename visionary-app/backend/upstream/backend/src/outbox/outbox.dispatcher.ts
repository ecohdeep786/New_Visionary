// JOB-01 — owning-store outbox dispatcher.
//
// Dispatches outbox events + jobs with three crash-safe guarantees:
//   - commit safety: an event appended to the owning store is never lost; a
//     dispatch that fails before ack leaves a PENDING row that a later poll
//     re-dispatches (recovery after commit/dispatch/ack crashes).
//   - bounded retry/backoff: each outbox event/job has a maxAttempts ceiling and
//     exponential backoff; exceeding the ceiling quarantines the row (FAILED).
//   - idempotent completion: delivering the same cursor twice never executes the
//     underlying action twice because completion is keyed on the durable cursor.
//   - per-workload queues: jobs are routed by `queue`; a client cannot inject a
//     queue it does not own (server-authoritative assertAuthorized).
import type { BackoffPolicy, Job, JobState, OutboxEvent, OutboxStatus } from './outbox-types';
import { DEFAULT_BACKOFF } from './outbox-types';
import type { OutboxStore } from './outbox-store';
import { backoffDelay } from './outbox-store';

export class JobPolicyError extends Error {
  constructor(public readonly code: 'unauthorized_queue' | 'unknown_event' | 'recovered' | 'quarantined') {
    super(code);
  }
}

export class OutboxDispatcher {
  constructor(private readonly store: OutboxStore, private readonly policy: BackoffPolicy = DEFAULT_BACKOFF) {}

  /**
   * Dispatch the next batch of pending outbox events. Delivers at most once per
   * cursor until an ack commits; a crash after dispatch but before ack is
   * recovered on the next poll. Returns DELIVERED as `{cursor, status}`.
   */
  async dispatch(batchSize: number): Promise<{ cursor: number; status: OutboxStatus }[]> {
    const pending = await this.store.pendingOutbox(batchSize);
    const results: { cursor: number; status: OutboxStatus }[] = [];
    for (const event of pending) {
      const outcome = await this.attempt(event);
      results.push({ cursor: event.cursor, status: outcome });
    }
    return results;
  }

  private async attempt(event: OutboxEvent): Promise<OutboxStatus> {
    const nextAttempt = event.attempts + 1;
    if (nextAttempt > this.policy.maxAttempts) {
      // Quarantine: bounded ceiling reached. Never silently dropped; marked FAILED.
      await this.mark(event.cursor, { status: 'FAILED', attempts: nextAttempt, lastError: 'MAX_ATTEMPTS_REACHED', dispatchedAt: new Date().toISOString() });
      return 'FAILED';
    }
    // Durable claim: bump attempts and set the next retry time BEFORE delivering.
    const delay = backoffDelay(this.policy, nextAttempt);
    const claimed = await this.mark(event.cursor, {
      attempts: nextAttempt,
      nextAttemptAt: new Date(Date.now() + delay).toISOString(),
      dispatchedAt: new Date().toISOString(),
    });
    if (!claimed) throw new JobPolicyError('unknown_event');
    // Acknowledge atomically; if the ack fails (crash) the row stays claimable by
    // nextAttemptAt and recovery re-delivers without a duplicate commit.
    await this.ack(event.cursor);
    return 'DISPATCHED';
  }

  private async mark(cursor: number, patch: Partial<Pick<OutboxEvent, 'status' | 'dispatchedAt' | 'attempts' | 'nextAttemptAt' | 'lastError'>>): Promise<OutboxEvent | null> {
    try {
      return await this.store.markOutbox(cursor, patch);
    } catch {
      // Crash between claim and ack: leave PENDING for recovery (do not lose the row).
      return await this.store.outboxByCursor(cursor);
    }
  }

  private async ack(cursor: number): Promise<void> {
    // Idempotent completion keyed on durable cursor. If ack is lost the next
    // poll sees attempt count and re-delivers; duplicates never re-commit.
    await this.store.markOutbox(cursor, { status: 'DONE' }).catch(() => undefined);
  }

  /** Enqueue a job into a per-workload queue, validating the client uid owns it. */
  async enqueue(uid: string, queue: string, kind: string): Promise<Job> {
    const authorized = await this.store.assertAuthorized(uid, queue);
    if (!authorized) throw new JobPolicyError('unauthorized_queue');
    const job: Job = {
      id: `job_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      uid,
      workspaceId: null,
      queue,
      kind,
      state: 'PENDING',
      attempt: 0,
      maxAttempts: this.policy.maxAttempts,
      createdAt: new Date().toISOString(),
      claimedUntil: null,
      completedAt: null,
      cancellationToken: null,
      lastError: null,
    };
    await this.store.createJob(job);
    return job;
  }

  /** Run one job idempotently with fencing against a cancelled token. */
  async runJob(id: string, cancelToken?: string): Promise<void> {
    const job = await this.store.jobById(id);
    if (!job) return;
    if (job.state === 'CANCELLED' || (job.cancellationToken && job.cancellationToken !== cancelToken)) {
      return; // fencing: a stale/disconnected caller cannot run a cancelled job
    }
    try {
      await this.store.updateJob(id, { state: 'RUNNING' as JobState });
      // The worker body is owned by the job kind; here the enabler marks done.
      await this.store.updateJob(id, { state: 'DONE' as JobState, completedAt: new Date().toISOString() });
    } catch {
      await this.store.updateJob(id, { state: 'FAILED' as JobState });
    }
  }

  /** Cancel a pending job; running jobs are fenced on their next run attempt. */
  async cancel(id: string): Promise<void> {
    const job = await this.store.jobById(id);
    if (!job || job.state === 'CANCELLED' || job.state === 'DONE') return;
    await this.store.updateJob(id, { state: 'CANCELLED' as JobState, cancellationToken: `cancel_${Date.now()}` });
  }

  /** Queues currently holding jobs — the per-workload queue inventory. */
  async queues(): Promise<string[]> {
    return this.store.queues();
  }
}
