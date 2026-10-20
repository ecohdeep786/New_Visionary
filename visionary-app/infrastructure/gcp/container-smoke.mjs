import { execFileSync } from 'node:child_process';
import { production, publicChecks } from './release.mjs';

const commit = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(commit || '')) throw Error('A full source commit is required.');
const docker = (args, capture = false) => execFileSync('docker', args, { encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', timeout: 60000 });
const name = `visionary-check-${commit.slice(0, 12)}`;
const env = { NODE_ENV: 'production', AUTH_PUBLIC_ORIGIN: production.origin, AUTH_TRUST_PROXY_HOPS: '2', FIREBASE_PROJECT_ID: production.project, FIREBASE_PROJECT_KIND: 'production', FIRESTORE_DATABASE_ID: 'default', FIREBASE_AUTH_DOMAIN: production.authDomain, BILLING_MODE: 'test', AUTH_RATE_LIMIT_KEY: 'synthetic-container-test-key-at-least-32-bytes' };
let started = false;
try {
  docker(['run', '--detach', '--name', name, '--read-only', '--network=none', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--cpus=1', '--memory=512m', '--pids-limit=100', '--tmpfs=/tmp:rw,noexec,nosuid,size=16m', ...Object.entries(env).flatMap(([key, value]) => ['--env', key + '=' + value]), production.image + ':' + commit]);
  started = true;
  const script = `const production=${JSON.stringify(production)}; const probe=${(await import('./release.mjs')).probe.toString()}; const publicChecks=${publicChecks.toString()}; const fetcher=(url,options)=>fetch(url.replace(production.origin,'http://127.0.0.1:8080'),options); (async()=>{if(process.getuid()===0)throw Error('Root runtime'); let ready=false;for(let n=0;n<25;n++){try{await fetcher(production.origin+'/api/health');ready=true;break;}catch{await new Promise(r=>setTimeout(r,500));}}if(!ready)throw Error('Startup failed');await publicChecks('${commit}',fetcher);console.log('PASS: non-root startup, static/API boundaries, source, secure cookie and canonical/forged CSRF origin checks');})().catch(e=>{console.error(e.message);process.exitCode=1;});`;
  docker(['exec', name, 'node', '-e', script]);
} finally {
  if (started) docker(['rm', '--force', name]);
}
