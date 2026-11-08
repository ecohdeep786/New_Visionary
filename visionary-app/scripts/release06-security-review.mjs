// Registered RELEASE-06 (KAN-129) runner: `npm run release:security:review`.
//
// Runs the release-path security review: upstream patch provenance integrity
// (recorded sha256 must match diff bytes), dependency lockfile pin review,
// the secret-surface law (no secret material in product source; config-only
// secrets), and the LIVE secret-rotation drill over the canonical TLS ingress
// (stale credentials fail closed after a full product restart).
//
// Fail-fast law: any failing assertion exits nonzero. External gates
// (image review, IAM review, named responders, advisory-database review) are
// recorded in docs/architecture/delivery/RELEASE06_RELEASE_SECURITY.md.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suite = path.join(root, 'backend/tests/contracts/release-06/release-security.test.mjs');
const stack = createRequire(import.meta.url)('../backend/tests/contracts/bill-01/stack.cjs');

function blocked(message, guidance) {
  console.error(JSON.stringify({ status: 'BLOCKED_ENVIRONMENT', command: 'npm run release:security:review', missing: message, guidance }, null, 2));
  process.exit(2);
}

if (!existsSync(path.join(root, 'backend/upstream/backend/dist/src/main-auth.js'))) {
  blocked('the compiled product runtime', 'run `npm run backend:build` from visionary-app, then rerun this command.');
}
if (!stack.discoverJava()) {
  blocked('a Java runtime for the Firestore emulator', 'install a Temurin 21+ JRE and set BILL01_JAVA_HOME (or JAVA_HOME).');
}
if (!stack.discoverOpenssl()) {
  blocked('openssl for the TLS terminator certificate', 'install Git for Windows (ships openssl) or set BILL01_OPENSSL.');
}

const result = spawnSync(process.execPath, ['--test', '--test-reporter=spec', suite], { cwd: root, stdio: 'inherit', windowsHide: true });
if (result.error || result.status !== 0) {
  console.error('RELEASE-06 security review FAILED.');
  process.exit(result.status ?? 1);
}
console.log('RELEASE-06 security review PASSED.');
