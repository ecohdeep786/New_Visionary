// Additive UID-tree upgrade. Never deletes original data or contacts Razorpay.
const fs = require('node:fs'), path = require('node:path'), net = require('node:net'), { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..'), req = createRequire(path.join(root, 'backend/upstream/backend/package.json'));
const flags = process.argv.slice(2);
if (flags.some(flag => !['--apply', '--offline'].includes(flag)) || flags.includes('--apply') && !flags.includes('--offline')) throw Error('Inspect with no flags; apply requires --apply --offline after stopping all writers.');
const configData = req('dotenv').parse(fs.readFileSync(path.join(root, 'backend/upstream/backend/.env')));
if (configData.BILLING_MODE !== 'test') throw Error('Only the current test-billing storage upgrade is supported.');
const { ConfigService } = req('@nestjs/config');
const { FirebaseAdminService } = req('./dist/src/auth/firebase/firebase-admin.service.js');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const { accountRows, migrateAccount } = req('./dist/src/auth/firebase-product/account-migration.js');
const config = new ConfigService(configData), admin = new FirebaseAdminService(config), auth = new FirebaseProductService(admin, config);
const listening = port => new Promise(resolve => { const socket = net.connect({ host: '127.0.0.1', port }); socket.setTimeout(1500); socket.once('connect', () => { socket.destroy(); resolve(true); }); socket.once('error', () => resolve(false)); socket.once('timeout', () => { socket.destroy(); resolve(false); }); });
(async () => {
  const apply = flags.includes('--apply'), totals = { mode: apply ? 'apply' : 'inspect', accounts: 0, copied: 0, existing: 0, completed: 0, alreadyMigrated: 0, providerCalls: 0, deleted: 0 };
  try {
    if (apply && (process.env.K_SERVICE || await listening(Number(configData.AUTH_PORT || 3001)))) throw Error('Stop all account/billing writers before applying.');
    const db = auth.getDatabase();
    for await (const account of accountRows(db.collection('visionary_accounts'))) {
      const identity = await admin.getAuth().getUser(account.id);
      const result = await migrateAccount(db, account.id, identity, apply);
      for (const key of ['accounts', 'copied', 'existing', 'completed', 'alreadyMigrated']) totals[key] += result[key];
    }
    console.log(JSON.stringify(totals));
  } finally { await auth.onModuleDestroy(); await admin.onModuleDestroy(); }
})().catch(() => { console.error('Account storage upgrade stopped. Original records retained; private details withheld. Check offline state and destination conflicts.'); process.exitCode = 1; });
