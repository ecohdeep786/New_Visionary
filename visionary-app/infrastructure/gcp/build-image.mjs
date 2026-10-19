import { execFileSync } from 'node:child_process';
import { production } from './release.mjs';

const commit = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(commit || '')) throw Error('A full source commit is required.');
const fields = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'APP_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID'];
const config = JSON.parse(process.env.FIREBASE_WEB_CONFIG || '{}');
if (Object.keys(config).some(key => !fields.includes(key)) || fields.some(key => typeof config[key] !== 'string' || !/^[A-Za-z0-9_:.\-]+$/.test(config[key])) || config.PROJECT_ID !== production.project || config.AUTH_DOMAIN !== 'visionary-fd6d2.firebaseapp.com') throw Error('Expected only the six public Firebase Web SDK settings for this project.');
const args = ['build', '--pull', '--file', 'infrastructure/gcp/Dockerfile', '--tag', `${production.image}:${commit}`, '--build-arg', 'VISIONARY_RELEASE_COMMIT=' + commit];
for (const field of fields) args.push('--build-arg', `VITE_FIREBASE_${field}=${config[field]}`);
execFileSync('docker', [...args, '.'], { stdio: 'inherit', timeout: 900000 });
