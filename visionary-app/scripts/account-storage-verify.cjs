// Independent read-only verification. Prints counters, never user details.
const fs = require('node:fs'), path = require('node:path'), { createRequire } = require('node:module'), { isDeepStrictEqual } = require('node:util');
const root = path.resolve(__dirname, '..'), req = createRequire(path.join(root, 'backend/upstream/backend/package.json'));
if (process.argv.length !== 2) throw Error('This verifier accepts no arguments.');
const { ConfigService } = req('@nestjs/config'), { FirebaseAdminService } = req('./dist/src/auth/firebase/firebase-admin.service.js'), { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const { accountRows } = req('./dist/src/auth/firebase-product/account-migration.js'), { billingDocument, accountPath, deviceRecord, BILLING_QUEUE, LEGACY_BILLING_ACCOUNTS } = req('./dist/src/auth/firebase-product/account-storage.js');
const config = new ConfigService(req('dotenv').parse(fs.readFileSync(path.join(root, 'backend/upstream/backend/.env')))), admin = new FirebaseAdminService(config), auth = new FirebaseProductService(admin, config);
(async () => {
  const counts = { accounts: 0, invoices: 0, commands: 0, events: 0, devices: 0, uidConflicts: 0, differences: 0, writes: 0, providerCalls: 0 };
  try {
    const db = auth.getDatabase();
    for await (const account of accountRows(db.collection('visionary_accounts'))) {
      counts.accounts++; const uid = account.id, data = account.data(), identity = await admin.getAuth().getUser(uid);
      if (identity.uid !== uid || data.uid !== uid || data.identity?.uid !== uid || data.storageVersion !== 2 || data.storageMigration?.status === 'copying') counts.uidConflicts++;
      const billing = await billingDocument(db, uid).get(), legacy = await db.collection(LEGACY_BILLING_ACCOUNTS).doc(uid).get();
      if (billing.data()?.uid !== uid) counts.uidConflicts++;
      if (legacy.exists && !isDeepStrictEqual(legacy.data(), billing.data())) counts.differences++;
      if (billing.data()?.nextSyncAt > 0) { const queue = (await db.collection(BILLING_QUEUE).doc(uid).get()).data(); if (queue?.nextSyncAt !== billing.data().nextSyncAt) counts.differences++; }
      for (const name of ['commands', 'invoices']) {
        for await (const row of accountRows(db.collection(`${LEGACY_BILLING_ACCOUNTS}/${uid}/${name}`))) {
          const target = await db.collection(`${accountPath(uid)}/billing/test/${name}`).doc(row.id).get();
          if (!target.exists || !isDeepStrictEqual(row.data(), target.data())) counts.differences++;
        }
        for await (const row of accountRows(db.collection(`${accountPath(uid)}/billing/test/${name}`))) { counts[name]++; if (row.data().uid && row.data().uid !== uid || row.data().billingAccountId && row.data().billingAccountId !== uid) counts.uidConflicts++; }
      }
      const events = new Map();
      for await (const row of accountRows(db.collection('visionary_auth_events').where('uid', '==', uid))) {
        counts.events++; if (row.data().type === 'sign_in') events.set(row.data().sessionId, row.data());
        const saved = await db.collection(`${accountPath(uid)}/authEvents`).doc(row.id).get();
        if (!saved.exists || !isDeepStrictEqual(saved.data(), row.data())) counts.differences++;
      }
      for await (const row of accountRows(db.collection('visionary_auth_sessions').where('uid', '==', uid))) {
        counts.devices++; const saved = await db.collection(`${accountPath(uid)}/devices`).doc(row.id).get();
        const expected = deviceRecord(uid, row.id, { ...events.get(row.id), ...row.data() });
        if (!saved.exists || !isDeepStrictEqual(saved.data(), expected) || saved.data()?.cookieHash) counts.differences++;
      }
    }
    console.log(JSON.stringify(counts)); if (counts.uidConflicts || counts.differences) process.exitCode = 1;
  } finally { await auth.onModuleDestroy(); await admin.onModuleDestroy(); }
})().catch(() => { console.error('Account storage verification failed; private details withheld.'); process.exitCode = 1; });
