const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { randomUUID } = require('node:crypto');
const { resolve } = require('node:path');
const req = createRequire(resolve(__dirname, '../upstream/backend/package.json'));
const { Firestore } = req('firebase-admin/firestore');
const { PrivacyCoreService } = req('./dist/src/privacycore/privacy-core-service.js');
const { FirestorePrivacyStore } = req('./dist/src/privacycore/firestore-privacy-store.js');
const { privacyPolicyDraft, validatePrivacyPolicy, approvedPolicy, digest } = req('./dist/src/privacycore/privacy-policy.js');
if (!/^127[.]0[.]0[.]1:[0-9]{1,5}$/.test(process.env.FIRESTORE_EMULATOR_HOST || '')) throw Error('Explicit loopback emulator required; live fallback prohibited.');
const projectId = 'demo-visionary-kan110';
const db = new Firestore({ projectId });
const now = new Date('2026-11-02T10:00:00Z'), future = '2026-11-03T10:00:00Z';
const approver = 'synthetic-policy-reviewer', serviceUid = 'synthetic-model-service';
const options = { trustedApprovers: [approver], trustedServices: [serviceUid], now: () => now };
const owned = [];
function snapshot() {
  const value = privacyPolicyDraft();
  for (const c of value.policy.classes) c.retention = { mode: 'owner_controlled', rationale: 'Synthetic test policy only; no legal or product approval.' };
  value.approval = { state: 'approved', policyVersion: value.policy.policyVersion, policyDigest: digest(value.policy), approvedBy: approver, approvedAt: '2026-11-01T00:00:00Z' };
  return value;
}
async function fixture() {
  const namespace = 'test-' + randomUUID().replaceAll('-', '');
  const root = db.collection('visionary_privacy_control').doc(namespace), uid = namespace;
  const account = db.collection('visionary_accounts').doc(uid); owned.push(root, account);
  await root.collection('policies').doc('current').set(snapshot());
  await account.set({ uid, identity: { uid }, storageVersion: 2, profile: { age_band: 'adult', name: 'Synthetic preserved' }, onboarding: { status: 'complete' } });
  await account.collection('billing').doc('preserved').set({ revision: 7, uid });
  await root.collection('acknowledgements').doc(digest(uid)).set({ uid, policyVersion: 'priv-review-v1', policyDigest: snapshot().approval.policyDigest, purpose: 'personal-policy-review', status: 'active', expiresAt: future, revokedAt: null });
  const store = new FirestorePrivacyStore(db, namespace), core = new PrivacyCoreService(store, options);
  const input = { uid, runId: 'run-1', modelVersion: 'model-1', evidenceDigest: 'a'.repeat(64) }, key = digest([uid, input.runId]);
  await root.collection('artifactProposals').doc(key).set({ ...input, serviceUid, policyVersion: 'priv-review-v1', policyDigest: snapshot().approval.policyDigest, purpose: 'model-operation', status: 'approved', expiresAt: future, revokedAt: null });
  return { namespace, root, uid, account, store, core, input, key };
}
const denies = (work, code) => assert.rejects(work, error => error.code === code);
test.after(async () => { for (const root of owned) await db.recursiveDelete(root); await db.terminate(); });
for (const [label, mutate] of [
  ['NaN retention', p => p.classes[0].retention = { mode: 'bounded_days', days: NaN, rationale: 'test' }],
  ['infinite retention', p => p.classes[0].retention = { mode: 'bounded_days', days: Infinity, rationale: 'test' }],
  ['negative retention', p => p.classes[0].retention = { mode: 'bounded_days', days: -1, rationale: 'test' }],
  ['empty version', p => p.policyVersion = ''],
  ['duplicate data class', p => p.classes[1].dataClass = p.classes[0].dataClass],
  ['unknown data class', p => p.classes[0].dataClass = 'unknown'],
  ['unknown retention field', p => p.classes[0].retention.rawText = 'unbounded'],
  ['caller age threshold', p => p.admission.minimumSelfServeAge = 13],
  ['child activation flag', p => p.admission.under18Activation = 'enabled'],
]) test('policy rejects ' + label, () => { const p = snapshot().policy; mutate(p); assert.throws(() => validatePrivacyPolicy(p), e => e.code === 'policy_invalid'); });
test('draft and absent approvals cannot become policy', () => {
  assert.throws(() => approvedPolicy(privacyPolicyDraft(), new Set([approver]), now), e => e.code === 'policy_unapproved');
  const s = snapshot(); delete s.approval; assert.throws(() => approvedPolicy(s, new Set([approver]), now), e => e.code === 'policy_unapproved');
});
for (const [label, mutate] of [
  ['digest', s => s.policy.classes[0].purpose += ' changed'],
  ['version', s => s.approval.policyVersion = 'old'],
  ['untrusted reviewer', s => s.approval.approvedBy = 'outsider'],
  ['future approval', s => s.approval.approvedAt = future],
]) test('approval rejects ' + label, () => { const s = snapshot(); mutate(s); assert.throws(() => approvedPolicy(s, new Set([approver]), now), e => e.code === 'policy_unapproved'); });
test('canonical digest tolerates key order but binds content', () => { assert.equal(digest({ b: 2, a: 1 }), digest({ a: 1, b: 2 })); assert.notEqual(digest({ a: 1 }), digest({ a: 2 })); });
test('default empty approver trust denies persisted fixture approval', async () => { const f = await fixture(); await denies(() => new PrivacyCoreService(f.store).admission(f.uid), 'policy_unapproved'); });
test('current canonical adult profile and current own acknowledgement permit only declared adult boundary', async () => { const f = await fixture(); assert.deepEqual(await f.core.admission(f.uid), { allowed: true, state: 'adult_current_boundary', assurance: 'declared' }); });
for (const [label, change, expected] of [
  ['minor', { 'profile.age_band': 'under_18' }, 'guardian_review_required'],
  ['unknown age', { 'profile.age_band': 'unknown' }, 'guardian_review_required'],
  ['wrong identity', { 'identity.uid': 'other' }, 'review_required'],
  ['copying account', { 'storageMigration.status': 'copying' }, 'review_required'],
  ['unfinished onboarding', { 'onboarding.status': 'pending' }, 'review_required'],
]) test('admission denies ' + label + ' from actual account', async () => { const f = await fixture(); await f.account.update(change); assert.deepEqual(await f.core.admission(f.uid), { allowed: false, state: expected }); });
for (const [label, change] of [
  ['expired', { expiresAt: '2026-10-01T00:00:00Z' }], ['revoked', { revokedAt: '2026-11-01T00:00:00Z' }], ['wrong version', { policyVersion: 'old' }], ['wrong owner', { uid: 'other' }], ['wrong purpose', { purpose: 'guardian-grant' }],
]) test('admission denies ' + label + ' acknowledgement', async () => { const f = await fixture(); await f.root.collection('acknowledgements').doc(digest(f.uid)).update(change); assert.equal((await f.core.admission(f.uid)).allowed, false); });
test('separate subject records and caller guardian flag cannot change minor account admission', async () => {
  const f = await fixture(); await f.account.update({ 'profile.age_band': 'under_18' });
  await f.root.collection('subjects').doc(digest(f.uid)).set({ ageBand: 'adult', guardianApproved: true });
  assert.equal((await f.core.admission(f.uid, { age: 30, guardianApproved: true })).allowed, false);
});
test('shared minimizer rejects forbidden and non-JSON fields', async () => {
  const f = await fixture();
  for (const input of [{ rawPrivateText: [] }, { runId: { rawPrivateText: 'synthetic-private-text', password: 'synthetic-not-secret' } }, { runId: [] }, { runId: null }, { runId: NaN }, { runId: undefined }, { runId: () => true }, { runId: { nested: { nested: { nested: [] } } } }]) await denies(() => f.core.minimize('model_artifacts', input), 'field_not_minimized');
  assert.deepEqual(await f.core.minimize('model_artifacts', { runId: 'safe' }), { runId: 'safe' });
});
test('artifact rejects raw text and untrusted service without writing', async () => {
  const f = await fixture(); await assert.rejects(() => f.core.collectArtifact(serviceUid, { ...f.input, rawPrivateText: [] }));
  await denies(() => f.core.collectArtifact('outsider', f.input), 'access_denied'); assert.equal((await f.root.collection('artifacts').get()).size, 0);
});
for (const [label, change] of [ ['expired', { expiresAt: '2026-10-01T00:00:00Z' }], ['revoked', { revokedAt: '2026-11-01T00:00:00Z' }], ['wrong service', { serviceUid: 'other' }], ['wrong owner', { uid: 'other' }], ['changed evidence', { evidenceDigest: 'b'.repeat(64) }], ['stale policy', { policyVersion: 'old' }] ]) test('artifact denies ' + label + ' proposal', async () => {
  const f = await fixture(); await f.root.collection('artifactProposals').doc(f.key).update(change); await denies(() => f.core.collectArtifact(serviceUid, f.input), 'access_denied'); assert.equal((await f.root.collection('artifacts').get()).size, 0);
});
test('concurrent artifact writes produce one minimized durable row and cold-client replay', async () => {
  const f = await fixture(); const results = await Promise.all([f.core.collectArtifact(serviceUid, f.input), f.core.collectArtifact(serviceUid, f.input)]);
  assert.equal(results.filter(r => !r.replay).length, 1);
  const rows = await f.root.collection('artifacts').get(); assert.equal(rows.size, 1);
  assert.deepEqual(Object.keys(rows.docs[0].data()).sort(), ['uid','runId','modelVersion','evidenceDigest','occurredAt','policyDigest','policyVersion','serviceUid'].sort());
  const cold = new Firestore({ projectId }); try { assert.deepEqual(await new PrivacyCoreService(new FirestorePrivacyStore(cold, f.namespace), options).collectArtifact(serviceUid, f.input), { replay: true }); } finally { await cold.terminate(); }
});
test('artifact replay rejects corrupted timestamp', async () => { const f = await fixture(); await f.core.collectArtifact(serviceUid, f.input); await f.root.collection('artifacts').doc(f.key).update({ occurredAt: 'invalid' }); await denies(() => f.core.collectArtifact(serviceUid, f.input), 'conflict'); });
test('erasure durably creates pending request plus restriction, preserves account/billing and denies future processing', async () => {
  const f = await fixture(), before = (await f.account.get()).data();
  const result = await f.core.requestErasure(f.uid, 'erase-1'); assert.equal(result.deletionComplete, false); assert.equal(result.request.state, 'pending');
  assert.deepEqual((await f.account.get()).data(), before); assert.equal((await f.account.collection('billing').doc('preserved').get()).data().revision, 7);
  assert.equal((await f.core.admission(f.uid)).state, 'processing_restricted'); await denies(() => f.core.collectArtifact(serviceUid, f.input), 'processing_restricted');
  assert.equal((await f.core.requestErasure(f.uid, 'erase-2')).request.id, result.request.id);
});
test('before-commit outage leaves neither erasure receipt nor fence', async () => {
  const f = await fixture(); const outage = { transaction: work => f.store.transaction(async tx => { await work(tx); throw Error('synthetic before-commit failure'); }) };
  await assert.rejects(() => new PrivacyCoreService(outage, options).requestErasure(f.uid, 'erase-1'), /before-commit/);
  assert.equal((await f.root.collection('requests').get()).size, 0); assert.equal((await f.root.collection('restrictions').get()).size, 0);
  assert.equal((await f.core.requestErasure(f.uid, 'erase-1')).replay, false);
});
test('lost acknowledgement after real commit cold-replays one pending erasure', async () => {
  const f = await fixture(); const outage = { transaction: async work => { await f.store.transaction(work); throw Error('synthetic lost acknowledgement'); } };
  await assert.rejects(() => new PrivacyCoreService(outage, options).requestErasure(f.uid, 'erase-1'), /lost acknowledgement/);
  const cold = new Firestore({ projectId }); try { const r = await new PrivacyCoreService(new FirestorePrivacyStore(cold, f.namespace), options).requestErasure(f.uid, 'erase-1'); assert.equal(r.replay, true); assert.equal(r.deletionComplete, false); } finally { await cold.terminate(); }
  assert.equal((await f.root.collection('requests').get()).size, 1); assert.equal((await f.root.collection('restrictions').get()).size, 1);
});
test('erasure rejects corrupted fence pointer even if keyed request exists', async () => {
  const f = await fixture(); await f.core.requestErasure(f.uid, 'erase-1'); await f.root.collection('restrictions').doc(digest(f.uid)).update({ requestId: 'b'.repeat(64) }); await denies(() => f.core.requestErasure(f.uid, 'erase-1'), 'conflict');
});
test('concurrent erasure commands converge on one pending request', async () => {
  const f = await fixture(); const r = await Promise.all([f.core.requestErasure(f.uid, 'a'), f.core.requestErasure(f.uid, 'b')]); assert.equal(r[0].request.id, r[1].request.id); assert.equal((await f.root.collection('requests').get()).size, 1);
});
test('in-flight artifact read and erasure serialize; later processing sees the fence', async () => {
  const f = await fixture(); let release, ready; const gate = new Promise(ok => release = ok), observed = new Promise(ok => ready = ok); let first = true;
  const delayed = { transaction: work => f.store.transaction(tx => work({ ...tx, restriction: async uid => { const value = await tx.restriction(uid); if (first) { first = false; ready(); await gate; } return value; } })) };
  const pending = new PrivacyCoreService(delayed, options).collectArtifact(serviceUid, f.input); pending.catch(() => {});
  await Promise.race([observed, new Promise((_, fail) => setTimeout(() => fail(Error('readiness timeout')), 10000))]);
  const erasure = f.core.requestErasure(f.uid, 'erase-after-inflight');
  release(); await pending; await erasure;
  await denies(() => f.core.collectArtifact(serviceUid, f.input), 'processing_restricted');
});

