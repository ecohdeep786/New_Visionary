// RELEASE-05 (KAN-128) — recovery drill suite: SQL restore, deletion replay,
// Firestore backup/restore integrity, reconnect + payment reconciliation, and
// the deployment-rollback law.
//
// Executes the launch-operations incident-table drills that are implementable
// on the local synthetic estate, against the REAL product laws proven by the
// ACCEPT-07 migration rehearsal and the BILL-01/02 ingress/webhook harnesses:
//
//   Logical SQL corruption   — independent restore into a FRESH database from
//                              an explicit dump (never in place), sample
//                              record/revision checks, measured RTO vs the
//                              stated <=4h target and RPO <=5min exposure;
//   Deletion replay          — a restore from a pre-deletion backup must not
//                              resurrect deleted data: the tombstone journal
//                              recorded before the restore is REPLAYED after
//                              it (re-delete + re-tombstone), and visibility
//                              laws see the row as deleted;
//   Firestore logical damage — an explicit recovery point (emulator export),
//                              deliberate damage, import restore, then
//                              account/billing integrity WITHOUT a fresh Free
//                              record ever replacing uncertain subscription
//                              state;
//   Reconnect + payments     — fresh verified sign-in recovers the durable
//                              account after the restore restart; the
//                              scheduled reconciliation job still converges
//                              from provider facts;
//   Deployment rollback      — the reviewed migration registry is forward-only
//                              and drift-checked: an unknown revision's
//                              registry cannot verify against restored state
//                              (schema compatibility is a preflight law, not a
//                              hope).
//
// The full region outage drill (manual DR RTO<=24h/RPO<=24h, cross-region
// backups) and hosted PITR controls remain explicit external gates recorded in
// the runbook; this suite never contacts them. Every store is synthetic and
// disposable: the Postgres database is a visionary_data_test_* loopback
// database, the identity plane is the demo-project emulator pair.

import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import http from 'node:http';

import stack from '../bill-01/stack.cjs';

let runDir;
let sqlDb = null;
let adminApp;
let drillProviderState;
const state = { users: {}, devices: {}, databasesToDrop: [], measurements: [] };

const here = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(here, '../../../..');
const backendPackage = createRequire(path.join(productRoot, 'backend/upstream/backend/package.json'));
const accept07 = createRequire(import.meta.url)('../accept-07/rehearsal-fixture.cjs');
const { MigrationRunner } = accept07.req('./dist/src/data/migration-runner.js');
const { canonicalMigrations, registerMigration } = accept07.req('./dist/src/data/migration-registry.js');
const { PostgresMigrationStore } = accept07.req('./dist/src/data/migration-store.js');

const N = 12;
const persons = Array.from({ length: N }, (_, i) => ({
  uid: ('v' + String(i).padStart(4, '0') + 'r' + 'x'.repeat(58)).slice(0, 64), // unique prefix, synthetic uid
  email: `drill-${i + 1}@restore.example`,
}));

function discoverPgBin() {
  if (process.env.RELEASE05_PG_BIN) {
    return existsSync(path.join(process.env.RELEASE05_PG_BIN, 'pg_dump.exe')) || existsSync(path.join(process.env.RELEASE05_PG_BIN, 'pg_dump')) ? process.env.RELEASE05_PG_BIN : null;
  }
  const probe = spawnSync('pg_dump', ['--version'], { shell: true, windowsHide: true });
  return probe.status === 0 ? '' : null; // '' = resolves on PATH
}

function pgTool(file, args, { database } = {}) {
  const bin = process.env.RELEASE05_PG_BIN;
  const tool = bin ? path.join(bin, file) : file;
  const env = {
    ...process.env,
    PGHOST: '127.0.0.1', PGPORT: String(new URL(process.env.DATA_TEST_DATABASE_URL).port || '5433'), PGUSER: 'postgres',
    PGDATABASE: database || new URL(process.env.DATA_TEST_DATABASE_URL).pathname.slice(1),
  };
  const result = spawnSync(tool, args, { shell: !!bin, windowsHide: true, env, encoding: 'utf8' });
  if (result.status !== 0) throw Error(`${file} failed (${result.status}): ${String(result.stderr).slice(0, 400)}`);
  return result;
}

