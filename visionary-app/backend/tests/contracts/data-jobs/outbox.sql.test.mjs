import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import fixture from '../data-01/postgres-fixture.cjs';
import roles from '../data-02/postgres-fixture.cjs';

const { WorkspaceRepository } = fixture.req('./dist/src/workspaces/workspace.repository.js');
const { canonicalMigrations } = fixture.req('./dist/src/data/migration-registry.js');
const { PostgresOutboxDeliveryStore } = fixture.req('./dist/src/outbox/postgres-outbox.store.js');
const { createConsentRevocationDispatcher } = fixture.req('./dist/src/outbox/cloud-tasks-outbox.delivery.js');
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

test('the worker SQL identity refuses delegated schema ownership and migration-ledger writes', async t => {
  const env = await roles.stagingDatabase();
  t.after(() => env.close());
  const { admin, db, runtime, runtimeRole, migrationRole, schema } = env;
  const expected = { role: runtimeRole, schema, database: new URL(env.config.runtimeUrl).pathname.slice(1) };
  await db.$executeRaw`CREATE TABLE "_visionary_migrations" (version integer)`;
  await WorkspaceRepository.assertRuntimeIdentity(runtime, expected);
  await assert.rejects(WorkspaceRepository.assertRuntimeIdentity(runtime, { ...expected, role: migrationRole }), /identity/);
  await admin.$executeRawUnsafe(`GRANT "${migrationRole}" TO "${runtimeRole}"`);
  await assert.rejects(WorkspaceRepository.assertRuntimeIdentity(runtime, expected), /identity/);
  await admin.$executeRawUnsafe(`REVOKE "${migrationRole}" FROM "${runtimeRole}"`);
  await admin.$executeRawUnsafe(`GRANT UPDATE ON "${schema}"."_visionary_migrations" TO "${runtimeRole}"`);
  await assert.rejects(WorkspaceRepository.assertRuntimeIdentity(runtime, expected), /identity/);
});

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

