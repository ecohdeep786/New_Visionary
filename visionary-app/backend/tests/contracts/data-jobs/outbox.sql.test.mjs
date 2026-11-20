import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import fixture from '../data-01/postgres-fixture.cjs';

const { WorkspaceRepository } = fixture.req('./dist/src/workspaces/workspace.repository.js');
const { canonicalMigrations } = fixture.req('./dist/src/data/migration-registry.js');
const { PostgresOutboxDeliveryStore } = fixture.req('./dist/src/outbox/postgres-outbox.store.js');
const { createConsentRevocationDispatcher } = fixture.req('./dist/src/outbox/cloud-run-outbox.delivery.js');
const { createConsentRevocationServer } = fixture.req('./dist/src/outbox/consent-revocation.http.js');
const { enqueueConsentJob } = fixture.req('./dist/src/outbox/consent-jobs.js');
const at = ms => new Date(Date.UTC(2026, 10, 20) + ms);
const failed = { status: 'FAILED', nextAttemptAt: null, lastError: 'DELIVERY_FAILED' };

async function isolatedDatabase(t) {
  const env = await fixture.domainDatabase();
  t.after(() => env.close());
  for (const migration of canonicalMigrations(fixture.backend).slice(5)) {
    for (const statement of migration.statements) await env.db.$executeRawUnsafe(statement);
  }
  return env;
}

test('owning SQL store preserves replay scope, 64-bit cursors and exclusive claims across clients', async t => {
  const { db, url } = await isolatedDatabase(t);
  const owner = 'synthetic-owner';
  await new WorkspaceRepository(db).ensurePerson(owner);
  const write = (topic, cursor) => db.outboxEvent.create({ data: { uid: owner, topic, cursor, payload: {} } });
  const checkpoint = 9007199254740993n;
  await write('consent.revoked', checkpoint);
  await write('unrelated.event', checkpoint + 1n);
  const event = await write('consent.revoked', checkpoint + 2n);
  const singleConnection = new URL(url);
  singleConnection.searchParams.set('connection_limit', '1');
  const firstClient = fixture.client(singleConnection);
  const peer = fixture.client(singleConnection);
  t.after(() => Promise.all([firstClient.$disconnect(), peer.$disconnect()]));
  await firstClient.$queryRaw`SELECT set_config('TimeZone', 'Asia/Kolkata', false)`;
  await peer.$queryRaw`SELECT set_config('TimeZone', 'UTC', false)`;
  const first = new PostgresOutboxDeliveryStore(firstClient, checkpoint);
  const second = new PostgresOutboxDeliveryStore(peer, checkpoint);

  const claims = (await Promise.all([
    first.claimDueOutbox(1, at(0), 2, 500), second.claimDueOutbox(1, at(0), 2, 500),
  ])).flat();
  assert.deepEqual(claims.map(row => row.cursor), [event.cursor]);
  assert.equal(claims[0].dispatchedAt, at(0).toISOString());
  assert.equal(claims[0].nextAttemptAt, at(500).toISOString());
  assert.equal(await first.outboxByCursor(checkpoint), null);
  await assert.rejects(first.outboxByCursor(Number(checkpoint)), /Invalid outbox cursor/);
  assert.equal(await db.outboxDelivery.count(), 1);
  assert.deepEqual(await second.claimDueOutbox(1, at(499), 2, 500), []);
  const [recovered] = await second.claimDueOutbox(1, at(500), 2, 500);
  assert.equal(recovered.attempts, 2);
  assert.equal(await first.settleOutbox(event.cursor, 1, failed), null);
  assert.equal(await second.settleOutbox(event.cursor, 2, { ...failed, status: 'DONE' }), null);
  assert.equal((await second.settleOutbox(event.cursor, 2, failed)).status, 'FAILED');
  assert.deepEqual(await first.claimDueOutbox(1, at(1000), 2, 500), []);
  assert.deepEqual(await db.outboxEvent.findUnique({ where: { id: event.id } }), event);
});

