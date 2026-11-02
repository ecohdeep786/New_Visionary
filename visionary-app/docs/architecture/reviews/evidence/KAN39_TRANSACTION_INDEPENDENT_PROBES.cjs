const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');
const root = resolve(__dirname, '../../../..');
const expected = process.env.KAN39_REVIEW_SOURCE;
if (!/^[a-f0-9]{40}$/.test(expected || '')) throw Error('Explicit exact reviewed source required');
execFileSync('git', ['diff', '--exit-code', expected, '--', 'backend/upstream/backend/src/invitations'], { cwd: root, stdio: 'pipe' });
const fixture = require(resolve(root, 'backend/tests/contracts/data-02/postgres-fixture.cjs'));
const { req, backend, stagingDatabase } = fixture;
const { MigrationRunner } = req('./dist/src/data/migration-runner.js');
const { canonicalMigrations } = req('./dist/src/data/migration-registry.js');
const { InvitationService } = req('./dist/src/invitations/invitation.service.js');
const { PostgresInvitationStore } = req('./dist/src/invitations/invitation-store.js');
const repaired = process.env.KAN39_EXPECT_REPAIRED === '1';
let env, target;
test.before(async () => {
  env = await stagingDatabase();
  await new MigrationRunner(env.store(), canonicalMigrations(backend)).applyAll();
  await env.grantRuntime();
  target = { role: env.runtimeRole, schema: env.schema, database: new URL(env.config.runtimeUrl).pathname.slice(1) };
});
test.after(async () => { if (env) await env.close(); });
const service = db => new InvitationService(new PostgresInvitationStore(db ?? env.runtime, target));
async function setup() {
  const id = randomUUID().replaceAll('-', ''), owner = 'reviewowner_' + id, user = 'reviewuser_' + id;
  await env.db.person.createMany({ data: [{ uid: owner }, { uid: user }] });
  const ws = await env.db.workspace.create({ data: { uid: owner, slug: id, name: 'Independent synthetic workspace', isPersonal: false } });
  await env.db.workspaceMembership.create({ data: { uid: owner, workspaceId: ws.id, role: 'OWNER', source: 'direct' } });
  const invite = await service().invite(owner, ws.id, { email: 'independent@example.invalid', role: 'MEMBER' });
  return { owner, user, ws: ws.id, invite };
}
const member = x => env.db.workspaceMembership.findUnique({ where: { uid_workspaceId: { uid: x.user, workspaceId: x.ws } } });
const acceptedEvents = x => env.db.auditEvent.count({ where: { resourceId: x.invite.invitationId, operation: 'invitation.accepted' } });

test('independent owner-scoped workspace tombstone before accept', async () => {
  const x = await setup();
  await env.db.deletionTombstone.create({ data: { uid: x.owner, resourceType: 'workspace', resourceId: x.ws, reason: 'independent deletion marker' } });
  if (repaired) {
    await assert.rejects(service().accept(x.user, x.invite.token), e => e.code === 'unauthorized');
    assert.equal(await member(x), null); assert.equal(await acceptedEvents(x), 0);
  } else {
    const result = await service().accept(x.user, x.invite.token);
    assert.equal(result.status, 'accepted'); assert.equal((await member(x)).role, 'MEMBER');
    console.log('REPRODUCED: owner-scoped workspace deletion marker ignored; new membership committed');
  }
});

test('independent actual elapsed expiry after token lookup cannot use invocation-start time', async () => {
  const x = await setup();
  const expires = new Date(Date.now() + 1500);
  await env.db.invitation.update({ where: { id: x.invite.invitationId }, data: { expiresAt: expires } });
  let ready, release;
  const reached = new Promise(r => { ready = r; }), wait = new Promise(r => { release = r; });
  const wrapped = { $transaction: (work, options) => env.runtime.$transaction(tx => work(new Proxy(tx, { get(t, key) {
    if (key === 'invitation') return new Proxy(t.invitation, { get(m, method) {
      if (method === 'findUnique') return async args => { const row = await m.findUnique(args); if (args.where.tokenHash) { ready(); await wait; } return row; };
      const value = m[method]; return typeof value === 'function' ? value.bind(m) : value;
    } });
    const value = t[key]; return typeof value === 'function' ? value.bind(t) : value;
  } })), options) };
  const pending = service(wrapped).accept(x.user, x.invite.token);
  try { await reached; await new Promise(r => setTimeout(r, Math.max(0, expires.getTime() - Date.now()) + 120)); }
  finally { release(); }
  if (repaired) {
    await assert.rejects(pending, e => e.code === 'expired'); assert.equal(await member(x), null); assert.equal(await acceptedEvents(x), 0);
  } else {
    const result = await pending; assert.equal(result.status, 'accepted'); assert.ok(Date.now() > expires.getTime());
    assert.equal((await member(x)).role, 'MEMBER');
    console.log('REPRODUCED: real elapsed token expiry passed while lookup was paused; stale Date still granted membership');
  }
});

test('independent changed durable receipt cannot turn a retry into a new grant', async () => {
  const x = await setup(); await service().accept(x.user, x.invite.token);
  const receipt = await env.db.commandResult.findFirstOrThrow({ where: { uid: x.user, kind: 'invitation.accepted' } });
  await env.db.commandResult.update({ where: { id: receipt.id }, data: { payloadDigest: 'changed-independent-digest' } });
  await assert.rejects(service().accept(x.user, x.invite.token), e => e.code === 'conflict');
  assert.equal(await acceptedEvents(x), 1); assert.equal((await member(x)).role, 'MEMBER');
});

