// AI-09 (KAN-91) — the resilience domain's typed state seams. The owning
// stores (policy state, egress windows) implement these at integration; the
// in-memory implementation is contract-true and fails closed.
import type { MlRunCaller } from './ml-resilience-types';

export interface ResilienceStore {
  /** True while the caller's ML policy/consent is active. */
  policyActive(caller: MlRunCaller): Promise<boolean>;
  /** Atomically consume one slot from the shared egress fairness window. */
  tryConsumeEgressWindow(egressId: string, windowKey: string, limit: number): Promise<boolean>;
}

/** Contract-true in-memory store; the egress window is a synchronous counter. */
export class InMemoryResilienceStore implements ResilienceStore {
  private policiesActive = new Set<string>();
  private windows = new Map<string, number>();

  setPolicyActive(uid: string, active: boolean): void {
    if (active) this.policiesActive.add(uid);
    else this.policiesActive.delete(uid);
  }

  async policyActive(caller: MlRunCaller): Promise<boolean> {
    return this.policiesActive.has(caller.uid);
  }

  async tryConsumeEgressWindow(egressId: string, windowKey: string, limit: number): Promise<boolean> {
    // CRITICAL SECTION: check + consume atomically (synchronous).
    const key = `${egressId}|${windowKey}`;
    const used = this.windows.get(key) ?? 0;
    if (used >= limit) return false;
    this.windows.set(key, used + 1);
    return true;
  }

  usedInWindow(egressId: string, windowKey: string): number {
    return this.windows.get(`${egressId}|${windowKey}`) ?? 0;
  }
}
