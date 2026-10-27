// AI-08 (KAN-90) — the deadline/cancel reconciliation domain's typed state
// seams. The owning store (requests, durable-run registry) implements this at
// integration; the in-memory implementation is contract-true and fails closed.
import type { DeadlineOwner, RequestOutcome } from './deadline-types';

export interface TrackedRequest {
  requestId: string;
  owner: DeadlineOwner;
  /** The absolute whole-request deadline (ms epoch). */
  deadlineAt: number;
  status: 'running' | 'completed' | 'cancelled' | 'deadline_hit' | 'disconnected';
  partialBody: unknown | null;
}

export interface DeadlineStore {
  saveRequest(request: TrackedRequest): Promise<void>;
  byRequestId(requestId: string): Promise<TrackedRequest | undefined>;
  /** True when the job id is a registered DURABLE Build run (BUILD-04). */
  isDurableRun(runId: string): Promise<boolean>;
}

/** Contract-true in-memory store; requests are server-tracked state. */
export class InMemoryDeadlineStore implements DeadlineStore {
  private requests = new Map<string, TrackedRequest>();
  private durableRuns = new Set<string>();

  async saveRequest(request: TrackedRequest): Promise<void> {
    this.requests.set(request.requestId, { ...request, owner: { ...request.owner } });
  }

  async byRequestId(requestId: string): Promise<TrackedRequest | undefined> {
    const found = this.requests.get(requestId);
    return found ? { ...found, owner: { ...found.owner } } : undefined;
  }

  async isDurableRun(runId: string): Promise<boolean> {
    return this.durableRuns.has(runId);
  }

  registerDurableRun(runId: string): void {
    this.durableRuns.add(runId);
  }
}
