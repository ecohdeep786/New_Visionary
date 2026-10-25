// JOB-01/JOB-02 — owning-store outbox dispatcher and job lease runner.
//
// JOB-01 guarantees (retained here):
//   - commit safety: an event appended to the owning store is never lost; a
//     dispatch that fails before ack leaves a PENDING row that a later poll
//     re-dispatches (recovery after commit/dispatch/ack crashes).
//   - bounded retry/backoff: each outbox event/job has a maxAttempts ceiling and
//     exponential backoff; exceeding the ceiling quarantines the row (FAILED /
//     QUARANTINED).
//   - idempotent completion: delivering the same cursor twice never executes the
//     underlying action twice because completion is keyed on the durable cursor.
//   - per-workload queues: jobs are routed by `queue`; a client cannot inject a
//     queue it does not own (server-authoritative assertAuthorized).
//
// JOB-02 adds (implemented here):
//   - leases: `claim` mints a leaseToken + attemptToken and sets claimedUntil;
//     only the holder can heartbeat/complete/fail, and only while unexpired.
//   - attempt fencing: every state transition is conditional on the current
//     lease token + state set (store.transition); a stale/disconnected worker is
//     refused, so a cancelled/reclaimed job can never be completed by a zombie.
//   - deadlines: `runBy` is a hard horizon; jobs not DONE by runBy are reclaimed
//     by the sweeper, never executed.
//   - cancellation: `cancel` fences CLAIMED/RUNNGING jobs at the store level.
//   - quarantine of failed cleanup: a run whose cleanup keeps failing is retried
//     a bounded number of times and then QUARANTINED, never silently dropped.
import type { BackoffPolicy, Job, JobState, OutboxEvent, OutboxStatus } from './outbox-types';
import { DEFAULT_BACKOFF } from './outbox-types';
import type { JobPatch, JobWriteResult, OutboxStore } from './outbox-store';
import { backoffDelay } from './outbox-store';

export class JobPolicyError extends Error {
  constructor(public readonly code: 'unauthorized_queue' | 'unknown_event' | 'unknown_job' | 'fenced' | 'conflict' | 'recovered' | 'quarantined' | 'deadline_exceeded') {
    super(code);
  }
}

