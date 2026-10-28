/**
 * SYNC-01 (KAN-139) — authorized durable change/run observation across
 * account, billing and every released workspace domain: owning-store
 * event/outbox records, opaque scoped cursors, ordered revisions,
 * replay/refetch and expiry semantics; bounded polling and SSE where
 * streaming is needed; reauthorized connect/reconnect/delivery; a feed event
 * never executes a command or proves commit.
 *
 * Proven here:
 *   1.  Owning-store records: per-surface strictly-increasing ordered
 *       revisions; ordered pages with reference ids only.
 *   2.  Raw private content refuses at the record boundary.
 *   3.  Opaque scoped cursors: nonce-padded (sequence never exposed raw);
 *       tampered/unknown tokens refuse; a cursor bound to another caller or
 *       surface refuses (a cursor alone grants nothing).
 *   4.  Ordered replay/refetch is deterministic from any retained cursor.
 *   5.  Expiry: a cursor fallen out of the retention window refuses honestly
 *       (cursor_expired) with a resync point.
 *   6.  Bounded polling: page limits enforced.
 *   7.  Run observation rides the same authorized cursor path.
 *   8.  Delivery modes: bounded polling default; SSE allowed; websocket
 *       refuses without a recorded explicit bidirectional need.
 *   9.  Reauthorized connect/reconnect/delivery: revoked delivery refuses
 *       everything; re-grant restores; the authenticated caller is the
 *       authority (not the token).
 *   10. Observation only: no command path exists; records are never commit
 *       proofs; one owner's events are invisible to another.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { ChangefeedService } = req('./dist/src/changefeed/changefeed-service.js');
const { InMemoryChangefeedStore } = req('./dist/src/changefeed/changefeed-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const FOREIGN_WS = { uid: 'uid_learner_1', workspaceId: 'ws_other' };

async function makeService(limits) {
  const store = new InMemoryChangefeedStore();
  const service = new ChangefeedService(store, limits ?? { maxPageSize: 50, retentionWindow: 1000 });
  return { store, service };
}

async function seedBuildEvents(service, owner, count) {
  const events = [];
  for (let i = 1; i <= count; i++) {
    events.push(await service.recordEvent(owner, 'build', i === 2 ? 'run_status' : 'project_revised', { projectId: 'proj_1', runId: 'run_7' }));
  }
  return events;
}

// ---------------------------------------------------------------------------

test('owning-store records: per-surface strictly-increasing ordered revisions; pages return reference ids only, in order', async () => {
  const { service } = await makeService();
  const events = await seedBuildEvents(service, OWNER, 3);
  assert.deepEqual(events.map((e) => e.seq), [1, 2, 3]);
  const cursor = await service.issueCursor(OWNER, 'build');
  const page = await service.poll(OWNER, 'build', cursor.token, 50);
  assert.deepEqual(page.events.map((e) => e.seq), []);
  await service.recordEvent(OWNER, 'build', 'project_revised', { projectId: 'proj_1' });
  const page2 = await service.poll(OWNER, 'build', cursor.token, 50);
  assert.deepEqual(page2.events.map((e) => e.seq), [4]);
  assert.equal(page2.events[0].isCommitProof, false);
  assert.deepEqual(Object.keys(page2.events[0].refs), ['projectId']);
});

test('raw private content refuses at the record boundary', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.recordEvent(OWNER, 'teaching', 'turn_recorded', { learner_text: 'the full learner answer' }),
    (e) => e.code === 'private_content_refused',
  );
  await assert.rejects(
    () => service.recordEvent(OWNER, 'teaching', 'turn_recorded', { fullTranscript: 'raw' }),
    (e) => e.code === 'private_content_refused',
  );
  // Reference ids are fine.
  const ok = await service.recordEvent(OWNER, 'teaching', 'turn_recorded', { conversationId: 'conv_1', turnId: 't_9' });
  assert.equal(ok.refs.conversationId, 'conv_1');
});

test('OPAQUE scoped cursors: nonce-padded tokens; tampered/unknown tokens refuse; a cursor bound to another caller or surface refuses', async () => {
  const { service } = await makeService();
  await seedBuildEvents(service, OWNER, 2);
  const cursor = await service.issueCursor(OWNER, 'build');
  // Opaque: the token is not the raw sequence and not a guessable integer.
  assert.notEqual(cursor.token, String(cursor.seq));
  assert.ok(cursor.token.length > 10);
  // Unknown/tampered token refuses.
  await assert.rejects(
    () => service.poll(OWNER, 'build', 'cur_forged_999', 50),
    (e) => e.code === 'cursor_invalid',
  );
  // A valid token presented by ANOTHER caller refuses (authority is the
  // caller, never the token).
  await assert.rejects(
    () => service.poll(STRANGER, 'build', cursor.token, 50),
    (e) => e.code === 'cursor_invalid',
  );
  await assert.rejects(
    () => service.poll(FOREIGN_WS, 'build', cursor.token, 50),
    (e) => e.code === 'cursor_invalid',
  );
  // A build cursor used on a different surface refuses.
  await assert.rejects(
    () => service.poll(OWNER, 'billing', cursor.token, 50),
    (e) => e.code === 'cursor_invalid',
  );
});

test('ordered replay/refetch: polling from any retained cursor replays the same ordered suffix deterministically', async () => {
  const { service } = await makeService();
  const cursor = await service.issueCursor(OWNER, 'build'); // seq 0
  for (let i = 0; i < 2; i++) {
    await service.recordEvent(OWNER, 'build', 'project_revised', { projectId: 'proj_1' });
  }
  // Bounded first page leaves a retained cursor at seq 2.
  const firstPage = await service.poll(OWNER, 'build', cursor.token, 2);
  assert.deepEqual(firstPage.events.map((e) => e.seq), [1, 2]);
  for (let i = 0; i < 3; i++) {
    await service.recordEvent(OWNER, 'build', 'project_revised', { projectId: 'proj_1' });
  }
  // Refetch from the same retained cursor replays the same ordered suffix.
  const replayA = await service.poll(OWNER, 'build', firstPage.nextCursor.token, 50);
  const replayB = await service.poll(OWNER, 'build', firstPage.nextCursor.token, 50);
  assert.deepEqual(replayA.events.map((e) => e.seq), [3, 4, 5]);
  assert.deepEqual(replayB.events.map((e) => e.seq), [3, 4, 5]);
  assert.equal(JSON.stringify(replayA.events), JSON.stringify(replayB.events));
});

test('expiry: a cursor fallen out of the retention window refuses honestly with a resync point', async () => {
  const { store, service } = await makeService({ maxPageSize: 50, retentionWindow: 10 });
  await seedBuildEvents(service, OWNER, 5);
  const stale = await service.issueCursor(OWNER, 'build');
  // The surface advances far past the stale cursor's revision.
  for (let i = 0; i < 20; i++) {
    await service.recordEvent(OWNER, 'build', 'project_revised', { projectId: 'proj_' + i });
  }
  await assert.rejects(
    () => service.poll(OWNER, 'build', stale.token, 50),
    (e) => e.code === 'cursor_expired',
  );
  // Honest resync: a fresh cursor starts at the latest revision.
  const fresh = await service.issueCursor(OWNER, 'build');
  assert.equal(fresh.seq, 25);
  const page = await service.poll(OWNER, 'build', fresh.token, 50);
  assert.equal(page.events.length, 0);
});

test('bounded polling: page limits are enforced', async () => {
  const { service } = await makeService({ maxPageSize: 3, retentionWindow: 1000 });
  const cursor = await service.issueCursor(OWNER, 'build'); // seq 0
  await seedBuildEvents(service, OWNER, 5);
  await assert.rejects(
    () => service.poll(OWNER, 'build', cursor.token, 4),
    (e) => e.code === 'limit_exceeded',
  );
  const page = await service.poll(OWNER, 'build', cursor.token, 3);
  assert.deepEqual(page.events.map((e) => e.seq), [1, 2, 3]);
  assert.equal(page.hasMore, true);
  assert.ok(page.nextCursor);
  const page2 = await service.poll(OWNER, 'build', page.nextCursor.token, 3);
  assert.deepEqual(page2.events.map((e) => e.seq), [4, 5]);
  assert.equal(page2.hasMore, false);
});

test('run observation rides the same authorized cursor path', async () => {
  const { service } = await makeService();
  const cursor = await service.issueCursor(OWNER, 'build');
  await service.recordEvent(OWNER, 'build', 'run_status', { runId: 'run_7', status: 'running' });
  await service.recordEvent(OWNER, 'build', 'run_status', { runId: 'run_7', status: 'succeeded' });
  const page = await service.poll(OWNER, 'build', cursor.token, 50);
  assert.deepEqual(page.events.map((e) => e.kind), ['run_status', 'run_status']);
  assert.deepEqual(page.events.map((e) => e.refs.status), ['running', 'succeeded']);
});

test('delivery modes: bounded polling default; SSE allowed; websocket refuses without a recorded explicit bidirectional need', async () => {
  const { service } = await makeService();
  assert.equal((await service.subscribe(OWNER, { mode: 'bounded_polling', surface: 'build', bidirectionalNeed: null })).mode, 'bounded_polling');
  assert.equal((await service.subscribe(OWNER, { mode: 'sse', surface: 'build', bidirectionalNeed: null })).mode, 'sse');
  await assert.rejects(
    () => service.subscribe(OWNER, { mode: 'websocket', surface: 'build', bidirectionalNeed: null }),
    (e) => e.code === 'websocket_requires_explicit_need',
  );
  const ws = await service.subscribe(OWNER, {
    mode: 'websocket',
    surface: 'build',
    bidirectionalNeed: 'approved two-way tutoring session control (recorded need)',
  });
  assert.equal(ws.mode, 'websocket');
});

test('reauthorized connect/reconnect/delivery: revoked delivery refuses everything; re-grant restores; the caller is the authority', async () => {
  const { service } = await makeService();
  const cursor = await service.issueCursor(OWNER, 'build'); // seq 0
  await seedBuildEvents(service, OWNER, 2);
  await service.setDeliveryRevoked(OWNER, true);
  // Even a VALID cursor delivers nothing while delivery is revoked.
  await assert.rejects(
    () => service.poll(OWNER, 'build', cursor.token, 50),
    (e) => e.code === 'delivery_revoked',
  );
  await assert.rejects(
    () => service.subscribe(OWNER, { mode: 'sse', surface: 'build', bidirectionalNeed: null }),
    (e) => e.code === 'delivery_revoked',
  );
  await assert.rejects(
    () => service.issueCursor(OWNER, 'build'),
    (e) => e.code === 'delivery_revoked',
  );
  // Re-grant restores delivery on the next authorized connect.
  await service.setDeliveryRevoked(OWNER, false);
  const page = await service.poll(OWNER, 'build', cursor.token, 50);
  assert.deepEqual(page.events.map((e) => e.seq), [1, 2]);
});

test('observation only: the feed never executes a command and never proves commit; one owner is invisible to another', async () => {
  const { service } = await makeService();
  await seedBuildEvents(service, OWNER, 2);
  await assert.rejects(
    () => service.executeThroughFeed(),
    (e) => e.code === 'observation_only',
  );
  // The other owner's surface is independent: stranger sees none of OWNER's events.
  const strangerCursor = await service.issueCursor(STRANGER, 'build');
  const strangerPage = await service.poll(STRANGER, 'build', strangerCursor.token, 50);
  assert.equal(strangerPage.events.length, 0);
  // And an unknown surface refuses without leaking existence.
  await assert.rejects(
    () => service.poll(OWNER, 'secret_surface', null, 50),
    (e) => e.code === 'unknown_surface',
  );
  await assert.rejects(
    () => service.recordEvent(OWNER, 'secret_surface', 'x', {}),
    (e) => e.code === 'unknown_surface',
  );
});