test('independent accepted invitation cannot be revoked after commit or grant another UID', async () => {
  const x = await setup(); await service().accept(x.user, x.invite.token);
  await assert.rejects(service().revoke(x.owner, x.invite.invitationId), e => e.code === 'already_accepted');
  await assert.rejects(service().accept(x.owner, x.invite.token), e => e.code === 'already_accepted');
  assert.equal((await env.db.invitation.findUniqueOrThrow({ where: { id: x.invite.invitationId } })).status, 'ACCEPTED');
  assert.equal(await acceptedEvents(x), 1); assert.equal((await member(x)).role, 'MEMBER');
});

test('independent existing GUEST is not elevated by accepting MEMBER invitation', async () => {
  const x = await setup();
  await env.db.workspaceMembership.create({ data: { uid: x.user, workspaceId: x.ws, role: 'GUEST', source: 'direct' } });
  const result = await service().accept(x.user, x.invite.token);
  assert.equal(result.membershipRole, 'GUEST'); assert.equal((await member(x)).role, 'GUEST');
  assert.equal(await acceptedEvents(x), 1);
});

test('independent foreign OWNER row cannot establish canonical workspace ownership', async () => {
  const x = await setup();
  await env.db.workspaceMembership.create({ data: { uid: x.user, workspaceId: x.ws, role: 'OWNER', source: 'direct' } });
  const command = () => service().invite(x.user, x.ws, { email: 'foreign-owner@example.invalid', role: 'ADMIN' });
  if (repaired) await assert.rejects(command(), e => e.code === 'unauthorized');
  else {
    const granted = await command(); assert.ok(granted.invitationId);
    assert.equal((await env.db.workspace.findUniqueOrThrow({ where: { id: x.ws } })).uid, x.owner);
    console.log('REPRODUCED: foreign OWNER membership can issue ADMIN invitation despite another canonical workspace owner');
  }
});

test('independent retained OWNER invitation cannot create a foreign OWNER membership', async () => {
  const x = await setup();
  await env.db.invitation.update({ where: { id: x.invite.invitationId }, data: { role: 'OWNER' } });
  if (repaired) {
    await assert.rejects(service().accept(x.user, x.invite.token), e => ['unauthorized', 'conflict', 'invalid_command'].includes(e.code));
    assert.equal(await member(x), null); assert.equal(await acceptedEvents(x), 0);
  } else {
    const granted = await service().accept(x.user, x.invite.token);
    assert.equal(granted.membershipRole, 'OWNER'); assert.equal((await member(x)).role, 'OWNER');
    assert.equal((await env.db.workspace.findUniqueOrThrow({ where: { id: x.ws } })).uid, x.owner);
    console.log('REPRODUCED: retained OWNER invitation grants foreign OWNER membership without a persisted-role guard');
  }
});

test('independent same UID across workspaces cannot publish higher outbox cursor before lower uncommitted event', async () => {
  const x = await setup();
  const other = await env.db.workspace.create({ data: { uid: x.owner, slug: randomUUID(), name: 'Independent second workspace' } });
  await env.db.workspaceMembership.create({ data: { uid: x.owner, workspaceId: other.id, role: 'OWNER', source: 'direct' } });
  let ready, release, lower;
  const reached = new Promise(r => { ready = r; }), wait = new Promise(r => { release = r; });
  const wrapped = { $transaction: (work, options) => env.runtime.$transaction(tx => work(new Proxy(tx, { get(t, key) {
    if (key === 'outboxEvent') return new Proxy(t.outboxEvent, { get(m, method) {
      if (method === 'create') return async args => { const row = await m.create(args); lower = row.cursor; ready(); await wait; return row; };
      const value = m[method]; return typeof value === 'function' ? value.bind(m) : value;
    } });
    const value = t[key]; return typeof value === 'function' ? value.bind(t) : value;
  } })), options) };
  const initial = await env.db.outboxEvent.findMany({ where: { uid: x.owner }, orderBy: { cursor: 'desc' }, take: 1 });
  const prior = initial[0].cursor;
  const first = service(wrapped).invite(x.owner, x.ws, { email: 'lower@example.invalid', role: 'MEMBER' });
  await reached;
  let second;
  try {
    second = service().invite(x.owner, other.id, { email: 'higher@example.invalid', role: 'MEMBER' });
    if (repaired) {
      // Inspect actual committed rows while the first owning UID anchor is held.
      await new Promise(r => setTimeout(r, 300));
      assert.equal(await env.db.outboxEvent.count({ where: { uid: x.owner, cursor: { gt: prior } } }), 0);
    } else {
      await second;
      const visible = await env.db.outboxEvent.findMany({ where: { uid: x.owner, cursor: { gt: prior } } });
      assert.equal(visible.length, 1); assert.ok(visible[0].cursor > lower);
      console.log('REPRODUCED: later outbox cursor visible while earlier same-UID cursor remains uncommitted');
    }
  } finally { release(); }
  await first; await second;
  const after = await env.db.outboxEvent.findMany({ where: { uid: x.owner, cursor: { gt: prior } }, orderBy: { cursor: 'asc' } });
  assert.equal(after.length, 2);
});
