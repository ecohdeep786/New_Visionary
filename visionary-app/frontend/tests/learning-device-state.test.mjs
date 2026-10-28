/**
 * LEARN-06 (KAN-72) — authorized change cursors/refetch, stale-response
 * rejection, independent workspace selection per device, offline/conflict
 * recovery and sign-out/account-switch handling.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LearningDeviceState } from '../src/services/learningDeviceState.ts';

const W1 = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const W2 = { uid: 'uid_learner_1', workspaceId: 'ws_org' };
const DEVICE_A = 'device_a';
const DEVICE_B = 'device_b';

test('independent workspace selection per device: switching on one device never affects another', () => {
  const state = new LearningDeviceState(DEVICE_A, W1);
  state.selectWorkspace(DEVICE_B, W1);
  // Device B selects its own workspace.
  state.selectWorkspace(DEVICE_B, W2);
  assert.equal(state.workspaceOf(DEVICE_B), 'ws_org');
  assert.equal(state.workspaceOf(DEVICE_A), 'ws_personal');
});

test('authorized cursors: bound to (device, workspace, surface) — another device or workspace refuses uniformly', () => {
  const state = new LearningDeviceState(DEVICE_A, W1);
  const cursor = state.issueCursor('teaching', 5);
  // The owning device refetches fine.
  const ok = state.refetch(DEVICE_A, cursor);
  assert.equal(ok.fromSeq, 5);
  // Another device's refetch refuses.
  assert.throws(() => state.refetch(DEVICE_B, cursor), (e) => e.code === 'cursor_invalid');
  // A cursor whose stored token was replaced (stale copy) refuses.
  state.issueCursor('teaching', 6);
  assert.throws(() => state.refetch(DEVICE_A, cursor), (e) => e.code === 'cursor_invalid');
  // A workspace-switched device cannot use the old workspace's cursor.
  state.selectWorkspace(DEVICE_A, W2);
  assert.throws(() => state.refetch(DEVICE_A, cursor), (e) => e.code === 'cursor_invalid');
});

test('stale-response rejection: responses older than the applied generation never overwrite newer state', () => {
  const state = new LearningDeviceState(DEVICE_A, W1);
  assert.equal(state.acceptResponse(3), true);
  // Out-of-order delivery: generation 2 is stale.
  assert.equal(state.acceptResponse(2), false);
  assert.equal(state.currentGeneration(), 3);
  // Equal generation is also stale (no re-apply).
  assert.equal(state.acceptResponse(3), false);
  assert.equal(state.acceptResponse(4), true);
});

test('offline/conflict recovery: a draft whose base still matches applies; a moved base becomes an explicit CONFLICT with both versions retained', () => {
  const state = new LearningDeviceState(DEVICE_A, W1);
  const clean = state.queueDraft('build', 7, { op: 'rename', to: 'A' });
  const conflicting = state.queueDraft('build', 9, { op: 'rename', to: 'B' });
  // Server revision still matches the first draft's base: applies cleanly.
  const applied = state.recover(clean.draftId, 7);
  assert.equal(applied.kind, 'applied');
  // The second draft's base moved on the server: explicit conflict.
  const conflict = state.recover(conflicting.draftId, 12);
  assert.equal(conflict.kind, 'conflict');
  assert.equal(conflict.baseRevision, 9);
  assert.equal(conflict.serverRevision, 12);
  assert.equal(state.conflicts().length, 1);
  assert.equal(state.conflicts()[0].draft.op.to, 'B');
});

test('account switch isolates per account on the same device', () => {
  const state = new LearningDeviceState(DEVICE_A, W1);
  state.queueDraft('build', 1, { op: 'x' });
  // Switch to the org account on the SAME device.
  state.switchAccount(DEVICE_A, W2);
  assert.equal(state.workspaceOf(DEVICE_A), 'ws_org');
  // The org account starts with an empty draft queue (no cross-account leak).
  const draft = state.queueDraft('build', 2, { op: 'org-op' });
  assert.ok(draft.draftId);
  const recovered = state.recover(draft.draftId, 2);
  assert.equal(recovered.kind, 'applied');
});

test('sign-out wipes ALL device state; after sign-out every use refuses until re-authenticated', () => {
  const state = new LearningDeviceState(DEVICE_A, W1);
  state.issueCursor('teaching', 4);
  state.queueDraft('build', 1, { op: 'pending' });
  state.signOut(DEVICE_A);
  assert.equal(state.isSignedOut(DEVICE_A), true);
  assert.throws(() => state.workspaceOf(DEVICE_A), (e) => e.code === 'signed_out');
  assert.throws(() => state.issueCursor('teaching', 5), (e) => e.code === 'signed_out');
  // Re-authenticating creates a fresh state.
  state.selectWorkspace(DEVICE_A, W1);
  assert.equal(state.workspaceOf(DEVICE_A), 'ws_personal');
  assert.equal(state.isSignedOut(DEVICE_A), false);
});
