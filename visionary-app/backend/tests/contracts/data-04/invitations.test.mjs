// DATA-04 — invitations, acceptance, verified roles, lifecycle history.
// A role picker, email match, guessed ID or browser record can never
// establish permission. Membership is only created server-side from an
// accepted, unexpired one-time token. These tests verify that invariant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));
const { InvitationService } = req('./dist/src/invitations/invitation.service.js');
const { InMemoryInvitationStore } = req('./dist/src/invitations/invitation-store.js');

function setup() {
  const s = new InMemoryInvitationStore();
  const svc = new InvitationService(s, { now: () => new Date('2026-10-25T10:00:00Z') });
  return { s, svc };
}

// Seed an OWNER membership so test issuers are verified actors.
async function seedOwner(s, workspaceId, uid) {
  await s.setMembership(workspaceId, uid, 'OWNER');
}

test('owner issues a valid invite; email remains a delivery hint; no membership until accept', async () => {
  const { s, svc } = setup();
  await seedOwner(s, 'ws-1', 'alice');
  const issue = await svc.invite('alice', 'ws-1', { email: 'BOB@Example.com', role: 'MEMBER' });
  assert.match(issue.invitationId, /^inv_/);
  assert.ok(issue.token.length >= 32, 'one-time token is long');
  // No membership yet — email match is not authority.
  assert.equal(await svc.role('ws-1', 'bob', 'MEMBER'), false);
  // No plaintext token is ever stored; only the hash.
  const stored = await s.findById(issue.invitationId);
  assert.ok(stored.tokenHash.length === 64);
  assert.equal(stored.tokenHash === issue.token, false);
  assert.ok(!('tokenHash' in stored === false), 'hash field retained internally for lookup');
});

test('accept binds the authenticated uid, not the email; token is one-time', async () => {
  const { s, svc } = setup();
  await seedOwner(s, 'ws-1', 'alice');
  const issue = await svc.invite('alice', 'ws-1', { email: 'carl@x.org', role: 'MEMBER' });
  await svc.accept('carl', issue.token);
  assert.equal(await svc.role('ws-1', 'carl', 'MEMBER'), true);
  // A different uid presenting the same token fails.
  await assert.rejects(svc.accept('mallory', issue.token));
  // Replay by the same accepted uid fails too (one-time).
  await assert.rejects(svc.accept('carl', issue.token));
});

test('a guessed ID alone never establishes permission', async () => {
  const { s, svc } = setup();
  await seedOwner(s, 'ws-1', 'alice');
  const issue = await svc.invite('alice', 'ws-1', { email: 'dora@x.org', role: 'MEMBER' });
  await assert.rejects(svc.accept('dora', 'wrong-token-' + issue.invitationId));
  // And accepting with an empty token never matches.
  await assert.rejects(svc.accept('dora', ''));
});

test('actor without ADMIN cannot issue; non-member cannot list/track', async () => {
  const { svc } = setup();
  const s = new InMemoryInvitationStore();
  const svc2 = new InvitationService(s, { now: () => new Date('2026-10-25T10:00:00Z') });
  await seedOwner(s, 'ws-1', 'alice');
  await assert.rejects(svc2.invite('bob', 'ws-1', { email: 'x@x.org', role: 'MEMBER' }));
  await assert.rejects(svc2.list('bob', 'ws-1'));
  const rows = await svc2.list('alice', 'ws-1');
  assert.equal(rows.length, 0);
  void svc;
});

test('role picker cannot raise privilege: only MEMBER/ADMIN issue roles', async () => {
  const { s, svc } = setup();
  await seedOwner(s, 'ws-1', 'alice');
  await assert.rejects(svc.invite('alice', 'ws-1', { email: 'e@x.org', role: 'OWNER' }));
  await assert.rejects(svc.invite('alice', 'ws-1', { email: 'f@x.org', role: 'GUEST' }));
  const issue = await svc.invite('alice', 'ws-1', { email: 'g@x.org', role: 'ADMIN' });
  await svc.accept('g', issue.token);
  // Accepted role is the invited role; the accepter cannot choose another.
  assert.equal(await svc.role('ws-1', 'g', 'ADMIN'), true);
  assert.equal(await svc.role('ws-1', 'g', 'OWNER'), false);
});

test('expired token cannot be accepted', async () => {
  const { s } = setup();
  const fixed = new InvitationService(s, { now: () => new Date('2026-10-25T10:00:00Z') });
  await seedOwner(s, 'ws-1', 'alice');
  const issue = await fixed.invite('alice', 'ws-1', { email: 'h@x.org', role: 'MEMBER', expiresInSeconds: 60 });
  // The minimum expiry bound is 60s; advance past it and accept on a clock that sees it expired.
  const late = new InvitationService(s, { now: () => new Date('2026-10-25T10:02:00Z') });
  await assert.rejects(late.accept('h', issue.token));
});

test('revoke by ADMIN/OWNER only; revoked cannot be accepted', async () => {
  const { s, svc } = setup();
  await seedOwner(s, 'ws-1', 'alice');
  const issue = await svc.invite('alice', 'ws-1', { email: 'k@x.org', role: 'MEMBER' });
  await assert.rejects(svc.revoke('mallory', issue.invitationId));
  await svc.revoke('alice', issue.invitationId);
  await assert.rejects(svc.accept('k', issue.token));
});

test('lifecycle history is append-only and complete', async () => {
  const { s, svc } = setup();
  await seedOwner(s, 'ws-1', 'alice');
  const issue = await svc.invite('alice', 'ws-1', { email: 'l@x.org', role: 'MEMBER' });
  await svc.revoke('alice', issue.invitationId);
  // Acceptance on revoked fails before rewriting history.
  await assert.rejects(svc.accept('l', issue.token));
  const events = await svc.track('alice', issue.invitationId);
  assert.equal(events.length, 2);
  assert.equal(events[0].to, 'pending');
  assert.equal(events[1].to, 'revoked');
  assert.equal(events[1].actorId, 'alice');
  // History read requires membership.
  await assert.rejects(svc.track('mallory', issue.invitationId));
});

test('acceptance returns the invite lifecycle view and grants invited role', async () => {
  const { s, svc } = setup();
  await seedOwner(s, 'ws-1', 'alice');
  const issue = await svc.invite('alice', 'ws-1', { email: 'm@x.org', role: 'MEMBER' });
  const view = await svc.accept('m', issue.token);
  assert.equal(view.status, 'accepted');
  assert.equal(view.acceptedBy, 'm');
  assert.equal(view.role, 'MEMBER');
  const events = await svc.track('m', issue.invitationId);
  assert.equal(events.length, 2);
  assert.equal(events.at(-1).to, 'accepted');
});
