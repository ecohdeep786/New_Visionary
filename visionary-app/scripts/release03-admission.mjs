// RELEASE-03 (KAN-126) admission ceiling acceptance runner.
//
// Runs two layers against the compiled product modules:
//   1. breaker-law.test.mjs — fast, emulator-free pins on the provider circuit
//      breaker state machine and the Retry-After response law.
//   2. admission-ceilings.test.mjs — the connected proof (per-UID/shared-
//      coordinator quotas, tenant fairness, fail-closed dependency failure,
//      circuit breaker and queue drain) over the real production HTTP
//      composition on the local emulator identity plane.
//
// It never contacts a real provider and never claims hosted quota: the hosted
// global cap is a recorded external gate (see
// docs/architecture/delivery/RELEASE03_ADMISSION_CEILINGS.md).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suites = [
  'backend/tests/contracts/release-03/breaker-law.test.mjs',
  'backend/tests/contracts/release-03/admission-ceilings.test.mjs',
];
for (const suite of suites) {
  const result = spawnSync(process.execPath, ['--test', path.join(root, suite)], { cwd: root, stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
