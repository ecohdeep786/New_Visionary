// Independent reviewer probes. Argument: exact-candidate product checkout.
// Uses only the candidate's guarded disposable PostgreSQL fixture; never a
// product database. The repository is imported from compiled implementation.
const { resolve, join } = require('node:path');
const { createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const root = resolve(process.argv[2]);
const fixture = require(join(root, 'backend/tests/contracts/data-01/postgres-fixture.cjs'));
const { WorkspaceRepository } = fixture.req(process.env.REVIEW_REPOSITORY_JS || './dist/src/workspaces/workspace.repository.js');
let env, db, repo;
const command = (key, extra = {}) => ({ name: 'Reviewer synthetic ' + key, slug: 'review-' + key, commandId: 'review-' + key, ...extra });
before(async () => { env = await fixture.domainDatabase(); db = env.db; repo = new WorkspaceRepository(db); });
after(async () => { if (env) await env.close(); });

test('reviewer: failure after outbox creation rolls back every domain mutation', async () => {
  const failing = db.$extends({ query: { auditEvent: { async create() { throw Error('REVIEW_INJECTED_AUDIT_FAILURE'); } } } });
  await assert.rejects(new WorkspaceRepository(failing).createWorkspace('review-atomic', command('atomic')), /REVIEW_INJECTED_AUDIT_FAILURE/);
  for (const model of ['workspace', 'workspaceMembership', 'commandResult', 'outboxEvent', 'auditEvent']) {
    assert.equal(await db[model].count({ where: { uid: 'review-atomic' } }), 0, model);
  }
  assert.equal(await db.person.count({ where: { uid: 'review-atomic' } }), 1, 'UID anchor is intentionally independent from domain commit');
});

test('reviewer: simultaneous different commands sharing one key admit one payload only', async () => {
  const outcomes = await Promise.allSettled([
    repo.createWorkspace('review-race', command('race', { name: 'First' })),
    repo.createWorkspace('review-race', command('race', { name: 'Changed' })),
  ]);
  assert.equal(outcomes.filter((r) => r.status === 'fulfilled').length, 1);
  assert.match(outcomes.find((r) => r.status === 'rejected').reason.message, /changed payload/);
  assert.equal(await db.workspace.count({ where: { uid: 'review-race' } }), 1);
  assert.equal(await db.commandResult.count({ where: { uid: 'review-race' } }), 1);
});

test('reviewer: replay binds the operation as well as its payload and actor', async () => {
  const result = await repo.createWorkspace('review-kind', command('kind'));
  await db.commandResult.update({ where: { commandId: 'review-kind' }, data: { kind: 'different-operation' } });
  await assert.rejects(repo.createWorkspace('review-kind', command('kind')), /changed payload or operation/);
  await assert.rejects(repo.createWorkspace('review-other', command('kind')), /another account/);
  assert.equal(await db.outboxEvent.count({ where: { workspaceId: result.id } }), 1);
});

test('reviewer: expired consent and an absent policy version cannot authorize', async () => {
  await repo.ensurePerson('review-consent');
  await db.consentGrant.create({ data: { uid: 'review-consent', purpose: 'review-purpose', version: 'policy', consentVersion: 'v1', expiresAt: new Date(0) } });
  await assert.rejects(repo.assertConsent('review-consent', 'review-purpose', undefined, 'v1'), /unavailable|revoked/);
  await assert.rejects(repo.assertConsent('review-consent', 'review-purpose'), /policy version/);
});

test('reviewer: accepting an invitation cannot silently promote an existing member', async () => {
  const ws = await repo.createWorkspace('review-inviter', command('invitation'));
  await repo.ensurePerson('review-existing');
  await db.workspaceMembership.create({ data: { uid: 'review-existing', workspaceId: ws.id, role: 'GUEST', source: 'review-existing' } });
  const token = 'reviewer-synthetic-invitation-token';
  await db.invitation.create({ data: { workspaceId: ws.id, email: 'synthetic@example.invalid', role: 'ADMIN', status: 'ISSUED', expiresAt: new Date(Date.now() + 60000), tokenHash: createHash('sha256').update(token).digest('hex') } });
  const accepted = await repo.acceptInvitation('review-existing', token);
  assert.equal(accepted.role, 'GUEST');
  assert.equal((await db.workspaceMembership.findUnique({ where: { uid_workspaceId: { uid: 'review-existing', workspaceId: ws.id } } })).role, 'GUEST');
  const before = await db.outboxEvent.count();
  await db.workspaceMembership.delete({ where: { uid_workspaceId: { uid: 'review-existing', workspaceId: ws.id } } });
  await assert.rejects(repo.acceptInvitation('review-existing', token), /no longer available/);
  assert.equal(await db.outboxEvent.count(), before, 'revoked membership cannot be restored by replaying an old token');
});

test('reviewer: a forged existing OWNER row cannot be endorsed by accepting an invitation', async () => {
  const ws = await repo.createWorkspace('review-canonical-owner', command('corrupt-owner'));
  await repo.ensurePerson('review-forged-owner');
  await db.workspaceMembership.create({ data: { uid: 'review-forged-owner', workspaceId: ws.id, role: 'OWNER', source: 'review-corruption' } });
  const token = 'reviewer-forged-owner-invitation';
  const invitation = await db.invitation.create({ data: { workspaceId: ws.id, email: 'corruption@example.invalid', role: 'MEMBER', status: 'ISSUED', expiresAt: new Date(Date.now() + 60000), tokenHash: createHash('sha256').update(token).digest('hex') } });
  const before = await db.outboxEvent.count();
  await assert.rejects(repo.acceptInvitation('review-forged-owner', token), /membership|role/i);
  assert.equal((await db.invitation.findUnique({ where: { id: invitation.id } })).status, 'ISSUED', 'failed authorization must roll back token consumption');
  assert.equal(await db.outboxEvent.count(), before);
});
