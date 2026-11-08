// Registered RELEASE-02 (KAN-125) runner: `npm run release:load:soak`.
//
// Executes the realistic data/index load and soak acceptance against the real
// connected runtime over the canonical TLS ingress with the real identity
// plane. Measures achieved percentiles, error rate, queue age and the
// saturation degradation law, and records the honest baseline-to-worker scaling
// arithmetic. It never proves hosted capacity.
//
// Fail-fast law: any failing assertion exits nonzero. Hosted capacity, the
// recorded 24h soak and real provider quotas stay explicit external gates in
// docs/architecture/delivery/RELEASE02_LOAD_SOAK.md.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suite = path.join(root, 'backend/tests/contracts/release-02/load-soak.test.mjs');
const stack = createRequire(import.meta.url)('../backend/tests/contracts/release-02/load-stack.cjs');

function blocked(message, guidance) {
  console.error(JSON.stringify({ status: 'BLOCKED_ENVIRONMENT', command: 'npm run release:load:soak', missing: message, guidance }, null, 2));
  process.exit(2);
}

if (!existsSync(path.join(root, 'backend/upstream/backend/dist/src/main-auth.js'))) {
  blocked('the compiled product runtime', 'run `npm run backend:build` from visionary-app, then rerun this command.');
}
if (!stack.discoverJava()) {
  blocked('a Java runtime for the Firestore emulator', 'install a Temurin 21+ JRE and set LOAD02_JAVA_HOME (or JAVA_HOME).');
}
if (!stack.discoverOpenssl()) {
  blocked('openssl for the TLS terminator certificate', 'install Git for Windows (ships openssl) or set LOAD02_OPENSSL.');
}

const result = spawnSync(process.execPath, ['--test', '--test-reporter=spec', suite], { cwd: root, stdio: 'inherit', windowsHide: true });
if (result.error || result.status !== 0) {
  console.error('RELEASE-02 load/soak acceptance FAILED.');
  process.exit(result.status ?? 1);
}
console.log('RELEASE-02 load/soak acceptance PASSED.');