test('a dispatcher SQL role can lease and retry an event but cannot forge completion', async t => {
  const env = await roles.stagingDatabase();
  t.after(() => env.close());
  const { db, runtime, runtimeRole, schema } = env;
  for (const migration of canonicalMigrations(fixture.backend)) {
    for (const statement of migration.statements) await db.$executeRawUnsafe(statement);
  }
  const repo = new WorkspaceRepository(db);
  const uid = 'synthetic-dispatcher-owner';
  await repo.ensurePerson(uid);
  const grant = await db.consentGrant.create({
    data: { uid, purpose: 'model_context', version: 'v1', consentVersion: 'v1' },
  });
  await repo.revokeConsent(uid, grant.id);
  const event = await db.outboxEvent.findFirstOrThrow({ where: { topic: 'consent.revoked' } });
  await db.$executeRawUnsafe(`GRANT SELECT ON "${schema}".outbox_events, "${schema}".outbox_deliveries TO "${runtimeRole}"`);
  await db.$executeRawUnsafe(`GRANT INSERT (cursor, "availableAt"), UPDATE (status, attempts, "availableAt", "claimedAt", "lastError")
    ON "${schema}".outbox_deliveries TO "${runtimeRole}"`);
  await WorkspaceRepository.assertRuntimeIdentity(runtime, { role: runtimeRole, schema, database: new URL(env.config.runtimeUrl).pathname.slice(1) });

  const store = new PostgresOutboxDeliveryStore(runtime, 0n);
  const [claim] = await store.claimDueOutbox(1, new Date(), 2, 90_000);
  assert.equal(claim.cursor, event.cursor);
  await assert.rejects(runtime.$executeRaw`UPDATE outbox_deliveries SET status = 'DONE' WHERE cursor = ${event.cursor}`,
    /outbox_deliveries_completion_receipt_check/);
  await assert.rejects(runtime.$executeRaw`UPDATE outbox_deliveries SET status = 'DONE', "effectAppliedAt" = now() WHERE cursor = ${event.cursor}`,
    /permission denied/);
  assert.equal((await store.settleOutbox(event.cursor, claim.attempts, failed)).status, 'FAILED');
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
  const invoker = 'visionary-outbox-invoke-stg@visionary-research.iam.gserviceaccount.com';
  const config = { environment: 'staging', workerOrigin: worker, afterCursor: 0n,
    invokerServiceAccount: invoker, accessToken: async () => 'synthetic-access-token' };
  assert.throws(() => createConsentRevocationDispatcher(db, { ...config, workerOrigin: 'https://canary---synthetic-worker.run.app' }),
    /canonical Cloud Run worker origin/);
  assert.throws(() => createConsentRevocationDispatcher(db, { ...config, environment: 'production' }),
    /scoped to the delivery environment/);
  const admitted = [];
  const queue = 'projects/visionary-research/locations/asia-south1/queues/visionary-consent-staging';
  const statuses = [503, 409, 200];
  const fetcher = (url, options) => {
    assert.equal(url.href, `https://cloudtasks.googleapis.com/v2/${queue}/tasks`);
    assert.equal(options.redirect, 'error');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer synthetic-access-token');
    const { task } = JSON.parse(options.body);
    const { body, ...request } = task.httpRequest;
    assert.deepEqual(request, {
      httpMethod: 'POST', url: `${worker}/internal/outbox/consent-revocations`,
      headers: { 'Content-Type': 'application/json' },
      oidcToken: { serviceAccountEmail: invoker, audience: worker },
    });
    assert.equal(task.name.slice(0, task.name.lastIndexOf('/')), `${queue}/tasks`);
    assert.match(task.name.split('/').at(-1), /^[a-f0-9]{64}$/);
    assert.equal(task.dispatchDeadline, '20s');
    admitted.push({ name: task.name, payload: JSON.parse(Buffer.from(body, 'base64').toString()) });
    return Promise.resolve(new Response(null, { status: statuses.shift() }));
  };
  const dispatcher = createConsentRevocationDispatcher(db, config, fetcher);
  const started = Date.now();
  const tick = delay => new Date(started + delay);
  assert.deepEqual(await dispatcher.dispatch(1, tick(0)), [{ cursor: event.cursor, status: 'PENDING', delivered: false }]);
  assert.equal((await db.consentJob.findUniqueOrThrow({ where: { id: job.id } })).state, 'PENDING');
  const send = data => fetch(local, { method: 'POST',
    headers: { Authorization: 'Bearer synthetic.claim.signature', 'Content-Type': 'application/json' },
    body: JSON.stringify(data) });
  assert.equal((await send(admitted[0].payload)).status, 401);
  authorized = true;
  assert.equal((await send({ ...admitted[0].payload, uid })).status, 400);
  assert.equal((await send(admitted[0].payload)).status, 409);
  assert.deepEqual(await dispatcher.dispatch(1, tick(199)), []);
  const awaiting = [{ cursor: event.cursor, status: 'DISPATCHED', delivered: false }];
  assert.deepEqual(await dispatcher.dispatch(1, tick(200)), awaiting);
  assert.equal((await db.outboxDelivery.findUniqueOrThrow({ where: { cursor: event.cursor } })).effectAppliedAt, null);
  assert.deepEqual(await dispatcher.dispatch(1, tick(90_199)), []);
  assert.deepEqual(await dispatcher.dispatch(1, tick(90_200)), awaiting);
  assert.equal((await db.consentJob.findUniqueOrThrow({ where: { id: job.id } })).state, 'PENDING');
  assert.equal(new Set(admitted.map(task => task.name)).size, 3);
  assert.equal((await send(admitted[1].payload)).status, 409);
  const sent = admitted[2].payload;
  assert.deepEqual(sent, { cursor: String(event.cursor), attempt: 3 });
  assert.equal((await send(sent)).status, 204);
  const saved = await db.outboxDelivery.findUniqueOrThrow({ where: { cursor: event.cursor } });
  assert.ok(saved.effectAppliedAt);
  assert.equal((await db.consentJob.findUniqueOrThrow({ where: { id: job.id } })).state, 'CANCELLED');
  assert.equal((await db.consentJob.findUniqueOrThrow({ where: { id: other.id } })).state, 'PENDING');
  assert.equal((await send(sent)).status, 204);
  assert.deepEqual(await db.outboxDelivery.findUniqueOrThrow({ where: { cursor: event.cursor } }), saved);
  assert.deepEqual(await dispatcher.dispatch(1, tick(180_201)), []);
});
