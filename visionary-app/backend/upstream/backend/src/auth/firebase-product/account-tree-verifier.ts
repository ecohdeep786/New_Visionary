import { isDeepStrictEqual } from 'node:util';
import { accountRows } from './account-migration';
import { accountDirectory, directoryDocument } from './account-directory';
import { accountPath, ACCOUNT_STORAGE_VERSION, billingDocument, deviceRecord, BILLING_QUEUE } from './account-storage';

// Current canonical invariants; intentionally does not compare billing against
// the retained historical migration source once current billing has advanced.
export async function verifyAccountTree(db: any, uid: string) {
  const expectedDirectory = accountDirectory(uid), root = accountPath(uid);
  const result = { accounts: 1, devices: 0, events: 0, invoices: 0, commands: 0, directoryDifferences: 0, ownershipConflicts: 0, recordDifferences: 0 };
  const account = (await db.collection('visionary_accounts').doc(uid).get()).data();
  if (!account || account.uid !== uid || account.identity?.uid !== uid || account.storageVersion !== ACCOUNT_STORAGE_VERSION || account.storageMigration?.status === 'copying') result.ownershipConflicts++;
  if (!isDeepStrictEqual((await directoryDocument(db, uid).get()).data(), expectedDirectory)) result.directoryDifferences++;
  const billing = (await billingDocument(db, uid).get()).data();
  if (!billing || billing.uid !== uid || billing.basePlan !== 'start') result.ownershipConflicts++;
  if (billing?.nextSyncAt > 0) {
    const queue = (await db.collection(BILLING_QUEUE).doc(uid).get()).data();
    // Family membership commands can advance billing.revision without changing
    // the schedule. The scheduler does not use queue.revision as authority.
    if (queue?.uid !== uid || queue?.nextSyncAt !== billing.nextSyncAt) result.recordDifferences++;
  }
  for (const kind of ['commands', 'invoices'] as const) {
    for await (const row of accountRows(db.collection(`${root}/billing/test/${kind}`))) {
      result[kind]++; const data = row.data();
      if (data.uid && data.uid !== uid || data.billingAccountId && data.billingAccountId !== uid) result.ownershipConflicts++;
    }
  }
  for await (const row of accountRows(db.collection('visionary_auth_sessions').where('uid', '==', uid))) {
    result.devices++;
    const device = (await db.collection(`${root}/devices`).doc(row.id).get()).data();
    if (!device || !isDeepStrictEqual(device, deviceRecord(uid, row.id, row.data(), device))) result.recordDifferences++;
    if (device && (device.uid !== uid || ['cookieHash', 'cookie', 'idToken', 'password'].some(key => key in device))) result.ownershipConflicts++;
  }
  for await (const row of accountRows(db.collection(`${root}/devices`))) {
    const session = (await db.collection('visionary_auth_sessions').doc(row.id).get()).data();
    if (row.data().uid !== uid || session?.uid !== uid) result.ownershipConflicts++;
  }
  for await (const row of accountRows(db.collection('visionary_auth_events').where('uid', '==', uid))) {
    result.events++;
    if (!isDeepStrictEqual((await db.collection(`${root}/authEvents`).doc(row.id).get()).data(), row.data())) result.recordDifferences++;
  }
  for await (const row of accountRows(db.collection(`${root}/authEvents`))) {
    const index = (await db.collection('visionary_auth_events').doc(row.id).get()).data();
    if (row.data().uid !== uid || index?.uid !== uid) result.ownershipConflicts++;
  }
  return result;
}
