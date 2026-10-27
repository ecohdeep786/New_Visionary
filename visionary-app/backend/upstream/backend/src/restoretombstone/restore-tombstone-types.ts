// PRIV-03 (KAN-112) — restore against deletion/consent tombstones and current
// policy, so backup recovery cannot revive prohibited access or erased derived
// records.
//
// The checkpoint here is honest backup recovery:
//   - DELETION TOMBSTONES WIN: a record the owner erased stays erased — a
//     backup restore drops it (never resurrects erased data).
//   - CONSENT TOMBSTONES WIN: learning-data records for a consent-revoked
//     learner are dropped on restore (revoked consent cannot be undone by a
//     backup).
//   - CURRENT POLICY WINS: restored records are re-validated against the
//     CURRENT policy (not the backup-era policy); a record the current policy
//     forbids (e.g. a now-forbidden field) is dropped per current policy.
//   - DERIVED RECORDS ARE NEVER REVIVED: caches/artifacts erased before the
//     backup stay erased — restore brings back primary data only; derived
//     state regenerates under current policy.
//   - HONEST RECEIPT: per-class restored/dropped counts with reasons; raw
//     private text inside a backup record refuses the whole record.
//   - Wrong users denied; fail closed.
//
// Exit: real-user data has enforceable access, lifecycle and support
// procedures.

/** The authenticated restore caller. */
export interface RestoreOwner {
  uid: string;
  workspaceId: string;
}

/** A tombstone that outlives backups. */
export interface Tombstone {
  ownerUid: string;
  dataClass: string;
  kind: 'deletion' | 'consent_revocation';
  at: string;
}

/** One record inside a backup being restored. */
export interface BackupRecord {
  dataClass: string;
  payload: Record<string, unknown>;
  /** The policy version the backup was taken under. */
  backupPolicyVersion: string;
}

/** The honest restore receipt. */
export interface RestoreReceipt {
  backupId: string;
  owner: RestoreOwner;
  restored: number;
  dropped: number;
  drops: readonly { dataClass: string; reason: 'deletion_tombstone' | 'consent_revocation' | 'current_policy' | 'raw_private_text' | 'derived_not_revived' }[];
}

export class RestoreError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'raw_private_text'
      | 'unknown_tombstone'
  ) {
    super(code);
  }
}
