import { FieldPath, Timestamp } from 'firebase-admin/firestore';
import { isDeepStrictEqual } from 'node:util';
import { ACCOUNT_STORAGE_VERSION, BILLING_QUEUE, LEGACY_BILLING_ACCOUNTS, accountDocument, accountPath, billingDocument, deviceDocument, deviceRecord, eventDocument } from './account-storage';
import { freeBillingAccount } from '../../billing/billing-account';

// Offline, additive migration. Original records are retained. No provider calls.
export async function* accountRows(collection: any) {
  let cursor;
  for (;;) {
    let query = collection.orderBy(FieldPath.documentId()).limit(100);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    for (const row of page.docs) yield row;
    if (page.docs.length < 100) return;
    cursor = page.docs.at(-1);
  }
}

export async function migrateAccount(db: any, uid: string, identity: any, apply = false) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid) || identity.uid !== uid) throw Error('Identity conflict');
  const root = accountDocument(db, uid), original = await root.get();
  const result = { accounts: 1, copied: 0, existing: 0, completed: 0, alreadyMigrated: 0 };
  if (!original.exists || original.data().uid && original.data().uid !== uid) throw Error('Account identity conflict');
  if (original.data().storageVersion === ACCOUNT_STORAGE_VERSION && original.data().storageMigration?.status !== 'copying') return { ...result, alreadyMigrated: 1 };
  if (apply) await db.runTransaction(async tx => {
    const current = (await tx.get(root)).data();
    if (current.uid && current.uid !== uid) throw Error('Account changed');
    tx.set(root, { ...current, storageMigration: { status: 'copying', version: ACCOUNT_STORAGE_VERSION } });
  });
  const copy = async (target: any, value: any) => {
    if (value.uid && value.uid !== uid || value.billingAccountId && value.billingAccountId !== uid) throw Error('Child identity conflict');
    await db.runTransaction(async tx => {
      const saved = await tx.get(target);
      if (saved.exists) {
        if (!isDeepStrictEqual(saved.data(), value)) throw Error('Destination differs; original retained');
        result.existing++;
      } else { if (apply) tx.create(target, value); result.copied++; }
    });
  };
  const legacy = db.collection(LEGACY_BILLING_ACCOUNTS).doc(uid), oldBilling = await legacy.get();
  const billing = billingDocument(db, uid), billingData = oldBilling.exists ? oldBilling.data() : (await billing.get()).data() || freeBillingAccount(uid, original.data().createdAt?.toMillis?.() || 0);
  if (billingData.uid && billingData.uid !== uid) throw Error('Billing identity conflict');
  await copy(billing, { ...billingData, uid, basePlan: billingData.basePlan || 'start', schemaVersion: 1 });
  for (const name of ['commands', 'invoices']) {
    for await (const row of accountRows(db.collection(`${LEGACY_BILLING_ACCOUNTS}/${uid}/${name}`))) {
      await copy(db.collection(`${accountPath(uid)}/billing/test/${name}`).doc(row.id), row.data());
    }
  }
  // Keep lookup/history collections for compatibility and security operations.
  const events = new Map();
  for await (const row of accountRows(db.collection('visionary_auth_events').where('uid', '==', uid))) {
    const data = row.data(); if (data.type === 'sign_in') events.set(data.sessionId, data);
    await copy(eventDocument(db, uid, row.id), data);
  }
  for await (const row of accountRows(db.collection('visionary_auth_sessions').where('uid', '==', uid))) {
    const session = row.data(), event = events.get(row.id);
    if (!Number.isFinite(session.lastSeen) || !Number.isFinite(session.expires)) throw Error('Invalid retained session');
    await copy(deviceDocument(db, uid, row.id), deviceRecord(uid, row.id, { ...event, ...session }));
  }
  if (apply) await db.runTransaction(async tx => {
    const current = (await tx.get(root)).data();
    if (current.version !== original.data().version || current.lastSignInAt?.toMillis?.() !== original.data().lastSignInAt?.toMillis?.()) throw Error('Writer detected during offline migration');
    tx.set(root, { ...current, uid, storageVersion: ACCOUNT_STORAGE_VERSION,
      identity: { uid, email: identity.email || current.email || '', emailVerified: identity.emailVerified === true, disabled: identity.disabled === true,
        providerIds: (identity.providerData || []).map((provider: any) => provider.providerId), lastVerifiedAt: Timestamp.now() },
      storageMigration: { status: 'complete', version: ACCOUNT_STORAGE_VERSION, legacyRetained: true, completedAt: Timestamp.now() } });
    if (Number.isFinite(billingData.nextSyncAt) && billingData.nextSyncAt > 0) tx.set(db.collection(BILLING_QUEUE).doc(uid), { uid, nextSyncAt: billingData.nextSyncAt, revision: billingData.revision || 0 });
  });
  result.completed = 1;
  return result;
}