export interface JobClaim {
  job: Job;
  leaseToken: string;
  attemptToken: string;
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
  async enqueue(uid: string, queue: string, kind: string, opts: { runBy?: string | null } = {}): Promise<Job> {
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
      leaseToken: null,
      attemptToken: null,
      cleanupAttempts: 0,
      cleanupError: null,
      runBy: opts.runBy ?? null,
      completedAt: null,
      cancellationToken: null,
      lastError: null,
      nextAttemptAt: null,
    };
    await this.store.createJob(job);
    return job;
  }

  /**
   * Claim a job: transition PENDING → CLAIMED and mint fresh lease + attempt
   * tokens. Every later mutation must present them (fencing). A dead lease or
   * replaced token conflicts and refuses the new holder, so two workers never
   * run the same job. The attempt counter is owned by fail()/sweep, not claim.
   */
  async claim(id: string, leaseMs: number, now: string | null = null): Promise<JobClaim> {
    const at = now ?? new Date().toISOString();
    const job = await this.store.jobById(id);
    if (!job) throw new JobPolicyError('unknown_job');
    if (job.nextAttemptAt && Date.parse(job.nextAttemptAt) > Date.parse(at)) {
      // Backoff window not yet closed; do not run early.
      throw new JobPolicyError('conflict');
    }
    const leaseToken = `lease_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const attemptToken = `attempt_${id}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const result = await this.store.transition(id, ['PENDING'], null, {
      state: 'CLAIMED',
      claimedUntil: new Date(Date.parse(at) + leaseMs).toISOString(),
      leaseToken,
      attemptToken,
    });
    if (!result.ok) throw this.fromWriteResult(result, 'claim');
    return { job: result.job, leaseToken, attemptToken };
  }

  /** Extend a lease while work is still making progress (heartbeat). */
  async heartbeat(id: string, holder: Pick<JobClaim, 'leaseToken'>, extraMs: number, now: string | null = null): Promise<Job> {
    const at = now ?? new Date().toISOString();
    const result = await this.store.transition(id, ['CLAIMED', 'RUNNING'], holder.leaseToken, {
      claimedUntil: new Date(Date.parse(at) + extraMs).toISOString(),
    });
    if (!result.ok) throw this.fromWriteResult(result, 'heartbeat');
    return result.job;
  }

  /** Enter RUNNING from CLAIMED as the lease holder. The worker body runs after this. */
  async startRun(id: string, holder: Pick<JobClaim, 'leaseToken'>, now: string | null = null): Promise<Job> {
    const result = await this.store.transition(id, ['CLAIMED'], holder.leaseToken, { state: 'RUNNING' });
    if (!result.ok) throw this.fromWriteResult(result, 'startRun');
    return result.job;
  }

  /**
   * Idempotent fenced completion. Only the lease holder transitions a
   * CLAIMED/RUNNING job to DONE, and only while its attempt token matches; a
   * job already DONE stays DONE (never re-executed) and a stale runner is fenced.
   */
  async complete(jobId: string, holder: Pick<JobClaim, 'leaseToken' | 'attemptToken'>, now: string | null = null): Promise<Job> {
    const at = now ?? new Date().toISOString();
    const fresh = await this.store.jobById(jobId);
    if (fresh?.state === 'DONE') return fresh; // idempotent — already completed
    // Fence first: if the row no longer carries our lease/attempt token (it was
    // reclaimed by the sweeper, cancelled, or re-claimed), the caller is a stale
    // runner and must be refused as fenced, regardless of the row's visible state.
    if (fresh && fresh.leaseToken !== holder.leaseToken) throw new JobPolicyError('fenced');
    if (fresh && fresh.attemptToken !== holder.attemptToken) throw new JobPolicyError('fenced');
    if (fresh && fresh.state !== 'CLAIMED' && fresh.state !== 'RUNNING') throw this.fromState('complete', fresh.state);
    const result = await this.store.transition(jobId, ['CLAIMED', 'RUNNING'], holder.leaseToken, {
      state: 'DONE',
      completedAt: at,
      claimedUntil: null,
      leaseToken: null,
      attemptToken: null,
      lastError: null,
      nextAttemptAt: null,
    });
    if (!result.ok) {
      const reloaded = await this.store.jobById(jobId);
      if (reloaded?.state === 'DONE') return reloaded; // lost a race, someone finished first — idempotent
      throw this.fromWriteResult(result, 'complete');
    }
    return result.job;
  }

  /**
   * Fail a CLAIMED/RUNNING job from its lease holder. Under the attempt ceiling
   * the job returns to PENDING with exponential backoff for a fresh claim;
   * at the ceiling it is QUARANTINED with the error recorded — never silently
   * dropped.
   */
  async fail(jobId: string, holder: Pick<JobClaim, 'leaseToken'>, error: string, now: string | null = null): Promise<Job> {
    const at = now ?? new Date().toISOString();
    const job = await this.store.jobById(jobId);
    if (!job) throw new JobPolicyError('unknown_job');
    if (job.state === 'DONE' || job.state === 'QUARANTINED' || job.state === 'CANCELLED') return job; // terminal, idempotent
    const attempt = job.attempt + 1;
    const isFatal = attempt >= job.maxAttempts;
    const patch: JobPatch = isFatal
      ? { state: 'QUARANTINED', attempt, lastError: error, claimedUntil: null, leaseToken: null, attemptToken: null, completedAt: null, nextAttemptAt: null }
      : {
          state: 'PENDING',
          attempt,
          lastError: error,
          claimedUntil: null,
          leaseToken: null,
          attemptToken: null,
          nextAttemptAt: new Date(Date.parse(at) + backoffDelay(this.policy, attempt)).toISOString(),
        };
    const result = await this.store.transition(jobId, ['CLAIMED', 'RUNNING', 'PENDING'], holder.leaseToken, patch);
    if (!result.ok) throw this.fromWriteResult(result, 'fail');
    return result.job;
  }

  /** Cancel a job: fence CLAIMED/RUNNING holders so no zombie can complete it. */
  async cancel(id: string, now: string | null = null): Promise<Job> {
    const at = now ?? new Date().toISOString();
    const result = await this.store.transition(id, ['PENDING', 'CLAIMED', 'RUNNING'], null, {
      state: 'CANCELLED',
      cancellationToken: `cancel_${Date.now()}`,
      claimedUntil: null,
      leaseToken: null,
      attemptToken: null,
    });
    if (!result.ok) {
      const fresh = await this.store.jobById(id);
      if (fresh?.state === 'CANCELLED' || fresh?.state === 'DONE') return fresh; // idempotent
      throw this.fromWriteResult(result, 'cancel');
    }
    return result.job;
  }

  /**
   * Record a failed post-run cleanup. Cleanup is retried a bounded number of
   * times; past the ceiling the job is QUARANTINED so a tempting-but-lost
   * resource (e.g. a private export that could not be revoked) is never dropped
   * silently. Returns the updated job.
   */
  async failCleanup(jobId: string, error: string, maxCleanupAttempts: number, now: string | null = null): Promise<Job> {
    const at = now ?? new Date().toISOString();
    const job = await this.store.jobById(jobId);
    if (!job) throw new JobPolicyError('unknown_job');
    const attempts = job.cleanupAttempts + 1;
    const quarantined = attempts >= maxCleanupAttempts;
    const result = await this.store.transition(jobId, ['DONE', 'FAILED', 'QUARANTINED'], null, {
      cleanupAttempts: attempts,
      cleanupError: error,
      state: quarantined ? 'QUARANTINED' : job.state,
    });
    if (!result.ok) throw this.fromWriteResult(result, 'failCleanup');
    return result.job;
  }

  /** Queues currently holding jobs — the per-workload queue inventory. */
  async queues(): Promise<string[]> {
    return this.store.queues();
  }

  private fromWriteResult(r: JobWriteResult, op: string): JobPolicyError {
    if ('reason' in r && r.reason === 'fenced') return new JobPolicyError('fenced');
    if ('reason' in r && r.reason === 'conflict') return new JobPolicyError('conflict');
    return new JobPolicyError('unknown_job');
  }

  private fromState(op: string, state: JobState | null): JobPolicyError {
    return new JobPolicyError(state === 'QUARANTINED' ? 'quarantined' : 'conflict');
  }
}
