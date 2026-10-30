/**
 * BUILD-08 (KAN-82) — real API adapters on two devices. Proven here, through
 * the typed device-adapter API over ONE shared owning store:
 *
 *   1. DUPLICATE ACCEPT — the same accept decision id replayed from a second
 *      device converges to 'duplicate' and never double-appends a revision.
 *   2. STALE PROPOSAL — a proposal whose base revision moved (another device
 *      saved new edits) is blocked at accept time.
 *   3. CANCELLATION/RESTART — a cancelled run yields no proposals; starting a
 *      fresh run on the same project (restart) works and accepts normally.
 *   4. ACCOUNT SWITCH — closing a session on a device denies every further
 *      call; a different account on the same device is denied everywhere.
 *   5. RESTORE/EXPORT FAILURE — tampered bytes fail restore/export checks
 *      (manifest re-digest), unknown revisions fail cleanly, nothing is
 *      restored or handed out corrupted.
 *   6. REVOKED SHARE — an accepted recipient loses access once the owner
 *      revokes them, on every device, and revoked AI-permission blocks accept.
 *
 * The device labels (Device A / Device B) are explicit session identities, not
 * inferred browser fingerprints.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { DeviceAdapterService } = req('./dist/src/deviceadapter/device-adapter-service.js');
const { DeviceAdapterStore } = req('./dist/src/deviceadapter/device-adapter-lookups.js');
const { AdapterError } = req('./dist/src/deviceadapter/device-adapter-types.js');

const OWNER_A = { uid: 'uid_builder', workspaceId: 'ws_personal' };
const DEVICE_A = { uid: OWNER_A.uid, workspaceId: OWNER_A.workspaceId, deviceId: 'device_a' };
const DEVICE_B = { uid: OWNER_A.uid, workspaceId: OWNER_A.workspaceId, deviceId: 'device_b' };
const OTHER_ACCOUNT = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const SAME_DEVICE_OTHER_ACCOUNT = { uid: 'uid_stranger', workspaceId: 'ws_personal', deviceId: 'device_a' };
const RECIPIENT_B = 'uid_builder'; // accepted recipient (same account, device B)
const OWNER_SHARING = { uid: 'uid_sharer', workspaceId: 'ws_personal' };

function expectCode(promise, code) {
  return assert.rejects(promise, (e) => e instanceof AdapterError && e.code === code, `expected adapter error ${code}`);
}

test('DUPLICATE ACCEPT: the same decision replayed from a second device converges, never double-appends', async () => {
  const store = new DeviceAdapterStore();
  const svc = new DeviceAdapterService(store);
  const a = await svc.openSession(DEVICE_A);
  const b = await svc.openSession(DEVICE_B);

  const project = await a.createProject('solar system deck');
  const run = await a.startRun(project.projectId, 0);
  await a.transition(run.runId, 'succeeded', 'proposal ready');
  const proposal = await a.propose(run.runId, { suggestion: 'add Saturn rings slide' });

  const accepted = await a.acceptProposal(proposal.proposalId, 'dec_duplicate');
  assert.equal(accepted.outcome, 'committed');
  assert.equal(accepted.newRevisionNo, 1);

  // Device B replays the SAME decision id that Device A already committed.
  const replay = await b.acceptProposal(proposal.proposalId, 'dec_duplicate');
  assert.equal(replay.outcome, 'duplicate', 'second device replay is denied as duplicate');
  assert.equal(replay.newRevisionNo, null, 'no double-append');
  assert.equal(await store.currentRevision(project.projectId), 1, 'ledger stays at one revision');

  const replayAgain = await a.acceptProposal(proposal.proposalId, 'dec_duplicate');
  assert.equal(replayAgain.outcome, 'duplicate');
});

test('STALE PROPOSAL: new edits from another device block acceptance (base revision moved)', async () => {
  const store = new DeviceAdapterStore();
  const svc = new DeviceAdapterService(store);
  const a = await svc.openSession(DEVICE_A);
  const b = await svc.openSession(DEVICE_B);

  const project = await a.createProject('essay project');
  const run = await a.startRun(project.projectId, 0);
  await a.transition(run.runId, 'succeeded', 'proposal ready');
  const proposal = await a.propose(run.runId, { suggestion: 'rewrite intro' });

  // Device B saves a new edit AFTER the proposal was generated: base 0 -> 1.
  await b.saveDraft({ projectId: project.projectId, saveId: 's-1', payload: { body: 'new manual edit' }, expectedBaseRevision: 0 });
  assert.equal(await store.currentRevision(project.projectId), 1);

  await expectCode(a.acceptProposal(proposal.proposalId, 'dec_stale'), 'base_revision_moved');
  assert.equal(await store.currentRevision(project.projectId), 1, 'stale accept changes nothing');
});

test('CANCELLATION/RESTART: a cancelled run yields no proposals; a fresh run restarts cleanly and accepts', async () => {
  const store = new DeviceAdapterStore();
  const svc = new DeviceAdapterService(store);
  const a = await svc.openSession(DEVICE_A);
  const b = await svc.openSession(DEVICE_B);

  const project = await a.createProject('math practice deck');
  const cancelledRun = await a.startRun(project.projectId, 0);
  await a.transition(cancelledRun.runId, 'cancelled', 'user cancelled');
  await expectCode(a.propose(cancelledRun.runId, { suggestion: 'x' }), 'cancelled_run_no_proposal');

  // Restart: a NEW durable run on the same project and base revision.
  const restarted = await a.startRun(project.projectId, 0);
  await a.transition(restarted.runId, 'succeeded', 'proposal ready');
  const proposal = await a.propose(restarted.runId, { suggestion: 'add hints' });
  const accepted = await b.acceptProposal(proposal.proposalId, 'dec_restart');
  assert.equal(accepted.outcome, 'committed');
  assert.equal(accepted.newRevisionNo, 1, 'restart produced a live proposal and committed');
});

test('ACCOUNT SWITCH: closing a session denies the device; a different account is denied everywhere', async () => {
  const store = new DeviceAdapterStore();
  const svc = new DeviceAdapterService(store);
  const a = await svc.openSession(DEVICE_A);

  const project = await a.createProject('private draft');
  const run = await a.startRun(project.projectId, 0);
  await a.transition(run.runId, 'succeeded', 'proposal ready');
  const proposal = await a.propose(run.runId, { suggestion: 'edit' });

  // The owner signs out of Device A and another account uses the same device.
  await a.closeSession();
  await expectCode(a.saveDraft({ projectId: project.projectId, saveId: 's-x', payload: { x: 1 }, expectedBaseRevision: 0 }), 'session_closed');
  await expectCode(a.acceptProposal(proposal.proposalId, 'dec_switch'), 'session_closed');

  const switched = await svc.openSession(SAME_DEVICE_OTHER_ACCOUNT);
  await expectCode(switched.saveDraft({ projectId: project.projectId, saveId: 's-y', payload: { hacked: true }, expectedBaseRevision: 0 }), 'not_owner');
  await expectCode(switched.acceptProposal(proposal.proposalId, 'dec_hack'), 'not_owner');
  await expectCode(switched.history(project.projectId), 'not_owner');

  // The originals are untouched and the true owner can still operate on Device B.
  const b = await svc.openSession(DEVICE_B);
  const saved = await b.saveDraft({ projectId: project.projectId, saveId: 's-ok', payload: { ok: true }, expectedBaseRevision: 0 });
  assert.equal(saved.outcome, 'committed');
});

test('RESTORE/EXPORT FAILURE: tampered bytes fail manifest checks; unknown revisions fail cleanly', async () => {
  const store = new DeviceAdapterStore();
  const svc = new DeviceAdapterService(store);
  const a = await svc.openSession(DEVICE_A);

  const project = await a.createProject('report');
  await a.saveDraft({ projectId: project.projectId, saveId: 'r1', payload: { chapter: 'one' }, expectedBaseRevision: 0 });
  await a.saveDraft({ projectId: project.projectId, saveId: 'r2', payload: { chapter: 'two' }, expectedBaseRevision: 1 });

  const clean = await a.exportRevision(project.projectId, 1);
  assert.equal(clean.payload.chapter, 'one');
  assert.ok(clean.contentDigest.length === 64);

  // Corrupt the stored payload of revision 1 (manifest record unchanged).
  store.tamper(project.projectId, 1, { chapter: 'tampered!' });
  await expectCode(a.exportRevision(project.projectId, 1), 'export_integrity_failed');
  await expectCode(a.restore({ projectId: project.projectId, saveId: 'rst', fromRevisionNo: 1, expectedBaseRevision: 2 }), 'export_integrity_failed');
  assert.equal(await store.currentRevision(project.projectId), 2, 'no corrupted restore was written');

  // Unknown revision / unknown project fail closed.
  await expectCode(a.exportRevision(project.projectId, 99), 'unknown_revision');
  await expectCode(a.restore({ projectId: 'prj_ghost', saveId: 'r', fromRevisionNo: 1, expectedBaseRevision: 0 }), 'unknown_revision');
  await expectCode(a.history('prj_ghost'), 'unknown_project');
});

test('REVOKED SHARE: revocation strips the recipient on every device; revoked AI-permission blocks accept', async () => {
  const store = new DeviceAdapterStore();
  const svc = new DeviceAdapterService(store);
  const owner = await svc.openSession({ ...OWNER_SHARING, deviceId: 'device_a' });
  const recipient = await svc.openSession({ uid: RECIPIENT_B, workspaceId: 'ws_personal', deviceId: 'device_b' });
  const recipientSecondDevice = await svc.openSession({ uid: RECIPIENT_B, workspaceId: 'ws_personal', deviceId: 'device_c' });

  const project = await owner.createProject('shared draft');
  await owner.saveDraft({ projectId: project.projectId, saveId: 'sh1', payload: { note: 'v1' }, expectedBaseRevision: 0 });
  const share = await owner.shareRevision(project.projectId, 1, [RECIPIENT_B]);

  // Accepted recipient reads the exact revision on two devices.
  const viewed = await recipient.viewShared(share.shareId);
  assert.equal(viewed.revisionNo, 1);
  assert.equal(viewed.payload.note, 'v1');
  assert.equal((await recipientSecondDevice.viewShared(share.shareId)).revisionNo, 1);

  // Owner revokes the recipient: access is stripped account-wide, everywhere.
  store.revokeRecipient(share.shareId, RECIPIENT_B);
  await expectCode(recipient.viewShared(share.shareId), 'recipient_not_accepted');
  await expectCode(recipientSecondDevice.viewShared(share.shareId), 'recipient_not_accepted');
  await expectCode(recipientSecondDevice.shareRevision(project.projectId, 1, []), 'not_owner');

  // And an explicitly revoked AI-proposal permission blocks a live accept.
  const run = await owner.startRun(project.projectId, 1);
  await owner.transition(run.runId, 'succeeded', 'proposal ready');
  const proposal = await owner.propose(run.runId, { suggestion: 'new' });
  store.revokePermission(owner.actor.uid, project.projectId);
  await expectCode(owner.acceptProposal(proposal.proposalId, 'dec_revoked'), 'permission_revoked');
});

test('TWO-DEVICE AGREEMENT: Device B observes the exact same ledger Device A writes, no divergence', async () => {
  const store = new DeviceAdapterStore();
  const svc = new DeviceAdapterService(store);
  const a = await svc.openSession(DEVICE_A);
  const b = await svc.openSession(DEVICE_B);

  const project = await a.createProject('convergent deck');
  await a.saveDraft({ projectId: project.projectId, saveId: 'c1', payload: { v: 'first' }, expectedBaseRevision: 0 });
  await a.saveDraft({ projectId: project.projectId, saveId: 'c2', payload: { v: 'second' }, expectedBaseRevision: 1 });

  const historyA = await a.history(project.projectId);
  const historyB = await b.history(project.projectId);
  assert.equal(historyA.length, 2);
  assert.equal(historyB.length, 2);
  assert.equal(
    JSON.stringify(historyB.map((r) => r.payload)),
    JSON.stringify(historyA.map((r) => r.payload)),
    'device B sees the identical committed revisions',
  );
});
