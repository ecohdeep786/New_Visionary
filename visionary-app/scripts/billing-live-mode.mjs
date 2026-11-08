// BILL-07 (KAN-108) live-mode separation acceptance runner.
//
// Runs the mode-isolation proof against the compiled product modules: a
// fictional in-memory provider over the real BillingService/BillingRepository
// and the shared in-memory Firestore double. Both modes run against ONE memory
// store so any namespace leak fails the run.
//
// It never contacts a real payment provider and never uses a live key, and it
// never claims live-merchant money acceptance: real live credentials, approved
// seller/tax invoice data and provider live-plan provisioning remain external
// gates (see docs/architecture/delivery/BILL07_LIVE_MODE_SEPARATION.md).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suite = path.join(root, 'backend/tests/billing-live-mode.test.cjs');
const result = spawnSync(process.execPath, ['--test', suite], { cwd: root, stdio: 'inherit', env: process.env });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
