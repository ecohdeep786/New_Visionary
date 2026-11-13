import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fixture from '../data-02/postgres-fixture.cjs';
const { req, backend, stagingDatabase } = fixture;
const { MigrationRunner } = req('./dist/src/data/migration-runner.js');
const { canonicalMigrations } = req('./dist/src/data/migration-registry.js');
const { PostgresOverviewStore } = req('./dist/src/overview/postgres-overview.store.js');
const { OverviewService } = req('./dist/src/overview/overview.service.js');
let f, target, store, service;
const account = async () => ({ profile: { displayName: 'Synthetic', emailHint: null }, billing: null, redacted: [] });
before(async () => {
  f = await stagingDatabase();
  await new MigrationRunner(f.store(), canonicalMigrations(backend)).applyAll(); await f.grantRuntime();
  target = { role: f.runtimeRole, schema: f.schema, database: new URL(f.config.runtimeUrl).pathname.slice(1) };
  store = new PostgresOverviewStore(f.runtime, target, account); service = new OverviewService(store);
});
after(async () => { if (f) await f.close(); });
async function setup() {
  const suffix = randomUUID().replaceAll('-', ''), owner = 'owner_' + suffix, member = 'member_' + suffix, other = 'other_' + suffix;
  await f.db.person.createMany({ data: [owner, member, other].map(uid => ({ uid })) });
  const w = await f.db.workspace.create({ data: { uid: owner, name: 'Synthetic workspace', slug: suffix } });
  await f.db.workspaceMembership.create({ data: { uid: member, workspaceId: w.id, role: 'MEMBER', source: 'invitation' } });
  return { owner, member, other, w };
}

test('SQL uses current viewer role and reflects downgrade/removal/erasure without cached permission', async () => {
  const x = await setup();
  assert.equal((await service.workspaces(x.owner)).items[0].role, 'OWNER');
  assert.equal((await service.workspaces(x.member)).items[0].role, 'MEMBER');
  assert.equal((await service.workspaces(x.other)).items.length, 0);
  await f.db.workspaceMembership.update({ where: { uid_workspaceId: { uid: x.member, workspaceId: x.w.id } }, data: { role: 'GUEST' } });
  assert.equal(await store.workspaceRole(x.member, x.w.id), 'GUEST');
  await f.db.workspaceMembership.delete({ where: { uid_workspaceId: { uid: x.member, workspaceId: x.w.id } } });
  assert.equal((await service.workspaces(x.member)).items.length, 0);
  await f.db.deletionTombstone.create({ data: { uid: x.other, resourceType: 'workspace', resourceId: x.w.id } });
  assert.equal((await service.workspaces(x.owner)).items.length, 0);
});

test('SQL pages select only public columns, traverse >50 rows and reject foreign cursors', async () => {
  const x = await setup(), now = new Date();
  await f.db.commandResult.createMany({ data: Array.from({ length: 125 }, (_, i) => ({
    id: 'r_' + x.owner + '_' + String(i).padStart(3, '0'), uid: x.owner, commandId: randomUUID(), kind: 'workspace.metadata.rename',
    workspaceId: x.w.id, payloadDigest: 'a'.repeat(64), status: 'COMMITTED', resultJson: { secret: 'private_marker' }, error: 'private_marker', committedAt: now,
  })) });
  const ids = []; let cursor;
  do { const page = await service.history(x.owner, cursor, 50); ids.push(...page.items.map(r => r.id));
    assert.equal(JSON.stringify(page).includes('private_marker'), false); assert.ok(page.items.length <= 50); cursor = page.nextCursor?.value;
  } while (cursor);
  assert.equal(ids.length, 125); assert.equal(new Set(ids).size, 125);
  assert.equal((await service.history(x.other, ids[0])).items.length, 0);
  assert.equal((await service.history(x.owner, 'missing_cursor')).items.length, 0);
  await f.db.deletionTombstone.create({ data: { uid: x.owner, resourceType: 'person', resourceId: x.owner } });
  await assert.rejects(service.history(x.owner), e => e.code === 'unauthorized');
});

test('SQL consent state derives from current expiry/revocation and audit excludes network fields', async () => {
  const x = await setup();
  await f.db.consentGrant.createMany({ data: [
    { uid: x.owner, purpose: 'expired', version: 'v1', consentVersion: 'v1', expiresAt: new Date('2000-01-01') },
    { uid: x.owner, purpose: 'revoked', version: 'v1', consentVersion: 'v1', revokedAt: new Date() },
    { uid: x.owner, purpose: 'active', version: 'v1', consentVersion: 'v1' },
  ] });
  await f.db.auditEvent.create({ data: { uid: x.owner, operation: 'save', actorType: 'user', resourceType: 'workspace', resourceId: x.w.id,
    workspaceId: x.w.id, outcome: 'SUCCESS', ip: 'private_marker', userAgent: 'private_marker' } });
  const consents = (await service.consents(x.owner)).items;
  for (const row of consents) assert.equal(row.state, row.purpose);
  assert.equal(JSON.stringify(await service.audit(x.owner)).includes('private_marker'), false);
  await f.db.deletionTombstone.create({ data: { uid: x.owner, resourceType: 'workspace', resourceId: x.w.id } });
  assert.equal((await service.audit(x.owner)).items.length, 0);
});

test('privileged/wrong-schema runtime is denied and connection failure returns no partial overview', async () => {
  const x = await setup();
  await assert.rejects(new OverviewService(new PostgresOverviewStore(f.db, target, account)).overview(x.owner), /overview_runtime_unavailable/);
  await assert.rejects(new PostgresOverviewStore(f.runtime, { ...target, schema: 'wrong' }, account).auditRows(x.owner, null, 20), /overview_runtime_unavailable/);
  await f.admin.$executeRawUnsafe('GRANT CREATE ON SCHEMA "' + f.schema + '" TO "' + f.runtimeRole + '"');
  await assert.rejects(store.auditRows(x.owner, null, 20), /overview_runtime_unavailable/);
  await f.admin.$executeRawUnsafe('REVOKE CREATE ON SCHEMA "' + f.schema + '" FROM "' + f.runtimeRole + '"');
  assert.equal((await service.overview(x.owner)).uid, x.owner);
});
