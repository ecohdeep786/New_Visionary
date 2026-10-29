/**
 * LEARN-12 (KAN-148) — only the released assessment modes: fixed
 * source/criteria/official-paper snapshots, server-owned answers/scoring,
 * durable sectional timing and interrupted mock resume, plus evidence-qualified
 * exam-weighted readiness with missing-data/coverage labels.
 *   - unreleased papers refuse; sessions pin the paper snapshot;
 *   - answer keys are protected (never echoed) and scoring is server-owned,
 *     immutable and reproducible; client claims never decide;
 *   - sectional timers are durable and NEVER reset on reconnect/resume;
 *   - an exhausted section refuses further answers;
 *   - interrupted resume is byte-stable across two controllers;
 *   - readiness is evidence-qualified with visible coverage labels;
 *   - rank requires a validated permitted reference distribution;
 *   - professional outcomes use capability/rubric vocabulary and never award a
 *     credential automatically.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));
const { AssessmentService } = req('./dist/src/assessment/assessment-service.js');
const { InMemoryAssessmentStore } = req('./dist/src/assessment/assessment-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_1' };
const OTHER = { uid: 'uid_learner_2', workspaceId: 'ws_1' };
const ws2 = { uid: 'uid_learner_1', workspaceId: 'ws_2' };

const PAPER = {
  paperId: 'paper_math_mock_1',
  sourceRef: 'ncert/class8/math',
  sourceVersion: 'v2026.1',
  criteriaVersion: 'rubric_math_v3',
  officialPaperRef: 'official/mock/math-1',
  sections: [
    { sectionId: 'sec_1', durationMs: 30 * 60_000, points: 40, questionIds: ['q1', 'q2', 'q3', 'q4'] },
    { sectionId: 'sec_2', durationMs: 20 * 60_000, points: 60, questionIds: ['q5', 'q6'] },
  ],
};

async function makeService(released = true) {
  const store = new InMemoryAssessmentStore();
  const service = new AssessmentService(store);
  if (released) {
    await service.releasePaper(PAPER, 'releaser_content_board');
  } else {
    // Present but UNRELEASED: the release gate (not an unknown paper) must fire.
    await store.savePaper({ ...PAPER, released: false, releasedBy: null });
  }
  for (const [qid, key] of Object.entries({ q1: 'a', q2: 'b', q3: 'c', q4: 'a', q5: 'd', q6: 'b' })) {
    await service.loadAnswerKey(PAPER.paperId, qid, key);
  }
  return { store, service };
}

// ---------------------------------------------------------------------------

test('RELEASED MODES ONLY: an unreleased paper refuses to start a session', async () => {
  const { service } = await makeService(false);
  await assert.rejects(
    () => service.startSession(OWNER, 'cmd-1', PAPER.paperId),
    (e) => e.code === 'source_not_released',
  );
  // Unknown paper refuses.
  const { service: s2 } = await makeService(true);
  await assert.rejects(() => s2.startSession(OWNER, 'cmd-1', 'paper_unknown'), (e) => e.code === 'paper_unknown');
  // Releasing requires a named releaser.
  const store3 = new InMemoryAssessmentStore();
  const s3 = new AssessmentService(store3);
  await assert.rejects(() => s3.releasePaper(PAPER, '  '), (e) => e.code === 'paper_invalid');
});

test('FIXED SNAPSHOTS: the session pins source/criteria/official-paper refs at start', async () => {
  const { store, service } = await makeService(true);
  const session = await service.startSession(OWNER, 'cmd-2', PAPER.paperId);
  assert.equal(session.snapshot.sourceRef, PAPER.sourceRef);
  assert.equal(session.snapshot.sourceVersion, PAPER.sourceVersion);
  assert.equal(session.snapshot.criteriaVersion, PAPER.criteriaVersion);
  assert.equal(session.snapshot.officialPaperRef, PAPER.officialPaperRef);
  // The pinned snapshot does not move when the stored paper row changes later.
  const paper = await store.paper(PAPER.paperId);
  paper.sourceVersion = 'v9999.changed';
  await store.savePaper(paper);
  const reread = await store.session(session.sessionId);
  assert.equal(reread.snapshot.sourceVersion, PAPER.sourceVersion);
});

test('SERVER-OWNED ANSWERS/SCORING: keys never echo; scoring is reproducible; client claims never decide', async () => {
  const { store, service } = await makeService(true);
  const session = await service.startSession(OWNER, 'cmd-3', PAPER.paperId);
  await service.answerQuestion(OWNER, session.sessionId, 'sec_1', 'q1', 'a');
  await service.answerQuestion(OWNER, session.sessionId, 'sec_1', 'q2', 'b');
  await service.submitSection(OWNER, 'cmd-4', session.sessionId, 'sec_1', { claimedScore: 999 });
  const done = await store.session(session.sessionId);
  const sec = done.sections.find((s) => s.sectionId === 'sec_1');
  assert.equal(sec.score.awarded, 20); // 2 of 4 correct × 40 points
  assert.equal(sec.score.points, 40);
  // Answer keys never appear in the session state (protected).
  assert.ok(!JSON.stringify(done).includes('"__key__"'));
  // Immutable scoring: resubmission converges to the same score.
  await service.submitSection(OWNER, 'cmd-4b', session.sessionId, 'sec_1');
  const again = await store.session(session.sessionId);
  assert.equal(again.sections.find((s) => s.sectionId === 'sec_1').score.awarded, 20);
});

test('DURABLE SECTIONAL TIMING: timers only decrease; an exhausted section refuses answers; resume NEVER resets', async () => {
  const { service } = await makeService(true);
  const session = await service.startSession(OWNER, 'cmd-5', PAPER.paperId);
  // Consume 29 of 30 minutes.
  await service.tickSection(OWNER, session.sessionId, 'sec_1', 29 * 60_000);
  let s = (await service.resumeSession(OWNER, session.sessionId)).session;
  assert.equal(s.sections.find((x) => x.sectionId === 'sec_1').remainingMs, 60_000);
  // Exhaust the section.
  await service.tickSection(OWNER, session.sessionId, 'sec_1', 60_000);
  await assert.rejects(
    () => service.answerQuestion(OWNER, session.sessionId, 'sec_1', 'q1', 'a'),
    (e) => e.code === 'section_time_exhausted',
  );
  // Resume (reconnect) does NOT reset the timer.
  s = (await service.resumeSession(OWNER, session.sessionId)).session;
  assert.equal(s.sections.find((x) => x.sectionId === 'sec_1').remainingMs, 0);
  // Unaffected section keeps its full time.
  assert.equal(s.sections.find((x) => x.sectionId === 'sec_2').remainingMs, 20 * 60_000);
});

test('INTERRUPTED MOCK RESUME: two controllers over the same store see the identical byte-stable session', async () => {
  const { store, service } = await makeService(true);
  const session = await service.startSession(OWNER, 'cmd-6', PAPER.paperId);
  await service.tickSection(OWNER, session.sessionId, 'sec_1', 5 * 60_000);
  await service.answerQuestion(OWNER, session.sessionId, 'sec_1', 'q1', 'a');
  const deviceA = await service.resumeSession(OWNER, session.sessionId);
  const service2 = new AssessmentService(store);
  const deviceB = await service2.resumeSession(OWNER, session.sessionId);
  assert.equal(deviceA.digest, deviceB.digest);
  // Wrong owner / workspace cannot resume (no leak).
  await assert.rejects(() => service.resumeSession(OTHER, session.sessionId), (e) => e.code === 'not_owner');
  await assert.rejects(() => service.resumeSession(ws2, session.sessionId), (e) => e.code === 'workspace_mismatch');
});

test('COMMAND DEDUP: same start key + same payload idempotent; changed payload refuses', async () => {
  const { service } = await makeService(true);
  const s1 = await service.startSession(OWNER, 'dedup-1', PAPER.paperId);
  const s2 = await service.startSession(OWNER, 'dedup-1', PAPER.paperId);
  assert.equal(s1.sessionId, s2.sessionId);
  await assert.rejects(
    () => service.startSession(OWNER, 'dedup-1', 'paper_other'),
    (e) => e.code === 'command_changed',
  );
});

test('EVIDENCE-QUALIFIED READINESS: weighted from assessed evidence; missing data labeled; evidence-free refuses', async () => {
  const { service } = await makeService(true);
  await service.recordAssessedEvidenceForReadiness(OWNER, 'q1', 1);
  await service.recordAssessedEvidenceForReadiness(OWNER, 'q2', 0.5);
  const report = await service.readiness(OWNER, PAPER.paperId, ['q1', 'q2']);
  assert.equal(report.coverage, 'missing_data');
  assert.ok(report.missingConcepts.includes('q3'));
  assert.ok(report.readinessPercent > 0 && report.readinessPercent < 100);
  // Rank stays honestly unavailable without a validated distribution.
  assert.equal(report.rank.available, false);
  assert.equal(report.rank.reason, 'reference_distribution_unavailable');
  // Evidence-free readiness refuses.
  const otherOwner = { uid: 'uid_none', workspaceId: 'ws_1' };
  await assert.rejects(() => service.readiness(otherOwner, PAPER.paperId, []), (e) => e.code === 'evidence_required');
});

test('RANK PREDICTIONS: require a validated permitted reference distribution; available after validation', async () => {
  const { service } = await makeService(true);
  await service.recordAssessedEvidenceForReadiness(OWNER, 'q1', 1);
  await service.recordAssessedEvidenceForReadiness(OWNER, 'q2', 1);
  await service.recordAssessedEvidenceForReadiness(OWNER, 'q3', 1);
  await service.recordAssessedEvidenceForReadiness(OWNER, 'q4', 1);
  await service.recordAssessedEvidenceForReadiness(OWNER, 'q5', 1);
  await service.recordAssessedEvidenceForReadiness(OWNER, 'q6', 1);
  await service.readiness(OWNER, PAPER.paperId, ['q1', 'q2']);
  // Without a validated distribution the rank call refuses honestly.
  await assert.rejects(
    () => service.rankPrediction(OWNER, PAPER.paperId),
    (e) => e.code === 'reference_distribution_unavailable',
  );
  // Validation requires a named validator; then the rank is available.
  await service.validateReferenceDistribution(PAPER.sourceRef, 'dist_cbse_2026', 'measurement_board');
  const rank = await service.rankPrediction(OWNER, PAPER.paperId);
  assert.ok(rank.percentile >= 1 && rank.percentile <= 99);
});

test('PROFESSIONAL SCENARIOS: capability/rubric vocabulary; credential NEVER awarded automatically', async () => {
  const { service } = await makeService(true);
  const outcome = await service.professionalOutcome(
    OWNER,
    PAPER.sourceRef,
    { 'sql_modeling': 0.8, 'stakeholder_comms': 0.6 },
    'rubric_pro_v2',
  );
  assert.equal(outcome.credentialAwarded, false);
  assert.ok(Object.keys(outcome.capabilities).length > 0);
  // An explicit credential award attempt always refuses.
  await assert.rejects(() => service.awardCredential(), (e) => e.code === 'credential_not_automatic');
});
