// ACCEPT-01 (KAN-117) connected journey rehearsal runner.
//
// Runs the connected journey proof (accept01-journey.test.mjs) against the real
// production HTTP composition on the canonical loopback origin with the Firebase
// Auth + Firestore emulators and a real disposable SQL staging schema for the
// personal-workspace ("project") step.
//
// Environment:
//   JAVA_HOME            Temurin 21+ (Firestore emulator)
//   DATA_TEST_DATABASE_URL  disposable loopback visionary_data_test_* database
//                        (the project step provisions against a staging schema
//                        created in it; without it the project step proves its
//                        typed 503 instead).
//
// It never contacts a real payment provider and never claims hosted acceptance:
// the hosted walk of this journey remains the ACCEPT-01 external gate (see
// docs/architecture/delivery/ACCEPT01_JOURNEY_REHEARSAL.md).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync(process.execPath, ['--test', path.join(root, 'backend/tests/contracts/accept-01/accept01-journey.test.mjs')], { cwd: root, stdio: 'inherit', env: process.env });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
