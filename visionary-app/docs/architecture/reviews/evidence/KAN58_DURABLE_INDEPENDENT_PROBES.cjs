// Exact-source independent KAN-58 probes. Uses only the approved local synthetic
// target and candidate's verified dependencies read-only. Never generates Prisma.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createRequire, Module } = require('node:module');
const { randomUUID, randomBytes } = require('node:crypto');
const source = 'adc1a4d872a57c491701ffe7a768246fc4923ea1';
const accepted = '65dee5af76d0ccaa3ee7d8bf52155b64108ac13c';
// Optional review-only mutation checks whether replacing CURRENT_TIMESTAMP
// alone repairs a conditional UPDATE that already evaluated before a lock wait.
// It changes no candidate file, dependency, Prisma schema or persistent source.
const wallClockOnly = process.argv.includes('--wall-clock-only');
const appRoot = path.resolve(__dirname, '../../../..');
const candidate = process.env.KAN58_REVIEW_BACKEND;
assert.ok(candidate && path.isAbsolute(candidate), 'Explicit reviewed dependency backend required');
const req = createRequire(path.join(candidate, 'package.json'));
const ts = req('typescript');
const { PrismaClient } = req('@prisma/client');
const git = (ref, file) => execFileSync('git', ['-C', appRoot, 'show', `${ref}:visionary-app/${file}`], { encoding: 'utf8' });
const lock = JSON.parse(git(source, 'backend/upstream/backend/package-lock.json'));
const installed = JSON.parse(fs.readFileSync(path.join(candidate, 'node_modules/.package-lock.json')));
let dependencyRecords = 0;
for (const [key, value] of Object.entries(lock.packages)) {
  if (!key || value.link) continue;
  if (value.optional && ((value.os && !value.os.includes(process.platform)) || (value.cpu && !value.cpu.includes(process.arch)))) continue;
  assert.equal(installed.packages[key]?.version, value.version, `Dependency version mismatch: ${key}`);
  if (value.integrity) assert.equal(installed.packages[key]?.integrity, value.integrity, `Dependency integrity mismatch: ${key}`);
  assert.ok(fs.existsSync(path.join(candidate, key, 'package.json')), `Missing installed manifest: ${key}`);
  dependencyRecords++;
}
const normalize = value => value.replace(/\/\/[^\n]*/g, '').replace(/\s+/g, '');
assert.equal(normalize(fs.readFileSync(path.join(candidate, 'node_modules/.prisma/client/schema.prisma'), 'utf8')),
  normalize(git(source, 'backend/upstream/backend/prisma/schema.prisma')), 'Generated Prisma model mismatch');

const modules = new Map();
function exact(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const filename = path.join(candidate, file);
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  modules.set(file, mod);
  mod.require = id => id.startsWith('.') ? exact(path.posix.normalize(path.posix.join(path.posix.dirname(file), id)) + '.ts') : req(id);
  let input = git(source, `backend/upstream/backend/${file}`);
  if (wallClockOnly && file === 'src/file/download-store.sql.ts') {
    assert.ok(input.includes('CURRENT_TIMESTAMP AT TIME ZONE'));
    input = input.replace('CURRENT_TIMESTAMP AT TIME ZONE', 'clock_timestamp() AT TIME ZONE');
  }
  mod._compile(ts.transpileModule(input, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText, filename);
  return mod.exports;
}
const { MigrationRunner } = exact('src/data/migration-runner.ts');
const { PostgresMigrationStore } = exact('src/data/migration-store.ts');
const { registerMigration, splitSql } = exact('src/data/migration-registry.ts');
const { PostgresDownloadStore } = exact('src/file/download-store.sql.ts');
const { DownloadGateway, ExportService } = exact('src/file/download.service.ts');
const cfg = JSON.parse(fs.readFileSync(process.env.KAN58_REVIEW_TARGET, 'utf8'));
const base = new URL(cfg.url);
assert.equal(cfg.syntheticOnly, true);
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname));
assert.equal(Number(base.port), 55437);
assert.match(base.pathname, /^\/visionary_data_test(?:_|$)/);
const connect = url => new PrismaClient({ datasources: { db: { url: String(url) } } });
const admin = connect(base);
const sqlFile = 'backend/upstream/backend/prisma/migrations/20261024000001_data_01_workspaces/migration.sql';
const registry = ref => [registerMigration({ version: 1, name: 'data-01-workspace-domain', requires: [],
  statements: splitSql(git(ref, sqlFile)), reversible: false })];
