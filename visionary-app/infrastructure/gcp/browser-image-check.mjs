// Anonymous, loopback-only container boundary check. No provider credentials,
// sign-in, customer records or hosted acceptance. Browser tooling is supplied
// explicitly by the operator; it never becomes a product-image dependency.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync, spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { createRequire } from 'node:module';
import { createServer as httpsServer } from 'node:https';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { production } from './release.mjs';

const commit = process.env.GITHUB_SHA;
assert.match(commit || '', /^[a-f0-9]{40}$/);
for (const key of ['KAN46_BROWSER_PACKAGE', 'KAN46_CHROME', 'KAN46_EVIDENCE']) assert.ok(process.env[key], key + ' is required');
const { chromium } = createRequire(resolve(process.env.KAN46_BROWSER_PACKAGE))('playwright-core');
const output = resolve(process.env.KAN46_EVIDENCE, commit); mkdirSync(output, { recursive: true });
const docker = args => execFileSync('docker', args, { encoding: 'utf8', timeout: 60000 }).trim();
const name = 'kan46-browser-' + commit.slice(0, 12), image = production.image + ':' + commit;
const info = JSON.parse(docker(['image', 'inspect', image]))[0];
assert.equal(info.Config.Labels['org.opencontainers.image.revision'], commit);
let browser, proxy, bridge, started = false;
try {
  // The container has no network interface beyond loopback. A bounded stdio
  // bridge transports the browser's real HTTP requests through docker exec.
  docker(['run', '--detach', '--name', name, '--network=none',
    '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--memory=512m', '--cpus=1', '--pids-limit=100', '--tmpfs=/tmp:rw,noexec,nosuid,size=16m',
    ...Object.entries({ AUTH_PUBLIC_ORIGIN: production.origin, AUTH_TRUST_PROXY_HOPS: '1', FIREBASE_PROJECT_ID: production.project,
      FIREBASE_PROJECT_KIND: 'production', FIRESTORE_DATABASE_ID: 'default', FIREBASE_AUTH_DOMAIN: production.authDomain,
      BILLING_MODE: 'test', AUTH_RATE_LIMIT_KEY: 'synthetic-browser-container-key-at-least-32-bytes' }).flatMap(([k,v]) => ['--env', k + '=' + v]), image]); started = true;
  let ready = false;
  for (let n = 0; n < 30; n++) { try { docker(['exec', name, 'node', '-e', "fetch('http://127.0.0.1:8080/api/health').then(r=>{if(r.status!==200)process.exitCode=1}).catch(()=>process.exitCode=1)"]); ready = true; break; } catch {} await new Promise(r => setTimeout(r, 300)); }
  assert.ok(ready, 'Actual product image must boot');
  // Synthetic local TLS key stays outside Git/image, only for this browser origin.
  docker(['run', '--rm', '--network=none', '--mount', `type=bind,source=${output},target=/evidence`, '--entrypoint=openssl', image,
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=visionary.org.in', '-addext', 'subjectAltName=DNS:visionary.org.in', '-keyout', '/evidence/loopback.key', '-out', '/evidence/loopback.crt']);
  const pending = new Map(); let sequence = 0;
  bridge = spawn('docker', ['exec', '-i', name, 'node', '-e', `const rl=require('node:readline').createInterface({input:process.stdin});
    rl.on('line',async line=>{const q=JSON.parse(line);try{const r=await fetch('http://127.0.0.1:8080'+q.path,{method:q.method,headers:q.headers,body:['GET','HEAD'].includes(q.method)?undefined:Buffer.from(q.body,'base64'),signal:AbortSignal.timeout(10000),redirect:'manual'});const headers=Object.fromEntries(r.headers);headers['set-cookie']=r.headers.getSetCookie();delete headers['content-encoding'];delete headers['transfer-encoding'];delete headers['content-length'];console.log(JSON.stringify({id:q.id,status:r.status,headers,body:Buffer.from(await r.arrayBuffer()).toString('base64')}));}catch{console.log(JSON.stringify({id:q.id,status:502,headers:{},body:''}));}});rl.on('close',()=>process.exit());`], { stdio: ['pipe', 'pipe', 'pipe'] });
  createInterface({ input: bridge.stdout }).on('line', line => { const reply = JSON.parse(line); const waiter = pending.get(reply.id); if (waiter) { pending.delete(reply.id); waiter(reply); } });
  proxy = httpsServer({ key: readFileSync(resolve(output, 'loopback.key')), cert: readFileSync(resolve(output, 'loopback.crt')) }, async (req, res) => {
    const chunks = []; let bytes = 0;
    for await (const chunk of req) { bytes += chunk.length; if (bytes > 32768) { res.writeHead(413); res.end(); return; } chunks.push(chunk); }
    const id = ++sequence;
    const reply = await new Promise(ok => { const timer = setTimeout(() => { pending.delete(id); ok({ status: 504, headers: {}, body: '' }); }, 12000);
      pending.set(id, value => { clearTimeout(timer); ok(value); });
      bridge.stdin.write(JSON.stringify({ id, path: req.url, method: req.method, headers: { ...req.headers, 'accept-encoding': 'identity', 'x-forwarded-proto': 'https', 'x-forwarded-for': '127.0.0.1' }, body: Buffer.concat(chunks).toString('base64') }) + '\n'); });
    res.writeHead(reply.status, reply.headers); res.end(Buffer.from(reply.body, 'base64'));
  });
  await new Promise((ok, bad) => { proxy.once('error', bad); proxy.listen(0, '127.0.0.1', ok); });
  const tlsPort = proxy.address().port;
  browser = await chromium.launch({ executablePath: process.env.KAN46_CHROME, headless: true,
    args: ['--no-proxy-server', `--host-resolver-rules=MAP visionary.org.in:443 127.0.0.1:${tlsPort}`] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1365, height: 900 } });
  let blockedExternal = 0;
  await context.route('**/*', route => new URL(route.request().url()).origin === production.origin ? route.continue() : (blockedExternal++, route.abort()));
  const page = await context.newPage();
  const navigation = await page.goto(production.origin, { waitUntil: 'networkidle', timeout: 30000 });
  assert.equal(navigation.status(), 200); assert.equal(navigation.headers()['x-visionary-revision'], commit);
  assert.ok(await page.locator('#root').innerText(), 'Actual bundled application must render');
  const checks = await page.evaluate(async () => {
    const request = async (path, options) => { const r = await fetch(path, options); return { status: r.status, type: r.headers.get('content-type'), cache: r.headers.get('cache-control'), revision: r.headers.get('x-visionary-revision'), body: await r.text() }; };
    const health = await request('/api/health');
    const csrf = await request('/api/auth/csrf'); const token = JSON.parse(csrf.body).token;
    const denied = await request('/api/auth/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const anonymous = await request('/api/auth/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, body: '{}' });
    return { health, csrfStatus: csrf.status, denied: denied.status, anonymous: anonymous.status,
      unknown: await request('/api/kan46-missing'), privateFile: await request('/.env'), gitFile: await request('/.git/config'), scriptCount: [...document.scripts].filter(s => s.type === 'module' && s.src.startsWith(location.origin)).length,
      jsReadableCookie: document.cookie };
  });
  assert.equal(checks.health.status, 200); assert.equal(JSON.parse(checks.health.body).status, 'ok');
  assert.equal(checks.health.revision, commit); assert.equal(checks.health.cache, 'no-store'); assert.equal(checks.csrfStatus, 200);
  assert.equal(checks.denied, 403); assert.equal(checks.anonymous, 401);
  assert.equal(checks.unknown.status, 404); assert.match(checks.unknown.type, /application\/json/); assert.equal(checks.privateFile.status, 404); assert.equal(checks.gitFile.status, 404);
  assert.ok(checks.scriptCount > 0);
  const cookies = await context.cookies(production.origin), csrfCookie = cookies.find(c => c.name.includes('csrf'));
  assert.ok(csrfCookie); assert.equal(csrfCookie.secure, true); assert.equal(csrfCookie.httpOnly, true); assert.equal(csrfCookie.sameSite, 'Strict');
  assert.ok(!checks.jsReadableCookie.includes(csrfCookie.name));
  await page.screenshot({ path: resolve(output, 'browser.png'), fullPage: true });
  const receipt = { commit, imageId: info.Id, sourceManifestSha256: info.Config.Labels['org.visionary.source-manifest-sha256'], passed: true,
    scope: 'Actual static bundle, anonymous HTTPS API/secure cookie/CSRF/session boundary in an outbound-isolated local container; no provider or hosted qualification',
    browserVersion: browser.version(), blockedExternal, checks: { ...checks, jsReadableCookie: undefined }, secureHttpOnlyStrictCsrf: true };
  writeFileSync(resolve(output, 'browser.json'), JSON.stringify(receipt, null, 2)); console.log(JSON.stringify(receipt));
} finally {
  if (browser) await browser.close(); if (proxy) { proxy.closeAllConnections(); await new Promise(r => proxy.close(r)); }
  if (bridge) { bridge.stdin.end(); bridge.kill(); }
  if (started) spawnSync('docker', ['rm', '--force', name], { stdio: 'ignore', timeout: 15000 });
}
