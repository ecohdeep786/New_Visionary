import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const file of ['verify-layout.mjs', 'verify-imports.mjs']) {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', file)], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const continuityCheck = spawnSync(process.execPath, [path.join(root, 'frontend/scripts/qa-continuity.mjs')], { cwd: root, stdio: 'inherit' });
if (continuityCheck.error) throw continuityCheck.error;
if (continuityCheck.status !== 0) process.exit(continuityCheck.status ?? 1);
const scriptTests = spawnSync(process.execPath, ['--test', ...['upstream-patches.test.mjs', 'backend-runtime.test.mjs', 'cost-model.test.mjs', 'continuity-law.test.mjs', 'request-limits.test.mjs', 'authority-audit.test.mjs'].map(file => path.join(root, 'scripts/tests', file))], { cwd: root, stdio: 'inherit' });
if (scriptTests.error) throw scriptTests.error;
if (scriptTests.status !== 0) process.exit(scriptTests.status ?? 1);
const apiContracts = spawnSync(process.execPath, [path.join(root, 'integration/contracts/v1/check.mjs')], { cwd: root, stdio: 'inherit' });
if (apiContracts.error) throw apiContracts.error;
if (apiContracts.status !== 0) process.exit(apiContracts.status ?? 1);
// SCOPE-06 (KAN-33): executable backend contract/deny/replay cases and the
// matching frontend vertical-slice cases, registered fail-fast so a green
// check always proves they ran.
const scope06Backend = spawnSync(process.execPath, ['--test', path.join(root, 'backend/tests/contracts/scope-06/scope-06.test.mjs')], { cwd: root, stdio: 'inherit' });
if (scope06Backend.error) throw scope06Backend.error;
if (scope06Backend.status !== 0) process.exit(scope06Backend.status ?? 1);
const scope06Frontend = spawnSync(process.execPath, ['--test', path.join(root, 'frontend/tests/contracts/scope-06/scope-06.test.mjs')], { cwd: root, stdio: 'inherit' });
if (scope06Frontend.error) throw scope06Frontend.error;
if (scope06Frontend.status !== 0) process.exit(scope06Frontend.status ?? 1);
const surfaceCheck = spawnSync(process.execPath, [path.join(root, 'scripts/surface-audit.mjs')], { cwd: root, stdio: 'inherit' });
if (surfaceCheck.error) throw surfaceCheck.error;
if (surfaceCheck.status !== 0) process.exit(surfaceCheck.status ?? 1);
for (const task of ['lint', 'typecheck', 'test', 'build']) {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/frontend.mjs'), task], { cwd: root, stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
