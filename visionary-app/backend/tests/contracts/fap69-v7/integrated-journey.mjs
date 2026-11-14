// FAP-69 v7 integrated product journey — real user path through the REAL
// production frontend build (connected account shell), the registered
// FirebaseProductModule (Nest), the Auth + Firestore emulators and disposable
// synthetic-mode PostgreSQL. No provider/session/HTTP stubs.
//
// Required environment (explicit isolated targets only):
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:58042   (single-project demo-visionary-kan42)
//   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:59042
//   DATA_TEST_DATABASE_URL=...visionary_data_test_kan42 (disposable local PostgreSQL)
//   FRONTEND_ORIGIN=http://127.0.0.1:5176     (vite preview of the production build)
//   CHROME_PATH=<Edge/Chrome executable for playwright-core>
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import fixture from '../data-02/postgres-fixture.cjs';
const { req, backend, stagingDatabase } = fixture;

const root = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST, authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const dbUrl = process.env.DATA_TEST_DATABASE_URL, origin = process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5176';
const chromePath = process.env.CHROME_PATH, backendPort = Number(process.env.JOURNEY_BACKEND_PORT || 3001);
if (firestoreHost !== '127.0.0.1:58042' || authHost !== '127.0.0.1:59042' || !authHost ||
    !dbUrl?.includes('/visionary_data_test_kan42') || !/^http:\/\/127\.0\.0\.1:\d{1,5}$/.test(origin) || !chromePath) {
  throw Error('FAP69 v7 journey requires the explicit local emulator, disposable SQL, frontend origin and browser targets.');
}
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;

