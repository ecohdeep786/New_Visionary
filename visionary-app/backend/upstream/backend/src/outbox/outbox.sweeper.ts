// JOB-02 — sweeper for orphaned/stuck work.
//
// Runs periodically (a poll cadence, not a hard schedule) and reclaims:
//   1. jobs whose lease expired while CLAIMED/RUNNING — the claimed lease is
//      invalid (fencing the old token) and the job returns to PENDING for a
//      fresh claim, or is QUARANTINED past the attempt ceiling;
//   2. jobs past their hard deadline (`runBy`) — the sweeper stops them from
//      running late and marks FAILED with `deadline_exceeded`, never executing
//      work whose time horizon has closed;
//   3. jobs stuck in CLAIMED that never start or RUNNING that never acks — the
//      same expired-lease reclaim covers both.
// The sweeper does not re-execute the worker body; it only adjusts durable state.
import type { BackoffPolicy, Job, JobState } from './outbox-types';
import { DEFAULT_BACKOFF } from './outbox-types';
import type { JobPatch, JobWriteResult, OutboxStore } from './outbox-store';
import { backoffDelay } from './outbox-store';

export interface SweepResult {
  reclaimed: Job[];
  deadlineExpired: Job[];
  quarantinedStale: Job[];
}

export class OutboxSweeper {
  constructor(private readonly store: OutboxStore, private readonly policy: BackoffPolicy = DEFAULT_BACKOFF) {}

  /**
   * Sweep overdue/orphaned work. `now` is injectable so tests can travel in time.
   */
  async sweep(now = new Date().toISOString()): Promise<SweepResult> {
    const reclaimed: Job[] = [];
    const deadlineExpired: Job[] = [];
    const quarantinedStale: Job[] = [];

    // 1) Expired leases (crashed runners) — reclaim/retry or quarantine.
    for (const stale of await this.store.staleClaimedJobs(now)) {
      const attempt = stale.attempt + 1;
      if (attempt >= stale.maxAttempts) {
        const q = await this.quarantine(stale.id, `lease ${stale.leaseToken} expired attempt ${attempt}/${stale.maxAttempts}`);
        quarantinedStale.push(q);
      } else {
        const delay = backoffDelay(this.policy, attempt);
        const patch: JobPatch = {
          state: 'PENDING', // requeue — new claim mints a fresh lease, fencing the old
          attempt,
          claimedUntil: null,
          leaseToken: null, // invalidate old token: any zombie is fenced
          attemptToken: null,
          nextAttemptAt: new Date(Date.parse(now) + delay).toISOString(),
          lastError: `lease_expired_reclaim`,
        };
        const r = await this.store.transition(stale.id, ['CLAIMED', 'RUNNING'], stale.leaseToken, patch);
        if (r.ok) reclaimed.push(r.job);
      }
    }

    // 2) Hard deadlines — a job that must not run once `runBy` has passed.
    const notDone = await this.store.jobsInStates(['PENDING', 'CLAIMED', 'RUNNING', 'FAILED']);
    for (const job of notDone) {
      if (job.runBy && Date.parse(job.runBy) < Date.parse(now) && job.state !== 'DONE') {
        const r = await this.store.transition(job.id, ['PENDING', 'CLAIMED', 'RUNNING', 'FAILED'], null, {
          state: 'FAILED',
          lastError: 'deadline_exceeded',
          claimedUntil: null,
          leaseToken: null,
          attemptToken: null,
          completedAt: null,
        });
        if (r.ok) deadlineExpired.push(r.job);
      }
    }

    return { reclaimed, deadlineExpired, quarantinedStale };
  }

  private async quarantine(id: string, reason: string): Promise<Job> {
    const r = await this.store.transition(id, ['CLAIMED', 'RUNNING', 'PENDING', 'FAILED'], null, {
      state: 'QUARANTINED',
      lastError: reason,
      claimedUntil: null,
      leaseToken: null,
      attemptToken: null,
      completedAt: null,
    });
    if (!r.ok) {
      const detail = 'reason' in r ? r.reason : 'conflict';
      throw new Error(`sweep cannot quarantine job ${id}: ${detail}`);
    }
    return r.job;
  }
}
