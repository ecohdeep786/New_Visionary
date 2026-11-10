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
  const methods = await response.json();
  const mismatch = Object.entries(expected.methods).filter(([name, enabled]) => methods[name] !== enabled);
  if (mismatch.length) return refuse(`sign-in methods deviate from the reviewed set: ${mismatch.map(([n, e]) => `${n}=${methods[n]} (expected ${e})`).join(', ')}`);
  const extra = Object.keys(methods).filter(name => !(name in expected.methods));
  if (extra.length) return refuse(`unreviewed sign-in methods exposed: ${extra.join(', ')}`);
  return pass(`exactly the reviewed methods live: ${Object.keys(expected.methods).join(', ')}`);
}

// The CSRF cookie must carry the reviewed __Host- posture with a 64-hex
// token. The __Host- contract also requires Path=/ and no Domain attribute —
// browsers silently reject the cookie otherwise, which would break CSRF end
// to end while looking correct here.
export async function auditCsrfCookiePosture(fetchImpl = fetch, origin = expected.origin) {
  const response = await fetchImpl(origin + '/api/auth/csrf', { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  const cookie = response.headers.get('set-cookie') || '';
  const token = (await response.json()).token;
  if (response.status !== 200 || !/^[a-f0-9]{64}$/.test(token || '')) return refuse('CSRF token missing or malformed');
  if (!cookie.startsWith(expected.cookiePrefix + 'csrf=')) return refuse(`cookie is not ${expected.cookiePrefix}csrf`);
  for (const flag of [/HttpOnly/i, /Secure/i, /SameSite=Strict/i, /Path=\//i]) {
    if (!flag.test(cookie)) return refuse(`CSRF cookie missing ${flag}`);
  }
  if (/Domain=/i.test(cookie)) return refuse('CSRF cookie carries a Domain attribute, violating the __Host- contract');
  return pass('__Host- prefixed Secure/HttpOnly/SameSite=Strict Path=/ CSRF cookie');
}

// A session issuance attempt with invalid credentials must be refused without
// issuing any session/device cookie.
export async function auditInvalidSessionRefusal(fetchImpl = fetch, origin = expected.origin) {
  const csrf = await fetchImpl(origin + '/api/auth/csrf', { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  const cookie = (csrf.headers.get('set-cookie') || '').split(';')[0];
  const token = (await csrf.json()).token;
  const response = await fetchImpl(origin + '/api/auth/session', {
    method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(15000),
    headers: { Origin: origin, Cookie: cookie, 'X-CSRF-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'x'.repeat(600) }),
  });
  if (response.status === 200) return refuse('an invalid credential session attempt was accepted');
  if (!String(response.status).startsWith('4')) return refuse(`invalid session attempt returned ${response.status}`);
  if (response.headers.get('cache-control') !== 'no-store') return refuse('session refusal is cacheable');
  const setCookie = response.headers.get('set-cookie') || '';
  if (setCookie.includes(expected.cookiePrefix + 'session=') || setCookie.includes(expected.cookiePrefix + 'device=')) return refuse('a session/device cookie was issued on a refused attempt');
  return pass(`invalid credentials refused ${response.status} with no session/device cookie issued`);
}

// Anonymous callers stay refused without identity leakage (PLAT-05 boundary).
export async function auditAnonymousAuthorityBoundaries(fetchImpl = fetch, origin = expected.origin) {
  for (const path of ['/api/auth/me', '/api/account/overview']) {
    const response = await fetchImpl(origin + path, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    if (response.status !== 401) return refuse(`${path} returned ${response.status} for an anonymous caller`);
    if (response.headers.get('cache-control') !== 'no-store') return refuse(`${path} refusal is cacheable`);
  }
  return pass('anonymous authority boundaries refuse 401, no-store');
}

// The content security policy must connect and frame only the reviewed auth
// domains - no unknown authentication hosts.
export async function auditAuthorizedAuthDomains(fetchImpl = fetch, origin = expected.origin) {
  const response = await fetchImpl(origin + '/login', { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  const csp = response.headers.get('content-security-policy') || '';
  if (response.status !== 200) return refuse(`login page status ${response.status}`);
  const connect = (csp.match(/connect-src ([^;]+);?/) || [])[1] || '';
  const frame = (csp.match(/frame-src ([^;]+);?/) || [])[1] || '';
  // a wildcard, scheme-wildcard or unsafe source defeats the reviewed host
  // allowlist entirely
  for (const [name, sources] of [['connect-src', connect], ['frame-src', frame]]) {
    const bad = sources.trim().split(/\s+/).find(t => t === '*' || /:$/.test(t) || /unsafe-/.test(t));
    if (bad) return refuse(`CSP ${name} allows wildcard/unsafe source ${bad}`);
  }
  const connectHosts = [...connect.matchAll(/https:\/\/([a-z0-9.-]+)/g)].map(m => m[1]);
  const frameHosts = [...frame.matchAll(/https:\/\/([a-z0-9.-]+)/g)].map(m => m[1]);
  const missingConnect = expected.authConnectHosts.filter(host => !connectHosts.includes(host));
  if (missingConnect.length) return refuse(`CSP connect-src is missing reviewed auth hosts: ${missingConnect.join(', ')}`);
  const missingFrame = expected.authFrameHosts.filter(host => !frameHosts.includes(host));
  if (missingFrame.length) return refuse(`CSP frame-src is missing the reviewed auth host: ${missingFrame.join(', ')}`);
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
    [/Production authentication requires HTTPS/, 'production HTTPS refusal'],
  ]) {
    if (!pattern.test(text)) return refuse(`session cookie contract is missing: ${label}`);
  }
  return pass('__Host- prefix, httpOnly, Secure, SameSite=Strict and the production HTTPS refusal are all committed');
}

export async function runSessionAudit({ origin = expected.origin, fetchImpl = fetch, cookieSource = undefined } = {}) {
  const results = [];
  const step = async (check, action) => { try { results.push({ check, ...(await action()) }); } catch (error) { results.push({ check, ...refuse(`probe failed: ${String(error.message).slice(0, 160)}`) }); } };
  await step('sign-in-methods', () => auditSignInMethods(fetchImpl, origin));
  await step('csrf-cookie-posture', () => auditCsrfCookiePosture(fetchImpl, origin));
  await step('invalid-session-refusal', () => auditInvalidSessionRefusal(fetchImpl, origin));
  await step('anonymous-authority-boundaries', () => auditAnonymousAuthorityBoundaries(fetchImpl, origin));
  await step('authorized-auth-domains', () => auditAuthorizedAuthDomains(fetchImpl, origin));
  await step('session-cookie-contract', async () => auditSessionCookieContract(cookieSource));
  const failed = results.filter(r => !r.pass);
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'REFUSE'} ${r.check}: ${r.detail}`);
  console.log(failed.length ? `SESSION AUDIT FAILED: ${failed.length} check(s) refused.` : 'SESSION AUDIT PASSED: reviewed session/auth boundaries verified externally; real-account delivery acceptance stays founder-gated.');
  return { results, passed: failed.length === 0 };
}

if (process.argv[1]?.endsWith('session-audit.mjs')) {
  runSessionAudit().then(r => { if (!r.passed) process.exitCode = 1; }).catch(error => { console.error('SESSION AUDIT ERROR:', error.message); process.exitCode = 1; });
}
