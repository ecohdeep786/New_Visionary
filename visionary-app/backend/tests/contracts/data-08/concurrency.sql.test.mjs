import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fixture from '../data-02/postgres-fixture.cjs';
const { req, backend, stagingDatabase } = fixture;
const { MigrationRunner } = req('./dist/src/data/migration-runner.js');
const { canonicalMigrations } = req('./dist/src/data/migration-registry.js');
const { WorkspaceRepository } = req('./dist/src/workspaces/workspace.repository.js');
const { WorkspaceMetadataCommands } = req('./dist/src/commands/workspace-metadata.commands.js');
const { verifyPostgresConnectionBudget } = req('./dist/src/concurrency/connection-budget.js');
const { PrismaClient } = req('@prisma/client');
let f, second, target, a, b; const children = [], extraRoles = [];
async function deadline(promise, label, milliseconds = 2000) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(Error(label + ' deadline')), milliseconds);
  })]); } finally { clearTimeout(timer); }
}
async function closeWorker(child) {
  if (child.exitCode !== null) return;
  const exited = new Promise(ok => child.once('exit', ok));
  try {
    if (child.connected) child.send('close');
    await deadline(exited, 'Worker shutdown');
  } finally {
    if (child.exitCode === null) { child.kill(); await deadline(exited, 'Worker termination'); }
  }
}
before(async () => {
  f = await stagingDatabase(); await new MigrationRunner(f.store(), canonicalMigrations(backend)).applyAll(); await f.grantRuntime();
  target = { role: f.runtimeRole, schema: f.schema, database: new URL(f.config.runtimeUrl).pathname.slice(1) };
  second = new PrismaClient({ datasources: { db: { url: f.config.runtimeUrl } } });
  a = WorkspaceRepository.forConsentRuntime(f.runtime, target); b = WorkspaceRepository.forConsentRuntime(second, target);
});
after(async () => {
  for (const child of children) {
    await closeWorker(child);
  }
  await second?.$disconnect();
  for (const role of extraRoles) await f.admin.$executeRawUnsafe('DROP ROLE "' + role + '"');
  if (f) await f.close();
});
async function setup() {
  const uid = 'owner_' + randomUUID().replaceAll('-', ''), other = 'other_' + randomUUID().replaceAll('-', '');
  await f.db.person.createMany({ data: [{ uid }, { uid: other }] });
  const w = await f.db.workspace.create({ data: { uid, name: 'Before', slug: randomUUID() } });
  return { uid, other, w };
}
const command = (x, rest = {}) => ({ commandId: randomUUID(), workspaceId: x.w.id, operation: 'workspace.metadata.rename', expectedRevision: 0, value: 'After', ...rest });
function holdSubjectLock(client) {
  let enter, release, intercepted = false;
  const entered = new Promise(ok => enter = ok), gate = new Promise(ok => release = ok);
  const hooked = new Proxy(client, { get(object, key) {
    if (key === '$transaction') return (operation, options) => object.$transaction(tx => operation(new Proxy(tx, { get(transaction, name) {
      const value = transaction[name];
      if (name === '$queryRaw') return async (...args) => {
        const result = await value.apply(transaction, args);
        if (!intercepted && String(args[0]).includes('FOR UPDATE')) { intercepted = true; enter(); await gate; }
        return result;
      };
      return typeof value === 'function' ? value.bind(transaction) : value;
    } })), options);
    const value = object[key]; return typeof value === 'function' ? value.bind(object) : value;
  } });
  return { hooked, entered, release };
}
async function waitForDatabaseLock() {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    const [row] = await f.admin.$queryRawUnsafe(`SELECT count(*)::integer AS n FROM pg_stat_activity WHERE usename=$1 AND wait_event_type='Lock'`, f.runtimeRole);
    if (row.n > 0) return;
    await new Promise(ok => setTimeout(ok, 10));
  }
  throw Error('Actual SQL lock waiter was not observed');
}

