// Manual browser gate: real Firebase Auth/Firestore emulators + disposable SQL
// through the registered FirebaseProductModule. No provider/session stubs.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import fixture from '../data-02/postgres-fixture.cjs';
const { req, backend, stagingDatabase } = fixture;
const root = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:58042' || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:59042' ||
    !process.env.DATA_TEST_DATABASE_URL?.includes('/visionary_data_test_kan42')) throw Error('Explicit KAN42 isolated emulator/database targets required.');
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
const origin = 'http://127.0.0.1:3042';
const f = await stagingDatabase(); let app, browser;
try {
  const { MigrationRunner } = req('./dist/src/data/migration-runner.js');
  const { canonicalMigrations } = req('./dist/src/data/migration-registry.js');
  await new MigrationRunner(f.store(), canonicalMigrations(backend)).applyAll(); await f.grantRuntime();
  Object.assign(process.env, { NODE_ENV: 'test', FIREBASE_PROJECT_ID: 'demo-visionary-kan42', FIREBASE_PROJECT_KIND: 'emulator',
    FIRESTORE_DATABASE_ID: '(default)', AUTH_PUBLIC_ORIGIN: origin, AUTH_RATE_LIMIT_KEY: 'kan42-synthetic-only-key-never-for-live',
    DATA_OVERVIEW_ENABLED: 'true', DATA_OVERVIEW_TEST_ENABLED: 'true', DATA_WORKSPACE_DATABASE_MODE: 'synthetic',
    DATA_WORKSPACE_ENVIRONMENT_ID: 'kan42-browser', DATA_WORKSPACE_RUNTIME_URL: f.config.runtimeUrl + '&pool_timeout=5&connect_timeout=5',
    DATA_WORKSPACE_RUNTIME_ROLE: f.runtimeRole, DATA_WORKSPACE_SCHEMA: f.schema });
  req('reflect-metadata');
  const { NestFactory } = req('@nestjs/core');
  const { FirebaseProductModule } = req('./dist/src/auth/firebase-product/firebase-product.module.js');
  const { FirebaseAdminService } = req('./dist/src/auth/firebase/firebase-admin.service.js');
  const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
  app = await NestFactory.create(FirebaseProductModule, { logger: false });
  app.use(req('cookie-parser')()); app.setGlobalPrefix('api');
  await app.listen(3042, '127.0.0.1');
  const admin = app.get(FirebaseAdminService).getAuth(), accounts = app.get(FirebaseProductService);
  const prefix = 'browser_' + Date.now();
  const users = [];
  for (const role of ['owner', 'member']) {
    const uid = prefix + '_' + role, email = uid + '@example.invalid', password = 'Synthetic-kan42-browser-only!';
    await admin.createUser({ uid, email, emailVerified: true, password, displayName: 'Synthetic ' + role });
    const response = await fetch('http://127.0.0.1:59042/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=synthetic', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const identity = await response.json(); assert.equal(response.status, 200);
    await f.db.person.create({ data: { uid } }); users.push({ uid, idToken: identity.idToken });
  }
  const w = await f.db.workspace.create({ data: { uid: users[0].uid, name: 'Verified SQL overview', slug: prefix } });
  await f.db.workspaceMembership.create({ data: { uid: users[1].uid, workspaceId: w.id, role: 'MEMBER', source: 'direct' } });
  await f.db.auditEvent.createMany({ data: Array.from({ length: 25 }, () => ({ uid: users[0].uid, workspaceId: w.id, operation: 'read-review', actorType: 'user', resourceType: 'workspace', outcome: 'SUCCESS', ip: 'private_marker' })) });
  const frontend = createRequire(resolve(process.env.KAN42_BROWSER_PACKAGE || join(root, 'frontend/package.json')));
  const { chromium } = frontend('playwright-core');
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
  const contexts = [], results = [];
  for (const user of users) {
    const context = await browser.newContext(); contexts.push(context); const page = await context.newPage();
    await page.goto(origin + '/api/auth/methods');
    const signedIn = await page.evaluate(async ({ idToken }) => {
      const csrf = await (await fetch('/api/auth/csrf')).json();
      const response = await fetch('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf.token }, body: JSON.stringify({ idToken }) });
      return { status: response.status, body: await response.json() };
    }, { idToken: user.idToken });
    assert.equal(signedIn.status, 201, JSON.stringify(signedIn.body));
    user.page = page;
    const overview = await page.evaluate(async uid => { const response = await fetch('/api/overview', { headers: { 'X-Visionary-Account': uid } }); return { status: response.status, cache: response.headers.get('Cache-Control'), body: await response.json() }; }, user.uid);
    assert.equal(overview.status, 200, JSON.stringify(overview.body)); assert.equal(overview.cache, 'no-store');
    assert.equal(overview.body.workspaces.items[0].role, user === users[0] ? 'OWNER' : 'MEMBER');
    assert.equal(JSON.stringify(overview.body).includes('private_marker'), false);
    results.push({ case: user === users[0] ? 'owner_sql_overview' : 'member_sql_overview', passed: true });
    await page.setExtraHTTPHeaders({ 'X-Visionary-Account': user.uid });
    await page.goto(origin + '/api/overview');
    await page.setExtraHTTPHeaders({});
  }
  const read = (user, path, uid = user.uid) => user.page.evaluate(async ({ path, uid }) => {
    const response = await fetch(path, { headers: { 'X-Visionary-Account': uid } }); return { status: response.status, body: await response.json() };
  }, { path, uid });
  const first = await read(users[0], '/api/overview/audit'); assert.equal(first.body.items.length, 20);
  assert.equal((await read(users[0], '/api/overview/audit?after=' + first.body.nextCursor.value)).body.items.length, 5);
  assert.equal((await read(users[0], '/api/overview', users[1].uid)).status, 409);
  assert.equal((await read(users[0], '/api/overview/audit?limit=51')).status, 400);
  await f.db.workspaceMembership.delete({ where: { uid_workspaceId: { uid: users[1].uid, workspaceId: w.id } } });
  assert.equal((await read(users[1], '/api/overview/workspaces')).body.items.length, 0);
  await f.db.deletionTombstone.create({ data: { uid: users[0].uid, resourceType: 'workspace', resourceId: w.id } });
  assert.equal((await read(users[0], '/api/overview/workspaces')).body.items.length, 0);
  results.push({ case: 'browser_pagination_account_switch_revocation_erasure', passed: true });
  const config = app.get(req('@nestjs/config').ConfigService);
  config.set('DATA_OVERVIEW_ENABLED', 'false'); assert.equal((await read(users[0], '/api/overview')).status, 503);
  config.set('DATA_OVERVIEW_ENABLED', 'true'); assert.equal((await read(users[0], '/api/overview')).status, 200);
  await f.admin.$executeRawUnsafe('REVOKE SELECT ON TABLE "' + f.schema + '".workspaces FROM "' + f.runtimeRole + '"');
  const unavailable = await read(users[0], '/api/overview'); assert.equal(unavailable.status, 503);
  assert.equal(Object.hasOwn(unavailable.body, 'profile'), false);
  await f.admin.$executeRawUnsafe('GRANT SELECT ON TABLE "' + f.schema + '".workspaces TO "' + f.runtimeRole + '"');
  assert.equal((await read(users[0], '/api/overview')).status, 200);
  results.push({ case: 'real_SQL_outage_no_partial_response_and_recovery', passed: true });
  const output = join(root, 'artifacts/qa/kan42'); await mkdir(output, { recursive: true });
  await users[0].page.screenshot({ path: join(output, 'browser-api.png') });
  await writeFile(join(output, 'browser-receipt.json'), JSON.stringify({ environment: 'local real emulators + PostgreSQL', stubbedIdentity: false, results, recovery: '503 -> 200', passed: true }, null, 2));
  console.log(JSON.stringify({ passed: true, groups: results.length, recovery: '503 -> 200', evidence: 'artifacts/qa/kan42/browser-receipt.json' }));
  for (const user of users) { await admin.deleteUser(user.uid); await accounts.getDatabase().recursiveDelete(accounts.getDatabase().collection('visionary_accounts').doc(user.uid)); }
} finally { await browser?.close(); await app?.close(); await f.close(); }
