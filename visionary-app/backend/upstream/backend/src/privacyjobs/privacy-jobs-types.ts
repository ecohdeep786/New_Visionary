// PRIV-02 (KAN-111) — authenticated bounded export/deletion jobs across
// Firestore, SQL, objects, provider artifacts and caches; stop new
// work/downloads first and verify completion/reconciliation.
//
// The checkpoint here is honest lifecycle-job execution:
//   - AUTHENTICATED: a job runs only for its owner (uid+workspace); a stranger
//     cannot run or inspect another's job.
//   - STOP NEW WORK FIRST: before any store is touched, the owner's new-work
//     authorization is frozen (KAN-85/KAN-91 revocation composition) — no new
//     data can appear mid-job to escape the sweep.
//   - BOUNDED, ACROSS ALL FIVE STORES: the job sweeps firestore, sql, objects,
//     provider_artifacts and caches, each store reporting its own count.
//   - RECONCILIATION: the job is COMPLETE only when every store confirms; a
//     store whose count mismatches the declared total marks the job
//     `incomplete` honestly with the store named — never a fake success.
//   - IDEMPOTENT: a retried job (same jobId) converges to the same receipt —
//     no duplicate export, no double deletion.
//
// Exit: real-user data has enforceable access, lifecycle and support
// procedures.

/** The job owner (authenticated caller). */
export interface JobOwner {
  uid: string;
  workspaceId: string;
}

/** The five store kinds every lifecycle job sweeps. */
export type StoreKind = 'firestore' | 'sql' | 'objects' | 'provider_artifacts' | 'caches';

/** Per-store reconciliation line. */
export interface StoreReconciliation {
  store: StoreKind;
  declared: number;
  actual: number;
  matches: boolean;
}

export type JobKind = 'export' | 'deletion';

export interface JobReceipt {
  jobId: string;
  owner: JobOwner;
  kind: JobKind;
  /** False until every store reconciles (honest completion). */
  complete: boolean;
  newWorkStoppedFirst: true;
  stores: readonly StoreReconciliation[];
  /** Present when incomplete: the reconciliation failure. */
  mismatch?: { store: StoreKind; declared: number; actual: number };
}

export class PrivacyJobError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_job'
      | 'owner_frozen'
  ) {
    super(code);
  }
}
