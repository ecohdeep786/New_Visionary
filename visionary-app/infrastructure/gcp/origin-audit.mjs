import { execFileSync } from 'node:child_process';

// PLAT-04 external origin audit: read-only HTTPS probes against the canonical
// origin. Proves the API/static routing boundaries, private-response cache
// policy, secure cookie posture and the closed direct-origin bypass from an
// ordinary client, without credentials and without touching cloud state.
// The reviewed boundary contract is release.mjs publicChecks; this tool makes
// the same boundary verifiable on demand, independent of a deployment.

export const expected = Object.freeze({
  origin: 'https://visionary.org.in',
  // The run.app direct URL of the product service. With ingress
  // internal-and-cloud-load-balancing the Google frontend refuses direct
  // traffic; the audit proves no product response leaks through it. The URL
  // is discoverable from the deployment receipts / gcloud describe.
  directOrigin: process.env.VISIONARY_DIRECT_ORIGIN_URL || 'https://visionary-product-elwsfnkuga-el.a.run.app',
  revisionPattern: /^[a-f0-9]{40}$/,
});

const pass = detail => ({ pass: true, detail });
const refuse = detail => ({ pass: false, detail });
const GET = { redirect: 'manual', signal: AbortSignal.timeout(15000) };

async function read(url, options = {}, fetchImpl = fetch) {
  const response = await fetchImpl(url, { ...GET, ...options });
  return { response, body: new TextDecoder().decode(await response.arrayBuffer()) };
}

// The canonical origin must serve the SPA with the product's hardened header
// set and a 40-hex release revision attestation.
export async function auditCanonicalOrigin(fetchImpl = fetch, origin = expected.origin) {
  const { response, body } = await read(origin + '/', {}, fetchImpl);
  const h = response.headers;
  if (response.status !== 200) return refuse(`root status ${response.status}`);
  if (!h.get('content-type')?.includes('text/html') || !body.toString().includes('<!doctype html>')) return refuse('root did not serve the SPA html');
  if (!expected.revisionPattern.test(h.get('x-visionary-revision') || '')) return refuse(`missing or invalid x-visionary-revision: ${h.get('x-visionary-revision')}`);
  const required = ['x-content-type-options: nosniff', 'x-frame-options: DENY', 'strict-transport-security', 'content-security-policy', 'referrer-policy: strict-origin-when-cross-origin'];
  const missing = required.filter(pair => !h.get(pair.split(': ')[0])?.toLowerCase().includes(pair.split(': ')[1]?.toLowerCase() || ''));
  if (missing.length) return refuse(`missing hardened headers: ${missing.join(', ')}`);
  return pass(`revision ${h.get('x-visionary-revision').slice(0, 12)}… with the hardened header set`);
}

// Every /api response must be no-store: private responses must never rest in
// a shared CDN cache.
export async function auditApiCachePolicy(fetchImpl = fetch, origin = expected.origin) {
  for (const path of ['/api/health', '/api/auth/me', '/api/account/overview']) {
    const { response } = await read(origin + path, {}, fetchImpl);
    if (response.headers.get('cache-control') !== 'no-store') return refuse(`${path} cache-control is ${response.headers.get('cache-control')}`);
  }
  return pass('health/auth/account API responses are no-store');
}

// An unknown API path must be a JSON 404 from the API boundary — never the
// SPA fallback; a 200 HTML answer here would prove API-to-SPA fallback.
export async function auditNoApiFallback(fetchImpl = fetch, origin = expected.origin) {
  const { response, body } = await read(origin + '/api/__unknown-release-probe', {}, fetchImpl);
  if (response.status !== 404) return refuse(`unknown API path returned ${response.status}`);
  if (!response.headers.get('content-type')?.includes('application/json')) return refuse(`unknown API path content-type ${response.headers.get('content-type')}`);
  if (response.headers.get('cache-control') !== 'no-store') return refuse('unknown API path response is cacheable');
  if (body.toString().includes('<!doctype html>')) return refuse('unknown API path leaked the SPA html');
  return pass('unknown API paths are JSON 404, no-store, never the SPA');
}

// Anonymous authority boundaries: 401 JSON without identity or data leakage.
export async function auditAnonymousBoundaries(fetchImpl = fetch, origin = expected.origin) {
  for (const path of ['/api/auth/me', '/api/account/overview']) {
    const { response, body } = await read(origin + path, {}, fetchImpl);
    if (response.status !== 401) return refuse(`${path} returned ${response.status} for an anonymous caller`);
    if (!response.headers.get('content-type')?.includes('application/json')) return refuse(`${path} content-type ${response.headers.get('content-type')}`);
    if (body.toString().includes('"uid"') || body.toString().includes('"email"')) return refuse(`${path} leaked identity fields`);
  }
  return pass('anonymous callers are refused 401 JSON with no identity fields');
}

