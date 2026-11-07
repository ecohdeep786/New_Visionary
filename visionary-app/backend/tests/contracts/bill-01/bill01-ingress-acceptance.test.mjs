// BILL-01 (KAN-102) canonical HTTPS-ingress acceptance — protocol suite.
//
// Drives the real product runtime (production HTTP composition, real
// controllers/services) through a real TLS terminator on the canonical origin
// with the authorized local identity plane (Firebase Auth + Firestore
// emulators). Proves, in order: canonical-origin/CSRF enforcement, secure
// `__Host-` cookie establishment, the verified-identity auth return, adult
// onboarding, the test-merchant checkout/verify/invoice/cancel journey over
// durable Firestore records, full-stack restart durability via emulator
// export/import, two-device session isolation with logout/logout-all, and the
// ingress security-header surface. The hosted deployment, real Razorpay
// test-merchant credentials and hosted Firestore remain explicit external
// gates recorded in the runbook; this suite never contacts them.

import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

import stack from './stack.cjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(here, '../../../..');
const backendPackage = createRequire(path.join(productRoot, 'backend/upstream/backend/package.json'));

let runDir;
let adminApp;
const state = { users: {}, devices: {} };

function firestoreRest(documentPath) {
  const databaseId = process.env.BILL01_FIRESTORE_DATABASE_ID || '(default)';
  const base = `http://127.0.0.1:${stack.PORTS.firestore}/v1/projects/${stack.AUTH_EMULATOR_PROJECT}`;
  const url = `${base}/databases/${databaseId}/documents/${documentPath}`;
  return new Promise((resolve, reject) => {
    http.get(url, response => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body: data ? JSON.parse(data) : null }));
    }).on('error', reject);
  });
}

async function createEmulatorUser(email, { verified = true } = {}) {
  const { getAuth } = backendPackage('firebase-admin/auth');
  const user = await getAuth(adminApp).createUser({ email, password: 'ingress-acceptance-Pass1', emailVerified: verified });
  return user.uid;
}

