import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { expectedUpstreamHashes } from './upstream-patches.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'integration/upstream-lock.json'), 'utf8'));
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'integration/upstream-patches.json'), 'utf8'));
const { expected, changed, patchCount } = expectedUpstreamHashes(manifest, ledger, root);
let count = 0;
for (const source of manifest.sources) {
  const base = path.resolve(root, source.path);
  if (fs.existsSync(path.join(base, '.git'))) throw new Error(`Embedded Git checkout: ${source.path}`);
  for (const file of source.files) {
    const target = path.resolve(base, file.path);
    if (!target.startsWith(`${base}${path.sep}`)) throw new Error('Import manifest path escapes its component.');
    const bytes = fs.readFileSync(target);
    if (createHash('sha256').update(bytes).digest('hex') !== expected.get(`${source.name}/${file.path}`)) throw new Error(`Imported source changed: ${source.path}/${file.path}. Record an intentional patch before accepting it.`);
    if (bytes.includes(Buffer.from('-----BEGIN PRIVATE KEY-----')) || bytes.includes(Buffer.from('-----BEGIN OPENSSH PRIVATE KEY-----'))) throw new Error(`Private key in imported source: ${file.path}`);
    count++;
  }
  for (const excluded of source.exclusions.filter(item => item.reason === 'credential-material')) {
    if (fs.existsSync(path.join(base, excluded.path))) throw new Error(`Excluded credentials present: ${excluded.path}`);
  }
}
console.log(`PASS: ${count} imported files match baseline plus ${patchCount} recorded patches (${changed.size} changed files); credential files excluded; no embedded Git repositories.`);