test('same-version content change invalidates both old acknowledgement and artifact proposal', async () => {
  const f = await fixture(), changed = snapshot();
  changed.policy.classes[0].purpose += ' changed'; changed.approval.policyDigest = digest(changed.policy);
  await f.root.collection('policies').doc('current').set(changed);
  assert.equal((await f.core.admission(f.uid)).allowed, false);
  await denies(() => f.core.collectArtifact(serviceUid, f.input), 'access_denied');
  assert.equal((await f.root.collection('artifacts').get()).size, 0);
  await f.root.collection('acknowledgements').doc(digest(f.uid)).update({ policyDigest: changed.approval.policyDigest });
  await f.root.collection('artifactProposals').doc(f.key).update({ policyDigest: changed.approval.policyDigest });
  assert.equal((await f.core.admission(f.uid)).allowed, true);
  assert.equal((await f.core.collectArtifact(serviceUid, f.input)).replay, false);
  assert.equal((await f.root.collection('artifacts').doc(f.key).get()).data().policyDigest, changed.approval.policyDigest);
});
test('missing or corrupt acknowledgement/proposal digest denies rather than upgrading old proof', async () => {
  for (const value of [null, '', 'wrong']) {
    const f = await fixture();
    await f.root.collection('acknowledgements').doc(digest(f.uid)).update({ policyDigest: value });
    await f.root.collection('artifactProposals').doc(f.key).update({ policyDigest: value });
    assert.equal((await f.core.admission(f.uid)).allowed, false);
    await denies(() => f.core.collectArtifact(serviceUid, f.input), 'access_denied');
  }
});
