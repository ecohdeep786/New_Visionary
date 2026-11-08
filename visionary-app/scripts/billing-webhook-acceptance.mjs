// Registered BILL-02 (KAN-103) acceptance runner: `npm run billing:webhook:acceptance`.
//
// Runs the payment-webhook acceptance for the existing test runtime: a real
// provider-shaped webhook surface over the canonical HTTPS ingress (raw signed
// bytes, size limits, duplicate idempotency, event-id conflicts, reordered/late/
// unmapped honesty, refund/dispute adjustment queueing, scheduled
// reconciliation, and a FULL product restart with durable queue recovery).
//
// The suite starts its own authorized local identity plane (Firebase Auth +
// Firestore emulators, demo project) and never touches a live project,
// credential file or payment provider. The actual Razorpay-registered webhook
// endpoint and provider-sent test events remain explicit external gates
// recorded in docs/architecture/delivery/BILL02_WEBHOOK_ACCEPTANCE.md.
//
// Fail-fast law: any failing assertion exits nonzero. Set
// BILL01_SELF_TEST_FAIL=1 to prove the law for the underlying stack — one
// deliberate assertion failure must fail this command.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suite = path.join(root, 'backend/tests/contracts/bill-02/bill02-webhook-acceptance.test.mjs');
const stack = createRequire(import.meta.url)('../backend/tests/contracts/bill-01/stack.cjs');

function blocked(message, guidance) {
  console.error(`BLOCKED_ENVIRONMENT: ${message}`);
  console.error(`Required next step: ${guidance}`);
  process.exit(1);
}

if (!existsSync(path.join(root, 'backend/upstream/backend/dist/src/main-auth.js'))) {
  blocked('the compiled product runtime is missing', 'run `npm run backend:build` from visionary-app, then rerun this command.');
}
if (!stack.discoverJava()) {
  blocked('a Java runtime is required by the Firestore emulator', 'install a Temurin 21+ JRE and set BILL01_JAVA_HOME (or JAVA_HOME) to its home directory.');
}
if (!stack.discoverOpenssl()) {
  blocked('openssl is required to mint the local TLS terminator certificate', 'install Git for Windows (ships openssl) or set BILL01_OPENSSL to an openssl executable.');
}

const protocol = spawnSync(process.execPath, ['--test', '--test-reporter=spec', suite], { cwd: root, stdio: 'inherit', windowsHide: true });
if (protocol.error || protocol.status !== 0) {
  console.error('BILL-02 webhook acceptance FAILED.');
  process.exit(protocol.status ?? 1);
}
console.log('BILL-02 webhook acceptance PASSED.');
