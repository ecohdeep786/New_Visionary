import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fixture from '../data-02/postgres-fixture.cjs';
const { req, backend, stagingDatabase } = fixture;
const { MigrationRunner } = req('./dist/src/data/migration-runner.js');
const { canonicalMigrations } = req('./dist/src/data/migration-registry.js');
const { InvitationService } = req('./dist/src/invitations/invitation.service.js');
const { PostgresInvitationStore } = req('./dist/src/invitations/invitation-store.js');
const { PrismaClient } = req('@prisma/client');
let env, target, service, reviewerStore;
const reviewerUid = 'institution-reviewer';
const approve = (ws, owner) => reviewerStore.approveInstitution({ workspaceId: ws, administratorUid: owner, reviewerUid,
  evidenceRef: 'proof_synthetic_fixture_001', expiresAt: new Date(Date.now() + 86400_000) });
const at = new Date('2026-11-02T00:00:00Z');
const fresh = db => new InvitationService(new PostgresInvitationStore(db, target), () => at);
const code = value => error => error.code === value;
before(async () => {
  env = await stagingDatabase();
  await new MigrationRunner(env.store(), canonicalMigrations(backend)).applyAll();
  await env.grantRuntime();
  target = { role: env.runtimeRole, schema: env.schema, database: new URL(env.config.runtimeUrl).pathname.slice(1) };
  service = fresh(env.runtime);
  reviewerStore = new PostgresInvitationStore(env.runtime, target, new Set([reviewerUid]));
});
after(async () => { if (env) await env.close(); });
async function setup(personal = false, approved = true) {
  const suffix = randomUUID().replaceAll('-', ''), owner = 'owner_' + suffix, user = 'user_' + suffix, other = 'other_' + suffix;
  await env.db.person.createMany({ data: [owner, user, other].map(uid => ({ uid })) });
  const w = await env.db.workspace.create({ data: { uid: owner, slug: suffix, name: 'Synthetic invitation workspace', isPersonal: personal } });
  await env.db.workspaceMembership.create({ data: { uid: owner, workspaceId: w.id, role: 'OWNER', source: 'direct' } });
  const approval = !personal && approved ? await approve(w.id, owner) : null;
  return { owner, user, other, ws: w.id, approval };
}
const invite = (x, role = 'MEMBER', email = 'synthetic@example.invalid') => service.invite(x.owner, x.ws, { role, email });
const membership = (x, uid = x.user) => env.db.workspaceMembership.findUnique({ where: { uid_workspaceId: { uid, workspaceId: x.ws } } });
const events = (id, action) => env.db.auditEvent.count({ where: { resourceId: id, ...(action ? { operation: 'invitation.' + action } : {}) } });

