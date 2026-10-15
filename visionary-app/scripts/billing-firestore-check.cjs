// Bounded persistence probe in one randomly named, test-owned document.
// No auth/account/subscription records are created, read, or deleted.
const fs = require('node:fs'), path = require('node:path'), { createRequire } = require('node:module'), { randomUUID } = require('node:crypto'), { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..'), req = createRequire(path.join(root, 'backend/upstream/backend/package.json'));
const { ConfigService } = req('@nestjs/config');
const { FirebaseAdminService } = req('./dist/src/auth/firebase/firebase-admin.service.js');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
const settings = req('dotenv').parse(fs.readFileSync(path.join(root, 'backend/upstream/backend/.env')));
const admin = new FirebaseAdminService(new ConfigService(settings)), auth = new FirebaseProductService(admin, new ConfigService(settings));
const readId = process.argv[2];
if (readId && !/^[a-f0-9-]{36}$/.test(readId)) throw Error('Invalid probe identity.');
(async () => {
  const ref = auth.getDatabase().collection('visionary_billing_test_checks').doc(readId || randomUUID());
  try {
    if (readId) { const result = (await ref.get()).data(); process.stdout.write(JSON.stringify({ persisted: result?.count === 8 })); return; }
    await ref.create({ purpose: 'billing-persistence-probe', count: 0 });
    await Promise.all(Array.from({ length: 8 }, () => auth.getDatabase().runTransaction(async tx => {
      const previous = await tx.get(ref); tx.update(ref, { count: previous.data().count + 1 });
    }, { maxAttempts: 10 })));
    const otherProcess = spawnSync(process.execPath, [__filename, ref.id], { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 60000 });
    if (otherProcess.status !== 0 || JSON.parse(otherProcess.stdout).persisted !== true) throw Error('Independent persistence read failed.');
    console.log(JSON.stringify({ concurrentTransactions: 8, independentProcessRead: true, accountRecordsTouched: 0 }));
  } finally {
    if (!readId) await ref.delete();
    await auth.onModuleDestroy(); await admin.onModuleDestroy();
  }
})().catch(() => { console.error('Billing persistence probe failed; credentials and raw database output withheld.'); process.exitCode = 1; });
