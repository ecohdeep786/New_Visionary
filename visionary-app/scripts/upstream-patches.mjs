import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const validHash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

// The import lock remains the original reviewed snapshot. This separately
// reviewed ledger advances expected hashes only for explicitly named files.
export function expectedUpstreamHashes(manifest, ledger, root) {
  if (ledger.version !== 1 || !Array.isArray(ledger.patches)) throw new Error('Invalid upstream patch ledger.');
  const expected = new Map();
  for (const source of manifest.sources) for (const file of source.files) {
    expected.set(`${source.name}/${file.path}`, file.sha256);
  }
  const ids = new Set();
  const changed = new Set();
  for (const patch of ledger.patches) {
    if (!patch.id || ids.has(patch.id) || !patch.reason?.trim() || !patch.decision?.trim()) throw new Error('Missing or duplicate upstream patch identity/reason/decision.');
    ids.add(patch.id);
    if (!/^integration\/upstream-patches\/[a-z0-9-]+\.patch$/.test(patch.diff) || !validHash(patch.diffSha256)) throw new Error(`Invalid patch evidence: ${patch.id}`);
    const bytes = fs.readFileSync(path.join(root, patch.diff));
    if (digest(bytes) !== patch.diffSha256) throw new Error(`Patch evidence changed: ${patch.diff}`);
    if (!Array.isArray(patch.files) || !patch.files.length) throw new Error(`Empty patch: ${patch.id}`);
    const withinPatch = new Set();
    for (const file of patch.files) {
      const key = `${file.source}/${file.path}`;
      if (withinPatch.has(key) || !expected.has(key)) throw new Error(`Duplicate or unknown patched import: ${key}`);
      withinPatch.add(key);
      if (!validHash(file.beforeSha256) || !validHash(file.afterSha256) || expected.get(key) !== file.beforeSha256 || file.beforeSha256 === file.afterSha256) throw new Error(`Broken patch hash chain: ${key}`);
      expected.set(key, file.afterSha256);
      changed.add(key);
    }
  }
  return { expected, changed, patchCount: ledger.patches.length };
}
