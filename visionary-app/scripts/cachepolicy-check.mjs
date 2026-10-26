import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
// CACHE-01 (KAN-141) — standard verification for the product-wide cache policy:
// focused compile + invariant/completeness contract tests.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backend = join(root, 'backend/upstream/backend');
function run(args, cwd = root) {
  const result = spawnSync(process.execPath, args, { cwd, env: process.env, stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) throw Error('Cache policy verification failed (' + (result.status ?? result.error?.code) + ').');
}
run([join(backend, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.cachepolicy.json'], backend);
const tests = readdirSync(join(root, 'backend/tests/contracts/cachepolicy')).filter((f) => f.endsWith('.test.mjs'));
if (!tests.length) throw Error('No cache policy contract tests found.');
run(['--test', '--test-reporter=tap', ...tests.map((f) => join(root, 'backend/tests/contracts/cachepolicy', f))]);
