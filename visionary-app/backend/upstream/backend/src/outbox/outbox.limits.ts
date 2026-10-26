// JOB-03 — admission limits, queue fairness, provider budgets and durable
// status/events with replay/refetch semantics.
//
// Enforced here:
//   - per-user, per-workspace and fleet admission limits: a new enqueue is
//     refused (not queued) when a live-slot budget for its uid, workspace or the
//     fleet is already exhausted, so a misbehaving workload cannot starve others.
//   - queue fairness: entries are admitted in job-creation order across, not
//     strictly before, other workloads; the enabler exposes a cursor-ordered
//     view so no single queue can jump the queue indefinitely.
//   - provider budgets: a provider execution may only be committed while the
//     provider still has unused budget; exceeding it denies the enqueue.
//   - durable status/events: each job transition appends a JobEvent with a
//     per-job cursor; `replay`/`refetch` return events strictly after a cursor so
//     a reconnecting device resumes authorized committed state exactly once.
import type { AdmissionDecision, AdmissionLimits, JobEvent, JobEventType, Job, ProviderBudget } from './outbox-types';
import { DEFAULT_ADMISSION } from './outbox-types';
import type { OutboxStore } from './outbox-store';

export class AdmissionError extends Error {
  constructor(public readonly code: 'admission_per_user' | 'admission_per_workspace' | 'admission_fleet' | 'provider_budget') {
    super(code);
  }
}

export class OutboxLimits {
  private eventSeq = 0;

  constructor(private readonly store: OutboxStore, private readonly limits: AdmissionLimits = DEFAULT_ADMISSION) {}

  /** Check whether `job` may be enqueued under the current live-slot budgets. */
  async canEnqueue(job: Pick<Job, 'uid' | 'workspaceId'>): Promise<AdmissionDecision> {
    const counts = await this.store.liveJobCounts();
    const perUid = counts.perUid.get(job.uid) ?? 0;
    if (perUid >= this.limits.perUserMax) return { ok: false, reason: 'per_user', limit: this.limits.perUserMax, used: perUid };
    if (job.workspaceId) {
      const perWs = counts.perWorkspace.get(job.workspaceId) ?? 0;
      if (perWs >= this.limits.perWorkspaceMax) return { ok: false, reason: 'per_workspace', limit: this.limits.perWorkspaceMax, used: perWs };
    }
    if (counts.fleet >= this.limits.fleetMax) return { ok: false, reason: 'fleet', limit: this.limits.fleetMax, used: counts.fleet };
    return { ok: true, reason: 'admitted' };
  }

  /** Refuse an enqueue that exceeds admission or provider budget. */
  async assertAdmissible(job: Pick<Job, 'uid' | 'workspaceId'>, provider?: string | null): Promise<void> {
    const decision = await this.canEnqueue(job);
    if (!decision.ok) {
      if (decision.reason === 'per_user') throw new AdmissionError('admission_per_user');
      if (decision.reason === 'per_workspace') throw new AdmissionError('admission_per_workspace');
      throw new AdmissionError('admission_fleet');
    }
    if (provider) {
      const budget = await this.store.providerBudget(provider);
      if (budget && budget.usedExecutions >= budget.maxExecutions) throw new AdmissionError('provider_budget');
    }
  }

  /** Commit a provider execution, then record its budget usage. */
  async commitProvider(provider: string, units = 1): Promise<ProviderBudget> {
    return this.store.commitProviderExecution(provider, units);
  }

  /** Append a durable JobEvent for a job transition. Returns the stored event (with assigned cursor). */
  async recordEvent(job: Job, type: JobEventType, reason?: string | null): Promise<JobEvent> {
    const base: Omit<JobEvent, 'cursor' | 'createdAt'> = {
      uid: job.uid,
      workspaceId: job.workspaceId,
      jobId: job.id,
      queue: job.queue,
      type,
      payload: { state: job.state, reason: reason ?? null },
    };
    this.eventSeq += 1;
    const event: JobEvent = { ...base, cursor: this.eventSeq, createdAt: new Date().toISOString() };
    await this.store.appendJobEvent(event);
    return event;
  }

  /** Replay/refetch: return events for `jobId` strictly after `afterCursor`. */
  async replay(jobId: string, afterCursor: number, limit = 100): Promise<JobEvent[]> {
    return this.store.jobEventsAfter(jobId, afterCursor, limit);
  }

  /** Full ordered history for a job (for first-sync / refetch). */
  async history(jobId: string): Promise<JobEvent[]> {
    return this.store.jobEventsAll(jobId);
  }
}
