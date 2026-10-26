import { FieldValue, Firestore } from 'firebase-admin/firestore';
import { canonicalProvisionTarget, hash, ProvisionError, ProvisionIdentity } from './provision-types';
import type { ProvisionLinkStore } from './provision-store';
/** Account/profile/billing are read-only; only dedicated commands and links are written. */
export class FirestoreProvisionLinks implements ProvisionLinkStore {
  constructor(private readonly db: Firestore, private readonly projectId: string) {}
  private refs(i: ProvisionIdentity) {
    if (this.projectId !== i.target.firebaseProject || this.db.databaseId !== i.target.firebaseDatabase ||
      (process.env.FIRESTORE_EMULATOR_HOST ? 'emulator' : 'live') !== i.target.firestoreMode) throw new ProvisionError('CONFLICT', 409);
    const account = this.db.collection('visionary_accounts').doc(i.uid);
    if (i.target.environment === 'production') return { account, command: account.collection('workspaceProvisionCommands').doc(i.key), link: account.collection('domainLinks').doc('connections') };
    const link = account.collection('developmentWorkspaceLinks').doc(i.targetKey);
    return { account, command: link.collection('commands').doc(i.key), link };
  }
  private check(data: any, i: ProvisionIdentity, command = false) {
    if (!data || data.uid !== i.uid || data.schemaVersion !== 1 || data.domain !== 'personal-workspace' || data.targetKey !== i.targetKey || hash(canonicalProvisionTarget(data.target)) !== i.targetKey || !['pending', 'provisioned'].includes(data.status) || (command && (data.commandKey !== i.key || data.payloadDigest !== i.digest))) throw new ProvisionError('CONFLICT', 409);
    if (data.status === 'provisioned' ? typeof data.personalWorkspaceId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(data.personalWorkspaceId) : data.personalWorkspaceId !== undefined) throw new ProvisionError('CONFLICT', 409);
  }
  private account(data: any, i: ProvisionIdentity) {
    if (!data || data.uid !== i.uid || data.identity?.uid !== i.uid || data.storageVersion !== 2) throw new ProvisionError('WRONG_OWNER', 403);
    if (data.storageMigration?.status === 'copying') throw new ProvisionError('UNAVAILABLE', 503);
  }
  async begin(i: ProvisionIdentity) {
    const r = this.refs(i);
    return this.db.runTransaction(async tx => {
      const [account, command, link] = await tx.getAll(r.account, r.command, r.link);
      this.account(account.data(), i);
      if (link.exists) this.check(link.data(), i);
      if (command.exists) { this.check(command.data(), i, true); return { recovered: command.data()!.status === 'pending' }; }
      const common = { uid: i.uid, domain: 'personal-workspace', schemaVersion: 1, targetKey: i.targetKey, target: { ...i.target }, status: 'pending', updatedAt: FieldValue.serverTimestamp() };
      tx.create(r.command, { ...common, commandKey: i.key, payloadDigest: i.digest, createdAt: FieldValue.serverTimestamp() });
      if (!link.exists) tx.create(r.link, common);
      return { recovered: false };
    }, { maxAttempts: 5 });
  }
  async complete(i: ProvisionIdentity, workspaceId: string) {
    const r = this.refs(i);
    await this.db.runTransaction(async tx => {
      const [account, command, link] = await tx.getAll(r.account, r.command, r.link);
      this.account(account.data(), i);
      this.check(command.data(), i, true); this.check(link.data(), i);
      for (const data of [command.data(), link.data()]) if (data?.personalWorkspaceId && data.personalWorkspaceId !== workspaceId) throw new ProvisionError('CONFLICT', 409);
      const completed = { status: 'provisioned', personalWorkspaceId: workspaceId, store: 'postgresql', updatedAt: FieldValue.serverTimestamp() };
      tx.update(r.command, completed); tx.update(r.link, completed);
    }, { maxAttempts: 5 });
  }
}