test('actual SQL issue stores only token hash and commits lifecycle/receipt/outbox together', async () => {
  const x = await setup(), i = await invite(x);
  const row = await env.db.invitation.findUniqueOrThrow({ where: { id: i.invitationId } });
  assert.match(i.token, /^[A-Za-z0-9_-]{43}$/); assert.match(row.tokenHash, /^[a-f0-9]{64}$/);
  assert.equal(await membership(x), null); assert.equal(await events(row.id, 'issued'), 1);
  assert.equal(await env.db.commandResult.count({ where: { workspaceId: x.ws } }), 1);
  const receipts = await env.db.commandResult.findMany({ where: { workspaceId: x.ws } });
  assert.equal(JSON.stringify(receipts).includes(i.token), false);
  const visible = await service.list(x.owner, x.ws);
  assert.equal(JSON.stringify(visible).includes(row.tokenHash), false);
  assert.equal(await env.db.outboxEvent.count({ where: { workspaceId: x.ws } }), 1);
});
test('issuer recovers a lost response without recovering the old secret or revoking a replacement', async () => {
  const x = await setup(), y = await setup(), first = await invite(x);
  const pending = await reviewerStore.pending(x.owner, x.ws, 'SYNTHETIC@example.invalid');
  assert.deepEqual(pending, { invitationId: first.invitationId });
  await env.db.workspaceMembership.create({ data: { uid: x.other, workspaceId: x.ws, role: 'MEMBER', source: 'direct' } });
  await assert.rejects(reviewerStore.pending(x.other, x.ws, 'synthetic@example.invalid'), code('unauthorized'));
  await assert.rejects(reviewerStore.revoke(x.other, pending.invitationId, at, x.ws), code('unauthorized'));
  await assert.rejects(reviewerStore.revoke(y.owner, pending.invitationId, at, y.ws), code('not_found'));
  assert.equal((await reviewerStore.revoke(x.owner, pending.invitationId, at, x.ws)).status, 'revoked');
  assert.deepEqual(await reviewerStore.pending(x.owner, x.ws, 'synthetic@example.invalid'), { invitationId: null });
  const replacement = await invite(x);
  assert.equal((await reviewerStore.revoke(x.owner, pending.invitationId, at, x.ws)).replay, true);
  assert.equal(await events(first.invitationId, 'revoked'), 1);
  await assert.rejects(service.accept(x.user, first.token, 'synthetic@example.invalid'), code('revoked'));
  await service.accept(x.user, replacement.token, 'synthetic@example.invalid');
  assert.equal((await membership(x)).role, 'MEMBER');
  assert.deepEqual((await service.track(x.owner, x.ws, first.invitationId)).map(event => event.action),
    ['invitation.issued', 'invitation.revoked']);
  assert.deepEqual((await service.track(x.owner, x.ws, replacement.invitationId)).map(event => event.action),
    ['invitation.issued', 'invitation.accepted']);
  assert.deepEqual(await reviewerStore.acceptedMembership(x.user, x.ws, replacement.invitationId),
    { workspaceId: x.ws, role: 'MEMBER' });
  await assert.rejects(reviewerStore.acceptedMembership(x.other, x.ws, replacement.invitationId), code('not_found'));
  await assert.rejects(reviewerStore.acceptedMembership(x.user, y.ws, replacement.invitationId), code('not_found'));
  await env.db.workspaceMembership.update({ where: { uid_workspaceId: { uid: x.user, workspaceId: x.ws } }, data: { role: 'GUEST' } });
  assert.equal((await reviewerStore.acceptedMembership(x.user, x.ws, replacement.invitationId)).role, 'GUEST');
  const replay = await service.accept(x.user, replacement.token, 'synthetic@example.invalid');
  assert.equal(replay.replay, true);
  assert.equal(replay.membershipRole, 'GUEST');
  await reviewerStore.revokeInstitution(reviewerUid, x.ws, x.approval.id);
  await assert.rejects(reviewerStore.acceptedMembership(x.user, x.ws, replacement.invitationId), code('unauthorized'));
});
test('ordinary members cannot read the invitation list or audit history', async () => {
  const x = await setup(), invitation = await invite(x);
  await service.accept(x.user, invitation.token, 'synthetic@example.invalid');
  await assert.rejects(service.list(x.user, x.ws), code('unauthorized'));
  await assert.rejects(service.track(x.user, x.ws, invitation.invitationId), code('unauthorized'));
  assert.equal((await service.list(x.owner, x.ws)).length, 1);
  assert.equal((await service.track(x.owner, x.ws, invitation.invitationId)).length, 2);
});
test('one token admits only one of two concurrent verified UIDs', async () => {
  const x = await setup(), i = await invite(x);
  const results = await Promise.allSettled([x.user, x.other].map(uid => service.accept(uid, i.token, 'synthetic@example.invalid')));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter(r => r.status === 'rejected' && r.reason.code === 'already_accepted').length, 1);
  assert.equal(await env.db.workspaceMembership.count({ where: { workspaceId: x.ws } }), 2);
  assert.equal(await events(i.invitationId, 'accepted'), 1);
});
test('a forwarded token cannot grant membership to a different verified email', async () => {
  const x = await setup(), invitation = await invite(x);
  await assert.rejects(service.accept(x.other, invitation.token, 'different@example.invalid'), code('invalid_token'));
  await assert.rejects(service.accept(x.user, invitation.token), code('unauthorized'));
  assert.equal(await membership(x, x.other), null);
  assert.equal(await events(invitation.invitationId, 'accepted'), 0);
  await service.accept(x.user, invitation.token, 'SYNTHETIC@EXAMPLE.INVALID');
  assert.equal((await membership(x)).role, 'MEMBER');
  await assert.rejects(service.accept(x.user, invitation.token, 'changed@example.invalid'), code('invalid_token'));
  assert.equal(await events(invitation.invitationId, 'accepted'), 1);
  assert.equal(await env.db.commandResult.count({ where: { uid: x.user } }), 1);
  assert.equal(await env.db.outboxEvent.count({ where: { uid: x.user } }), 1);
});
test('concurrent same-UID and cold-client retries replay without duplicate membership/audit/outbox', async () => {
  const x = await setup(), i = await invite(x);
  const results = await Promise.all(Array.from({ length: 4 }, () => service.accept(x.user, i.token, 'synthetic@example.invalid')));
  assert.equal(results.filter(r => !r.replay).length, 1);
  const db = new PrismaClient({ datasources: { db: { url: env.config.runtimeUrl } } });
  try { assert.equal((await fresh(db).accept(x.user, i.token, 'synthetic@example.invalid')).replay, true); } finally { await db.$disconnect(); }
  assert.equal(await events(i.invitationId, 'accepted'), 1);
  assert.equal(await env.db.commandResult.count({ where: { uid: x.user } }), 1);
  assert.equal(await env.db.outboxEvent.count({ where: { uid: x.user } }), 1);
});
test('completed revoke wins over acceptance paused after actual token lookup', { timeout: 15000 }, async () => {
  const x = await setup(), i = await invite(x);
  let release, reached;
  const wait = new Promise(r => { release = r; }), ready = new Promise(r => { reached = r; });
  const proxy = { $transaction: (work, options) => env.runtime.$transaction(tx => work(new Proxy(tx, { get(t, k) {
    if (k === 'invitation') return new Proxy(t.invitation, { get(model, method) {
      if (method === 'findUnique') return async args => { const value = await model.findUnique(args); if (args.where.tokenHash) { reached(); await wait; } return value; };
      const value = model[method]; return typeof value === 'function' ? value.bind(model) : value;
    } });
    const value = t[k]; return typeof value === 'function' ? value.bind(t) : value;
  } })), options) };
  const pending = fresh(proxy).accept(x.user, i.token, 'synthetic@example.invalid');
  try { await Promise.race([ready, pending]); await service.revoke(x.owner, i.invitationId); } finally { release(); }
  await assert.rejects(pending, code('revoked'));
  assert.equal(await membership(x), null); assert.equal(await events(i.invitationId, 'accepted'), 0);
  assert.equal((await env.db.invitation.findUniqueOrThrow({ where: { id: i.invitationId } })).status, 'REVOKED');
});
test('database failure after membership and token mutation rolls back all state, then cold retry recovers', async () => {
  const x = await setup(), i = await invite(x), name = 'fail_' + randomUUID().replaceAll('-', '');
  await env.db.$executeRawUnsafe(`CREATE FUNCTION "${name}"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."uid"='${x.user}' THEN RAISE EXCEPTION 'synthetic receipt outage'; END IF; RETURN NEW; END $$`);
  await env.db.$executeRawUnsafe(`CREATE TRIGGER "${name}" BEFORE INSERT ON "command_results" FOR EACH ROW EXECUTE FUNCTION "${name}"()`);
  try { await assert.rejects(service.accept(x.user, i.token, 'synthetic@example.invalid'), /synthetic receipt outage/); }
  finally { await env.db.$executeRawUnsafe(`DROP TRIGGER "${name}" ON "command_results"`); await env.db.$executeRawUnsafe(`DROP FUNCTION "${name}"()`); }
  assert.equal(await membership(x), null); assert.equal(await events(i.invitationId, 'accepted'), 0);
  assert.equal((await env.db.invitation.findUniqueOrThrow({ where: { id: i.invitationId } })).status, 'PENDING');
  const db = new PrismaClient({ datasources: { db: { url: env.config.runtimeUrl } } });
  try { assert.equal((await fresh(db).accept(x.user, i.token, 'synthetic@example.invalid')).replay, false); } finally { await db.$disconnect(); }
  assert.equal((await membership(x)).role, 'MEMBER');
});
test('owner self-accept is denied without demotion; existing MEMBER never gains ADMIN through invitation', async () => {
  const x = await setup(), ownerInvite = await invite(x);
  await assert.rejects(service.accept(x.owner, ownerInvite.token, 'synthetic@example.invalid'), code('unauthorized'));
  assert.equal((await membership(x, x.owner)).role, 'OWNER');
  await env.db.workspaceMembership.create({ data: { workspaceId: x.ws, uid: x.user, role: 'MEMBER', source: 'direct' } });
  const admin = await invite(x, 'ADMIN', 'other@example.invalid');
  assert.equal((await service.accept(x.user, admin.token, 'other@example.invalid')).membershipRole, 'MEMBER');
  assert.equal((await membership(x)).role, 'MEMBER');
});
test('removed issuer authority invalidates pending acceptance without consuming token', async () => {
  const x = await setup(), i = await invite(x);
  await env.db.workspaceMembership.delete({ where: { uid_workspaceId: { uid: x.owner, workspaceId: x.ws } } });
  await assert.rejects(service.accept(x.user, i.token, 'synthetic@example.invalid'), code('unauthorized'));
  assert.equal(await membership(x), null);
  assert.equal((await env.db.invitation.findUniqueOrThrow({ where: { id: i.invitationId } })).status, 'PENDING');
});
test('a cold retry cannot recreate a removed membership or bypass a deletion tombstone', async () => {
  const x = await setup(), i = await invite(x); await service.accept(x.user, i.token, 'synthetic@example.invalid');
  await env.db.workspaceMembership.delete({ where: { uid_workspaceId: { uid: x.user, workspaceId: x.ws } } });
  await assert.rejects(service.accept(x.user, i.token, 'synthetic@example.invalid'), code('unauthorized')); assert.equal(await membership(x), null);
  const j = await invite(x, 'MEMBER', 'deleted@example.invalid');
  await env.db.deletionTombstone.create({ data: { uid: x.user, resourceType: 'workspace', resourceId: x.ws, reason: 'synthetic deletion' } });
  await assert.rejects(service.accept(x.user, j.token, 'deleted@example.invalid'), code('unauthorized')); assert.equal(await membership(x), null);
});
test('unknown identity, guessed token, expiration and revoked token cannot grant membership', async () => {
  const x = await setup(), i = await invite(x);
  await assert.rejects(service.accept('unprovisioned', i.token, 'synthetic@example.invalid'), code('unauthorized'));
  await assert.rejects(service.accept(x.user, 'not-a-token', 'synthetic@example.invalid'), code('invalid_token'));
  await assert.rejects(service.accept(x.user, 'A'.repeat(43), 'synthetic@example.invalid'), code('invalid_token'));
  const late = new InvitationService(new PostgresInvitationStore(env.runtime, target), () => new Date('2027-01-01T00:00:00Z'));
  await assert.rejects(late.accept(x.user, i.token, 'synthetic@example.invalid'), code('expired'));
  await service.revoke(x.owner, i.invitationId);
  await assert.rejects(service.accept(x.user, i.token, 'synthetic@example.invalid'), code('revoked')); assert.equal(await membership(x), null);
});
test('wrong workspace/history/actor access is denied and token hashes stay private', async () => {
  const x = await setup(), y = await setup(), i = await invite(x);
  await assert.rejects(service.invite(x.other, x.ws, { email: 'x@example.invalid', role: 'MEMBER' }), code('unauthorized'));
  await assert.rejects(service.revoke(x.other, i.invitationId), code('unauthorized'));
  await assert.rejects(service.list(x.other, x.ws), code('unauthorized'));
  await assert.rejects(service.track(y.owner, y.ws, i.invitationId), code('not_found'));
  const history = await service.track(x.owner, x.ws, i.invitationId);
  assert.equal(history.length, 1); assert.equal(history[0].action, 'invitation.issued');
  assert.equal(JSON.stringify(history).includes(i.token), false);
});
test('personal workspace, OWNER picker, malformed body and invalid expiry fail closed', async () => {
  const x = await setup(true); await assert.rejects(invite(x), code('unauthorized'));
  const y = await setup();
  for (const payload of [{ role: 'OWNER', email: 'a@example.invalid' }, { role: 'MEMBER', email: 'a@example.invalid', expiresInSeconds: NaN },
    { role: 'MEMBER', email: 'a@example.invalid', expiresInSeconds: 0 }, { role: 'MEMBER', email: 'bad' }, { role: 'MEMBER', email: 'a@example.invalid', actorUid: y.owner }])
    await assert.rejects(service.invite(y.owner, y.ws, payload), code('invalid_command'));
});
test('same-time issues use unique IDs; duplicate delivery identity never silently overwrites a token', async () => {
  const x = await setup(); const a = await invite(x), b = await invite(x, 'MEMBER', 'different@example.invalid');
  assert.notEqual(a.invitationId, b.invitationId);
  await assert.rejects(invite(x), code('conflict'));
  await service.accept(x.user, a.token, 'synthetic@example.invalid'); assert.equal((await membership(x)).role, 'MEMBER');
});
test('wrong SQL identity and privileged migration client are rejected without writes', async () => {
  const x = await setup();
  const wrong = new InvitationService(new PostgresInvitationStore(env.runtime, { ...target, role: env.migrationRole }));
  await assert.rejects(wrong.invite(x.owner, x.ws, { role: 'MEMBER', email: 'x@example.invalid' }), code('unavailable'));
  const privileged = new InvitationService(new PostgresInvitationStore(env.db, { ...target, role: env.migrationRole }));
  await assert.rejects(privileged.invite(x.owner, x.ws, { role: 'MEMBER', email: 'x@example.invalid' }), code('unavailable'));
  assert.equal(await env.db.invitation.count({ where: { workspaceId: x.ws } }), 0);
});

