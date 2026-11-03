import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fixture from '../data-02/postgres-fixture.cjs';
const { req, backend, stagingDatabase } = fixture;
const { MigrationRunner } = req('./dist/src/data/migration-runner.js');
const { canonicalMigrations, registerMigration } = req('./dist/src/data/migration-registry.js');
const { InvitationService } = req('./dist/src/invitations/invitation.service.js');
const { PostgresInvitationStore } = req('./dist/src/invitations/invitation-store.js');
const { PrismaClient } = req('@prisma/client');
const registry = () => canonicalMigrations(backend);
const code = expected => e => e.code === expected;
let env, service, target;
before(async () => {
  env = await stagingDatabase();
  assert.deepEqual(registry().map(m => m.version), [1, 2]);
  assert.equal((await new MigrationRunner(env.store(), registry()).applyAll()).applied, 2);
  await env.grantRuntime();
  target = { role: env.runtimeRole, schema: env.schema, database: new URL(env.config.runtimeUrl).pathname.slice(1) };
  service = new InvitationService(new PostgresInvitationStore(env.runtime, target));
});
after(async () => { if (env) await env.close(); });
async function setup() {
  const id = randomUUID().replaceAll('-', ''), owner = 'reissueowner_' + id, user = 'reissueuser_' + id;
  await env.db.person.createMany({ data: [{ uid: owner }, { uid: user }] });
  const ws = await env.db.workspace.create({ data: { uid: owner, name: 'Synthetic reissue workspace', slug: id } });
  await env.db.workspaceMembership.create({ data: { uid: owner, workspaceId: ws.id, role: 'OWNER', source: 'direct' } });
  return { owner, user, ws: ws.id };
}
const issue = (x, role = 'MEMBER') => service.invite(x.owner, x.ws, { email: 'repeat@example.invalid', role });
const rows = x => env.db.invitation.findMany({ where: { workspaceId: x.ws }, orderBy: { createdAt: 'asc' } });
const membership = x => env.db.workspaceMembership.findUnique({ where: { uid_workspaceId: { uid: x.user, workspaceId: x.ws } } });

