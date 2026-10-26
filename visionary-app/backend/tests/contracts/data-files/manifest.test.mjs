/**
 * FILE-02 (KAN-57) — immutable object generations/manifests, reference
 * verification before database commit, and safe collection of unattached
 * objects without deleting retained revisions/submissions.
 *
 * Proven here:
 *   1. publish mints a new immutable generation (digest/size/type fixed once),
 *   2. a generation is immutable — publishing again for the same logical object
 *      creates a NEW generation, never mutates the old manifest,
 *   3. verifyReference passes only for the exact (objectId, generation) owned
 *      by the acting uid and not yet collected; a wrong owner/generation or a
 *      collected manifest refuses (reference-verified before DB commit),
 *   4. commitReference marks a verified generation referenced,
 *   5. collectUnattached detaches ONLY unreferenced, unreferenced+unretained
 *      generations: a manifest referenced by a retained revision/submission is
 *      never deleted,
 *   6. retain/release control retention; releasing an unreferenced object makes
 *      it collectable,
 *   7. authorization: a non-owner cannot verify/commit/retain another uid's
 *      manifest.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { ManifestService, ManifestError } = req('./dist/src/file/manifest.service.js');
const { InMemoryManifestStore } = req('./dist/src/file/manifest-store.js');

function setup() {
  const s = new InMemoryManifestStore();
  const m = new ManifestService(s);
  return { s, m };
}

test('FILE-02 publish: a new immutable generation records digest/size/type and is unreferenced', async () => {
  const { s, m } = setup();
  const manifest = await m.publish({ objectId: 'obj-1', ownerUid: 'uid-1', digest: 'a'.repeat(64), size: 1024, type: 'application/pdf' });
  assert.equal(manifest.generation, 1);
  assert.equal(manifest.digest, 'a'.repeat(64));
  assert.equal(manifest.size, 1024);
  assert.equal(manifest.referenced, false);
  assert.equal(manifest.retainedBy.length, 0);
});

test('FILE-02 immutability: re-publish mints a NEW generation, never mutates the old manifest', async () => {
  const { s, m } = setup();
  const first = await m.publish({ objectId: 'obj-1', ownerUid: 'uid-1', digest: 'a'.repeat(64), size: 1024, type: 'application/pdf' });
  const second = await m.publish({ objectId: 'obj-1', ownerUid: 'uid-1', digest: 'b'.repeat(64), size: 2048, type: 'application/pdf' });
  assert.equal(second.generation, 2);
  assert.notEqual(second.digest, first.digest);
  const gens = await m.generations('obj-1');
  assert.deepEqual(gens.map((g) => g.generation), [1, 2]);
  const original = await s.get('obj-1', 1);
  assert.equal(original.digest, 'a'.repeat(64), 'generation 1 immutable digest preserved');
  // Direct mutation of immutable fields is refused at the store.
  const mut = await s.transition('obj-1', 1, 'uid-1', { digest: 'f'.repeat(64) });
  assert.equal(mut.ok, false);
  assert.equal(mut.reason, 'immutable');
});

test('FILE-02 verifyReference: exact ownership and generation, not collected — before DB commit', async () => {
  const { s, m } = setup();
  const manifest = await m.publish({ objectId: 'obj-1', ownerUid: 'uid-1', digest: 'a'.repeat(64), size: 1024, type: 'application/pdf' });
  const verified = await m.verifyReference({ objectId: 'obj-1', generation: 1, ownerUid: 'uid-1' });
  assert.equal(verified.generation, 1);
  await assert.rejects(m.verifyReference({ objectId: 'obj-1', generation: 99, ownerUid: 'uid-1' }), (e) => e.code === 'not_found');
  await assert.rejects(m.verifyReference({ objectId: 'obj-1', generation: 1, ownerUid: 'uid-9' }), (e) => e.code === 'unauthorized');
});

test('FILE-02 commitReference: a verified reference becomes referenced; collect skips it', async () => {
  const { s, m } = setup();
  const manifest = await m.publish({ objectId: 'obj-1', ownerUid: 'uid-1', digest: 'a'.repeat(64), size: 1024, type: 'application/pdf' });
  await m.verifyReference({ objectId: 'obj-1', generation: 1, ownerUid: 'uid-1' });
  const committed = await m.commitReference({ objectId: 'obj-1', generation: 1, ownerUid: 'uid-1' });
  assert.equal(committed.referenced, true);
  const result = await m.collectUnattached();
  assert.equal(result.collected.length, 0, 'referenced generation is not collected');
  assert.equal(result.skipped.length, 1, 'referenced generation listed as skipped');
});

test('FILE-02 collection: an unreferenced, unretained generation is safely detached and cannot verify afterwards', async () => {
  const { s, m } = setup();
  const manifest = await m.publish({ objectId: 'obj-1', ownerUid: 'uid-1', digest: 'a'.repeat(64), size: 1024, type: 'application/pdf' });
  const result = await m.collectUnattached();
  assert.equal(result.collected.length, 1);
  const collected = result.collected[0];
  assert.ok(collected.collectedAt, 'collection time recorded');
  await assert.rejects(m.verifyReference({ objectId: 'obj-1', generation: 1, ownerUid: 'uid-1' }), (e) => e.code === 'collected');
});

test('FILE-02 retention: a retain(revision) generation is never deleted even though unreferenced', async () => {
  const { s, m } = setup();
  const manifest = await m.publish({ objectId: 'obj-1', ownerUid: 'uid-1', digest: 'a'.repeat(64), size: 1024, type: 'application/pdf' });
  await m.retain({ objectId: 'obj-1', generation: 1, ownerUid: 'uid-1', reason: 'revision:r-42' });
  const result = await m.collectUnattached();
  assert.equal(result.collected.length, 0, 'retained revision is not deleted');
  assert.equal(result.skipped.length, 1);
  assert.ok(result.skipped[0].includes('obj-1#1'));
  // Releasing the retention makes it collectable on the next sweep.
  await m.release({ objectId: 'obj-1', generation: 1, ownerUid: 'uid-1', reason: 'revision:r-42' });
  const second = await m.collectUnattached();
  assert.equal(second.collected.length, 1);
});

test('FILE-02 authorization: a non-owner cannot verify/commit/retain another uid manifest', async () => {
  const { s, m } = setup();
  const manifest = await m.publish({ objectId: 'obj-1', ownerUid: 'uid-1', digest: 'a'.repeat(64), size: 1024, type: 'application/pdf' });
  await assert.rejects(m.verifyReference({ objectId: 'obj-1', generation: 1, ownerUid: 'uid-9' }), (e) => e.code === 'unauthorized');
  await assert.rejects(m.commitReference({ objectId: 'obj-1', generation: 1, ownerUid: 'uid-9' }), (e) => e.code === 'unauthorized');
  await assert.rejects(m.retain({ objectId: 'obj-1', generation: 1, ownerUid: 'uid-9', reason: 'revision:r-1' }), (e) => e.code === 'unauthorized');
});

test('FILE-02 before-DB-commit contract: an unreferenced published generation is never committed without a verified reference', async () => {
  const { s, m } = setup();
  const manifest = await m.publish({ objectId: 'obj-1', ownerUid: 'uid-1', digest: 'a'.repeat(64), size: 1024, type: 'application/pdf' });
  // A DB row can only commit after verifyReference; without it the manifest is
  // unattached and the collector may detach it — no row may point at it later.
  await m.collectUnattached();
  await assert.rejects(m.commitReference({ objectId: 'obj-1', generation: 1, ownerUid: 'uid-1' }), (e) => e.code === 'collected');
});