const results = [], output = join(root, 'artifacts/qa/fap69-v7');
await mkdir(output, { recursive: true });
const stamp = () => new Date().toISOString();
const startedAt = stamp();
const email = `${Date.now()}.journey@fixture.invalid`, password = 'Fap69-Journey-strong-7!';
let f, app, browser;
try {
  // ── Disposable synthetic-mode SQL: isolated schema + runtime role, migrations applied ──
  f = await stagingDatabase();
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
  const { ConfigService } = req('@nestjs/config');
  const { FirebaseAdminService } = req('./dist/src/auth/firebase/firebase-admin.service.js');
  const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
  const { LearningService } = req('./dist/src/learning/learning.service.js');
  app = await NestFactory.create(FirebaseProductModule, { logger: false });
  app.use(req('cookie-parser')());
  app.setGlobalPrefix('api');
  await app.listen(backendPort, '127.0.0.1');
  const admin = app.get(FirebaseAdminService).getAuth(), accounts = app.get(FirebaseProductService);
  const config = app.get(ConfigService);
  console.log(`[${stamp()}] backend up on 127.0.0.1:${backendPort} (registered product module, synthetic SQL ${f.schema})`);

  // ── Real browser: production build, two independent contexts (devices) ──
  const frontend = createRequire(resolve(root, 'frontend/package.json'));
  const { chromium } = frontend('playwright-core');
  browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const newPage = async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    page.setDefaultNavigationTimeout(90000);
    page.on('pageerror', error => page.__errors.push(String(error.message).slice(0, 300)));
    page.__errors = [];
    return { context, page };
  };
  const text = page => page.evaluate(() => document.body.innerText);
  const click = async (page, label) => {
    await page.waitForFunction(label => [...document.querySelectorAll('button')].some(element => element.textContent.trim() === label && !element.disabled), label, { timeout: 60000 });
    await page.evaluate(label => [...document.querySelectorAll('button')].find(element => element.textContent.trim() === label && !element.disabled).click(), label);
  };
  const fill = async (page, selector, value) => { await page.waitForSelector(selector); await page.$eval(selector, element => { element.value = ''; element.dispatchEvent(new Event('input', { bubbles: true })); }); await page.type(selector, value); };
  const see = (page, value) => page.waitForFunction(value => document.body.innerText.includes(value), value, { timeout: 60000 });
  const shot = async (page, name) => page.screenshot({ path: join(output, name + '.png') });

  // ── Leg 1: register → verify → onboarding (device A) ──
  const deviceA = await newPage();
  await deviceA.page.goto(`${origin}/register`, { waitUntil: 'networkidle' });
  await click(deviceA.page, 'Continue with Email');
  await fill(deviceA.page, 'input[type="email"]', email);
  await click(deviceA.page, 'Continue');
  await deviceA.page.waitForSelector('input[type="password"]');
  const signupFields = await deviceA.page.$$('input[type="password"]');
  await signupFields[0].type(password); await signupFields[1].type(password);
  await click(deviceA.page, 'Create account');
  await see(deviceA.page, 'I verified my email');
  results.push({ leg: 'register-awaits-verification', passed: true, at: stamp() });
  const action = await (await fetch(`http://${authHost}/emulator/v1/projects/demo-visionary-kan42/oobCodes`)).json();
  const oob = action.oobCodes.filter(item => item.email === email && item.requestType === 'VERIFY_EMAIL').at(-1);
  assert.ok(oob, 'Auth Emulator produced a VERIFY_EMAIL action');
  const verifyDevice = await newPage();
  await verifyDevice.page.goto(`${origin}/auth/action?mode=verifyEmail&oobCode=${encodeURIComponent(oob.oobCode)}`, { waitUntil: 'networkidle' });
  await see(verifyDevice.page, 'Your email is verified.');
  await verifyDevice.context.close();
  await click(deviceA.page, 'I verified my email');
  await deviceA.page.waitForFunction(() => location.pathname === '/onboarding');
  results.push({ leg: 'verified-signup-opens-onboarding', passed: true, at: stamp() });
  // Professional identity → setup → account home (deterministic 4-step path)
  {
    await deviceA.page.waitForFunction(() => [...document.querySelectorAll('button')].some(element => element.textContent.includes('I am a')));
    await deviceA.page.evaluate(() => [...document.querySelectorAll('button')].find(element => element.textContent.includes('I am a Professional')).click());
    await click(deviceA.page, 'Continue');
    await deviceA.page.waitForSelector('input[type="text"]');
    await fill(deviceA.page, 'input[type="text"]', 'Journey User');
    const value = await deviceA.page.$eval('select', element => {
      const values = [...element.options].map(option => option.value).filter(Boolean);
      return values.includes('adult') ? 'adult' : values.at(-1);
    }).catch(() => null);
    if (value) await deviceA.page.selectOption('select', value);
    await click(deviceA.page, 'Continue');
  }
  for (let guard = 0; guard < 6; guard++) {
    if ((await url(deviceA.page)) === '/dashboard/home') break;
    const body = await text(deviceA.page);
    if (body.includes('Skip for now')) await click(deviceA.page, 'Skip for now');
    else if (body.includes('Start using Visionary')) await click(deviceA.page, 'Start using Visionary');
    else if (await hasButton(deviceA.page, 'Continue')) await click(deviceA.page, 'Continue');
    await deviceA.page.waitForTimeout(600);
  }
  assert.equal(await url(deviceA.page), '/dashboard/home', 'onboarding ends at the connected account home');
  await see(deviceA.page, 'Your Visionary account');
  results.push({ leg: 'onboarding-student-reaches-connected-home', passed: true, at: stamp() });
  await shot(deviceA.page, 'leg1-account-home');

  // ── Leg 2: personal workspace provisioning through real SQL (device A) ──
  await deviceA.page.goto(`${origin}/dashboard/connections`, { waitUntil: 'networkidle' });
  await see(deviceA.page, 'Workspaces');
  const setupReady = await hasButton(deviceA.page, 'Set up personal workspace');
  assert.ok(setupReady, 'fresh account shows the personal workspace setup action');
  await click(deviceA.page, 'Set up personal workspace');
  await see(deviceA.page, 'Your personal workspace is ready.');
  await see(deviceA.page, 'Personal workspace · Owner');
  results.push({ leg: 'personal-workspace-provisioned-confirmed-via-server-readback', passed: true, at: stamp() });
  await shot(deviceA.page, 'leg2-workspaces-provisioned');

  // ── Leg 3: cross-device persistence (device B signs in and sees the same SQL workspace) ──
  const deviceB = await newPage();
  await deviceB.page.goto(`${origin}/login`, { waitUntil: 'networkidle' });
  await click(deviceB.page, 'Continue with Email');
  await fill(deviceB.page, 'input[type="email"]', email);
  await click(deviceB.page, 'Continue');
  await fill(deviceB.page, 'input[autocomplete="current-password"]', password);
  await click(deviceB.page, 'Sign in');
  await deviceB.page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 60000 });
  await deviceB.page.goto(`${origin}/dashboard/connections`, { waitUntil: 'networkidle' });
  await see(deviceB.page, 'Personal workspace · Owner');
  results.push({ leg: 'second-device-sees-server-persisted-workspace', passed: true, at: stamp() });
  await shot(deviceB.page, 'leg3-second-device');

  // ── Leg 4: profile display name persists on the server across devices ──
  await deviceA.page.goto(`${origin}/dashboard/profile`, { waitUntil: 'networkidle' });
  await see(deviceA.page, 'Your profile');
  await fill(deviceA.page, '#connected-display-name', 'Journey Learner II');
  await click(deviceA.page, 'Save name');
  await see(deviceA.page, 'Display name saved to your account.');
  await deviceB.page.goto(`${origin}/dashboard/profile`, { waitUntil: 'networkidle' });
  // The saved name renders as the input's value, which innerText never includes.
  await deviceB.page.waitForFunction(() => document.querySelector('#connected-display-name')?.value === 'Journey Learner II', null, { timeout: 60000 });
  results.push({ leg: 'display-name-saved-cross-device', passed: true, at: stamp() });
  await shot(deviceA.page, 'leg4-profile-saved');

  // ── Leg 5: privacy policy + consent surfaces (real SQL, honest states) ──
  await deviceA.page.goto(`${origin}/dashboard/privacy`, { waitUntil: 'networkidle' });
  await see(deviceA.page, 'Approved data policy');
  const policyAvailable = !(await text(deviceA.page)).includes('The approved policy is unavailable');
  await see(deviceA.page, 'Sharing consents');
  const consentsHonest = (await text(deviceA.page)).match(/No consents on this page|Consent controls are unavailable/);
  assert.ok(consentsHonest, 'consents render a truthful state without fabricated grants');
  results.push({ leg: 'privacy-policy-and-consents-render', passed: true, policyAvailable, consentsState: consentsHonest[0], at: stamp() });
  await shot(deviceA.page, 'leg5-privacy');

  // ── Leg 6: provisioning outage → honest unavailable → same-command retry ──
  const deviceC = await newPage();
  const email2 = `${Date.now()}.retry@fixture.invalid`;
  await deviceC.page.goto(`${origin}/register`, { waitUntil: 'networkidle' });
  await click(deviceC.page, 'Continue with Email');
  await fill(deviceC.page, 'input[type="email"]', email2);
  await click(deviceC.page, 'Continue');
  await deviceC.page.waitForSelector('input[type="password"]');
  const retryFields = await deviceC.page.$$('input[type="password"]');
  await retryFields[0].type(password); await retryFields[1].type(password);
  await click(deviceC.page, 'Create account');
  await see(deviceC.page, 'I verified my email');
  const oob2 = (await (await fetch(`http://${authHost}/emulator/v1/projects/demo-visionary-kan42/oobCodes`)).json())
    .oobCodes.filter(item => item.email === email2 && item.requestType === 'VERIFY_EMAIL').at(-1);
  const verifyC = await newPage();
  await verifyC.page.goto(`${origin}/auth/action?mode=verifyEmail&oobCode=${encodeURIComponent(oob2.oobCode)}`, { waitUntil: 'networkidle' });
  await see(verifyC.page, 'Your email is verified.');
  await verifyC.context.close();
  await click(deviceC.page, 'I verified my email');
  await deviceC.page.waitForFunction(() => location.pathname === '/onboarding');
  await deviceC.page.waitForFunction(() => [...document.querySelectorAll('button')].some(element => element.textContent.includes('I am a')));
  await deviceC.page.evaluate(() => [...document.querySelectorAll('button')].find(element => element.textContent.includes('I am a Professional')).click());
  await click(deviceC.page, 'Continue');
  await deviceC.page.waitForSelector('input[type="text"]');
  await fill(deviceC.page, 'input[type="text"]', 'Journey Guide');
  const retryBand = await deviceC.page.$eval('select', element => {
    const values = [...element.options].map(option => option.value).filter(Boolean);
    return values.includes('adult') ? 'adult' : values.at(-1);
  }).catch(() => null);
  if (retryBand) await deviceC.page.selectOption('select', retryBand);
  for (let guard = 0; guard < 6; guard++) {
    if ((await url(deviceC.page)) === '/dashboard/home') break;
    const body = await text(deviceC.page);
    if (body.includes('Skip for now')) await click(deviceC.page, 'Skip for now');
    else if (body.includes('Start using Visionary')) await click(deviceC.page, 'Start using Visionary');
    else if (await hasButton(deviceC.page, 'Continue')) await click(deviceC.page, 'Continue');
    await deviceC.page.waitForTimeout(600);
  }
  assert.equal(await url(deviceC.page), '/dashboard/home');
  await deviceC.page.goto(`${origin}/dashboard/connections`, { waitUntil: 'networkidle' });
  await see(deviceC.page, 'Workspaces');
  assert.ok(await hasButton(deviceC.page, 'Set up personal workspace'), 'second account also offered setup');
  config.set('DATA_WORKSPACE_PROVISIONING_ENABLED', 'false');
  await click(deviceC.page, 'Set up personal workspace');
  await see(deviceC.page, 'Workspace setup is unavailable right now. Try again later.');
  assert.equal((await text(deviceC.page)).includes('Your personal workspace is ready.'), false, 'no success claim during outage');
  results.push({ leg: 'provisioning-outage-shows-honest-unavailable', passed: true, at: stamp() });
  await shot(deviceC.page, 'leg6-outage');
  config.set('DATA_WORKSPACE_PROVISIONING_ENABLED', 'true');
  await click(deviceC.page, 'Set up personal workspace');
  await see(deviceC.page, 'Your personal workspace is ready.');
  results.push({ leg: 'provisioning-retry-succeeds-after-recovery', passed: true, at: stamp() });

  // ── Leg 7: account security — sessions list + sign-out everywhere (two devices) ──
  await deviceA.page.goto(`${origin}/dashboard/settings`, { waitUntil: 'networkidle' });
  await see(deviceA.page, 'Account security');
  await see(deviceA.page, 'This browser · Active');
  results.push({ leg: 'session-listed-on-security-screen', passed: true, at: stamp() });
  await shot(deviceA.page, 'leg7-security');
  await click(deviceA.page, 'Sign out on all devices');
  await click(deviceA.page, 'Confirm sign-out');
  await deviceA.page.waitForFunction(() => !location.pathname.startsWith('/dashboard'), { timeout: 60000 });
  await deviceB.page.reload({ waitUntil: 'networkidle' });
  const bState = await url(deviceB.page);
  const bRevoked = !bState.startsWith('/dashboard') || (await text(deviceB.page)).includes('Sign in');
  assert.ok(bRevoked, `device B signed out everywhere (state: ${bState})`);
  results.push({ leg: 'logout-all-revokes-both-devices', passed: true, secondDeviceState: bState, at: stamp() });
  await shot(deviceA.page, 'leg7-signed-out');

  // ── Leg 8: saved learning owner-scoped surface + T11 boundary receipt ──
  await deviceB.page.goto(`${origin}/login`, { waitUntil: 'networkidle' });
  await click(deviceB.page, 'Continue with Email');
  await fill(deviceB.page, 'input[type="email"]', email);
  await click(deviceB.page, 'Continue');
  await fill(deviceB.page, 'input[autocomplete="current-password"]', password);
  await click(deviceB.page, 'Sign in');
  await deviceB.page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 60000 });
  await deviceB.page.goto(`${origin}/dashboard/learn`, { waitUntil: 'networkidle' });
  await see(deviceB.page, 'Saved learning');
  const learnText = await text(deviceB.page);
  results.push({
    leg: 'saved-learning-owner-surface-after-re-login',
    passed: true,
    state: /No sessions|no saved|Saved learning/.test(learnText) ? learnText.slice(0, 200) : 'rendered',
    at: stamp(),
  });
  await shot(deviceB.page, 'leg8-saved-learning');

  // ── Receipt ──
  assert.equal(deviceA.page.__errors.length, 0, 'device A page errors: ' + deviceA.page.__errors.join(' | '));
  await writeFile(join(output, 'journey-receipt.json'), JSON.stringify({
    environment: { realm: 'local real emulators + disposable synthetic PostgreSQL', frontend: 'production build (connected shell)', stubbedIdentity: false, backend: `127.0.0.1:${backendPort}`, origin, sqlSchema: f.schema, startedAt, finishedAt: stamp() },
    results,
  }, null, 2));
  console.log(JSON.stringify({ passed: true, legs: results.length, evidence: 'artifacts/qa/fap69-v7/journey-receipt.json' }));

  const emulatorUsers = await admin.listUsers(1000);
  for (const user of emulatorUsers.users) {
    await admin.deleteUser(user.uid).catch(() => {});
    await accounts.getDatabase().recursiveDelete(accounts.getDatabase().collection('visionary_accounts').doc(user.uid)).catch(() => {});
  }
} finally {
  await browser?.close(); await app?.close(); await f?.close();
  console.log(`[${stamp()}] journey teardown complete`);
}
function url(page) { return page.evaluate(() => location.pathname); }
async function hasButton(page, label) {
  return page.evaluate(label => [...document.querySelectorAll('button')].some(element => element.textContent.trim() === label && !element.disabled), label);
}
