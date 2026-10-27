/**
 * LEARN-01 (KAN-67) — owned learning sessions, checkpoints, resume cursors.
 *
 * Proven here:
 *   1. sessions pin an exact RELEASED source revision; unknown revisions refused,
 *   2. checkpoints are owner-only (wrong uid/workspace denied) and commit with
 *      read-back,
 *   3. duplicate commands are idempotent — no duplicate rows, no double-advance,
 *   4. stale revisions are refused with the local draft preserved VISIBLY and
 *      the committed revision returned for rebase,
 *   5. a committed learner journey resumes correctly on ANOTHER device,
 *   6. cancelled sessions refuse later checkpoints but keep the committed
 *      cursor resumable; wrong users can never resume another's journey.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { LearningSessionService } = req('./dist/src/learningsession/learning-session.js');
const { InMemoryLearningSessionStore } = req('./dist/src/learningsession/learning-session-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const PIN = { conceptId: 'concept_int', sourceVersion: '1.1.0' };

function makeService(extraPins = []) {
  const store = new InMemoryLearningSessionStore();
  const revisions = InMemoryLearningSessionStore.releasedRevisions([PIN, ...extraPins]);
  return { store, svc: new LearningSessionService(store, revisions) };
}

// ---------------------------------------------------------------------------

test('sessions pin an exact released source revision; unknown or unreleased revisions are refused', async () => {
  const { svc } = makeService();
  const session = await svc.startSession(OWNER, PIN);
  assert.equal(session.pin.conceptId, 'concept_int');
  assert.equal(session.pin.sourceVersion, '1.1.0');
  assert.equal(session.status, 'active');
  assert.equal(session.revision, 1);

  await assert.rejects(
    () => svc.startSession(OWNER, { conceptId: 'concept_int', sourceVersion: '9.9.9' }),
    (e) => e.code === 'source_revision_unknown',
    'unreleased revision refused — a journey never binds to unprovable content',
  );
});

test('checkpoints are owner-only and commit with read-back; wrong uid and wrong workspace denied', async () => {
  const { svc } = makeService();
  const session = await svc.startSession(OWNER, PIN);

  const wrongUid = await svc.checkpoint({ sessionId: session.sessionId, owner: OTHER, commandId: 'cmd_1', expectedRevision: 1, deviceId: 'dev_a', payload: { step: 3 } });
  assert.equal(wrongUid.ok, false);
  assert.equal(wrongUid.reason, 'not_owner');
  assert.equal(wrongUid.preservedLocal, true, 'wrong-user refusal preserves the local draft visibly');

  const wrongWs = await svc.checkpoint({ sessionId: session.sessionId, owner: { uid: OWNER.uid, workspaceId: 'ws_other' }, commandId: 'cmd_1', expectedRevision: 1, deviceId: 'dev_a', payload: { step: 3 } });
  assert.equal(wrongWs.ok, false);
  assert.equal(wrongWs.reason, 'not_owner');

  const ok = await svc.checkpoint({ sessionId: session.sessionId, owner: OWNER, commandId: 'cmd_1', expectedRevision: 1, deviceId: 'dev_a', payload: { step: 3 } });
  assert.deepEqual(ok, { outcome: 'committed', sessionId: session.sessionId, revision: 2, commandId: 'cmd_1' });
});

test('duplicate commands are idempotent: same commandId returns the same committed outcome, no double-advance', async () => {
  const { svc, store } = makeService();
  const session = await svc.startSession(OWNER, PIN);
  const first = await svc.checkpoint({ sessionId: session.sessionId, owner: OWNER, commandId: 'cmd_retry', expectedRevision: 1, deviceId: 'dev_a', payload: { step: 5 } });
  assert.equal(first.outcome, 'committed');
  const replay = await svc.checkpoint({ sessionId: session.sessionId, owner: OWNER, commandId: 'cmd_retry', expectedRevision: 1, deviceId: 'dev_a', payload: { step: 5 } });
  assert.equal(replay.outcome, 'duplicate', 'replayed command recognized');
  assert.equal(replay.revision, first.revision, 'replay returns the same committed revision');

  const rows = await store.checkpoints(session.sessionId);
  assert.equal(rows.length, 1, 'no duplicate checkpoint row');
  const resumed = await svc.resume(session.sessionId, OWNER);
  assert.equal(resumed.revision, 2, 'revision advanced exactly once');
});

test('stale revisions are refused with visible local preservation and the committed revision for rebase', async () => {
  const { svc } = makeService();
  const session = await svc.startSession(OWNER, PIN);
  await svc.checkpoint({ sessionId: session.sessionId, owner: OWNER, commandId: 'c1', expectedRevision: 1, deviceId: 'dev_a', payload: { step: 1 } });

  // Device A is stale (revision 1 already consumed).
  const stale = await svc.checkpoint({ sessionId: session.sessionId, owner: OWNER, commandId: 'c2', expectedRevision: 1, deviceId: 'dev_a', payload: { step: 2 } });
  assert.equal(stale.ok, false);
  assert.equal(stale.reason, 'revision_conflict');
  assert.equal(stale.preservedLocal, true, 'local draft preserved and visible');
  assert.equal(stale.currentRevision, 2, 'committed revision returned so the device can rebase');

  // Rebased command succeeds.
  const rebased = await svc.checkpoint({ sessionId: session.sessionId, owner: OWNER, commandId: 'c2', expectedRevision: 2, deviceId: 'dev_a', payload: { step: 2 } });
  assert.equal(rebased.outcome, 'committed');
  assert.equal(rebased.revision, 3);
});

test('a committed learner journey resumes correctly on ANOTHER device (the exit)', async () => {
  const { svc } = makeService();
  const session = await svc.startSession(OWNER, PIN);
  await svc.checkpoint({ sessionId: session.sessionId, owner: OWNER, commandId: 'd1c1', expectedRevision: 1, deviceId: 'device_phone', payload: { conceptId: 'concept_int', step: 4, notes: 'mid-lesson' } });
  await svc.checkpoint({ sessionId: session.sessionId, owner: OWNER, commandId: 'd1c2', expectedRevision: 2, deviceId: 'device_phone', payload: { conceptId: 'concept_int', step: 7 } });

  // Device B (a different device) resumes the same committed journey.
  const cursor = await svc.resume(session.sessionId, OWNER);
  assert.equal(cursor.sessionId, session.sessionId);
  assert.deepEqual(cursor.pin, PIN, 'the source/revision selection is preserved on resume');
  assert.deepEqual(cursor.latestPayload, { conceptId: 'concept_int', step: 7 }, 'latest committed payload is the resume point');
  assert.equal(cursor.latestDeviceId, 'device_phone', 'committing device observed');
  assert.equal(cursor.revision, 3, 'committed revision is the resume base');
  assert.equal(cursor.status, 'active');

  // Device B continues committing from the resumed cursor.
  const next = await svc.checkpoint({ sessionId: session.sessionId, owner: OWNER, commandId: 'd2c1', expectedRevision: cursor.revision, deviceId: 'device_tablet', payload: { conceptId: 'concept_int', step: 8 } });
  assert.equal(next.outcome, 'committed');
  assert.equal(next.revision, 4);
});

test('wrong user can never resume another learner\'s journey; unknown session fails closed', async () => {
  const { svc } = makeService();
  const session = await svc.startSession(OWNER, PIN);
  await svc.checkpoint({ sessionId: session.sessionId, owner: OWNER, commandId: 'c1', expectedRevision: 1, deviceId: 'dev_a', payload: { step: 1 } });

  const stranger = await svc.resume(session.sessionId, OTHER);
  assert.equal(stranger.ok, false);
  assert.equal(stranger.reason, 'not_owner');
  assert.equal(stranger.preservedLocal, true);

  const unknown = await svc.resume('ls_missing', OWNER);
  assert.equal(unknown.ok, false);
  assert.equal(unknown.reason, 'unknown_session');
});

test('cancelled sessions refuse later checkpoints (local preserved) but the committed cursor stays resumable; settle is idempotent', async () => {
  const { svc } = makeService();
  const session = await svc.startSession(OWNER, PIN);
  await svc.checkpoint({ sessionId: session.sessionId, owner: OWNER, commandId: 'c1', expectedRevision: 1, deviceId: 'dev_a', payload: { step: 1 } });
  await svc.cancelSession(session.sessionId, OWNER, 2);

  const after = await svc.checkpoint({ sessionId: session.sessionId, owner: OWNER, commandId: 'c2', expectedRevision: 3, deviceId: 'dev_a', payload: { step: 2 } });
  assert.equal(after.ok, false);
  assert.equal(after.reason, 'session_cancelled');
  assert.equal(after.preservedLocal, true, 'cancelled refusal keeps the local draft visible');

  // Cancel is idempotent; double-cancel converges.
  const again = await svc.cancelSession(session.sessionId, OWNER, 3);
  assert.deepEqual(again, { ok: true, status: 'cancelled', revision: 3 });

  // The committed journey is still resumable after cancellation.
  const cursor = await svc.resume(session.sessionId, OWNER);
  assert.equal(cursor.status, 'cancelled');
  assert.deepEqual(cursor.latestPayload, { step: 1 }, 'committed work survives cancellation');
});

test('complete is owner-only and idempotent; a completed session refuses further checkpoints', async () => {
  const { svc } = makeService();
  const session = await svc.startSession(OWNER, PIN);
  const done = await svc.completeSession(session.sessionId, OWNER, 1);
  assert.deepEqual(done, { ok: true, status: 'completed', revision: 2 });
  const redo = await svc.completeSession(session.sessionId, OWNER, 2);
  assert.deepEqual(redo, { ok: true, status: 'completed', revision: 2 }, 'settle is idempotent');

  const later = await svc.checkpoint({ sessionId: session.sessionId, owner: OWNER, commandId: 'c9', expectedRevision: 2, deviceId: 'dev_a', payload: { step: 99 } });
  assert.equal(later.ok, false);
  assert.equal(later.reason, 'session_completed');

  const stranger = await svc.completeSession(session.sessionId, OTHER, 2);
  assert.equal(stranger.ok, false);
  assert.equal(stranger.reason, 'not_owner');
});
