import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Exercise the deployed dependency lock without installing into the pinned
// upstream checkout or following another worker's dependency junction.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtime = join(root, 'infrastructure/gcp/runtime');
const temporary = mkdtempSync(join(tmpdir(), 'visionary-production-check-'));
const backend = join(temporary, 'backend/upstream/backend');
const run = (args, cwd) => {
  const result = spawnSync(process.execPath, args, { cwd, stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) throw Error(`Production check failed (${result.status ?? 'spawn'}).`);
};
try {
  mkdirSync(backend, { recursive: true });
  for (const name of ['src', 'tsconfig.json', 'tsconfig.product.json']) cpSync(join(root, 'backend/upstream/backend', name), join(backend, name), { recursive: true });
  cpSync(join(runtime, 'package.json'), join(backend, 'package.json'));
  mkdirSync(join(backend, 'prisma'), { recursive: true });
  cpSync(join(root, 'backend/upstream/backend/prisma/schema.prisma'), join(backend, 'prisma/schema.prisma'));
  symlinkSync(realpathSync(join(runtime, 'node_modules')), join(backend, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  run([join(runtime, 'node_modules/prisma/build/index.js'), 'generate', '--schema', join(backend, 'prisma/schema.prisma')], backend);
  const tests = ['firebase-admin', 'firebase-product', 'account-storage', 'billing', 'feedback', 'production-http'];
  // Main predates the independently delivered account-directory feature. Its
  // source and regressions must arrive together when that feature is released.
  const hasDirectory = existsSync(join(backend, 'src/auth/firebase-product/account-directory.ts'));
  if (hasDirectory !== existsSync(join(root, 'backend/tests/account-directory.test.cjs'))) throw Error('Account directory source/test scope is incomplete.');
  if (hasDirectory) tests.push('account-directory');
  const hasKnowledge = existsSync(join(backend, 'src/learning/knowledge-projection.service.ts'));
  if (hasKnowledge !== existsSync(join(root, 'backend/tests/knowledge-projection.test.cjs'))) throw Error('Knowledge projection source/test scope is incomplete.');
  if (hasKnowledge) tests.push('knowledge-projection');
  const hasLearning = existsSync(join(backend, 'src/learning/learning.service.ts'));
  if (hasLearning !== existsSync(join(root, 'backend/tests/learning-loop.test.cjs'))) throw Error('Learning loop source/test scope is incomplete.');
  if (hasLearning) tests.push('learning-loop');
  const testRoot = join(temporary, 'backend/tests');
  mkdirSync(testRoot, { recursive: true });
  cpSync(join(root, 'backend/tests/fixtures'), join(testRoot, 'fixtures'), { recursive: true });
  for (const name of tests) cpSync(join(root, 'backend/tests', `${name}.test.cjs`), join(testRoot, `${name}.test.cjs`));
  run([join(runtime, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.product.json'], backend);
  // Historical account repair/verifier regressions use the same dependency lock,
  // but these offline tools are deliberately absent from the deployed graph.
  const config = JSON.parse(readFileSync(join(backend, 'tsconfig.product.json'), 'utf8'));
  for (const name of ['account-migration', 'account-tree-verifier']) {
    const source = `src/auth/firebase-product/${name}.ts`;
    if (existsSync(join(backend, source))) config.files.push(source);
  }
  const hasProvisioning = existsSync(join(backend, 'src/workspaces/personal-workspace.service.ts'));
  if (hasProvisioning) {
    config.files.push('src/data/migration-runner.ts', 'src/data/migration-store.ts', 'src/data/migration-registry.ts');
    cpSync(join(root, 'backend/upstream/backend/prisma/migrations/20261024000001_data_01_workspaces'), join(backend, 'prisma/migrations/20261024000001_data_01_workspaces'), { recursive: true });
    for (const file of ['data-01/postgres-fixture.cjs', 'data-02/postgres-fixture.cjs', 'data-03/provisioning.test.mjs']) {
      const destination = join(testRoot, 'contracts', file); mkdirSync(dirname(destination), { recursive: true });
      cpSync(join(root, 'backend/tests/contracts', file), destination);
    }
  }
  writeFileSync(join(backend, 'tsconfig.tests.json'), JSON.stringify(config));
  run([join(runtime, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.tests.json'], backend);
  run(['--test', '--test-reporter=tap', ...tests.map(name => join(testRoot, `${name}.test.cjs`))], root);
  if (hasProvisioning) run([join(root, 'scripts/provision-check.mjs'), '--root', temporary], root);
} finally {
  const actual = realpathSync(temporary);
  if (dirname(actual) !== realpathSync(tmpdir()) || !basename(actual).startsWith('visionary-production-check-')) throw Error('Temporary check cleanup boundary mismatch.');
  // rm removes the dependency link itself, not its external target.
  rmSync(actual, { recursive: true, force: true });
}