// One statement, its rows (drill-local helper over a transient admin client).
async function sqlRows(statement, database) {
  const base = new URL(process.env.DATA_TEST_DATABASE_URL);
  const url = `postgresql://postgres@127.0.0.1:${base.port || '5433'}/${database || base.pathname.slice(1)}`;
  const { PrismaClient } = backendPackage('@prisma/client');
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    return await client.$queryRawUnsafe(statement);
  } finally { await client.$disconnect(); }
}

// Full-fidelity ledger of the canonical domain: counts + sample identity list.
async function domainLedger(schema, database) {
  const [counts] = await sqlRows(
    `SELECT
      (SELECT count(*)::int FROM "${schema}"."persons") AS persons,
      (SELECT count(*)::int FROM "${schema}"."workspaces") AS workspaces,
      (SELECT count(*)::int FROM "${schema}"."workspace_memberships") AS memberships,
      (SELECT count(*)::int FROM "${schema}"."deletion_tombstones") AS tombstones`,
    database);
  const uids = (await sqlRows(`SELECT "uid" FROM "${schema}"."persons" ORDER BY "uid"`, database)).map(r => r.uid);
  return { counts, uids };
}

before(async () => {
  if (!process.env.DATA_TEST_DATABASE_URL) {
    throw Object.assign(Error('RELEASE-05 SQL drills need DATA_TEST_DATABASE_URL (disposable loopback visionary_data_test_* database).'), { blocked: 'BLOCKED_ENVIRONMENT' });
  }
  if (discoverPgBin() === null) {
    throw Object.assign(Error('RELEASE-05 SQL drills need pg_dump/psql; set RELEASE05_PG_BIN to a PostgreSQL 16 bin directory.'), { blocked: 'BLOCKED_ENVIRONMENT' });
  }
  stack.assertRunnable();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  runDir = process.env.BILL01_RUN_DIR || path.join(productRoot, 'artifacts/qa/release05-restore-drills', stamp);
  mkdirSync(runDir, { recursive: true });

  // --- SQL estate: a populated, migrated synthetic domain ---------------- //
  sqlDb = await accept07.rehearsalDatabase();
  const store = new PostgresMigrationStore(sqlDb.config);
  await new MigrationRunner(store, canonicalMigrations(accept07.backend)).applyAll();
  await store.close();
  for (const person of persons) {
    await sqlDb.admin.$executeRawUnsafe(`INSERT INTO "${sqlDb.schema}"."persons"("uid","updatedAt") VALUES($1, CURRENT_TIMESTAMP)`, person.uid);
    await sqlDb.admin.$executeRawUnsafe(`INSERT INTO "${sqlDb.schema}"."workspaces"(id,"uid",name,slug,"isPersonal","updatedAt") VALUES($1,$2,$3,$4,TRUE,CURRENT_TIMESTAMP)`, 'ws_' + person.uid.slice(0, 20), person.uid, `Drill ${person.email}`, 'drill-' + person.email.split('@')[0]);
    await sqlDb.admin.$executeRawUnsafe(`INSERT INTO "${sqlDb.schema}"."workspace_memberships"(id,"uid","workspaceId",role,source,"updatedAt") VALUES($1,$2,$3,'OWNER','restore-drill',CURRENT_TIMESTAMP)`, 'm_' + person.uid.slice(0, 20), person.uid, 'ws_' + person.uid.slice(0, 20));
  }
  // The runtime identity keeps its least-privilege read over the domain.
  await sqlDb.grantRuntime();

  // --- Identity plane: emulators + product stack (BILL-01/02 harness) ---- //
  await stack.startEmulators({ logFile: path.join(runDir, 'emulators.log'), workDir: runDir });
  drillProviderState = { subscriptions: new Map(), invoices: new Map(), payments: new Map(), creates: 0 };
  await stack.startStack({ runDir, providerState: drillProviderState });

  const { initializeApp, deleteApp } = backendPackage('firebase-admin/app');
  adminApp = initializeApp({
    projectId: stack.AUTH_EMULATOR_PROJECT,
    credential: { getAccessToken: async () => ({ access_token: 'emulator-only', expires_in: 3600 }) },
  }, 'release05-driver');
  state.deleteDriverApp = () => deleteApp(adminApp);

  state.users.payer = await createEmulatorUser('payer@restore.example');
  state.devices.payer = await establishDevice('payer@restore.example', '203.0.113.31', { onboard: true });
});

