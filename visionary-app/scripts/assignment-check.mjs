import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
// ROLE-02 (KAN-94) — standard verification for fixed assignment publication,
// scheduling/timezones, close/archive/restore and supported response types.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backend = join(root, 'backend/upstream/backend');
function run(args, cwd = root) {
  const result = spawnSync(process.execPath, args, { cwd, env: process.env, stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) throw Error('Assignment verification failed (' + (result.status ?? result.error?.code) + ').');
}
run([join(backend, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.assignment.json'], backend);
const tests = readdirSync(join(root, 'backend/tests/contracts/assignment')).filter((f) => f.endsWith('.test.mjs'));
if (!tests.length) throw Error('No assignment contract tests found.');
run(['--test', '--test-reporter=tap', ...tests.map((f) => join(root, 'backend/tests/contracts/assignment', f))]);
