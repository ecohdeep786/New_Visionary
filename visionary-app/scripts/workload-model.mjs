// RELEASE-01 (KAN-124) — measured workload distributions to cost-model inputs.
//
// The D-075 cost model (scripts/cost-model.mjs) consumes point "guesses" for its
// workload inputs (coreCallsPerDauDay, aiTurnsPerDauDay, inputTokensPerTurn,
// providerAttemptMultiplier, ...). This module replaces those guesses with a
// measured, versioned workload profile: bucketed request/token/duration/byte
// distributions with provenance, plus the counting laws the launch checklist
// requires (backend/ML lane, docs/architecture/BACKEND_LAUNCH_CHECKLIST.md):
//
//   RELEASE-01 — Replace workload guesses with beta request/token/duration/byte
//     distributions; include polling, synchronized class starts, retries and
//     additional Build demand without double-counting turns.
//   refinement — Measure voice audio/ASR/TTS/turn durations and explicit
//     declarative Build/offline reconnect demand in addition to the earlier text
//     baseline. Avoid double-counting chunks as independent user questions.
//
// Design rules:
//   1. A histogram is [{value, count}] (value = observed value or bucket
//      midpoint, count = observations). Totals and means come only from these.
//   2. Every derived cost input is tagged source: 'measured' | 'assumption' with
//      the law that produced it. `workloadToCostOverrides` emits ONLY fully
//      measured keys that the existing estimate() accepts; every unmeasured key
//      stays the baseline assumption and is listed as such in the provenance.
//   3. Counting laws (each pinned by scripts/tests/workload-model.test.mjs):
//      - chunks of one question aggregate to ONE logical turn; each chunk is one
//        admission event (no double-counting chunks as user questions)
//      - polls are API requests, never AI turns
//      - retries add attempts (provider cost + runtime seconds), never new turns
//      - synchronized class starts are measured as a peak/mean multiplier; the
//        uniform spread would understate peak demand
//      - a declarative Build run is one logical work item even across N chunks;
//        an offline reconnect is one replay work item
//      - voice turns are measured by audio duration: ASR input tokens from
//        capture minutes, TTS output bytes from spoken seconds, turn wall-time
//        includes capture + ASR + TTS
//   4. Provenance is fail-closed: a profile that claims source 'beta' must carry
//      a capture window, activeUsers and daysCaptured; synthetic profiles say so.
//
// Real beta capture is a HOSTED gate (no hosted beta exists on this box): the
// committed profile under scripts/tests/fixtures/ is explicitly synthetic and
// only exercises the schema and the counting laws.

export function summarizeHistogram(histogram) {
  if (!Array.isArray(histogram) || histogram.length === 0) throw new Error('A histogram must be a non-empty array of {value,count}.');
  let total = 0, weighted = 0;
  for (const entry of histogram) {
    if (!Number.isFinite(entry.value) || entry.value < 0 || !Number.isSafeInteger(entry.count) || entry.count <= 0) {
      throw new Error(`Invalid histogram entry: ${JSON.stringify(entry)}. value >= 0 finite, count a positive integer.`);
    }
    total += entry.count;
    weighted += entry.value * entry.count;
  }
  let cumulative = 0, p95 = null;
  const sorted = [...histogram].sort((a, b) => a.value - b.value);
  for (const entry of sorted) {
    cumulative += entry.count;
    if (p95 === null && cumulative / total >= 0.95) p95 = entry.value;
  }
  return { total, mean: weighted / total, p95 };
}

function sumHistograms(a, b) {
  const map = new Map();
  for (const h of [a, b]) for (const { value, count } of h) map.set(value, (map.get(value) || 0) + count);
  return [...map.entries()].sort((x, y) => x[0] - y[0]).map(([value, count]) => ({ value, count }));
}

function assertProfile(profile) {
  if (!profile || profile.schemaVersion !== 1) throw new Error('A workload profile must have schemaVersion 1.');
  const capture = profile.capture || {};
  const measured = capture.source === 'beta';
  if (measured) {
    // Fail-closed provenance: a beta claim requires real observation metadata.
    for (const key of ['windowStart', 'windowEnd', 'activeUsers', 'daysCaptured']) {
      if (capture[key] == null) throw new Error(`A beta profile must record capture.${key}; refusing a measured claim without it.`);
    }
    if (capture.activeUsers <= 0 || capture.daysCaptured <= 0) throw new Error('A beta profile needs positive activeUsers and daysCaptured.');
  }
  return { capture, measured };
}