const fixtures = [];
async function fixture() {
  const suffix = randomUUID().replaceAll('-', '');
  const schema = 'qa58_' + suffix, migrationRole = 'qa58m_' + suffix, runtimeRole = 'qa58r_' + suffix;
  const password = randomBytes(24).toString('hex');
  await admin.$executeRawUnsafe(`CREATE ROLE "${migrationRole}" LOGIN PASSWORD '${password}'`);
  await admin.$executeRawUnsafe(`CREATE ROLE "${runtimeRole}" LOGIN PASSWORD '${password}'`);
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}" AUTHORIZATION "${migrationRole}"`);
  await admin.$executeRawUnsafe(`REVOKE ALL ON SCHEMA "${schema}" FROM PUBLIC`);
  await admin.$executeRawUnsafe(`GRANT USAGE ON SCHEMA "${schema}" TO "${runtimeRole}"`);
  const url = role => { const value = new URL(base); value.username = role; value.password = password;
    value.searchParams.set('schema', schema); value.searchParams.set('connection_limit', '3'); return String(value); };
  const config = { migrationRole, runtimeRole, schema, migrationUrl: url(migrationRole), runtimeUrl: url(runtimeRole) };
  const migration = new PostgresMigrationStore(config), db = connect(config.migrationUrl), runtime = connect(config.runtimeUrl), locker = connect(config.runtimeUrl);
  const f = { schema, migrationRole, runtimeRole, migration, db, runtime, locker, async grant() {
    await admin.$executeRawUnsafe(`GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA "${schema}" TO "${runtimeRole}"`);
    await admin.$executeRawUnsafe(`REVOKE ALL ON "${schema}"."_visionary_migrations" FROM "${runtimeRole}"`);
    const seqs = await admin.$queryRawUnsafe('SELECT sequencename FROM pg_sequences WHERE schemaname=$1 AND left(sequencename,11)<>\'_visionary_\'', schema);
    for (const row of seqs) await admin.$executeRawUnsafe(`GRANT USAGE,SELECT ON SEQUENCE "${schema}"."${row.sequencename}" TO "${runtimeRole}"`);
  }, async close() {
    await Promise.all([migration.close(), db.$disconnect(), runtime.$disconnect(), locker.$disconnect()]);
    assert.match(schema, /^qa58_[a-f0-9]{32}$/);
    await admin.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.$executeRawUnsafe(`DROP ROLE "${migrationRole}"`);
    await admin.$executeRawUnsafe(`DROP ROLE "${runtimeRole}"`);
  } };
  fixtures.push(f); return f;
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const report = (name, result) => console.log(JSON.stringify({ probe: name, ...result }));
const object = { objectId: 'synthetic_object', generation: 1, digest: 'a'.repeat(64), size: 4, type: 'text/plain', bytes: new Uint8Array([1, 2, 3, 4]) };
const resolver = { requireReady: async (uid, id, generation) => { assert.equal(uid, 'qa58_owner'); assert.equal(id, object.objectId); assert.equal(generation, 1); return object; } };
async function waitForSqlLock(f) {
  const end = Date.now() + 1500;
  while (Date.now() < end) {
    const rows = await admin.$queryRawUnsafe("SELECT count(*)::integer AS count FROM pg_stat_activity WHERE usename=$1 AND wait_event_type='Lock'", f.runtimeRole);
    if (rows[0].count > 0) return;
    await sleep(20);
  }
  throw new Error('Probe did not observe actual SQL lock wait');
}
async function delayedExpiry(f, store, kind) {
  const gateway = new DownloadGateway(store, resolver), exports = new ExportService(store, resolver);
  const row = kind === 'grant' ? await gateway.issueGrant({ ownerUid: 'qa58_owner', objectId: object.objectId, generation: 1, channel: 'gateway', maxReads: 3 })
    : await exports.createExport({ ownerUid: 'qa58_owner', objects: [{ objectId: object.objectId, generation: 1 }] });
  const expires = new Date(Date.now() + 2100);
  const table = kind === 'grant' ? 'download_grants' : 'download_exports';
  await f.db.$executeRawUnsafe(`UPDATE "${table}" SET "expiresAt"=$1 WHERE "id"=$2`, expires, row.id);
  let ready, release;
  const locked = new Promise(resolve => { ready = resolve; }), unlock = new Promise(resolve => { release = resolve; });
  const blocker = f.locker.$transaction(async tx => { await tx.$queryRawUnsafe(`SELECT "id" FROM "${table}" WHERE "id"=$1 FOR UPDATE`, row.id); ready(); await unlock; }, { timeout: 8000 });
  await Promise.race([locked, blocker.then(() => { throw Error('Blocker finished before lock'); })]);
  const pending = kind === 'grant' ? store.consumeGrant(row.id, 'qa58_owner', 4) : store.recordExportDelivery(row.id, 'qa58_owner', 4);
  try {
    await Promise.race([waitForSqlLock(f), pending.then(() => { throw Error('Delivery did not wait for SQL lock'); })]);
    await sleep(Math.max(0, expires.getTime() + 200 - Date.now()));
  } finally { release(); await blocker; }
  const result = await pending;
  const [clock] = await f.db.$queryRawUnsafe('SELECT clock_timestamp() AS current');
  assert.ok(clock.current > expires);
  assert.equal(result.ok, true, 'Expected to reproduce stale SQL clock acceptance');
  report('expiry-after-lock-' + kind, { unsafeAccepted: result.ok, databaseNowAfterExpiry: true });
}

