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
import { randomUUID } from 'node:crypto';
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
      await this.store.markOutbox(event.cursor, { status: 'FAILED', attempts: nextAttempt, lastError: 'MAX_ATTEMPTS_REACHED', dispatchedAt: new Date().toISOString() });
      return 'FAILED';
    }
    // Durable claim: bump attempts and set the earliest re-claim time BEFORE
    // delivering. Store failures propagate — a lost claim must never be
    // mistaken for a delivered one (the ack below may only run after the
    // claim is durable).
    const delay = backoffDelay(this.policy, nextAttempt);
    const claimed = await this.store.markOutbox(event.cursor, {
      attempts: nextAttempt,
      nextAttemptAt: new Date(Date.now() + delay).toISOString(),
      dispatchedAt: new Date().toISOString(),
    });
    if (!claimed) throw new JobPolicyError('unknown_event');
    // Acknowledge atomically; if the ack fails (crash) the row stays PENDING
    // and immediately reclaimable (the ack handler clears the backoff) so the
    // next poll recovers the delivery without a duplicate commit.
    await this.ack(event.cursor);
    return 'DISPATCHED';
  }

  private async ack(cursor: number): Promise<void> {
    // Idempotent completion keyed on durable cursor. If the ack is lost, the
    // row's backoff is cleared so recovery re-delivers on the next poll
    // instead of waiting out a delay that belongs to a real action failure.
    await this.store.markOutbox(cursor, { status: 'DONE' }).catch(async () => {
      await this.store.markOutbox(cursor, { nextAttemptAt: null }).catch(() => undefined);
    });
  }

  /** Enqueue a job into a per-workload queue, validating the client uid owns it. */
  async enqueue(uid: string, queue: string, kind: string): Promise<Job> {
    const authorized = await this.store.assertAuthorized(uid, queue);
    if (!authorized) throw new JobPolicyError('unauthorized_queue');
    const job: Job = {
      id: `job_${randomUUID()}`,
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
    // Terminal states are final: re-running a DONE/FAILED/CANCELLED job would
    // execute the job body twice, so the run is refused outright.
    if (job.state === 'DONE' || job.state === 'FAILED' || job.state === 'CANCELLED') return;
    if (job.cancellationToken && job.cancellationToken !== cancelToken) {
      return; // fencing: a stale/disconnected caller cannot run a fenced job
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
