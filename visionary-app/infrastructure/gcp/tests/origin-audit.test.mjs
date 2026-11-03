import test from 'node:test';
import assert from 'node:assert/strict';
import { expected, auditCanonicalOrigin, auditApiCachePolicy, auditNoApiFallback, auditAnonymousBoundaries, auditCsrfPosture, auditDirectOriginBypass, auditStaticAssetCaching, runOriginAudit } from '../origin-audit.mjs';

const revision = 'a'.repeat(40);
const hardened = { 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'strict-transport-security': 'max-age=31536000', 'content-security-policy': "default-src 'self'", 'referrer-policy': 'strict-origin-when-cross-origin' };

function respond(status, headers = {}, body = '') {
  const map = new Map(Object.entries(headers));
  return { status, headers: { get: name => map.get(name.toLowerCase()) ?? null }, arrayBuffer: async () => new TextEncoder().encode(body).buffer };
}
const json = (status, headers, value) => respond(status, { 'content-type': 'application/json', ...headers }, JSON.stringify(value));

function makeFetch(routes) {
  // routes: [path, responseOrFn, hostHint?] — hostHint restricts by URL text.
  return async (url) => {
    const parsed = new URL(url);
    for (const [match, handler, hostHint] of routes) {
      if (hostHint && !url.includes(hostHint)) continue;
      if (match.startsWith('/') ? parsed.pathname === match : url === match) {
        return typeof handler === 'function' ? handler(url) : handler;
      }
    }
    throw new Error('unrouted fetch: ' + url);
  };
}

test('canonical origin requires the SPA, revision attestation and hardened headers', async () => {
  const good = makeFetch([['/', respond(200, { 'content-type': 'text/html; charset=UTF-8', 'x-visionary-revision': revision, ...hardened }, '<!doctype html><title>x</title>')]]);
  assert.equal((await auditCanonicalOrigin(good)).pass, true);
  assert.match((await auditCanonicalOrigin(makeFetch([['/', respond(200, { 'content-type': 'text/html', 'x-visionary-revision': 'short', ...hardened }, '<!doctype html>')]]))).detail, /x-visionary-revision/);
  assert.match((await auditCanonicalOrigin(makeFetch([['/', respond(200, { 'content-type': 'text/html', 'x-visionary-revision': revision }, '<!doctype html>')]]))).detail, /missing hardened headers/);
  assert.match((await auditCanonicalOrigin(makeFetch([['/', respond(200, { 'content-type': 'application/json', 'x-visionary-revision': revision, ...hardened }, '{}')]]))).detail, /did not serve the SPA/);
});

test('every API response must be no-store', async () => {
  const good = makeFetch([['/api/health', json(200, { 'cache-control': 'no-store' }, { status: 'ok' })], ['/api/auth/me', json(401, { 'cache-control': 'no-store' }, {})], ['/api/account/overview', json(401, { 'cache-control': 'no-store' }, {})]]);
  assert.equal((await auditApiCachePolicy(good)).pass, true);
  const cacheable = makeFetch([['/api/health', json(200, { 'cache-control': 'no-store' }, {})], ['/api/auth/me', json(401, {}, {})], ['/api/account/overview', json(401, { 'cache-control': 'no-store' }, {})]]);
  assert.match((await auditApiCachePolicy(cacheable)).detail, /\/api\/auth\/me cache-control is null/);
});

test('unknown API paths must be JSON 404 and never the SPA fallback', async () => {
  const good = makeFetch([['/api/__unknown-release-probe', json(404, { 'cache-control': 'no-store' }, { message: 'Cannot GET' })]]);
  assert.equal((await auditNoApiFallback(good)).pass, true);
  const fallback = makeFetch([['/api/__unknown-release-probe', respond(200, { 'content-type': 'text/html', 'cache-control': 'no-cache', 'x-visionary-revision': revision }, '<!doctype html>')]]);
  const refused = await auditNoApiFallback(fallback);
  assert.equal(refused.pass, false);
  assert.match(refused.detail, /returned 200|content-type|SPA/);
});

test('anonymous callers are refused without identity leakage', async () => {
  const good = makeFetch([['/api/auth/me', json(401, { 'cache-control': 'no-store' }, { error: 'unauthorized' })], ['/api/account/overview', json(401, { 'cache-control': 'no-store' }, { error: 'unauthorized' })]]);
  assert.equal((await auditAnonymousBoundaries(good)).pass, true);
  const leaking = makeFetch([['/api/auth/me', json(401, { 'cache-control': 'no-store' }, { uid: 'u1' })], ['/api/account/overview', json(401, { 'cache-control': 'no-store' }, {})]]);
  assert.match((await auditAnonymousBoundaries(leaking)).detail, /leaked identity fields/);
});