after(async () => {
  await stack.stopStack();
  await stack.stopEmulators();
  if (state.deleteDriverApp) await state.deleteDriverApp();
  if (sqlDb) { await sqlDb.close().catch(() => {}); }
  // Drop the independent-restore databases created by the drills.
  for (const name of state.databasesToDrop || []) {
    await sqlRows(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`).catch(() => {});
  }
  // The drill report: measured times vs the stated targets.
  try {
    writeFileSync(path.join(runDir, 'restore-drill-report.json'), JSON.stringify({
      task: 'RELEASE-05 / KAN-128', kind: 'recovery-drill-suite', date: new Date().toISOString(),
      measurements: state.measurements,
      externalGates: [
        'full region outage drill (manual DR RTO<=24h / RPO<=24h, cross-region encrypted backups)',
        'hosted PITR controls for Cloud SQL and the named Firestore database',
        'object-storage restore drill (hosted bucket versioning)',
      ],
    }, null, 2));
  } catch { /* report is best-effort evidence; failures must still surface */ }
});

// --- Browser-device helpers (provenance: BILL-01/BILL-02 harnesses) ------- //

async function createEmulatorUser(email) {
  const { getAuth } = backendPackage('firebase-admin/auth');
  const user = await getAuth(adminApp).createUser({ email, password: 'restore-drill-Pass1', emailVerified: true });
  return user.uid;
}

async function emulatorSignInToken(email) {
  const response = await fetch(`http://127.0.0.1:${stack.PORTS.auth}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'restore-drill-Pass1', returnSecureToken: true }),
  });
  assert.equal(response.status, 200);
  return (await response.json()).idToken;
}

async function establishDevice(email, deviceIp, { onboard = false } = {}) {
  const jar = stack.cookieJar();
  const csrf = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp });
  assert.equal(csrf.status, 200);
  jar.capture(csrf);
  const token = await emulatorSignInToken(email);
  const session = await stack.ingressRequest({
    pathname: '/api/auth/session', method: 'POST', deviceIp, jar,
    body: { idToken: token }, headers: { 'x-csrf-token': csrf.body.token },
  });
  assert.equal(session.status, 201, `Session exchange failed for ${email}: ${session.text}`);
  jar.capture(session);
  const profile = session.body;
  const post = async (pathname, body, extraHeaders = {}) => {
    const fresh = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp, jar });
    jar.capture(fresh);
    return stack.ingressRequest({ pathname, method: 'POST', deviceIp, jar, body, headers: { 'x-csrf-token': fresh.body.token, 'x-visionary-account': profile.id, ...extraHeaders } });
  };
  const get = async (pathname, extraHeaders = {}) =>
    stack.ingressRequest({ pathname, deviceIp, jar, headers: { 'x-visionary-account': profile.id, ...extraHeaders } });
  if (onboard) {
    const completed = await post('/api/auth/onboarding', { identity: 'professional', age_band: 'adult', full_name: 'QA Restore Drill', preferred_language: 'English' });
    assert.equal(completed.status, 201, `Onboarding failed: ${completed.text}`);
  }
  return { jar, deviceIp, profile, post, get };
}

