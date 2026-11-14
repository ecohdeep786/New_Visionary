import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Compile actual production controller/service source under the deployed lock.
// No Firebase credentials, local .env, external database or provider is loaded.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtime = join(root, 'infrastructure/gcp/runtime');
if (!existsSync(join(runtime, 'node_modules/typescript/bin/tsc'))) throw Error('Install the locked infrastructure/gcp/runtime dependencies before SCOPE-06 runtime verification.');
const temporary = mkdtempSync(join(tmpdir(), 'visionary-scope06-'));
const backend = join(temporary, 'backend/upstream/backend');
function run(args, cwd) {
  const result = spawnSync(process.execPath, args, { cwd, stdio: 'inherit', windowsHide: true, timeout: 60000 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(`SCOPE-06 runtime check failed (${result.status ?? 'spawn'}).`);
}
try {
  mkdirSync(backend, { recursive: true });
  for (const name of ['src', 'tsconfig.json', 'tsconfig.product.json']) cpSync(join(root, 'backend/upstream/backend', name), join(backend, name), { recursive: true });
  cpSync(join(runtime, 'package.json'), join(backend, 'package.json'));
  symlinkSync(realpathSync(join(runtime, 'node_modules')), join(backend, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  const config = JSON.parse(readFileSync(join(backend, 'tsconfig.product.json'), 'utf8'));
  // Deliberately compile the connected learning boundary and its real imports;
  // the product entrypoint/SQL image is covered by the existing full CI checks.
  config.files = ['src/learning/learning.controller.ts', 'src/learning/learning.service.ts'];
  writeFileSync(join(backend, 'tsconfig.scope06.json'), JSON.stringify(config));
  const tests = join(temporary, 'backend/tests');
  mkdirSync(join(tests, 'contracts/scope-06'), { recursive: true });
  cpSync(join(root, 'backend/tests/contracts/scope-06'), join(tests, 'contracts/scope-06'), { recursive: true });
  mkdirSync(join(tests, 'fixtures'), { recursive: true });
  cpSync(join(root, 'backend/tests/fixtures/billing-memory.cjs'), join(tests, 'fixtures/billing-memory.cjs'));
  run([join(runtime, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.scope06.json'], backend);
  run(['--test', '--test-reporter=tap', join(tests, 'contracts/scope-06/runtime.test.cjs')], root);
} finally {
  const actual = realpathSync(temporary);
  if (dirname(actual) !== realpathSync(tmpdir()) || !basename(actual).startsWith('visionary-scope06-')) throw Error('SCOPE-06 temporary cleanup boundary mismatch.');
  // The known dependency junction is removed itself, not followed.
  rmSync(actual, { recursive: true, force: true });
}
