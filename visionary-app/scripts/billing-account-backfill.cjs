// Add only missing Free-account metadata to verified, existing product accounts.
// Default is read-only; --apply is explicit. Never calls a payment provider.
const fs = require('node:fs'), path = require('node:path'), { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..'), req = createRequire(path.join(root, 'backend/upstream/backend/package.json'));
const { ConfigService } = req('@nestjs/config');
const { FirebaseAdminService } = req('./dist/src/auth/firebase/firebase-admin.service.js');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const { BILLING_ACCOUNTS, freeBillingAccount } = req('./dist/src/billing/billing-account.js');
if (process.argv.slice(2).some(value => value !== '--apply')) throw Error('Use no flag for inspection or --apply for missing defaults.');
const settings = req('dotenv').parse(fs.readFileSync(path.join(root, 'backend/upstream/backend/.env')));
if (settings.BILLING_MODE !== 'test') throw Error('This backfill is for the current test billing ledger only.');
const config = new ConfigService(settings), admin = new FirebaseAdminService(config), auth = new FirebaseProductService(admin, config);
(async () => {
  const apply = process.argv.includes('--apply'), totals = { mode: apply ? 'apply' : 'inspect', checked: 0, created: 0, metadataUpdated: 0, unchanged: 0, ineligible: 0, conflicts: 0, providerCalls: 0 };
  try {
    const db = auth.getDatabase(), accounts = await db.collection('visionary_accounts').limit(101).get();
    if (accounts.size > 100) throw Error('This bounded backfill requires pagination before use above 100 accounts.');
    for (const account of accounts.docs) {
      totals.checked++;
      let identity;
      try { identity = await admin.getAuth().getUser(account.id); }
      catch (error) { if (error.code === 'auth/user-not-found') { totals.ineligible++; continue; } throw error; }
      if (identity.disabled || !identity.emailVerified || identity.uid !== account.id) { totals.ineligible++; continue; }
      const ref = db.collection(BILLING_ACCOUNTS).doc(identity.uid);
      const result = await db.runTransaction(async tx => {
        const snapshot = await tx.get(ref), data = snapshot.data();
        if (data?.uid && data.uid !== identity.uid) return 'conflicts';
        if (!data) { if (apply) tx.create(ref, freeBillingAccount(identity.uid)); return 'created'; }
        if (data.uid !== identity.uid || data.basePlan !== 'start') {
          if (apply) tx.set(ref, { ...data, uid: identity.uid, basePlan: 'start', schemaVersion: 1 });
          return 'metadataUpdated';
        }
        return 'unchanged';
      });
      totals[result]++;
    }
    console.log(JSON.stringify(totals));
    if (totals.conflicts) process.exitCode = 1;
  } finally { await auth.onModuleDestroy(); await admin.onModuleDestroy(); }
})().catch(() => { console.error('Free-account backfill did not complete; account identifiers and credentials withheld.'); process.exitCode = 1; });
