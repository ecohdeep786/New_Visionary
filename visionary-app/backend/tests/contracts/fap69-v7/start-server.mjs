// Persistent local backend for journey development: disposable synthetic-mode
// SQL + registered FirebaseProductModule on 127.0.0.1:3001. Same environment
// contract as integrated-journey.mjs. Keeps running until killed.
import { resolve, join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import fixture from '../data-02/postgres-fixture.cjs';
const { req, backend, stagingDatabase } = fixture;
const root = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
// Explicit local targets only (loopback emulators, disposable kan42 database,
// preview origin) — the same values the journey gate validates.
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:58042';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:59042';
process.env.DATA_TEST_DATABASE_URL ||= 'postgresql://postgres:visionlocal@127.0.0.1:5433/visionary_data_test_kan42?schema=public';
process.env.FRONTEND_ORIGIN ||= 'http://127.0.0.1:5176';
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST, firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
const dbUrl = process.env.DATA_TEST_DATABASE_URL, origin = process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5176';
if (!authHost?.includes('127.0.0.1') || !firestoreHost?.includes('127.0.0.1') || !dbUrl?.includes('/visionary_data_test_kan42')) {
  throw Error('start-server requires the explicit local emulator and disposable SQL targets.');
}
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;
const f = await stagingDatabase();
const { MigrationRunner } = req('./dist/src/data/migration-runner.js');
const { canonicalMigrations } = req('./dist/src/data/migration-registry.js');
await new MigrationRunner(f.store(), canonicalMigrations(backend)).applyAll();
await f.grantRuntime();
Object.assign(process.env, {
  NODE_ENV: 'test',
  FIREBASE_PROJECT_ID: 'demo-visionary-kan42', FIREBASE_PROJECT_KIND: 'emulator', FIRESTORE_DATABASE_ID: '(default)',
  AUTH_PUBLIC_ORIGIN: origin, AUTH_RATE_LIMIT_KEY: 'fap69-v7-journey-local-key-not-for-live-use!',
  AUTH_GLOBAL_LOGOUT_ENABLED: 'true',
  DATA_OVERVIEW_ENABLED: 'true', DATA_OVERVIEW_TEST_ENABLED: 'true',
  DATA_WORKSPACE_PROVISIONING_ENABLED: 'true', DATA_CONSENT_ENABLED: 'true',
  DATA_WORKSPACE_DATABASE_MODE: 'synthetic', DATA_WORKSPACE_ENVIRONMENT_ID: 'fap69-v7-journey',
  DATA_WORKSPACE_RUNTIME_URL: f.config.runtimeUrl + '&pool_timeout=5&connect_timeout=5',
  DATA_WORKSPACE_RUNTIME_ROLE: f.runtimeRole, DATA_WORKSPACE_SCHEMA: f.schema,
});
req('reflect-metadata');
const { NestFactory } = req('@nestjs/core');
const { FirebaseProductModule } = req('./dist/src/auth/firebase-product/firebase-product.module.js');
let app = await NestFactory.create(FirebaseProductModule, { logger: false });
app.use(req('cookie-parser')());
app.setGlobalPrefix('api');
await app.listen(3001, '127.0.0.1');
await writeFile(join(root, 'artifacts/qa/fap69-v7/server-ready.json'), JSON.stringify({ schema: f.schema, at: new Date().toISOString() }, null, 2));
console.log(`backend ready on 127.0.0.1:3001 schema=${f.schema}`);
let closing = false;
const shutdown = async () => {
  if (closing) return; closing = true;
  try { await app.close(); await f.close(); } catch {} process.exit(0);
};
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
