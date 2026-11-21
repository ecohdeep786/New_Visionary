// JOB-01 — owning-store outbox dispatcher.
//
// Review rework (10582): the dispatcher now REQUIRES confirmed private
// delivery before acknowledgement and reports outcomes honestly.
//   - atomic due claim: claimDueOutbox on the owning store claims each due
//     event exactly once (concurrent polls cannot double-claim; a poll before
//     nextAttemptAt never touches the row and never burns an attempt).
//   - confirmed delivery: the registered topic handler (or the default
//     handler) must confirm before the DONE ack is attempted. An asynchronous
//     handler can leave the lease with the worker instead.
//   - attempt fencing: only the current claim can settle the row. A delayed
//     delivery reports the owning store's status after a new claim takes over.
//   - recovery: a lost ack leaves the row DISPATCHED; once its lease expires
//     the next poll re-claims and re-delivers it. Handlers are idempotent per
//     cursor (the consumer dedupes on the durable cursor), so a redelivery
//     never double-commits.
import { randomUUID } from 'node:crypto';
import type { BackoffPolicy, Job, OutboxCursor, OutboxEvent, OutboxStatus } from './outbox-types';
import { DEFAULT_BACKOFF } from './outbox-types';
import type { JobPatch, JobStore, OutboxDeliveryStore, OutboxStore } from './outbox-store';
import { backoffDelay } from './outbox-store';
import { AdmissionError } from './outbox.limits';

export class JobPolicyError extends Error {
  constructor(public readonly code: 'unauthorized_queue' | 'unknown_event' | 'unknown_job' | 'recovered' |
    'quarantined' | 'fenced' | 'conflict' | 'deadline_exceeded' | 'invalid_job_time') {
    super(code);
  }
}

export interface JobClaim {
  job: Job;
  leaseToken: string;
  attemptToken: string;
}

const releasedLease = { claimedUntil: null, leaseToken: null, attemptToken: null };

function jobTime(value: string): number {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new JobPolicyError('invalid_job_time');
  return timestamp;
}

function leaseDuration(ms: number): number {
  if (!Number.isSafeInteger(ms) || ms < 1 || ms > 300_000) throw new JobPolicyError('invalid_job_time');
  return ms;
}

function hasPassed(value: string | null, now: number): boolean {
  return value !== null && jobTime(value) <= now;
}

function assertLease(job: Job, token: string, now: number) {
  if (!job.leaseToken || job.leaseToken !== token || !job.claimedUntil || hasPassed(job.claimedUntil, now) ||
      (job.state !== 'CLAIMED' && job.state !== 'RUNNING')) throw new JobPolicyError('fenced');
  if (hasPassed(job.runBy, now)) throw new JobPolicyError('deadline_exceeded');
}

/** Handlers are idempotent per cursor. Return 'queued' when the worker owns acknowledgement. */
export type DeliveryHandler = (event: OutboxEvent) => Promise<void | 'queued'>;

