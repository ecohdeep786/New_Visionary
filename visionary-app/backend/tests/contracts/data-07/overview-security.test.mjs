import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../upstream/backend/package.json', import.meta.url));
const { OverviewService } = require('./dist/src/overview/overview.service.js');
const { InMemoryOverviewStore } = require('./dist/src/overview/overview-store.js');
const date = '2026-11-07T00:00:00Z';
const workspace = id => ({ id, name: 'Shared', slug: id, isPersonal: false, role: 'OWNER', source: 'direct', sourceVersion: '1', createdByUid: 'owner', createdAt: date, updatedAt: date });
const membership = id => ({ id, uid: 'member', workspaceId: id, role: 'MEMBER', sourceVersion: '1', purpose: null, consentVersion: null, joinedAt: date });
const consent = id => ({ id, uid: 'owner', purpose: 'sharing', resourceId: null, consentVersion: '1', state: 'active', grantedAt: date, expiresAt: null, revokedAt: null });
const command = id => ({ id, uid: 'owner', commandId: id, kind: 'save', workspaceId: null, status: 'COMMITTED', revision: 1, attemptedAt: date, committedAt: date, error: null, hasResult: true });
const audit = id => ({ id, uid: 'owner', operation: 'save', outcome: 'SUCCESS', resourceType: 'project', resourceId: null, createdAt: date });

test('real extra store columns and nested account credentials never enter any public DTO', async () => {
  const store = new InMemoryOverviewStore(), service = new OverviewService(store);
  const secret = { refreshToken: 'secret_credential', sessionId: 'secret_session', observedIp: 'secret_network', userAgent: 'secret_agent', resultJson: { input: 'secret_input' } };
  store.seedAccount({ uid: 'owner', profile: { displayName: 'Owner', emailHint: null, ...secret }, billing: { plan: 'free', currency: 'INR', status: 'active', ...secret }, redacted: ['secret_redacted'] });
  store.seedWorkspace({ ...workspace('ws'), ...secret }, 'owner');
  store.seedMembership({ ...membership('ws'), uid: 'owner', ...secret });
  store.seedConsent({ ...consent('grant'), ...secret });
  store.pushCommand({ ...command('cmd'), error: 'secret_error includes private text', ...secret });
  store.pushAudit({ ...audit('audit'), ...secret });
  const result = await service.overview('owner');
  assert.equal(JSON.stringify(result).includes('secret_'), false);
  assert.equal(JSON.stringify(await service.history('owner')).includes('secret_'), false);
  assert.equal(JSON.stringify(await service.audit('owner')).includes('secret_'), false);
  assert.equal(result.history.items[0].hasResult, true);
  assert.equal(result.history.items[0].error, 'unavailable');
  assert.deepEqual(Object.keys(result.profile).sort(), ['displayName', 'emailHint']);
});

test('workspace role follows current viewer membership, including downgrade and removal', async () => {
  const store = new InMemoryOverviewStore(), service = new OverviewService(store);
  store.seedWorkspace(workspace('ws'), 'owner'); store.seedMembership(membership('ws'));
  assert.equal((await service.workspaces('member')).items[0].role, 'MEMBER');
  store.seedMembership({ ...membership('ws'), role: 'GUEST' });
  assert.equal((await service.workspaces('member')).items[0].role, 'GUEST');
  assert.equal((await service.workspaces('owner')).items[0].role, 'OWNER');
  store.memberships.delete('member:ws');
  assert.equal((await service.workspaces('member')).items.length, 0);
  assert.equal(await store.workspaceRole('member', 'ws'), null);
});

test('objects substituted into scalar account fields fail closed rather than leaking nested credentials', async () => {
  const store = new InMemoryOverviewStore(), service = new OverviewService(store);
  store.seedAccount({ uid: 'owner', profile: { displayName: { refreshToken: 'private_marker' }, emailHint: null }, billing: null });
  await assert.rejects(service.overview('owner'), /invalid_projection/);
});

for (const kind of ['workspaces', 'memberships', 'consents', 'history', 'audit']) {
  test(`${kind}: complete 125-row traversal is bounded, owner scoped and stable on tied timestamps`, async () => {
    const store = new InMemoryOverviewStore(), service = new OverviewService(store);
    for (let i = 124; i >= 0; i--) {
      const id = 'row_' + String(i).padStart(3, '0');
      store.seedWorkspace(workspace(id), 'owner'); store.seedMembership({ ...membership(id), uid: 'owner' });
      store.seedConsent(consent(id)); store.pushCommand(command(id)); store.pushAudit(audit(id));
    }
    const initial = await service.overview('owner');
    assert.equal(initial[kind].items.length, 20);
    const ids = []; let cursor;
    do {
      const page = await service[kind]('owner', cursor, 50);
      assert.ok(page.items.length <= 50); ids.push(...page.items.map(r => r.id));
      cursor = page.nextCursor?.value;
    } while (cursor);
    assert.equal(ids.length, 125); assert.equal(new Set(ids).size, 125);
    assert.deepEqual(ids, [...ids].sort());
    assert.equal((await service[kind]('stranger')).items.length, 0);
    assert.equal((await service[kind]('stranger', ids[0])).items.length, 0);
  });
  test(`${kind}: invalid inputs fail before store access`, async () => {
    const service = new OverviewService(new Proxy({}, { get() { throw Error('store must not be reached'); } }));
    for (const value of [null, 0, -1, 51, 1.1, NaN, Infinity, '9'.repeat(400), '51', '01', [], {}]) {
      await assert.rejects(service[kind]('owner', undefined, value), e => e.code === 'invalid_page');
    }
    for (const uid of ['', ' ', 'x'.repeat(129), 'uid\n', null, undefined]) {
      await assert.rejects(service[kind](uid), e => e.code === 'unauthorized');
    }
    await assert.rejects(service[kind]('owner', 'not a cursor'), e => e.code === 'invalid_cursor');
  });
}
