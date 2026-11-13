import type { Firestore, Transaction, DocumentReference } from 'firebase-admin/firestore';
import { digest } from './privacy-policy';
import { ErasureRequest, PolicySnapshot, PrivacyControlStore, PrivacyTransaction, Restriction } from './privacy-core-types';
/** Actual Firestore control metadata only. No method publishes policy approval,
 * grants a role, deletes user records, or marks downstream erasure complete. */
export class FirestorePrivacyStore implements PrivacyControlStore {
  private readonly root: DocumentReference;
  constructor(private readonly db: Firestore, namespace: string) {
    if (!/^[a-z][a-z0-9-]{1,62}$/.test(namespace)) throw Error('Explicit privacy control namespace required.');
    this.root = db.collection('visionary_privacy_control').doc(namespace);
  }
  transaction<T>(work: (tx: PrivacyTransaction) => Promise<T>): Promise<T> {
    return this.db.runTransaction(async transaction => work(this.adapter(transaction)), { maxAttempts: 4 });
  }
  private adapter(tx: Transaction): PrivacyTransaction {
    const ref = (collection: string, id: string) => this.root.collection(collection).doc(id);
    const get = async (collection: string, id: string) => (await tx.get(ref(collection, id))).data();
    return {
      policy: async () => await get('policies', 'current') as PolicySnapshot | undefined,
      restriction: async uid => await get('restrictions', digest(uid)) as Restriction | undefined,
      request: async id => await get('requests', id) as ErasureRequest | undefined,
      subject: async uid => {
        // Current account facts stay in the account authority. This control
        // plane never copies age/identity into a second mutable subject store.
        const account = (await tx.get(this.db.collection('visionary_accounts').doc(uid))).data();
        const ack = await get('acknowledgements', digest(uid));
        if (!account || account.uid !== uid || account.identity?.uid !== uid || account.storageVersion !== 2 || account.storageMigration?.status === 'copying' || account.onboarding?.status !== 'complete') return undefined;
        return { uid, ageBand: account.profile?.age_band ?? 'unknown', assurance: 'declared', status: ack?.status,
          policyVersion: ack?.policyVersion, policyDigest: ack?.policyDigest, acknowledgementUid: ack?.uid, acknowledgementPurpose: ack?.purpose,
          expiresAt: ack?.expiresAt, revokedAt: ack?.revokedAt };
      },
      artifactProposal: id => get('artifactProposals', id), artifact: id => get('artifacts', id),
      createRequest: request => { tx.create(ref('requests', request.id), request); },
      restrict: restriction => { tx.create(ref('restrictions', digest(restriction.uid)), restriction); },
      createArtifact: (id, value) => { tx.create(ref('artifacts', id), value); },
    };
  }
}
