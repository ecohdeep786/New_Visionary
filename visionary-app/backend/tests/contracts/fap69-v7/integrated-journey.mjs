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
import { randomUUID } from 'node:crypto';
import { fork } from 'node:child_process';
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
let f, app, invitationChild, browser;
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

  // ── Invitation realm (registered product module, second PROCESS) ──
  // Institution invitations require NODE_ENV=development and their own public
  // origin; the overview store's emulator test fence requires NODE_ENV=test.
  // One process cannot serve both realms: ConfigService.set persists realm
  // settings into process.env for every realm in that process (app T's origin
  // was observed mutating to the invitation origin, 403ing every session
  // mint). The invitation realm therefore runs the SAME registered module in
  // its own process — same emulators, same disposable synthetic SQL schema.
  // JOURNEY_SKIP_INVITATION_REALM=true runs only the test realm to isolate.
  const skipInvitationRealm = process.env.JOURNEY_SKIP_INVITATION_REALM === 'true';
  const invitationPort = Number(process.env.JOURNEY_INVITATION_PORT || 3002);
  const invitationOrigin = 'http://127.0.0.1:5177';
  const startInvitationRealm = async reviewerUids => {
    invitationChild = fork(new URL('./invitation-realm.mjs', import.meta.url), {
      env: {
        ...process.env,
        INVITATION_REALM_PORT: String(invitationPort),
        INVITATION_REALM_ORIGIN: invitationOrigin,
        // The realm must trust the enrolled reviewer UID; its settings() reads
        // this value live, so it arrives at fork time.
        ...(reviewerUids ? { DATA_INSTITUTION_REVIEWER_UIDS: reviewerUids } : {}),
      },
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    });
    const ready = Date.now() + 60000;
    while (Date.now() < ready) {
      try {
        const res = await fetch(`http://127.0.0.1:${invitationPort}/api/auth/csrf`);
        if (res.ok) {
          console.log(`[${stamp()}] invitation realm up on 127.0.0.1:${invitationPort} (${invitationOrigin}, pid ${invitationChild.pid})`);
          return;
        }
      } catch {}
      await new Promise(r => setTimeout(r, 400));
    }
    throw Error('invitation realm did not become ready');
  };
  if (skipInvitationRealm) console.log(`[${stamp()}] invitation realm SKIPPED (isolation flag)`);

  // ── Real browser: production build, two independent contexts (devices) ──
  const frontend = createRequire(resolve(root, 'frontend/package.json'));
  const { chromium } = frontend('playwright-core');
  browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const newPage = async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    page.setDefaultNavigationTimeout(90000);
    page.__errors = [];
    page.__log = [];
    page.on('pageerror', error => page.__errors.push(String(error.message).slice(0, 300)));
    page.on('console', message => {
      if (message.type() === 'error' || message.type() === 'warning') page.__log.push(`console-${message.type()}: ${message.text().slice(0, 300)}`);
    });
    page.on('requestfailed', request => page.__log.push(`requestfailed: ${request.url().slice(0, 200)} ${request.failure()?.errorText || ''}`));
    page.on('response', async response => {
      if (response.url().includes('/api/') && response.status() >= 400) {
        let body = ''; try { body = (await response.text()).slice(0, 200); } catch {}
        page.__log.push(`http ${response.status()} ${response.request().method()} ${response.url().slice(0, 200)} ${body}`);
      }
    });
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
  // Failure forensics: pathname, rendered body, captured page errors, console
  // errors and failed/4xx+ API calls — never guess at a browser-side failure.
  const dumpPageState = async (page, label) => {
    console.log(`[${stamp()}] FAILURE CONTEXT — ${label}`);
    console.log(`  pathname: ${await page.evaluate(() => location.pathname).catch(() => 'n/a')}`);
    try {
      console.log(`  body: ${(await page.evaluate(() => document.body.innerText)).slice(0, 700).replaceAll('\n', ' | ')}`);
    } catch {}
    for (const line of [...page.__errors.map(item => `pageerror: ${item}`), ...page.__log].slice(-40)) console.log(`  ${line}`);
    await shot(page, 'failure-' + String(label).replace(/\W+/g, '-').slice(0, 40)).catch(() => {});
  };

  // ── Extension-leg helpers (registered contracts only, no stubs) ──
  const jarFor = async (context, cookieOrigin) =>
    (await context.cookies(cookieOrigin)).map(row => `${row.name}=${row.value}`).join('; ');
  // CSRF cookie and header must be byte-equal. A write call therefore rotates
  // the token itself and rewrites the jar entry before sending — the browser's
  // jar alone never holds the fresh token of an out-of-band rotation.
  const patchCsrf = (cookieHeader, token) =>
    (cookieHeader ? cookieHeader.split('; ').filter(row => !row.startsWith('visionary-csrf=')) : [])
      .concat(`visionary-csrf=${token}`).join('; ');
  const authedCall = async (base, callOrigin, cookieHeader, method, path, body, extraHeaders = {}) => {
    let cookies = cookieHeader;
    let headers = { ...extraHeaders };
    if (method !== 'GET') {
      const rotated = await fetch(base + '/api/auth/csrf', { headers: { cookie: cookies, origin: callOrigin, referer: callOrigin + '/' } });
      const fresh = cookieValue(rotated.headers.getSetCookie?.() || [], 'visionary-csrf');
      assert.ok(fresh, 'csrf rotation for a write call returned a fresh token');
      cookies = patchCsrf(cookies, fresh);
      headers = { ...headers, 'x-csrf-token': fresh };
    }
    const res = await fetch(base + path, {
      method, body: body === undefined ? undefined : JSON.stringify(body),
      headers: { 'content-type': 'application/json', cookie: cookies, origin: callOrigin, referer: callOrigin + '/', ...headers },
    });
    let json = null; try { json = await res.json(); } catch {}
    return { status: res.status, json, setCookie: res.headers.getSetCookie?.() || [] };
  };
  const cookieValue = (setCookieRows, name) => {
    for (const row of setCookieRows) {
      const [pair] = row.split(';'); const eq = pair.indexOf('=');
      if (pair.slice(0, eq).trim() === name) return pair.slice(eq + 1);
    }
    return null;
  };
  // Mint a real session on a registered realm: Auth Emulator password sign-in,
  // then the same CSRF + session mint the browser transport performs.
  const realmSession = async (authOrigin, realmOrigin, realmBase, emailAddr, passwordValue) => {
    const signIn = await fetch(`${authOrigin}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: emailAddr, password: passwordValue, returnSecureToken: true }),
    });
    const signed = await signIn.json();
    assert.ok(signed.idToken, 'Auth Emulator password sign-in produced an idToken');
    const jar = new Map();
    const call = async (method, path, body, extraHeaders = {}) => {
      const res = await fetch(realmBase + path, {
        method, body: body === undefined ? undefined : JSON.stringify(body),
        headers: { 'content-type': 'application/json', origin: realmOrigin, referer: realmOrigin + '/', ...extraHeaders,
          cookie: [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ') },
      });
      for (const row of res.headers.getSetCookie?.() || []) {
        const [pair] = row.split(';'); const eq = pair.indexOf('=');
        jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1));
      }
      let json = null; try { json = await res.json(); } catch {}
      return { status: res.status, json };
    };
    await call('GET', '/api/auth/csrf');
    const minted = await call('POST', '/api/auth/session', { idToken: signed.idToken }, { 'x-csrf-token': jar.get('visionary-csrf') });
    assert.equal(minted.status, 201, 'session minted on the invited realm');
    const uid = minted.json.id;
    const authed = async (method, path, body) => {
      if (method !== 'GET') await call('GET', '/api/auth/csrf');
      return call(method, path, body, method === 'GET' ? { 'x-visionary-account': uid }
        : { 'x-visionary-account': uid, 'x-csrf-token': jar.get('visionary-csrf') });
    };
    return { uid, authed };
  };
  // Full real-user enrollment on the production build: register, verify the
  // email through the real oobCode action, onboard with an adult band.
  const enroll = async (name, emailAddr) => {
    const device = await newPage();
    await device.page.goto(`${origin}/register`, { waitUntil: 'networkidle' });
    await click(device.page, 'Continue with Email');
    await fill(device.page, 'input[type="email"]', emailAddr);
    await click(device.page, 'Continue');
    await device.page.waitForSelector('input[type="password"]');
    const fields = await device.page.$$('input[type="password"]');
    await fields[0].type(password); await fields[1].type(password);
    await click(device.page, 'Create account');
    await see(device.page, 'I verified my email');
    const codes = await (await fetch(`http://${authHost}/emulator/v1/projects/demo-visionary-kan42/oobCodes`)).json();
    const action = codes.oobCodes.filter(item => item.email === emailAddr && item.requestType === 'VERIFY_EMAIL').at(-1);
    assert.ok(action, 'Auth Emulator issued a VERIFY_EMAIL action');
    const verifier = await newPage();
    await verifier.page.goto(`${origin}/auth/action?mode=verifyEmail&oobCode=${encodeURIComponent(action.oobCode)}`, { waitUntil: 'networkidle' });
    await see(verifier.page, 'Your email is verified.');
    await verifier.context.close();
    await click(device.page, 'I verified my email');
    for (let attempt = 0; attempt < 3; attempt++) {
      const reached = await device.page.waitForFunction(() => location.pathname === '/onboarding', null, { timeout: 12000 }).then(() => true).catch(() => false);
      if (reached) break;
      if (await hasButton(device.page, 'I verified my email')) await click(device.page, 'I verified my email');
    }
    await device.page.waitForFunction(() => location.pathname === '/onboarding').catch(async () => {
      await dumpPageState(device.page, 'enroll-' + emailAddr);
      throw Error(`enroll(${name}): verified signup did not open /onboarding`);
    });
    await device.page.waitForFunction(() => [...document.querySelectorAll('button')].some(element => element.textContent.includes('I am a')));
    await device.page.evaluate(() => [...document.querySelectorAll('button')].find(element => element.textContent.includes('I am a Professional')).click());
    await click(device.page, 'Continue');
    await device.page.waitForSelector('input[type="text"]');
    await fill(device.page, 'input[type="text"]', name);
    const band = await device.page.$eval('select', element => {
      const values = [...element.options].map(option => option.value).filter(Boolean);
      return values.includes('adult') ? 'adult' : values.at(-1);
    }).catch(() => null);
    if (band) await device.page.selectOption('select', band);
    for (let guard = 0; guard < 6; guard++) {
      if ((await url(device.page)) === '/dashboard/home') break;
      const body = await text(device.page);
      if (body.includes('Skip for now')) await click(device.page, 'Skip for now');
      else if (body.includes('Start using Visionary')) await click(device.page, 'Start using Visionary');
      else if (await hasButton(device.page, 'Continue')) await click(device.page, 'Continue');
      await device.page.waitForTimeout(600);
    }
    assert.equal(await url(device.page), '/dashboard/home', `${name} onboarding reaches the connected home`);
    await device.context.close();
  };

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
  for (let attempt = 0; attempt < 3; attempt++) {
    const reached = await deviceA.page.waitForFunction(() => location.pathname === '/onboarding', null, { timeout: 12000 }).then(() => true).catch(() => false);
    if (reached) break;
    console.log(`[${stamp()}] leg 1 retry ${attempt + 1}: pathname=${await deviceA.page.evaluate(() => location.pathname).catch(() => 'n/a')}`);
    if (await hasButton(deviceA.page, 'I verified my email')) await click(deviceA.page, 'I verified my email');
  }
  await deviceA.page.waitForFunction(() => location.pathname === '/onboarding').catch(async () => {
    await dumpPageState(deviceA.page, 'leg1-verified-signup');
    throw Error('leg 1: verified signup did not open /onboarding');
  });
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
  assert.ok(policyAvailable, 'the approved policy reference renders from the registered backend');
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
  for (let attempt = 0; attempt < 3; attempt++) {
    const reachedC = await deviceC.page.waitForFunction(() => location.pathname === '/onboarding', null, { timeout: 12000 }).then(() => true).catch(() => false);
    if (reachedC) break;
    if (await hasButton(deviceC.page, 'I verified my email')) await click(deviceC.page, 'I verified my email');
  }
  await deviceC.page.waitForFunction(() => location.pathname === '/onboarding').catch(async () => {
    await dumpPageState(deviceC.page, 'leg6-second-account');
    throw Error('leg 6: second account did not reach /onboarding');
  });
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

  // ── Leg 9: server-created learning session fills Saved learning (T11) ──
  // The released interactive create affordance is the registered POST; the
  // production UI has no fabricated local create, so the session is created
  // through the real contract with device B's own verified session.
  const learnBase = `http://127.0.0.1:${backendPort}`;
  const deviceBCookies = await jarFor(deviceB.page.context(), origin);
  const whoB = await authedCall(learnBase, origin, deviceBCookies, 'GET', '/api/auth/me');
  assert.equal(whoB.status, 200, 'device B session reads its account');
  const learnerUidOriginal = whoB.json.id;
  const createSession = await authedCall(learnBase, origin, deviceBCookies, 'POST', '/api/account/learning/sessions', {
    version: 1, commandId: randomUUID(), workspaceId: 'journey-workspace', conceptId: 'journey-concept',
    sourceVersion: 'journey-v1', criteriaVersion: 'journey-v1', provider: 'journey-provider', sourceId: 'journey-source',
  }, { 'x-visionary-account': learnerUidOriginal });
  assert.equal(createSession.status, 201, 'registered learning session create admits the bounded command: ' + JSON.stringify(createSession.json));
  assert.equal(createSession.json.status, 'active');
  const createdSessionId = createSession.json.sessionId;
  results.push({ leg: 'learning-session-created-via-registered-contract', passed: true, sessionId: createdSessionId, at: stamp() });
  await deviceB.page.goto(`${origin}/dashboard/learn`, { waitUntil: 'networkidle' });
  await see(deviceB.page, 'journey-concept');
  await see(deviceB.page, 'In progress');
  results.push({ leg: 'saved-learning-history-nonempty-from-server', passed: true, at: stamp() });
  await shot(deviceB.page, 'leg9-learning-history-nonempty');

  // ── Leg 10: close the session through the real UI confirmation flow ──
  await click(deviceB.page, 'Close session');
  await see(deviceB.page, 'Close this session?');
  await click(deviceB.page, 'Confirm close');
  await see(deviceB.page, 'Learning session closed.');
  await deviceB.page.reload({ waitUntil: 'networkidle' });
  await deviceB.page.waitForFunction(() => /Closed ·/.test(document.body.innerText), null, { timeout: 60000 });
  results.push({ leg: 'learning-session-closed-through-ui', passed: true, at: stamp() });
  await shot(deviceB.page, 'leg10-learning-closed');

  // ── Leg 11: the closure is server-persisted across devices (device A) ──
  await deviceA.page.goto(`${origin}/login`, { waitUntil: 'networkidle' });
  await click(deviceA.page, 'Continue with Email');
  await fill(deviceA.page, 'input[type="email"]', email);
  await click(deviceA.page, 'Continue');
  await fill(deviceA.page, 'input[autocomplete="current-password"]', password);
  await click(deviceA.page, 'Sign in');
  await deviceA.page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 60000 });
  await deviceA.page.goto(`${origin}/dashboard/learn`, { waitUntil: 'networkidle' });
  await deviceA.page.waitForFunction(() => /Closed ·/.test(document.body.innerText), null, { timeout: 60000 });
  results.push({ leg: 'learning-closure-cross-device', passed: true, at: stamp() });
  await shot(deviceA.page, 'leg11-closure-cross-device');

  if (!skipInvitationRealm) {
  // ── Legs 12-16: institution invitation journey (second registered realm) ──
  // Realm boundary: invitations require NODE_ENV=development; the overview
  // store's emulator fence requires NODE_ENV=test. Both instances run the SAME
  // registered module over the SAME emulators and synthetic SQL — the accept
  // is committed by the server and verified through SQL plus the overview
  // contract on the test realm. No local substitute for either boundary.
  const authOrigin = `http://${authHost}`;
  const invitedEmail = `${Date.now()}.member@fixture.invalid`;
  const ownerEmail = `${Date.now()}.owner@fixture.invalid`;
  const reviewerEmail = `${Date.now()}.reviewer@fixture.invalid`;
  await enroll('Journey Owner', ownerEmail);
  await enroll('Journey Member', invitedEmail);
  await enroll('Journey Reviewer', reviewerEmail);
  results.push({ leg: 'three-accounts-enrolled-and-onboarded', passed: true, at: stamp() });

  // The invitation realm boots here, in its own process, already trusting the
  // enrolled reviewer UID (its settings() reads that env value live). The UID
  // is the Auth Emulator's own identity record for the enrolled account.
  const reviewerAccount = await admin.getUserByEmail(reviewerEmail);
  await startInvitationRealm(reviewerAccount.uid);
  const owner = await realmSession(authOrigin, invitationOrigin, `http://127.0.0.1:${invitationPort}`, ownerEmail, password);
  const invited = await realmSession(authOrigin, invitationOrigin, `http://127.0.0.1:${invitationPort}`, invitedEmail, password);
  const reviewer = await realmSession(authOrigin, invitationOrigin, `http://127.0.0.1:${invitationPort}`, reviewerEmail, password);

  // Governance fixture in the real control namespace (as the backend's own
  // privacy suite does): approved policy snapshot + per-account acknowledgements.
  const { privacyPolicyDraft, digest } = req('./dist/src/privacycore/privacy-policy.js');
  const draft = privacyPolicyDraft();
  for (const row of draft.policy.classes) row.retention = { mode: 'owner_controlled', rationale: 'Local journey realm fixture; no legal or product approval.' };
  const policyDigest = digest(draft.policy);
  const controlNamespace = accounts.getDatabase().collection('visionary_privacy_control').doc('fap69-v7-journey');
  await controlNamespace.collection('policies').doc('current').set({
    policy: draft.policy,
    approval: { state: 'approved', policyVersion: draft.policy.policyVersion, policyDigest,
      approvedBy: 'fap69-v7-policy-approver', approvedAt: new Date().toISOString() },
  });
  const acknowledgementExpiry = new Date(Date.now() + 30 * 86400 * 1000).toISOString();
  for (const uid of [owner.uid, invited.uid, reviewer.uid]) {
    await controlNamespace.collection('acknowledgements').doc(digest(uid)).set({
      uid, policyVersion: draft.policy.policyVersion, policyDigest, purpose: 'personal-policy-review',
      status: 'active', expiresAt: acknowledgementExpiry, revokedAt: null,
    });
  }
  results.push({ leg: 'policy-governance-fixture-published', passed: true, policyVersion: draft.policy.policyVersion, at: stamp() });

  // Synthetic SQL fixture: the org workspace + OWNER membership (the org
  // workspace creation contract is not HTTP-reachable in the product realm —
  // WorkspacesController is unregistered there; the invitation contract's own
  // backend suite seeds it the same way).
  await f.db.person.createMany({ data: [owner.uid, invited.uid, reviewer.uid].map(uid => ({ uid })) });
  const org = await f.db.workspace.create({ data: {
    uid: owner.uid, slug: 'org' + randomUUID().replaceAll('-', '').slice(0, 24), name: 'FAP-69 v7 Organization', isPersonal: false } });
  await f.db.workspaceMembership.create({ data: { uid: owner.uid, workspaceId: org.id, role: 'OWNER', source: 'direct' } });

  const approval = await reviewer.authed('POST', '/api/account/invitations/institution/approve', {
    workspaceId: org.id, administratorUid: owner.uid, evidenceRef: `proof_${randomUUID().replaceAll('-', '')}`,
    expiresAt: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
  });
  assert.equal(approval.status, 201, 'institution approval recorded: ' + JSON.stringify(approval.json));
  assert.ok(approval.json.approvalId, 'approval receipt identifies the approval');
  results.push({ leg: 'institution-approval-by-reviewer', passed: true, approvalId: approval.json.approvalId, at: stamp() });

  const issue = await owner.authed('POST', '/api/account/invitations/issue', {
    workspaceId: org.id, email: invitedEmail, role: 'MEMBER', expiresInSeconds: 7 * 86400,
  });
  assert.equal(issue.status, 201, 'owner issued the invitation: ' + JSON.stringify(issue.json));
  assert.match(issue.json.token, /^[A-Za-z0-9_-]{43}$/, 'issue returned the one-time bearer token');
  results.push({ leg: 'owner-issued-invitation', passed: true, invitationId: issue.json.invitationId, at: stamp() });

  // Realm-boundary receipt (through the REAL UI on the test realm): the accept
  // affordance performs the real POST and reports the development-realm fence
  // honestly — no fabricated success message.
  const deviceForm = await newPage();
  await deviceForm.page.goto(`${origin}/login`, { waitUntil: 'networkidle' });
  await click(deviceForm.page, 'Continue with Email');
  await fill(deviceForm.page, 'input[type="email"]', invitedEmail);
  await click(deviceForm.page, 'Continue');
  await fill(deviceForm.page, 'input[autocomplete="current-password"]', password);
  await click(deviceForm.page, 'Sign in');
  await deviceForm.page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 60000 });
  await deviceForm.page.goto(`${origin}/dashboard/connections`, { waitUntil: 'networkidle' });
  await see(deviceForm.page, 'Join a workspace');
  await deviceForm.page.$eval('#workspace-invitation', element => {
    element.value = ''; element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await deviceForm.page.type('#workspace-invitation', issue.json.token);
  await click(deviceForm.page, 'Accept invitation');
  await see(deviceForm.page, 'Could not confirm acceptance');
  assert.equal((await text(deviceForm.page)).includes('Your workspace membership is confirmed'), false,
    'the fenced realm never claims a membership it did not commit');
  results.push({ leg: 'invitation-accept-ui-honest-fence', passed: true, at: stamp() });
  await shot(deviceForm.page, 'leg12-accept-ui-honest-fence');
  await deviceForm.context.close();

  // Server-committed acceptance: the SAME registered accept contract through
  // the invited member's real session on the development realm (the UI's own
  // transport contract: CSRF + account binding + verified identity).
  const deviceD = await newPage();
  await deviceD.page.goto(`${invitationOrigin}/login`, { waitUntil: 'networkidle' });
  await click(deviceD.page, 'Continue with Email');
  await fill(deviceD.page, 'input[type="email"]', invitedEmail);
  await click(deviceD.page, 'Continue');
  await fill(deviceD.page, 'input[autocomplete="current-password"]', password);
  await click(deviceD.page, 'Sign in');
  await deviceD.page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 60000 });
  const invitedCookies = await jarFor(deviceD.page.context(), invitationOrigin);
  const accepted = await authedCall(`http://127.0.0.1:${invitationPort}`, invitationOrigin, invitedCookies,
    'POST', '/api/account/invitations/accept', { token: issue.json.token },
    { 'x-visionary-account': invited.uid });
  assert.equal(accepted.status, 201, 'acceptance committed on the invited realm: ' + JSON.stringify(accepted.json));
  assert.equal(accepted.json.workspaceId, org.id);
  assert.equal(accepted.json.role, 'MEMBER');
  assert.equal(accepted.json.replay, false);
  results.push({ leg: 'invitation-accept-server-committed', passed: true, invitationId: accepted.json.invitationId, at: stamp() });
  await shot(deviceD.page, 'leg12-invitation-accept-signed-in');
  await deviceD.context.close();

  // Authoritative readback: the acceptance committed a SQL membership row.
  const membership = await f.db.workspaceMembership.findUnique({ where: { uid_workspaceId: { uid: invited.uid, workspaceId: org.id } } });
  assert.ok(membership, 'acceptance committed the workspace membership');
  assert.equal(membership.role, 'MEMBER');
  results.push({ leg: 'invitation-accept-sql-membership-readback', passed: true, role: membership.role, workspaceId: org.id, at: stamp() });

  // Cross-contract readback: the same membership is visible through the
  // registered overview contract on the test realm (fresh context).
  const deviceE = await newPage();
  await deviceE.page.goto(`${origin}/login`, { waitUntil: 'networkidle' });
  await click(deviceE.page, 'Continue with Email');
  await fill(deviceE.page, 'input[type="email"]', invitedEmail);
  await click(deviceE.page, 'Continue');
  await fill(deviceE.page, 'input[autocomplete="current-password"]', password);
  await click(deviceE.page, 'Sign in');
  await deviceE.page.waitForFunction(() => location.pathname.startsWith('/dashboard'), { timeout: 60000 });
  await deviceE.page.goto(`${origin}/dashboard/connections`, { waitUntil: 'networkidle' });
  await see(deviceE.page, 'FAP-69 v7 Organization');
  await see(deviceE.page, 'Shared workspace · Member');
  results.push({ leg: 'invitation-membership-cross-contract-ui', passed: true, at: stamp() });
  await shot(deviceE.page, 'leg13-membership-cross-contract');
  await deviceE.context.close();
  } // end !skipInvitationRealm

  // ── Receipt ──
  assert.equal(deviceA.page.__errors.length, 0, 'device A page errors: ' + deviceA.page.__errors.join(' | '));
  await writeFile(join(output, 'journey-receipt.json'), JSON.stringify({
    environment: {
      realm: 'local real emulators + disposable synthetic PostgreSQL',
      frontend: 'production build (connected shell)',
      stubbedIdentity: false,
      backend: `127.0.0.1:${backendPort}`,
      invitationRealm: skipInvitationRealm ? `127.0.0.1:${invitationPort} (SKIPPED this run by JOURNEY_SKIP_INVITATION_REALM)` : `127.0.0.1:${invitationPort} (same registered module in a child process, NODE_ENV=development realm, same emulators + SQL)`,
      origins: [origin, invitationOrigin],
      sqlSchema: f.schema, startedAt, finishedAt: stamp(),
    },
    results,
  }, null, 2));
  console.log(JSON.stringify({ passed: true, legs: results.length, evidence: 'artifacts/qa/fap69-v7/journey-receipt.json' }));

  const emulatorUsers = await admin.listUsers(1000);
  for (const user of emulatorUsers.users) {
    await admin.deleteUser(user.uid).catch(() => {});
    await accounts.getDatabase().recursiveDelete(accounts.getDatabase().collection('visionary_accounts').doc(user.uid)).catch(() => {});
  }
} finally {
  await browser?.close(); invitationChild?.kill(); await app?.close(); await f?.close();
  console.log(`[${stamp()}] journey teardown complete`);
}
function url(page) { return page.evaluate(() => location.pathname); }
async function hasButton(page, label) {
  return page.evaluate(label => [...document.querySelectorAll('button')].some(element => element.textContent.trim() === label && !element.disabled), label);
}