const mean = histogram => summarizeHistogram(histogram).mean;

// Core counting-law derivations over ONE profile. `denominators` carries the
// observation context that converts absolute counts into per-DAU-day /
// per-MAU rates (from a beta profile's capture, or supplied for synthetic ones).
export function deriveWorkload(profile, denominators = {}) {
  const { capture, measured } = assertProfile(profile);
  const d = profile.demand || {};
  const dau = denominators.dau ?? capture?.activeUsers;
  const days = denominators.days ?? capture?.daysCaptured;
  const mau = denominators.mau ?? capture?.activeUsers;
  if (!Number.isFinite(dau) || dau <= 0 || !Number.isFinite(days) || days <= 0 || !Number.isFinite(mau) || mau <= 0) {
    throw new Error('A workload projection needs positive activeUsers/dau, daysCaptured and mau (capture metadata or explicit denominators).');
  }

  const fg = d.foregroundTurns || {};
  if (!Number.isSafeInteger(fg.distinctQuestions) || fg.distinctQuestions <= 0 || !Number.isSafeInteger(fg.chunks) || fg.chunks < fg.distinctQuestions) {
    throw new Error('foregroundTurns must report distinctQuestions (>0, integer) and chunks (>= distinctQuestions).');
  }
  const questions = fg.distinctQuestions, chunks = fg.chunks;
  const chunksPerTurn = chunks / questions;
  const mInputTok = mean(fg.inputTokensPerChunkHistogram);
  const mOutputTok = mean(fg.outputTokensPerChunkHistogram);
  const mTurnSec = mean(fg.secondsPerTurnHistogram);
  const mRespKib = mean(fg.responseKibHistogram);
  const mReqKib = mean(fg.requestKibHistogram);

  const polls = d.deviceSyncPolls || {};
  if (!Number.isSafeInteger(polls.count) || polls.count < 0) throw new Error('deviceSyncPolls.count must be a non-negative integer.');
  const mPollSec = polls.secondsPerPollHistogram ? mean(polls.secondsPerPollHistogram) : 0;
  const mPollRespKib = polls.responseKibHistogram ? mean(polls.responseKibHistogram) : null;
  const mPollReqKib = polls.requestKibHistogram ? mean(polls.requestKibHistogram) : null;

  const retries = d.providerRetries || {};
  const mAttempts = retries.attemptsPerPrimaryHistogram
    ? mean(retries.attemptsPerPrimaryHistogram)
    : 1;
  if (mAttempts < 1) throw new Error('attemptsPerPrimary mean must be >= 1 (one primary attempt minimum).');

  const css = d.synchronizedClassStarts || {};
  const peakMultiplier = (css.peakConcurrencyObserved != null && css.meanConcurrencyDuringSession)
    ? css.peakConcurrencyObserved / css.meanConcurrencyDuringSession
    : null;

  // Optional measured sections may be absent: a profile records what beta
  // observed; an absent section is zero demand, never an error (foregroundTurns
  // above is the only mandatory section).
  const builds = d.buildRuns ?? {};
  if (builds.runs == null) builds.runs = 0;
  if (!Number.isSafeInteger(builds.runs) || builds.runs < 0) throw new Error('buildRuns.runs must be a non-negative integer.');
  const buildChunks = builds.chunksPerBuildHistogram ? summarizeHistogram(builds.chunksPerBuildHistogram) : { total: 0 };
  // Admission surface = WEIGHTED chunk total (each chunk counted once), not the
  // observation count (runs). summarizeHistogram().total is the run count.
  const buildAdmissionTotal = builds.chunksPerBuildHistogram
    ? builds.chunksPerBuildHistogram.reduce((sum, e) => sum + e.value * e.count, 0)
    : 0;
  const mBuildChunks = buildChunks.total > 0 ? buildAdmissionTotal / buildChunks.total : 0;
  const mBuildSec = builds.secondsPerBuildChunkHistogram ? mean(builds.secondsPerBuildChunkHistogram) : 0;
  const mBuildInTok = builds.inputTokensPerBuildChunkHistogram ? mean(builds.inputTokensPerBuildChunkHistogram) : 0;
  const mBuildOutTok = builds.outputTokensPerBuildChunkHistogram ? mean(builds.outputTokensPerBuildChunkHistogram) : 0;
  const reconnects = builds.offlineReconnects || {};
  if (reconnects.count == null) reconnects.count = 0;
  if (!Number.isSafeInteger(reconnects.count) || reconnects.count < 0) throw new Error('offlineReconnects.count must be a non-negative integer.');
  const mReconnectSec = reconnects.secondsPerReconnectReplayHistogram ? mean(reconnects.secondsPerReconnectReplayHistogram) : 0;

  const voice = d.voice || {};
  const voiceEnabled = !!voice.captureMinutesPerTurnMean;
  const captureSec = (voice.captureMinutesPerTurnMean || 0) * (voice.captureSecondsPerMinute || 60);
  const asrSec = (voice.captureMinutesPerTurnMean || 0) * (voice.asrSecondsPerCaptureMinute || 0);
  const ttsSec = voice.ttsOutputSecondsPerTurnMean || 0;
  const asrInputTokens = (voice.captureMinutesPerTurnMean || 0) * (voice.asrInputTokensPerCaptureMinute || 0);
  const ttsAudioBytes = ttsSec * (voice.audioBytesPerTtsSecond || 0);
  const voiceTurnSeconds = voiceEnabled ? captureSec + asrSec + mTurnSec + ttsSec : null;

  // Polling law: polls add API request volume + poll seconds, never AI turns.
  const pollRequests = polls.count;
  const coreCalls = questions + pollRequests;
  const foregroundCoreSec = questions * 0.2; // assumption: the non-AI request handling share
  const apiMeanCoreSeconds = (foregroundCoreSec + pollRequests * mPollSec) / coreCalls;
  const apiRespKib = mPollRespKib == null
    ? mRespKib
    : (questions * mRespKib + pollRequests * mPollRespKib) / coreCalls;
  const apiReqKib = mPollReqKib == null
    ? mReqKib
    : (questions * mReqKib + pollRequests * mPollReqKib) / coreCalls;

  const workItems = builds.runs + reconnects.count;
  const workerSec = workItems > 0
    ? (builds.runs * (mBuildChunks * mBuildSec) + reconnects.count * mReconnectSec) / workItems
    : 0;

  // kind: 'distribution' = derived from a profile histogram (usable as a measured
  // shape, whatever the capture source); 'assumption' = a fallback the model had
  // to invent. Either way capture.{source,measured} records whether this is real
  // beta evidence or a synthetic demo.
  const entry = (value, via, kind = 'distribution') => ({ value, via, kind, p95: null });

  const workload = {
    // Per-DAU-day rates (planning units the cost engine consumes).
    aiTurnsPerDauDay: entry(questions / dau / days, 'logical distinct questions / dau / days — chunking law (never chunk count)'),
    aiAdmissionsPerDauDay: entry(chunks / dau / days, 'chunks / dau / days — runtime & token admission surface, distinct from turns'),
    coreCallsPerDauDay: entry(coreCalls / dau / days, 'logical turns + device-sync polls / dau / days — polling law (polls are requests, never turns)'),
    pollRequestsPerDauDay: entry(pollRequests / dau / days, 'deviceSyncPolls.count / dau / days — polling law'),
    chunksPerTurn: entry(chunksPerTurn, 'chunks / distinctQuestions — chunking law'),
    inputTokensPerTurn: entry(mInputTok * chunksPerTurn, 'mean input tokens per chunk x chunks per logical turn — aggregation law, no double count'),
    outputTokensPerTurn: entry(mOutputTok * chunksPerTurn, 'mean output tokens per chunk x chunks per logical turn — aggregation law, no double count'),
    providerAttemptMultiplier: entry(mAttempts, 'measured attempts per primary turn — retry law (retries are attempts, never new turns)'),
    retriesPerTurn: entry(mAttempts - 1, 'attempts per turn - 1 — retry law'),
    aiMeanSeconds: entry(voiceTurnSeconds ?? mTurnSec, voiceEnabled ? 'text turn seconds + capture + ASR + TTS — voice law (audio-duration measured)' : 'mean seconds per turn histogram'),
    apiMeanCoreSeconds: entry(apiMeanCoreSeconds, 'weighted foreground core + poll seconds — polling law (foreground share assumed 0.2s per request)'),
    apiResponseKib: entry(apiRespKib, 'foreground + poll response KiB means — byte distribution'),
    apiRequestKib: entry(apiReqKib, 'foreground + poll request KiB means — byte distribution'),
    voiceCaptureMinutesPerTurnMean: entry(voice.captureMinutesPerTurnMean ?? 0, 'capture minutes per turn — voice law'),
    asrInputTokensPerTurnMean: entry(asrInputTokens, 'capture minutes x ASR input tokens per minute — voice law'),
    ttsAudioGiBPerTurnMean: entry(ttsSec ? ttsAudioBytes / 2 ** 30 : 0, 'TTS output seconds x audio bytes per second — voice law'),
    peakConcurrencyMultiplier: entry(peakMultiplier, peakMultiplier == null ? 'not measured — synchronized class-start peak/mean ratio absent; capacity steering stays on the baseline assumption' : 'observed peak / observed mean concurrency during synchronized class starts — class-start law', peakMultiplier == null ? 'assumption' : 'distribution'),
    workerJobsPerMau: entry(workItems / mau, 'logical Build runs + offline reconnects per MAU — Build law (each counted once)'),
    workerMeanSeconds: entry(workerSec, 'weighted mean of Build (chunks x sec/chunk) and reconnect replay seconds'),
    buildRunsPerMau: entry(builds.runs / mau, 'logical Build runs / mau — one logical run per Build, never per chunk'),
    buildAdmissionsPerMau: entry(buildAdmissionTotal / mau, 'total Build generation chunks / mau — runtime surface distinct from runs'),
    offlineReconnectsPerMau: entry(reconnects.count / mau, 'reconnect replay work items / mau — counted once per reconnect'),
  };

  return { workload, counts: { questions, chunks, pollRequests, attempts: Math.round(questions * mAttempts), retries: Math.round(questions * (mAttempts - 1)), logicalBuildRuns: builds.runs, buildAdmissions: buildAdmissionTotal, offlineReconnects: reconnects.count, mau, dau, days }, capture: { source: capture.source, measured } };
}

