import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const imageInputs = Object.freeze([
  'frontend/package.json', 'frontend/package-lock.json', 'frontend/index.html', 'frontend/vite.config.js',
  'frontend/postcss.config.js', 'frontend/tailwind.config.js', 'frontend/jsconfig.json', 'frontend/tsconfig.domain.json',
  'frontend/src/', 'frontend/public/',
  'backend/upstream/backend/src/', 'backend/upstream/backend/prisma/schema.prisma',
  'backend/upstream/backend/tsconfig.json', 'backend/upstream/backend/tsconfig.product.json', 'backend/upstream/backend/nest-cli.json',
  'infrastructure/gcp/Dockerfile', 'infrastructure/gcp/Dockerfile.dockerignore',
  'infrastructure/gcp/runtime/package.json', 'infrastructure/gcp/runtime/package-lock.json',
  'infrastructure/gcp/firebase-web-config.json',
]);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const allowed = path => imageInputs.some(input => input.endsWith('/') ? path.startsWith(input) : path === input);
const git = (cwd, args, options = {}) => execFileSync('git', args, { cwd, encoding: 'utf8', timeout: 60000, maxBuffer: 16 * 1024 * 1024, ...options });

function credentialMaterial(path, bytes) {
  if (/(?:^|\/)\.env(?:\.|$)|\.(?:pem|key)$|(?:firebase-adminsdk|service[-_]account).*\.json$/i.test(path) ||
      /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/.test(bytes.toString('utf8'))) return true;
  if (!path.endsWith('.json')) return false;
  let data; try { data = JSON.parse(bytes.toString('utf8')); } catch { return false; }
  const visit = value => value && typeof value === 'object' &&
    (['service_account', 'authorized_user', 'external_account', 'impersonated_service_account'].includes(value.type) ||
      Object.values(value).some(visit));
  return visit(data);
}

function cleanup(directory) {
  const actual = realpathSync(directory);
  if (dirname(actual) !== realpathSync(tmpdir()) || !basename(actual).startsWith('visionary-image-source-')) throw Error('Image source cleanup boundary mismatch.');
  rmSync(actual, { recursive: true });
}

/** Export only tracked, reviewed HEAD inputs. Mutable worktree/ignored files do
 * not enter Docker. No symlinks/submodules, unsafe paths or credential material.
 * Raw Git blobs bypass checkout/export line-ending and attribute transforms. */
export function createImageSource({ root = appRoot, commit } = {}) {
  if (!/^[a-f0-9]{40}$/.test(commit || '')) throw Error('An exact source commit is required.');
  const prefix = git(root, ['rev-parse', '--show-prefix']).trim();
  if (prefix !== 'visionary-app/' || git(root, ['rev-parse', 'HEAD']).trim() !== commit) throw Error('Image commit must equal this checkout HEAD.');
  const repository = git(root, ['rev-parse', '--show-toplevel']).trim();
  const tree = git(root, ['ls-tree', '-r', '-l', '-z', '--full-tree', commit, '--', ...imageInputs.map(p => prefix + p)], { encoding: null });
  const portablePaths = new Map();
  const entries = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(tree)
    .split('\0').filter(Boolean).map(line => {
      const tab = line.indexOf('\t'), [mode, type, object, size] = line.slice(0, tab).trim().split(/\s+/), fullPath = line.slice(tab + 1);
      const path = fullPath.slice(prefix.length);
      if (tab < 0 || !fullPath.startsWith(prefix) || !allowed(path) || posix.normalize(fullPath) !== fullPath ||
          /[\\:<>"|?*\x00-\x1f\x7f]/.test(fullPath) || !['100644', '100755'].includes(mode) || type !== 'blob' || !/^[a-f0-9]{40}$/.test(object)) throw Error('Unsupported image source entry.');
      let original = '';
      for (const segment of path.split('/')) {
        if (/[. ]$/.test(segment) || /^(?:con|prn|aux|nul|(?:com|lpt)[1-9¹²³])(?:\.|$)/i.test(segment)) throw Error('Unsupported image source path.');
        original += '/' + segment;
        const folded = original.normalize('NFC').toUpperCase();
        const previous = portablePaths.get(folded);
        if (previous && previous !== original) throw Error('Colliding image source paths.');
        portablePaths.set(folded, original);
      }
      return { path, object, mode, size: Number(size) };
    });
  if (!entries.length || entries.length > 20000 || entries.some(e => !Number.isSafeInteger(e.size) || e.size < 0) ||
      entries.reduce((sum, e) => sum + e.size, 0) > 512 * 1024 * 1024) throw Error('Image input size/count exceeds the reviewed bound.');
  for (const input of imageInputs.filter(p => !p.endsWith('/'))) if (!entries.some(e => e.path === input)) throw Error('Missing image input: ' + input);
  const directory = mkdtempSync(join(tmpdir(), 'visionary-image-source-'));
  try {
    const context = join(directory, 'context'); mkdirSync(context);
    const total = entries.reduce((sum, e) => sum + e.size, 0);
    const batch = git(repository, ['cat-file', '--batch'], { input: entries.map(e => e.object).join('\n') + '\n',
      encoding: null, maxBuffer: total + entries.length * 100 + 1024 });
    let offset = 0;
    const files = entries.map(entry => {
      const end = batch.indexOf(10, offset);
      if (end < offset || batch.toString('ascii', offset, end) !== `${entry.object} blob ${entry.size}`) throw Error('Invalid Git image input response.');
      const bytes = batch.subarray(end + 1, end + 1 + entry.size);
      offset = end + 1 + entry.size;
      if (batch[offset++] !== 10) throw Error('Truncated Git image input response.');
      const object = createHash('sha1').update(Buffer.from('blob ' + bytes.length + '\0')).update(bytes).digest('hex');
      if (object !== entry.object) throw Error('Exported image input bytes differ from reviewed HEAD.');
      if (credentialMaterial(entry.path, bytes)) throw Error('Credential material is forbidden in image input: ' + entry.path);
      const destination = join(context, entry.path); mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, bytes, { flag: 'wx', mode: entry.mode === '100755' ? 0o755 : 0o644 });
      return { path: entry.path, mode: entry.mode, sha256: sha256(bytes) };
    }).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
    if (offset !== batch.length) throw Error('Unexpected trailing Git image input response.');
    const manifest = Object.freeze({ commit, files });
    return { context, manifest, digest: sha256(JSON.stringify(manifest)), cleanup: () => cleanup(directory) };
  } catch (error) { cleanup(directory); throw error; }
}
