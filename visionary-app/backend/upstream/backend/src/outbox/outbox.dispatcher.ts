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
//   - honest reporting: DONE = delivered + ack committed; DISPATCHED =
//     delivery confirmed but the ack did not commit (crash) — the row is
//     durably DISPATCHED under its recovery lease; PENDING = delivery failed
//     and a bounded backoff retry is scheduled; FAILED = quarantined at the
//     attempt ceiling. A poll never reports DISPATCHED for a PENDING row.
//   - recovery: a lost ack leaves the row DISPATCHED; once its lease expires
//     the next poll re-claims and re-delivers it. Handlers are idempotent per
//     cursor (the consumer dedupes on the durable cursor), so a redelivery
//     never double-commits.
import type { BackoffPolicy, Job, JobState, OutboxEvent, OutboxStatus } from './outbox-types';
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
    const results: DispatchOutcome[] = [];
    // Quarantine exhausted rows first: they are due but never claimed again.
    for (const dead of await this.store.exhaustedOutbox(now, this.policy.maxAttempts)) {
      await this.store.markOutbox(dead.cursor, { status: 'FAILED', lastError: 'MAX_ATTEMPTS_REACHED' });
      results.push({ cursor: dead.cursor, status: 'FAILED', delivered: false });
    }
    const claimed = await this.store.claimDueOutbox(batchSize, now, this.policy.maxAttempts, this.policy.leaseMs);
    for (const event of claimed) {
      results.push(await this.deliver(event, now));
    }
    return results;
  }

  private handlerFor(topic: string): DeliveryHandler | undefined {
    return this.handlers.topics?.get(topic) ?? this.handlers.default;
  }

  private async deliver(event: OutboxEvent, now: Date): Promise<DispatchOutcome> {
    const outcome = (status: OutboxStatus, delivered: boolean): DispatchOutcome => ({ cursor: event.cursor, status, delivered });
    const handler = this.handlerFor(event.topic);
    if (!handler) {
      // No delivery endpoint: never mark DONE. Schedule a bounded retry so the
      // row is not hot-looped, and report PENDING honestly.
      const delay = backoffDelay(this.policy, event.attempts);
      await this.store.markOutbox(event.cursor, {
        status: 'PENDING',
        nextAttemptAt: new Date(now.getTime() + delay).toISOString(),
        lastError: 'NO_DELIVERY_HANDLER',
      });
      return outcome('PENDING', false);
    }
    try {
      await handler(event);
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 200) : 'delivery failed';
      if (event.attempts >= this.policy.maxAttempts) {
        await this.store.markOutbox(event.cursor, { status: 'FAILED', lastError: message });
        return outcome('FAILED', false);
      }
      // Bounded backoff: the retry slot respects nextAttemptAt; attempts were
      // already incremented by the atomic claim, so a poll before the slot
      // cannot burn another attempt.
      const delay = backoffDelay(this.policy, event.attempts);
      await this.store.markOutbox(event.cursor, {
        status: 'PENDING',
        nextAttemptAt: new Date(now.getTime() + delay).toISOString(),
        lastError: message,
      });
      return outcome('PENDING', false);
    }
    // Delivery confirmed — only now is the DONE ack attempted. A lost ack
    // leaves the row DISPATCHED under its lease for a later recovery poll.
    const acked = await this.store.ackOutbox(event.cursor, now).catch(() => false);
    return acked ? outcome('DONE', true) : outcome('DISPATCHED', true);
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
    if (job.state === 'DONE') return; // idempotent completion
    if (!handler) {
      await this.store.updateJob(id, { lastError: 'NO_JOB_HANDLER' });
      return;
    }
    if (job.attempt >= job.maxAttempts) {
      await this.store.updateJob(id, { state: 'FAILED' as JobState, lastError: 'MAX_ATTEMPTS_REACHED' });
      return;
    }
    await this.store.updateJob(id, { state: 'RUNNING' as JobState, attempt: job.attempt + 1 });
    try {
      await handler(job);
      await this.store.updateJob(id, { state: 'DONE' as JobState, completedAt: new Date().toISOString(), lastError: null });
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 200) : 'job failed';
      const attempt = job.attempt + 1;
      if (attempt >= job.maxAttempts) {
        await this.store.updateJob(id, { state: 'FAILED' as JobState, lastError: message });
      } else {
        await this.store.updateJob(id, { state: 'PENDING' as JobState, lastError: message });
      }
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