test('the receiver authenticates a committed revocation, cancels only its jobs and durably acknowledges once', async t => {
  const { db } = await isolatedDatabase(t);
  const repo = new WorkspaceRepository(db);
  const uid = 'synthetic-owner';
  await repo.ensurePerson(uid);
  const grant = await db.consentGrant.create({
    data: { uid, purpose: 'model_context', version: 'v1', consentVersion: 'v1' },
  });
  await db.consentGrant.create({
    data: { uid, purpose: 'downloads', version: 'v1', consentVersion: 'v1' },
  });
  const input = { id: randomUUID(), uid, workload: 'model_context', consentVersion: 'v1' };
  const job = await enqueueConsentJob(repo, input);
  assert.equal((await enqueueConsentJob(repo, input)).id, job.id);
  const other = await enqueueConsentJob(repo, { ...input, id: randomUUID(), workload: 'downloads' });
  await repo.revokeConsent(uid, grant.id);
  const event = await db.outboxEvent.findFirstOrThrow({ where: { topic: 'consent.revoked' } });
  await assert.rejects(enqueueConsentJob(repo, { ...input, id: randomUUID() }), /revoked/);

  let authorized = false;
  const server = createConsentRevocationServer(db, async token => authorized && token === 'synthetic.claim.signature');
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const worker = 'https://synthetic-worker.run.app';
  const local = `http://127.0.0.1:${server.address().port}/internal/outbox/consent-revocations`;
  let sent;
  assert.throws(() => createConsentRevocationDispatcher(db, 'https://canary---synthetic-worker.run.app', 0n),
    /canonical Cloud Run worker origin/);
  const fetcher = (url, options) => {
    assert.equal(options.redirect, 'error');
    if (url.hostname === 'metadata.google.internal') {
      assert.equal(url.searchParams.get('audience'), worker);
      assert.equal(options.headers['Metadata-Flavor'], 'Google');
      return Promise.resolve(new Response('synthetic.claim.signature', { headers: { 'Metadata-Flavor': 'Google' } }));
    }
    assert.equal(url.origin, worker);
    sent = JSON.parse(options.body);
    return fetch(`http://127.0.0.1:${server.address().port}${url.pathname}`, options);
  };
  const dispatcher = createConsentRevocationDispatcher(db, worker, 0n, fetcher);
  const started = Date.now();
  const tick = delay => new Date(started + delay);
  assert.deepEqual(await dispatcher.dispatch(1, tick(0)), [{ cursor: event.cursor, status: 'PENDING', delivered: false }]);
  assert.equal((await db.consentJob.findUniqueOrThrow({ where: { id: job.id } })).state, 'PENDING');
  authorized = true;
  const send = data => fetch(local, { method: 'POST',
    headers: { Authorization: 'Bearer synthetic.claim.signature', 'Content-Type': 'application/json' },
    body: JSON.stringify(data) });
  assert.equal((await send({ ...sent, uid })).status, 400);
  assert.equal((await send(sent)).status, 409);
  assert.deepEqual(await dispatcher.dispatch(1, tick(199)), []);
  assert.deepEqual(await dispatcher.dispatch(1, tick(200)), [{ cursor: event.cursor, status: 'DONE', delivered: true }]);
  assert.deepEqual(sent, { cursor: String(event.cursor), attempt: 2 });
  const saved = await db.outboxDelivery.findUniqueOrThrow({ where: { cursor: event.cursor } });
  assert.ok(saved.effectAppliedAt);
  assert.equal((await db.consentJob.findUniqueOrThrow({ where: { id: job.id } })).state, 'CANCELLED');
  assert.equal((await db.consentJob.findUniqueOrThrow({ where: { id: other.id } })).state, 'PENDING');
  assert.equal((await send(sent)).status, 204);
  assert.deepEqual(await db.outboxDelivery.findUniqueOrThrow({ where: { cursor: event.cursor } }), saved);
  assert.deepEqual(await dispatcher.dispatch(1, tick(60_000)), []);
});
