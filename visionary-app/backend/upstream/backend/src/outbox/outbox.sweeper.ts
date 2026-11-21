import type { BackoffPolicy, Job } from './outbox-types';
import { DEFAULT_BACKOFF } from './outbox-types';
import type { JobPatch, JobStore } from './outbox-store';
import { backoffDelay } from './outbox-store';

export interface SweepResult {
  reclaimed: Job[];
  deadlineExpired: Job[];
  quarantinedStale: Job[];
}

const closedLease = { claimedUntil: null, leaseToken: null, attemptToken: null };

export class OutboxSweeper {
  constructor(private readonly store: JobStore, private readonly policy: BackoffPolicy = DEFAULT_BACKOFF) {}

  async sweep(now?: string, limit = 100): Promise<SweepResult> {
    const at = now === undefined ? await this.store.clock() : new Date(now);
    if (!Number.isFinite(at.getTime()) || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw Error('Invalid job sweep time or limit.');
    }
    const result: SweepResult = { reclaimed: [], deadlineExpired: [], quarantinedStale: [] };
    for (const job of await this.store.dueJobs(at, limit)) {
      const passedDeadline = job.runBy !== null && Date.parse(job.runBy) <= at.getTime();
      let patch: JobPatch;
      let outcome: keyof SweepResult;
      if (passedDeadline) {
        patch = { state: 'FAILED', lastError: 'deadline_exceeded', nextAttemptAt: null };
        outcome = 'deadlineExpired';
      } else if (job.attempt >= job.maxAttempts) {
        patch = { state: 'QUARANTINED', lastError: 'lease_expired_attempt_ceiling', nextAttemptAt: null };
        outcome = 'quarantinedStale';
      } else {
        patch = { state: 'PENDING', lastError: 'lease_expired_reclaim',
          nextAttemptAt: new Date(at.getTime() + backoffDelay(this.policy, job.attempt)).toISOString() };
        outcome = 'reclaimed';
      }
      // A heartbeat or competing sweeper can change the revision after the scan.
      const updated = await this.store.compareJob(job.id, job.revision, { ...closedLease, ...patch });
      if (updated) result[outcome].push(updated);
    }
    return result;
  }
}