function pauseActual(modelName, method, matches = () => true) {
  let reached, release, paused = false;
  const ready = new Promise(r => { reached = r; }), wait = new Promise(r => { release = r; });
  const db = { $transaction: (work, options) => env.runtime.$transaction(tx => work(new Proxy(tx, { get(t, k) {
    if (k === modelName) return new Proxy(t[k], { get(model, key) {
      const value = model[key];
      if (key === method) return async args => { const row = await value.call(model, args); if (!paused && matches(args)) { paused = true; reached(row); await wait; } return row; };
      return typeof value === 'function' ? value.bind(model) : value;
    } });
    const value = t[k]; return typeof value === 'function' ? value.bind(t) : value;
  } })), options) };
  return { db, ready, release };
}
test('owner-scoped workspace erasure denies every command/read, not only recipient-scoped markers', async () => {
  const x = await setup(), i = await invite(x);
  await env.db.deletionTombstone.create({ data: { uid: x.owner, resourceType: 'workspace', resourceId: x.ws, reason: 'synthetic owner erasure' } });
  for (const action of [() => service.accept(x.user, i.token, 'synthetic@example.invalid'), () => service.revoke(x.owner, i.invitationId),
    () => service.list(x.owner, x.ws), () => service.track(x.owner, x.ws, i.invitationId), () => invite(x, 'MEMBER', 'later@example.invalid')])
    await assert.rejects(action(), code('unauthorized'));
  assert.equal(await membership(x), null); assert.equal(await events(i.invitationId, 'accepted'), 0);
});
test('database clock rejects expiry during SQL lookup even when injected caller clock stays earlier', { timeout: 15000 }, async () => {
  const x = await setup(), i = await invite(x), expires = new Date(Date.now() + 1500);
  await env.db.invitation.update({ where: { id: i.invitationId }, data: { expiresAt: expires } });
  const pause = pauseActual('invitation', 'findUnique', args => !!args.where.tokenHash);
  const pending = fresh(pause.db).accept(x.user, i.token, 'synthetic@example.invalid');
  try { await Promise.race([pause.ready, pending]); await new Promise(r => setTimeout(r, Math.max(0, expires.getTime() - Date.now()) + 80)); } finally { pause.release(); }
  await assert.rejects(pending, code('expired')); assert.equal(await membership(x), null);
  assert.equal(await events(i.invitationId, 'accepted'), 0);
});
test('expiry during the last outbox write rolls back membership, token, receipt, audit and outbox', { timeout: 15000 }, async () => {
  const x = await setup(), i = await invite(x), expires = new Date(Date.now() + 1800);
  await env.db.invitation.update({ where: { id: i.invitationId }, data: { expiresAt: expires } });
  const pause = pauseActual('outboxEvent', 'create');
  const pending = fresh(pause.db).accept(x.user, i.token, 'synthetic@example.invalid');
  try { await Promise.race([pause.ready, pending]); await new Promise(r => setTimeout(r, Math.max(0, expires.getTime() - Date.now()) + 80)); } finally { pause.release(); }
  await assert.rejects(pending, code('expired')); assert.equal(await membership(x), null);
  assert.equal(await env.db.commandResult.count({ where: { uid: x.user } }), 0);
  assert.equal(await env.db.outboxEvent.count({ where: { uid: x.user } }), 0);
  assert.equal(await events(i.invitationId, 'accepted'), 0);
  assert.equal((await env.db.invitation.findUniqueOrThrow({ where: { id: i.invitationId } })).status, 'PENDING');
});
test('foreign OWNER membership and retained OWNER invite cannot establish ownership', async () => {
  const x = await setup(), i = await invite(x);
  await env.db.workspaceMembership.create({ data: { workspaceId: x.ws, uid: x.other, role: 'OWNER', source: 'direct' } });
  await assert.rejects(service.invite(x.other, x.ws, { role: 'ADMIN', email: 'foreign@example.invalid' }), code('unauthorized'));
  await env.db.invitation.update({ where: { id: i.invitationId }, data: { role: 'OWNER' } });
  await assert.rejects(service.accept(x.user, i.token, 'synthetic@example.invalid'), code('unauthorized'));
  assert.equal(await membership(x), null); assert.equal(await events(i.invitationId, 'accepted'), 0);
});
test('canonical UID anchor fences outbox allocation across distinct workspaces until commit', { timeout: 15000 }, async () => {
  const x = await setup(), other = await env.db.workspace.create({ data: { uid: x.owner, slug: randomUUID(), name: 'Synthetic second workspace' } });
  await env.db.workspaceMembership.create({ data: { uid: x.owner, workspaceId: other.id, role: 'OWNER', source: 'direct' } });
  await approve(other.id, x.owner);
  const pause = pauseActual('outboxEvent', 'create');
  const first = fresh(pause.db).invite(x.owner, x.ws, { role: 'MEMBER', email: 'first@example.invalid' });
  const row = await Promise.race([pause.ready, first]);
  let second;
  try {
    second = service.invite(x.owner, other.id, { role: 'MEMBER', email: 'second@example.invalid' });
    await new Promise(r => setTimeout(r, 250));
    assert.equal(await env.db.outboxEvent.count({ where: { uid: x.owner, cursor: { gte: row.cursor } } }), 0);
  } finally { pause.release(); }
  await first; await second;
  const saved = await env.db.outboxEvent.findMany({ where: { uid: x.owner, cursor: { gte: row.cursor } }, orderBy: { cursor: 'asc' } });
  assert.equal(saved.length, 2); assert.equal(saved[0].workspaceId, x.ws); assert.equal(saved[1].workspaceId, other.id);
});

