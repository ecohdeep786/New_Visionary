import test from 'node:test';
import assert from 'node:assert/strict';
import { expected, auditSignInMethods, auditCsrfCookiePosture, auditInvalidSessionRefusal, auditAnonymousAuthorityBoundaries, auditAuthorizedAuthDomains, auditSessionCookieContract, runSessionAudit } from '../session-audit.mjs';

const revision = 'a'.repeat(40);
const csrfCookie = `${expected.cookiePrefix}csrf=${'f'.repeat(64)}; Path=/; Secure; HttpOnly; SameSite=Strict`;
const csp = `default-src 'self'; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://visionary-research.firebaseapp.com https://api.razorpay.com; frame-src https://visionary-research.firebaseapp.com https://checkout.razorpay.com`;

function respond(status, headers = {}, body = '') {
  const map = new Map(Object.entries(headers));
  return { status, headers: { get: name => map.get(name.toLowerCase()) ?? null }, json: async () => JSON.parse(body), arrayBuffer: async () => new TextEncoder().encode(body).buffer };
}
const json = (status, headers, value) => respond(status, { 'content-type': 'application/json', ...headers }, JSON.stringify(value));
const anonymousError = () => json(401, { 'cache-control': 'no-store' }, { statusCode: 401, error: 'Unauthorized', message: 'Sign in to continue.' });
const originBoundary = options => json(options.headers.Origin === expected.origin ? 401 : 403, { 'cache-control': 'no-store' }, {});
const urlFetch = routes => async (url, options = {}) => {
  const path = new URL(url).pathname;
  const handler = routes.find(([match]) => path === match)?.[1];
  if (!handler) throw new Error('unrouted ' + path);
  return typeof handler === 'function' ? handler(options) : handler;
};

test('sign-in methods must be the reviewed live set, cache-exempt and attested', async () => {
  const good = urlFetch([['/api/auth/methods', json(200, { 'cache-control': 'no-store', 'x-visionary-revision': revision }, { email: true, google: true, phone: true })]]);
  assert.equal((await auditSignInMethods(good)).pass, true);
  const disabledPhone = urlFetch([['/api/auth/methods', json(200, { 'cache-control': 'no-store', 'x-visionary-revision': revision }, { email: true, google: true, phone: false })]]);
  assert.match((await auditSignInMethods(disabledPhone)).detail, /phone=false/);
  const extraMethod = urlFetch([['/api/auth/methods', json(200, { 'cache-control': 'no-store', 'x-visionary-revision': revision }, { email: true, google: true, phone: true, apple: true })]]);
  assert.match((await auditSignInMethods(extraMethod)).detail, /unreviewed sign-in methods exposed: apple/);
  const inheritedName = urlFetch([['/api/auth/methods', json(200, { 'cache-control': 'no-store', 'x-visionary-revision': revision }, { ...expected.methods, constructor: true })]]);
  assert.match((await auditSignInMethods(inheritedName)).detail, /unreviewed sign-in methods exposed: constructor/);
});

test('CSRF cookie must carry the __Host- posture', async () => {
  const good = urlFetch([['/api/auth/csrf', json(200, { 'cache-control': 'no-store', 'set-cookie': csrfCookie }, { token: 'f'.repeat(64) })]]);
  assert.equal((await auditCsrfCookiePosture(good)).pass, true);
  const mismatch = urlFetch([['/api/auth/csrf', json(200, { 'cache-control': 'no-store', 'set-cookie': csrfCookie }, { token: 'a'.repeat(64) })]]);
  assert.match((await auditCsrfCookiePosture(mismatch)).detail, /does not match/);
  const weak = urlFetch([['/api/auth/csrf', json(200, { 'cache-control': 'no-store', 'set-cookie': 'visionary-csrf=x; Path=/' }, { token: 'f'.repeat(64) })]]);
  assert.match((await auditCsrfCookiePosture(weak)).detail, /not __Host-visionary-csrf/);
  const noStrict = urlFetch([['/api/auth/csrf', json(200, { 'cache-control': 'no-store', 'set-cookie': `${expected.cookiePrefix}csrf=x; Path=/; Secure; HttpOnly; SameSite=Lax` }, { token: 'f'.repeat(64) })]]);
  assert.match((await auditCsrfCookiePosture(noStrict)).detail, /missing/i);
  // __Host- without Path=/ is rejected by browsers (the cookie never exists),
  // which would silently break CSRF end to end — the audit must catch it
  const noPath = urlFetch([['/api/auth/csrf', json(200, { 'cache-control': 'no-store', 'set-cookie': `${expected.cookiePrefix}csrf=x; Secure; HttpOnly; SameSite=Strict` }, { token: 'f'.repeat(64) })]]);
  assert.match((await auditCsrfCookiePosture(noPath)).detail, /missing/i);
  // a Domain attribute violates the __Host- contract and must refuse
  const withDomain = urlFetch([['/api/auth/csrf', json(200, { 'cache-control': 'no-store', 'set-cookie': `${expected.cookiePrefix}csrf=x; Path=/; Domain=visionary.org.in; Secure; HttpOnly; SameSite=Strict` }, { token: 'f'.repeat(64) })]]);
  assert.match((await auditCsrfCookiePosture(withDomain)).detail, /Domain attribute/);
});