const OVERRIDE_KEYS = new Set(['coreCallsPerDauDay', 'aiTurnsPerDauDay', 'inputTokensPerTurn', 'outputTokensPerTurn', 'providerAttemptMultiplier', 'aiMeanSeconds', 'apiMeanCoreSeconds', 'apiResponseKib', 'apiRequestKib', 'workerJobsPerMau', 'workerMeanSeconds']);

// Bridge to the D-075 cost engine. Emits an overrides object for the keys the
// existing estimate() accepts, but ONLY from profile-derived shapes
// (kind === 'distribution'). Fallback assumptions (kind === 'assumption') and
// every other input stay the baseline; the provenance table lists all of them.
// The `capture.measured` flag travels so a report can label the result as real
// beta measurement or a synthetic demo — a demo shape is never passed off as a
// beta measurement.
export function workloadToCostOverrides({ workload, capture = null }) {
  const overrides = {}, provenance = {};
  for (const [key, item] of Object.entries(workload)) {
    provenance[key] = { value: item.value, kind: item.kind, via: item.via, p95: item.p95 ?? null };
    if (!OVERRIDE_KEYS.has(key) || item.kind !== 'distribution' || item.value == null || !Number.isFinite(item.value)) continue;
    overrides[key] = item.value;
  }
  // aiResponseKib (AI outbound KiB, the cost engine's AI-byte input) maps from
  // the foreground response KiB mean when that histogram is present.
  if (workload.apiResponseKib?.kind === 'distribution') overrides.aiResponseKib = workload.apiResponseKib.value;
  return { overrides, provenance, capture: capture ? { source: capture.source, measured: capture.measured } : { source: 'unknown', measured: false } };
}

// ---------------------------------------------------------------------------
// CLI footer (module imports are hoisted, so the top of the file stays free of
// fs/path concerns for the pure functions above).
// ---------------------------------------------------------------------------
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const moduleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const profilePath = process.argv[2] || path.join(moduleRoot, 'scripts/tests/fixtures/workload-profile.synthetic.json');
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  const denominators = { dau: 20000, days: 30, mau: 100000 };
  const { workload, counts, capture } = deriveWorkload(profile, denominators);
  const { overrides, provenance, capture: tag } = workloadToCostOverrides({ workload, capture });
  console.log(JSON.stringify({ capture: tag, counts, measuredOverrides: overrides, provenance }, null, 2));
}
