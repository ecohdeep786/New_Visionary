import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import fixture from '../data-01/postgres-fixture.cjs';

const { WorkspaceRepository } = fixture.req('./dist/src/workspaces/workspace.repository.js');
const { canonicalMigrations } = fixture.req('./dist/src/data/migration-registry.js');
const { PostgresOutboxDeliveryStore } = fixture.req('./dist/src/outbox/postgres-outbox.store.js');
const { createConsentRevocationDispatcher } = fixture.req('./dist/src/outbox/cloud-run-outbox.delivery.js');
const at = ms => new Date(Date.UTC(2026, 10, 20) + ms);
const complete = { status: 'DONE', nextAttemptAt: null, lastError: null };

async function isolatedDatabase(t) {
  const env = await fixture.domainDatabase();
  t.after(() => env.close());
  for (const migration of canonicalMigrations(fixture.backend).slice(5)) {
    for (const statement of migration.statements) await env.db.$executeRawUnsafe(statement);
  }
  return env;
}

test('owning SQL store preserves replay scope, 64-bit cursors and exclusive claims across clients', async t => {
  const { db, client } = await isolatedDatabase(t);
  const owner = 'synthetic-owner';
  await new WorkspaceRepository(db).ensurePerson(owner);
  const write = (topic, cursor) => db.outboxEvent.create({ data: { uid: owner, topic, cursor, payload: {} } });
  const checkpoint = 9007199254740993n;
  await write('consent.revoked', checkpoint);
  await write('unrelated.event', checkpoint + 1n);
  const event = await write('consent.revoked', checkpoint + 2n);
  const peer = client();
  t.after(() => peer.$disconnect());
  const first = new PostgresOutboxDeliveryStore(db, checkpoint);
  const second = new PostgresOutboxDeliveryStore(peer, checkpoint);

  const claims = (await Promise.all([
    first.claimDueOutbox(1, at(0), 2, 500), second.claimDueOutbox(1, at(0), 2, 500),
  ])).flat();
  assert.deepEqual(claims.map(row => row.cursor), [event.cursor]);
  assert.equal(await first.outboxByCursor(checkpoint), null);
  assert.equal(await db.outboxDelivery.count(), 1);
  assert.deepEqual(await second.claimDueOutbox(1, at(499), 2, 500), []);
  const [recovered] = await second.claimDueOutbox(1, at(500), 2, 500);
  assert.equal(recovered.attempts, 2);
  assert.equal(await first.settleOutbox(event.cursor, 1, complete), null);
  assert.equal((await second.settleOutbox(event.cursor, 2, complete)).status, 'DONE');
  assert.deepEqual(await first.claimDueOutbox(1, at(1000), 2, 500), []);
  assert.deepEqual(await db.outboxEvent.findUnique({ where: { id: event.id } }), event);
});

test('a committed consent revocation is retried and acknowledged over authenticated HTTP', async t => {
  const { db } = await isolatedDatabase(t);
  const repo = new WorkspaceRepository(db);
  const uid = 'synthetic-owner';
  await repo.ensurePerson(uid);
  const grant = await db.consentGrant.create({
    data: { uid, purpose: 'synthetic-learning', version: 'v1', consentVersion: 'v1' },
  });
  await repo.revokeConsent(uid, grant.id);
  const event = await db.outboxEvent.findFirstOrThrow({ where: { topic: 'consent.revoked' } });

  let authorized = false;
  let accepted;
  const server = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    if (!authorized || request.headers.authorization !== 'Bearer synthetic.claim.signature') {
      response.writeHead(401).end();
      return;
    }
    accepted = { url: request.url, method: request.method, body: JSON.parse(body) };
    response.writeHead(204).end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const worker = 'https://synthetic-worker.run.app';
  const fetcher = (url, options) => {
    assert.equal(options.redirect, 'error');
    if (url.hostname === 'metadata.google.internal') {
      assert.equal(url.searchParams.get('audience'), worker);
      assert.equal(options.headers['Metadata-Flavor'], 'Google');
      return Promise.resolve(new Response('synthetic.claim.signature', { headers: { 'Metadata-Flavor': 'Google' } }));
    }
    assert.equal(url.origin, worker);
    return fetch(`http://127.0.0.1:${server.address().port}${url.pathname}`, options);
  };
  const dispatcher = createConsentRevocationDispatcher(db, worker, 0n, fetcher);
  assert.deepEqual(await dispatcher.dispatch(1, at(0)), [{ cursor: event.cursor, status: 'PENDING', delivered: false }]);
  assert.equal(accepted, undefined);
  authorized = true;
  assert.deepEqual(await dispatcher.dispatch(1, at(199)), []);
  assert.deepEqual(await dispatcher.dispatch(1, at(200)), [{ cursor: event.cursor, status: 'DONE', delivered: true }]);
  assert.deepEqual(accepted, {
    url: '/internal/outbox/consent-revocations', method: 'POST', body: { cursor: String(event.cursor) },
  });
  assert.deepEqual(await dispatcher.dispatch(1, at(60_000)), []);
});