test('invalid credentials are refused with no session/device cookie issued', async () => {
  const good = urlFetch([
    ['/api/auth/csrf', json(200, { 'cache-control': 'no-store', 'set-cookie': csrfCookie }, { token: 'f'.repeat(64) })],
    ['/api/auth/session', json(401, { 'cache-control': 'no-store' }, { error: 'invalid token' })],
  ]);
  assert.equal((await auditInvalidSessionRefusal(good)).pass, true);
  const genericDenial = urlFetch([
    ['/api/auth/csrf', json(200, { 'cache-control': 'no-store', 'set-cookie': csrfCookie }, { token: 'f'.repeat(64) })],
    ['/api/auth/session', json(403, { 'cache-control': 'no-store' }, {})],
  ]);
  assert.match((await auditInvalidSessionRefusal(genericDenial)).detail, /expected 401/);
  const issuing = urlFetch([
    ['/api/auth/csrf', json(200, { 'cache-control': 'no-store', 'set-cookie': csrfCookie }, { token: 'f'.repeat(64) })],
    ['/api/auth/session', respond(401, { 'set-cookie': `${expected.cookiePrefix}session=abc; Path=/; Secure; HttpOnly; SameSite=Strict`, 'cache-control': 'no-store' }, '{}')],
  ]);
  assert.match((await auditInvalidSessionRefusal(issuing)).detail, /session\/device cookie was issued/);
  const accepted = urlFetch([
    ['/api/auth/csrf', json(200, { 'cache-control': 'no-store', 'set-cookie': csrfCookie }, { token: 'f'.repeat(64) })],
    ['/api/auth/session', json(200, { 'cache-control': 'no-store' }, {})],
  ]);
  assert.match((await auditInvalidSessionRefusal(accepted)).detail, /was accepted/);
});

test('anonymous authority boundaries refuse 401 no-store', async () => {
  const good = urlFetch([['/api/auth/me', anonymousError()], ['/api/account/overview', anonymousError()]]);
  assert.equal((await auditAnonymousAuthorityBoundaries(good)).pass, true);
  const identityLeak = urlFetch([['/api/auth/me', json(401, { 'cache-control': 'no-store' }, { statusCode: 401, error: 'Unauthorized', message: 'Sign in', id: 'synthetic-user' })]]);
  assert.match((await auditAnonymousAuthorityBoundaries(identityLeak)).detail, /anonymous error envelope/);
  const leaky = urlFetch([['/api/auth/me', respond(200, { 'cache-control': 'no-store' }, '{}')], ['/api/account/overview', anonymousError()]]);
  assert.match((await auditAnonymousAuthorityBoundaries(leaky)).detail, /\/api\/auth\/me returned 200/);
});

