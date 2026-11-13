// PRIV-02 (KAN-111) — the lifecycle-job domain's typed state seams. The five
// stores implement these at integration; the in-memory implementation is
// contract-true and fails closed.
import type { JobOwner, StoreKind } from './privacy-jobs-types';

export interface PrivacyJobStore {
  /** ATOMIC job claim (conditional create, the SQL ON CONFLICT law): exactly
   *  ONE concurrent runJob for a jobId wins; the loser claims false and never
   *  freezes or sweeps. Must be claimed BEFORE any store is touched. */
  claimJob(jobId: string, owner: JobOwner, kind: 'export' | 'deletion'): Promise<boolean>;
  /** Stop new work/downloads for the owner FIRST (freeze before sweeping). */
  freezeOwner(ownerUid: string): Promise<void>;
  isFrozen(ownerUid: string): Promise<boolean>;
  /** Declared record count for one store (the sweep target). */
  declareCount(store: StoreKind, ownerUid: string): Promise<number>;
  /** Execute the sweep on one store; return the ACTUAL processed count. */
  sweepStore(store: StoreKind, ownerUid: string, kind: 'export' | 'deletion'): Promise<number>;
  saveJobReceipt(receipt: { jobId: string; owner: JobOwner; kind: string; complete: boolean; stores: unknown }): Promise<void>;
  byJobId(jobId: string): Promise<unknown | undefined>;
}

/** Contract-true in-memory store; five stores, honest counts. */
export class InMemoryPrivacyJobStore implements PrivacyJobStore {
  private frozen = new Set<string>();
  private declared: Record<string, number> = {};
  private sweepOverrides = new Map<string, number>();
  private receipts = new Map<string, unknown>();
  private claims = new Set<string>();

  seedDeclared(store: StoreKind, ownerUid: string, count: number): void {
    this.declared[`${store}|${ownerUid}`] = count;
  }

  /** Test hook: force a store's actual count to differ (reconciliation failure). */
  forceSweepCount(store: StoreKind, ownerUid: string, kind: string, actual: number): void {
    this.sweepOverrides.set(`${kind}|${store}|${ownerUid}`, actual);
  }

  /** Atomic conditional create: the FIRST caller claims; every later caller
   *  for the same jobId claims false (never a second sweep). */
  async claimJob(jobId: string, owner: JobOwner, kind: 'export' | 'deletion'): Promise<boolean> {
    if (this.claims.has(jobId)) return false;
    this.claims.add(jobId);
    return true;
  }

  async freezeOwner(ownerUid: string): Promise<void> {
    this.frozen.add(ownerUid);
  }

  async isFrozen(ownerUid: string): Promise<boolean> {
    return this.frozen.has(ownerUid);
  }

  async declareCount(store: StoreKind, ownerUid: string): Promise<number> {
    return this.declared[`${store}|${ownerUid}`] ?? 0;
  }

  async sweepStore(store: StoreKind, ownerUid: string, kind: 'export' | 'deletion'): Promise<number> {
    const override = this.sweepOverrides.get(`${kind}|${store}|${ownerUid}`);
    if (override !== undefined) return override;
    return this.declared[`${store}|${ownerUid}`] ?? 0;
  }

  async saveJobReceipt(receipt: { jobId: string; owner: JobOwner; kind: string; complete: boolean; stores: unknown }): Promise<void> {
    this.receipts.set(receipt.jobId, { ...receipt });
  }

  async byJobId(jobId: string): Promise<unknown | undefined> {
    return this.receipts.get(jobId);
  }
}
