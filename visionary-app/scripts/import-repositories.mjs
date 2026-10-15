import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const staging = process.argv[2];
if (!staging) throw new Error('Usage: node scripts/import-repositories.mjs <reviewed-staging-directory>');
const inspection = JSON.parse(fs.readFileSync(path.join(staging, 'inspection.json'), 'utf8'));
const sources = [
  { name: 'backend', url: 'https://github.com/visionaryorg/visionary-dev.git', commit: '81e861be4a87b8af02c9f986d6874e82be20b1b7' },
  { name: 'ml', url: 'https://github.com/visionaryorg/ragpipeline-master.git', commit: 'f7fffc39b7894e3b6e82e3a3015b8140b1f2a363' },
  { name: 'reverse-engineering', url: 'https://github.com/morluto/rea.git', commit: '43738bec579fc69bab084bffa964916d43d43ed1' },
];
const manifest = { version: 1, importedOn: '2026-10-13', strategy: 'reviewed-source-snapshots', sources: [] };
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function sanitize(bytes, findings) {
  if (!findings.length) return bytes;
  let text = bytes.toString('utf8');
  for (const finding of findings) {
    if (finding.reason === 'google-api-key') text = text.replace(/\bAIza[A-Za-z0-9_-]{35}\b/g, 'REPLACE_WITH_YOUR_GOOGLE_API_KEY');
    else if (finding.reason === 'embedded-database-password') {
      text = text.replace(/(postgres(?:ql)?:\/\/[^\s:@/]+:)([^\s@/]+)(@)/g, (match, prefix, password, suffix) => {
        // Variable expressions are configuration, not embedded passwords.
        return /\$|\[|\{|<|^postgres$|^password$|^changeme$|^test$|^secret$|^your|^ragpass$|^local|^dev/i.test(password)
          ? match : `${prefix}REPLACE_WITH_DATABASE_PASSWORD${suffix}`;
      });
    } else throw new Error(`Manual review required for ${finding.reason} in ${finding.path}`);
  }
  return Buffer.from(text);
}

// Preflight every destination before writing any imported files.
for (const source of sources) {
  const cwd = path.resolve(staging, source.name);
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd }).toString().trim();
  if (commit !== source.commit) throw new Error(`Unexpected revision for ${source.name}`);
  if (!inspection.some(item => item.name === source.name && item.commit === commit)) throw new Error(`Missing inspection for ${source.name}`);
  if (fs.existsSync(path.join(root, source.name, 'upstream'))) throw new Error(`Refusing to overwrite ${source.name}/upstream`);
}

for (const source of sources) {
  const cwd = path.resolve(staging, source.name);
  const destination = path.join(root, source.name, 'upstream');
  const reviewed = inspection.find(item => item.name === source.name);
  const record = { ...source, branch: 'main', path: `${source.name}/upstream`, files: [], exclusions: [], submodules: reviewed.submodules, findings: reviewed.findings };
  const entries = execFileSync('git', ['ls-tree', '-rz', '--long', 'HEAD'], { cwd }).toString().split('\0').filter(Boolean);
  for (const entry of entries) {
    const [metadata, filename] = entry.split('\t');
    const [mode, type, blob] = metadata.trim().split(/\s+/);
    if (type === 'commit') continue; // Optional external analysis providers remain explicit pinned references.
    if (mode === '120000') throw new Error(`Symlink needs review: ${source.name}/${filename}`);
    const findings = reviewed.findings.filter(item => item.path === filename);
    if (findings.some(item => item.reason === 'credential-file' || item.reason === 'private-key')) {
      record.exclusions.push({ path: filename, reason: 'credential-material' }); continue;
    }
    if (source.name === 'backend' && !filename.startsWith('backend/') && !filename.startsWith('deploy/') && !['README.md', '.nvmrc', '.node-version', '.gitignore', 'LICENSE', 'NOTICE'].includes(filename)) {
      record.exclusions.push({ path: filename, reason: 'outside-backend-scope' }); continue;
    }
    const target = path.resolve(destination, filename);
    if (!target.startsWith(`${destination}${path.sep}`)) throw new Error(`Unsafe import path: ${filename}`);
    const original = fs.readFileSync(path.join(cwd, filename));
    const bytes = sanitize(original, findings);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
    record.files.push({ path: filename, gitBlob: blob, sourceSha256: digest(original), sha256: digest(bytes), sanitized: !bytes.equals(original) });
  }
  manifest.sources.push(record);
  console.log(`${source.name}: imported ${record.files.length} files; sanitized ${record.files.filter(file => file.sanitized).length}; excluded ${record.exclusions.length}; optional submodules ${record.submodules.length}`);
}
fs.mkdirSync(path.join(root, 'integration'), { recursive: true });
fs.writeFileSync(path.join(root, 'integration', 'upstream-lock.json'), `${JSON.stringify(manifest, null, 2)}\n`);