test('real simultaneous grants deduplicate canonical receipt; revoked version cannot race back to active', async () => {
  const x = await setup();
  const [one, two] = await Promise.all([a.grantAccountConsent(x.uid, 'downloads', 'v1', 600), b.grantAccountConsent(x.uid, 'downloads', 'v1', 600)]);
  assert.equal(one.id, two.id);
  assert.equal(await f.db.consentGrant.count({ where: { uid: x.uid } }), 1);
  assert.equal(await f.db.auditEvent.count({ where: { uid: x.uid, operation: 'consent.granted' } }), 1);
  assert.equal(await f.db.outboxEvent.count({ where: { uid: x.uid } }), 1);
  const held = holdSubjectLock(f.runtime), revoker = WorkspaceRepository.forConsentRuntime(held.hooked, target);
  const revocation = revoker.revokeConsent(x.uid, one.id); void revocation.catch(() => {});
  let observed;
  try {
    await deadline(held.entered, 'Revocation row lock');
    observed = b.grantAccountConsent(x.uid, 'downloads', 'v1', 600).catch(error => error);
    await waitForDatabaseLock();
  } finally { held.release(); await revocation; }
  assert.match((await observed).message, /closed consent/);
  assert.ok((await f.db.consentGrant.findUnique({ where: { id: one.id } })).revokedAt);
  assert.equal(await f.db.auditEvent.count({ where: { uid: x.uid, operation: 'consent.revoked' } }), 1);
  assert.equal(await f.db.outboxEvent.count({ where: { uid: x.uid } }), 2);
});

test('revocation lock precedes queued delivery: denied callback performs no committed write', async () => {
  const x = await setup(), grant = await a.grantAccountConsent(x.uid, 'downloads', 'v1', 600);
  const held = holdSubjectLock(f.runtime), revoker = WorkspaceRepository.forConsentRuntime(held.hooked, target);
  const revocation = revoker.revokeConsent(x.uid, grant.id); void revocation.catch(() => {});
  let delivered = false, delivery;
  try {
    await deadline(held.entered, 'Revocation row lock');
    delivery = b.withConsentDelivery(x.uid, 'downloads', undefined, 'v1', async () => { delivered = true; }).catch(error => error);
    await waitForDatabaseLock();
  } finally { held.release(); await revocation; }
  assert.match((await delivery).message, /unavailable or revoked/); assert.equal(delivered, false);
});

test('actual wrong UID/workspace/member role and changed-account replay cannot commit metadata', async () => {
  const x = await setup(), c = command(x), writer = new WorkspaceMetadataCommands(f.runtime, target);
  await f.db.workspaceMembership.create({ data: { uid: x.other, workspaceId: x.w.id, role: 'ADMIN', source: 'direct' } });
  await assert.rejects(writer.execute(x.other, c), e => e.code === 'unauthorized');
  await assert.rejects(writer.execute(x.uid, { ...c, workspaceId: 'missing' }), e => e.code === 'unauthorized');
  await assert.rejects(a.revokeConsent(x.other, (await a.grantAccountConsent(x.uid, 'downloads', 'v1', 60)).id));
  const accountSwitch = await Promise.allSettled([writer.execute(x.uid, c), new WorkspaceMetadataCommands(second, target).execute(x.other, c)]);
  assert.equal(accountSwitch[0].status, 'fulfilled');
  assert.equal(accountSwitch[1].status, 'rejected'); assert.equal(accountSwitch[1].reason.code, 'unauthorized');
  await assert.rejects(writer.execute(x.other, c), e => e.code === 'unauthorized');
  await assert.rejects(writer.execute(x.uid, { ...c, value: 'Changed' }), e => e.code === 'conflict');
  assert.equal(await f.db.commandResult.count({ where: { workspaceId: x.w.id } }), 1);
});