test('CSRF posture: __Host Secure HttpOnly Strict cookie and forged-origin 403', async () => {
  const cookie = '__Host-visionary-csrf=' + 'f'.repeat(64) + '; Path=/; Secure; HttpOnly; SameSite=Strict';
  const good = makeFetch([
    ['/api/auth/csrf', json(200, { 'set-cookie': cookie }, { token: 'f'.repeat(64) })],
    ['/api/auth/onboarding', json(403, { 'cache-control': 'no-store' }, {})],
  ]);
  assert.equal((await auditCsrfPosture(good)).pass, true);
  const weak = makeFetch([
    ['/api/auth/csrf', json(200, { 'set-cookie': 'visionary-csrf=x; Path=/; SameSite=Lax' }, { token: 'f'.repeat(64) })],
    ['/api/auth/onboarding', json(403, { 'cache-control': 'no-store' }, {})],
  ]);
  assert.match((await auditCsrfPosture(weak)).detail, /CSRF cookie posture rejected/);
  const accepting = makeFetch([
    ['/api/auth/csrf', json(200, { 'set-cookie': cookie }, { token: 'f'.repeat(64) })],
    ['/api/auth/onboarding', json(200, { 'cache-control': 'no-store' }, { ok: true })],
  ]);
  assert.match((await auditCsrfPosture(accepting)).detail, /forged cross-origin command returned 200/);
});

test('the direct run.app origin must never serve the product', async () => {
  const hostFetch = async (url) => {
    if (url.includes('run.app')) return respond(404, {}, '<html>404 Page not found</html>');
    throw new Error('unexpected ' + url);
  };
  assert.equal((await auditDirectOriginBypass(hostFetch)).pass, true);
  const open = async () => respond(200, { 'content-type': 'text/html', 'x-visionary-revision': revision }, '<!doctype html>');
  assert.match((await auditDirectOriginBypass(open)).detail, /bypass is open/);
  const productJson = async () => json(200, { 'x-visionary-revision': revision, 'cache-control': 'no-store' }, { status: 'ok' });
  assert.match((await auditDirectOriginBypass(productJson)).detail, /bypass is open/);
});

test('hashed assets cache explicitly and publicly', async () => {
  const shell = respond(200, { 'content-type': 'text/html', 'x-visionary-revision': revision, ...hardened }, '<!doctype html><script src="/assets/index-abc123.js"></script>');
  const good = makeFetch([['/', shell], ['/assets/index-abc123.js', respond(200, { 'cache-control': 'public, max-age=31536000, immutable' }, 'js')]]);
  assert.equal((await auditStaticAssetCaching(good)).pass, true);
  const heuristics = makeFetch([['/', shell], ['/assets/index-abc123.js', respond(200, {}, 'js')]]);
  assert.match((await auditStaticAssetCaching(heuristics)).detail, /no explicit max-age/);
  const priv = makeFetch([['/', shell], ['/assets/index-abc123.js', respond(200, { 'cache-control': 'private, max-age=60' }, 'js')]]);
  assert.match((await auditStaticAssetCaching(priv)).detail, /marked private/);
});

test('full origin audit fails closed and passes when every boundary holds', async () => {
  const cookie = '__Host-visionary-csrf=' + 'f'.repeat(64) + '; Path=/; Secure; HttpOnly; SameSite=Strict';
  const shell = respond(200, { 'content-type': 'text/html', 'x-visionary-revision': revision, ...hardened }, '<!doctype html><script src="/assets/index-abc123.js"></script>');
  const good = async (url) => {
    const path = new URL(url).pathname;
    if (url.includes('run.app')) return respond(404, {}, '<html>404</html>');
    if (path === '/') return shell;
    if (path === '/api/health') return json(200, { 'cache-control': 'no-store' }, { status: 'ok', authPolicy: { version: 1, globalSignOut: false } });
    if (path === '/api/auth/me' || path === '/api/account/overview') return json(401, { 'cache-control': 'no-store' }, { error: 'unauthorized' });
    if (path === '/api/__unknown-release-probe') return json(404, { 'cache-control': 'no-store' }, { message: 'x' });
    if (path === '/api/auth/csrf') return json(200, { 'set-cookie': cookie }, { token: 'f'.repeat(64) });
    if (path === '/api/auth/onboarding') return json(403, { 'cache-control': 'no-store' }, {});
    if (path === '/assets/index-abc123.js') return respond(200, { 'cache-control': 'public, max-age=31536000, immutable' }, 'js');
    throw new Error('unrouted ' + path);
  };
  const ok = await runOriginAudit({ fetchImpl: good, tls: async () => ({ subject: 'CN=visionary.org.in', issuer: 'Google Trust Services' }) });
  assert.equal(ok.passed, true, JSON.stringify(ok.results));
  assert.equal(ok.results.length, 7);

  const bypassOpen = async (url) => (url.includes('run.app') ? respond(200, { 'content-type': 'text/html', 'x-visionary-revision': revision }, '<!doctype html>') : good(url));
  const bad = await runOriginAudit({ fetchImpl: bypassOpen, tls: async () => ({}) });
  assert.equal(bad.passed, false);
  assert.equal(bad.results.find(r => r.check === 'direct-origin-bypass').pass, false);
});
