import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backend = join(root, 'backend/upstream/backend');
const url = process.env.DATA_TEST_DATABASE_URL;
if (!url) throw Error('Set DATA_TEST_DATABASE_URL to a disposable loopback visionary_data_test_* PostgreSQL database. See backend/README.md.');
const parsed = new URL(url);
if (!['localhost','127.0.0.1','[::1]'].includes(parsed.hostname) || !/^\/visionary_data_test(?:_|$)/.test(parsed.pathname)) throw Error('Synthetic database boundary required.');
const env = { ...process.env, DATABASE_URL: url, DIRECT_URL: url };
function run(args, cwd = root) {
  const result = spawnSync(process.execPath, args, { cwd, env, stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) throw Error('Domain verification failed (' + (result.status ?? result.error?.code) + ').');
}
const cli = join(backend, 'node_modules/prisma/build/index.js');
run([cli, 'validate'], backend);
run([cli, 'generate'], backend);
run([join(root, 'scripts/domain-ddl.mjs')]);
run([join(backend, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.workspace.json'], backend);
run([join(backend, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.data.json'], backend);
const tests = readdirSync(join(root, 'backend/tests/contracts/data-01')).filter((f) => f.endsWith('.test.mjs'));
run(['--test', '--test-reporter=tap', ...tests.map((f) => join(root, 'backend/tests/contracts/data-01', f))]);
const migrationTests = readdirSync(join(root, 'backend/tests/contracts/data-02')).filter((f) => f.endsWith('.test.mjs'));
run(['--test', '--test-reporter=tap', ...migrationTests.map((f) => join(root, 'backend/tests/contracts/data-02', f))]);
