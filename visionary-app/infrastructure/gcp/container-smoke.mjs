import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { production, publicChecks } from './release.mjs';

const commit = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(commit || '')) throw Error('A full source commit is required.');
const docker = (args, capture = false) => execFileSync('docker', args, { encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', timeout: 60000 });
const name = `visionary-check-${commit.slice(0, 12)}`, image = production.image + ':' + commit;
const info = JSON.parse(docker(['image', 'inspect', image], true))[0];
assert.equal(info.Config.Labels['org.opencontainers.image.revision'], commit);
assert.match(info.Config.Labels['org.visionary.source-manifest-sha256'], /^[a-f0-9]{64}$/);
const env = { NODE_ENV: 'production', AUTH_PUBLIC_ORIGIN: production.origin, AUTH_TRUST_PROXY_HOPS: '2', FIREBASE_PROJECT_ID: production.project,
  FIREBASE_PROJECT_KIND: 'production', FIRESTORE_DATABASE_ID: 'default', FIREBASE_AUTH_DOMAIN: production.authDomain,
  BILLING_MODE: 'test', AUTH_PHONE_SIGNIN_ENABLED: 'true', AUTH_RATE_LIMIT_KEY: 'synthetic-container-test-key-at-least-32-bytes' };
const limits = ['--read-only', '--network=none', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--cpus=1', '--memory=512m', '--pids-limit=100', '--tmpfs=/tmp:rw,noexec,nosuid,size=16m'];
const envArgs = value => Object.entries(value).flatMap(([key, value]) => ['--env', key + '=' + value]);
const receipt = { commit, imageId: info.Id, sourceManifestSha256: info.Config.Labels['org.visionary.source-manifest-sha256'], passed: false, invalidStartupCases: [] };
let started = false;
try {
  const start = Date.now();
  docker(['run', '--detach', '--name', name, ...limits, ...envArgs(env), image]); started = true;
  const script = `const production=${JSON.stringify(production)}; const probe=${(await import('./release.mjs')).probe.toString()}; const publicChecks=${publicChecks.toString()};
    const fetcher=(url,options)=>fetch(url.replace(production.origin,'http://127.0.0.1:8080'),options);
    (async()=>{if(process.getuid()===0)throw Error('Root runtime');let ready=false;for(let n=0;n<25;n++){try{const r=await fetcher(production.origin+'/api/health');if(r.status===200){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}
    if(!ready)throw Error('Startup failed');await publicChecks('${commit}',fetcher,undefined,{email:true,google:true,phone:true});
    for(const path of ['/api/fixtures','/api/__e2e/bootstrap','/api/legacy/login']){const r=await fetcher(production.origin+path);if(r.status!==404||!(r.headers.get('content-type')||'').includes('application/json'))throw Error('Fixture/legacy API boundary: '+path);}
    const fs=require('node:fs'),a=require('node:assert/strict');a.deepEqual(fs.readdirSync('/app').sort(),['backend','public']);a.deepEqual(fs.readdirSync('/app/backend').sort(),['dist','node_modules']);
    for(const path of ['/app/backend/dist','/app/backend/node_modules','/app/public']){a.equal(fs.statSync(path).uid,0);a.throws(()=>fs.accessSync(path,fs.constants.W_OK));}
    const {boundProductionHttp,productionRuntimeSettings}=require('./dist/src/platform/production-runtime.js');const server=require('node:http').createServer();boundProductionHttp(server);
    a.equal(server.headersTimeout,15000);a.equal(server.requestTimeout,30000);a.equal(server.keepAliveTimeout,5000);a.equal(server.maxRequestsPerSocket,100);server.close();
    a.equal(productionRuntimeSettings({get:k=>({...process.env,PORT:'8080'})[k]}).port,8080);
    console.log('PASS: real non-root product/static/API/CSRF/realm/time-budget boundaries');
    })().catch(e=>{console.error(e.message);process.exitCode=1;});`;
  docker(['exec', name, 'node', '-e', script]); receipt.startupAndChecksMs = Date.now() - start;

  // Hold a genuine partial HTTP request across SIGTERM, not only idle health.
  docker(['exec', '--detach', name, 'node', '-e', `const fs=require('node:fs');const marker='/tmp/kan46-open-socket';const s=require('node:net').connect(8080,'127.0.0.1',()=>{s.write(['GET /api/health HTTP/1.1','Host: localhost',''].join(String.fromCharCode(13,10)));fs.writeFileSync(marker,'ready');});s.on('error',()=>process.exit(1));s.on('close',()=>{fs.rmSync(marker,{force:true});process.exit(0);});`]);
  let held = false;
  for (let n = 0; n < 10; n++) {
    const r = spawnSync('docker', ['exec', name, 'node', '-e', "if(!require('node:fs').existsSync('/tmp/kan46-open-socket'))process.exitCode=1"], { encoding: 'utf8', timeout: 5000 });
    if (r.status === 0) { held = true; break; } await new Promise(ok => setTimeout(ok, 100));
  }
  assert.ok(held, 'The pending HTTP connection must actually exist before shutdown.');
  const stopping = Date.now(); docker(['stop', '--time=10', name], true);
  const state = JSON.parse(docker(['inspect', '--format', '{{json .State}}', name], true));
  assert.equal(state.Status, 'exited'); assert.equal(state.ExitCode, 0); assert.equal(state.OOMKilled, false);
  receipt.shutdownMs = Date.now() - stopping; assert.ok(receipt.shutdownMs < 12000, 'Shutdown must respect the 10-second container grace.');

  for (const [label, change] of [
    ['missing-budget', { AUTH_RATE_LIMIT_KEY: '' }], ['foreign-project', { FIREBASE_PROJECT_ID: 'foreign-project' }],
    ['wrong-database', { FIRESTORE_DATABASE_ID: '(default)' }], ['wrong-kind', { FIREBASE_PROJECT_KIND: 'staging' }],
    ['firestore-emulator', { FIRESTORE_EMULATOR_HOST: '127.0.0.1:8089' }], ['auth-emulator', { FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099' }],
    ['invalid-port', { PORT: '65536' }], ['wrong-origin', { AUTH_PUBLIC_ORIGIN: 'https://foreign.example.invalid' }],
    ['test-overview', { DATA_OVERVIEW_TEST_ENABLED: 'true' }],
  ]) {
    const bad = name + '-' + label;
    try {
      const r = spawnSync('docker', ['run', '--name', bad, ...limits, ...envArgs({ ...env, ...change }), image], { encoding: 'utf8', timeout: 15000 });
      assert.equal(r.error, undefined, 'Invalid-startup fixture hung: ' + label);
      assert.notEqual(r.status, 0, 'Invalid startup was admitted: ' + label);
      assert.match(r.stdout + r.stderr, /Product server could not start\. Verify reviewed production configuration\./);
      receipt.invalidStartupCases.push(label);
    } finally { spawnSync('docker', ['rm', '--force', bad], { stdio: 'ignore', timeout: 15000 }); }
  }
  receipt.passed = true;
  const output = resolve(dirname(fileURLToPath(import.meta.url)), '../../artifacts/qa/product-image', commit); mkdirSync(output, { recursive: true });
  writeFileSync(resolve(output, 'smoke.json'), JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt));
} finally { if (started) docker(['rm', '--force', name]); }
