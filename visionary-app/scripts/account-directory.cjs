// Inspect by default. Apply only regenerable directory metadata; verify current
// records without printing identifiers, private values or SDK errors.
const fs = require('node:fs'), path = require('node:path'), { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..'), req = createRequire(path.join(root, 'backend/upstream/backend/package.json'));
const flags = process.argv.slice(2);
if (flags.some(flag => !['--apply', '--verify'].includes(flag)) || flags.includes('--apply') && flags.includes('--verify')) throw Error('Use no flags to inspect, --apply to add directory metadata, or --verify for a read-only current-tree audit.');
const { ConfigService } = req('@nestjs/config');
const { FirebaseAdminService } = req('./dist/src/auth/firebase/firebase-admin.service.js');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const { accountRows } = req('./dist/src/auth/firebase-product/account-migration.js');
const { reconcileAccountDirectory } = req('./dist/src/auth/firebase-product/account-directory.js');
const { verifyAccountTree } = req('./dist/src/auth/firebase-product/account-tree-verifier.js');
const config = new ConfigService(req('dotenv').parse(fs.readFileSync(path.join(root, 'backend/upstream/backend/.env'))));
const admin = new FirebaseAdminService(config), auth = new FirebaseProductService(admin, config);
(async () => {
  const apply = flags.includes('--apply'), verify = flags.includes('--verify');
  const totals = { mode: verify ? 'verify' : apply ? 'apply' : 'inspect', accounts: 0, directoryChanges: 0, writes: 0, devices: 0, events: 0, invoices: 0, commands: 0, directoryDifferences: 0, ownershipConflicts: 0, recordDifferences: 0, deletions: 0, providerCalls: 0 };
  try {
    const db = auth.getDatabase();
    for await (const account of accountRows(db.collection('visionary_accounts'))) {
      // Existence/UID binding is checked against Firebase Auth, never email/name.
      if ((await admin.getAuth().getUser(account.id)).uid !== account.id) throw Error('Identity mismatch');
      if (verify) {
        const checked = await verifyAccountTree(db, account.id);
        for (const [key, value] of Object.entries(checked)) totals[key] += value;
      } else {
        const checked = await reconcileAccountDirectory(db, account.id, apply);
        totals.accounts++; totals.directoryChanges += Number(checked.changed); totals.writes += Number(checked.written);
      }
    }
    console.log(JSON.stringify(totals));
    if (totals.directoryDifferences || totals.ownershipConflicts || totals.recordDifferences) process.exitCode = 1;
  } finally { await auth.onModuleDestroy(); await admin.onModuleDestroy(); }
})().catch(() => { console.error('Account directory operation stopped; private details withheld. Existing activity is retained. Check the account UID/schema and local configuration.'); process.exitCode = 1; });
