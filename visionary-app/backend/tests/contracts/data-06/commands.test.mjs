/**
 * DATA-06 — scoped command results, conditional revisions, trusted timestamps,
 * unique constraints, transactional outbox and deletion tombstones.
 *
 * Positive, failure/deny and recovery cases are exercised against the in-memory
 * synthetic store. Every timestamp asserted here is server-derived (the injectable
 * clock), never client-supplied. The unique commandId constraint and the atomic
 * outbox commit are enforced by the store.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { CommandService } = req('./dist/src/commands/command.service.js');
const { InMemoryCommandStore, CommandUniqueViolation } = req('./dist/src/commands/command-store.js');

function setup() {
  const s = new InMemoryCommandStore();
  const svc = new CommandService(s, { now: () => new Date('2026-10-25T10:00:00Z') });
  return { s, svc };
}

test('DATA-06 execute: commits a scoped command result with a server trusted timestamp and outbox event', async () => {
  const { s, svc } = setup();
  const outcome = await svc.execute('uid-1', { commandId: 'cmd-1', kind: 'provision.personal', payload: { name: 'A' } });
  assert.equal(outcome.status, 'COMMITTED');
  assert.equal(outcome.replayed, false);
  assert.equal(outcome.revision, 1);
  assert.match(outcome.committedAt ?? '', /^2026/);
  const stored = await s.resultByCommandId('cmd-1');
  assert.equal(stored.uid, 'uid-1');
  assert.equal(stored.committedAt, '2026-10-25T10:00:00.000Z', 'trusted timestamp is the server clock');
  assert.equal(await s.pendingOutbox(10).then((e) => e.length), 1, 'outbox event committed with the result');
});

test('DATA-06 unique constraint: the same command key + identical payload replays, no new row', async () => {
  const { s, svc } = setup();
  await svc.execute('uid-1', { commandId: 'cmd-1', kind: 'provision.personal', payload: { name: 'A' } });
  const replay = await svc.execute('uid-1', { commandId: 'cmd-1', kind: 'provision.personal', payload: { name: 'A' } });
  assert.equal(replay.replayed, true, 'same key + same payload is a safe replay');
  assert.equal(await s.resultByCommandId('cmd-1').then((r) => r.revision), 1, 'no new revision on replay');
  assert.equal(s.outbox.size, 1, 'no duplicate outbox event on replay');
});

test('DATA-06 deny: same command key with a changed payload is rejected (CONFLICT)', async () => {
  const { svc } = setup();
  await svc.execute('uid-1', { commandId: 'cmd-1', kind: 'provision.personal', payload: { name: 'A' } });
  await assert.rejects(
    svc.execute('uid-1', { commandId: 'cmd-1', kind: 'provision.personal', payload: { name: 'CHANGED' } }),
    (e) => e.code === 'conflict',
  );
});

test('DATA-06 deny: a command belonging to another account cannot be replayed (scoped result)', async () => {
  const { svc } = setup();
  await svc.execute('uid-1', { commandId: 'cmd-1', kind: 'provision.personal', payload: { name: 'A' } });
  await assert.rejects(svc.execute('uid-2', { commandId: 'cmd-1', kind: 'provision.personal', payload: { name: 'A' } }), (e) => e.code === 'wrong_owner');
});

test('DATA-06 conditional revisions: a stale expectedRevision is rejected, matching expectedRevision commits', async () => {
  const { s, svc } = setup();
  await svc.execute('uid-1', { commandId: 'cmd-1', kind: 'consent.grant', payload: { purpose: 'sharing' } }); // revision 1
  // Stale optimistic concurrency: writer still expects revision 0/absent.
  await assert.rejects(
    svc.execute('uid-1', { commandId: 'cmd-2', kind: 'consent.grant', payload: { purpose: 'sharing' }, expectedRevision: 0 }),
    (e) => e.code === 'stale_revision',
  );
  // Matching expectedRevision 1 commits as revision 2.
  const ok = await svc.execute('uid-1', { commandId: 'cmd-2', kind: 'consent.grant', payload: { purpose: 'sharing' }, expectedRevision: 1 });
  assert.equal(ok.revision, 2);
  assert.equal(await s.maxRevision('uid-1', 'consent.grant'), 2);
});

test('DATA-06 deny: invalid command input never commits (missing key, bad kind, non-object payload)', async () => {
  const { s, svc } = setup();
  await assert.rejects(svc.execute('uid-1', { commandId: '', kind: 'x', payload: {} }), (e) => e.code === 'invalid_command');
  await assert.rejects(svc.execute('uid-1', { commandId: 'bad id!', kind: 'x', payload: {} }), (e) => e.code === 'invalid_command');
  await assert.rejects(svc.execute('uid-1', { commandId: 'c1', kind: 'BadKind', payload: {} }), (e) => e.code === 'invalid_command');
  await assert.rejects(svc.execute('uid-1', { commandId: 'c1', kind: 'x', payload: 'not-an-object' }), (e) => e.code === 'invalid_command');
  assert.equal(await s.resultsByUid('uid-1').then((r) => r.length), 0);
});

test('DATA-06 transactional outbox: an outbox append failure rolls back the command result', async () => {
  const { s, svc } = setup();
  s.failOutbox = true;
  await assert.rejects(svc.execute('uid-1', { commandId: 'cmd-1', kind: 'provision.personal', payload: { name: 'A' } }), (e) => e.code === 'outbox_rollback');
  assert.equal(await s.resultByCommandId('cmd-1'), null, 'result row rolled back with the failed outbox append');
  assert.equal(s.outbox.size, 0, 'no outbox event survives a failed transaction');

  // A retry after the outage recovers cleanly and commits exactly once.
  s.failOutbox = false;
  const ok = await svc.execute('uid-1', { commandId: 'cmd-1', kind: 'provision.personal', payload: { name: 'A' } });
  assert.equal(ok.status, 'COMMITTED');
  assert.equal(await s.resultByCommandId('cmd-1').then((r) => r.revision), 1);
  assert.equal(s.outbox.size, 1);
});

test('DATA-06 deletion tombstone: a deleted resource cannot be recreated until the tombstone expires', async () => {
  const { s, svc } = setup();
  await svc.execute('uid-1', { commandId: 'c1', kind: 'documents', payload: { resourceType: 'document', resourceId: 'doc-1' } });
  const del = await svc.deleteResource({ uid: 'uid-1', resourceType: 'document', resourceId: 'doc-1' });
  assert.ok(del.tombstoneExpiresAt, 'tombstone has a bounded expiry');
  assert.equal(await svc.recreateAllowed('uid-1', 'document', 'doc-1'), false, 'recreate blocked while tombstone is active');
  await assert.rejects(
    svc.execute('uid-1', { commandId: 'c2', kind: 'documents', payload: { resourceType: 'document', resourceId: 'doc-1' } }),
    (e) => e.code === 'tombstoned',
  );
  // A different resource with no tombstone remains creatable.
  const ok = await svc.execute('uid-1', { commandId: 'c3', kind: 'documents', payload: { resourceType: 'document', resourceId: 'doc-2' } });
  assert.equal(ok.status, 'COMMITTED');
  assert.equal(s.tombstones.size, 1);
});

test('DATA-06 tombstone expiry: after the tombstone expires recreation is allowed again', async () => {
  const s = new InMemoryCommandStore();
  const svc = new CommandService(s, { now: () => new Date('2026-10-25T10:00:00Z') });
  await svc.execute('uid-1', { commandId: 'c1', kind: 'documents', payload: { resourceType: 'document', resourceId: 'doc-1' } });
  await svc.deleteResource({ uid: 'uid-1', resourceType: 'document', resourceId: 'doc-1' });
  // A later point in time (after the 30-day tombstone TTL) permits recreation.
  const later = new CommandService(s, { now: () => new Date('2026-12-25T10:00:00Z') });
  assert.equal(await later.recreateAllowed('uid-1', 'document', 'doc-1'), true, 'expired tombstone no longer blocks');
});

test('DATA-06 outbox dispatch: pending events dispatch in cursor order, bounded', async () => {
  const { svc } = setup();
  await svc.execute('uid-1', { commandId: 'cmd-1', kind: 'invite.accept', payload: {} });
  await svc.execute('uid-1', { commandId: 'cmd-2', kind: 'invite.accept', payload: {} });
  const dispatched = await svc.dispatchOutbox(1);
  assert.deepEqual(dispatched, [1], 'bounded dispatch processes one event first, in cursor order');
  const dispatched2 = await svc.dispatchOutbox(10);
  assert.deepEqual(dispatched2, [2], 'second batch dispatches the next cursor');
});