export interface DispatchOutcome {
  cursor: OutboxCursor;
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

export class OutboxDeliveryDispatcher {
  constructor(
    private readonly store: OutboxDeliveryStore,
    private readonly handlers: DispatcherHandlers = {},
    protected readonly policy: BackoffPolicy = DEFAULT_BACKOFF,
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
    let admission: void | 'queued' = undefined;
    if (handler) {
      try {
        admission = await handler(event);
      } catch {
        lastError = 'DELIVERY_FAILED';
      }
    }
    if (admission === 'queued') {
      const current = await this.store.outboxByCursor(event.cursor);
      if (!current) throw new JobPolicyError('unknown_event');
      return { cursor: event.cursor, status: current.status, delivered: current.status === 'DONE' };
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
}

export class JobDispatcher {
  constructor(private readonly jobs: JobStore, private readonly policy: BackoffPolicy = DEFAULT_BACKOFF) {}

  private async timestamp(now?: string): Promise<number> {
    return now === undefined ? (await this.jobs.clock()).getTime() : jobTime(now);
  }

  /** Enqueue a job into a per-workload queue, validating the client uid owns it. */
  async enqueue(uid: string, queue: string, kind: string, options: {
    runBy?: string | null; workspaceId?: string | null; provider?: string | null;
  } = {}): Promise<Job> {
    const authorized = await this.jobs.assertAuthorized(uid, queue);
    if (!authorized) throw new JobPolicyError('unauthorized_queue');
    const createdAt = await this.jobs.clock();
    const runBy = options.runBy === null ? null : new Date(options.runBy === undefined
      ? createdAt.getTime() + 24 * 60 * 60 * 1000
      : jobTime(options.runBy)).toISOString();
    const job: Job = {
      id: `job_${randomUUID()}`,
      uid,
      workspaceId: options.workspaceId ?? null,
      queue,
      provider: options.provider ?? null,
      kind,
      state: 'PENDING',
      attempt: 0,
      maxAttempts: this.policy.maxAttempts,
      revision: 0,
      createdAt: createdAt.toISOString(),
      ...releasedLease,
      nextAttemptAt: null,
      runBy,
      completedAt: null,
      cancellationToken: null,
      lastError: null,
      cleanupAttempts: 0,
      cleanupError: null,
    };
    await this.jobs.createJob(job);
    return job;
  }

  private async changeJob(id: string, change: (job: Job) => JobPatch | null, requireLiveLease = false, fair = false): Promise<Job> {
    for (let i = 0; i < 5; i++) {
      const job = await this.jobs.jobById(id);
      if (!job) throw new JobPolicyError('unknown_job');
      const patch = change(job);
      if (!patch) return job;
      const validUntil = requireLiveLease ? job.claimedUntil : patch.state === 'CLAIMED' ? job.runBy : null;
      const next = await this.jobs.compareJob(id, job.revision, patch, validUntil, fair);
      if (next) return next;
    }
    throw new JobPolicyError('conflict');
  }

  async claim(id: string, leaseMs: number, now?: string): Promise<JobClaim> {
    return this.lease(id, leaseMs, now, false);
  }

  /** Schedule ready work through a store that can validate the fair order atomically. */
  async claimNext(leaseMs: number): Promise<JobClaim | null> {
    leaseDuration(leaseMs);
    if (!this.jobs.nextReadyJob) throw new AdmissionError('policy_unavailable');
    for (let i = 0; i < 5; i++) {
      const id = await this.jobs.nextReadyJob();
      if (!id) return null;
      try {
        return await this.lease(id, leaseMs, undefined, true);
      } catch (error) {
        if (!(error instanceof JobPolicyError && ['conflict', 'deadline_exceeded', 'fenced'].includes(error.code)) &&
            !(error instanceof AdmissionError && error.code === 'provider_budget')) throw error;
      }
    }
    return null;
  }

  private async lease(id: string, leaseMs: number, now: string | undefined, fair: boolean): Promise<JobClaim> {
    const at = await this.timestamp(now);
    const requestedExpiry = at + leaseDuration(leaseMs);
    const leaseToken = `lease_${randomUUID()}`;
    const attemptToken = `attempt_${randomUUID()}`;
    const job = await this.changeJob(id, current => {
      if (current.state !== 'PENDING' || current.attempt >= current.maxAttempts ||
          (current.nextAttemptAt && jobTime(current.nextAttemptAt) > at)) throw new JobPolicyError('conflict');
      if (hasPassed(current.runBy, at)) throw new JobPolicyError('deadline_exceeded');
      const expiry = current.runBy ? Math.min(requestedExpiry, jobTime(current.runBy)) : requestedExpiry;
      return { state: 'CLAIMED', attempt: current.attempt + 1, claimedUntil: new Date(expiry).toISOString(),
        leaseToken, attemptToken, nextAttemptAt: null, lastError: null };
    }, false, fair);
    return { job, leaseToken, attemptToken };
  }

  async heartbeat(id: string, holder: Pick<JobClaim, 'leaseToken'>, extraMs: number, now?: string): Promise<Job> {
    const at = await this.timestamp(now);
    const requestedExpiry = at + leaseDuration(extraMs);
    return this.changeJob(id, job => {
      assertLease(job, holder.leaseToken, at);
      const capped = job.runBy ? Math.min(requestedExpiry, jobTime(job.runBy)) : requestedExpiry;
      return { claimedUntil: new Date(Math.max(capped, jobTime(job.claimedUntil!))).toISOString() };
    }, true);
  }

  async startRun(id: string, holder: Pick<JobClaim, 'leaseToken'>, now?: string): Promise<Job> {
    const at = await this.timestamp(now);
    return this.changeJob(id, job => {
      assertLease(job, holder.leaseToken, at);
      if (job.state !== 'CLAIMED') throw new JobPolicyError('conflict');
      return { state: 'RUNNING' };
    }, true);
  }

  async complete(id: string, holder: Pick<JobClaim, 'leaseToken' | 'attemptToken'>, now?: string): Promise<Job> {
    const at = await this.timestamp(now);
    return this.changeJob(id, job => {
      if (!job.attemptToken || job.attemptToken !== holder.attemptToken || job.leaseToken !== holder.leaseToken) {
        throw new JobPolicyError('fenced');
      }
      if (job.completedAt && (job.state === 'DONE' || job.state === 'QUARANTINED')) return null;
      assertLease(job, holder.leaseToken, at);
      if (job.state !== 'RUNNING') throw new JobPolicyError('conflict');
      return { state: 'DONE', completedAt: new Date(at).toISOString(), claimedUntil: null, lastError: null };
    }, true);
  }

  async fail(id: string, holder: Pick<JobClaim, 'leaseToken'>, error: string, now?: string): Promise<Job> {
    const at = await this.timestamp(now);
    return this.changeJob(id, job => {
      assertLease(job, holder.leaseToken, at);
      if (job.attempt >= job.maxAttempts) return { ...releasedLease, state: 'QUARANTINED', lastError: error };
      return { ...releasedLease, state: 'PENDING', lastError: error,
        nextAttemptAt: new Date(at + backoffDelay(this.policy, job.attempt)).toISOString() };
    }, true);
  }

  async cancel(id: string, _now?: string): Promise<Job> {
    return this.changeJob(id, job => {
      if (job.state !== 'PENDING' && job.state !== 'CLAIMED' && job.state !== 'RUNNING') return null;
      return { ...releasedLease, state: 'CANCELLED', nextAttemptAt: null, cancellationToken: `cancel_${randomUUID()}` };
    });
  }

  async failCleanup(id: string, error: string, maxCleanupAttempts: number, _now?: string): Promise<Job> {
    if (!Number.isSafeInteger(maxCleanupAttempts) || maxCleanupAttempts < 1) throw new JobPolicyError('conflict');
    return this.changeJob(id, job => {
      if (job.state === 'QUARANTINED') return null;
      if (job.state !== 'DONE' && job.state !== 'FAILED') throw new JobPolicyError('conflict');
      const cleanupAttempts = job.cleanupAttempts + 1;
      return { cleanupAttempts, cleanupError: error,
        state: cleanupAttempts >= maxCleanupAttempts ? 'QUARANTINED' : job.state };
    });
  }

  /** Use the same fenced lifecycle for callers that supply an in-process handler. */
  async runJob(id: string, handler?: (job: Job) => Promise<void>, cancelToken?: string): Promise<void> {
    const current = await this.jobs.jobById(id);
    if (!current || current.state !== 'PENDING' || (current.cancellationToken && current.cancellationToken !== cancelToken)) return;
    if (!handler) {
      await this.jobs.compareJob(id, current.revision, { lastError: 'NO_JOB_HANDLER' });
      return;
    }
    try {
      const claim = await this.claim(id, this.policy.leaseMs);
      const job = await this.startRun(id, claim);
      try {
        await handler(job);
      } catch {
        await this.fail(id, claim, 'JOB_FAILED');
        return;
      }
      await this.complete(id, claim);
    } catch (error) {
      if (!(error instanceof JobPolicyError) ||
          !['fenced', 'conflict', 'deadline_exceeded'].includes(error.code)) throw error;
    }
  }

  async queues(): Promise<string[]> { return this.jobs.queues(); }
}

export class OutboxDispatcher extends JobDispatcher {
  private readonly delivery: OutboxDeliveryDispatcher;

  constructor(store: OutboxStore, handlers: DispatcherHandlers = {}, policy: BackoffPolicy = DEFAULT_BACKOFF) {
    super(store, policy);
    this.delivery = new OutboxDeliveryDispatcher(store, handlers, policy);
  }

  dispatch(batchSize: number, now?: Date): Promise<DispatchOutcome[]> {
    return this.delivery.dispatch(batchSize, now);
  }
}
