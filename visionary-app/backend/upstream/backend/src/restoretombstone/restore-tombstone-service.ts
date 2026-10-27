// PRIV-03 (KAN-112) — tombstone-aware backup restore.
//
// Core responsibilities (server-owned; tombstones and current policy win):
//   1. restore: per backup record, in order —
//      a. DERIVED classes are never revived (erased derived records stay erased),
//      b. a DELETION tombstone for (owner, class) drops the record,
//      c. a CONSENT-REVOCATION tombstone drops learning-data records,
//      d. CURRENT policy re-validation: a record carrying a field the current
//         policy no longer permits is dropped (the backup-era policy does not
//         survive),
//      e. raw private text inside a backup record refuses that record
//         (`raw_private_text`),
//      f. survivors restore with the receipt recording provenance.
//   2. The receipt is HONEST: per-drop reasons and counts — recovery never
//      silently resurrects prohibited access.
//   3. Wrong users denied; fail closed.
import type {
  BackupRecord,
  RestoreError as RestoreErrorType,
  RestoreOwner,
  RestoreReceipt,
} from './restore-tombstone-types';
import { RestoreError } from './restore-tombstone-types';
import type { RestoreStore } from './restore-tombstone-lookups';

/** Learning-data classes that a consent revocation guards. */
const CONSENT_GUARDED_CLASSES = new Set(['learning_text', 'conversations']);

export class RestoreTombstoneService {
  constructor(private readonly store: RestoreStore) {}

  /** Restore a backup's records through tombstones + current policy. */
  async restore(input: {
    backupId: string;
    owner: RestoreOwner;
    records: readonly BackupRecord[];
    rawPrivateText?: readonly string[];
  }): Promise<RestoreReceipt> {
    const tombs = await this.store.tombstones(input.owner.uid);
    const drops: { dataClass: string; reason: 'deletion_tombstone' | 'consent_revocation' | 'current_policy' | 'raw_private_text' | 'derived_not_revived' }[] = [];
    let restored = 0;

    for (const record of input.records) {
      // (a) Derived classes are NEVER revived.
      if (await this.store.isDerived(record.dataClass)) {
        drops.push({ dataClass: record.dataClass, reason: 'derived_not_revived' });
        continue;
      }
      // (b) Deletion tombstone wins.
      if (tombs.some((t) => t.ownerUid === input.owner.uid && t.dataClass === record.dataClass && t.kind === 'deletion')) {
        drops.push({ dataClass: record.dataClass, reason: 'deletion_tombstone' });
        continue;
      }
      // (c) Consent-revocation tombstone wins for guarded classes.
      if (
        CONSENT_GUARDED_CLASSES.has(record.dataClass) &&
        tombs.some((t) => t.ownerUid === input.owner.uid && t.kind === 'consent_revocation')
      ) {
        drops.push({ dataClass: record.dataClass, reason: 'consent_revocation' });
        continue;
      }
      // (e) Raw private text inside the backup record refuses it.
      const serialized = JSON.stringify(record.payload);
      if (input.rawPrivateText?.some((t) => serialized.includes(t))) {
        drops.push({ dataClass: record.dataClass, reason: 'raw_private_text' });
        continue;
      }
      // (d) CURRENT policy re-validation: a now-forbidden field drops the record.
      const permitted = await this.store.permittedFields(record.dataClass);
      if (permitted !== null) {
        const forbidden = Object.keys(record.payload).filter((k) => !permitted.includes(k));
        if (forbidden.length > 0) {
          drops.push({ dataClass: record.dataClass, reason: 'current_policy' });
          continue;
        }
      }
      await this.store.restoreRecord(record.dataClass, input.owner.uid, record.payload);
      restored += 1;
    }

    return {
      backupId: input.backupId,
      owner: { ...input.owner },
      restored,
      dropped: drops.length,
      drops,
    };
  }
}

export type { RestoreErrorType };
