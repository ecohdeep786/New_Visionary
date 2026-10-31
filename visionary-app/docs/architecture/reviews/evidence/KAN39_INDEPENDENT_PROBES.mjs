// Independent KAN-39 unsafe-outcome reproductions. These passing assertions prove defects,
// not product acceptance. No candidate source or protected records are modified.
import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const candidate = 'a93cc508bb1a929247276bdd0a3a01c77e2cec6b';
const sourceRoot = resolve(process.env.KAN39_SOURCE_ROOT || '');
assert.ok(process.env.KAN39_SOURCE_ROOT, 'Set KAN39_SOURCE_ROOT to the candidate visionary-app');
const git = (...args) => execFileSync('git', ['-C', sourceRoot, ...args], { encoding: 'utf8' }).trim();
assert.equal(git('rev-parse', 'HEAD'), candidate);
for (const filename of ['invitation-types.ts', 'invitation-store.ts', 'invitation.service.ts']) {
  const path = 'backend/upstream/backend/src/invitations/' + filename;
  const expected = execFileSync('git', ['-C', sourceRoot, 'show', candidate + ':visionary-app/' + path]);
  assert.deepEqual(readFileSync(resolve(sourceRoot, path)), expected, 'Actual imported bytes must match exact candidate: ' + filename);
}
const { InvitationService } = await import(pathToFileURL(resolve(sourceRoot, 'backend/upstream/backend/src/invitations/invitation.service.ts')).href);
const { InMemoryInvitationStore } = await import(pathToFileURL(resolve(sourceRoot, 'backend/upstream/backend/src/invitations/invitation-store.ts')).href);
function service(store) { return new InvitationService(store, { now: () => new Date('2026-10-31T08:00:00Z') }); }
async function fixture(store = new InMemoryInvitationStore()) {
  await store.setMembership('ws-review', 'owner-review', 'OWNER');
  const svc = service(store);
  const invite = await svc.invite('owner-review', 'ws-review', { email: 'synthetic@example.invalid', role: 'MEMBER' });
  return { store, svc, invite };
}

test('R1 reproduced: one one-time token grants membership to two simultaneous UIDs', async () => {
  const { store, svc, invite } = await fixture();
  const results = await Promise.allSettled([svc.accept('uid-a', invite.token), svc.accept('uid-b', invite.token)]);
  assert.deepEqual(results.map(x => x.status), ['fulfilled', 'fulfilled']);
  assert.equal(await svc.role('ws-review', 'uid-a', 'MEMBER'), true);
  assert.equal(await svc.role('ws-review', 'uid-b', 'MEMBER'), true);
  assert.equal((await store.events(invite.invitationId)).filter(x => x.to === 'accepted').length, 2);
});

test('R2 reproduced: acceptance can grant after revocation completed', async () => {
  let release;
  let captured;
  const blocked = new Promise(r => { release = r; });
  const read = new Promise(r => { captured = r; });
  class ScheduledStore extends InMemoryInvitationStore {
    async findByTokenHash(hash) {
      const original = await super.findByTokenHash(hash);
      captured();
      await blocked;
      return original;
    }
  }
  const { store, svc, invite } = await fixture(new ScheduledStore());
  const acceptance = svc.accept('uid-after-revoke', invite.token);
  await read;
  await svc.revoke('owner-review', invite.invitationId);
  release();
  await acceptance;
  const persisted = await store.findById(invite.invitationId);
  assert.equal(persisted.status, 'accepted');
  assert.ok(persisted.revokedAt);
  assert.equal(await svc.role('ws-review', 'uid-after-revoke', 'MEMBER'), true);
  assert.deepEqual((await store.events(invite.invitationId)).map(x => x.to), ['pending', 'revoked', 'accepted']);
});

test('R3 reproduced: membership failure consumes token and prevents recovery', async () => {
  const { store, svc, invite } = await fixture();
  const original = store.setMembership.bind(store);
  store.setMembership = async () => { throw new Error('synthetic membership write unavailable'); };
  await assert.rejects(svc.accept('uid-outage', invite.token), /synthetic membership write unavailable/);
  store.setMembership = original;
  assert.equal((await store.findById(invite.invitationId)).status, 'accepted');
  assert.equal(await svc.role('ws-review', 'uid-outage', 'MEMBER'), false);
  await assert.rejects(svc.accept('uid-outage', invite.token), e => e.code === 'already_accepted');
  assert.equal((await store.events(invite.invitationId)).filter(x => x.to === 'accepted').length, 0);
});

test('R4 reproduced: invite acceptance overwrites an existing OWNER with MEMBER', async () => {
  const { svc, invite } = await fixture();
  await svc.accept('owner-review', invite.token);
  assert.equal(await svc.role('ws-review', 'owner-review', 'OWNER'), false);
  assert.equal(await svc.role('ws-review', 'owner-review', 'ADMIN'), false);
  assert.equal(await svc.role('ws-review', 'owner-review', 'MEMBER'), true);
  await assert.rejects(svc.invite('owner-review', 'ws-review', { email: 'another@example.invalid', role: 'MEMBER' }), e => e.code === 'unauthorized');
});

test('R5 observation: removing issuer authority does not invalidate pending acceptance', async () => {
  const { store, svc, invite } = await fixture();
  store.memberships.delete('owner-review');
  assert.equal(await svc.role('ws-review', 'owner-review', 'ADMIN'), false);
  await svc.accept('uid-after-owner-removal', invite.token);
  assert.equal(await svc.role('ws-review', 'uid-after-owner-removal', 'MEMBER'), true);
});

