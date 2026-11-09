// RELEASE-04 (KAN-127) per-completed-task economics acceptance runner.
//
// Runs two layers:
//   1. spend-admission-law.test.mjs — fast, emulator-free pins on the product's
//      enforced spend-admission gate (typed 503, fail-closed cap, reserve/
//      settle) against the compiled product module.
//   2. per-task-economics.test.mjs — the per-completed-task unit-economics
//      model: failed attempts charge but never complete, latency/error budgets,
//      pinned-quality provenance, and the enforced (not alert-only) admission
//      decision.
//
// It never contacts a real provider and never claims hosted cost: the actual
// provider/model price figures and calibrated human quality review are recorded
// external gates (see docs/architecture/delivery/RELEASE04_PER_TASK_ECONOMICS.md).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suites = [
  'backend/tests/contracts/release-04/spend-admission-law.test.mjs',
  'scripts/tests/per-task-economics.test.mjs',
];
for (const suite of suites) {
  const result = spawnSync(process.execPath, ['--test', path.join(root, suite)], { cwd: root, stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