test('institution approval fences issuance, acceptance and replay across revocation and replacement', async () => {
  const x = await setup(false, false);
  await assert.rejects(invite(x), code('unauthorized'));
  assert.equal(await env.db.invitation.count({ where: { workspaceId: x.ws } }), 0);
  const first = await approve(x.ws, x.owner);
  await assert.rejects(approve(x.ws, x.owner), code('conflict'));
  const pending = await invite(x);
  const accepted = await invite(x, 'MEMBER', 'accepted@example.invalid');
  await service.accept(x.user, accepted.token, 'accepted@example.invalid');

  const y = await setup();
  await assert.rejects(env.db.invitation.update({
    where: { id: pending.invitationId }, data: { institutionApprovalId: y.approval.approvalId },
  }), error => error.code === 'P2003');

  await assert.rejects(reviewerStore.revokeInstitution(x.owner, x.ws, first.approvalId), code('unauthorized'));
  const revoked = await reviewerStore.revokeInstitution(reviewerUid, x.ws, first.approvalId);
  assert.deepEqual(await reviewerStore.revokeInstitution(reviewerUid, x.ws, first.approvalId), revoked);
  await assert.rejects(invite(x, 'MEMBER', 'blocked@example.invalid'), code('unauthorized'));
  const replacement = await approve(x.ws, x.owner);
  assert.notEqual(replacement.approvalId, first.approvalId);
  await assert.rejects(service.accept(x.other, pending.token, 'synthetic@example.invalid'), code('unauthorized'));
  await assert.rejects(service.accept(x.user, accepted.token, 'accepted@example.invalid'), code('unauthorized'));
  assert.equal(await membership(x, x.other), null);
  assert.equal(await events(pending.invitationId, 'accepted'), 0);
  assert.equal(await events(accepted.invitationId, 'accepted'), 1);

  const freshInvite = await invite(x);
  assert.equal((await env.db.invitation.findUniqueOrThrow({ where: { id: pending.invitationId } })).status, 'REVOKED');
  const row = await env.db.invitation.findUniqueOrThrow({ where: { id: freshInvite.invitationId } });
  assert.equal(row.institutionApprovalId, replacement.approvalId);
  await service.accept(x.other, freshInvite.token, 'synthetic@example.invalid');
  assert.equal((await membership(x, x.other)).role, 'MEMBER');
});

