// JOB-01 — owning-store outbox dispatcher.
//
// Review rework (10582): the dispatcher now REQUIRES confirmed private
// delivery before acknowledgement and reports outcomes honestly.
//   - atomic due claim: claimDueOutbox on the owning store claims each due
//     event exactly once (concurrent polls cannot double-claim; a poll before
//     nextAttemptAt never touches the row and never burns an attempt).
//   - confirmed delivery: the registered topic handler (or the default
//     handler) must resolve before the DONE ack is attempted. An event with
//     no handler is never marked DONE.
//   - attempt fencing: only the current claim can settle the row. A delayed
//     delivery reports the owning store's status after a new claim takes over.
//   - recovery: a lost ack leaves the row DISPATCHED; once its lease expires
//     the next poll re-claims and re-delivers it. Handlers are idempotent per
//     cursor (the consumer dedupes on the durable cursor), so a redelivery
//     never double-commits.
import { randomUUID } from 'node:crypto';
import type { BackoffPolicy, Job, OutboxEvent, OutboxStatus } from './outbox-types';
import { DEFAULT_BACKOFF } from './outbox-types';
import type { OutboxStore } from './outbox-store';
import { backoffDelay } from './outbox-store';

export class JobPolicyError extends Error {
  constructor(public readonly code: 'unauthorized_queue' | 'unknown_event' | 'recovered' | 'quarantined') {
    super(code);
  }
}

/** A private authenticated delivery endpoint for one topic. Handlers MUST be
 * idempotent per event cursor: recovery re-delivers after a lost ack. */
export type DeliveryHandler = (event: OutboxEvent) => Promise<void>;

export interface DispatchOutcome {
  cursor: number;
  /** Durable row status after this dispatch poll. */
  status: OutboxStatus;
  /** Whether the delivery handler confirmed the delivery. */
  delivered: boolean;
}

export interface DispatcherHandlers {
  /** Handler per topic; a topic without one falls back to `default`. */
  topics?: Map<string, DeliveryHandler>;
  /** Fallback delivery endpoint when a topic has no specific handler. */
  default?: DeliveryHandler;
}

export class OutboxDispatcher {
  constructor(
    private readonly store: OutboxStore,
    private readonly handlers: DispatcherHandlers = {},
    private readonly policy: BackoffPolicy = DEFAULT_BACKOFF,
  ) {}

  /**
   * Dispatch one batch of due outbox events. Each event is claimed atomically,
   * delivered through its registered handler, and acknowledged only after the
   * handler confirms. Returns one honest outcome per handled event.
   */
  async dispatch(batchSize: number, now: Date = new Date()): Promise<DispatchOutcome[]> {
    if (!Number.isSafeInteger(batchSize) || batchSize < 1) return [];
    // Quarantine exhausted rows first: they are due but never claimed again.
    const quarantined = await this.store.quarantineDueOutbox(batchSize, now, this.policy.maxAttempts);
    const claimed = await this.store.claimDueOutbox(
      batchSize - quarantined.length, now, this.policy.maxAttempts, this.policy.leaseMs,
    );
    const results: DispatchOutcome[] = quarantined.map(({ cursor, status }) => ({ cursor, status, delivered: false }));
    for (const event of claimed) {
      results.push(await this.deliver(event, now));
    }
    return results;
  }

  private handlerFor(topic: string): DeliveryHandler | undefined {
    return this.handlers.topics?.get(topic) ?? this.handlers.default;
  }

  private async deliver(event: OutboxEvent, now: Date): Promise<DispatchOutcome> {
    const handler = this.handlerFor(event.topic);
    let lastError = handler ? null : 'NO_DELIVERY_HANDLER';
    if (handler) {
      try {
        await handler(event);
      } catch {
        lastError = 'DELIVERY_FAILED';
      }
    }
    const delivered = lastError === null;
    const retry = !delivered && event.attempts < this.policy.maxAttempts;
    const nextAttemptAt = retry
      ? new Date(now.getTime() + backoffDelay(this.policy, event.attempts)).toISOString()
      : null;
    const settled = await this.store.settleOutbox(event.cursor, event.attempts, {
      status: delivered ? 'DONE' : retry ? 'PENDING' : 'FAILED',
      nextAttemptAt,
      lastError,
    }).catch(() => null);
    // A write error can occur before or after commit. Read the current row
    // to distinguish a lost acknowledgement from a successful state change.
    const current = settled ?? await this.store.outboxByCursor(event.cursor);
    if (!current) throw new JobPolicyError('unknown_event');
    return { cursor: event.cursor, status: current.status, delivered };
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

  /**
   * Run one job through its owning handler. A job is never marked DONE
   * without invoking a handler; a cancelled job is fenced against stale
   * callers; a handler failure is recorded and bounded by maxAttempts.
   */
  async runJob(id: string, handler?: (job: Job) => Promise<void>, cancelToken?: string): Promise<void> {
    const job = await this.store.jobById(id);
    if (!job) return;
    if (job.state === 'CANCELLED' || (job.cancellationToken && job.cancellationToken !== cancelToken)) {
      return; // fencing: a stale/disconnected caller cannot run a cancelled job
    }
    if (job.state === 'DONE' || job.state === 'FAILED') return;
    if (!handler) {
      await this.store.updateJob(id, { lastError: 'NO_JOB_HANDLER' });
      return;
    }
    if (job.attempt >= job.maxAttempts) {
      await this.store.updateJob(id, { state: 'FAILED', lastError: 'MAX_ATTEMPTS_REACHED' });
      return;
    }
    await this.store.updateJob(id, { state: 'RUNNING', attempt: job.attempt + 1 });
    try {
      await handler(job);
      await this.store.updateJob(id, { state: 'DONE', completedAt: new Date().toISOString(), lastError: null });
    } catch {
      const attempt = job.attempt + 1;
      await this.store.updateJob(id, {
        state: attempt >= job.maxAttempts ? 'FAILED' : 'PENDING',
        lastError: 'JOB_FAILED',
      });
    }
  }

  /** Cancel a pending job; running jobs are fenced on their next run attempt. */
  async cancel(id: string): Promise<void> {
    const job = await this.store.jobById(id);
    if (!job || job.state === 'CANCELLED' || job.state === 'DONE' || job.state === 'FAILED') return;
    await this.store.updateJob(id, { state: 'CANCELLED', cancellationToken: `cancel_${randomUUID()}` });
  }

  /** Queues currently holding jobs — the per-workload queue inventory. */
  async queues(): Promise<string[]> {
    return this.store.queues();
  }
}
