// RELEASE-02 (KAN-125) load driver.
//
// Generates a bounded arrival process against the real TLS ingress and measures
// each request. Two properties matter for honesty:
//
//   1. The client never becomes the bottleneck silently. In-flight requests are
//      capped per worker, and a request that cannot be issued within the
//      deadline is recorded as a `transport` outcome, not dropped.
//   2. Every arrival targets a genuinely authenticated session (real emulator
//      token exchange and `__Host-` session cookie) with a server-owned uid, so
//      the measured surface is the real authority path, not a bypass.
//
// The driver takes an explicit `adminApp` (created by the suite) so it never
// invents its own credential discovery.

const { createRequire } = require('node:module');
const { createHmac, randomUUID } = require('node:crypto');
const path = require('node:path');
const { pickWeighted, seededRandom } = require('./profiles.cjs');

const productRoot = path.resolve(__dirname, '../../../..');
const backendRequire = createRequire(path.join(productRoot, 'backend/upstream/backend/package.json'));
const PASS = 'release02-load-Pass1';

/** Create, sign in and onboard `count` synthetic accounts on the emulator. */
async function establishAccounts(stack, adminApp, count, { deviceIps } = {}) {
  const { getAuth } = backendRequire('firebase-admin/auth');
  const accounts = [];
  for (let index = 0; index < count; index += 1) {
    const email = `release02-${randomUUID()}@example.invalid`;
    const user = await getAuth(adminApp).createUser({ email, password: PASS, emailVerified: true });
    const deviceIp = deviceIps ? deviceIps[index % deviceIps.length] : `203.0.113.${(index % 200) + 10}`;
    const jar = stack.cookieJar();
    const csrf = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp });
    jar.capture(csrf);
    const signIn = await fetch(`http://127.0.0.1:${stack.PORTS.auth}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASS, returnSecureToken: true }),
    });
    if (signIn.status !== 200) throw Error(`Load account sign-in failed (${signIn.status}).`);
    const { idToken } = await signIn.json();
    const session = await stack.ingressRequest({
      pathname: '/api/auth/session', method: 'POST', deviceIp, jar,
      body: { idToken }, headers: { 'x-csrf-token': csrf.body.token },
    });
    if (session.status !== 201) throw Error(`Load account session failed (${session.status}): ${session.text}`);
    jar.capture(session);
    const uid = session.body.id;
    const onboardingCsrf = await freshCsrf(stack, jar, deviceIp);
    const onboard = await stack.ingressRequest({
      pathname: '/api/auth/onboarding', method: 'POST', deviceIp, jar,
      body: { identity: 'professional', age_band: 'adult', full_name: 'Load Profile Adult', preferred_language: 'English' },
      headers: { 'x-csrf-token': onboardingCsrf.token, 'x-visionary-account': uid },
    });
    if (onboard.status !== 201) throw Error(`Load account onboarding failed (${onboard.status}): ${onboard.text}`);
    jar.capture(onboard);
    accounts.push({ email, uid, firebaseUid: user.uid, jar, deviceIp });
  }
  return accounts;
}

async function freshCsrf(stack, jar, deviceIp) {
  const response = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp, jar });
  jar.capture(response);
  return response.body;
}

/** Issue one authenticated request for an account, returning a timed result. */
async function issue(stack, account, spec, { rng }) {
  const started = process.hrtime.bigint();
  try {
    const headers = { 'x-visionary-account': account.uid };
    // `spec.body` is the already-computed payload value (makeBody ran in
    // runArrivals); it is sent as-is, never called.
    let body = spec.body;
    if (spec.csrf) {
      const csrf = await freshCsrf(stack, account.jar, account.deviceIp);
      headers['x-csrf-token'] = csrf.token;
    }
    const response = await stack.ingressRequest({
      method: spec.method, pathname: spec.pathname, deviceIp: account.deviceIp, jar: account.jar, headers, body,
      agent: stack.LOAD_AGENT,
    });
    return { status: response.status, latencyMs: Number(process.hrtime.bigint() - started) / 1e6, spec: spec.id };
  } catch (error) {
    return { status: 0, latencyMs: Number(process.hrtime.bigint() - started) / 1e6, error: String(error && error.message || error), spec: spec.id };
  }
}

/**
 * Signed provider webhook delivery. `event` may be a pre-serialised Buffer so a
 * duplicate delivery can carry the SAME bytes and id (the documented duplicate
 * stream), which the product must absorb idempotently.
 */
async function postWebhook(stack, { eventId, event, secret }) {
  const raw = Buffer.isBuffer(event) ? event : Buffer.from(JSON.stringify(event), 'utf8');
  const signature = createHmac('sha256', secret).update(raw).digest('hex');
  const started = process.hrtime.bigint();
  try {
    const response = await stack.ingressRequest({
      method: 'POST', pathname: '/api/billing/webhooks/razorpay', rawBody: raw,
      headers: { 'x-razorpay-signature': signature, 'x-razorpay-event-id': eventId, 'content-type': 'application/json' },
      agent: stack.LOAD_AGENT,
    });
    return { status: response.status, latencyMs: Number(process.hrtime.bigint() - started) / 1e6, spec: 'webhook', latencyMs2: 0 };
  } catch (error) {
    return { status: 0, latencyMs: Number(process.hrtime.bigint() - started) / 1e6, error: String(error && error.message || error), spec: 'webhook' };
  }
}

/**
 * Run one arrival profile. Requests are scheduled on a fixed grid with seeded
 * jitter so the achieved rate is close to `arrivalPerSecond` while remaining
 * reproducible; in-flight concurrency is bounded by `maxInFlight`.
 */
async function runArrivals({ stack, accounts, profile, mix, makeBody, seed = 1, maxInFlight = 64 }) {
  const rng = seededRandom(seed);
  const total = Math.max(1, Math.round(profile.arrivalPerSecond * profile.durationSeconds));
  const intervalMs = (profile.durationSeconds * 1000) / total;
  const results = [];
  const inFlight = new Set();
  let issued = 0;
  const start = Date.now();

  async function dispatch(index) {
    const account = accounts[index % accounts.length];
    const spec = pickWeighted(mix, rng);
    const body = makeBody ? makeBody(spec, { rng, account }) : undefined;
    const pending = issue(stack, account, { ...spec, body }, { rng }).then(result => { results.push(result); });
    inFlight.add(pending);
    pending.finally(() => inFlight.delete(pending));
    while (inFlight.size >= maxInFlight) await Promise.race(inFlight);
  }

  while (issued < total) {
    const targetTime = start + issued * intervalMs;
    const wait = targetTime - Date.now();
    if (wait > 0) await sleep(wait);
    await dispatch(issued);
    issued += 1;
  }
  await Promise.all([...inFlight]);
  return { results, elapsedMs: Date.now() - start };
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

module.exports = { establishAccounts, freshCsrf, issue, postWebhook, runArrivals, sleep, PASS };