test('revoked invite can be reissued without rewriting its ID, token or history', async () => {
  const x = await setup(), old = await issue(x);
  await service.revoke(x.owner, old.invitationId);
  const before = await env.db.invitation.findUniqueOrThrow({ where: { id: old.invitationId } });
  const next = await issue(x);
  assert.notEqual(next.invitationId, old.invitationId); assert.notEqual(next.token, old.token);
  await assert.rejects(service.accept(x.user, old.token, 'repeat@example.invalid'), code('revoked'));
  assert.deepEqual(await env.db.invitation.findUniqueOrThrow({ where: { id: old.invitationId } }), before);
  assert.equal((await service.track(x.owner, x.ws, old.invitationId)).length, 2);
  await service.accept(x.user, next.token, 'repeat@example.invalid'); assert.equal((await membership(x)).role, 'MEMBER');
  assert.equal((await rows(x)).length, 2);
});
test('elapsed pending delivery transitions once to EXPIRED when reissued and its old token stays denied', async () => {
  const x = await setup(), old = await issue(x);
  await env.db.invitation.update({ where: { id: old.invitationId }, data: { expiresAt: new Date(Date.now() - 1000), email: 'REPEAT@EXAMPLE.INVALID' } });
  const next = await issue(x);
  assert.equal((await env.db.invitation.findUniqueOrThrow({ where: { id: old.invitationId } })).status, 'EXPIRED');
  await assert.rejects(service.accept(x.user, old.token, 'repeat@example.invalid'), code('expired'));
  assert.equal(await env.db.auditEvent.count({ where: { resourceId: old.invitationId, operation: 'invitation.expired' } }), 1);
  await service.accept(x.user, next.token, 'repeat@example.invalid'); assert.equal((await membership(x)).role, 'MEMBER');
});
test('accepted history remains replayable while a new delivery never silently changes the current role', async () => {
  const x = await setup(), old = await issue(x); await service.accept(x.user, old.token, 'repeat@example.invalid');
  const next = await issue(x, 'ADMIN');
  assert.equal((await service.accept(x.user, next.token, 'repeat@example.invalid')).membershipRole, 'MEMBER');
  assert.equal((await membership(x)).role, 'MEMBER');
  assert.equal((await service.accept(x.user, old.token, 'repeat@example.invalid')).replay, true);
  assert.equal((await rows(x)).filter(r => r.status === 'ACCEPTED').length, 2);
  assert.equal(await env.db.auditEvent.count({ where: { uid: x.user, operation: 'invitation.accepted' } }), 2);
});
test('two concurrent reissues have exactly one pending winner and retain closed history', async () => {
  const x = await setup(), old = await issue(x); await service.revoke(x.owner, old.invitationId);
  const result = await Promise.allSettled([issue(x), issue(x)]);
  assert.equal(result.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(result.filter(r => r.status === 'rejected' && r.reason.code === 'conflict').length, 1);
  const saved = await rows(x); assert.equal(saved.length, 2);
  assert.equal(saved.filter(r => r.status === 'REVOKED').length, 1); assert.equal(saved.filter(r => r.status === 'PENDING').length, 1);
});
test('physical partial uniqueness rejects a second active delivery across PENDING and ISSUED', async () => {
  const x = await setup(), old = await issue(x);
  await assert.rejects(env.db.invitation.create({ data: { workspaceId: x.ws, email: 'REPEAT@EXAMPLE.INVALID', role: 'ADMIN', status: 'ISSUED', tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 60000) } }), e => e.code === 'P2002');
  await service.revoke(x.owner, old.invitationId);
  await env.db.invitation.create({ data: { workspaceId: x.ws, email: 'repeat@example.invalid', role: 'MEMBER', status: 'ISSUED', tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 60000) } });
  await assert.rejects(issue(x), code('conflict'));
});
test('case normalization is literal and email wildcard characters never match other deliveries', async () => {
  const x = await setup(), old = await issue(x);
  const special = await service.invite(x.owner, x.ws, { email: '%@example.invalid', role: 'MEMBER' });
  assert.notEqual(special.invitationId, old.invitationId);
  const underscore = await service.invite(x.owner, x.ws, { email: 'repea_@example.invalid', role: 'MEMBER' });
  assert.notEqual(underscore.invitationId, old.invitationId);
  await assert.rejects(service.invite(x.owner, x.ws, { email: 'REPEAT@EXAMPLE.INVALID', role: 'MEMBER' }), code('conflict'));
  assert.equal((await rows(x)).filter(r => r.status === 'PENDING').length, 3);
});
test('session timezone cannot expire a valid delivery or keep an elapsed delivery active', async () => {
  for (const zone of ['Asia/Kolkata', 'America/Los_Angeles']) {
    const x = await setup(), old = await issue(x);
    await env.db.invitation.update({ where: { id: old.invitationId }, data: { expiresAt: new Date(Date.now() + 60000) } });
    const db = { $transaction: (work, options) => env.runtime.$transaction(async tx => {
      // Fixed fixture-owned zones, never caller-controlled SQL or session state.
      await tx.$executeRawUnsafe(`SET LOCAL TIME ZONE '${zone}'`); return work(tx);
    }, options) };
    const zoned = new InvitationService(new PostgresInvitationStore(db, target));
    const command = () => zoned.invite(x.owner, x.ws, { email: 'repeat@example.invalid', role: 'MEMBER' });
    await assert.rejects(command(), code('conflict'));
    assert.equal((await env.db.invitation.findUniqueOrThrow({ where: { id: old.invitationId } })).status, 'PENDING');
    await env.db.invitation.update({ where: { id: old.invitationId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const next = await command(); assert.notEqual(next.invitationId, old.invitationId);
    assert.equal((await env.db.invitation.findUniqueOrThrow({ where: { id: old.invitationId } })).status, 'EXPIRED');
  }
});
test('reissue outage rolls back expiry/history/outbox and new invitation, then cold retry recovers', async () => {
  const x = await setup(), old = await issue(x), name = 'reissue_fail_' + randomUUID().replaceAll('-', '');
  await env.db.invitation.update({ where: { id: old.invitationId }, data: { expiresAt: new Date(Date.now() - 1000) } });
  const before = await rows(x), history = await env.db.auditEvent.count({ where: { workspaceId: x.ws } }), outbox = await env.db.outboxEvent.count({ where: { workspaceId: x.ws } });
  await env.db.$executeRawUnsafe(`CREATE FUNCTION "${name}"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."uid"='${x.owner}' AND NEW."kind"='invitation.issued' THEN RAISE EXCEPTION 'synthetic reissue outage'; END IF; RETURN NEW; END $$`);
  await env.db.$executeRawUnsafe(`CREATE TRIGGER "${name}" BEFORE INSERT ON "command_results" FOR EACH ROW EXECUTE FUNCTION "${name}"()`);
  try { await assert.rejects(issue(x), /synthetic reissue outage/); }
  finally { await env.db.$executeRawUnsafe(`DROP TRIGGER "${name}" ON "command_results"`); await env.db.$executeRawUnsafe(`DROP FUNCTION "${name}"()`); }
  assert.deepEqual(await rows(x), before);
  assert.equal(await env.db.auditEvent.count({ where: { workspaceId: x.ws } }), history);
  assert.equal(await env.db.outboxEvent.count({ where: { workspaceId: x.ws } }), outbox);
  const db = new PrismaClient({ datasources: { db: { url: env.config.runtimeUrl } } });
  try {
    const cold = new InvitationService(new PostgresInvitationStore(db, target));
    const next = await cold.invite(x.owner, x.ws, { email: 'repeat@example.invalid', role: 'MEMBER' });
    await cold.accept(x.user, next.token, 'repeat@example.invalid');
  } finally { await db.$disconnect(); }
  assert.equal((await membership(x)).role, 'MEMBER'); assert.equal((await rows(x)).length, 2);
});
test('retained v1 domain rows keep migration2 denied without changing rows or initial uniqueness', async () => {
  const f = await stagingDatabase();
  try {
    await new MigrationRunner(f.store(), registry().slice(0, 1)).applyAll();
    const saved = await f.db.person.create({ data: { uid: 'retained_synthetic_reissue' } });
    await assert.rejects(new MigrationRunner(f.store(), registry()).applyAll(), /NON_EMPTY_STAGING_DENIED/);
    assert.deepEqual(await f.db.person.findUniqueOrThrow({ where: { uid: saved.uid } }), saved);
    const indexes = await f.db.$queryRawUnsafe('SELECT indexname FROM pg_indexes WHERE schemaname=$1 AND tablename=$2', f.schema, 'invitations');
    assert.ok(indexes.some(i => i.indexname === 'invitations_workspaceId_email_key'));
    assert.ok(!indexes.some(i => i.indexname === 'invitations_one_pending_email'));
  } finally { await f.close(); }
});
test('failed migration2 restores v1 indexes; cold retry applies current history exactly once', async () => {
  const f = await stagingDatabase();
  try {
    const [v1, v2] = registry(); await new MigrationRunner(f.store(), [v1]).applyAll();
    const broken = registerMigration({ ...v2, statements: [...v2.statements, 'INSERT INTO missing_reissue_table VALUES (1)'] });
    await assert.rejects(new MigrationRunner(f.store(), [v1, broken]).applyAll(), /missing_reissue_table/);
    const indexes = await f.db.$queryRawUnsafe('SELECT indexname FROM pg_indexes WHERE schemaname=$1 AND tablename=$2', f.schema, 'invitations');
    assert.ok(indexes.some(i => i.indexname === 'invitations_workspaceId_email_key'));
    assert.ok(!indexes.some(i => i.indexname === 'invitations_one_pending_email'));
    assert.equal((await new MigrationRunner(f.store(), registry()).applyAll()).applied, 1);
    const replay = await new MigrationRunner(f.store(), registry()).applyAll(); assert.equal(replay.applied, 0); assert.equal(replay.skipped, 2);
    assert.equal((await new MigrationRunner(f.store(), registry()).verify()).consistent, true);
  } finally { await f.close(); }
});