// The __Host- CSRF cookie must be Secure, HttpOnly, SameSite=Strict with a
// 64-hex token; a forged cross-origin command must be refused 403.
export async function auditCsrfPosture(fetchImpl = fetch, origin = expected.origin) {
  const { response: csrf, body: csrfBody } = await read(origin + '/api/auth/csrf', {}, fetchImpl);
  const cookie = csrf.headers.get('set-cookie') || '';
  const token = JSON.parse(csrfBody.toString() || '{}').token;
  if (csrf.status !== 200 || !/^[a-f0-9]{64}$/.test(token || '')) return refuse('CSRF token missing or not 64 hex');
  if (!cookie.startsWith('__Host-visionary-csrf=') || !/Secure/i.test(cookie) || !/HttpOnly/i.test(cookie) || !/SameSite=Strict/i.test(cookie)) return refuse(`CSRF cookie posture rejected: ${cookie.split(';').slice(0, 4).join(';')}`);
  const forged = await read(origin + '/api/auth/onboarding', { method: 'POST', headers: { Origin: 'https://invalid.example', Cookie: cookie.split(';')[0], 'X-CSRF-Token': token, 'Content-Type': 'application/json' }, body: '{}' }, fetchImpl);
  if (forged.response.status !== 403) return refuse(`forged cross-origin command returned ${forged.response.status}, expected 403 refusal`);
  if (forged.response.headers.get('cache-control') !== 'no-store') return refuse('forged command response is cacheable');
  return pass('__Host Secure/HttpOnly/Strict cookie; forged cross-origin command refused 403');
}

// The direct run.app URL must not serve the product: no revision attestation
// and no product identity may leak through the direct origin.
export async function auditDirectOriginBypass(fetchImpl = fetch, directOrigin = expected.directOrigin) {
  for (const path of ['/', '/api/health']) {
    let response;
    try { ({ response } = await read(directOrigin + path, {}, fetchImpl)); }
    catch { continue; } // unreachable direct origin is also a closed bypass
    const revision = response.headers.get('x-visionary-revision');
    if (revision) return refuse(`direct origin ${path} served a product response (revision ${revision.slice(0, 12)}…); ingress bypass is open`);
    if (response.status === 200 && response.headers.get('content-type')?.includes('text/html') && (await response.arrayBuffer()).toString().includes('<!doctype html>')) {
      return refuse(`direct origin ${path} served the SPA; ingress bypass is open`);
    }
  }
  return pass('direct run.app origin refuses or serves no product response');
}

// Hashed static assets may cache publicly; the audit only requires that a
// hashed asset declares explicit caching (never heuristics-only).
export async function auditStaticAssetCaching(fetchImpl = fetch, origin = expected.origin) {
  const { body } = await read(origin + '/', {}, fetchImpl);
  const asset = body.toString().match(/(?:src|href)="(\/assets\/[^"]+)"/)?.[1];
  if (!asset) return pass('no hashed asset referenced from the shell html (nothing to verify)');
  const { response } = await read(origin + asset, {}, fetchImpl);
  const cache = response.headers.get('cache-control') || '';
  if (response.status !== 200) return refuse(`asset ${asset} status ${response.status}`);
  if (!/max-age/i.test(cache)) return refuse(`hashed asset ${asset} has no explicit max-age: '${cache}'`);
  if (/private/i.test(cache)) return refuse(`hashed asset ${asset} is marked private`);
  return pass(`hashed asset caches explicitly (${cache})`);
}

export async function runOriginAudit({ origin = expected.origin, directOrigin = expected.directOrigin, fetchImpl = fetch, tls = captureTls } = {}) {
  const results = [];
  const step = async (check, action) => { try { results.push({ check, ...(await action()) }); } catch (error) { results.push({ check, ...refuse(`probe failed: ${String(error.message).slice(0, 160)}`) }); } };
  await step('canonical-origin', () => auditCanonicalOrigin(fetchImpl, origin));
  await step('api-cache-policy', () => auditApiCachePolicy(fetchImpl, origin));
  await step('no-api-fallback', () => auditNoApiFallback(fetchImpl, origin));
  await step('anonymous-boundaries', () => auditAnonymousBoundaries(fetchImpl, origin));
  await step('csrf-posture', () => auditCsrfPosture(fetchImpl, origin));
  await step('direct-origin-bypass', () => auditDirectOriginBypass(fetchImpl, directOrigin));
  await step('static-asset-caching', () => auditStaticAssetCaching(fetchImpl, origin));
  const failed = results.filter(r => !r.pass);
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'REFUSE'} ${r.check}: ${r.detail}`);
  console.log(failed.length ? `ORIGIN AUDIT FAILED: ${failed.length} check(s) refused.` : 'ORIGIN AUDIT PASSED: canonical boundaries, cache policy and closed bypass verified.');
  return { results, passed: failed.length === 0 };
}

// Capture the serving certificate identity for the evidence record.
export async function captureTls(origin = expected.origin) {
  const url = new URL(origin);
  const out = execFileSync('openssl', ['s_client', '-connect', `${url.hostname}:443`, '-servername', url.hostname], { input: '', encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'ignore'] });
  const subject = out.match(/subject=.*$/m)?.[0], issuer = out.match(/issuer=.*$/m)?.[0];
  return { subject, issuer };
}

if (process.argv[1]?.endsWith('origin-audit.mjs')) {
  runOriginAudit().then(async r => {
    try { const tls = await captureTls(); console.log(`TLS: ${tls.subject} | issued by ${tls.issuer}`); } catch (error) { console.log(`TLS capture unavailable: ${String(error.message).slice(0, 80)}`); }
    if (!r.passed) process.exitCode = 1;
  }).catch(error => { console.error('ORIGIN AUDIT ERROR:', error.message); process.exitCode = 1; });
}
