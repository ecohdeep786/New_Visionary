import test from 'node:test';
import assert from 'node:assert/strict';
import { publicChecks } from '../release.mjs';
const commit = 'a'.repeat(40), required = { email: true, google: true, phone: true };
function fetcher(methods, calls) {
  return async (url, options = {}) => {
    const route = new URL(url).pathname; calls.push(route);
    const headers = { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-visionary-revision': commit };
    let status = 200, body = { status: 'ok' };
    if (route === '/api/auth/methods') body = methods;
    else if (route === '/login') headers['content-type'] = 'text/html';
    else if (route === '/api/auth/csrf') { body = { token: 'b'.repeat(64) }; headers['set-cookie'] = '__Host-visionary-csrf=fixture; Secure; HttpOnly; SameSite=Strict'; }
    else if (route === '/api/auth/onboarding') status = options.headers.Origin === 'https://visionary.org.in' ? 401 : 403;
    else if (route.includes('unknown')) status = 404;
    else if (route !== '/api/health') status = 401;
    return new Response(JSON.stringify(body), { status, headers });
  };
}
test('new release requires actual phone availability and safely tolerates older rollback contract', async () => {
  const calls = [];
  await publicChecks(commit, fetcher(required, calls), undefined, required);
  assert.ok(calls.includes('/api/auth/methods'));
  await assert.rejects(publicChecks(commit, fetcher({ ...required, phone: false }, []), undefined, required), /availability/);
  const fallback = [];
  await publicChecks(commit, fetcher(null, fallback));
  assert.equal(fallback.includes('/api/auth/methods'), false);
});
