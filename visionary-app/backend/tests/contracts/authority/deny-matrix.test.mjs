// ACCEPT-03 (KAN-119) — deny-matrix structural suite: every registered
// endpoint exists in source with server-authority guards, and the 8-case
// deny matrix is complete per endpoint. The live anonymous-probe half is
// founder-hosted (probeLive + --probe) and stays pending in the artifact.
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const require_ = createRequire(repoRoot + '/package.json');
const { buildDenyMatrix, assertMatrixComplete } = require_(resolve(repoRoot, 'scripts/deny-matrix.mjs'));

const SURFACE = resolve(repoRoot, 'docs/architecture/tracking/product-surface.json');

test('ACCEPT-03 deny matrix: every registered endpoint is guarded in source and 8 deny cases are complete', () => {
  const matrix = buildDenyMatrix(SURFACE);
  assert.ok(matrix.endpointCount >= 26, 'the registered surface carries the audited endpoint set');
  const verdict = assertMatrixComplete(matrix);
  assert.deepEqual(verdict.problems, [], 'every endpoint must have its controller source WITH server-authority guards');
  assert.equal(matrix.rows.length, matrix.endpointCount * 8, '8 deny cases per endpoint, no duplicates');
  for (const row of matrix.rows) {
    assert.equal(row.live, 'pending-hosted', 'the live anonymous-probe half is founder-hosted, honestly pending');
  }
  // The artifact is written for the reviewer + the hosted run.
  const dir = mkdtempSync(join(tmpdir(), 'accept03-'));
  const out = join(dir, 'accept03-deny-matrix.json');
  writeFileSync(out, JSON.stringify(matrix, null, 1));
  const parsed = JSON.parse(require_('node:fs').readFileSync(out, 'utf8'));
  assert.equal(parsed.contract, 'accept03-deny-matrix.v1');
});

test('ACCEPT-03 deny matrix: missing guard or missing file is caught, fail-closed', () => {
  const matrix = buildDenyMatrix(SURFACE);
  matrix.structural.push({ endpoint: 'GET /api/fake', controller: 'GhostController', fileExists: false, guarded: false });
  matrix.rows.push({ endpoint: 'GET /api/fake', denyCase: 'wrong-user', controller: 'GhostController', sourceFile: 'ghost.ts', live: 'pending-hosted' });
  const verdict = assertMatrixComplete(matrix);
  assert.equal(verdict.complete, false);
  assert.ok(verdict.problems.some((p) => p.includes('missing controller source')));
  assert.ok(verdict.problems.some((p) => p.includes('no server-authority guard')));
});
