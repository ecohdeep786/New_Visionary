// ACCEPT-07 (KAN-123) registered command: run the complete migration cutover
// rehearsal against a disposable local synthetic PostgreSQL database.
// Fail-fast registered suite law (D-109): a missing environment is reported as
// a typed BLOCKED_ENVIRONMENT failure with actionable guidance, never a silent
// pass and never a partial run.
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.DATA_TEST_DATABASE_URL;
if (!url) {
  console.error(JSON.stringify({
    status: 'BLOCKED_ENVIRONMENT',
    command: 'npm run data:accept07:rehearsal',
    missing: ['DATA_TEST_DATABASE_URL'],
    guidance: 'Provision a disposable loopback PostgreSQL database named visionary_data_test_* (e.g. postgresql://postgres@127.0.0.1:5433/visionary_data_test_accept07) and export DATA_TEST_DATABASE_URL. See backend/README.md and docs/architecture/delivery/ACCEPT07_MIGRATION_REHEARSAL.md.',
  }, null, 2));
  process.exit(2);
}
const parsed = new URL(url);
if (!['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) || !/^\/visionary_data_test(?:_|$)/.test(parsed.pathname)) {
  console.error(JSON.stringify({ status: 'BLOCKED_ENVIRONMENT', reason: 'SYNTHETIC_DATABASE_BOUNDARY', guidance: 'The rehearsal only ever runs against a loopback visionary_data_test_* database.' }, null, 2));
  process.exit(2);
}
const result = spawnSync(process.execPath, ['--test', '--test-reporter=spec', join(root, 'backend/tests/contracts/accept-07/rehearsal.test.mjs')], {
  cwd: root, env: { ...process.env }, stdio: 'inherit', windowsHide: true,
});
process.exit(result.status ?? 1);
