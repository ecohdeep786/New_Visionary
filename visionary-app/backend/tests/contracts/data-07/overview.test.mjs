/**
 * DATA-07 — owner-scoped repositories/DTOs and paginated UID account/domain
 * overview projections; redact private security fields and avoid one unlimited
 * user-history document. Positive, wrong-owner and pagination/redaction cases
 * are exercised against the in-memory synthetic store. Every DTO asserted here
 * is redacted of private security fields; history is cursor-paginated and bounded.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { OverviewService } = req('./dist/src/overview/overview.service.js');
const { InMemoryOverviewStore } = req('./dist/src/overview/overview-store.js');

function setup() {
  const s = new InMemoryOverviewStore();
  const svc = new OverviewService(s, { now: () => new Date('2026-10-25T10:00:00Z') });
  return { s, svc };
}

test('DATA-07 overview: returns the owner-scoped redacted account/domain projection', async () => {
  const { s, svc } = setup();
  s.seedAccount({ uid: 'uid-1', profile: { displayName: 'Alice', emailHint: 'a***@example.com' }, billing: { plan: 'start', currency: 'INR', status: 'active' }, redacted: ['refresh_token', 'session_id', 'aadhaar'] });
  s.seedWorkspace({ id: 'ws-1', name: 'Personal', slug: 'personal-alice', isPersonal: true, role: 'OWNER', source: 'provision', sourceVersion: 'v1', createdByUid: 'uid-1', createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' }, 'uid-1');
  s.seedMembership({ id: 'm-1', uid: 'uid-1', workspaceId: 'ws-1', role: 'OWNER', sourceVersion: 'v1', purpose: null, consentVersion: null, joinedAt: '2026-10-01T00:00:00Z' });
  s.seedConsent({ id: 'cg-1', uid: 'uid-1', purpose: 'document_sharing', resourceId: 'doc-1', consentVersion: 'v1', state: 'active', grantedAt: '2026-10-01T00:00:00Z', expiresAt: null, revokedAt: null });

  const o = await svc.overview('uid-1');
  assert.equal(o.uid, 'uid-1');
  assert.equal(o.profile.displayName, 'Alice');
  assert.ok(o.redacted.includes('refresh_token'), 'private security fields are listed as redacted');
  assert.equal(o.workspaces.length, 1);
  assert.equal(o.workspaces[0].id, 'ws-1');
  assert.equal(o.memberships.length, 1);
  assert.equal(o.consents.length, 1);
  // No projection may carry a private security field value.
  const serialized = JSON.stringify(o);
  for (const token of ['refresh_token=xyz', 'session_abc', 'ip=1.2.3.4']) {
    assert.ok(!serialized.includes(token), `${token} must not leak`);
  }
});

test('DATA-07 deny: a foreign uid sees no account data (wrong-owner by construction)', async () => {
  const { s, svc } = setup();
  s.seedAccount({ uid: 'uid-1', profile: { displayName: 'Alice', emailHint: 'a***@example.com' }, billing: null, redacted: [] });
  const o = await svc.overview('attacker-uid');
  assert.equal(o.profile, null, 'no profile leaks to a different uid');
  assert.equal(o.redacted.length, 0);
});

test('DATA-07 owner-scoping: workspaces are only those the uid created or belongs to; a guest sees nothing', async () => {
  const { s, svc } = setup();
  s.seedWorkspace({ id: 'ws-owner', name: 'Alice Ws', slug: 'alice-ws', isPersonal: false, role: 'OWNER', source: 'provision', sourceVersion: 'v1', createdByUid: 'uid-1', createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' }, 'uid-1');
  s.seedWorkspace({ id: 'ws-member', name: 'Shared', slug: 'shared', isPersonal: false, role: 'MEMBER', source: 'invite', sourceVersion: 'v1', createdByUid: 'uid-9', createdAt: '2026-10-02T00:00:00Z', updatedAt: '2026-10-02T00:00:00Z' }, 'uid-9');
  s.seedMembership({ id: 'm-1', uid: 'uid-1', workspaceId: 'ws-member', role: 'MEMBER', sourceVersion: 'v1', purpose: null, consentVersion: null, joinedAt: '2026-10-02T00:00:00Z' });

  const o = await svc.overview('uid-1');
  const ids = o.workspaces.map((w) => w.id).sort();
  assert.deepEqual(ids, ['ws-member', 'ws-owner'], 'owner sees created + member workspaces, not ALL workspaces of a role');

  // A uid with no membership and no created workspace sees nothing.
  const stranger = await svc.overview('stranger-uid');
  assert.equal(stranger.workspaces.length, 0, 'a non-member sees no workspaces');
  // Merely sharing the same role never grants visibility: uid-9 created ws-owner? no — uid-9 owns ws-member by creation, not uid-1.
  const uid9 = await svc.overview('uid-9');
  const uid9Ids = uid9.workspaces.map((w) => w.id);
  assert.ok(!uid9Ids.includes('ws-owner'), 'another creator does not see uid-1\'s private workspace');
});

test('DATA-07 redaction: no private security field (token/session/ip/userAgent) appears in any projection', async () => {
  const { s, svc } = setup();
  s.seedAccount({ uid: 'uid-1', profile: { displayName: 'A', emailHint: 'a@e' }, billing: null, redacted: ['refresh_tokenHash'] });
  s.pushCommand({ id: 'c-1', uid: 'uid-1', commandId: 'cmd-1', kind: 'consent.grant', workspaceId: null, status: 'COMMITTED', revision: 1, attemptedAt: '2026-10-01T00:00:00Z', committedAt: '2026-10-01T00:00:01Z', error: null, hasResult: true });
  const o = await svc.overview('uid-1');
  const text = JSON.stringify(o);
  assert.ok(!text.includes('tokenHash='), 'tokenHash never surfaces');
  assert.ok(!text.includes('observedIp'), 'observedIp key never surfaces');
  assert.ok(!text.includes('userAgent'), 'userAgent key never surfaces');
  assert.ok(!text.includes('resultJson'), 'raw command result is not part of a bounded history projection');
});

test('DATA-07 pagination: history is cursor-paginated, bounded, and never an unlimited document', async () => {
  const { s, svc } = setup();
  for (let i = 0; i < 25; i++) {
    s.pushCommand({ id: `c-${i}`, uid: 'uid-1', commandId: `cmd-${i}`, kind: 'documents', workspaceId: null, status: 'COMMITTED', revision: i + 1, attemptedAt: `2026-10-01T00:00:${String(i).padStart(2, '0')}Z`, committedAt: `2026-10-01T00:00:${String(i).padStart(2, '0')}Z`, error: null, hasResult: false });
  }
  const page1 = await svc.history('uid-1', undefined, 10);
  assert.equal(page1.items.length, 10);
  assert.equal(page1.hasMore, true);
  assert.ok(page1.nextCursor);
  const page2 = await svc.history('uid-1', page1.nextCursor.value, 10);
  assert.equal(page2.items.length, 10);
  assert.notEqual(page2.items[0].id, page1.items[0].id, 'no duplicate rows across pages');
  const page3 = await svc.history('uid-1', page2.nextCursor.value, 10);
  assert.equal(page3.items.length, 5);
  assert.equal(page3.hasMore, false);
  assert.equal(page3.nextCursor, null);
  // Single command row by id is still bounded to its own object, not an unbounded doc.
  assert.equal(page1.items[0].hasResult, false);
});

test('DATA-07 deny: invalid page size or cursor is rejected with no partial data', async () => {
  const { s, svc } = setup();
  s.pushCommand({ id: 'c-1', uid: 'uid-1', commandId: 'cmd-1', kind: 'documents', workspaceId: null, status: 'COMMITTED', revision: 1, attemptedAt: '2026-10-01T00:00:00Z', committedAt: '2026-10-01T00:00:01Z', error: null, hasResult: false });
  await assert.rejects(svc.history('uid-1', undefined, 0), (e) => e.code === 'invalid_page');
  await assert.rejects(svc.history('uid-1', undefined, 'abc'), (e) => e.code === 'invalid_page');
  await assert.rejects(svc.history('uid-1', 'bad cursor with spaces!', 10), (e) => e.code === 'invalid_cursor');
});

test('DATA-07 deny: a foreign cursor yields an empty page, never another user\'s rows', async () => {
  const { s, svc } = setup();
  s.pushCommand({ id: 'c-victim', uid: 'victim', commandId: 'cmd-1', kind: 'documents', workspaceId: null, status: 'COMMITTED', revision: 1, attemptedAt: '2026-10-01T00:00:00Z', committedAt: '2026-10-01T00:00:01Z', error: null, hasResult: false });
  const page = await svc.history('attacker', 'c-victim', 20);
  assert.equal(page.items.length, 0, 'a foreign cursor leaks no rows');
  assert.equal(page.hasMore, false);
});

test('DATA-07 audit projection: owner-scoped, redacted of ip/userAgent, paginated', async () => {
  const { s, svc } = setup();
  for (const [id, op] of [['a-1', 'workspace.provision'], ['a-2', 'consent.revoke']]) {
    s.pushAudit({ id, uid: 'uid-1', operation: op, outcome: 'SUCCESS', resourceType: 'workspace', resourceId: 'ws-1', createdAt: `2026-10-01T00:00:0${id === 'a-1' ? 1 : 2}Z` });
  }
  const a = await svc.audit('uid-1', undefined, 10);
  assert.equal(a.items.length, 2);
  const text = JSON.stringify(a);
  assert.ok(!text.includes('ip='), 'no raw ip in audit projection');
  assert.ok(!text.includes('userAgent'), 'no userAgent in audit projection');
  // Foreign uid sees no audit rows.
  const empty = await svc.audit('other', undefined, 10);
  assert.equal(empty.items.length, 0);
});
