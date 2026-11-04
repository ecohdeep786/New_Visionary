// ACCEPT-06 (KAN-122) — build-purity tests: source-level gating verified on
// the real tree, then the REAL production build is executed and its dist is
// scanned — the fixture surface must be statically eliminated. A crafted
// impure dist is caught (fail-closed negative).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const require_ = createRequire(repoRoot + '/package.json');
const { checkBackendEmulatorGating, checkFrontendFixtureGating, checkBuiltDist } = require_(resolve(repoRoot, 'scripts/build-purity.mjs'));

test('ACCEPT-06 source gating: emulator fail-closed and fixture DEV-only, on the real tree', () => {
  const backend = checkBackendEmulatorGating(repoRoot);
  assert.deepEqual(backend.problems, [], 'backend emulator reads must be exactly the two fail-closed services');
  const frontend = checkFrontendFixtureGating(repoRoot);
  assert.deepEqual(frontend.problems, [], 'the demo/fixture surface must be DEV-only at the source level');
});

test('ACCEPT-06 production build: the dist must not carry the fixture surface', { timeout: 180000 }, () => {
  const build = spawnSync('npm', ['run', 'build'], { cwd: repoRoot, encoding: 'utf8', shell: true });
  assert.equal(build.status, 0, `production build must succeed: ${(build.stderr || '').slice(-300)}`);
  const verdict = checkBuiltDist(repoRoot, 'frontend/dist');
  assert.deepEqual(verdict.problems, [], `the production bundle must statically eliminate the fixture surface: ${verdict.problems.slice(0, 5)}`);
});

test('ACCEPT-06 negative: a crafted impure dist is caught', () => {
  const base = join(tmpdir(), `accept06-impure-${Date.now()}`);
  const fake = join(base, 'dist');
  mkdirSync(fake, { recursive: true });
  writeFileSync(join(fake, 'entry.js'), 'console.log("seedConnectedFixtures leaked")');
  const verdict = checkBuiltDist(base, 'dist');
  rmSync(base, { recursive: true, force: true });
  assert.equal(verdict.problems.length, 1, 'the marker scan must catch the leak');
  assert.match(verdict.problems[0], /seedConnectedFixtures/);
});
