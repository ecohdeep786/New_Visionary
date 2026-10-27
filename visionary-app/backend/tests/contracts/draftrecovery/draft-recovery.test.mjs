/**
 * BUILD-02 (KAN-76) — per-tab original-base draft recovery, compare/resolve
 * conflicts, reviewed import of local originals with idempotent transfer and
 * count/digest verification.
 *
 * Proven here:
 *   1. per-tab drafts recover byte-exactly (owner-scoped; unknown tab fails),
 *   2. two tabs from the same base: first commits, second gets an explicit
 *      conflict carrying BOTH payloads for comparison,
 *   3. resolution is deliberate (server/tab/merged), appends a new revision
 *      with provenance, cannot resolve twice, history never rewrites,
 *   4. local originals import ONLY through a reviewed ownership mapping,
 *   5. transfer is idempotent by import id (no duplicate originals),
 *   6. every batch is verified by declared count AND digest before acceptance.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { DraftRecoveryService } = req('./dist/src/draftrecovery/draft-recovery.js');
const { InMemoryDraftRecoveryStore } = req('./dist/src/draftrecovery/draft-recovery-lookups.js');

const OWNER = { uid: 'uid_builder_1', workspaceId: 'ws_personal' };
const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const PROJECT = 'prj_solar';

async function makeService() {
  const store = new InMemoryDraftRecoveryStore();
  const svc = new DraftRecoveryService(store);
  return { store, svc };
}

// ---------------------------------------------------------------------------

test('per-tab drafts recover byte-exactly; owner-scoped; unknown tab fails closed', async () => {
  const { svc } = await makeService();
  const payload = { scene: 'orbit model', notes: 'half built' };
  await svc.registerTabDraft(OWNER, PROJECT, 'tab_a', 0, payload);

  // Recover after "disconnect" — byte-exact.
  const recovered = await svc.recoverDraft(OWNER, PROJECT, 'tab_a');
  assert.deepEqual(recovered.payload, payload, 'byte-exact recovery');
  assert.equal(recovered.baseRevision, 0);

  await assert.rejects(() => svc.recoverDraft(OWNER, PROJECT, 'tab_ghost'), (e) => e.code === 'unknown_tab');
  await assert.rejects(() => svc.recoverDraft(OTHER, PROJECT, 'tab_a'), (e) => e.code === 'not_owner');
});

test('two tabs from the same base: first save commits; second gets an explicit conflict with BOTH payloads', async () => {
  const { svc } = await makeService();
  await svc.registerTabDraft(OWNER, PROJECT, 'tab_a', 0, { from: 'tabA' });
  await svc.registerTabDraft(OWNER, PROJECT, 'tab_b', 0, { from: 'tabB' });

  const first = await svc.saveFromTab(OWNER, PROJECT, 'tab_a');
  assert.deepEqual(first, { committed: true, revisionNo: 1 });

  const conflict = await svc.saveFromTab(OWNER, PROJECT, 'tab_b');
  assert.equal(conflict.conflictId, 'cfl_1');
  assert.deepEqual(conflict.serverPayload, { from: 'tabA' }, 'server payload surfaced for compare');
  assert.deepEqual(conflict.tabPayload, { from: 'tabB' }, 'tab payload surfaced for compare');
  assert.equal(conflict.serverRevision, 1);
  assert.equal(conflict.resolvedAt, null);
});

test('resolution is deliberate (server/tab/merged), appends a new revision with provenance, cannot resolve twice', async () => {
  const { store, svc } = await makeService();
  await svc.registerTabDraft(OWNER, PROJECT, 'tab_a', 0, { from: 'tabA' });
  await svc.registerTabDraft(OWNER, PROJECT, 'tab_b', 0, { from: 'tabB' });
  await svc.saveFromTab(OWNER, PROJECT, 'tab_a');
  const conflict = await svc.saveFromTab(OWNER, PROJECT, 'tab_b');

  // Resolve with the TAB payload.
  const res1 = await svc.resolveConflict(OWNER, conflict.conflictId, 'tab');
  assert.equal(res1.disposition, 'tab');
  assert.deepEqual(res1.payload, { from: 'tabB' });
  assert.equal(res1.newRevisionNo, 2);

  await assert.rejects(
    () => svc.resolveConflict(OWNER, conflict.conflictId, 'server'),
    (e) => e.code === 'conflict_resolved',
    'a resolved conflict cannot resolve twice',
  );

  // A second conflict resolves with a MERGED payload.
  await svc.registerTabDraft(OWNER, PROJECT, 'tab_c', 1, { from: 'tabC' });
  await svc.saveFromTab(OWNER, PROJECT, 'tab_b'); // tab_b's draft base is 0, current is 2 -> conflict? no: base 0 != 2 -> conflict
  const conflict2 = await store.byConflictId('cfl_2');
  assert.ok(conflict2, 'second conflict raised');
  const res2 = await svc.resolveConflict(OWNER, conflict2.conflictId, 'merged', { from: 'tabC+server' });
  assert.deepEqual(res2.payload, { from: 'tabC+server' });
  assert.equal(res2.newRevisionNo, 3);

  // History append-only across resolutions.
  assert.deepEqual(await store.payloadAt(PROJECT, 1), { from: 'tabA' });
  assert.deepEqual(await store.payloadAt(PROJECT, 2), { from: 'tabB' });
  assert.deepEqual(await store.payloadAt(PROJECT, 3), { from: 'tabC+server' });
});

test('local originals import ONLY through a reviewed ownership mapping bound to this owner', async () => {
  const { svc } = await makeService();
  const originals = [{ originalId: 'o1', payload: { doc: 'local original' } }];
  const batch = { importId: 'imp_1', owner: OWNER, mappingId: 'map_1', originals, declaredCount: 1, declaredDigest: digestOf(originals) };

  // No mapping recorded yet: refused.
  await assert.rejects(() => svc.importOriginals(batch), (e) => e.code === 'mapping_not_reviewed');

  // Reviewed mapping bound to THIS owner: import succeeds.
  await svc.recordOwnershipMapping({ mappingId: 'map_1', owner: OWNER, reviewedRef: 'review-2026-10-27', reviewedAt: new Date().toISOString() });
  const result = await svc.importOriginals(batch);
  assert.deepEqual(result, { outcome: 'imported', importId: 'imp_1', importedCount: 1 });

  // A mapping owned by someone else does not authorize this owner's import.
  await svc.recordOwnershipMapping({ mappingId: 'map_2', owner: OTHER, reviewedRef: 'review-2026-10-27', reviewedAt: new Date().toISOString() });
  await assert.rejects(
    () => svc.importOriginals({ ...batch, importId: 'imp_2', mappingId: 'map_2' }),
    (e) => e.code === 'not_owner',
  );
});

test('transfer is idempotent by import id: retried import converges with no duplicate originals', async () => {
  const { store, svc } = await makeService();
  await svc.recordOwnershipMapping({ mappingId: 'map_1', owner: OWNER, reviewedRef: 'review-1', reviewedAt: new Date().toISOString() });
  const originals = [{ originalId: 'o1', payload: { doc: 'a' } }, { originalId: 'o2', payload: { doc: 'b' } }];
  const batch = { importId: 'imp_retry', owner: OWNER, mappingId: 'map_1', originals, declaredCount: 2, declaredDigest: digestOf(originals) };

  const first = await svc.importOriginals(batch);
  assert.equal(first.outcome, 'imported');
  const retry = await svc.importOriginals(batch);
  assert.equal(retry.outcome, 'duplicate');
  assert.equal(retry.importedCount, first.importedCount);
  assert.equal(await store.importedOriginalCount('imp_retry'), 2, 'no duplicate originals stored');
});

test('every batch is verified by declared count AND digest before acceptance', async () => {
  const { svc } = await makeService();
  await svc.recordOwnershipMapping({ mappingId: 'map_1', owner: OWNER, reviewedRef: 'review-1', reviewedAt: new Date().toISOString() });
  const originals = [{ originalId: 'o1', payload: { doc: 'a' } }];

  // Count mismatch: refused.
  await assert.rejects(
    () => svc.importOriginals({ importId: 'imp_c', owner: OWNER, mappingId: 'map_1', originals, declaredCount: 2, declaredDigest: digestOf(originals) }),
    (e) => e.code === 'batch_verification_failed',
  );
  // Digest mismatch: refused.
  await assert.rejects(
    () => svc.importOriginals({ importId: 'imp_d', owner: OWNER, mappingId: 'map_1', originals, declaredCount: 1, declaredDigest: 'deadbeef' }),
    (e) => e.code === 'batch_verification_failed',
  );
});

function digestOf(originals) {
  const canonical = originals
    .map((o) => `${o.originalId}:${JSON.stringify(o.payload ?? null)}`)
    .sort()
    .join(';');
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}
