import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
// BUILD-09 (KAN-154) — standard verification for declarative-activity
// contracts: focused compile (deviceadapter + dependency modules + this one)
// then contract tests against the shared in-memory owning store.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backend = join(root, 'backend/upstream/backend');
function run(args, cwd = root) {
  const result = spawnSync(process.execPath, args, { cwd, env: process.env, stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) throw Error('Declarative-activity contract verification failed (' + (result.status ?? result.error?.code) + ').');
}
run([join(backend, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.declarativeactivity.json'], backend);
const tests = readdirSync(join(root, 'backend/tests/contracts/declarativeactivity')).filter((f) => f.endsWith('.test.mjs'));
if (!tests.length) throw Error('No declarative-activity contract tests found.');
run(['--test', '--test-reporter=tap', ...tests.map((f) => join(root, 'backend/tests/contracts/declarativeactivity', f))]);
