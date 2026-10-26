import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
// CONTENT-02 (KAN-61) — standard verification for the bounded ingestion
// pipeline: focused compile + contract tests. No database is required; the
// suite runs against the contract-true in-memory store.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backend = join(root, 'backend/upstream/backend');
function run(args, cwd = root) {
  const result = spawnSync(process.execPath, args, { cwd, env: process.env, stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) throw Error('Ingestion verification failed (' + (result.status ?? result.error?.code) + ').');
}
run([join(backend, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.ingestion.json'], backend);
const tests = readdirSync(join(root, 'backend/tests/contracts/ingestion')).filter((f) => f.endsWith('.test.mjs'));
if (!tests.length) throw Error('No ingestion contract tests found.');
run(['--test', '--test-reporter=tap', ...tests.map((f) => join(root, 'backend/tests/contracts/ingestion', f))]);
