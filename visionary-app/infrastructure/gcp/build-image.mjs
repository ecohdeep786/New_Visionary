import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { production } from './release.mjs';
import { createImageSource } from './image-source.mjs';

const commit = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(commit || '')) throw Error('A full source commit is required.');
const source = createImageSource({ commit });
try {
const fields = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'APP_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID'];
const configPath = resolve(source.context, 'infrastructure/gcp/firebase-web-config.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
if (Object.keys(config).some(key => !fields.includes(key)) || fields.some(key => typeof config[key] !== 'string' || !/^[A-Za-z0-9_:.\-]+$/.test(config[key])) ||
    config.PROJECT_ID !== production.project || config.AUTH_DOMAIN !== production.authDomain || config.MESSAGING_SENDER_ID !== production.projectNumber) {
  throw Error('Expected only the six public Firebase Web SDK settings for this project in infrastructure/gcp/firebase-web-config.json.');
}
const args = ['build', '--pull', '--file', 'infrastructure/gcp/Dockerfile', '--tag', `${production.image}:${commit}`, '--build-arg', 'VISIONARY_RELEASE_COMMIT=' + commit,
  '--build-arg', 'VISIONARY_SOURCE_MANIFEST_SHA256=' + source.digest];
for (const field of fields) args.push('--build-arg', `VITE_FIREBASE_${field}=${config[field]}`);
execFileSync('docker', [...args, '.'], { cwd: source.context, stdio: 'inherit', timeout: 900000 });
const imageId = execFileSync('docker', ['image', 'inspect', '--format', '{{.Id}}', `${production.image}:${commit}`], { encoding: 'utf8', timeout: 15000 }).trim();
const output = resolve(dirname(fileURLToPath(import.meta.url)), '../../artifacts/qa/product-image', commit);
mkdirSync(output, { recursive: true });
writeFileSync(resolve(output, 'source-manifest.json'), JSON.stringify(source.manifest, null, 2));
const receipt = { commit, sourceManifestSha256: source.digest, sourceFiles: source.manifest.files.length, imageId, image: `${production.image}:${commit}`, builtAt: new Date().toISOString() };
writeFileSync(resolve(output, 'build.json'), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt));
} finally { source.cleanup(); }
