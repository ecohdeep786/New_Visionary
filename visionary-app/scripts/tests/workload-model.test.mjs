// RELEASE-01 (KAN-124) — workload-distribution counting-law proof.
//
// Each law from the launch checklist is pinned against scripts/workload-model.mjs
// using the committed SYNTHETIC profile (scripts/tests/fixtures/workload-profile
// .synthetic.json). The profile's shapes are invented to exercise every law; the
// demos run against capture.source === 'synthetic' so nothing here is passed off
// as a beta measurement (real beta capture is the recorded hosted gate).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { summarizeHistogram, deriveWorkload, workloadToCostOverrides } from '../workload-model.mjs';
import { estimate } from '../cost-model.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const profile = JSON.parse(fs.readFileSync(path.join(root, 'scripts/tests/fixtures/workload-profile.synthetic.json'), 'utf8'));
const DEN = { dau: 20000, days: 30, mau: 100000 };
const derive = p => deriveWorkload(p, DEN);

function minimalProfile(overrides = {}) {
  const base = {
    schemaVersion: 1,
    capture: { source: 'synthetic', title: 'law fixture' },
    demand: {
      foregroundTurns: {
        distinctQuestions: 1000, chunks: 1000,
        inputTokensPerChunkHistogram: [{ value: 1000, count: 1000 }],
        outputTokensPerChunkHistogram: [{ value: 500, count: 1000 }],
        secondsPerTurnHistogram: [{ value: 10, count: 1000 }],
        responseKibHistogram: [{ value: 4, count: 1000 }],
        requestKibHistogram: [{ value: 1, count: 1000 }],
      },
      deviceSyncPolls: {
        count: 0,
        secondsPerPollHistogram: [{ value: 0.1, count: 1 }],
        responseKibHistogram: [{ value: 1, count: 1 }],
        requestKibHistogram: [{ value: 0.5, count: 1 }],
      },
    },
  };
  return JSON.parse(JSON.stringify({ ...base, ...overrides }));
}

test('histogram summary derives mean/p95/total only from buckets and rejects malformed shapes', () => {
  const h = [{ value: 1, count: 3 }, { value: 5, count: 1 }, { value: 10, count: 1 }];
  const s = summarizeHistogram(h);
  assert.equal(s.total, 5);
  assert.equal(s.mean, (1 * 3 + 5 * 1 + 10 * 1) / 5);
  assert.equal(s.p95, 10, 'p95 is the smallest value whose cumulative share reaches 0.95');
  assert.throws(() => summarizeHistogram([]), /non-empty/i);
  assert.throws(() => summarizeHistogram([{ value: -1, count: 1 }]), /Invalid histogram/i);
  assert.throws(() => summarizeHistogram([{ value: 1, count: 0.5 }]), /positive integer/i);
  assert.throws(() => summarizeHistogram([{ value: 1, count: 0 }]), /positive integer/i);
});

test('chunking law: pipeline chunks aggregate to ONE logical turn, never N user questions', () => {
  const { workload, counts } = derive(profile);
  // 61,200 chunks across 48,000 distinct questions.
  assert.equal(counts.questions, 48000);
  assert.equal(counts.chunks, 61200);
  assert.equal(workload.aiTurnsPerDauDay.value, 48000 / 20000 / 30, 'turns come from distinct questions, not chunk count');
  assert.equal(workload.aiAdmissionsPerDauDay.value, 61200 / 20000 / 30, 'each chunk is still one runtime/token admission event');
  assert.equal(workload.chunksPerTurn.value, 61200 / 48000);
  // Per-turn tokens aggregate chunk tokens once (mean-per-chunk x chunks per turn).
  assert.equal(workload.inputTokensPerTurn.value, 2552.5);
  assert.equal(workload.outputTokensPerTurn.value, 566.6666666666666);
  // A single-chunk baseline (1 chunk/question) must not change the logical turn count.
  const single = minimalProfile();
  const { workload: sw } = derive(single);
  assert.equal(sw.aiTurnsPerDauDay.value, 1000 / 20000 / 30);
  assert.equal(sw.aiAdmissionsPerDauDay.value, 1000 / 20000 / 30);
  assert.equal(sw.chunksPerTurn.value, 1);
});

test('polling law: device-sync polls are API requests, never AI turns', () => {
  const withPolls = derive(profile);
  const noPolls = minimalProfile();
  const { workload: wp } = derive(noPolls);
  // Baseline (single-chunk, no polls): turns 1000, polls 0.
  assert.equal(wp.pollRequestsPerDauDay.value, 0);
  assert.equal(wp.coreCallsPerDauDay.value, 1000 / 20000 / 30);
  // Adding polls raises API request volume but never the turn count.
  assert.ok(withPolls.counts.pollRequests > 0);
  assert.equal(withPolls.workload.pollRequestsPerDauDay.value, 240000 / 20000 / 30);
  assert.equal(withPolls.workload.coreCallsPerDauDay.value, (48000 + 240000) / 20000 / 30);
  assert.equal(withPolls.workload.aiTurnsPerDauDay.value, 48000 / 20000 / 30, 'polls must not inflate turns');
  assert.equal(withPolls.workload.aiAdmissionsPerDauDay.value, 61200 / 20000 / 30, 'polls must not inflate admissions either');
});

