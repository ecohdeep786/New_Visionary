/**
 * AI-01 (KAN-83) — benchmark candidate APIs on permitted sources, teaching
 * quality, released languages, citation correctness, safety, latency, quotas
 * and total per-use cost; pin the selected route/version.
 *
 * Proven here:
 *   1. benchmarking runs on PERMITTED sources only — a non-permitted source
 *      refuses (never raw private text),
 *   2. the language matrix is the ACTUAL RELEASED languages — a locale with no
 *      scenarios reports unsupported honestly (not penalized, not guessed),
 *   3. scoring is REPRODUCIBLE — identical inputs yield identical digests,
 *   4. selection PINS the exact route/version; a candidate below thresholds
 *      cannot be pinned (no_candidate_meets_threshold),
 *   5. the pin records the exact route/version/rubric — the auditable selection.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { BenchmarkHarness } = req('./dist/src/benchmark/benchmark-harness.js');
const { InMemoryBenchmarkStore } = req('./dist/src/benchmark/benchmark-lookups.js');

const CANDIDATE_A = { candidateId: 'providerA:tutor', provider: 'providerA', route: '/v1/tutor', version: '2024-11' };
const MATRIX = { releasedLocales: ['en', 'hi', 'bn'] };

function scenarios() {
  return [
    { scenarioId: 's1', locale: 'en', sourceId: 'src_science', question: 'Why seasons?', expectedEvidenceRef: 'rev-science-1' },
    { scenarioId: 's2', locale: 'en', sourceId: 'src_science', question: 'Phases of moon?', expectedEvidenceRef: 'rev-science-2' },
    { scenarioId: 's3', locale: 'hi', sourceId: 'src_science_hi', question: 'ऋतुएं क्यों?', expectedEvidenceRef: 'rev-science-hi' },
  ];
}

function goodScores() {
  return { teachingQuality: 4.5, citationCorrectness: 4.8, safety: 5.0, latencyMs: 900, quotaRespected: true, totalPerUseCost: 0.02 };
}

async function makeHarness(scorer) {
  const store = new InMemoryBenchmarkStore(['src_science', 'src_science_hi'], scorer);
  return new BenchmarkHarness(store);
}

// ---------------------------------------------------------------------------

test('benchmarking runs on PERMITTED sources only — a non-permitted source refuses (never raw private text)', async () => {
  const harness = await makeHarness(() => goodScores());
  await assert.rejects(
    () => harness.runBenchmark({
      candidate: CANDIDATE_A, matrix: MATRIX, rubricVersion: 'rubric-v1',
      scenarios: [...scenarios(), { scenarioId: 's_bad', locale: 'en', sourceId: 'src_private_dump', question: 'private?', expectedEvidenceRef: 'x' }],
    }),
    (e) => e.code === 'source_not_permitted',
  );
});

test('the language matrix is the ACTUAL RELEASED languages: a locale with no scenarios reports unsupported honestly', async () => {
  const harness = await makeHarness(() => goodScores());
  const result = await harness.runBenchmark({
    candidate: CANDIDATE_A, matrix: MATRIX, rubricVersion: 'rubric-v1', scenarios: scenarios(),
  });
  const byLocale = new Map(result.perLocale.map((l) => [l.locale, l]));
  assert.equal(byLocale.get('en').supported, true);
  assert.equal(byLocale.get('hi').supported, true);
  assert.equal(byLocale.get('bn').supported, false, 'Bengali has no scenarios yet — unsupported, honestly');
  assert.equal(byLocale.get('bn').scores, null, 'no invented scores for the unsupported locale');
});

test('scoring is REPRODUCIBLE: identical inputs yield identical score digests', async () => {
  const harness1 = await makeHarness(() => goodScores());
  const harness2 = await makeHarness(() => goodScores());
  const r1 = await harness1.runBenchmark({ candidate: CANDIDATE_A, matrix: MATRIX, rubricVersion: 'rubric-v1', scenarios: scenarios() });
  const r2 = await harness2.runBenchmark({ candidate: CANDIDATE_A, matrix: MATRIX, rubricVersion: 'rubric-v1', scenarios: scenarios() });
  assert.equal(r1.scoreDigest, r2.scoreDigest, 'same candidate + scenarios + rubric => same digest');

  // A different rubric version changes the digest (visible rubric change).
  const r3 = await harness1.runBenchmark({ candidate: CANDIDATE_A, matrix: MATRIX, rubricVersion: 'rubric-v2', scenarios: scenarios() });
  assert.notEqual(r3.scoreDigest, r1.scoreDigest);
});

test('selection PINS the exact route/version; a below-threshold candidate cannot be pinned', async () => {
  const thresholds = { minTeachingQuality: 4.0, minCitationCorrectness: 4.0, minSafety: 4.5, maxLatencyMs: 1500, maxPerUseCost: 0.05 };
  const harness = await makeHarness(() => goodScores());
  const result = await harness.runBenchmark({ candidate: CANDIDATE_A, matrix: MATRIX, rubricVersion: 'rubric-v1', scenarios: scenarios() });
  const pin = harness.selectAndPin({ operator: { operatorId: 'op_ml' }, results: [result], thresholds });
  assert.equal(pin.candidateId, 'providerA:tutor');
  assert.equal(pin.route, '/v1/tutor');
  assert.equal(pin.version, '2024-11');
  assert.equal(pin.rubricVersion, 'rubric-v1');
  assert.ok(pin.pinnedAt, 'the pin records when it was made');

  // A weak candidate cannot be pinned.
  const weakHarness = await makeHarness(() => ({ ...goodScores(), teachingQuality: 2.0 }));
  const weakResult = await weakHarness.runBenchmark({ candidate: CANDIDATE_A, matrix: MATRIX, rubricVersion: 'rubric-v1', scenarios: scenarios() });
  assert.throws(
    () => weakHarness.selectAndPin({ operator: { operatorId: 'op_ml' }, results: [weakResult], thresholds }),
    (e) => e.code === 'no_candidate_meets_threshold',
    'below-threshold candidates are never pinned',
  );
});
