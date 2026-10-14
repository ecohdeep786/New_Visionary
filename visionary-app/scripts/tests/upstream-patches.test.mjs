import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { expectedUpstreamHashes } from '../upstream-patches.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const evidence = 'integration/upstream-patches/test-evidence.patch';
const hash = createHash('sha256').update(fs.readFileSync(path.join(root, evidence))).digest('hex');
const check = (manifest, ledger) => expectedUpstreamHashes(manifest, ledger, root);
const baseline = { sources: [{ name: 'backend', files: [{ path: 'backend/package.json', sha256: 'a'.repeat(64) }] }] };
const patch = { id: 'sdk', reason: 'Authorized SDK setup', decision: 'D-060', diff: evidence, diffSha256: hash, files: [{ source: 'backend', path: 'backend/package.json', beforeSha256: 'a'.repeat(64), afterSha256: 'b'.repeat(64) }] };
const ledger = patches => ({ version: 1, patches });

test('unpatched imports retain their original expected hashes', () => {
  assert.equal(check(baseline, ledger([])).expected.get('backend/backend/package.json'), 'a'.repeat(64));
});
test('an explicit recorded patch advances only its named import', () => {
  assert.equal(check(baseline, ledger([patch])).expected.get('backend/backend/package.json'), 'b'.repeat(64));
  assert.equal(baseline.sources[0].files[0].sha256, 'a'.repeat(64));
});
test('tampered patch evidence cannot authorize a new file hash', () => {
  assert.throws(() => check(baseline, ledger([{ ...patch, diffSha256: 'c'.repeat(64) }])), /evidence changed/);
});
test('unknown files, duplicate entries and an unrelated before hash are rejected', () => {
  assert.throws(() => check(baseline, ledger([{ ...patch, files: [{ ...patch.files[0], path: '../outside.json' }] }])), /unknown patched import/);
  assert.throws(() => check(baseline, ledger([{ ...patch, files: [patch.files[0], patch.files[0]] }])), /Duplicate/);
  assert.throws(() => check(baseline, ledger([{ ...patch, files: [{ ...patch.files[0], beforeSha256: 'c'.repeat(64) }] }])), /hash chain/);
});
test('a subsequent patch must start at the last reviewed hash', () => {
  const second = { ...patch, id: 'next', files: [{ ...patch.files[0], beforeSha256: 'b'.repeat(64), afterSha256: 'c'.repeat(64) }] };
  assert.equal(check(baseline, ledger([patch, second])).expected.get('backend/backend/package.json'), 'c'.repeat(64));
  assert.throws(() => check(baseline, ledger([patch, { ...second, files: patch.files }])), /hash chain/);
});
