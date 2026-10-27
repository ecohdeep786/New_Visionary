import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
// CONTENT-04 (KAN-63) — standard verification for the catalog/concept → reviewed
// DTO adapter: focused compile + contract tests against the in-memory store.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backend = join(root, 'backend/upstream/backend');
function run(args, cwd = root) {
  const result = spawnSync(process.execPath, args, { cwd, env: process.env, stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) throw Error('Catalog adapter verification failed (' + (result.status ?? result.error?.code) + ').');
}
run([join(backend, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.catalogadapter.json'], backend);
const tests = readdirSync(join(root, 'backend/tests/contracts/catalogadapter')).filter((f) => f.endsWith('.test.mjs'));
if (!tests.length) throw Error('No catalog adapter contract tests found.');
run(['--test', '--test-reporter=tap', ...tests.map((f) => join(root, 'backend/tests/contracts/catalogadapter', f))]);
