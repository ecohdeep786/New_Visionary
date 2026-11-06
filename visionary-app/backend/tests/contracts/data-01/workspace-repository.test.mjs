import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import fixture from './postgres-fixture.cjs';
const { WorkspaceRepository } = fixture.req('./dist/src/workspaces/workspace.repository.js');
let env, db, repo, ws;
const input = (suffix, extra = {}) => ({ name: 'Synthetic ' + suffix, slug: 'workspace-' + suffix, commandId: 'cmd-' + suffix, ...extra });
before(async () => { env = await fixture.domainDatabase(); db = env.db; repo = new WorkspaceRepository(db); });
after(async () => { if (env) await env.close(); });

test('actual repository atomically commits workspace, membership, immutable receipt, audit and outbox', async () => {
  ws = await repo.createWorkspace('owner', input('base'));
  assert.equal((await db.commandResult.findUnique({ where: { commandId: 'cmd-base' } })).workspaceId, ws.id);
  assert.equal(await db.workspaceMembership.count({ where: { workspaceId: ws.id, role: 'OWNER' } }), 1);
  assert.equal(await db.outboxEvent.count({ where: { workspaceId: ws.id } }), 1);
  assert.equal(await db.auditEvent.count({ where: { workspaceId: ws.id } }), 1);
});
test('actual repository rejects changed executed fields even with unchanged caller payload', async () => {
  assert.deepEqual(await repo.createWorkspace('owner', input('base')), ws);
  for (const change of [{ name: 'Changed' }, { slug: 'other' }, { description: 'Changed' }, { isPersonal: true }]) {
    await assert.rejects(repo.createWorkspace('owner', input('base', { ...change, payload: {} })), /changed payload/);
  }
  await assert.rejects(repo.createWorkspace('other', input('base')), /another account/);
  assert.equal(await db.outboxEvent.count({ where: { workspaceId: ws.id } }), 1);
});
test('first-ever concurrent UID provisioning retries produce one committed workspace', async () => {
  const results = await Promise.all(Array.from({ length: 4 }, () => repo.createWorkspace('first-use', input('concurrent'))));
  assert.equal(new Set(results.map((r) => r.id)).size, 1);
  assert.equal(await db.commandResult.count({ where: { uid: 'first-use' } }), 1);
});
test('actual repository translates slug conflicts without partial domain writes', async () => {
  await assert.rejects(repo.createWorkspace('different', input('base', { commandId: 'different-command' })), /already exists/);
  assert.equal(await db.workspace.count({ where: { uid: 'different' } }), 0);
  assert.equal(await db.commandResult.count({ where: { uid: 'different' } }), 0);
});
test('actual repository denies wrong ownership, unknown roles and forged OWNER membership', async () => {
  await assert.rejects(repo.assertOwnership(ws.id, 'different'), /permission/);
  await db.workspaceMembership.create({ data: { uid: 'different', workspaceId: ws.id, role: 'OWNER', source: 'synthetic-corruption' } });
  await assert.rejects(repo.assertMembership(ws.id, 'different', 'ADMIN'), /membership/);
  const corrupt = new WorkspaceRepository({ workspace: { findUnique: async () => ({ uid: 'owner' }) }, deletionTombstone: { findUnique: async () => null },
    workspaceMembership: { findUnique: async () => ({ role: 'UNKNOWN' }) } });
  await assert.rejects(corrupt.assertMembership(ws.id, 'different', 'ADMIN'), /membership/);
});
test('actual repository checks exact consent version, expiry and revocation', async () => {
  const grant = await db.consentGrant.create({ data: { uid: 'owner', purpose: 'synthetic-learning', version: 'policy-1', consentVersion: 'v1' } });
  await repo.assertConsent('owner', 'synthetic-learning', undefined, 'v1');
  await assert.rejects(repo.assertConsent(undefined, 'synthetic-learning', undefined, 'v1'), /subject/);
  await assert.rejects(repo.assertConsent('owner', 'synthetic-learning', undefined, 'v2'), /consent/);
  await assert.rejects(repo.assertConsent('owner', 'synthetic-learning'), /policy version/);
  await assert.rejects(repo.revokeConsent('different', grant.id), /unavailable/);
  await repo.assertConsent('owner', 'synthetic-learning', undefined, 'v1');
  const revocations = await Promise.all([repo.revokeConsent('owner', grant.id), repo.revokeConsent('owner', grant.id)]);
  assert.deepEqual(revocations[0], revocations[1]);
  assert.equal(await db.auditEvent.count({ where: { uid: 'owner', operation: 'consent.revoked', resourceId: grant.id } }), 1);
  const events = await db.outboxEvent.findMany({ where: { uid: 'owner', topic: 'consent.revoked' } });
  assert.deepEqual(events.map(event => event.payload), [{
    ...revocations[0], purpose: 'synthetic-learning', resourceId: null, consentVersion: 'v1',
  }]);
  await assert.rejects(repo.assertConsent('owner', 'synthetic-learning', undefined, 'v1'), /revoked/);
});
test('consent revocation closes only matching durable shares and publishes their scope', async () => {
  const uid = 'share-owner';
  const purpose = 'document_sharing';
  const consentVersion = 'share-policy-v1';
  await repo.ensurePerson(uid);
  const accountGrant = await repo.grantAccountConsent(uid, purpose, consentVersion, 600);
  const scopedGrant = await db.consentGrant.create({ data: {
    uid, purpose, version: consentVersion, consentVersion, resourceId: 'shared-one',
  } });
  const share = (fields = {}) => db.shareGrant.create({ data: {
    uid, grantedToUid: 'different', resourceType: 'document', resourceId: 'shared-one',
    purpose, consentVersion, scope: 'view', ...fields,
  } });
  const scopedShare = await share();
  const otherResource = await share({ resourceId: 'shared-two' });
  const otherPurpose = await share({ purpose: 'downloads' });
  const otherPolicy = await share({ consentVersion: 'share-policy-v2' });
  const otherOwner = await share({ uid: 'different', grantedToUid: 'owner' });
  const read = async (id) => (await db.shareGrant.findUniqueOrThrow({ where: { id } })).revokedAt?.toISOString();

  const unavailableOutbox = db.$extends({ query: { outboxEvent: {
    async create() { throw new Error('Synthetic outbox failure'); },
  } } });
  await assert.rejects(new WorkspaceRepository(unavailableOutbox).revokeConsent(uid, scopedGrant.id), /Synthetic outbox failure/);
  await repo.assertConsent(uid, purpose, 'shared-one', consentVersion);
  assert.equal(await read(scopedShare.id), undefined);

  const scoped = await repo.revokeConsent(uid, scopedGrant.id);
  assert.equal(await read(scopedShare.id), scoped.revokedAt);
  assert.equal(await read(otherResource.id), undefined);
  const account = await repo.revokeConsent(uid, accountGrant.id);
  assert.equal(await read(otherResource.id), account.revokedAt);
  assert.equal(await read(scopedShare.id), scoped.revokedAt);
  for (const unrelated of [otherOwner, otherPurpose, otherPolicy]) assert.equal(await read(unrelated.id), undefined);

  const events = await db.outboxEvent.findMany({ where: { uid, topic: 'consent.revoked' }, orderBy: { cursor: 'asc' } });
  assert.deepEqual(events.map(event => event.payload), [
    { ...scoped, purpose, resourceId: 'shared-one', consentVersion },
    { ...account, purpose, resourceId: null, consentVersion },
  ]);
});
test('account consent grants are durable, bounded and serialized by policy version', async () => {
  await assert.rejects(repo.grantAccountConsent('unknown-subject', 'downloads', 'v1', 60), /unavailable/);
  await assert.rejects(repo.grantAccountConsent('owner', 'downloads', 'v1', 0), /bounded expiry/);
  await db.consentGrant.create({ data: {
    uid: 'owner', purpose: 'model_context', version: 'v1', consentVersion: 'v1', grantedAt: new Date(Date.now() + 60_000),
  } });
  await assert.rejects(repo.grantAccountConsent('owner', 'model_context', 'v1', 60), /not yet effective/);
  await assert.rejects(repo.assertConsent('owner', 'model_context', undefined, 'v1'), /unavailable/);
  const [first, retry] = await Promise.all([
    repo.grantAccountConsent('owner', 'downloads', 'v1', 60),
    repo.grantAccountConsent('owner', 'downloads', 'v1', 60),
  ]);
  assert.deepEqual(first, retry);
  await repo.assertConsent('owner', 'downloads', undefined, 'v1');
  await assert.rejects(repo.assertConsent('owner', 'downloads', undefined, 'v2'), /consent/);
  assert.equal(await db.auditEvent.count({ where: { uid: 'owner', operation: 'consent.granted', resourceId: first.id } }), 1);
  assert.equal(await db.outboxEvent.count({ where: { uid: 'owner', topic: 'consent.granted' } }), 1);
  await repo.revokeConsent('owner', first.id);
  await assert.rejects(repo.grantAccountConsent('owner', 'downloads', 'v1', 60), /closed consent/);
  const next = await repo.grantAccountConsent('owner', 'downloads', 'priv-review-v2', 60);
  assert.notEqual(next.id, first.id);
  await repo.assertConsent('owner', 'downloads', undefined, 'priv-review-v2');
  await repo.ensurePerson('grant-erased');
  await repo.grantAccountConsent('grant-erased', 'downloads', 'v1', 60);
  await db.deletionTombstone.create({ data: { uid: 'grant-erased', resourceType: 'person', resourceId: 'grant-erased' } });
  await assert.rejects(repo.assertConsent('grant-erased', 'downloads', undefined, 'v1'), /unavailable/);
  await assert.rejects(repo.grantAccountConsent('grant-erased', 'downloads', 'v2', 60), /unavailable/);
});
// Observe an actual attempt to acquire the account lock, without replacing SQL.
function observeConsentLock(reached) {
  return new WorkspaceRepository({ $transaction: fn => db.$transaction(tx => fn(new Proxy(tx, {
    get(target, key) {
      if (key === '$queryRaw') return (strings, ...values) => {
        if (strings.join('').includes('FROM "persons"')) reached();
        return target.$queryRaw(strings, ...values);
      };
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  }))) });
}
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

test('a delivery waiting behind revocation cannot commit using earlier consent', async () => {
  const uid = 'delivery-revocation'; await repo.ensurePerson(uid);
  const grant = await repo.grantAccountConsent(uid, 'downloads', 'delivery-v1', 60);
  const locked = deferred(), release = deferred(), attempted = deferred();
  const revoking = db.$transaction(async tx => {
    await tx.person.update({ where: { uid }, data: { updatedAt: new Date() } });
    await tx.consentGrant.update({ where: { id: grant.id }, data: { revokedAt: new Date() } });
    locked.resolve(); await release.promise;
  });
  let delivery;
  try {
    await locked.promise;
    delivery = observeConsentLock(attempted.resolve).withConsentDelivery(uid, 'downloads', undefined, 'delivery-v1', tx =>
      tx.outboxEvent.create({ data: { uid, topic: 'synthetic.delivery', payload: {} } })).then(() => null, error => error);
    await attempted.promise; release.resolve(); await revoking;
    assert.match((await delivery).message, /revoked/);
    assert.equal(await db.outboxEvent.count({ where: { uid, topic: 'synthetic.delivery' } }), 0);
  } finally { release.resolve(); await revoking; if (delivery) await delivery; }
});

test('a consent lease that expires while waiting for the account lock denies delivery', async () => {
  const uid = 'delivery-expiry'; await repo.ensurePerson(uid);
  const grant = await repo.grantAccountConsent(uid, 'downloads', 'delivery-v1', 60);
  const locked = deferred(), release = deferred(), attempted = deferred();
  const blocker = db.$transaction(async tx => {
    await tx.person.update({ where: { uid }, data: { updatedAt: new Date() } });
    const [clock] = await tx.$queryRaw`SELECT clock_timestamp() AS now`;
    await tx.consentGrant.update({ where: { id: grant.id }, data: { expiresAt: new Date(clock.now.getTime() + 500) } });
    locked.resolve(); await release.promise;
  });
  let called = false, delivery;
  try {
    await locked.promise;
    delivery = observeConsentLock(attempted.resolve).withConsentDelivery(uid, 'downloads', undefined, 'delivery-v1', async () => { called = true; })
      .then(() => null, error => error);
    await attempted.promise;
    await db.$queryRaw`SELECT 1 AS waited FROM pg_sleep(0.7)`;
    release.resolve(); await blocker;
    assert.match((await delivery).message, /unavailable/); assert.equal(called, false);
  } finally { release.resolve(); await blocker; if (delivery) await delivery; }
});

test('an authorized owning-store commit precedes revocation and later delivery is denied', async () => {
  const uid = 'delivery-first'; await repo.ensurePerson(uid);
  const grant = await repo.grantAccountConsent(uid, 'downloads', 'delivery-v1', 60);
  const entered = deferred(), release = deferred(), attempted = deferred();
  const delivering = repo.withConsentDelivery(uid, 'downloads', undefined, 'delivery-v1', async tx => {
    const receipt = await tx.outboxEvent.create({ data: { uid, topic: 'synthetic.delivery', payload: {} } });
    entered.resolve(); await release.promise; return receipt.id;
  });
  let revoking;
  try {
    await entered.promise;
    revoking = observeConsentLock(attempted.resolve).revokeConsent(uid, grant.id);
    await attempted.promise;
    assert.equal((await db.consentGrant.findUnique({ where: { id: grant.id } })).revokedAt, null);
    assert.equal(await db.outboxEvent.count({ where: { uid, topic: 'synthetic.delivery' } }), 0);
    release.resolve(); assert.equal(typeof await delivering, 'string'); await revoking;
    await assert.rejects(repo.withConsentDelivery(uid, 'downloads', undefined, 'delivery-v1', tx =>
      tx.outboxEvent.create({ data: { uid, topic: 'synthetic.delivery', payload: {} } })), /revoked/);
    assert.equal(await db.outboxEvent.count({ where: { uid, topic: 'synthetic.delivery' } }), 1);
  } finally { release.resolve(); await delivering; if (revoking) await revoking; }
});

test('failed consent delivery rolls back its owning-store write and releases revocation', async () => {
  const uid = 'delivery-rollback'; await repo.ensurePerson(uid);
  const grant = await repo.grantAccountConsent(uid, 'downloads', 'delivery-v1', 60);
  await assert.rejects(repo.withConsentDelivery(uid, 'downloads', undefined, 'delivery-v1', async tx => {
    await tx.outboxEvent.create({ data: { uid, topic: 'synthetic.delivery', payload: {} } });
    throw Error('synthetic store failure');
  }), /synthetic store failure/);
  assert.equal(await db.outboxEvent.count({ where: { uid, topic: 'synthetic.delivery' } }), 0);
  await repo.revokeConsent(uid, grant.id);
  await assert.rejects(repo.assertConsent(uid, 'downloads', undefined, 'delivery-v1'), /revoked/);
});

test('consent expiry during the owning-store callback rolls back delivery', async () => {
  const uid = 'delivery-callback-expiry'; await repo.ensurePerson(uid);
  const grant = await repo.grantAccountConsent(uid, 'downloads', 'delivery-v1', 60);
  const [clock] = await db.$queryRaw`SELECT clock_timestamp() AS now`;
  await db.consentGrant.update({ where: { id: grant.id }, data: { expiresAt: new Date(clock.now.getTime() + 2000) } });
  let entered = false;
  await assert.rejects(repo.withConsentDelivery(uid, 'downloads', undefined, 'delivery-v1', async tx => {
    entered = true;
    await tx.outboxEvent.create({ data: { uid, topic: 'synthetic.delivery', payload: {} } });
    await tx.$queryRaw`SELECT 1 AS waited FROM pg_sleep(2.2)`;
  }), /unavailable/);
  assert.equal(entered, true);
  assert.equal(await db.outboxEvent.count({ where: { uid, topic: 'synthetic.delivery' } }), 0);
});

test('consent validity uses the database clock when the application clock drifts', async (t) => {
  const [clock] = await db.$queryRaw`SELECT clock_timestamp() AS now`;
  const ahead = clock.now.getTime() + 60 * 60 * 1000;
  const behind = clock.now.getTime() - 60 * 60 * 1000;
  const future = { uid: 'owner', purpose: 'downloads', version: 'clock-future', consentVersion: 'clock-future',
    grantedAt: new Date(ahead), expiresAt: new Date(ahead + 60_000) };
  const expired = { ...future, version: 'clock-expired', consentVersion: 'clock-expired',
    grantedAt: new Date(behind - 60_000), expiresAt: new Date(behind + 60_000) };
  await db.consentGrant.createMany({ data: [future, expired] });
  await repo.grantAccountConsent('owner', 'downloads', 'clock-active', 600);

  t.mock.timers.enable({ apis: ['Date'], now: ahead });
  await assert.rejects(repo.assertConsent('owner', 'downloads', undefined, 'clock-future'), /unavailable/);
  await repo.assertConsent('owner', 'downloads', undefined, 'clock-active');
  t.mock.timers.setTime(behind);
  await assert.rejects(repo.assertConsent('owner', 'downloads', undefined, 'clock-expired'), /unavailable/);
});
async function invite(token, extra = {}) {
  return db.invitation.create({ data: { workspaceId: ws.id, email: token + '@example.invalid', tokenHash: createHash('sha256').update(token).digest('hex'),
    role: 'MEMBER', status: 'ISSUED', expiresAt: new Date(Date.now() + 60000), ...extra } });
}
test('actual PostgreSQL invitation claim admits one concurrent account and makes same-account retry idempotent', async () => {
  const token = 'synthetic-concurrent-invite'; await invite(token);
  const outcomes = await Promise.allSettled(['invitee-one','invitee-two'].map((uid) => repo.acceptInvitation(uid, token)));
  assert.equal(outcomes.filter((r) => r.status === 'fulfilled').length, 1);
  const invitation = await db.invitation.findUnique({ where: { tokenHash: createHash('sha256').update(token).digest('hex') } });
  const count = await db.outboxEvent.count();
  await repo.acceptInvitation(invitation.acceptedByUid, token);
  assert.equal(await db.outboxEvent.count(), count);
  const loser = invitation.acceptedByUid === 'invitee-one' ? 'invitee-two' : 'invitee-one';
  await assert.rejects(repo.acceptInvitation(loser, token), /already used/);
});
test('actual invitation expiry, revocation and OWNER grant are denied', async () => {
  for (const [token, extra] of [['synthetic-expired-invite',{expiresAt:new Date(0)}],['synthetic-revoked-invite',{revokedAt:new Date()}],['synthetic-owner-invite',{role:'OWNER'}]]) {
    await invite(token, extra); await assert.rejects(repo.acceptInvitation('invited', token), /expired|revoked|role/);
  }
});
test('owner self-invitations are rejected without consuming the invitation', async () => {
  const token = 'synthetic-self-invitation'; const invitation = await invite(token);
  await assert.rejects(repo.acceptInvitation('owner', token), /owner cannot accept/);
  assert.equal((await db.invitation.findUnique({ where: { id: invitation.id } })).status, 'ISSUED');
});
test('accepting a token cannot launder a forged OWNER membership', async () => {
  const token = 'synthetic-forged-owner-row'; const invitation = await invite(token);
  await assert.rejects(repo.acceptInvitation('different', token), /invalid role/);
  assert.equal((await db.invitation.findUnique({ where: { id: invitation.id } })).status, 'ISSUED');
});
test('revocation wins over a stale invitation read while its conditional claim is waiting', async () => {
  const token = 'synthetic-accept-revoke-race'; const invitation = await invite(token);
  let release, claimReached;
  const gate = new Promise((r) => { release = r; });
  const claim = new Promise((r) => { claimReached = r; });
  let locked;
  const lock = new Promise((r) => { locked = r; });
  const revoke = db.$transaction(async (tx) => {
    await tx.invitation.update({ where: { id: invitation.id }, data: { status: 'REVOKED', revokedAt: new Date() } });
    locked(); await gate;
  });
  await lock;
  const observed = db.$extends({ query: { invitation: { async updateMany({ args, query }) { claimReached(); return query(args); } } } });
  const accept = new WorkspaceRepository(observed).acceptInvitation('race-user', token);
  const settled = accept.then(() => null, (error) => error);
  await claim; release(); await revoke;
  assert.match((await settled).message, /revoked/);
  assert.equal(await db.workspaceMembership.count({ where: { uid: 'race-user' } }), 0);
});
test('erased workspaces cannot be replayed, authorized or listed', async () => {
  const erased = await repo.createWorkspace('owner', input('erased'));
  await db.deletionTombstone.create({ data: { uid: 'owner', resourceType: 'workspace', resourceId: erased.id, expiresAt: new Date(0) } });
  await assert.rejects(repo.createWorkspace('owner', input('erased')), /no longer available/);
  await assert.rejects(repo.assertMembership(erased.id, 'owner'), /no longer available/);
  assert.ok(!(await repo.listWorkspaces('owner')).some((r) => r.id === erased.id));
});
test('separate connections serialize per-UID commit order with durable unique sequence cursors', async () => {
  let release, created;
  const gate = new Promise((r) => { release = r; }); const paused = new Promise((r) => { created = r; });
  const firstClient = env.client(); const secondClient = env.client();
  try {
    const first = firstClient.$extends({ query: { outboxEvent: { async create({ args, query }) { const event = await query(args); created(); await gate; return event; } } } });
    const one = new WorkspaceRepository(first).createWorkspace('cursor-owner', input('cursor-one'));
    await paused;
    const two = new WorkspaceRepository(secondClient).createWorkspace('cursor-owner', input('cursor-two'));
    assert.equal(await db.outboxEvent.count({ where: { uid: 'cursor-owner' } }), 0);
    release(); await Promise.all([one,two]);
    const events = await db.outboxEvent.findMany({ where: { uid: 'cursor-owner' }, orderBy: { cursor: 'asc' } });
    assert.equal(events.length, 2); assert.ok(events[1].cursor > events[0].cursor);
    assert.equal(events[0].payload.slug, 'workspace-cursor-one');
    assert.equal(events[1].payload.slug, 'workspace-cursor-two');
  } finally { release(); await firstClient.$disconnect(); await secondClient.$disconnect(); }
});

test('actual consent HTTP service pages by signed account scope and commits owner-only revocation', async () => {
  const { Module, UnauthorizedException } = fixture.req('@nestjs/common');
  const { NestFactory } = fixture.req('@nestjs/core');
  const { ConfigService } = fixture.req('@nestjs/config');
  const cookieParser = fixture.req('cookie-parser');
  const { FirebaseProductService } = fixture.req('./dist/src/auth/firebase-product/firebase-product.service.js');
  const { ProductConsentService } = fixture.req('./dist/src/consent/product-consent.service.js');
  const { ProductConsentController } = fixture.req('./dist/src/consent/product-consent.controller.js');
  const uid = 'http-consent-subject', foreign = 'http-consent-foreign';
  await repo.ensurePerson(uid); await repo.ensurePerson(foreign);
  await db.consentGrant.createMany({ data: Array.from({ length: 21 }, (_, i) => ({ id: 'http-grant-' + String(i).padStart(2, '0'),
    uid, purpose: 'downloads', version: 'http-v1', consentVersion: 'http-v1', resourceId: 'http-resource-' + i })) });
  const other = await db.consentGrant.create({ data: { uid: foreign, purpose: 'downloads', version: 'http-v1', consentVersion: 'http-v1' } });
  const url = new URL(env.url); url.searchParams.set('connection_limit', '2'); url.searchParams.set('pool_timeout', '5'); url.searchParams.set('connect_timeout', '5');
  const secret = 'synthetic-consent-cursor-key-0000000000000000';
  const config = new ConfigService({ NODE_ENV: 'development', AUTH_PUBLIC_ORIGIN: 'http://localhost:5173',
    AUTH_RATE_LIMIT_KEY: secret, DATA_CONSENT_ENABLED: 'true', DATA_WORKSPACE_DATABASE_MODE: 'synthetic',
    DATA_WORKSPACE_RUNTIME_URL: String(url), DATA_WORKSPACE_RUNTIME_ROLE: decodeURIComponent(url.username), DATA_WORKSPACE_SCHEMA: env.schema });
  const accounts = { async authenticate(session) { if (!['subject', 'foreign'].includes(session)) throw new UnauthorizedException(); return { uid: session === 'subject' ? uid : foreign }; }, async rateLimit() {} };
  const service = new ProductConsentService(accounts, config);
  class FixtureModule {}
  Module({ controllers: [ProductConsentController], providers: [{ provide: FirebaseProductService, useValue: accounts },
    { provide: ConfigService, useValue: config }, { provide: ProductConsentService, useValue: service }] })(FixtureModule);
  const app = await NestFactory.create(FixtureModule, { logger: false }); app.use(cookieParser()); app.setGlobalPrefix('api'); await app.listen(0, '127.0.0.1');
  const endpoint = (await app.getUrl()) + '/api/account/privacy/consents', csrf = 'c'.repeat(64);
  const headers = { Origin: 'http://localhost:5173', Cookie: `visionary-session=subject; visionary-device=fixture; visionary-csrf=${csrf}`,
    'X-Visionary-Account': uid, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' };
  const revoke = (body, overrides = {}) => fetch(endpoint + '/revoke', { method: 'POST', headers: { ...headers, ...overrides }, body: JSON.stringify(body) });
  try {
    assert.equal((await fetch(endpoint)).status, 401);
    assert.equal((await fetch(endpoint, { headers: { ...headers, 'X-Visionary-Account': foreign } })).status, 409);
    assert.equal((await fetch(endpoint + '?uid=' + foreign, { headers })).status, 400);
    const first = await fetch(endpoint, { headers }); assert.equal(first.status, 200); assert.equal(first.headers.get('cache-control'), 'no-store');
    const page = await first.json(); assert.equal(page.uid, uid); assert.equal(page.grants.length, 20); assert.equal(typeof page.nextCursor, 'string');
    assert.ok(page.grants.every(g => g.id.startsWith('http-grant-')));
    const cursorUrl = endpoint + '?cursor=' + encodeURIComponent(page.nextCursor);
    assert.equal((await fetch(cursorUrl, { headers: { ...headers, Cookie: 'visionary-session=foreign', 'X-Visionary-Account': foreign } })).status, 400);
    const next = await (await fetch(cursorUrl, { headers })).json(); assert.equal(next.grants.length, 1); assert.equal(next.nextCursor, null);
    const expired = Buffer.from(JSON.stringify({ u: uid, a: 'http-grant-19', e: 0 })).toString('base64url');
    const signed = expired + '.' + createHmac('sha256', secret).update('consent-page:' + expired).digest('hex');
    assert.equal((await fetch(endpoint + '?cursor=' + encodeURIComponent(signed), { headers })).status, 400);
    assert.equal((await fetch(cursorUrl + 'x', { headers })).status, 400);
    assert.equal((await revoke({ grantId: other.id })).status, 403);
    assert.equal((await revoke({ grantId: page.grants[0].id, uid: foreign })).status, 400);
    assert.equal((await revoke({ grantId: page.grants[0].id }, { Origin: 'https://attacker.invalid' })).status, 403);
    assert.equal((await revoke({ grantId: page.grants[0].id }, { 'X-CSRF-Token': 'wrong' })).status, 403);
    const response = await revoke({ grantId: page.grants[0].id }); assert.equal(response.status, 201); assert.equal(response.headers.get('cache-control'), 'no-store');
    const receipt = await response.json(); assert.equal(receipt.uid, uid); assert.equal(receipt.id, page.grants[0].id);
    assert.deepEqual(await (await revoke({ grantId: receipt.id })).json(), receipt);
    assert.ok((await db.consentGrant.findUnique({ where: { id: receipt.id } })).revokedAt);
    assert.equal((await db.consentGrant.findUnique({ where: { id: other.id } })).revokedAt, null);
    assert.equal(await db.auditEvent.count({ where: { uid, operation: 'consent.revoked' } }), 1);
    assert.equal(await db.outboxEvent.count({ where: { uid, topic: 'consent.revoked' } }), 1);
    const refreshed = await (await fetch(endpoint, { headers })).json(); assert.equal(refreshed.grants[0].state, 'revoked');
    const original = service.repository;
    service.repository = { listAccountConsents: async () => { throw Error('private synthetic connection failure'); } };
    const outage = await fetch(endpoint, { headers }); assert.equal(outage.status, 503); assert.ok(!(await outage.text()).includes('private synthetic'));
    service.repository = original;
  } finally { await app.close(); }
  const disabled = new ProductConsentService(accounts, new ConfigService({}));
  assert.deepEqual(await disabled.list(uid), { version: 1, uid, available: false, grants: [], nextCursor: null });
  await assert.rejects(disabled.revoke(uid, 'http-grant-00'), error => error.getStatus() === 503);
});
