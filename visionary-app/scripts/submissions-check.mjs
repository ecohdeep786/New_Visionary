import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
// ROLE-03 (KAN-95) — standard verification for immutable submission copies,
// duplicate-safe submit and the teacher grading lifecycle.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backend = join(root, 'backend/upstream/backend');
function run(args, cwd = root) {
  const result = spawnSync(process.execPath, args, { cwd, env: process.env, stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) throw Error('Submissions verification failed (' + (result.status ?? result.error?.code) + ').');
}
run([join(backend, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.submissions.json'], backend);
const tests = readdirSync(join(root, 'backend/tests/contracts/submissions')).filter((f) => f.endsWith('.test.mjs'));
if (!tests.length) throw Error('No submissions contract tests found.');
run(['--test', '--test-reporter=tap', ...tests.map((f) => join(root, 'backend/tests/contracts/submissions', f))]);
