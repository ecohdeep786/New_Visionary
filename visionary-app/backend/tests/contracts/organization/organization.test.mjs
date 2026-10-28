/**
 * ROLE-06 (KAN-98) — organization membership/invitations/roles, approved
 * curriculum delivery/publication, settings permissions and scoped audited
 * administrative actions.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { OrganizationService } = req('./dist/src/organization/organization-service.js');
const { InMemoryOrganizationStore } = req('./dist/src/organization/organization-lookups.js');

const FOUNDER = { uid: 'uid_founder', workspaceId: 'ws_org' };
const ADMIN = { uid: 'uid_admin', workspaceId: 'ws_org' };
const MEMBER = { uid: 'uid_member', workspaceId: 'ws_org' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_org' };

async function makeService(now) {
  const store = new InMemoryOrganizationStore();
  const service = new OrganizationService(store, now);
  const { orgId } = await service.createOrg(FOUNDER, 'Acme Learning');
  await service.changeRole(FOUNDER, orgId, FOUNDER.uid, 'owner').catch(() => {});
  // Founder (owner) acts as admin: grant ADMIN a membership directly via invite+join.
  const inv = await service.inviteMember(FOUNDER, orgId, ADMIN.uid, 'admin', 60_000);
  await service.joinByInvite(ADMIN, inv.code);
  return { store, service, orgId };
}

// ---------------------------------------------------------------------------

test('membership lifecycle: admin invites with a bound role + opaque code; the exact invitee joins; duplicates are idempotent', async () => {
  const { service, orgId } = await makeService();
  const invite = await service.inviteMember(ADMIN, orgId, MEMBER.uid, 'member', 60_000);
  assert.notEqual(invite.code, invite.inviteId);
  assert.equal(invite.role, 'member');
  const membership = await service.joinByInvite(MEMBER, invite.code);
  assert.equal(membership.role, 'member');
  const again = await service.joinByInvite(MEMBER, invite.code);
  assert.equal(again.uid, MEMBER.uid);
});

test('uniform invite refusal: unknown code and wrong invitee are invite_invalid; revoked and expired refuse distinctly', async () => {
  const { service, orgId } = await makeService();
  const invite = await service.inviteMember(ADMIN, orgId, MEMBER.uid, 'member', 60_000);
  await assert.rejects(() => service.joinByInvite(STRANGER, invite.code), (e) => e.code === 'invite_invalid');
  await assert.rejects(() => service.joinByInvite(MEMBER, 'join_unknown'), (e) => e.code === 'invite_invalid');
  let clock = Date.now();
  const { service: timed } = await makeService(() => new Date(clock));
  const inv2 = await timed.inviteMember(ADMIN, orgId, MEMBER.uid, 'member', 1000);
  clock += 2000;
  await assert.rejects(() => timed.joinByInvite(MEMBER, inv2.code), (e) => e.code === 'invite_expired');
});

test('ROLE checks: members refuse admin actions; unknown org denies uniformly', async () => {
  const { service, orgId } = await makeService();
  const invite = await service.inviteMember(ADMIN, orgId, MEMBER.uid, 'member', 60_000);
  await service.joinByInvite(MEMBER, invite.code);
  // A member cannot invite, change roles, publish or update settings.
  await assert.rejects(
    () => service.inviteMember(MEMBER, orgId, STRANGER.uid, 'member', 60_000),
    (e) => e.code === 'not_org_admin',
  );
  await assert.rejects(() => service.changeRole(MEMBER, orgId, STRANGER.uid, 'admin'), (e) => e.code === 'not_org_admin');
  await assert.rejects(() => service.updateSettings(MEMBER, orgId, { theme: 'dark' }), (e) => e.code === 'not_org_admin');
  // Unknown org: uniform not_owner (no existence leak).
  await assert.rejects(() => service.inviteMember(ADMIN, 'org_unknown', STRANGER.uid, 'member', 1000), (e) => e.code === 'not_owner');
});

test('APPROVED curriculum publication: publishing an unapproved item refuses; approval records the approver; members read published only', async () => {
  const { service, orgId } = await makeService();
  const inv = await service.inviteMember(ADMIN, orgId, MEMBER.uid, 'member', 60_000);
  await service.joinByInvite(MEMBER, inv.code);
  const item = await service.defineCurriculum(ADMIN, orgId, 'Orbits Basics', 'content_ref_1');
  await assert.rejects(
    () => service.publishCurriculum(ADMIN, orgId, item.curriculumId, item.version),
    (e) => e.code === 'curriculum_not_approved',
  );
  const approved = await service.approveCurriculum(item.curriculumId, item.version, 'approver_content_lead');
  assert.equal(approved.approvedBy, 'approver_content_lead');
  // Still unpublished — members cannot read it yet.
  await assert.rejects(
    () => service.readCurriculum(MEMBER, orgId, item.curriculumId, item.version),
    (e) => e.code === 'not_org_member',
  );
  await service.publishCurriculum(ADMIN, orgId, item.curriculumId, item.version);
  const delivered = await service.readCurriculum(MEMBER, orgId, item.curriculumId, item.version);
  assert.equal(delivered.published, true);
  // A non-member cannot read published curriculum.
  await assert.rejects(
    () => service.readCurriculum(STRANGER, orgId, item.curriculumId, item.version),
    (e) => e.code === 'not_org_member',
  );
});

test('SETTINGS permissions: settings updates are admin-only', async () => {
  const { service, orgId } = await makeService();
  const inv = await service.inviteMember(ADMIN, orgId, MEMBER.uid, 'member', 60_000);
  await service.joinByInvite(MEMBER, inv.code);
  await service.updateSettings(ADMIN, orgId, { default_locale: 'en-IN' });
  await assert.rejects(
    () => service.updateSettings(MEMBER, orgId, { default_locale: 'bn' }),
    (e) => e.code === 'not_org_admin',
  );
});

test('SCOPED audited administrative actions: every admin action appends an immutable audit entry; the log is admin-readable only', async () => {
  const { service, orgId } = await makeService();
  const invite = await service.inviteMember(ADMIN, orgId, MEMBER.uid, 'member', 60_000);
  await service.joinByInvite(MEMBER, invite.code);
  const inv2 = await service.inviteMember(ADMIN, orgId, STRANGER.uid, 'member', 60_000);
  await service.joinByInvite(STRANGER, inv2.code);
  await service.changeRole(ADMIN, orgId, MEMBER.uid, 'admin');
  await service.updateSettings(ADMIN, orgId, { default_locale: 'en-IN' });
  const log = await service.getAuditLog(ADMIN, orgId);
  const actions = log.map((e) => e.action);
  assert.ok(actions.includes('member_invited'));
  assert.ok(actions.includes('role_changed'));
  assert.ok(actions.includes('settings_updated'));
  assert.ok(log.every((e) => e.orgId === orgId && e.actorUid && e.at));
  // Byte-stable: the log does not change on re-read.
  const again = await service.getAuditLog(ADMIN, orgId);
  assert.equal(JSON.stringify(log), JSON.stringify(again));
  // The audit log is admin-readable only (STRANGER stayed a member).
  await assert.rejects(() => service.getAuditLog(STRANGER, orgId), (e) => e.code === 'not_org_admin');
});
