/**
 * CONTENT-06 (KAN-65) — evaluate coverage and retrieval on every released
 * category/language, including Hindi/Bengali segmentation WHERE RELEASED.
 *
 * Proven here:
 *   1. coverage is derived from the backend store — released languages come from
 *      released eligible sources only; a frontend category label is a CLAIM, and a
 *      label with no released eligible source is never "supported",
 *   2. Hindi/Bengali segmentation: a node authored in 'hi' with released locales
 *      ['en'] does NOT establish Hindi coverage; a language is released only when
 *      its pointer covers it; hi and bn segments never leak across locales,
 *   3. retrieval on a released (category, language) returns exactly the eligible
 *      released node keys for that language only,
 *   4. withdrawal / pointer demotion / source rejection immediately drop a node
 *      from coverage (server-live; no authoritative cache),
 *   5. unavailable vs not_released are distinct honest states.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { CoverageEvaluator } = req('./dist/src/coverage/coverage-evaluation.js');
const { InMemoryCoverageStore } = req('./dist/src/coverage/coverage-evaluation-lookups.js');

function makeStore(nodes) {
  const store = new InMemoryCoverageStore();
  for (const n of nodes) store.setNode(InMemoryCoverageStore.releasedNode(n));
  return store;
}

// ---------------------------------------------------------------------------

test('released category/language is derived from the store: a released eligible English source proves English coverage; the released language is listed and not invented', async () => {
  const seeded = [
    { nodeKey: 'cnt_science_7_en', categoryId: 'science', authoredLanguage: 'en', pointerLocales: ['en'] },
    { nodeKey: 'cnt_science_7_hi', categoryId: 'science', authoredLanguage: 'hi', pointerLocales: ['hi'] },
  ];
  const ev = new CoverageEvaluator(makeStore(seeded));
  const report = await ev.evaluateAll();
  const science = report.categories.find((c) => c.categoryId === 'science');
  assert.equal(report.decisionSource, 'server-live');
  assert.ok(science, 'science category evaluated');
  assert.deepEqual([...science.releasedLanguages].sort(), ['en', 'hi'], 'released languages come from released sources');
  const en = science.rows.find((r) => r.language === 'en');
  assert.equal(en.status, 'supported');
  assert.equal(en.evidence.length, 1);
  assert.equal(en.evidence[0].nodeKey, 'cnt_science_7_en');
  const hi = science.rows.find((r) => r.language === 'hi');
  assert.equal(hi.status, 'supported');
});

test('Hindi/Bengali segmentation where released: authored language never establishes coverage; only released pointer locales do', async () => {
  const store = makeStore([
    { nodeKey: 'cnt_science_7_en', categoryId: 'science', authoredLanguage: 'en', pointerLocales: ['en'] },
    // Hindi-authored but released ONLY for English — the learner interface is en.
    { nodeKey: 'cnt_science_7_hi_meta', categoryId: 'science', authoredLanguage: 'hi', pointerLocales: ['en'] },
    // Bengali released pointer — a real released segment.
    { nodeKey: 'cnt_science_7_bn', categoryId: 'science', authoredLanguage: 'bn', pointerLocales: ['bn'] },
  ]);
  const ev = new CoverageEvaluator(store);
  const report = await ev.evaluateAll();
  const science = report.categories.find((c) => c.categoryId === 'science');

  // Released languages are en + bn (the pointer-covered locales) — NOT hi (authoredLanguage only).
  assert.deepEqual([...science.releasedLanguages].sort(), ['bn', 'en'], 'hi has no released pointer, so it is not a released language');

  const en = science.rows.find((r) => r.language === 'en');
  const bn = science.rows.find((r) => r.language === 'bn');
  assert.equal(en.status, 'supported');
  assert.equal(bn.status, 'supported');
  assert.equal(bn.evidence.length, 1, 'only the bn-released pointer node proves Bengali coverage');
  assert.equal(bn.evidence[0].nodeKey, 'cnt_science_7_bn');
  assert.doesNotMatch(bn.evidence.map((e) => e.nodeKey).join(','), /hi_meta/, 'hi-authored node is not Bengali evidence');

  // The English-released pointer (including the hi-authored node) proves English,
  // but the hi-authored node does NOT establish a hi segment (no hi pointer).
  assert.equal(en.evidence.map((e) => e.nodeKey).includes('cnt_science_7_hi_meta'), true);
  assert.equal(en.evidence.map((e) => e.nodeKey).includes('cnt_science_7_en'), true);
  assert.equal(science.releasedLanguages.includes('hi'), false, 'hi is not a released language (no hi pointer)');
});

test('frontend category labels do not establish content support: a claimed language with no released source reports not_released/ unavailable', async () => {
  const store = makeStore([
    { nodeKey: 'cnt_science_7_en', categoryId: 'science', authoredLanguage: 'en', pointerLocales: ['en'] },
  ]);
  const ev = new CoverageEvaluator(store);
  // The frontend claims Bengali is available (a label only).
  const claim = await ev.evaluateClaim({ categoryId: 'science', language: 'bn' });
  assert.equal(claim.proved, false);
  assert.equal(claim.supportedStatus, 'not_released');
  assert.deepEqual(claim.releasedLanguages, ['en']);
  assert.equal(claim.evidence.length, 0);

  // A category that has no released source at all is unavailable, not released.
  const unknownClaim = await ev.evaluateClaim({ categoryId: 'maths', language: 'en' });
  assert.equal(unknownClaim.proved, false);
  assert.equal(unknownClaim.supportedStatus, 'unavailable');
});

test('withdrawal / pointer demotion / source rejection immediately drop a node from coverage (server-live, no cache)', async () => {
  const store = new InMemoryCoverageStore();
  const node = InMemoryCoverageStore.releasedNode({ nodeKey: 'cnt_science_7_en', categoryId: 'science', pointerLocales: ['en'] });
  store.setNode(node);
  const ev = new CoverageEvaluator(store);

  let report = await ev.evaluateAll();
  const science = report.categories.find((c) => c.categoryId === 'science');
  assert.equal(science.releasedLanguages.length, 1, 'English is released before withdrawal');

  // Withdraw the pointer: no released pointer locale remains.
  store.setNode({ ...node, pointerLocales: [{ language: 'en', pointerState: 'withdrawn' }] });
  report = await ev.evaluateAll();
  const afterWithdraw = report.categories.find((c) => c.categoryId === 'science');
  assert.equal(afterWithdraw ? afterWithdraw.releasedLanguages.length : 0, 0, 'withdrawal removes the released language instantly');

  // Source rejection also removes coverage.
  store.setNode({ ...node, pointerLocales: [{ language: 'en', pointerState: 'released' }], sourceRelease: 'rejected' });
  report = await ev.evaluateAll();
  assert.equal(report.categories.find((c) => c.categoryId === 'science')?.releasedLanguages.length ?? 0, 0, 'rejected source drops coverage');

  // Unknown category is not released (fail closed).
  const unknown = await ev.evaluateRetrieval('history', 'en');
  assert.equal(unknown.reason, 'unavailable');
  assert.equal(unknown.retrievable.length, 0);
});

test('retrieval evaluation on a released (category, language) returns exactly the eligible released nodes for that language only', async () => {
  const store = makeStore([
    { nodeKey: 'cnt_science_7_en', categoryId: 'science', authoredLanguage: 'en', pointerLocales: ['en'] },
    { nodeKey: 'cnt_science_7_hi', categoryId: 'science', authoredLanguage: 'hi', pointerLocales: ['hi'] },
    { nodeKey: 'cnt_science_8_en', categoryId: 'science', authoredLanguage: 'en', pointerLocales: ['en'] },
  ]);
  const ev = new CoverageEvaluator(store);
  const en = await ev.evaluateRetrieval('science', 'en');
  assert.equal(en.reason, 'released');
  assert.deepEqual([...en.retrievable].sort(), ['cnt_science_7_en', 'cnt_science_8_en'], 'English retrieval returns only en-released nodes');
  const hi = await ev.evaluateRetrieval('science', 'hi');
  assert.deepEqual(hi.retrievable, ['cnt_science_7_hi'], 'Hindi retrieval returns only hi-released node');
  assert.equal(en.multipleFound, true);
  assert.equal(hi.multipleFound, false);
});

test('a category with no eligible nodes at all is partial/unavailable honestly, not silently supported', async () => {
  const store = new InMemoryCoverageStore();
  // registered but not eligible (draft source, unpublished).
  store.setNode(InMemoryCoverageStore.releasedNode({ nodeKey: 'cnt_math_9', categoryId: 'maths', sourceRelease: 'pending', pointerLocales: ['en'], eligible: false }));
  const ev = new CoverageEvaluator(store);
  const report = await ev.evaluateAll();
  const maths = report.categories.find((c) => c.categoryId === 'maths');
  assert.ok(maths);
  assert.equal(maths.releasedLanguages.length, 0, 'no released language when no node proves coverage');
  assert.equal(maths.rows.length, 0, 'no coverage row is invented');
});

test('evaluateClaims returns unproved labels for claims unsupported by released sources', async () => {
  const store = makeStore([
    { nodeKey: 'cnt_science_7_en', categoryId: 'science', authoredLanguage: 'en', pointerLocales: ['en'] },
    { nodeKey: 'cnt_science_7_bn', categoryId: 'science', authoredLanguage: 'bn', pointerLocales: ['bn'] },
  ]);
  const ev = new CoverageEvaluator(store);
  const { unprovedLabels, categories } = await ev.evaluateClaims([
    { categoryId: 'science', language: 'en' },
    { categoryId: 'science', language: 'bn' },
    { categoryId: 'science', language: 'hi' },
    { categoryId: 'maths', language: 'en' },
  ]);

  // en + bn are proved; hi (no source) and maths/en (no category) are unproved labels.
  assert.deepEqual(unprovedLabels.map((c) => `${c.categoryId}:${c.language}`).sort(), ['maths:en', 'science:hi']);
});
