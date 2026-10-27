/**
 * PRIV-03 (KAN-112) — restore against deletion/consent tombstones and current
 * policy, so backup recovery cannot revive prohibited access or erased derived
 * records.
 *
 * Proven here:
 *   1. DELETION TOMBSTONES WIN: erased records are dropped on restore (never
 *      resurrected),
 *   2. CONSENT TOMBSTONES WIN: learning-data records for a consent-revoked
 *      learner are dropped,
 *   3. CURRENT POLICY WINS: a record carrying a now-forbidden field is dropped
 *      (the backup-era policy does not survive),
 *   4. DERIVED records are never revived (erased caches/artifacts stay erased),
 *   5. raw private text inside a backup record refuses that record,
 *   6. the receipt is honest (per-drop reasons and counts).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { RestoreTombstoneService } = req('./dist/src/restoretombstone/restore-tombstone-service.js');
const { InMemoryRestoreStore } = req('./dist/src/restoretombstone/restore-tombstone-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };

async function makeService() {
  const store = new InMemoryRestoreStore();
  store.seedFieldPolicy('learning_text', ['uid', 'conversationId', 'turnBody', 'conceptId', 'sourceVersion', 'createdAt']);
  store.seedFieldPolicy('source_files', ['uid', 'fileRef', 'sourceVersion', 'manifestDigest', 'uploadedAt']);
  const svc = new RestoreTombstoneService(store);
  return { store, svc };
}

// ---------------------------------------------------------------------------

test('DELETION TOMBSTONES WIN: erased records are dropped on restore — never resurrected', async () => {
  const { store, svc } = await makeService();
  store.seedTombstone({ ownerUid: OWNER.uid, dataClass: 'source_files', kind: 'deletion', at: new Date().toISOString() });

  const receipt = await svc.restore({
    backupId: 'bkp_1',
    owner: OWNER,
    records: [
      { dataClass: 'source_files', payload: { uid: OWNER.uid, fileRef: 'gs://f/old', sourceVersion: '1.0.0', manifestDigest: 'd', uploadedAt: 'x' }, backupPolicyVersion: 'priv-v0' },
      { dataClass: 'learning_text', payload: { uid: OWNER.uid, conversationId: 'c1', turnBody: 'kept', conceptId: 'c1', sourceVersion: '1.1.0', createdAt: 'x' }, backupPolicyVersion: 'priv-v0' },
    ],
  });
  assert.equal(receipt.restored, 1, 'only the non-erased record restores');
  assert.deepEqual(receipt.drops, [{ dataClass: 'source_files', reason: 'deletion_tombstone' }], 'the erased record stays erased');
  assert.ok(!store.restoredRecords().some((r) => r.dataClass === 'source_files'), 'no resurrection in the store');
});

test('CONSENT TOMBSTONES WIN: learning-data records for a consent-revoked learner are dropped', async () => {
  const { store, svc } = await makeService();
  store.seedTombstone({ ownerUid: OWNER.uid, dataClass: 'learning_text', kind: 'consent_revocation', at: new Date().toISOString() });

  const receipt = await svc.restore({
    backupId: 'bkp_2',
    owner: OWNER,
    records: [
      { dataClass: 'learning_text', payload: { uid: OWNER.uid, conversationId: 'c1', turnBody: 'x', conceptId: 'c1', sourceVersion: '1.1.0', createdAt: 'x' }, backupPolicyVersion: 'priv-v0' },
      { dataClass: 'source_files', payload: { uid: OWNER.uid, fileRef: 'gs://f/1', sourceVersion: '1.0.0', manifestDigest: 'd', uploadedAt: 'x' }, backupPolicyVersion: 'priv-v0' },
    ],
  });
  assert.deepEqual(receipt.drops, [{ dataClass: 'learning_text', reason: 'consent_revocation' }], 'revoked consent cannot be undone by a backup');
  assert.equal(receipt.restored, 1, 'non-guarded class restores');
});

test('CURRENT POLICY WINS: a record carrying a now-forbidden field is dropped (backup-era policy does not survive)', async () => {
  const { svc } = await makeService();
  const receipt = await svc.restore({
    backupId: 'bkp_3',
    owner: OWNER,
    records: [
      // fullTranscript was permitted under the backup-era policy, forbidden now.
      { dataClass: 'learning_text', payload: { uid: OWNER.uid, conversationId: 'c1', turnBody: 'x', conceptId: 'c1', sourceVersion: '1.1.0', createdAt: 'x', fullTranscript: 'old-style dump' }, backupPolicyVersion: 'priv-v0' },
    ],
  });
  assert.deepEqual(receipt.drops, [{ dataClass: 'learning_text', reason: 'current_policy' }]);
  assert.equal(receipt.restored, 0);
});

test('DERIVED records are never revived: erased caches/artifacts stay erased', async () => {
  const { store, svc } = await makeService();
  store.markDerived('caches');
  const receipt = await svc.restore({
    backupId: 'bkp_4',
    owner: OWNER,
    records: [
      { dataClass: 'caches', payload: { entry: 'old cached answer' }, backupPolicyVersion: 'priv-v0' },
    ],
  });
  assert.deepEqual(receipt.drops, [{ dataClass: 'caches', reason: 'derived_not_revived' }]);
  assert.equal(receipt.restored, 0, 'derived state regenerates under current policy, never revives');
});

test('raw private text inside a backup record refuses that record', async () => {
  const { svc } = await makeService();
  const raw = 'private note the learner never consented to re-export';
  const receipt = await svc.restore({
    backupId: 'bkp_5',
    owner: OWNER,
    records: [
      { dataClass: 'learning_text', payload: { uid: OWNER.uid, conversationId: 'c1', turnBody: raw, conceptId: 'c1', sourceVersion: '1.1.0', createdAt: 'x' }, backupPolicyVersion: 'priv-v0' },
    ],
    rawPrivateText: [raw],
  });
  assert.deepEqual(receipt.drops, [{ dataClass: 'learning_text', reason: 'raw_private_text' }]);
  assert.equal(receipt.restored, 0);
});

test('the receipt is honest: per-drop reasons and counts; clean backups restore fully', async () => {
  const { store, svc } = await makeService();
  store.seedTombstone({ ownerUid: OWNER.uid, dataClass: 'source_files', kind: 'deletion', at: new Date().toISOString() });
  const receipt = await svc.restore({
    backupId: 'bkp_6',
    owner: OWNER,
    records: [
      { dataClass: 'source_files', payload: { uid: OWNER.uid, fileRef: 'gs://f/x', sourceVersion: '1.0.0', manifestDigest: 'd', uploadedAt: 'x' }, backupPolicyVersion: 'priv-v0' },
      { dataClass: 'learning_text', payload: { uid: OWNER.uid, conversationId: 'c1', turnBody: 'a', conceptId: 'c1', sourceVersion: '1.1.0', createdAt: 'x' }, backupPolicyVersion: 'priv-v0' },
      { dataClass: 'learning_text', payload: { uid: OWNER.uid, conversationId: 'c2', turnBody: 'b', conceptId: 'c1', sourceVersion: '1.1.0', createdAt: 'x' }, backupPolicyVersion: 'priv-v0' },
    ],
  });
  assert.equal(receipt.dropped, 1);
  assert.equal(receipt.restored, 2, 'clean records restore with full provenance');
  assert.equal(store.restoredRecords().length, 2);
});
