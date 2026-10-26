/**
 * CACHE-01 (KAN-141) — product-wide cache behavior per feature family, as an
 * executable policy checked against the feature-delivery matrix.
 *
 * Proven here:
 *   1. the shipped 18-family policy passes every invariant: private material is
 *      never shared-CDN cacheable, server caches are disabled at launch (no
 *      cache-down staleness, no data-deletion TTL — the type makes it
 *      unrepresentable), invalidation is event-driven with named triggers,
 *      freshness bounds are capped, private reads fail closed,
 *   2. the policy covers exactly the feature-delivery matrix families — a new
 *      family cannot ship without a cache decision, and no entry exists without
 *      a family,
 *   3. named families carry their specific required statements (sources
 *      withdrawal gating, public hashed-assets revalidation, authoritative
 *      billing/entitlement, privacy revocation over derived caches),
 *   4. the validator rejects tampered policies (deny cases).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { CACHE_POLICY, validateCachePolicy, coverageAgainstMatrix } = req('./dist/src/cachepolicy/cache-policy.js');

const matrix = JSON.parse(readFileSync(resolve(repoRoot, 'docs/architecture/tracking/feature-delivery.json'), 'utf8'));
const matrixFamilyIds = matrix.features.map((f) => f.id);

test('the shipped policy passes every CACHE-01 invariant', () => {
  const report = validateCachePolicy(CACHE_POLICY);
  assert.deepEqual(report.violations, []);
  assert.equal(report.valid, true);
  assert.equal(CACHE_POLICY.length, 18, 'one entry per feature-delivery family');
});

test('the policy covers exactly the feature-delivery matrix families', () => {
  const report = coverageAgainstMatrix(CACHE_POLICY, matrixFamilyIds);
  assert.deepEqual(report.violations, []);
  assert.equal(report.valid, true);
  assert.equal(new Set(CACHE_POLICY.map((e) => e.family)).size, matrixFamilyIds.length);
});

test('sources: permission-filtered scope keys and withdrawal-stops-retrieval triggers', () => {
  const sources = CACHE_POLICY.find((e) => e.family === 'sources');
  assert.ok(sources);
  assert.equal(sources.privateResponse, true);
  assert.equal(sources.sharedCdnCacheable, false);
  assert.deepEqual(sources.scopeKeys, ['uid', 'workspaceId', 'sourceVersion', 'locale']);
  assert.ok(sources.invalidationTriggers.some((t) => t.toLowerCase().includes('withdrawal')), 'withdrawal stops retrieval');
  assert.equal(sources.fallback, 'fail-closed');
  assert.equal(sources.apiCache.enabled, false);
});

test('public: hashed-asset caching stays public, bounded and revalidated', () => {
  const pub = CACHE_POLICY.find((e) => e.family === 'public');
  assert.ok(pub);
  assert.equal(pub.privateResponse, false);
  assert.equal(pub.sharedCdnCacheable, true);
  assert.equal(pub.browserCache.enabled, true);
  assert.ok(pub.browserCache.maxAgeSeconds > 0 && pub.browserCache.maxAgeSeconds <= 86400);
  assert.equal(pub.browserCache.invalidation, 'event-driven');
  assert.ok(pub.invalidationTriggers.length >= 1);
});

test('billing, account and ask: private, authoritative and never server-cached at launch', () => {
  for (const family of ['billing', 'account', 'ask']) {
    const entry = CACHE_POLICY.find((e) => e.family === family);
    assert.ok(entry, family + ' entry exists');
    assert.equal(entry.privateResponse, true);
    assert.equal(entry.sharedCdnCacheable, false);
    assert.equal(entry.apiCache.enabled, false);
    assert.equal(entry.fallback, 'fail-closed');
  }
  const billing = CACHE_POLICY.find((e) => e.family === 'billing');
  assert.ok(billing.invalidationTriggers.some((t) => /entitlement|webhook/i.test(t)), 'entitlement changes invalidate');
});

test('privacy: revocation covers derived caches and no retention TTL is invented', () => {
  const privacy = CACHE_POLICY.find((e) => e.family === 'privacy');
  assert.ok(privacy);
  assert.ok(privacy.invalidationTriggers.some((t) => /revocation|deletion|purge/i.test(t)));
  assert.ok(/retention TTL/.test(privacy.notes), 'the policy explicitly refuses invented retention TTLs');
});

test('the validator rejects tampered policies', () => {
  const base = CACHE_POLICY.find((e) => e.family === 'sources');
  const tampered = [
    { ...base, family: 'x1', sharedCdnCacheable: true },
    { ...base, family: 'x2', apiCache: { enabled: true, maxAgeSeconds: null, invalidation: 'event-driven' } },
    { ...base, family: 'x3', scopeKeys: ['workspaceId'] },
    { ...base, family: 'x4', browserCache: { enabled: true, maxAgeSeconds: 10, invalidation: 'event-driven' }, invalidationTriggers: [] },
    { ...base, family: 'x5', browserCache: { enabled: true, maxAgeSeconds: 200000, invalidation: 'event-driven' }, invalidationTriggers: ['x'] },
    { ...base, family: 'x6', fallback: 'pass-through' },
    { ...base, family: 'x7', browserCache: { enabled: false, maxAgeSeconds: null, invalidation: 'event-driven' } },
  ];
  const report = validateCachePolicy(tampered);
  assert.equal(report.valid, false);
  const rules = new Set(report.violations.map((v) => v.rule));
  for (const rule of [
    'private-never-shared-cdn', 'no-server-cache-at-launch', 'private-scope-uid',
    'invalidation-triggers-required', 'bounded-freshness', 'private-fails-closed', 'disabled-means-no-store',
  ]) {
    assert.ok(rules.has(rule), 'expected rule violation: ' + rule);
  }
  const duplicate = validateCachePolicy([{ ...base, family: 'dup' }, { ...base, family: 'dup' }]);
  assert.ok(duplicate.violations.some((v) => v.rule === 'unique-family'));
});

test('completeness refuses both missing and orphan policy entries', () => {
  const missing = coverageAgainstMatrix(CACHE_POLICY.slice(1), matrixFamilyIds);
  assert.equal(missing.valid, false);
  assert.ok(missing.violations.some((v) => v.family === 'public' && v.rule === 'matrix-coverage'));

  const orphan = coverageAgainstMatrix([...CACHE_POLICY, { ...CACHE_POLICY[0], family: 'ghost-family' }], matrixFamilyIds);
  assert.equal(orphan.valid, false);
  assert.ok(orphan.violations.some((v) => v.family === 'ghost-family'));
});
