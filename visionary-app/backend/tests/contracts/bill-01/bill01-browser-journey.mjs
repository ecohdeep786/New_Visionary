// BILL-01 (KAN-102) canonical HTTPS-ingress acceptance — browser journey.
//
// Drives the real product runtime over the real TLS terminator with a real
// browser (Microsoft Edge via playwright-core) so the cookie law is enforced
// by an actual browser engine, not asserted from Set-Cookie text: the
// `__Host-` prefixed Secure/HttpOnly/SameSite=Strict cookies are stored and
// applied by the browser on the canonical https://visionary.org.in origin,
// the HttpOnly session cookie is invisible to page script, a cross-site page
// cannot ride the session, and two independent browser contexts behave as two
// devices sharing one durable account. Fixture-only: the identity plane is the
// authorized Auth Emulator and the payment provider is the fictional fixture;
// hosted deployment and real test-merchant credentials remain external gates.

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import assert from 'node:assert/strict';

import stack from './stack.cjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(here, '../../../..');
const frontendPackage = createRequire(path.join(productRoot, 'frontend/package.json'));
const backendPackage = createRequire(path.join(productRoot, 'backend/upstream/backend/package.json'));

const INGRESS = stack.PORTS.ingress === 443 ? stack.CANONICAL_ORIGIN : `${stack.CANONICAL_ORIGIN}:${stack.PORTS.ingress}`;
const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function emulatorSignInToken(email) {
  const response = await fetch(`http://127.0.0.1:${stack.PORTS.auth}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'ingress-acceptance-Pass1', returnSecureToken: true }),
  });
  assert.equal(response.status, 200, `Auth Emulator sign-in failed for ${email}`);
  return (await response.json()).idToken;
}

// Establishes a real browser device on the canonical HTTPS origin and returns
// the in-page helpers plus the context cookie facts.
async function establishBrowserDevice(browser, email, { onboard = false } = {}) {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    baseURL: INGRESS,
    viewport: { width: 1280, height: 900 },
    userAgent: 'bill01-ingress-browser-journey/1.0',
  });
  await context.addInitScript(() => { window.__deviceMarker = Math.random().toString(36).slice(2); });
  const page = await context.newPage();
  await page.goto('/');

  const token = await emulatorSignInToken(email);
  const exchange = await page.evaluate(async idToken => {
    const csrf = await fetch('/api/auth/csrf', { credentials: 'include' }).then(r => r.json());
    const session = await fetch('/api/auth/session', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf.token },
      body: JSON.stringify({ idToken }),
    });
    const profile = await session.json().catch(() => null);
    return { status: session.status, profile };
  }, token);
  assert.equal(exchange.status, 201, `Browser session exchange failed: ${JSON.stringify(exchange)}`);

  const cookies = await context.cookies(INGRESS);
  const byName = Object.fromEntries(cookies.map(cookie => [cookie.name, cookie]));
  for (const name of ['__Host-visionary-session', '__Host-visionary-device']) {
    const cookie = byName[name];
    assert.ok(cookie, `${name} must be present in the browser cookie store`);
    assert.equal(cookie.secure, true, `${name} must be Secure in the browser store`);
    assert.equal(cookie.httpOnly, true, `${name} must be HttpOnly in the browser store`);
    assert.equal(cookie.sameSite, 'Strict', `${name} must be SameSite=Strict in the browser store`);
    assert.equal(cookie.path, '/', `${name} must be scoped to Path=/`);
    // Playwright reports a host-only cookie as the exact hostname; a Domain
    // attribute would surface with a leading dot.
    assert.ok(!cookie.domain.startsWith('.'), `${name} must be host-only (no Domain attribute)`);
  }

  const sessionInvisible = await page.evaluate(() => !document.cookie.includes('__Host-visionary-session'));
  assert.equal(sessionInvisible, true, 'The HttpOnly session cookie must be invisible to page script.');

  const me = await page.evaluate(async () => {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    return { status: response.status, body: await response.json() };
  });
  assert.equal(me.status, 200, 'The browser-established session must authenticate the next same-origin request.');

  const post = async (pathname, body, extraHeaders = {}) => page.evaluate(async ({ pathname, body, extraHeaders }) => {
    const csrf = await fetch('/api/auth/csrf', { credentials: 'include' }).then(r => r.json());
    const response = await fetch(pathname, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf.token, ...extraHeaders },
      body: JSON.stringify(body || {}),
    });
    return { status: response.status, body: await response.json().catch(() => null) };
  }, { pathname, body, extraHeaders });

  if (onboard) {
    const completed = await post('/api/auth/onboarding', { identity: 'professional', age_band: 'adult', full_name: 'QA Browser Journey', preferred_language: 'English' }, { 'X-Visionary-Account': me.body.id });
    assert.equal(completed.status, 201, `Browser onboarding failed: ${JSON.stringify(completed)}`);
  }
  return { context, page, profile: me.body, post };
}

async function fixtureControl(pathname, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body || {});
    const request = http.request({ host: '127.0.0.1', port: stack.PORTS.control, path: pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, response => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body: data ? JSON.parse(data) : null }));
    });
    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

let runDir;
let adminApp;
let browser;

try {
  stack.assertRunnable();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  runDir = process.env.BILL01_RUN_DIR || path.join(productRoot, 'artifacts/qa/bill01-ingress-acceptance', `browser-${stamp}`);
  mkdirSync(runDir, { recursive: true });
  await stack.startEmulators({ logFile: path.join(runDir, 'emulators.log'), workDir: runDir });
  await stack.startStack({ runDir });

  const { initializeApp, deleteApp } = backendPackage('firebase-admin/app');
  adminApp = initializeApp({
    projectId: stack.AUTH_EMULATOR_PROJECT,
    credential: { getAccessToken: async () => ({ access_token: 'emulator-only', expires_in: 3600 }) },
  }, 'bill01-browser-driver');
  const { getAuth } = backendPackage('firebase-admin/auth');
  await getAuth(adminApp).createUser({ email: 'browser@ingress.example', password: 'ingress-acceptance-Pass1', emailVerified: true });

  const { chromium } = frontendPackage('playwright-core');
  const channel = process.env.QA_BROWSER_CHANNEL || 'msedge';
  browser = await chromium.launch({ channel, headless: true, args: [`--host-resolver-rules=MAP ${stack.HOSTNAME} 127.0.0.1`] });
  record('browser launched', true, `${channel} (host-resolver-rules pins ${stack.HOSTNAME} to the loopback ingress)`);

  // --- Device one: full auth return + checkout journey in a real browser --- //
  const first = await establishBrowserDevice(browser, 'browser@ingress.example', { onboard: true });
  record('device one: secure cookie set + HttpOnly invisibility + auth return', true, first.profile.id);

  const catalog = await first.page.evaluate(async () => {
    const response = await fetch('/api/billing/catalog', { credentials: 'include' });
    return { status: response.status, body: await response.json() };
  });
  assert.equal(catalog.status, 200);
  const commandId = crypto.randomUUID();
  const checkout = await first.post('/api/billing/checkouts', { plan: 'personal', interval: 'monthly', commandId, catalogVersion: catalog.body.version }, { 'X-Visionary-Account': first.profile.id });
  assert.equal(checkout.status, 201, `Browser checkout failed: ${JSON.stringify(checkout)}`);
  const control = await fixtureControl('/fixture/complete-payment', { subscriptionId: checkout.body.subscriptionId });
  assert.equal(control.status, 200);
  const verify = await first.post('/api/billing/verify', {
    attemptId: checkout.body.attemptId,
    razorpay_payment_id: control.body.razorpay_payment_id,
    razorpay_subscription_id: control.body.razorpay_subscription_id,
    razorpay_signature: control.body.razorpay_signature,
  }, { 'X-Visionary-Account': first.profile.id });
  assert.equal(verify.status, 201, `Browser verify failed: ${JSON.stringify(verify)}`);
  assert.equal(verify.body.plan, 'personal', 'The browser-verified payment must grant Personal.');
  record('device one: test-merchant checkout journey over the browser session', true, `plan=${verify.body.plan} validUntil=${verify.body.entitlement.validUntil}`);

  // --- Device two: an independent browser context is a second device ------ //
  const second = await establishBrowserDevice(browser, 'browser@ingress.example', { onboard: false });
  record('device two: independent context signs in as its own device session', true, second.profile.id);
  const secondAccount = await second.page.evaluate(async account => {
    const response = await fetch('/api/billing/account', { credentials: 'include', headers: { 'X-Visionary-Account': account } });
    return { status: response.status, body: await response.json() };
  }, second.profile.id);
  assert.equal(secondAccount.status, 200);
  assert.equal(secondAccount.body.plan, 'personal', 'The second device must read the same durable paid state.');
  record('device two: shares the durable paid account state', true, `plan=${secondAccount.body.plan}`);

  // --- SameSite=Strict: a cross-site page cannot ride the session --------- //
  // Observe the outgoing request headers directly: the same-origin request
  // must carry the session cookies, the cross-site request must not. (A
  // cross-site fetch's response is CORS-blocked, so the response status alone
  // cannot prove which cookies the browser actually sent.)
  let sameSiteCookieSeen = null;
  let crossSiteCookieSeen = null;
  await first.context.route('**/api/auth/me', route => {
    const cookie = route.request().headers()['cookie'] || null;
    const site = route.request().frame()?.url() || '';
    if (site.startsWith(`http://127.0.0.1:${stack.PORTS.control}`)) crossSiteCookieSeen = cookie;
    else sameSiteCookieSeen = cookie;
    return route.continue().catch(() => route.abort());
  });
  const sameSiteStatus = await first.page.evaluate(async () => {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    return response.status;
  });
  await first.page.goto(`http://127.0.0.1:${stack.PORTS.control}/fixture/cross-site`);
  await first.page.evaluate(async origin => {
    try { await fetch(`${origin}/api/auth/me`, { credentials: 'include' }); } catch { /* CORS-blocked response is expected */ }
  }, INGRESS);
  await first.context.unroute('**/api/auth/me');
  assert.equal(sameSiteStatus, 200, 'The same-origin request must still authenticate.');
  assert.ok(sameSiteCookieSeen && sameSiteCookieSeen.includes('__Host-visionary-session='), 'The same-origin request must carry the session cookie.');
  assert.equal(crossSiteCookieSeen, null, 'SameSite=Strict must withhold the session cookies from cross-site requests.');
  // Return the page to the canonical origin so subsequent relative fetches
  // target the product API, not the fixture control plane.
  await first.page.goto(`${INGRESS}/`);
  record('cross-site page cannot ride the SameSite=Strict session', true, 'same-origin request carried the cookies; the cross-site request carried none');

  // --- Device-scoped logout inside the real browser ------------------------ //
  const logout = await second.post('/api/auth/logout', {});
  assert.equal(logout.status, 201);
  const secondAfterLogout = await second.page.evaluate(async () => {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    return response.status;
  });
  assert.equal(secondAfterLogout, 401, 'The signed-out device must lose access.');
  const firstStillLive = await first.page.evaluate(async () => {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    return response.status;
  });
  assert.equal(firstStillLive, 200, 'The other device must keep its independent session.');
  record('device-scoped logout enforced across real browser contexts', true, 'device two 401, device one 200');
} catch (error) {
  record('browser journey aborted', false, String(error && error.message || error).slice(0, 300));
  process.exitCode = 1;
} finally {
  try { if (browser) await browser.close(); } catch {}
  try { if (adminApp) await backendPackage('firebase-admin/app').deleteApp(adminApp); } catch {}
  await stack.stopStack();
  await stack.stopEmulators();
  const failed = results.filter(result => !result.ok);
  console.log(`\nBILL-01 browser journey: ${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) process.exitCode = 1;
}
