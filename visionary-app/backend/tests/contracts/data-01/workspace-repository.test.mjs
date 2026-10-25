import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
  await assert.rejects(repo.assertConsent('owner', 'synthetic-learning', undefined, 'v2'), /consent/);
  await assert.rejects(repo.assertConsent('owner', 'synthetic-learning'), /policy version/);
  await db.consentGrant.update({ where: { id: grant.id }, data: { revokedAt: new Date() } });
  await assert.rejects(repo.assertConsent('owner', 'synthetic-learning', undefined, 'v1'), /revoked/);
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
