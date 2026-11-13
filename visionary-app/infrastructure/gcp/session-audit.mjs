import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// PLAT-05 session/auth-boundary audit: read-only external probes against the
// canonical origin plus a source-level check of the committed cookie
// contract. Proves what an ordinary client can verify without credentials -
// authorized sign-in methods, CSRF/session cookie posture, session issuance
// refusal on invalid credentials, anonymous authority boundaries and the
// reviewed auth domains in the content security policy. Real account
// sign-in, email verification/reset delivery and console provider settings
// stay founder-gated; this audit never closes them.

export const expected = Object.freeze({
  origin: 'https://visionary.org.in',
  revisionPattern: /^[a-f0-9]{40}$/,
  methods: Object.freeze({ email: true, google: true, phone: true }),
  cookiePrefix: '__Host-visionary-',
  cookies: Object.freeze(['session', 'device', 'csrf']),
  authConnectHosts: Object.freeze(['identitytoolkit.googleapis.com', 'securetoken.googleapis.com', 'visionary-research.firebaseapp.com']),
  authFrameHosts: Object.freeze(['visionary-research.firebaseapp.com']),
});

const pass = detail => ({ pass: true, detail });
const refuse = detail => ({ pass: false, detail });

// The authorized sign-in methods must be served, cache-exempt and attested.
export async function auditSignInMethods(fetchImpl = fetch, origin = expected.origin) {
  const response = await fetchImpl(origin + '/api/auth/methods', { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  if (response.status !== 200) return refuse(`methods status ${response.status}`);
  if (response.headers.get('cache-control') !== 'no-store') return refuse('methods response is cacheable');
  if (!expected.revisionPattern.test(response.headers.get('x-visionary-revision') || '')) return refuse('methods response lacks revision attestation');
  let methods;
  try { methods = await response.json(); }
  catch { return refuse('methods response is malformed'); }
  if (!methods || typeof methods !== 'object' || Array.isArray(methods)) return refuse('methods response is not an object');
  const mismatch = Object.entries(expected.methods).filter(([name, enabled]) => methods[name] !== enabled);
  if (mismatch.length) return refuse(`sign-in methods deviate from the reviewed set: ${mismatch.map(([n, e]) => `${n}=${methods[n]} (expected ${e})`).join(', ')}`);
  const extra = Object.keys(methods).filter(name => !Object.hasOwn(expected.methods, name));
  if (extra.length) return refuse(`unreviewed sign-in methods exposed: ${extra.join(', ')}`);
  return pass(`exactly the reviewed methods live: ${Object.keys(expected.methods).join(', ')}`);
}

// The CSRF cookie must carry the reviewed __Host- posture with a 64-hex
// token. The __Host- contract also requires Path=/ and no Domain attribute —
// browsers silently reject the cookie otherwise, which would break CSRF end
// to end while looking correct here.
async function readCsrfCredential(fetchImpl, origin) {
  const response = await fetchImpl(origin + '/api/auth/csrf', { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  if (response.status !== 200 || response.headers.get('cache-control') !== 'no-store') throw Error('CSRF token response must be HTTP 200 and no-store');
  let token;
  try { token = (await response.json())?.token; }
  catch { throw Error('CSRF token response is malformed'); }
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw Error('CSRF token missing or malformed');
  const [cookie, ...flags] = (response.headers.get('set-cookie') || '').split(';').map(value => value.trim());
  if (!cookie.startsWith(expected.cookiePrefix + 'csrf=')) throw Error(`cookie is not ${expected.cookiePrefix}csrf`);
  const attributes = flags.map(value => value.toLowerCase());
  if (attributes.some(value => /^domain(?:=|$)/.test(value))) throw Error('CSRF cookie carries a Domain attribute');
  const scope = attributes.filter(value => /^(?:path|samesite)=/.test(value));
  if (scope.length !== 2 || !['secure', 'httponly', 'samesite=strict', 'path=/'].every(flag => attributes.includes(flag))) {
    throw Error('CSRF cookie is missing the required Secure, HttpOnly, SameSite=Strict, or Path=/ posture');
  }
  if (cookie !== expected.cookiePrefix + 'csrf=' + token) throw Error('CSRF cookie does not match the response token');
  return { cookie, token };
}

export async function auditCsrfCookiePosture(fetchImpl = fetch, origin = expected.origin) {
  try { await readCsrfCredential(fetchImpl, origin); }
  catch (error) { return refuse(error.message); }
  return pass('__Host- prefixed Secure/HttpOnly/SameSite=Strict Path=/ CSRF cookie');
}

// A session issuance attempt with invalid credentials must be refused without
// issuing any session/device cookie.
export async function auditInvalidSessionRefusal(fetchImpl = fetch, origin = expected.origin) {
  let credentials;
  try { credentials = await readCsrfCredential(fetchImpl, origin); }
  catch (error) { return refuse(error.message); }
  const { cookie, token } = credentials;
  const response = await fetchImpl(origin + '/api/auth/session', {
    method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(15000),
    headers: { Origin: origin, Cookie: cookie, 'X-CSRF-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'x'.repeat(600) }),
  });
  if (response.status >= 200 && response.status < 300) return refuse('an invalid credential session attempt was accepted');
  if (response.status !== 401) return refuse(`invalid session attempt returned ${response.status}, expected 401`);
  if (response.headers.get('cache-control') !== 'no-store') return refuse('session refusal is cacheable');
  const setCookie = response.headers.get('set-cookie') || '';
  if (/(?:^|,\s*)(?:__Host-)?visionary-(?:session|device)=/i.test(setCookie)) return refuse('a session/device cookie was issued on a refused attempt');
  return pass(`invalid credentials refused ${response.status} with no session/device cookie issued`);
}

// A default audit uses a route that denies anonymous requests before writing.
export async function auditSessionOriginAndCsrf(fetchImpl = fetch, origin = expected.origin) {
  const { cookie, token } = await readCsrfCredential(fetchImpl, origin);
  for (const [requestOrigin, status] of [[origin, 401], ['https://invalid.example', 403]]) {
    const response = await fetchImpl(origin + '/api/auth/onboarding', {
      method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(15000),
      headers: { Origin: requestOrigin, Cookie: cookie, 'X-CSRF-Token': token, 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (response.status !== status || response.headers.get('cache-control') !== 'no-store') {
      return refuse(`onboarding probe expected HTTP ${status} and no-store`);
    }
  }
  return pass('same-origin anonymous request refused 401 and cross-origin request refused 403');
}

// Anonymous callers stay refused without identity leakage (PLAT-05 boundary).
export async function auditAnonymousAuthorityBoundaries(fetchImpl = fetch, origin = expected.origin) {
  for (const path of ['/api/auth/me', '/api/account/overview']) {
    const response = await fetchImpl(origin + path, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    if (response.status !== 401) return refuse(`${path} returned ${response.status} for an anonymous caller`);
    if (response.headers.get('cache-control') !== 'no-store') return refuse(`${path} refusal is cacheable`);
    let error;
    try { error = await response.json(); }
    catch { return refuse(`${path} did not return a JSON error envelope`); }
    if (!error || Object.keys(error).length !== 3 || error.statusCode !== 401 ||
        typeof error.error !== 'string' || typeof error.message !== 'string') return refuse(`${path} did not return the anonymous error envelope`);
  }
  return pass('anonymous authority boundaries refuse 401, no-store');
}

// The content security policy must connect and frame only the reviewed auth
// domains - no unknown authentication hosts.
export async function auditAuthorizedAuthDomains(fetchImpl = fetch, origin = expected.origin) {
  const response = await fetchImpl(origin + '/login', { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  const csp = response.headers.get('content-security-policy') || '';
  if (response.status !== 200) return refuse(`login page status ${response.status}`);
  const authSources = hosts => hosts.map(host => 'https://' + host);
  const approved = [
    ['connect-src', authSources(expected.authConnectHosts), ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com',
      'https://lumberjack.razorpay.com', 'https://www.google.com/recaptcha/', 'https://www.gstatic.com/recaptcha/']],
    ['frame-src', authSources(expected.authFrameHosts), ['https://api.razorpay.com', 'https://checkout.razorpay.com',
      'https://www.google.com/recaptcha/', 'https://recaptcha.google.com/recaptcha/']],
  ];
  const directives = csp.split(';').map(value => value.trim().split(/\s+/));
  for (const [name, required, optional] of approved) {
    const matching = directives.filter(([directive]) => directive.toLowerCase() === name);
    if (matching.length !== 1) return refuse(`CSP must declare ${name} exactly once`);
    const sources = matching[0].slice(1);
    const bad = sources.find(source => source.includes('*') || /:$/.test(source) || /unsafe-/.test(source));
    if (bad) return refuse(`CSP ${name} allows wildcard/unsafe source ${bad}`);
    const missing = required.filter(source => !sources.includes(source));
    if (missing.length) return refuse(`CSP ${name} is missing reviewed auth hosts: ${missing.map(source => new URL(source).hostname).join(', ')}`);
    if (sources.some(source => !required.includes(source) && !optional.includes(source))) return refuse(`CSP ${name} contains an unreviewed source`);
  }
  return pass('CSP connects/frames exactly the reviewed Firebase auth domains plus the reviewed payment/recaptcha hosts');
}

// Source-level cookie contract: the committed authority code must keep the
// __Host- prefix, strict/httpOnly/secure flags and the HTTPS-only production
// refusal - the flags a live session would carry (issuance needs a real
// sign-in and stays founder-gated).
export function auditSessionCookieContract(source = undefined) {
  const text = source ?? readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../backend/upstream/backend/src/auth/firebase-product/request-authority.ts'), 'utf8');
  for (const [pattern, label] of [
    [/__Host-visionary-/, '__Host- cookie prefix for secure origins'],
    [/httpOnly:\s*true/, 'httpOnly cookie flag'],
    [/sameSite:\s*'strict'/, 'SameSite=Strict cookie flag'],
    [/secure:\s*this\.settings\(\)\.secure/, 'secure cookie flag bound to the HTTPS origin'],
    [/path:\s*'\/'/, 'Path=/ cookie flag'],
    [/Production authentication requires HTTPS/, 'production HTTPS refusal'],
  ]) {
    if (!pattern.test(text)) return refuse(`session cookie contract is missing: ${label}`);
  }
  return pass('__Host- prefix, httpOnly, Secure, SameSite=Strict and the production HTTPS refusal are all committed');
}

export async function runSessionAudit({ origin = expected.origin, fetchImpl = fetch, cookieSource = undefined, probeInvalidSession = false } = {}) {
  const results = [];
  const step = async (check, action) => { try { results.push({ check, ...(await action()) }); } catch (error) { results.push({ check, ...refuse(`probe failed: ${String(error.message).slice(0, 160)}`) }); } };
  await step('sign-in-methods', () => auditSignInMethods(fetchImpl, origin));
  await step('csrf-cookie-posture', () => auditCsrfCookiePosture(fetchImpl, origin));
  await step('session-origin-and-csrf', () => auditSessionOriginAndCsrf(fetchImpl, origin));
  if (probeInvalidSession) await step('invalid-session-refusal', () => auditInvalidSessionRefusal(fetchImpl, origin));
  await step('anonymous-authority-boundaries', () => auditAnonymousAuthorityBoundaries(fetchImpl, origin));
  await step('authorized-auth-domains', () => auditAuthorizedAuthDomains(fetchImpl, origin));
  await step('session-cookie-contract', async () => auditSessionCookieContract(cookieSource));
  const failed = results.filter(r => !r.pass);
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'REFUSE'} ${r.check}: ${r.detail}`);
  console.log(failed.length ? `SESSION AUDIT FAILED: ${failed.length} check(s) refused.` : 'SESSION AUDIT PASSED: reviewed hosted session boundaries verified. Provider email delivery requires separate evidence.');
  return { results, passed: failed.length === 0 };
}

if (process.argv[1]?.endsWith('session-audit.mjs')) {
  runSessionAudit({ probeInvalidSession: process.argv.includes('--probe-invalid-session') }).then(r => { if (!r.passed) process.exitCode = 1; }).catch(error => { console.error('SESSION AUDIT ERROR:', error.message); process.exitCode = 1; });
}
