/**
 * LEARN-02 (KAN-68) — persist checks, answers, attempts, rubric/evidence
 * references and revision history; validate eligibility server-side and
 * deduplicate repeat submissions.
 *
 * Proven here:
 *   1. eligibility is validated SERVER-SIDE — owned session + released revision
 *      + existing check; denials record nothing and consume no attempt number,
 *   2. wrong uid/workspace denied before anything persists,
 *   3. repeat submissions deduplicate by submission id (same attempt, no rows),
 *   4. attempt numbers derive from ACCEPTED submissions only,
 *   5. rubric/evidence references and answers are preserved verbatim,
 *   6. revision history is immutable and append-only.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { AttemptService } = req('./dist/src/attempts/attempt-service.js');
const { InMemoryAttemptStore } = req('./dist/src/attempts/attempt-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const SESSION = 'ls_1';
const CHECK = { conceptId: 'concept_int', sourceVersion: '1.1.0', checkId: 'chk_int_1' };

function makeService() {
  const store = new InMemoryAttemptStore();
  const eligibility = InMemoryAttemptStore.eligibility({
    sessions: [{ sessionId: SESSION, owner: OWNER }],
    released: [{ conceptId: 'concept_int', sourceVersion: '1.1.0' }],
    checks: [CHECK],
  });
  return { store, svc: new AttemptService(store, eligibility) };
}

function submit(svc, overrides = {}) {
  return svc.submit({
    submissionId: 'sub_1',
    owner: OWNER,
    sessionId: SESSION,
    check: CHECK,
    answer: { choiceIndex: 2 },
    evidence: { rubricRef: 'rubric_int_1_v2', evidenceRef: 'attempt-evidence/sub_1' },
    ...overrides,
  });
}

// ---------------------------------------------------------------------------

test('eligibility validated server-side: owned session + released revision + existing check; denial records nothing and consumes no attempt', async () => {
  const { store, svc } = makeService();
  const ok = await submit(svc);
  assert.deepEqual(ok, { outcome: 'committed', submissionId: 'sub_1', attemptNo: 1 });

  // Unknown session: denied, nothing recorded.
  const unknownSession = await submit(svc, { submissionId: 'sub_bad1', sessionId: 'ls_missing' });
  assert.equal(unknownSession.ok, false);
  assert.equal(unknownSession.reason, 'unknown_session');

  // Unreleased revision: denied.
  const badRev = await submit(svc, { submissionId: 'sub_bad2', check: { ...CHECK, sourceVersion: '9.9.9' } });
  assert.equal(badRev.ok, false);
  assert.equal(badRev.reason, 'source_revision_unknown');

  // Unknown check on the revision: denied.
  const badCheck = await submit(svc, { submissionId: 'sub_bad3', check: { ...CHECK, checkId: 'chk_missing' } });
  assert.equal(badRev.ok, false);

  // Denials consumed NO attempt numbers and left NO rows.
  const rows = await store.attemptsFor(OWNER, CHECK);
  assert.equal(rows.length, 1, 'only the accepted submission was recorded');
  assert.equal(rows[0].attemptNo, 1);
});

test('wrong uid/workspace denied before anything persists', async () => {
  const { store, svc } = makeService();
  const stranger = await submit(svc, { owner: OTHER, submissionId: 'sub_stranger' });
  assert.equal(stranger.ok, false);
  assert.equal(stranger.reason, 'not_owner');
  const rows = await store.attemptsFor(OTHER, CHECK);
  assert.equal(rows.length, 0, 'nothing persisted for the denied submission');
});

test('repeat submissions deduplicate by submission id: same attempt number, no duplicate row', async () => {
  const { store, svc } = makeService();
  const first = await submit(svc, { submissionId: 'sub_retry' });
  assert.equal(first.outcome, 'committed');
  const retry = await submit(svc, { submissionId: 'sub_retry' });
  assert.equal(retry.outcome, 'duplicate', 'retried submission recognized');
  assert.equal(retry.attemptNo, first.attemptNo, 'same attempt number returned');
  const rows = await store.attemptsFor(OWNER, CHECK);
  assert.equal(rows.length, 1, 'no duplicate attempt row');
  const history = await store.historyFor(OWNER, CHECK);
  assert.equal(history.length, 1, 'no duplicate history entry');
});

test('attempt numbers derive from ACCEPTED submissions only, per check', async () => {
  const { svc } = makeService();
  const a1 = await submit(svc, { submissionId: 's1' });
  const a2 = await submit(svc, { submissionId: 's2' });
  const a3 = await submit(svc, { submissionId: 's3' });
  assert.deepEqual([a1.attemptNo, a2.attemptNo, a3.attemptNo], [1, 2, 3]);

  // A denied submission between attempts does not consume a number.
  await submit(svc, { submissionId: 's_denied', check: { ...CHECK, checkId: 'chk_missing' } });
  const a4 = await submit(svc, { submissionId: 's4' });
  assert.equal(a4.attemptNo, 4, 'denials never inflate attempt numbering');
});

test('rubric/evidence references and answers are preserved verbatim with read-back', async () => {
  const { svc } = makeService();
  const answer = { choiceIndex: 2, worked: ['2x+3=7', 'x=2'] };
  const evidence = { rubricRef: 'rubric_int_1_v2', evidenceRef: 'attempt-evidence/sub_ev' };
  await submit(svc, { submissionId: 'sub_ev', answer, evidence });
  const rows = await svc.attemptsFor(OWNER, CHECK);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].answer, answer, 'answer stored and read back exactly');
  assert.deepEqual(rows[0].evidence, evidence, 'rubric/evidence references preserved verbatim');
  assert.equal(rows[0].check.conceptId, CHECK.conceptId);
});

test('revision history is immutable and append-only; earlier entries never rewritten', async () => {
  const { store, svc } = makeService();
  await submit(svc, { submissionId: 'h1', answer: { choiceIndex: 0 } });
  await submit(svc, { submissionId: 'h2', answer: { choiceIndex: 2 } });
  let history = await svc.historyFor(OWNER, CHECK);
  assert.equal(history.length, 2);
  const firstSnapshot = JSON.stringify(history[0]);
  assert.equal(history[0].attemptNo, 1);

  await submit(svc, { submissionId: 'h3', answer: { choiceIndex: 1 } });
  history = await svc.historyFor(OWNER, CHECK);
  assert.equal(history.length, 3, 'append-only growth');
  assert.equal(JSON.stringify(history[0]), firstSnapshot, 'earliest entry byte-identical after later appends');
  assert.deepEqual(history.map((h) => h.attemptNo), [1, 2, 3]);
});
