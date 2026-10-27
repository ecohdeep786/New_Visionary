/**
 * AI-05 (KAN-87) — disable unsafe global exact/semantic/template caches; add
 * only scoped, source/policy/version-aware, reauthorized caching.
 *
 * Proven here:
 *   1. unsafe global caches are DISABLED for every kind — a missing scope
 *      binding (caller/source/policy) refuses (`global_cache_disabled`),
 *   2. private entries are NEVER shared: another caller with the same source
 *      gets a miss (no cross-user reads),
 *   3. version-aware: an entry pinned to version X is never served for Y,
 *   4. reauthorized at delivery: a revoked caller's entries stop serving
 *      immediately (server-live, fail closed),
 *   5. policy-version bump invalidates matching entries event-driven.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { ScopedCacheService } = req('./dist/src/scopedcache/scoped-cache.js');
const { InMemoryScopedCacheStore } = req('./dist/src/scopedcache/scoped-cache-lookups.js');

const CALLER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };

function scope(overrides = {}) {
  return { caller: CALLER, sourceVersion: '1.1.0', policyVersion: 'pol-v3', kind: 'exact', ...overrides };
}

async function makeService() {
  const store = new InMemoryScopedCacheStore();
  return { store, svc: new ScopedCacheService(store) };
}

// ---------------------------------------------------------------------------

test('unsafe global caches are DISABLED for every kind — a missing scope binding refuses', async () => {
  const { svc } = await makeService();
  // Exact cache with no caller binding: refused.
  await assert.rejects(
    () => svc.put({ kind: 'exact', sourceVersion: '1.1.0', policyVersion: 'pol-v3', caller: { uid: '', workspaceId: '' } }, { x: 1 }),
    (e) => e.code === 'global_cache_disabled',
  );
  // Semantic cache with no policy version: refused.
  await assert.rejects(
    () => svc.put({ kind: 'semantic', sourceVersion: '1.1.0', policyVersion: '', caller: CALLER }, { x: 1 }),
    (e) => e.code === 'global_cache_disabled',
  );
  // Template cache with no source version: refused.
  await assert.rejects(
    () => svc.put({ kind: 'template', sourceVersion: '', policyVersion: 'pol-v3', caller: CALLER }, { x: 1 }),
    (e) => e.code === 'global_cache_disabled',
  );
  // A fully scoped entry puts fine.
  await svc.put(scope(), { answer: 'cached' });
});

test('private entries are NEVER shared: another caller with the same source gets a miss', async () => {
  const { svc } = await makeService();
  await svc.put(scope(), { answer: 'private to learner 1' });

  const own = await svc.get(scope());
  assert.deepEqual(own.value, { answer: 'private to learner 1' });

  const other = await svc.get(scope({ caller: OTHER }));
  assert.equal(other, null, 'another caller with the same source NEVER reads this entry');
});

test('version-aware: an entry pinned to version X is never served for version Y', async () => {
  const { svc } = await makeService();
  await svc.put(scope(), { answer: 'v1.1.0 answer' });

  const same = await svc.get(scope({ sourceVersion: '1.1.0' }));
  assert.ok(same, 'same version serves');

  await assert.rejects(
    () => svc.get(scope({ sourceVersion: '2.0.0' })),
    (e) => e.code === 'version_mismatch',
    'a different source version never serves this entry',
  );
});

test('reauthorized at delivery: a revoked caller\'s entries stop serving immediately (server-live)', async () => {
  const { store, svc } = await makeService();
  await svc.put(scope(), { answer: 'cached' });
  const before = await svc.get(scope());
  assert.ok(before, 'serves while authorized');

  // Revocation (server-live, e.g. policy revoked mid-session).
  store.revoke(CALLER.uid);
  await assert.rejects(
    () => svc.get(scope()),
    (e) => e.code === 'reauthorization_failed',
    'the cache NEVER serves what live authorization would refuse',
  );
});

test('policy-version bump invalidates matching entries event-driven', async () => {
  const { store, svc } = await makeService();
  await svc.put(scope({ kind: 'exact' }), { a: 1 });
  await svc.put(scope({ kind: 'semantic' }), { b: 2 });
  await svc.put(scope({ kind: 'exact', policyVersion: 'pol-v2' }), { c: 3 });

  const removed = await svc.invalidateByPolicyVersion('pol-v3');
  assert.equal(removed, 2, 'only entries bound to the old policy version are invalidated');

  const oldEntry = await svc.get(scope({ kind: 'exact' }));
  assert.equal(oldEntry, null, 'invalidated entry no longer serves');
  const kept = await svc.get(scope({ kind: 'exact', policyVersion: 'pol-v2' }));
  assert.deepEqual(kept.value, { c: 3 }, 'entries on the current policy version survive');
});