test('retry law: a retry adds an attempt (provider cost + runtime seconds) but is never a new logical turn', () => {
  const { workload, counts } = derive(profile);
  // attemptsPerPrimary histogram: 44160x1 + 3120x2 + 720x3 over 48000 turns.
  const meanAttempts = (44160 + 3120 * 2 + 720 * 3) / 48000;
  assert.equal(meanAttempts, 1.095);
  assert.ok(Math.abs(workload.providerAttemptMultiplier.value - 1.095) < 1e-9, 'mean attempts = 1.095');
  assert.equal(counts.attempts, Math.round(48000 * 1.095)); // 52560
  assert.equal(counts.retries, Math.round(48000 * 0.095)); // 4560
  assert.ok(Math.abs(workload.retriesPerTurn.value - 0.095) < 1e-9, 'retries per turn = 0.095');
  assert.equal(workload.aiTurnsPerDauDay.value, 48000 / 20000 / 30, 'retries must not create new logical turns');
  // In the no-voice baseline (attemptsPerPrimary histogram absent) the multiplier
  // must default to exactly 1 (one primary attempt), never below.
  const { workload: wp } = derive(minimalProfile());
  assert.equal(wp.providerAttemptMultiplier.value, 1);
  assert.equal(wp.retriesPerTurn.value, 0);
});

test('synchronized class-start law: the measured peak/mean ratio is the burst guardrail, never a uniform spread', () => {
  const { workload } = derive(profile);
  assert.ok(workload.peakConcurrencyMultiplier.value != null);
  assert.equal(workload.peakConcurrencyMultiplier.value, 92 / 7.4);
  assert.equal(workload.peakConcurrencyMultiplier.kind, 'distribution');
  assert.match(workload.peakConcurrencyMultiplier.via, /class-start law/);
  // The multiplier is a CAPACITY report, not a cost-model key: the bridge must not
  // emit it as an override (spreading the same turns uniformly would understate it).
  const { overrides } = workloadToCostOverrides({ workload, capture: profile.capture });
  assert.ok(!('peakConcurrencyMultiplier' in overrides));
  // A profile without the class-start measurement yields an explicit assumption.
  const { workload: wp } = derive(minimalProfile());
  assert.equal(wp.peakConcurrencyMultiplier.value, null);
  assert.equal(wp.peakConcurrencyMultiplier.kind, 'assumption');
});

test('Build law: a declarative Build run is one logical work item across N chunks; offline reconnects count once', () => {
  const { workload, counts } = derive(profile);
  // 2400 Build runs produce 6120 Build chunks (1200x1 + 1080x2 ... see fixture).
  const buildChunkTotal = 600 + 1080 * 2 + 600 * 4 + 120 * 8;
  assert.equal(buildChunkTotal, 6120);
  assert.equal(counts.logicalBuildRuns, 2400);
  assert.equal(counts.buildAdmissions, 6120);
  assert.equal(counts.offlineReconnects, 480);
  assert.equal(workload.buildRunsPerMau.value, 2400 / 100000, 'Build counted once per run, not once per chunk');
  assert.equal(workload.buildAdmissionsPerMau.value, 6120 / 100000, 'chunks remain the runtime admission surface');
  assert.equal(workload.offlineReconnectsPerMau.value, 480 / 100000, 'a reconnect is one replay work item');
  assert.equal(workload.workerJobsPerMau.value, (2400 + 480) / 100000, 'Build + reconnect are worker demand, never user questions');
  assert.equal(workload.aiTurnsPerDauDay.value, 48000 / 20000 / 30, 'Build demand must not become foreground questions');
});

test('voice law: ASR/TTS durations drive tokens, bytes and wall-time; text-only baseline would understate', () => {
  const { workload } = derive(profile);
  // ASR input tokens from capture minutes.
  assert.equal(workload.asrInputTokensPerTurnMean.value, 0.5 * 420);
  // TTS output audio bytes from spoken seconds.
  assert.equal(workload.ttsAudioGiBPerTurnMean.value, (8 * 1280) / 2 ** 30);
  assert.equal(workload.voiceCaptureMinutesPerTurnMean.value, 0.5);
  // Wall-time = capture (0.5min) + ASR (0.5*1.8s) + text turn + TTS (8s).
  const textMean = (3 * 9000 + 6 * 26000 + 12 * 19000 + 24 * 6000 + 48 * 1200) / 61200;
  assert.equal(workload.aiMeanSeconds.value, 30 + 0.9 + textMean + 8);
  assert.ok(workload.aiMeanSeconds.value > textMean, 'voice turns must cost more wall-time than the text baseline');
  assert.match(workload.aiMeanSeconds.via, /capture \+ ASR \+ TTS/);
  // A turn with no voice entry has no capture/ASR/TTS surcharge.
  const { workload: wp } = derive(minimalProfile());
  assert.equal(wp.voiceCaptureMinutesPerTurnMean.value, 0);
  assert.equal(wp.aiMeanSeconds.value, 10);
});