async function emulatorSignInToken(email) {
  const response = await fetch(`http://127.0.0.1:${stack.PORTS.auth}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'ingress-acceptance-Pass1', returnSecureToken: true }),
  });
  assert.equal(response.status, 200, `Auth Emulator sign-in failed for ${email}`);
  return (await response.json()).idToken;
}

// A full device: independent cookie jar, independent observed edge IP.
async function establishDevice(email, deviceIp, { onboard = false } = {}) {
  const jar = stack.cookieJar();
  const csrf = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp });
  assert.equal(csrf.status, 200);
  jar.capture(csrf);
  const token = await emulatorSignInToken(email);
  const session = await stack.ingressRequest({
    pathname: '/api/auth/session', method: 'POST', deviceIp, jar,
    body: { idToken: token }, headers: { 'x-csrf-token': csrf.body.token },
  });
  assert.equal(session.status, 201, `Session exchange failed for ${email}: ${session.text}`);
  jar.capture(session);
  const profile = session.body;
  const me = async () => stack.ingressRequest({ pathname: '/api/auth/me', deviceIp, jar });
  const post = async (pathname, body, extraHeaders = {}) => {
    const fresh = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp, jar });
    jar.capture(fresh);
    return stack.ingressRequest({ pathname, method: 'POST', deviceIp, jar, body, headers: { 'x-csrf-token': fresh.body.token, ...extraHeaders } });
  };
  if (onboard) {
    const completed = await post('/api/auth/onboarding', { identity: 'professional', age_band: 'adult', full_name: 'QA Ingress Acceptance', preferred_language: 'English' }, { 'x-visionary-account': profile.id });
    assert.equal(completed.status, 201, `Onboarding failed: ${completed.text}`);
  }
  return { jar, deviceIp, profile, me, post };
}

function setCookiesOf(response) {
  const headers = response.rawHeaders, collected = [];
  for (let index = 0; index + 1 < headers.length; index += 2) {
    if (headers[index].toLowerCase() === 'set-cookie') collected.push(headers[index + 1]);
  }
  return collected;
}

function assertHostCookie(cookieName, setCookieHeader) {
  const [firstPair, ...attributeParts] = setCookieHeader.split(';');
  assert.equal(firstPair.split('=')[0], cookieName, `Expected ${cookieName} in Set-Cookie`);
  const attributes = attributeParts.map(part => part.trim().toLowerCase());
  assert(attributes.includes('httponly'), `${cookieName} must be HttpOnly`);
  assert(attributes.includes('secure'), `${cookieName} must be Secure over the HTTPS ingress`);
  assert(attributes.includes('samesite=strict'), `${cookieName} must be SameSite=Strict`);
  assert(attributes.includes('path=/'), `${cookieName} must be scoped to Path=/`);
  assert(!attributes.some(value => value.startsWith('domain=')), `${cookieName} must be host-only (no Domain attribute)`);
}

before(async () => {
  stack.assertRunnable();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  runDir = process.env.BILL01_RUN_DIR || path.join(productRoot, 'artifacts/qa/bill01-ingress-acceptance', stamp);
  mkdirSync(runDir, { recursive: true });
  await stack.startEmulators({ logFile: path.join(runDir, 'emulators.log'), workDir: runDir });
  await stack.startStack({ runDir });

  const { initializeApp, deleteApp } = backendPackage('firebase-admin/app');
  adminApp = initializeApp({
    projectId: stack.AUTH_EMULATOR_PROJECT,
    // The Auth Emulator needs no real credential; mirror the product's own
    // emulator-mode stub so no live credential discovery can ever happen.
    credential: { getAccessToken: async () => ({ access_token: 'emulator-only', expires_in: 3600 }) },
  }, 'bill01-driver');
  state.deleteDriverApp = () => deleteApp(adminApp);

  state.users.probe = await createEmulatorUser('probe@ingress.example');
  state.users.verified = await createEmulatorUser('device-a@ingress.example');
  state.users.second = await createEmulatorUser('device-b@ingress.example');
  state.users.cookie = await createEmulatorUser('cookie-probe@ingress.example');
  state.users.unverified = await createEmulatorUser('unverified@ingress.example', { verified: false });
});

after(async () => {
  await stack.stopStack();
  await stack.stopEmulators();
  if (state.deleteDriverApp) await state.deleteDriverApp();
});

test('the production runtime refuses emulator configuration in production mode', () => {
  const { firebaseAdminSettings } = backendPackage('./dist/src/auth/firebase/firebase-admin.service.js');
  const { ConfigService } = backendPackage('@nestjs/config');
  process.env.FIREBASE_AUTH_EMULATOR_HOST = `127.0.0.1:${stack.PORTS.auth}`;
  const production = new ConfigService({ FIREBASE_PROJECT_ID: 'demo-visionary-auth', FIREBASE_PROJECT_KIND: 'emulator', NODE_ENV: 'production' });
  assert.throws(() => firebaseAdminSettings(production), error => /cannot be used with a live project or production runtime/.test(error.message));
});

test('the canonical HTTPS ingress enforces exact origin and CSRF before any session is created', async () => {
  const jar = stack.cookieJar();
  const csrf = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp: '203.0.113.10' });
  assert.equal(csrf.status, 200);
  jar.capture(csrf);
  const token = await emulatorSignInToken('probe@ingress.example');

  const foreignOrigin = await stack.ingressRequest({
    pathname: '/api/auth/session', method: 'POST', deviceIp: '203.0.113.10', jar,
    body: { idToken: token }, headers: { 'x-csrf-token': csrf.body.token, origin: 'https://evil.example' },
  });
  assert.equal(foreignOrigin.status, 403, 'A non-canonical Origin must be rejected before session creation.');

  const downgradedOrigin = await stack.ingressRequest({
    pathname: '/api/auth/session', method: 'POST', deviceIp: '203.0.113.10', jar,
    body: { idToken: token }, headers: { 'x-csrf-token': csrf.body.token, origin: 'http://visionary.org.in' },
  });
  assert.equal(downgradedOrigin.status, 403, 'An HTTP-downgraded canonical origin must be rejected.');

  const missingCsrf = await stack.ingressRequest({
    pathname: '/api/auth/session', method: 'POST', deviceIp: '203.0.113.10',
    body: { idToken: token }, headers: { origin: stack.CANONICAL_ORIGIN },
  });
  assert.equal(missingCsrf.status, 403, 'A session exchange without the CSRF pair must be rejected.');

  const established = await establishDevice('probe@ingress.example', '203.0.113.10');
  assert.equal(established.profile.id, state.users.probe);
  assert.equal(established.profile.auth_source, 'firebase');
});

test('the HTTPS ingress establishes Secure host-prefixed HttpOnly SameSite=Strict cookies', async () => {
  const jar = stack.cookieJar();
  const csrf = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp: '203.0.113.10' });
  assert.equal(csrf.status, 200);
  const csrfCookies = setCookiesOf(csrf);
  assert.equal(csrfCookies.length, 1, 'The CSRF endpoint must set exactly one cookie.');
  assertHostCookie('__Host-visionary-csrf', csrfCookies[0]);

  const token = await emulatorSignInToken('cookie-probe@ingress.example');
  jar.capture(csrf);
  const session = await stack.ingressRequest({
    pathname: '/api/auth/session', method: 'POST', deviceIp: '203.0.113.10', jar,
    body: { idToken: token }, headers: { 'x-csrf-token': csrf.body.token },
  });
  assert.equal(session.status, 201);
  jar.capture(session);
  const sessionCookies = setCookiesOf(session).map(header => header.split('=')[0]).sort();
  assert.deepEqual(sessionCookies, ['__Host-visionary-device', '__Host-visionary-session'],
    'The HTTPS session exchange must establish exactly the __Host- prefixed session/device cookies');
  for (const header of setCookiesOf(session)) {
    const name = header.split('=')[0];
    if (name === '__Host-visionary-session' || name === '__Host-visionary-device') assertHostCookie(name, header);
  }
  const me = await stack.ingressRequest({ pathname: '/api/auth/me', deviceIp: '203.0.113.10', jar });
  assert.equal(me.status, 200, `The established cookie set must authenticate the next request. (${me.status} ${me.text.slice(0, 160)})`);
});

test('an unverified identity cannot establish a product session through the ingress', async () => {
  const jar = stack.cookieJar();
  const csrf = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp: '203.0.113.12' });
  jar.capture(csrf);
  const token = await emulatorSignInToken('unverified@ingress.example');
  const session = await stack.ingressRequest({
    pathname: '/api/auth/session', method: 'POST', deviceIp: '203.0.113.12', jar,
    body: { idToken: token }, headers: { 'x-csrf-token': csrf.body.token },
  });
  assert.equal(session.status, 401, 'Unverified identities must be refused.');
  assert.match(session.text, /Verify your email/);
});

test('the auth return completes onboarding and backfills the durable Free billing record', async () => {
  const device = await establishDevice('device-a@ingress.example', '203.0.113.10', { onboard: true });
  state.devices.primary = device;
  assert.equal(device.profile.id, state.users.verified);

  const me = await device.me();
  assert.equal(me.status, 200);
  assert.equal(me.body.onboarding_complete, true, 'The auth return must land on the completed setup.');

  const account = await stack.ingressRequest({ pathname: '/api/billing/account', deviceIp: device.deviceIp, jar: device.jar, headers: { 'x-visionary-account': device.profile.id } });
  assert.equal(account.status, 200);
  assert.equal(account.body.plan, 'start', 'A new account must read back the durable Free base plan.');
  assert.equal(account.body.mode, 'test');
});

test('the test-merchant checkout journey completes over the ingress with durable records', async () => {
  const device = state.devices.primary;
  const catalog = await stack.ingressRequest({ pathname: '/api/billing/catalog', deviceIp: device.deviceIp, jar: device.jar });
  assert.equal(catalog.status, 200);
  assert.equal(catalog.body.mode, 'test');
  assert.ok(catalog.body.plans.some(plan => plan.id === 'personal'));

  const commandId = randomUUID();
  const checkout = await device.post('/api/billing/checkouts', {
    plan: 'personal', interval: 'monthly', commandId, catalogVersion: catalog.body.version,
  }, { 'x-visionary-account': device.profile.id });
  assert.equal(checkout.status, 201, `Checkout failed: ${checkout.text}`);
  assert.equal(checkout.body.mode, 'test');
  assert.match(checkout.body.subscriptionId, /^sub_[A-Za-z0-9]+$/);
  assert.equal(checkout.body.keyId, 'rzp_test_ingressfixture');

  const control = await fixtureControl('/fixture/complete-payment', { subscriptionId: checkout.body.subscriptionId });
  assert.equal(control.status, 200, 'The fixture provider must complete the payment.');
  assert.match(control.body.razorpay_payment_id, /^pay_[A-Za-z0-9]+$/);

  const verify = await device.post('/api/billing/verify', {
    attemptId: checkout.body.attemptId,
    razorpay_payment_id: control.body.razorpay_payment_id,
    razorpay_subscription_id: control.body.razorpay_subscription_id,
    razorpay_signature: control.body.razorpay_signature,
  }, { 'x-visionary-account': device.profile.id });
  assert.equal(verify.status, 201, `Verify failed: ${verify.text}`);
  assert.equal(verify.body.plan, 'personal', 'The verified paid period must grant Personal.');
  assert.equal(verify.body.entitlement.source, 'personal-subscription');
  assert.ok(verify.body.entitlement.validUntil);
  assert.equal(verify.body.subscription.status, 'active');

  const invoiceId = verify.body.invoices[0]?.id;
  assert.ok(invoiceId, 'A verified payment must produce an invoice.');
  const invoice = await stack.ingressRequest({ pathname: `/api/billing/invoices/${invoiceId}`, deviceIp: device.deviceIp, jar: device.jar, headers: { 'x-visionary-account': device.profile.id } });
  assert.equal(invoice.status, 200);
  assert.equal(invoice.body.uid, state.users.verified, 'The invoice must be owner-bound to the verified UID.');
  assert.equal(invoice.body.amount, 29900);
  assert.equal(invoice.body.mode, 'test');

  const cancel = await device.post('/api/billing/cancel', { subscriptionId: checkout.body.subscriptionId, revision: verify.body.revision }, { 'x-visionary-account': device.profile.id });
  assert.equal(cancel.status, 201, `Cancel failed: ${cancel.text}`);
  assert.equal(cancel.body.subscription.cancelAtPeriodEnd, true, 'End-of-cycle cancellation must retain the paid period.');
  assert.equal(cancel.body.plan, 'personal');

  state.invoiceId = invoiceId;
  state.subscriptionId = checkout.body.subscriptionId;
  state.revisionAfterCancel = cancel.body.revision;
});

test('billing and session records are durable in the Firestore emulator (independent read path)', async () => {
  const billing = await firestoreRest(`visionary_accounts/${state.users.verified}/billing/test`);
  assert.equal(billing.status, 200, 'The durable billing record must exist.');
  assert.equal(billing.body.fields.uid.stringValue, state.users.verified);
  assert.equal(billing.body.fields.subscription.mapValue.fields.id.stringValue, state.subscriptionId);

  const invoice = await firestoreRest(`visionary_accounts/${state.users.verified}/billing/test/invoices/${state.invoiceId}`);
  assert.equal(invoice.status, 200, 'The durable invoice record must exist.');
  assert.equal(invoice.body.fields.uid.stringValue, state.users.verified);

  const sessions = await firestoreRest('visionary_auth_sessions');
  assert.ok((sessions.body.documents || []).length >= 1, 'Durable session lookups must exist.');
});

test('the full stack survives an export/import restart: session, billing and invoices persist', async () => {
  const exportDir = path.join(runDir, 'export-1');
  await stack.exportEmulators(exportDir);
  await stack.stopStack();
  await stack.stopEmulators();
  await stack.startEmulators({ importDir: exportDir, logFile: path.join(runDir, 'emulators-restart.log'), workDir: runDir });
  await stack.startStack({ runDir });

  const device = state.devices.primary;
  // The Auth Emulator re-stamps the user's token-revocation epoch on restart,
  // so every pre-restart session cookie is reported revoked. The product must
  // fail closed on that verdict — never resurrect access from a stale cookie.
  const staleMe = await device.me();
  assert.equal(staleMe.status, 401, 'A cookie the identity provider reports revoked must be rejected after the restart.');

  // Durable access is recovered by a fresh verified sign-in to the SAME account.
  const recovered = await establishDevice('device-a@ingress.example', '203.0.113.15');
  state.devices.recovered = recovered;
  const me = await recovered.me();
  assert.equal(me.status, 200, 'A fresh verified sign-in must recover the durable account.');
  assert.equal(me.body.onboarding_complete, true, 'Onboarding state must survive the restart.');

  const account = await stack.ingressRequest({ pathname: '/api/billing/account', deviceIp: recovered.deviceIp, jar: recovered.jar, headers: { 'x-visionary-account': recovered.profile.id } });
  assert.equal(account.status, 200);
  assert.equal(account.body.plan, 'personal', 'The paid entitlement must survive the restart.');
  assert.equal(account.body.revision, state.revisionAfterCancel, 'The billing revision must survive the restart.');
  assert.equal(account.body.subscription.cancelAtPeriodEnd, true, 'The cancellation request must survive the restart.');

  const invoice = await stack.ingressRequest({ pathname: `/api/billing/invoices/${state.invoiceId}`, deviceIp: recovered.deviceIp, jar: recovered.jar, headers: { 'x-visionary-account': recovered.profile.id } });
  assert.equal(invoice.status, 200, 'Owner-scoped invoices must survive the restart.');

  const sessions = await firestoreRest('visionary_auth_sessions');
  assert.ok((sessions.body.documents || []).length >= 1, 'Durable session lookups must survive the restart.');
});

test('a second device of the same account shares durable state with its own session', async () => {
  const second = await establishDevice('device-a@ingress.example', '203.0.113.11');
  state.devices.second = second;
  assert.equal(second.profile.id, state.users.verified, 'The second device must sign in to the same verified account.');

  const devices = await firestoreRest(`visionary_accounts/${state.users.verified}/devices`);
  const sessionIds = new Set((devices.body.documents || []).map(doc => doc.name.split('/').pop()));
  assert.ok(sessionIds.size >= 2, `The account must carry distinct durable device sessions (found ${sessionIds.size}).`);
  const recoveredId = stack.sha256(state.devices.recovered.jar.get('__Host-visionary-device'));
  const secondId = stack.sha256(second.jar.get('__Host-visionary-device'));
  assert.ok(sessionIds.has(recoveredId), 'The recovered device session must be a durable record.');
  assert.ok(sessionIds.has(secondId), 'The second device session must be a distinct durable record.');

  const account = await stack.ingressRequest({ pathname: '/api/billing/account', deviceIp: second.deviceIp, jar: second.jar, headers: { 'x-visionary-account': second.profile.id } });
  assert.equal(account.status, 200);
  assert.equal(account.body.plan, 'personal', 'The second device must read the same durable paid state.');

  const other = await establishDevice('device-b@ingress.example', '203.0.113.13');
  state.devices.otherAccount = other;
  const otherAccount = await stack.ingressRequest({ pathname: '/api/billing/account', deviceIp: other.deviceIp, jar: other.jar, headers: { 'x-visionary-account': other.profile.id } });
  assert.equal(otherAccount.status, 200);
  assert.equal(otherAccount.body.plan, 'start', 'A different account must not observe the paid state.');
});

test('device-scoped logout revokes only that device; logout-all revokes every device of the account', async () => {
  const first = state.devices.recovered, second = state.devices.second, other = state.devices.otherAccount;

  assert.equal((await first.me()).status, 200);
  await first.post('/api/auth/logout', {});
  assert.equal((await first.me()).status, 401, 'The signing-out device must lose access immediately.');
  assert.equal((await second.me()).status, 200, 'The second device of the same account must keep its independent session.');
  assert.equal((await other.me()).status, 200, 'A different account is unaffected by another account logout.');

  await second.post('/api/auth/logout-all', {}, { 'x-visionary-account': second.profile.id });
  assert.equal((await second.me()).status, 401, 'Logout-all must end the issuing device session.');
  assert.equal((await other.me()).status, 200, 'Logout-all must remain scoped to its own account.');

  // Firebase auth_time has second precision: a sign-in in the same second as
  // the cutoff must be repeated after that second, so wait for the boundary.
  const cutoffSecond = Math.floor(Date.now() / 1000);
  while (Math.floor(Date.now() / 1000) <= cutoffSecond) await stack.delay(100);
  const fresh = await establishDevice('device-a@ingress.example', '203.0.113.14');
  const freshMe = await fresh.me();
  assert.equal(freshMe.status, 200, 'A fresh sign-in after the cutoff second must recover access.');
  assert.equal(freshMe.body.onboarding_complete, true, 'The recovered session must retain completed setup.');
});

test('the ingress serves the production security-header surface and health probes over TLS', async () => {
  const page = await stack.ingressRequest({ pathname: '/', deviceIp: '203.0.113.10' });
  assert.equal(page.status, 200);
  assert.equal(page.headers['strict-transport-security'], 'max-age=31536000', 'HSTS must be present on the canonical HTTPS ingress.');
  assert.equal(page.headers['x-frame-options'], 'DENY');
  assert.match(page.headers['content-security-policy'], /frame-ancestors 'none'/);
  assert.equal(page.headers['x-visionary-revision'], 'b1a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0');
  assert.equal(page.headers['cache-control'], 'no-cache');

  const health = await stack.ingressRequest({ pathname: '/api/health', deviceIp: '203.0.113.10' });
  assert.equal(health.status, 200);
  assert.deepEqual(health.body, { status: 'ok', authPolicy: { version: 1, globalSignOut: true } });

  const deployCheck = await stack.ingressRequest({ pathname: '/__deploy-check', deviceIp: '203.0.113.10' });
  assert.equal(deployCheck.status, 200);
  assert.equal(typeof deployCheck.body.forwardedForSanitized, 'boolean');

  const unknownApi = await stack.ingressRequest({ pathname: '/api/unknown', deviceIp: '203.0.113.10' });
  assert.equal(unknownApi.status, 404);
  assert.match(unknownApi.headers['content-type'] || '', /json/, 'Unknown API paths must stay JSON errors.');

  const tampered = await stack.ingressRequest({ pathname: '/api/auth/me', deviceIp: '203.0.113.10', headers: { cookie: '__Host-visionary-session=deadbeef; __Host-visionary-device=cafebabe' } });
  assert.equal(tampered.status, 401, 'A forged session cookie must be rejected by the ingress-facing runtime.');
});

test('registered fail-fast law: a deliberate assertion failure fails this suite', async t => {
  if (process.env.BILL01_SELF_TEST_FAIL !== '1') { t.skip('Self-test law runs only with BILL01_SELF_TEST_FAIL=1.'); return; }
  assert.equal('deliberate', 'failure', 'The deliberate self-test must fail the registered command.');
});

async function fixtureControl(pathname, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body || {});
    const request = http.request({ host: '127.0.0.1', port: stack.PORTS.control, path: pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, response => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body: data ? JSON.parse(data) : null, text: data }));
    });
    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}
