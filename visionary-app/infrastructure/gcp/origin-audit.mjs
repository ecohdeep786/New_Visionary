import { connect } from 'node:tls';
import { pathToFileURL } from 'node:url';

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

// Each probe gets its own fresh 15 s budget: a module-level signal would start
// counting at import time and abort every later probe instantly.
async function read(url, options = {}, fetchImpl = fetch) {
  const response = await fetchImpl(url, { redirect: 'manual', signal: AbortSignal.timeout(15000), ...options });
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
// 64-hex token; a forged cross-origin command must be refused 403. The
// __Host- contract also requires Path=/ and no Domain attribute — browsers
// silently reject the cookie otherwise, which would break CSRF end to end.
export async function auditCsrfPosture(fetchImpl = fetch, origin = expected.origin) {
  const { response: csrf, body: csrfBody } = await read(origin + '/api/auth/csrf', {}, fetchImpl);
  const cookie = csrf.headers.get('set-cookie') || '';
  const token = JSON.parse(csrfBody.toString() || '{}').token;
  if (csrf.status !== 200 || !/^[a-f0-9]{64}$/.test(token || '')) return refuse('CSRF token missing or not 64 hex');
  const [credential, ...attributes] = cookie.split(';').map(value => value.trim());
  const flags = attributes.map(value => value.toLowerCase());
  const scope = flags.filter(flag => /^(?:path|samesite|domain)=/.test(flag));
  if (credential !== '__Host-visionary-csrf=' + token || !flags.includes('secure') || !flags.includes('httponly') ||
      scope.length !== 2 || !scope.includes('samesite=strict') || !scope.includes('path=/')) return refuse('CSRF cookie posture rejected');
  const forged = await read(origin + '/api/auth/onboarding', { method: 'POST', headers: { Origin: 'https://invalid.example', Cookie: credential, 'X-CSRF-Token': token, 'Content-Type': 'application/json' }, body: '{}' }, fetchImpl);
  if (forged.response.status !== 403) return refuse(`forged cross-origin command returned ${forged.response.status}, expected 403 refusal`);
  if (forged.response.headers.get('cache-control') !== 'no-store') return refuse('forged command response is cacheable');
  return pass('__Host Secure/HttpOnly/Strict cookie; forged cross-origin command refused 403');
}

// Require an explicit edge refusal for both the shell and the health route.
export async function auditDirectOriginBypass(fetchImpl = fetch, directOrigin = expected.directOrigin) {
  for (const path of ['/', '/api/health']) {
    const { response, body } = await read(directOrigin + path, {}, fetchImpl);
    if (response.headers.get('x-visionary-revision') || /<!doctype\s+html\b/i.test(body) ||
        ![403, 404].includes(response.status) || response.headers.get('content-type')?.includes('application/json')) {
      return refuse(`direct origin ${path} did not show the expected edge refusal (HTTP ${response.status}); ingress bypass is open or unverified`);
    }
  }
  return pass('direct run.app origin explicitly refused the shell and health requests');
}

export async function auditStaticAssetCaching(fetchImpl = fetch, origin = expected.origin) {
  const { body } = await read(origin + '/', {}, fetchImpl);
  const asset = body.match(/(?:src|href)="(\/assets\/[^"\s/]+-[\w-]{6,}\.(?:js|css))"/)?.[1];
  if (!asset) return refuse('no hashed JavaScript or CSS asset referenced from the shell');
  const { response } = await read(origin + asset, {}, fetchImpl);
  if (response.status !== 200) return refuse(`asset ${asset} status ${response.status}`);
  const cache = (response.headers.get('cache-control') || '').toLowerCase().split(',').map(value => value.trim());
  if (cache.includes('private')) return refuse(`hashed asset ${asset} is marked private`);
  const ages = cache.filter(directive => /^max-age\s*=/.test(directive));
  if (ages.length !== 1 || ages[0] !== 'max-age=31536000') return refuse(`hashed asset ${asset} has no explicit max-age=31536000`);
  if (!cache.includes('public') || !cache.includes('immutable') || cache.includes('no-cache') || cache.includes('no-store')) {
    return refuse(`hashed asset ${asset} lacks an unambiguous public, immutable cache policy`);
  }
  return pass('hashed asset is public and immutable for one year');
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
  await step('tls', async () => {
    const certificate = await tls(origin);
    if (!certificate?.subject || !certificate?.issuer) return refuse('TLS certificate identity unavailable');
    return pass(`certificate ${certificate.subject} issued by ${certificate.issuer}`);
  });
  const failed = results.filter(r => !r.pass);
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'REFUSE'} ${r.check}: ${r.detail}`);
  console.log(failed.length ? `ORIGIN AUDIT FAILED: ${failed.length} check(s) refused.` : 'ORIGIN AUDIT PASSED: canonical boundaries, cache policy and closed bypass verified.');
  return { results, passed: failed.length === 0 };
}

// Node verifies the chain and hostname before reporting the certificate.
export function captureTls(origin = expected.origin) {
  const url = new URL(origin);
  if (url.protocol !== 'https:') throw Error('TLS verification requires an HTTPS origin');
  return new Promise((resolve, reject) => {
    const socket = connect({ host: url.hostname, port: Number(url.port || 443), servername: url.hostname, rejectUnauthorized: true });
    socket.setTimeout(15000, () => socket.destroy(Error('TLS handshake timed out')));
    socket.once('error', reject);
    socket.once('secureConnect', () => {
      const certificate = socket.getPeerX509Certificate();
      socket.destroy();
      resolve({ subject: certificate?.subject?.replaceAll('\n', ', '), issuer: certificate?.issuer?.replaceAll('\n', ', ') });
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runOriginAudit().then(result => { if (!result.passed) process.exitCode = 1; })
    .catch(error => { console.error('ORIGIN AUDIT ERROR:', error.message); process.exitCode = 1; });
}