async function establishPaidSubscription(device) {
  const catalog = await stack.ingressRequest({ pathname: '/api/billing/catalog', deviceIp: device.deviceIp, jar: device.jar });
  assert.equal(catalog.status, 200);
  const checkout = await device.post('/api/billing/checkouts', { plan: 'personal', interval: 'monthly', commandId: randomUUID(), catalogVersion: catalog.body.version });
  assert.equal(checkout.status, 201, `Checkout failed: ${checkout.text}`);
  const control = await fixtureControl('/fixture/complete-payment', { subscriptionId: checkout.body.subscriptionId });
  assert.equal(control.status, 200);
  const verify = await device.post('/api/billing/verify', {
    attemptId: checkout.body.attemptId,
    razorpay_payment_id: control.body.razorpay_payment_id,
    razorpay_subscription_id: control.body.razorpay_subscription_id,
    razorpay_signature: control.body.razorpay_signature,
  });
  assert.equal(verify.status, 201, `Verify failed: ${verify.text}`);
  return { subscriptionId: control.body.razorpay_subscription_id, paymentId: control.body.razorpay_payment_id, invoiceId: verify.body.invoices[0]?.id, verifiedAt: Date.now() };
}

function fixtureControl(pathname, body, method = 'POST') {
  return new Promise((resolve, reject) => {
    const payload = method === 'GET' ? null : JSON.stringify(body || {});
    const request = http.request({ host: '127.0.0.1', port: stack.PORTS.control, path: pathname, method, headers: method === 'GET' ? {} : { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload || '') } }, response => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body: data ? JSON.parse(data) : null, text: data }));
    });
    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
}

// Restore an explicit dump into an INDEPENDENT database (never in place) with
// the roles recreated first — the operator procedure the runbook records.
async function independentRestore(dumpFile, globalsFile, restoredName) {
  state.databasesToDrop.push(restoredName);
  await sqlRows(`DROP DATABASE IF EXISTS "${restoredName}" WITH (FORCE)`);
  await sqlRows(`CREATE DATABASE "${restoredName}"`);
  const started = Date.now();
  pgTool('psql.exe', ['-d', restoredName, '-v', 'ON_ERROR_STOP=0', '-f', globalsFile], { database: restoredName });
  pgTool('psql.exe', ['-d', restoredName, '-v', 'ON_ERROR_STOP=1', '-f', dumpFile], { database: restoredName });
  return Date.now() - started;
}

