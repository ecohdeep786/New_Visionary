// Review-only weakening probes mutate emitted files in this checkout, restore
// exact bytes in finally, and never touch source or shared dependency caches.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../../..');
const tests = path.join(__dirname, 'KAN37_DEADLINE_INDEPENDENT_PROBES.cjs');
const cases = [
  {
    file: 'migration-store.js', pattern: 'current expired identity result',
    old: 'remainingTimeout(timeout, bounds) {\n        bounds?.assertActive();',
    replacement: 'remainingTimeout(timeout, bounds) {\n        /* reviewer mutation: omit current guard */',
  },
  {
    file: 'migration-store.js', pattern: 'current deadline is checked again',
    old: 'bounds.assertActive();\n                        return result;',
    replacement: '/* reviewer mutation: omit result guard */\n                        return result;',
  },
  {
    file: 'backfill-runner.js', pattern: 'post-admission deadline is explicitly uncertain',
    old: 'beforeCommit: () => { commitMayHaveStarted = true; }',
    replacement: 'beforeCommit: () => { /* reviewer mutation: forget commit admission */ }',
  },
];
for (const item of cases) {
  const filename = path.join(root, 'backend/upstream/backend/dist/src/data', item.file);
  const original = fs.readFileSync(filename);
  const text = original.toString('utf8');
  assert.ok(text.includes(item.old), 'Exact mutation target exists');
  try {
    fs.writeFileSync(filename, text.replace(item.old, item.replacement));
    const run = cp.spawnSync(process.execPath, ['--test', '--test-name-pattern=' + item.pattern, tests], {
      cwd: root, encoding: 'utf8', timeout: 20000, windowsHide: true,
    });
    assert.equal(run.status, 1, run.stdout + run.stderr);
    assert.match(run.stdout + run.stderr, /ERR_ASSERTION/);
    console.log(JSON.stringify({ probe: item.pattern, expectedFailure: true, exitCode: run.status }));
  } finally {
    fs.writeFileSync(filename, original);
    assert.deepEqual(fs.readFileSync(filename), original);
  }
}
console.log('All three emitted implementation weakening probes failed their targeted assertions; exact bytes restored.');
