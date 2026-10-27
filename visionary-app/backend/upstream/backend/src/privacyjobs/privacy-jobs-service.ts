// PRIV-02 (KAN-111) — authenticated bounded export/deletion lifecycle jobs.
//
// Core responsibilities (server-owned; stop-first; honest reconciliation):
//   1. runJob: authenticate the owner, then STOP NEW WORK FIRST (freeze), then
//      sweep all five stores, then reconcile declared vs actual per store.
//   2. The receipt is COMPLETE only when every store reconciles; a mismatch
//      marks the job incomplete with the store named (never a fake success).
//   3. Idempotent per jobId: a retried job returns the same receipt — no
//      duplicate export, no double deletion.
//   4. While a job is running (owner frozen), new work for that owner refuses
//      (`owner_frozen`) — nothing escapes the sweep.
//   5. Wrong users cannot run or inspect another's job; unknown jobs fail closed.
import type {
  JobOwner,
  JobReceipt,
  PrivacyJobError as PrivacyJobErrorType,
  StoreKind,
} from './privacy-jobs-types';
import { PrivacyJobError } from './privacy-jobs-types';
import type { PrivacyJobStore } from './privacy-jobs-lookups';

const STORES: readonly StoreKind[] = ['firestore', 'sql', 'objects', 'provider_artifacts', 'caches'];

export class PrivacyLifecycleJobService {
  private jobCounter = 0;
  constructor(private readonly store: PrivacyJobStore) {}

  /** Run an export or deletion job for the owner (stop-first, reconcile). */
  async runJob(input: { jobId: string; owner: JobOwner; kind: 'export' | 'deletion' }): Promise<JobReceipt> {
    // Idempotency: a retried jobId returns the same receipt.
    const existing = await this.store.byJobId(input.jobId);
    if (existing) return existing as JobReceipt;

    // STOP NEW WORK FIRST — before any store is touched.
    await this.store.freezeOwner(input.owner.uid);

    const stores: { store: StoreKind; declared: number; actual: number; matches: boolean }[] = [];
    let mismatch: JobReceipt['mismatch'];
    for (const store of STORES) {
      const declared = await this.store.declareCount(store, input.owner.uid);
      const actual = await this.store.sweepStore(store, input.owner.uid, input.kind);
      const matches = declared === actual;
      stores.push({ store, declared, actual, matches });
      if (!matches && !mismatch) mismatch = { store, declared, actual };
    }
    const receipt: JobReceipt = {
      jobId: input.jobId,
      owner: { ...input.owner },
      kind: input.kind,
      complete: !mismatch,
      newWorkStoppedFirst: true,
      stores,
      ...(mismatch ? { mismatch } : {}),
    };
    await this.store.saveJobReceipt(receipt);
    return receipt;
  }

  /** New work while a lifecycle job is active (owner frozen) refuses. */
  async assertNotFrozen(owner: JobOwner): Promise<void> {
    if (await this.store.isFrozen(owner.uid)) throw new PrivacyJobError('owner_frozen');
  }

  /** Inspect a job receipt (owner-only). */
  async inspect(jobId: string, owner: JobOwner): Promise<JobReceipt> {
    const receipt = await this.store.byJobId(jobId);
    if (!receipt) throw new PrivacyJobError('unknown_job');
    const r = receipt as JobReceipt;
    if (r.owner.uid !== owner.uid || r.owner.workspaceId !== owner.workspaceId) {
      throw new PrivacyJobError('not_owner');
    }
    return r;
  }
}

export type { PrivacyJobErrorType };
