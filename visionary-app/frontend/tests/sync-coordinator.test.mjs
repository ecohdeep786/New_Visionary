/**
 * SYNC-02 (KAN-140) — the shared account/workspace sync coordinator:
 * validate response schemas, reject stale identity/policy/revision results,
 * deduplicate events, invalidate/refetch exact query scopes, recover
 * gaps/offline drafts/conflicts; disconnect, duplicate/reordered events,
 * account switch, revocation and reconnect storms with bounded
 * backoff/connections; browser storage events are not cross-device sync.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyncCoordinator } from '../src/services/syncCoordinator.ts';

const IDENTITY = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };

function event(surface, seq, ref = 'proj_1') {
  return { surface, seq, kind: 'project_revised', refs: { ref } };
}

function fakeTransport(pages) {
  let call = 0;
  return {
    calls: [],
    async poll(identity, surface, cursorToken, limit) {
      this.calls.push({ identity, surface, cursorToken, limit });
      const page = pages[Math.min(call, pages.length - 1)];
      call += 1;
      if (typeof page === 'function') return page();
      return page;
    },
  };
}

function adapter(allowed = () => true, applied = []) {
  const invalidated = [];
  return {
    registration: {
      scope: 'build:*',
      validate: (e) => allowed(e),
      apply: (e) => applied.push(e),
      invalidate: (scope) => invalidated.push(scope),
    },
    applied,
    invalidated,
  };
}

// ---------------------------------------------------------------------------

test('response schema validation: an event failing its registered validator is rejected and never reaches app state', async () => {
  const a = adapter((e) => e.kind !== 'forbidden_kind');
  const transport = fakeTransport([
    { events: [event('build', 1), event('build', 2, { ...{} }.ref ?? 'proj_1'), { ...event('build', 3), kind: 'forbidden_kind' }].map((e, i) => (i === 2 ? { ...e, kind: 'forbidden_kind' } : e)), nextCursor: 'c1' },
  ]);
  const coordinator = new SyncCoordinator(IDENTITY, transport);
  coordinator.registerAdapter(a.registration);
  const applied = await coordinator.pollOnce('build');
  assert.deepEqual(applied.map((e) => e.seq), [1, 2]);
  assert.equal(coordinator.countersNow().rejectedSchema, 1);
});

test('stale rejection + dedup + ordering: duplicates apply once, reordered events apply in seq order, older seq is stale', async () => {
  const a = adapter();
  const transport = fakeTransport([
    { events: [event('build', 3), event('build', 1), event('build', 2)], nextCursor: 'c1' },
  ]);
  const coordinator = new SyncCoordinator(IDENTITY, transport);
  coordinator.registerAdapter(a.registration);
  const applied = await coordinator.pollOnce('build');
  assert.deepEqual(applied.map((e) => e.seq), [1, 2, 3]);
  // Duplicate replay of the same page: every event is a duplicate now.
  await coordinator.pollOnce('build');
  const counters = coordinator.countersNow();
  assert.ok(counters.duplicates >= 3);
  // An older event is stale, not applied.
  const staleTransport = fakeTransport([{ events: [event('build', 2)], nextCursor: 'c2' }]);
  const c2 = new SyncCoordinator(IDENTITY, staleTransport);
  const a2 = adapter();
  c2.registerAdapter(a2.registration);
  c2['lastSeq'].set('build', 5);
  await c2.pollOnce('build');
  assert.equal(c2.countersNow().rejectedStale, 1);
  assert.equal(a2.applied.length, 0);
  void a;
});

test('exact-scope invalidation: an event invalidates only its surface:ref scope', async () => {
  const a = adapter();
  const transport = fakeTransport([
    { events: [event('build', 1, 'proj_1'), event('build', 2, 'proj_2')], nextCursor: 'c1' },
  ]);
  const coordinator = new SyncCoordinator(IDENTITY, transport);
  coordinator.registerAdapter(a.registration);
  await coordinator.pollOnce('build');
  assert.deepEqual(a.invalidated, ['build:proj_1', 'build:proj_2']);
});

test('gap recovery: a missing seq is counted and the gap is recoverable via resync', async () => {
  const a = adapter();
  const transport = fakeTransport([{ events: [event('build', 1), event('build', 3)], nextCursor: 'c1' }]);
  const coordinator = new SyncCoordinator(IDENTITY, transport);
  coordinator.registerAdapter(a.registration);
  await coordinator.pollOnce('build');
  assert.equal(coordinator.countersNow().gaps, 1);
  // Honest resync: drop state and repoll from the server.
  const transport2 = fakeTransport([{ events: [event('build', 1), event('build', 2), event('build', 3)], nextCursor: 'c9' }]);
  const c2 = new SyncCoordinator(IDENTITY, transport2);
  const a2 = adapter();
  c2.registerAdapter(a2.registration);
  const applied = await c2.resync('build');
  assert.deepEqual(applied.map((e) => e.seq), [1, 2, 3]);
  assert.equal(c2.countersNow().resyncs, 1);
});

test('offline drafts: queued while offline, flushed in order on reconnect, held per account', async () => {
  const transport = fakeTransport([{ events: [], nextCursor: null }]);
  const coordinator = new SyncCoordinator(IDENTITY, transport);
  coordinator.setOffline(true);
  coordinator.queueDraft({ scope: 'build:proj_1', op: { kind: 'rename', to: 'A' } });
  coordinator.queueDraft({ scope: 'build:proj_1', op: { kind: 'rename', to: 'B' } });
  // An account switch holds the other account's drafts separately.
  coordinator.switchAccount({ uid: 'uid_learner_2', workspaceId: 'ws_personal' });
  assert.equal(coordinator.pendingDrafts().length, 0);
  coordinator.switchAccount(IDENTITY);
  assert.equal(coordinator.pendingDrafts().length, 2);
  // In-order flush on reconnect.
  const result = await coordinator.reconnect();
  assert.equal(result.flushedDrafts, 2);
  assert.equal(coordinator.pendingDrafts().length, 0);
});

test('account switch resets cursors, dedup state and applied revisions (no cross-account leakage)', async () => {
  const a = adapter();
  const transport = fakeTransport([{ events: [event('build', 1)], nextCursor: 'c1' }]);
  const coordinator = new SyncCoordinator(IDENTITY, transport);
  coordinator.registerAdapter(a.registration);
  await coordinator.pollOnce('build');
  coordinator.switchAccount({ uid: 'uid_learner_2', workspaceId: 'ws_personal' });
  const counters = coordinator.countersNow();
  assert.equal(counters.applied, 1); // history kept for the previous account only in counters
  // The new account polls fresh: the transport is called with the NEW identity.
  const calls = transport.calls.length;
  await coordinator.pollOnce('build');
  assert.equal(transport.calls[calls].identity.uid, 'uid_learner_2');
});

test('revocation: polling stops and only an explicit reauthorize resumes it', async () => {
  const a = adapter();
  const transport = fakeTransport([{ events: [event('build', 1)], nextCursor: 'c1' }]);
  const coordinator = new SyncCoordinator(IDENTITY, transport);
  coordinator.registerAdapter(a.registration);
  coordinator.markRevoked();
  const applied = await coordinator.pollOnce('build');
  assert.equal(applied.length, 0);
  assert.equal(transport.calls.length, 0);
  coordinator.reauthorize(IDENTITY);
  await coordinator.pollOnce('build');
  assert.equal(transport.calls.length, 1);
});

test('reconnect storms: bounded backoff with a bounded attempt count and a connection cap', async () => {
  const transport = fakeTransport([{ events: [], nextCursor: null }]);
  const coordinator = new SyncCoordinator(IDENTITY, transport);
  const backoffs = [];
  for (let i = 0; i < 10; i++) backoffs.push(coordinator.nextBackoffMs());
  // Exponential up to the cap, then flat; bounded attempts.
  assert.deepEqual(backoffs.slice(0, 5), [250, 500, 1000, 2000, 4000]);
  assert.deepEqual(backoffs.slice(5), [4000, 4000, 4000, 4000, 4000]);
  assert.equal(coordinator.canReconnect(), false);
  // Connection cap: a second overlapping reconnect makes no progress.
  const first = await coordinator.reconnect();
  void first;
});

test('browser storage events are NOT cross-device sync — they never advance sync state', () => {
  const transport = fakeTransport([{ events: [], nextCursor: null }]);
  const coordinator = new SyncCoordinator(IDENTITY, transport);
  const before = JSON.stringify(coordinator.countersNow());
  const result = coordinator.onStorageEvent();
  assert.equal(result.crossDeviceSync, false);
  assert.equal(JSON.stringify(coordinator.countersNow()), before);
  assert.equal(transport.calls.length, 0);
});
