import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
// CONTENT-08 (KAN-144) — standard verification for the versioned concept/
// prerequisite DAG and curriculum/exam views: focused compile + contract tests
// against the in-memory store.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backend = join(root, 'backend/upstream/backend');
function run(args, cwd = root) {
  const result = spawnSync(process.execPath, args, { cwd, env: process.env, stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) throw Error('Concept graph verification failed (' + (result.status ?? result.error?.code) + ').');
}
run([join(backend, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.conceptgraph.json'], backend);
const tests = readdirSync(join(root, 'backend/tests/contracts/conceptgraph')).filter((f) => f.endsWith('.test.mjs'));
if (!tests.length) throw Error('No concept graph contract tests found.');
run(['--test', '--test-reporter=tap', ...tests.map((f) => join(root, 'backend/tests/contracts/conceptgraph', f))]);
