import test from 'node:test';
import assert from 'node:assert/strict';
import { createConsentClient } from '../src/services/consentClient.js';
const grant = { id: 'grant-one', purpose: 'downloads', resourceId: null, consentVersion: 'policy-v1', state: 'active', grantedAt: '2026-11-01T00:00:00.000Z', expiresAt: null, revokedAt: null };
const page = () => ({ version: 1, uid: 'subject', available: true, grants: [grant], nextCursor: null });
test('consent client sends the current account and only the selected grant, requiring a committed receipt', async () => {
  const calls = [];
  const client = createConsentClient({ getAccountId: () => 'subject', request: async (path, options) => {
    calls.push({ path, options }); options.beforeSend();
    return path === '/revoke' ? { version: 1, uid: 'subject', id: options.body.grantId, revokedAt: '2026-11-06T00:00:00.000Z' } : page();
  } });
  assert.equal((await client.list()).grants[0].id, grant.id);
  assert.equal((await client.revoke(grant.id)).id, grant.id);
  assert.equal(calls[1].options.accountId, 'subject');
  assert.deepEqual(calls[1].options.body, { grantId: grant.id });
  assert.equal(calls[1].options.method, 'POST');
});
test('account switches fence a pending consent response and a queued mutation before send', async () => {
  let uid = 'subject';
  const reader = createConsentClient({ getAccountId: () => uid, request: async () => { uid = 'other'; return page(); } });
  await assert.rejects(reader.list(), { status: 409 });
  uid = 'subject'; let sent = false;
  const writer = createConsentClient({ getAccountId: () => uid, request: async (_path, options) => { uid = 'other'; options.beforeSend(); sent = true; } });
  await assert.rejects(writer.revoke(grant.id), { status: 409 }); assert.equal(sent, false);
});
test('foreign, malformed and contradictory consent responses never report success', async () => {
  for (const value of [{ ...page(), uid: 'other' }, { ...page(), grants: Array(21).fill(grant) },
    { ...page(), available: false }, { ...page(), grants: [{ ...grant, state: 'revoked' }] },
    { ...page(), grants: [{ ...grant, grantedAt: 'invalid' }] }]) {
    await assert.rejects(createConsentClient({ getAccountId: () => 'subject', request: async () => value }).list());
  }
  await assert.rejects(createConsentClient({ getAccountId: () => 'subject', request: async () => ({ version: 1, uid: 'subject', id: 'foreign', revokedAt: '2026-11-06T00:00:00.000Z' }) }).revoke(grant.id));
});
test('consent outages remain errors and pagination is encoded without changing account authority', async () => {
  await assert.rejects(createConsentClient({ getAccountId: () => 'subject', request: async () => { throw Object.assign(Error('outage'), { status: 503 }); } }).revoke(grant.id), { status: 503 });
  const paths = [];
  const client = createConsentClient({ getAccountId: () => 'subject', request: async path => { paths.push(path); return page(); } });
  await client.list('signed+cursor/with?separator');
  assert.equal(paths[0], '?cursor=signed%2Bcursor%2Fwith%3Fseparator');
});
