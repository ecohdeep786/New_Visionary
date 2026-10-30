/**
 * LEARN-13 (KAN-153) — rights-aware offline lessons and pending-attempt
 * reconciliation. Proven against the real module over the in-memory store:
 *
 *   1. RIGHTS-APPROVED DOWNLOAD: an eligible owner receives the immutable pack
 *      (digest + bounded size); the received bytes re-digest to the same
 *      digest. Unconsented / withdrawn / unleased / unknown refusals fail as
 *      Denial (never forged success).
 *   2. BOUNDED STORAGE: the per-owner quota is enforced across downloads.
 *   3. PENDING-ATTEMPT REPLAY: pending attempts bound to the pack's ORIGINAL
 *      base version are replayed in order on reconnect and server-assessed.
 *   4. NO LOCAL PASS FLAG: a client "passed" claim does not flip the server
 *      verdict (server-owned criteria decides); the claim is carried only as a
 *      claim.
 *   5. DUPLICATE / OUT-OF-ORDER CONVERGENCE: a replayed command id converges to
 *      the recorded outcome (duplicate), out-of-order attempts are ordered by
 *      staging time.
 *   6. LEASE EXPIRY + SOURCE WITHDRAWAL: new offline commands are denied (no
 *      forged evidence) while committed evidence stays; the revocation
 *      limitation for already-downloaded bytes is disclosed.
 *   7. ACCOUNT SWITCH + WRONG USER: a different account never sees another
 *      user's downloads / pending attempts (not_owner); nothing leaks.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { InMemoryOfflineStore, digestBytes } = req('./dist/src/offlinelearning/offlinelearning-lookups.js');
const { OfflineLearningService } = req('./dist/src/offlinelearning/offlinelearning-service.js');
const { OfflineError } = req('./dist/src/offlinelearning/offlinelearning-types.js');

const OWNER = { uid: 'uid_learner', workspaceId: 'ws_personal' };
const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };

// A small protected criteria registry server-side. The KEY (correct answer) is
// never returned to a client; only verdicts/awards leak out through assessment.
const CRITERIA = {
  'pack_l1@1': { key: 42, passPoints: 10, retryKey: 7 },
};

const PACK = { packId: 'pack_l1', sourceId: 'src_l1', lessonId: 'les_1', sourceVersion: 1, criteriaVersion: 1, rendererVersion: 1, sizeBytes: 500, contentDigest: '' };

function digest(payload) {
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

function makeHarness() {
  const store = new InMemoryOfflineStore(CRITERIA);
  store.setPack({ ...PACK, contentDigest: digest('lesson-pack-bytes') });
  store.setConsent(OWNER.uid, 'pack_l1', true);
  store.setLease(OWNER.uid, 'pack_l1', true);
  const svc = new OfflineLearningService(store);
  return { store, svc };
}

test('RIGHTS-APPROVED DOWNLOAD: eligible owner gets the immutable digest; ineligible refusals deny', async () => {
  const { svc, store } = makeHarness();
  const d = await svc.downloadPack(OWNER, 'pack_l1', 'device_a');
  assert.equal(d.ok, true, 'download authorized');
  if (d.ok) {
    assert.equal(d.contentDigest, digest('lesson-pack-bytes'));
    assert.equal(d.sizeBytes, 500);
    assert.equal(d.offlineAvailability, true);
    assert.ok(d.revocationLimitation.length > 0, 'revocation limitation disclosed');
  }

  // Unconsented owner refused.
  store.setConsent(OWNER.uid, 'pack_l1', false);
  const denied = await svc.downloadPack(OWNER, 'pack_l1', 'device_a');
  assert.equal(denied.ok, false);
  if (!denied.ok) assert.equal(denied.reason, 'consent_not_active');

  // Unknown pack refused.
  const unknown = await svc.downloadPack(OWNER, 'pack_ghost', 'device_a');
  assert.equal(unknown.ok, false);
  if (!unknown.ok) assert.equal(unknown.reason, 'unknown_pack');
});

test('BOUNDED STORAGE: per-owner quota is enforced across downloads', async () => {
  const { store, svc } = makeHarness();
  // Make two packs that together exceed the default 1MB quota.
  store.setPack({ ...PACK, packId: 'pack_big', sizeBytes: 999900 });
  store.setConsent(OWNER.uid, 'pack_big', true);
  store.setLease(OWNER.uid, 'pack_big', true);
  const first = await svc.downloadPack(OWNER, 'pack_big', 'device_a');
  assert.equal(first.ok, true);
  const second = await svc.downloadPack(OWNER, 'pack_l1', 'device_a'); // 999900 + 500 > 1M
  assert.equal(second.ok, false);
  if (!second.ok) {
    assert.equal(second.reason, 'storage_limit');
    assert.ok(second.usedBytes + 500 > second.quotaBytes, 'quota accounting is real');
  }
});

test('PENDING-ATTEMPT REPLAY: pending attempts are server-assessed in order on reconnect', async () => {
  const { svc } = makeHarness();
  await svc.downloadPack(OWNER, 'pack_l1', 'device_a');
  // Two pending attempts staged offline, bound to the pack base version 1.
  await svc.stagePending(OWNER, { commandId: 'cmd-1', packId: 'pack_l1', baseVersion: 1, answer: 42, clientClaimedPass: true });
  await svc.stagePending(OWNER, { commandId: 'cmd-2', packId: 'pack_l1', baseVersion: 1, answer: 7, clientClaimedPass: false });

  const r = await svc.reconcilePending(OWNER, 'pack_l1');
  assert.equal(r.outcomes.length, 2);
  assert.equal(r.outcomes[0].commandId, 'cmd-1');
  assert.equal(r.outcomes[0].outcome, 'assessed');
  assert.equal(r.outcomes[0].verdict, 'pass', 'server assessed the correct answer');
  assert.equal(r.outcomes[0].awardedPoints, 10);
  assert.equal(r.outcomes[1].verdict, 'retry', 'server assessed the wrong answer as retry');
  assert.equal(r.reauthorization.sessionEligible, true);
});

test('NO LOCAL PASS FLAG: a client pass claim never flips the server verdict', async () => {
  const { svc } = makeHarness();
  await svc.downloadPack(OWNER, 'pack_l1', 'device_a');
  // Client CLAIMS pass but the answer is actually wrong.
  await svc.stagePending(OWNER, { commandId: 'cmd-fake', packId: 'pack_l1', baseVersion: 1, answer: 999, clientClaimedPass: true });

  const r = await svc.reconcilePending(OWNER, 'pack_l1');
  const o = r.outcomes.find((x) => x.commandId === 'cmd-fake');
  assert.ok(o);
  assert.equal(o.claimedPass, true, 'claim recorded as a claim only');
  assert.equal(o.verdict, 'needs_review', 'server verdict overrules the client pass claim');
  assert.equal(o.awardedPoints, 0);
});

test('DUPLICATE / OUT-OF-ORDER CONVERGENCE: replay converges, ordering by staging time', async () => {
  const { svc } = makeHarness();
  await svc.downloadPack(OWNER, 'pack_l1', 'device_a');
  await svc.stagePending(OWNER, { commandId: 'cmd-x', packId: 'pack_l1', baseVersion: 1, answer: 42, clientClaimedPass: false });
  const first = await svc.reconcilePending(OWNER, 'pack_l1');
  assert.equal(first.outcomes[0].outcome, 'assessed');
  assert.equal(first.outcomes[0].verdict, 'pass');

  // Reconnect replay of the SAME command id converges (duplicate, same outcome).
  const second = await svc.reconcilePending(OWNER, 'pack_l1');
  assert.equal(second.outcomes[0].outcome, 'duplicate');
  assert.equal(second.outcomes[0].verdict, 'pass', 'converged to the recorded outcome');
});

test('LEASE EXPIRY + SOURCE WITHDRAWAL: new offline commands denied, committed evidence preserved, limitation disclosed', async () => {
  const { svc, store } = makeHarness();
  await svc.downloadPack(OWNER, 'pack_l1', 'device_a');
  await svc.stagePending(OWNER, { commandId: 'cmd-keep', packId: 'pack_l1', baseVersion: 1, answer: 42, clientClaimedPass: false });
  const committed = await svc.reconcilePending(OWNER, 'pack_l1');
  assert.equal(committed.outcomes[0].verdict, 'pass');

  // Source withdrawn: a NEW offline command is denied (no forged evidence).
  store.setSourceWithdrawn('pack_l1', true);
  await svc.stagePending(OWNER, { commandId: 'cmd-new', packId: 'pack_l1', baseVersion: 1, answer: 42, clientClaimedPass: false });
  const afterWithdraw = await svc.reconcilePending(OWNER, 'pack_l1');
  const newOutcome = afterWithdraw.outcomes.find((x) => x.commandId === 'cmd-new');
  assert.equal(newOutcome.acceptEvidence, false, 'new evidence not accepted after withdrawal');
  assert.equal(afterWithdraw.reauthorization.sourceWithdrawn, true);
  assert.ok(afterWithdraw.revocationLimitation.length > 0, 'revocation limitation disclosed');

  // Re-download is denied after withdrawal while the previously downloaded bytes stay.
  const redownload = await svc.downloadPack(OWNER, 'pack_l1', 'device_a');
  assert.equal(redownload.ok, false);
  if (!redownload.ok) assert.equal(redownload.reason, 'source_withdrawn');
});

test('ACCOUNT SWITCH + WRONG USER: another account never sees downloads/pending, nothing leaks', async () => {
  const { svc, store } = makeHarness();
  await svc.downloadPack(OWNER, 'pack_l1', 'device_a');
  await svc.stagePending(OWNER, { commandId: 'cmd-private', packId: 'pack_l1', baseVersion: 1, answer: 42, clientClaimedPass: false });

  // Another account cannot read the owner's download (not_owner).
  await assert.rejects(() => svc.readPackDownload(OTHER, 'dl_1'), (e) => e instanceof OfflineError && e.code === 'not_owner');
  // Another account cannot stage against a pack it did not download (not_owner).
  await assert.rejects(() => svc.stagePending(OTHER, { commandId: 'cmd-theft', packId: 'pack_l1', baseVersion: 1, answer: 42, clientClaimedPass: false }), (e) => e instanceof OfflineError && e.code === 'not_owner');
  // Another account cannot reconcile the owner's pack (not_owner).
  await assert.rejects(() => svc.reconcilePending(OTHER, 'pack_l1'), (e) => e instanceof OfflineError && e.code === 'not_owner');
});
