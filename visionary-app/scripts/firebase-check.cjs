const path = require('node:path');
const { createRequire } = require('node:module');
const fs = require('node:fs');
const root = path.resolve(__dirname, '..');
const backend = path.join(root, 'backend/upstream/backend');
const backendRequire = createRequire(path.join(backend, 'package.json'));
const servicePath = path.join(backend, 'dist/src/auth/firebase/firebase-admin.service.js');
if (!fs.existsSync(servicePath)) {
  console.error('Build the backend before running the Firebase connection check.');
  process.exit(1);
}
const { ConfigService } = backendRequire('@nestjs/config');
const { FirebaseAdminService, firebaseAdminSettings } = require(servicePath);
const environmentFile = path.join(backend, '.env');
const local = fs.existsSync(environmentFile) ? backendRequire('dotenv').parse(fs.readFileSync(environmentFile)) : {};
const config = new ConfigService({ ...local, ...process.env });
let service;
let timer;
let firestore;
(async () => {
  const settings = firebaseAdminSettings(config);
  // Never dump user records, provider secrets, credential contents or SDK errors.
  if (settings.kind === 'emulator') throw new Error('Use emulator tests for demo projects; this command checks the configured live project.');
  service = new FirebaseAdminService(config);
  const auth = service.getAuth();
  const result = await Promise.race([
    auth.listUsers(1),
    new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error('Connection check timed out.'), { code: 'check/timeout' })), 25000); }),
  ]);
  console.log(`PASS: read-only Firebase Admin access for ${settings.projectId}; ${result.users.length === 0 ? 'Users list is empty' : 'at least one account exists (no account data displayed)'}.`);
  if (process.argv.includes('--firestore')) {
    clearTimeout(timer);
    if (process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Live Firestore probe cannot use an emulator.');
    const databaseId = config.get('FIRESTORE_DATABASE_ID') || '(default)';
    firestore = backendRequire('firebase-admin/firestore').getFirestore(auth.app, databaseId);
    await Promise.race([
      firestore.doc('visionary_accounts/connection-probe-never-written').get(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error('Connection check timed out.'), { code: 'check/timeout' })), 25000); }),
    ]);
    console.log(`PASS: read-only Firestore access for database ${databaseId}; no account profile displayed or written.`);
  }
})().catch(error => {
  const code = typeof error.code === 'string' && /^[a-z0-9_/-]+$/i.test(error.code) ? error.code : 'check/configuration-or-access';
  console.error(`Firebase read-only check failed (${code}). Verify the local project/credential and required Firebase Auth permissions. No account mutation was requested.`);
  process.exitCode = 1;
}).finally(async () => {
  clearTimeout(timer);
  if (firestore) await firestore.terminate();
  if (service) await service.onModuleDestroy();
  // The SDK may retain a pending HTTP retry after the bounded probe timeout.
  if (process.exitCode) process.exit(process.exitCode);
});
