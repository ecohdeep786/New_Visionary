/**
 * FILE-03 — durable PostgreSQL download store (KAN-58 rework increment).
 *
 * The reviewer's synthetic probe (10583) paused a gateway read after its
 * grant check, committed a revocation, and the read still returned bytes and
 * OVERWROTE REVOKED with ACTIVE. The durable store closes that window with
 * lock-first transactions with fresh-time fences, proven against real PostgreSQL:
 *   - a read whose consume lands after a concurrent revoke is refused and
 *     the row stays REVOKED (no resurrection, no byte delivery),
 *   - a one-read token is consumed exactly once across concurrent requests,
 *   - updateGrant(activeOnly) can never overwrite REVOKED with ACTIVE,
 *   - export delivery is fenced the same way and stops non-owners,
 *   - expiry is judged by the database clock.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fixture from '../data-01/postgres-fixture.cjs';
const { req, backend, domainDatabase } = fixture;
const { PostgresDownloadStore } = req('./dist/src/file/download-store.sql.js');

let env, db, store;
const nowIso = () => new Date(Date.now() + 15 * 60 * 1000).toISOString();

function grant(overrides = {}) {
  return {
    id: `dl_${Math.random().toString(36).slice(2, 12)}`,
    ownerUid: 'owner-dl',
    objectId: 'obj_1',
    generation: 3,
    digest: 'a'.repeat(64),
    size: 1024,
    type: 'application/pdf',
    channel: 'gateway',
    state: 'ACTIVE',
    expiresAt: nowIso(),
    token: null,
    remainingReads: 3,
    revokedAt: null,
    lastReadAt: null,
    bytesDelivered: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

before(async () => {
  env = await domainDatabase();
  db = env.db;
  // Replay accepted history and the additive FILE-03 migration.
  await db.person.create({ data: { uid: 'owner-dl' } });
  await db.person.create({ data: { uid: 'member-dl' } });
  store = new PostgresDownloadStore(db);
});

after(async () => { if (env) await env.close(); });

test('default gateway issuance persists an Int32 read budget and delivers through the SQL store', async () => {
  const { DownloadGateway } = req('./dist/src/file/download.service.js');
  const gateway = new DownloadGateway(store, {async requireReady() {
    return {objectId:'default-ready',generation:1,digest:'b'.repeat(64),size:4,type:'application/octet-stream',bytes:Uint8Array.of(1,2,3,4)};
  }});
  const issued = await gateway.issueGrant({ownerUid:'owner-dl',objectId:'default-ready',generation:1,channel:'gateway'});
  assert.equal(issued.remainingReads,2147483647);
  assert.equal((await store.grant(issued.id)).remainingReads,2147483647);
  assert.equal((await gateway.read(issued.id,'owner-dl')).deliveredBytes,4);
  assert.equal((await store.grant(issued.id)).remainingReads,2147483646);
});

test('durable consume: an ACTIVE owned unexpired grant is consumed exactly once with accounting', async () => {
  const g = grant();
  await store.insert(g);
  const first = await store.consumeGrant(g.id, 'owner-dl', 512);
  assert.equal(first.ok, true);
  assert.equal(first.grant.remainingReads, 2);
  assert.equal(first.grant.bytesDelivered, 512);
  assert.ok(first.grant.lastReadAt);
  const row = await store.grant(g.id);
  assert.equal(row.remainingReads, 2);
});

test('review 10583 fence: a read that lands after a concurrent revoke is refused and the row stays REVOKED', async () => {
  const g = grant();
  await store.insert(g);
  // The gateway read resolves the grant (still ACTIVE here) and resolves the
  // object; the revocation commits before the consume statement lands.
  const observed = await store.grant(g.id); // the "paused" read's grant check
  assert.equal(observed.state, 'ACTIVE');
  const revoke = await store.updateGrant(g.id, 'owner-dl', { state: 'REVOKED', revokedAt: new Date().toISOString() }, true);
  assert.equal(revoke.ok, true);
  // The paused read now tries to consume: refused, nothing overwritten.
  const consume = await store.consumeGrant(g.id, 'owner-dl', 1024);
  assert.deepEqual(consume, { ok: false, reason: 'revoked' });
  const row = await store.grant(g.id);
  assert.equal(row.state, 'REVOKED', 'REVOKED was not overwritten');
  assert.equal(row.bytesDelivered, 0, 'no bytes were delivered after revocation');
  assert.equal(row.remainingReads, 3, 'no read was consumed after revocation');
});

test('one-read token: concurrent consumes admit exactly one request', async () => {
  const g = grant({ remainingReads: 1 });
  await store.insert(g);
  const results = await Promise.all([
    store.consumeGrant(g.id, 'owner-dl', 1024),
    store.consumeGrant(g.id, 'owner-dl', 1024),
  ]);
  const ok = results.filter((r) => r.ok);
  const denied = results.filter((r) => !r.ok);
  assert.equal(ok.length, 1, 'exactly one concurrent read consumed the token');
  assert.equal(denied.length, 1);
  assert.equal(denied[0].reason, 'used');
  const row = await store.grant(g.id);
  assert.equal(row.state, 'USED');
  assert.equal(row.remainingReads, 0);
  assert.equal(row.bytesDelivered, 1024, 'accounting counted the single delivery once');
});

test('updateGrant(activeOnly) can never overwrite REVOKED with ACTIVE', async () => {
  const g = grant();
  await store.insert(g);
  await store.updateGrant(g.id, 'owner-dl', { state: 'REVOKED', revokedAt: new Date().toISOString() }, true);
  const resurrect = await store.updateGrant(g.id, 'owner-dl', { state: 'ACTIVE' }, true);
  assert.equal(resurrect.ok, false);
  assert.equal(resurrect.reason, 'revoked');
  assert.equal((await store.grant(g.id)).state, 'REVOKED');
});

test('foreign owner is refused on every operation', async () => {
  const g = grant();
  await store.insert(g);
  assert.deepEqual(await store.consumeGrant(g.id, 'member-dl', 1024), { ok: false, reason: 'unauthorized' });
  assert.deepEqual(await store.updateGrant(g.id, 'member-dl', { state: 'REVOKED' }, true), { ok: false, reason: 'unauthorized' });
  const row = await store.grant(g.id);
  assert.equal(row.state, 'ACTIVE', 'a non-owner cannot mutate the grant');
});

test('expiry is judged by the database clock', async () => {
  const g = grant({ expiresAt: new Date(Date.now() - 1000).toISOString() });
  await store.insert(g);
  assert.deepEqual(await store.consumeGrant(g.id, 'owner-dl', 1024), { ok: false, reason: 'expired' });
  const expired = await store.activeExpired(new Date().toISOString());
  assert.equal(expired.some((x) => x.id === g.id), true, 'the sweep sees the expired grant');
});

test('export delivery: fenced by state and owner, accounting in one statement', async () => {
  const record = {
    id: `exp_${Math.random().toString(36).slice(2, 12)}`,
    ownerUid: 'owner-dl',
    objects: [{ objectId: 'obj_1', generation: 3, digest: 'a'.repeat(64), size: 1024, type: 'application/pdf' }],
    state: 'ACTIVE',
    expiresAt: nowIso(),
    createdAt: new Date().toISOString(),
    deliveredBytes: 0,
  };
  await store.insertExport(record);
  const first = await store.recordExportDelivery(record.id, 'owner-dl', 1024);
  assert.equal(first.ok, true);
  assert.equal(first.record.deliveredBytes, 1024);
  assert.deepEqual(await store.recordExportDelivery(record.id, 'member-dl', 1024), { ok: false, reason: 'unauthorized' });
  await store.updateExport(record.id, 'owner-dl', { state: 'REVOKED' }, true);
  assert.deepEqual(await store.recordExportDelivery(record.id, 'owner-dl', 1024), { ok: false, reason: 'revoked' });
  assert.equal((await store.exportById(record.id)).deliveredBytes, 1024, 'the refused delivery wrote nothing');
});
for (const kind of ['grant', 'export']) test(`actual SQL ${kind} lease expires during an unchanged-row lock wait`, async () => {
  const row = kind === 'grant' ? grant({ expiresAt: new Date(Date.now() + 600).toISOString() }) : {
    id: 'export_wait_' + Math.random().toString(36).slice(2), ownerUid: 'owner-dl', objects: [], state: 'ACTIVE',
    expiresAt: new Date(Date.now() + 600).toISOString(), createdAt: new Date().toISOString(), deliveredBytes: 0,
  };
  if (kind === 'grant') await store.insert(row); else await store.insertExport(row);
  let release, locked, attempted;
  const gate = new Promise(r => { release = r; }), ready = new Promise(r => { locked = r; }), reached = new Promise(r => { attempted = r; });
  const table = kind === 'grant' ? 'download_grants' : 'download_exports';
  const blocker = db.$transaction(async tx => {
    await tx.$queryRawUnsafe('SELECT "id" FROM "' + table + '" WHERE "id"=$1 FOR UPDATE', row.id);
    locked(); await gate;
  });
  let delivery;
  try {
    await ready;
    const observed = { $transaction: action => db.$transaction(tx => action(new Proxy(tx, { get(target, key) {
      if (key === '$queryRaw') return (strings, ...values) => { attempted(); return target.$queryRaw(strings, ...values); };
      const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
    } }))) };
    const gateway = new PostgresDownloadStore(observed);
    delivery = kind === 'grant' ? gateway.consumeGrant(row.id, row.ownerUid, 4) : gateway.recordExportDelivery(row.id, row.ownerUid, 4);
    await reached; await db.$queryRaw`SELECT 1 AS waited FROM pg_sleep(0.8)`; release(); await blocker;
    assert.deepEqual(await delivery, { ok: false, reason: 'expired' });
    const saved = kind === 'grant' ? await store.grant(row.id) : await store.exportById(row.id);
    assert.equal(kind === 'grant' ? saved.bytesDelivered : saved.deliveredBytes, 0);
  } finally { release(); await blocker; if (delivery) await delivery; }
});
