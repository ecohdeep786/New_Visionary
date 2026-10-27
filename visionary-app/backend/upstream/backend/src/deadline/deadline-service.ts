// AI-08 (KAN-90) — deadline/cancellation reconciliation with provider work.
//
// Core responsibilities (server-owned; partial/final distinction preserved):
//   1. begin: track a teaching request with its whole-request deadline.
//   2. onProviderCheckpoint: called as provider work progresses — when the
//      deadline has passed, the request terminates honestly: the produced
//      partial is delivered marked `final: false`, reason `deadline`, and
//      provider work is stopped (nothing new after termination).
//   3. cancel: the caller cancels — provider work stops at the checkpoint; any
//      produced partial is delivered marked `final: false`, reason `cancelled`.
//   4. complete: the provider finished in time — `final: true`, `completed`.
//   5. onDisconnect: cleanup — provider work stopped, partial state not
//      presented as final, outcome records `disconnected`.
//   6. Long Build jobs do NOT ride this deadline: binding a registered durable
//      run to the teaching deadline is refused (`long_job_requires_durable_protocol`).
//   7. A terminated request accepts no further transitions (`already_terminated`);
//      wrong users denied; unknown requests fail closed.
import type {
  DeadlineError as DeadlineErrorType,
  DeadlineOwner,
  RequestOutcome,
} from './deadline-types';
import { DeadlineError } from './deadline-types';
import type { DeadlineStore } from './deadline-lookups';

export class DeadlineReconciliationService {
  private requestCounter = 0;
  constructor(
    private readonly store: DeadlineStore,
    private readonly now: () => number = () => Date.now(),
  ) {}

  /** Track a teaching request with its whole-request deadline. */
  async begin(owner: DeadlineOwner, deadlineAt: number): Promise<string> {
    const requestId = `req_${++this.requestCounter}`;
    await this.store.saveRequest({ requestId, owner: { ...owner }, deadlineAt, status: 'running', partialBody: null });
    return requestId;
  }

  /** Record produced partial state at a provider checkpoint. */
  async recordPartial(requestId: string, owner: DeadlineOwner, partialBody: unknown): Promise<void> {
    const request = await this.getOwned(requestId, owner);
    if (request.status !== 'running') throw new DeadlineError('already_terminated');
    await this.store.saveRequest({ ...request, partialBody });
  }

  /** Provider checkpoint: honor the deadline honestly (partial, not final). */
  async onProviderCheckpoint(requestId: string, owner: DeadlineOwner, hasProviderWork: boolean): Promise<RequestOutcome | null> {
    const request = await this.getOwned(requestId, owner);
    if (request.status !== 'running') return null; // already terminated
    if (this.now() < request.deadlineAt) return null; // still within the deadline
    const outcome: RequestOutcome = {
      requestId,
      final: false,
      reason: 'deadline',
      partialBody: request.partialBody,
      providerWorkStopped: hasProviderWork,
    };
    await this.store.saveRequest({ ...request, status: 'deadline_hit' });
    return outcome;
  }

  /** Caller cancellation: stop provider work; partial stays partial. */
  async cancel(requestId: string, owner: DeadlineOwner, hasProviderWork: boolean): Promise<RequestOutcome> {
    const request = await this.getOwned(requestId, owner);
    if (request.status !== 'running') throw new DeadlineError('already_terminated');
    const outcome: RequestOutcome = {
      requestId,
      final: false,
      reason: 'cancelled',
      partialBody: request.partialBody,
      providerWorkStopped: hasProviderWork,
    };
    await this.store.saveRequest({ ...request, status: 'cancelled' });
    return outcome;
  }

  /** Provider finished within the deadline: final. */
  async complete(requestId: string, owner: DeadlineOwner, body: unknown): Promise<RequestOutcome> {
    const request = await this.getOwned(requestId, owner);
    if (request.status !== 'running') throw new DeadlineError('already_terminated');
    if (this.now() >= request.deadlineAt) {
      // The deadline passed while the provider finished: deliver as partial.
      await this.store.saveRequest({ ...request, status: 'deadline_hit', partialBody: body });
      return { requestId, final: false, reason: 'deadline', partialBody: body, providerWorkStopped: true };
    }
    const outcome: RequestOutcome = { requestId, final: true, reason: 'completed', partialBody: null, providerWorkStopped: true };
    await this.store.saveRequest({ ...request, status: 'completed' });
    void body;
    return outcome;
  }

  /** Caller disconnect: cleanup — stop work, honest disconnected outcome. */
  async onDisconnect(requestId: string, owner: DeadlineOwner, hasProviderWork: boolean): Promise<RequestOutcome> {
    const request = await this.getOwned(requestId, owner);
    if (request.status !== 'running') throw new DeadlineError('already_terminated');
    const outcome: RequestOutcome = {
      requestId,
      final: false,
      reason: 'disconnected',
      partialBody: request.partialBody,
      providerWorkStopped: hasProviderWork,
    };
    await this.store.saveRequest({ ...request, status: 'disconnected' });
    return outcome;
  }

  /** Long Build jobs use their own durable protocol — binding refuses. */
  async beginForLongJob(owner: DeadlineOwner, runId: string): Promise<never> {
    if (await this.store.isDurableRun(runId)) {
      throw new DeadlineError('long_job_requires_durable_protocol');
    }
    throw new DeadlineError('long_job_requires_durable_protocol');
  }

  private async getOwned(requestId: string, owner: DeadlineOwner) {
    const request = await this.store.byRequestId(requestId);
    if (!request) throw new DeadlineError('unknown_request');
    if (request.owner.uid !== owner.uid || request.owner.workspaceId !== owner.workspaceId) {
      throw new DeadlineError('not_owner');
    }
    return request;
  }
}

export type { DeadlineErrorType };