test('the CSP must pin exactly the reviewed auth domains', async () => {
  const good = urlFetch([['/login', respond(200, { 'content-security-policy': csp }, '<!doctype html>')]]);
  assert.equal((await auditAuthorizedAuthDomains(good)).pass, true);
  const missing = urlFetch([['/login', respond(200, { 'content-security-policy': csp.replace(' https://securetoken.googleapis.com', '') }, '<!doctype html>')]]);
  assert.match((await auditAuthorizedAuthDomains(missing)).detail, /missing reviewed auth hosts: securetoken\.googleapis\.com/);
  // a wildcard or scheme-wildcard source defeats the host allowlist entirely
  const extraHost = urlFetch([['/login', respond(200, { 'content-security-policy': csp + ' https://unreviewed.example' }, '<!doctype html>')]]);
  assert.match((await auditAuthorizedAuthDomains(extraHost)).detail, /unreviewed source/);
  const star = urlFetch([['/login', respond(200, { 'content-security-policy': csp.replace("connect-src 'self'", 'connect-src *') }, '<!doctype html>')]]);
  assert.match((await auditAuthorizedAuthDomains(star)).detail, /wildcard\/unsafe source \*/);
  const schemeWildcard = urlFetch([['/login', respond(200, { 'content-security-policy': csp.replace('frame-src ', 'frame-src https: ') }, '<!doctype html>')]]);
  assert.match((await auditAuthorizedAuthDomains(schemeWildcard)).detail, /wildcard\/unsafe source https:/);
  const unsafe = urlFetch([['/login', respond(200, { 'content-security-policy': csp.replace("frame-src ", "frame-src 'unsafe-eval' ") }, '<!doctype html>')]]);
  assert.match((await auditAuthorizedAuthDomains(unsafe)).detail, /wildcard\/unsafe source 'unsafe-eval'/);
});

test('the committed cookie contract keeps the reviewed flags and HTTPS refusal', () => {
  assert.equal(auditSessionCookieContract().pass, true);
  const broken = "const prefix = secure ? '__Host-visionary-' : 'visionary-'; const options = { httpOnly: false, secure: this.settings().secure, sameSite: 'strict' as const, path: '/' };";
  const refused = auditSessionCookieContract(broken);
  assert.equal(refused.pass, false);
  assert.match(refused.detail, /httpOnly cookie flag/);
});

test('full session audit passes on the reviewed behavior and fails closed otherwise', async () => {
  const good = urlFetch([
    ['/api/auth/methods', json(200, { 'cache-control': 'no-store', 'x-visionary-revision': revision }, { email: true, google: true, phone: true })],
    ['/api/auth/csrf', json(200, { 'cache-control': 'no-store', 'set-cookie': csrfCookie }, { token: 'f'.repeat(64) })],
    ['/api/auth/onboarding', originBoundary],
    ['/api/auth/me', anonymousError()],
    ['/api/account/overview', anonymousError()],
    ['/login', respond(200, { 'content-security-policy': csp }, '<!doctype html>')],
  ]);
  const ok = await runSessionAudit({ fetchImpl: good, cookieSource: "const prefix = secure ? '__Host-visionary-' : 'visionary-'; const o = { httpOnly: true, secure: this.settings().secure, sameSite: 'strict' as const, path: '/' }; throw new Error('Production authentication requires HTTPS.');" });
  assert.equal(ok.passed, true, JSON.stringify(ok.results));
  assert.equal(ok.results.length, 6);

  const open = urlFetch(good.routes === undefined ? [
    ['/api/auth/methods', json(200, { 'cache-control': 'no-store', 'x-visionary-revision': revision }, { email: true, google: true, phone: true })],
    ['/api/auth/csrf', json(200, { 'cache-control': 'no-store', 'set-cookie': csrfCookie }, { token: 'f'.repeat(64) })],
    ['/api/auth/onboarding', originBoundary],
    ['/api/auth/session', respond(200, { 'set-cookie': `${expected.cookiePrefix}session=s; Path=/; Secure; HttpOnly; SameSite=Strict`, 'cache-control': 'no-store' }, '{}')],
    ['/api/auth/me', anonymousError()],
    ['/api/account/overview', anonymousError()],
    ['/login', respond(200, { 'content-security-policy': csp }, '<!doctype html>')],
  ] : []);
  const bad = await runSessionAudit({ fetchImpl: open, cookieSource: 'const x = 1;', probeInvalidSession: true });
  assert.equal(bad.passed, false);
  assert.equal(bad.results.find(r => r.check === 'invalid-session-refusal').pass, false);
  assert.equal(bad.results.find(r => r.check === 'session-cookie-contract').pass, false);
});
