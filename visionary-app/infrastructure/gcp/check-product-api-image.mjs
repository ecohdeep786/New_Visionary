import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Build the actual API stage from the deployed lock, including the generated
// SQL engine/client. No Firebase credential, database or cloud network is used.
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.match(commit, /^[a-f0-9]{40}$/);
const id = 'visionary-api-check-' + randomUUID(), image = id + ':local';
const publicRoot = mkdtempSync(join(tmpdir(), 'visionary-api-public-'));
const docker = args => execFileSync('docker', args, { encoding: 'utf8', timeout: 240000 });
try {
  writeFileSync(join(publicRoot, 'index.html'), '<!doctype html><title>Synthetic API container check</title>');
  chmodSync(publicRoot, 0o755); chmodSync(join(publicRoot, 'index.html'), 0o644);
  docker(['build', '--file', 'infrastructure/gcp/Dockerfile', '--target', 'api', '--tag', image, '.']);
  const env = { NODE_ENV: 'production', PORT: '8080', PUBLIC_ROOT: '/smoke-public', AUTH_PUBLIC_ORIGIN: 'https://visionary.org.in',
    AUTH_TRUST_PROXY_HOPS: '1', AUTH_RATE_LIMIT_KEY: 'synthetic-container-check-only-0000000000', FIREBASE_PROJECT_ID: 'visionary-research',
    FIRESTORE_DATABASE_ID: 'default', FIREBASE_AUTH_DOMAIN: 'visionary-research.firebaseapp.com', VISIONARY_RELEASE_COMMIT: commit };
  docker(['run', '--detach', '--name', id, '--network=none', '--user=node', '--mount', 'type=bind,source=' + publicRoot + ',target=/smoke-public,readonly',
    ...Object.entries(env).flatMap(([k,v]) => ['--env', k + '=' + v]), '--entrypoint=node', image, 'dist/src/main-product.js']);
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    const probe = spawnSync('docker', ['exec', id, 'node', '-e', "fetch('http://127.0.0.1:8080/api/health').then(async r=>{if(r.status!==200||(await r.json()).status!=='ok')process.exitCode=1}).catch(()=>process.exitCode=1)"], { encoding: 'utf8', timeout: 5000 });
    if (probe.status === 0) { ready = true; break; }
    await new Promise(ok => setTimeout(ok, 500));
  }
  assert.ok(ready, 'Actual non-root production API must boot without SQL or Firebase access when provisioning is disabled.');
  docker(['exec', id, 'node', '-e', "const a=require('node:assert/strict');const p=require('@prisma/client');a.equal(p.Prisma.prismaVersion.client,'5.22.0');fetch('http://127.0.0.1:8080/api/account/workspace/provision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({commandId:'synthetic-container'})}).then(r=>a.equal(r.status,403)).catch(e=>{console.error(e.message);process.exitCode=1})"]);
  console.log('PASS: actual production API image boots as node offline, loads the generated SQL client and denies untrusted provisioning at its registered route.');
} catch (error) {
  const logs = spawnSync('docker', ['logs', id], { encoding: 'utf8', timeout: 5000 });
  console.error((logs.stdout + logs.stderr).slice(-6000)); throw error;
} finally {
  spawnSync('docker', ['rm', '--force', id], { stdio: 'ignore', timeout: 15000 });
  rmSync(publicRoot, { recursive: true, force: true });
}