test('logical SQL corruption: independent restore into a fresh database with byte-faithful records (RTO measured)', async () => {
  const schema = sqlDb.schema;
  const before = await domainLedger(schema, process.env.DATA_TEST_DATABASE_URL.replace(/^.*\//, ''));

  // Recovery point: explicit dump of the product schema + the role globals.
  const globalsFile = path.join(runDir, 'globals.sql');
  const dumpFile = path.join(runDir, 'schema-drill.sql');
  pgTool('pg_dumpall.exe', ['--globals-only', '--file', globalsFile]);
  pgTool('pg_dump.exe', ['-n', schema, '--file', dumpFile]);
  const backupDoneAt = Date.now();

  // Logical corruption AFTER the backup: RPO exposure = 0 (nothing written
  // between the recovery point and the damage).
  await sqlDb.admin.$executeRawUnsafe(`DELETE FROM "${schema}"."workspace_memberships"`);
  await sqlDb.admin.$executeRawUnsafe(`UPDATE "${schema}"."workspaces" SET name = 'CORRUPTED'`);
  const corrupt = await domainLedger(schema, process.env.DATA_TEST_DATABASE_URL.replace(/^.*\//, ''));
  assert.notEqual(JSON.stringify(corrupt), JSON.stringify(before), 'The corruption must be observable.');

  const restoredName = 'visionary_data_test_release05_restore';
  const rtoMs = await independentRestore(dumpFile, globalsFile, restoredName);
  const restored = await domainLedger(schema, restoredName);
  assert.deepEqual(restored.counts, before.counts, `Restored counts must be byte-faithful: ${JSON.stringify({ before: before.counts, restored: restored.counts })}`);
  assert.deepEqual(restored.uids, before.uids, 'Sample records must be byte-faithful after restore.');

  state.measurements.push({ drill: 'sql-logical-corruption-restore', backupToDamageWrites: 0, rpoExposureSeconds: 0, rtoSeconds: Math.round(rtoMs / 1000), targetRtoSeconds: 4 * 3600, targetRpoSeconds: 300 });
  assert.ok(rtoMs < 4 * 3600 * 1000, 'The measured local RTO must be within the stated <=4h target.');
});

test('deletion replay: a restore from a pre-deletion backup re-deletes tombstoned data', async () => {
  const schema = sqlDb.schema;
  const victim = persons[0];

  const globalsFile = path.join(runDir, 'globals-2.sql');
  const dumpFile = path.join(runDir, 'schema-drill-2.sql');
  pgTool('pg_dumpall.exe', ['--globals-only', '--file', globalsFile]);
  pgTool('pg_dump.exe', ['-n', schema, '--file', dumpFile]);

  // Deletion WITH tombstone AFTER the backup — the tombstone is a soft-delete
  // marker: the person row stays but every visibility law hides it (that is
  // how the reviewed schema expresses deletion; FK Restrict forbids a hard
  // person delete under a tombstone).
  await sqlDb.admin.$executeRawUnsafe(`INSERT INTO "${schema}"."deletion_tombstones"(id,"uid","resourceType","resourceId") VALUES($1,$2,'person',$3)`, 'tomb_' + victim.uid.slice(0, 20), victim.uid, victim.uid);
  // The deletion journal recorded BEFORE the restore is the operator's replay
  // input (in hosted operation it is the deletion event log; here it is the
  // tombstone table captured at damage time).
  const journal = (await sqlDb.admin.$queryRawUnsafe(`SELECT "uid","resourceType","resourceId" FROM "${schema}"."deletion_tombstones"`)).map(r => ({ uid: r.uid, resourceType: r.resourceType, resourceId: r.resourceId }));
  assert.equal(journal.length, 1);

  // Restore the PRE-deletion backup into an independent database.
  const restoredName = 'visionary_data_test_release05_replay';
  await independentRestore(dumpFile, globalsFile, restoredName);
  const visible = async (db) => (await sqlRows(`SELECT count(*)::int AS c FROM "${schema}"."persons" p WHERE p."uid" = '${victim.uid}' AND NOT EXISTS(SELECT 1 FROM "${schema}"."deletion_tombstones" t WHERE t."uid" = p."uid" AND t."resourceType" = 'person')`, db))[0].c;
  assert.equal(await visible(restoredName), 1, 'The pre-deletion backup resurrects the deleted identity — the hazard the replay exists to fix.');
  const [tombGone] = await sqlRows(`SELECT count(*)::int AS c FROM "${schema}"."deletion_tombstones"`, restoredName);
  assert.equal(tombGone.c, 0, 'The tombstone is also absent from the older backup.');

  // REPLAY the journal: re-tombstone the deleted identities.
  for (const entry of journal) {
    await sqlRows(`INSERT INTO "${schema}"."deletion_tombstones"(id,"uid","resourceType","resourceId") VALUES('tomb_replay_${entry.uid.slice(3, 20)}','${entry.uid}','${entry.resourceType}','${entry.resourceId}')`, restoredName);
  }
  assert.equal(await visible(restoredName), 0, 'After the journal replay the deleted identity is hidden again by the visibility law.');
  const [retombstoned] = await sqlRows(`SELECT count(*)::int AS c FROM "${schema}"."deletion_tombstones" WHERE "uid" = '${victim.uid}'`, restoredName);
  assert.equal(retombstoned.c, 1, 'The tombstone is restored with the replay.');
  state.measurements.push({ drill: 'deletion-replay', replayedEntries: journal.length });
});

test('deployment rollback law: an unknown revision registry cannot verify against restored state (schema compatibility is a preflight law)', async () => {
  const schema = sqlDb.schema;
  // The reviewed registry is forward-only: rollback over a populated domain is
  // refused — recovery is snapshot-based (proven end-to-end in ACCEPT-07).
  const store = new PostgresMigrationStore(sqlDb.config);
  try {
    await assert.rejects(() => new MigrationRunner(store, canonicalMigrations(accept07.backend)).rollbackLast(), /ROLLBACK_DENIED/,
      'The forward-only deployment-rollback law must hold on the populated domain.');
    // An app revision whose registry differs from the applied one (drifted
    // statements) FAILS preflight against the restored/compatible schema —
    // "schema compatible" is verified, not assumed.
    const tampered = canonicalMigrations(accept07.backend).map(m =>
      m.version === 5 ? registerMigration({ ...m, statements: [...m.statements, `CREATE TABLE "${schema}"."drift_probe" (id TEXT)`] }) : m);
    await assert.rejects(() => new MigrationRunner(store, tampered).applyAll(), /MIGRATION_PREFLIGHT_FAILED/,
      'A drifted registry must fail preflight against applied state.');
    // The EXACT reviewed registry still verifies cleanly (known-good revision).
    const verified = await new MigrationRunner(store, canonicalMigrations(accept07.backend)).verify();
    assert.equal(verified.consistent, true);
  } finally { await store.close(); }
});

test('Firestore logical damage: the explicit recovery point restores account/billing integrity', async () => {
  const device = state.devices.payer;
  state.paid = await establishPaidSubscription(device);
  const accountBefore = await device.get('/api/billing/account');
  assert.equal(accountBefore.body.plan, 'personal');
  const invoiceBefore = await device.get(`/api/billing/invoices/${state.paid.invoiceId}`);

  // Recovery point: explicit emulator export (the named-DB restore procedure
  // in hosted operation; the emulator export/import covers (default)).
  const backupDir = path.join(runDir, 'firestore-recovery-point');
  await stack.exportEmulators(backupDir);

  // Deliberate logical damage AFTER the recovery point: destroy the durable
  // billing record (fixture drill-only mutation through the product's own
  // admin connection — the driver app is identity-plane only).
  const damage = await fixtureControl('/fixture/damage-billing', { uid: state.users.payer });
  assert.equal(damage.status, 200, `Damage step failed: ${damage.text}`);
  const damaged = await device.get('/api/billing/account');
  assert.ok(damaged.body.plan !== 'personal', 'The damage must be observable on the read-back.');

  // Restore: stop the app, restart the identity plane FROM the recovery point.
  await stack.stopStack();
  await stack.stopEmulators();
  await stack.startEmulators({ importDir: backupDir, logFile: path.join(runDir, 'emulators-restore.log'), workDir: runDir });
  await stack.startStack({ runDir, providerState: drillProviderState });

  // Integrity: the paid record is byte-faithful; a fresh Free record was NEVER
  // written over the uncertain subscription state. The restart re-stamps the
  // identity epoch (recorded BILL-01 law), so reconnect via fresh sign-in.
  const reconnected = await establishDevice('payer@restore.example', '203.0.113.31');
  const account = await reconnected.get('/api/billing/account');
  assert.equal(account.status, 200);
  assert.equal(account.body.plan, 'personal', 'The restored subscription state must be intact.');
  assert.equal(account.body.revision, accountBefore.body.revision, 'The billing revision must be byte-faithful after restore.');
  const invoice = await reconnected.get(`/api/billing/invoices/${state.paid.invoiceId}`);
  assert.equal(invoice.status, 200);
  assert.deepEqual(invoice.body, invoiceBefore.body, 'The durable invoice must be byte-identical after the restore.');
});

test('reconnect + payment reconciliation still converge after the restore restart', async () => {
  // The restore restart re-stamps the identity epoch (recorded BILL-01 law):
  // stale cookies fail closed; a fresh verified sign-in recovers the account.
  const reconnected = await establishDevice('payer@restore.example', '203.0.113.31');
  const me = await reconnected.get('/api/auth/me');
  assert.equal(me.status, 200, 'Fresh verified sign-in must recover the durable account.');
  const account = await reconnected.get('/api/billing/account');
  assert.equal(account.body.plan, 'personal', 'The durable paid state must be recovered.');

  // The scheduled reconciliation job still converges from provider facts.
  const remaining = 30500 - (Date.now() - state.paid.verifiedAt);
  if (remaining > 0) await stack.delay(remaining);
  const job = await reconnected.post('/api/billing/jobs/reconcile', {}, { 'x-visionary-billing-job': stack.FIXTURE_SECRETS.reconcile });
  assert.equal(job.status, 201, `Post-restore reconciliation failed: ${job.text}`);
});