test('two SQL connections race expected revision and duplicate command without double commit', async () => {
  const x = await setup(), one = new WorkspaceMetadataCommands(f.runtime, target), two = new WorkspaceMetadataCommands(second, target);
  const race = await Promise.allSettled([one.execute(x.uid, command(x, { value: 'A' })), two.execute(x.uid, command(x, { value: 'B' }))]);
  assert.equal(race.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(race.find(r => r.status === 'rejected').reason.code, 'stale_revision');
  const y = await setup(), c = command(y);
  const replay = await Promise.all([one.execute(y.uid, c), two.execute(y.uid, c)]);
  assert.equal(replay.filter(r => r.replayed).length, 1);
  for (const row of [x, y]) {
    assert.equal(await f.db.commandResult.count({ where: { workspaceId: row.w.id } }), 1);
    assert.equal(await f.db.auditEvent.count({ where: { workspaceId: row.w.id } }), 1);
    assert.equal(await f.db.outboxEvent.count({ where: { workspaceId: row.w.id } }), 1);
  }
});

test('real dropped SQL connection reconnects and replay preserves exactly one committed result', async () => {
  const x = await setup(), url = new URL(f.config.runtimeUrl); url.searchParams.set('connection_limit', '1');
  const client = new PrismaClient({ datasources: { db: { url: String(url) } } });
  try {
    const writer = new WorkspaceMetadataCommands(client, target), c = command(x);
    const first = await writer.execute(x.uid, c);
    const [before] = await client.$queryRawUnsafe('SELECT pg_backend_pid() AS pid');
    await f.admin.$queryRawUnsafe('SELECT pg_terminate_backend($1::integer)', before.pid);
    try { await client.$queryRawUnsafe('SELECT pg_backend_pid() AS pid'); }
    catch (error) { assert.ok(['P1017', 'P2010'].includes(error.code)); }
    // Retire the failed pool explicitly; never retry an ambiguous write as a
    // fresh command or assume a simulated drop proves actual TCP recovery.
    await client.$disconnect(); await client.$connect();
    const [after] = await client.$queryRawUnsafe('SELECT pg_backend_pid() AS pid');
    assert.notEqual(after.pid, before.pid);
    const replay = await writer.execute(x.uid, c); assert.equal(replay.replayed, true); assert.equal(replay.revision, first.revision);
    assert.equal(await f.db.commandResult.count({ where: { workspaceId: x.w.id } }), 1);
    assert.equal(await f.db.outboxEvent.count({ where: { workspaceId: x.w.id } }), 1);
  } finally { await client.$disconnect(); }
});

test('independent processes obey actual database role capacity; closing a pool restores admission', async () => {
  const role = 'data08_cap_' + randomUUID().replaceAll('-', '');
  await f.admin.$executeRawUnsafe('CREATE ROLE "' + role + '" LOGIN PASSWORD \'synthetic-cap-only\' CONNECTION LIMIT 3');
  extraRoles.push(role);
  const [server] = await f.admin.$queryRawUnsafe("SELECT current_setting('max_connections')::integer AS maximum");
  const plan = { databaseConnections: server.maximum, reservedConnections: 10, workloads: [
    { role, maxInstances: 3, revisionOverlap: 1, poolsPerInstance: [1], roleConnectionLimit: 3 },
  ] };
  assert.equal((await verifyPostgresConnectionBudget(f.admin, plan)).cappedConnections, 3);
  await assert.rejects(verifyPostgresConnectionBudget(f.admin, { ...plan, databaseConnections: server.maximum + 1 }), /DATABASE_CAPACITY_DRIFT/);
  await f.admin.$executeRawUnsafe('ALTER ROLE "' + role + '" CONNECTION LIMIT -1');
  await assert.rejects(verifyPostgresConnectionBudget(f.admin, plan), /ROLE_CAPACITY_DRIFT/);
  await f.admin.$executeRawUnsafe('ALTER ROLE "' + role + '" CONNECTION LIMIT 3');
  await f.admin.$executeRawUnsafe('ALTER ROLE "' + role + '" CREATEROLE');
  await assert.rejects(verifyPostgresConnectionBudget(f.admin, plan), /ROLE_CAPACITY_DRIFT/);
  await f.admin.$executeRawUnsafe('ALTER ROLE "' + role + '" NOCREATEROLE');
  await f.admin.$executeRawUnsafe('ALTER ROLE "' + role + '" REPLICATION');
  await assert.rejects(verifyPostgresConnectionBudget(f.admin, plan), /ROLE_CAPACITY_DRIFT/);
  await f.admin.$executeRawUnsafe('ALTER ROLE "' + role + '" NOREPLICATION');
  const url = new URL(f.config.runtimeUrl); url.username = role; url.password = 'synthetic-cap-only'; url.searchParams.set('schema', 'public'); url.searchParams.set('connection_limit', '1');
  const spawn = async () => {
    const child = fork(fileURLToPath(new URL('./connection-worker.cjs', import.meta.url)), { execArgv: [], windowsHide: true,
      env: { ...process.env, DATA08_WORKER_URL: String(url) }, stdio: ['ignore', 'ignore', 'pipe', 'ipc'] }); children.push(child);
    const result = await deadline(new Promise((ok, fail) => {
      child.once('message', ok); child.once('error', fail);
      child.once('exit', () => fail(Error('Worker exited before observation')));
    }), 'Worker observation', 10000);
    return { child, result };
  };
  const active = await Promise.all([spawn(), spawn(), spawn()]);
  for (const row of active) assert.equal(row.result.type, 'connected');
  const excess = await spawn(); assert.equal(excess.result.type, 'failed'); assert.equal(excess.result.roleLimit, true);
  await closeWorker(active[0].child);
  const recovered = await spawn(); assert.equal(recovered.result.type, 'connected');
  const [observed] = await f.admin.$queryRawUnsafe('SELECT count(*)::integer AS n FROM pg_stat_activity WHERE usename=$1', role);
  assert.equal(observed.n, 3);
});
