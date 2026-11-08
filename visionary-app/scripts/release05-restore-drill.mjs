// Registered RELEASE-05 (KAN-128) recovery-drill runner: `npm run release:restore:drill`.
//
// Runs the recovery drill suite for the existing test runtime: logical SQL
// corruption restore into an INDEPENDENT database (byte-faithful records, RTO
// measured against the stated <=4h target), deletion replay (a pre-deletion
// backup never permanently resurrects deleted identities — the tombstone
// journal is replayed), the forward-only deployment-rollback law with
// registry-drift preflight, Firestore logical-damage restore from an explicit
// recovery point (a fresh Free record never replaces subscription state), and
// reconnect + payment reconciliation after the restore restart.
//
// Environment (fail-fast, typed BLOCKED_ENVIRONMENT): DATA_TEST_DATABASE_URL
// (disposable loopback visionary_data_test_* PostgreSQL), RELEASE05_PG_BIN or
// pg_dump/psql on PATH (PostgreSQL 16), Java 21+ (Firestore emulator),
// openssl (TLS certificate), the compiled product runtime. The full region
// outage drill and hosted PITR controls remain external gates recorded in
// docs/architecture/delivery/RELEASE05_RECOVERY_DRILLS.md.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suite = path.join(root, 'backend/tests/contracts/release-05/restore-drills.test.mjs');
const stack = createRequire(import.meta.url)('../backend/tests/contracts/bill-01/stack.cjs');

function blocked(message, guidance) {
  console.error(JSON.stringify({ status: 'BLOCKED_ENVIRONMENT', command: 'npm run release:restore:drill', missing: message, guidance }, null, 2));
  process.exit(2);
}

if (!process.env.DATA_TEST_DATABASE_URL) {
  blocked('DATA_TEST_DATABASE_URL',
    'provision a disposable loopback PostgreSQL database named visionary_data_test_* (e.g. postgresql://postgres@127.0.0.1:5433/visionary_data_test_accept07) and export DATA_TEST_DATABASE_URL.');
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
if (!process.env.RELEASE05_PG_BIN) {
  const probe = spawnSync('pg_dump', ['--version'], { shell: true, windowsHide: true });
  if (probe.status !== 0) {
    blocked('pg_dump/psql (PostgreSQL 16 client tools)',
      'set RELEASE05_PG_BIN to a PostgreSQL 16 bin directory (pg_dump, pg_dumpall, psql).');
  }
}

const result = spawnSync(process.execPath, ['--test', '--test-reporter=spec', suite], { cwd: root, stdio: 'inherit', windowsHide: true });
if (result.error || result.status !== 0) {
  console.error('RELEASE-05 recovery drills FAILED.');
  process.exit(result.status ?? 1);
}
console.log('RELEASE-05 recovery drills PASSED.');