test('approval and revocation fence concurrent owner issuance with the Person lock first', { timeout: 15000 }, async () => {
  const x = await setup(false, false);
  const assertOwnerLocked = () => assert.rejects(
    env.db.$queryRawUnsafe('SELECT "uid" FROM "persons" WHERE "uid"=$1 FOR UPDATE NOWAIT', x.owner),
    error => error.meta?.code === '55P03',
  );
  const approvalPause = pauseActual('institutionApproval', 'create');
  const approvingStore = new PostgresInvitationStore(approvalPause.db, target, new Set([reviewerUid]));
  const approving = approvingStore.approveInstitution({ workspaceId: x.ws, administratorUid: x.owner, reviewerUid,
    evidenceRef: 'proof_synthetic_race_001', expiresAt: new Date(Date.now() + 86400_000) });
  let issuing;
  try {
    await Promise.race([approvalPause.ready, approving]);
    await assertOwnerLocked();
    issuing = invite(x);
  } finally {
    approvalPause.release();
  }
  const [approval, invitation] = await Promise.all([approving, issuing]);
  const row = await env.db.invitation.findUniqueOrThrow({ where: { id: invitation.invitationId } });
  assert.equal(row.institutionApprovalId, approval.approvalId);

  const revokePause = pauseActual('institutionApproval', 'update');
  const revokingStore = new PostgresInvitationStore(revokePause.db, target, new Set([reviewerUid]));
  const revoking = revokingStore.revokeInstitution(reviewerUid, x.ws, approval.approvalId);
  let deniedIssue;
  try {
    await Promise.race([revokePause.ready, revoking]);
    await assertOwnerLocked();
    deniedIssue = assert.rejects(invite(x, 'MEMBER', 'after-revocation@example.invalid'), code('unauthorized'));
  } finally {
    revokePause.release();
  }
  await Promise.all([revoking, deniedIssue]);
  assert.equal(await env.db.invitation.count({ where: { workspaceId: x.ws } }), 1);
});
