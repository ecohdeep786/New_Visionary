import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fixture from './postgres-fixture.cjs';
let env, db;
before(async () => { env = await fixture.domainDatabase(); db = env.db; });
after(async () => { if (env) await env.close(); });

test('PostgreSQL creates all ten domain tables with exact quoted field names', async () => {
  const tables = await db.$queryRawUnsafe('SELECT table_name FROM information_schema.tables WHERE table_schema = $1', env.schema);
  assert.equal(tables.length, 10);
  for (const name of ['persons','workspaces','workspace_memberships','invitations','consent_grants','share_grants','command_results','outbox_events','audit_events','deletion_tombstones']) assert.ok(tables.some((t) => t.table_name === name));
  const columns = await db.$queryRawUnsafe('SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2', env.schema, 'persons');
  assert.deepEqual(columns.map((c) => c.column_name).sort(), ['createdAt','uid','updatedAt']);
});
test('PostgreSQL rejects a workspace referencing an unknown UID', async () => {
  await assert.rejects(db.workspace.create({ data: { uid: 'unknown', name: 'Wrong reference', slug: 'wrong-reference' } }), (e) => e.code === 'P2003');
});
test('PostgreSQL enforces unique personal workspace ownership', async () => {
  await db.person.create({ data: { uid: 'personal' } });
  await db.workspace.create({ data: { uid: 'personal', name: 'One', slug: 'personal-one', isPersonal: true } });
  await assert.rejects(db.workspace.create({ data: { uid: 'personal', name: 'Two', slug: 'personal-two', isPersonal: true } }), (e) => e.code === 'P2002');
  await db.workspace.create({ data: { uid: 'personal', name: 'Shared', slug: 'shared', isPersonal: false } });
});
test('PostgreSQL role enum rejects unknown stored roles', async () => {
  const workspace = await db.workspace.findUnique({ where: { slug: 'personal-one' } });
  await assert.rejects(db.$executeRawUnsafe('INSERT INTO "workspace_memberships" ("id","uid","workspaceId","role","source","updatedAt") VALUES ($1,$2,$3,\'UNKNOWN\',\'test\',now())', 'bad', 'personal', workspace.id),
    (error) => error.meta?.code === '22P02');
});
test('PostgreSQL prevents duplicate account-wide consent versions despite NULL resourceId', async () => {
  const data = { uid: 'personal', purpose: 'synthetic', version: 'policy-1', consentVersion: 'v1' };
  await db.consentGrant.create({ data });
  await assert.rejects(db.consentGrant.create({ data }), (e) => e.code === 'P2002');
});
test('PostgreSQL retains erasure anchors and rejects invalid command revisions', async () => {
  await db.person.create({ data: { uid: 'erased' } });
  await db.deletionTombstone.create({ data: { uid: 'erased', resourceType: 'workspace', resourceId: 'erased-ws' } });
  await assert.rejects(db.person.delete({ where: { uid: 'erased' } }), (e) => e.code === 'P2003');
  await assert.rejects(db.commandResult.create({ data: { uid: 'personal', commandId: 'zero-revision', kind: 'synthetic', payloadDigest: 'hash', revision: 0 } }));
});
test('PostgreSQL enforces membership and command workspace foreign keys', async () => {
  await assert.rejects(db.workspaceMembership.create({ data: { uid: 'personal', workspaceId: 'absent', role: 'MEMBER', source: 'synthetic' } }), (e) => e.code === 'P2003');
  await assert.rejects(db.commandResult.create({ data: { uid: 'personal', workspaceId: 'absent', commandId: 'bad-workspace', kind: 'synthetic', payloadDigest: 'hash' } }), (e) => e.code === 'P2003');
});
