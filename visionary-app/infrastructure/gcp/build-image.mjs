import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { production } from './release.mjs';

const commit = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(commit || '')) throw Error('A full source commit is required.');
const fields = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'APP_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID'];
const configPath = resolve(dirname(fileURLToPath(import.meta.url)), 'firebase-web-config.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
if (Object.keys(config).some(key => !fields.includes(key)) || fields.some(key => typeof config[key] !== 'string' || !/^[A-Za-z0-9_:.\-]+$/.test(config[key])) ||
    config.PROJECT_ID !== production.project || config.AUTH_DOMAIN !== production.authDomain || config.MESSAGING_SENDER_ID !== production.projectNumber) {
  throw Error('Expected only the six public Firebase Web SDK settings for this project in infrastructure/gcp/firebase-web-config.json.');
}
const args = ['build', '--pull', '--file', 'infrastructure/gcp/Dockerfile', '--tag', `${production.image}:${commit}`, '--build-arg', 'VISIONARY_RELEASE_COMMIT=' + commit];
for (const field of fields) args.push('--build-arg', `VITE_FIREBASE_${field}=${config[field]}`);
execFileSync('docker', [...args, '.'], { stdio: 'inherit', timeout: 900000 });