test('provenance fail-closed: a beta claim without observation metadata is refused; synthetic is explicit', () => {
  // Synthetic profile does not need capture metadata but records source === 'synthetic'.
  const { capture } = derive(profile);
  assert.equal(capture.source, 'synthetic');
  assert.equal(capture.measured, false);
  // A beta claim without window/users/days must be rejected.
  const beta = { ...minimalProfile(), capture: { source: 'beta', title: 'fake claim' } };
  assert.throws(() => derive(beta), /must record capture\.windowStart/);
  const betaPartial = { ...minimalProfile(), capture: { source: 'beta', windowStart: '2026-11-01', windowEnd: '2026-11-08', activeUsers: 0, daysCaptured: 30 } };
  assert.throws(() => derive(betaPartial), /positive activeUsers/);
  // A complete beta claim is accepted and tagged measured.
  const betaOk = { ...minimalProfile(), capture: { source: 'beta', windowStart: '2026-11-01', windowEnd: '2026-11-08', activeUsers: 20000, daysCaptured: 30 } };
  const { capture: c2 } = derive(betaOk);
  assert.equal(c2.measured, true);
});

test('bridge: workloadToCostOverrides emits only measured cost keys and feeds the D-075 estimate', async () => {
  const { workload, capture } = derive(profile);
  const { overrides, provenance } = workloadToCostOverrides({ workload, capture });
  for (const key of Object.keys(overrides)) {
    assert.ok(new Set(['coreCallsPerDauDay', 'aiTurnsPerDauDay', 'inputTokensPerTurn', 'outputTokensPerTurn', 'providerAttemptMultiplier', 'aiMeanSeconds', 'apiMeanCoreSeconds', 'apiResponseKib', 'aiResponseKib', 'apiRequestKib', 'workerJobsPerMau', 'workerMeanSeconds']).has(key), `${key} must be a cost-model key`);
  }
  // Assumption-kind entries and report-only keys are never overrides.
  assert.ok(!('peakConcurrencyMultiplier' in overrides));
  assert.ok(!('buildRunsPerMau' in overrides));
  assert.equal(provenance.peakConcurrencyMultiplier.kind, 'distribution');
  // The synthetic capture tag travels: this bridge result is a demo, not a measurement.
  assert.equal(provenance.aiTurnsPerDauDay.value, 48000 / 20000 / 30);
  // Feed the measured overrides into the actual cost engine: it must accept them
  // (types and ranges validated) and its turns/attempts must reflect them.
  const config = JSON.parse(fs.readFileSync(path.join(root, 'infrastructure/cost/launch-scenarios.json'), 'utf8'));
  const rates = JSON.parse(fs.readFileSync(path.join(root, 'infrastructure/cost/rates-2026-10-15.json'), 'utf8'));
  const scenario = { id: 'release01-measured', label: 'Measured workload (synthetic demo shapes)', overrides };
  const result = estimate(config, rates, scenario);
  assert.equal(result.turns, Math.round(20000 * (48000 / 20000 / 30) * 30)); // turns = dau * turnsPerDauDay * days
  assert.equal(result.attempts, Math.round(result.turns * 1.095));
  assert.equal(result.coreRequests, Math.round(20000 * ((48000 + 240000) / 20000 / 30) * 30));
  // And the cost-engine sees the per-turn aggregate, not the chunk count: turns
  // disagree with admissions (61200/20000/30 admissions would be 1.275x higher).
  assert.notEqual(result.turns, Math.round(20000 * (61200 / 20000 / 30) * 30));
});

test('no double-counting invariant across every law at once', () => {
  const { counts } = derive(profile);
  assert.equal(counts.attempts >= counts.questions, true, 'attempts = turns x multiplier >= turns');
  assert.equal(counts.retries, counts.attempts - Math.round(counts.questions), 'retries are the difference, not added to questions');
  assert.equal(counts.buildAdmissions >= counts.logicalBuildRuns, true);
  assert.equal(counts.pollRequests, 240000);
  // Every poll is separate from every question: total demand = foreground question
  // turns + polls + Build runs + reconnects, with chunks and retries folded inside
  // (never surfaced as new questions).
  const logicalTotal = counts.questions + counts.pollRequests + counts.logicalBuildRuns + counts.offlineReconnects;
  console.log(`    logicalTotal=${logicalTotal} (questions ${counts.questions} + polls ${counts.pollRequests} + builds ${counts.logicalBuildRuns} + reconnects ${counts.offlineReconnects})`);
});
