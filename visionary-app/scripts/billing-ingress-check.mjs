// Registered BILL-01 (KAN-102) acceptance runner: `npm run billing:ingress:check`.
//
// Runs the canonical HTTPS-ingress acceptance for the existing test runtime:
// first the self-contained protocol suite (real TLS terminator, canonical
// origin, secure cookies, auth return, test-merchant fixture checkout, durable
// Firestore export/import restart, two devices), then the real-browser journey
// (Microsoft Edge enforces the cookie law; two contexts are two devices).
//
// The suite starts its own authorized local identity plane (Firebase Auth +
// Firestore emulators, demo project) and never touches a live project,
// credential file or payment provider. Hosted deployment and real Razorpay
// test-merchant credentials remain explicit external gates recorded in
// docs/architecture/delivery/BILL01_INGRESS_ACCEPTANCE.md.
//
// Fail-fast law: any failing assertion exits nonzero. Set
// BILL01_SELF_TEST_FAIL=1 to prove the law — one deliberate assertion failure
// must fail this command.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suite = path.join(root, 'backend/tests/contracts/bill-01/bill01-ingress-acceptance.test.mjs');
const browserJourney = path.join(root, 'backend/tests/contracts/bill-01/bill01-browser-journey.mjs');
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
  console.error('BILL-01 protocol acceptance FAILED; the browser journey was not run.');
  process.exit(protocol.status ?? 1);
}

const frontendNodeModules = path.join(root, 'frontend/node_modules/playwright-core/package.json');
if (!existsSync(frontendNodeModules)) {
  blocked('playwright-core is not installed in frontend', 'run `npm ci` in visionary-app/frontend, then rerun this command.');
}
const browser = spawnSync(process.execPath, [browserJourney], { cwd: root, stdio: 'inherit', windowsHide: true });
if (browser.error || browser.status !== 0) {
  console.error('BILL-01 browser journey FAILED.');
  process.exit(browser.status ?? 1);
}
console.log('BILL-01 ingress acceptance: protocol suite and browser journey PASSED.');
