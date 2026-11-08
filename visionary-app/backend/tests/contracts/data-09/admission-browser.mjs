// Compatibility gate for the current registered product boundary. The DATA09
// repository is not a new public route or an accepted school-age rollout.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const req = createRequire(resolve(root, 'backend/upstream/backend/package.json'));
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:58042' || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:59042')
  throw Error('Explicit disposable local emulators required');
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
const origin = 'http://127.0.0.1:3044', uid = 'kan44_' + randomUUID().replaceAll('-', '');
Object.assign(process.env, { NODE_ENV: 'test', FIREBASE_PROJECT_ID: 'demo-visionary-kan42', FIREBASE_PROJECT_KIND: 'emulator',
  FIRESTORE_DATABASE_ID: '(default)', AUTH_PUBLIC_ORIGIN: origin, AUTH_RATE_LIMIT_KEY: 'kan44-synthetic-only-key-never-for-live', DATA_OVERVIEW_ENABLED: 'false' });
req('reflect-metadata');
const { NestFactory } = req('@nestjs/core');
const { FirebaseProductModule } = req('./dist/src/auth/firebase-product/firebase-product.module.js');
const { FirebaseAdminService } = req('./dist/src/auth/firebase/firebase-admin.service.js');
const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
let app, browser, admin, accounts;
try {
  app = await NestFactory.create(FirebaseProductModule, { logger: false }); app.use(req('cookie-parser')()); app.setGlobalPrefix('api');
  await app.listen(3044, '127.0.0.1'); admin = app.get(FirebaseAdminService).getAuth(); accounts = app.get(FirebaseProductService);
  const email = uid + '@example.invalid', password = 'Synthetic-only-kan44-password!';
  await admin.createUser({ uid, email, emailVerified: true, password });
  const token = await fetch('http://127.0.0.1:59042/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=synthetic', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }),
  }); assert.equal(token.status, 200); const { idToken } = await token.json();
  const packages = createRequire(resolve(process.env.KAN44_BROWSER_PACKAGE || resolve(root, 'frontend/package.json')));
  const { chromium } = packages('playwright-core');
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
  const page = await browser.newPage(); await page.goto(origin + '/api/auth/methods');
  const session = await page.evaluate(async idToken => {
    const csrf = await (await fetch('/api/auth/csrf')).json();
    const r = await fetch('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf.token }, body: JSON.stringify({ idToken }) });
    return { status: r.status, body: await r.json() };
  }, idToken); assert.equal(session.status, 201, JSON.stringify(session.body));
  const post = (input, account = uid) => page.evaluate(async ({ input, account }) => {
    const csrf = await (await fetch('/api/auth/csrf')).json();
    const r = await fetch('/api/auth/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf.token,
      'X-Visionary-Account': account }, body: JSON.stringify(input) }); return { status: r.status, body: await r.json() };
  }, { input, account });
  const base = { full_name: 'Synthetic review', identity: 'professional', age_band: 'minor', preferred_language: 'en' };
  assert.equal((await post(base)).status, 403);
  const account = await accounts.getDatabase().collection('visionary_accounts').doc(uid).get();
  assert.notEqual(account.data().onboarding?.status, 'complete');
  assert.equal((await post({ ...base, birthYear: 2000, guardianUid: 'forged' })).status, 400);
  assert.equal((await post({ ...base, age_band: 'adult' }, 'changed_account')).status, 409);
  assert.equal((await post({ ...base, age_band: 'adult' })).status, 201);
  const notInstalled = await page.evaluate(async () => (await fetch('/api/admission')).status); assert.equal(notInstalled, 404);
  await page.goto(origin + '/api/auth/me');
  const output = resolve(root, 'artifacts/qa/kan44'); await mkdir(output, { recursive: true });
  await page.screenshot({ path: resolve(output, 'browser-api.png') });
  const receipt = { passed: true, stubbedIdentity: false, groups: ['current_minor_activation_denied_without_write',
    'client_authority_fields_rejected', 'account_switch_denied', 'existing_adult_onboarding_and_no_unaccepted_admission_route'],
    environment: 'real loopback Auth/Firestore emulators; current registered backend', scope: 'compatibility, not school-age rollout acceptance' };
  await writeFile(resolve(output, 'browser-receipt.json'), JSON.stringify(receipt, null, 2)); console.log(JSON.stringify(receipt));
} finally {
  await browser?.close();
  if (accounts) await accounts.getDatabase().recursiveDelete(accounts.getDatabase().collection('visionary_accounts').doc(uid));
  if (admin) await admin.deleteUser(uid).catch(() => {});
  await app?.close();
}