(async () => {
  try {
    report('dependencies', { verifiedInstalledRecords: dependencyRecords, generatedModelMatches: true, source,
      reviewMutation: wallClockOnly ? 'wall-clock-only' : null });
    if (wallClockOnly) {
      const f = await fixture();
      await new MigrationRunner(f.migration, registry(source)).applyAll(); await f.grant();
      await f.db.person.create({ data: { uid: 'qa58_owner' } });
      const store = new PostgresDownloadStore(f.runtime);
      await delayedExpiry(f, store, 'grant'); await delayedExpiry(f, store, 'export');
      report('wall-clock-only-mutation-complete', { repairInsufficient: true, acceptance: false });
      return;
    }
    const old = await fixture();
    await new MigrationRunner(old.migration, registry(accepted)).applyAll();
    await old.db.person.create({ data: { uid: 'qa58_retained' } });
    let migrationError;
    try { await new MigrationRunner(old.migration, registry(source)).applyAll(); } catch (error) { migrationError = error; }
    assert.match(migrationError?.message || '', /applied migration drift/);
    assert.equal((await old.db.person.findUnique({ where: { uid: 'qa58_retained' } })).uid, 'qa58_retained');
    const tables = await old.db.$queryRawUnsafe("SELECT count(*)::integer AS count FROM information_schema.tables WHERE table_schema=$1 AND table_name='download_grants'", old.schema);
    assert.equal(tables[0].count, 0);
    report('accepted-v1-upgrade', { blockedByAppliedMigrationDrift: true, retainedRecordPreserved: true, downloadTablesCreated: false });

    const f = await fixture();
    await new MigrationRunner(f.migration, registry(source)).applyAll();
    await f.grant();
    await f.db.person.create({ data: { uid: 'qa58_owner' } });
    const store = new PostgresDownloadStore(f.runtime), gateway = new DownloadGateway(store, resolver);
    let defaultError;
    try { await gateway.issueGrant({ ownerUid: 'qa58_owner', objectId: object.objectId, generation: 1, channel: 'gateway' }); } catch (error) { defaultError = error; }
    assert.ok(defaultError, 'Expected default gateway budget to exceed durable integer');
    assert.match(defaultError.message, /fit|integer|range|Int/i);
    report('default-gateway-grant', { issueFailed: true, errorCode: defaultError.code || defaultError.name, persistedGrantCount: await f.db.downloadGrant.count() });

    const positive = await gateway.issueGrant({ ownerUid: 'qa58_owner', objectId: object.objectId, generation: 1, channel: 'gateway', maxReads: 3 });
    assert.equal((await gateway.read(positive.id, 'qa58_owner')).deliveredBytes, 4);
    await gateway.revoke(positive.id, 'qa58_owner');
    await assert.rejects(gateway.read(positive.id, 'qa58_owner'), error => error.code === 'revoked');
    report('positive-then-completed-revoke', { ownedDeliveryPassed: true, readAfterCompletedRevokeDenied: true });
    await delayedExpiry(f, store, 'grant');
    await delayedExpiry(f, store, 'export');

    const consent = await f.db.consentGrant.create({ data: { uid: 'qa58_owner', purpose: 'private-download', resourceId: object.objectId, version: 'synthetic-v1', consentVersion: 'synthetic-v1' } });
    const consentResolver = { requireReady: async (...args) => { const current = await f.runtime.consentGrant.findUnique({ where: { id: consent.id } });
      if (current.revokedAt) throw new Error('Consent revoked'); return resolver.requireReady(...args); } };
    const g = await new DownloadGateway(store, consentResolver).issueGrant({ ownerUid: 'qa58_owner', objectId: object.objectId, generation: 1, channel: 'gateway', maxReads: 3 });
    let ready, release;
    const reached = new Promise(resolve => { ready = resolve; }), resume = new Promise(resolve => { release = resolve; });
    const delayed = new Proxy(store, { get(target, key) { if (key === 'consumeGrant') return async (...args) => { ready(); await resume; return target.consumeGrant(...args); };
      const value = target[key]; return typeof value === 'function' ? value.bind(target) : value; } });
    const read = new DownloadGateway(delayed, consentResolver).read(g.id, 'qa58_owner');
    await Promise.race([reached, read.then(() => { throw Error('Read did not reach consume boundary'); })]);
    await f.db.consentGrant.update({ where: { id: consent.id }, data: { revokedAt: new Date() } });
    release();
    const stale = await read;
    assert.equal(stale.deliveredBytes, 4);
    assert.ok((await f.db.consentGrant.findUnique({ where: { id: consent.id } })).revokedAt);
    report('consent-revoked-after-resolver', { actualConsentRevoked: true, bytesStillReturned: stale.bytes.byteLength, grantStillActive: (await store.grant(g.id)).state === 'ACTIVE' });
    report('complete', { unsafeOutcomesReproduced: 5, acceptance: false });
  } finally {
    for (const f of fixtures.reverse()) await f.close();
    await admin.$disconnect();
  }
})().catch(error => { console.error(JSON.stringify({ failure: error.code || error.name, detail: error instanceof assert.AssertionError ? error.message : 'Unexpected probe setup/runtime error; inspect privately' })); process.exitCode = 1; });
