/**
 * LEARN-08 (KAN-74) — evaluate checks/practice using server-owned versioned
 * criteria and protected answer keys. Client pass/score/completion flags are
 * NEVER authoritative.
 *
 * Proven here:
 *   1. the server verdict comes from the protected key + versioned criteria —
 *      reproducible (same answer/key/criteria => identical verdict),
 *   2. a client claim that disagrees with the server verdict is OVERRULED and
 *      never flips the outcome (claim stored, verdict authoritative),
 *   3. the answer key never leaves the store — results expose only
 *      awarded/points/passed,
 *   4. every evaluation appends an immutable assessed outcome whose rubric ref
 *      IS the criteria version (LEARN-03's mastery evidence),
 *   5. unknown check/criteria refused (fail closed).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { EvaluationService } = req('./dist/src/evaluation/evaluation-service.js');
const { InMemoryEvaluationStore } = req('./dist/src/evaluation/evaluation-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const CHECK = { conceptId: 'c_integers', sourceVersion: '1.1.0', checkId: 'chk_1' };
const CORRECT = { choiceIndex: 2 };

function makeService() {
  const store = new InMemoryEvaluationStore();
  store.setAnswerKey(CHECK.conceptId, { checkId: CHECK.checkId, sourceVersion: CHECK.sourceVersion, key: CORRECT });
  store.setCriteria(CHECK.conceptId, CHECK.sourceVersion, CHECK.checkId, { criteriaVersion: 'crit-2024-v3', points: 10, passThreshold: 0.6 });
  return { store, svc: new EvaluationService(store) };
}

// ---------------------------------------------------------------------------

test('server verdict from protected key + versioned criteria; reproducible scoring (same inputs => identical verdict)', async () => {
  const { svc } = makeService();
  const r1 = await svc.evaluate({ owner: OWNER, submissionId: 's1', check: CHECK, answer: CORRECT });
  assert.equal(r1.passed, true);
  assert.equal(r1.awarded, 10);
  assert.equal(r1.points, 10);
  assert.equal(r1.criteriaVersion, 'crit-2024-v3');

  const r2 = await svc.evaluate({ owner: OWNER, submissionId: 's2', check: CHECK, answer: CORRECT });
  assert.equal(EvaluationService.verdictDigest(r1), EvaluationService.verdictDigest(r2), 'reproducible: identical inputs yield identical verdicts');

  const wrong = await svc.evaluate({ owner: OWNER, submissionId: 's3', check: CHECK, answer: { choiceIndex: 0 } });
  assert.equal(wrong.passed, false);
  assert.equal(wrong.awarded, 0);
});

test('client pass/score/completion claims are NEVER authoritative — a disagreeing claim is overruled', async () => {
  const { svc } = makeService();
  // Client claims PASS but the answer is wrong: server overrules.
  const overruled = await svc.evaluate({
    owner: OWNER, submissionId: 's1', check: CHECK, answer: { choiceIndex: 0 },
    claim: { claimedPass: true, claimedScore: 10 },
  });
  assert.equal(overruled.passed, false, 'server verdict stands');
  assert.equal(overruled.claimOverruled, true, 'the disagreeing claim is recorded as overruled');

  // Client claims FAIL but the answer is correct: server still passes them.
  const clientWrong = await svc.evaluate({
    owner: OWNER, submissionId: 's2', check: CHECK, answer: CORRECT,
    claim: { claimedPass: false, claimedScore: 0 },
  });
  assert.equal(clientWrong.passed, true, 'claim cannot lower the server verdict');
  assert.equal(clientWrong.claimOverruled, true);

  // Agreeing claim: no overrule.
  const agree = await svc.evaluate({
    owner: OWNER, submissionId: 's3', check: CHECK, answer: CORRECT,
    claim: { claimedPass: true, claimedScore: 10 },
  });
  assert.equal(agree.claimOverruled, false);
});

test('the answer key never leaves the store — results expose only awarded/points/passed', async () => {
  const { svc } = makeService();
  const result = await svc.evaluate({ owner: OWNER, submissionId: 's1', check: CHECK, answer: { choiceIndex: 0 } });
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes('key'), false, 'no answer key in the result');
  assert.equal(serialized.includes('choiceIndex'), false, 'no correct answer leaked');
  assert.deepEqual(Object.keys(result).sort(), ['awarded', 'checkId', 'claimOverruled', 'criteriaVersion', 'evaluatedAt', 'passed', 'points', 'submissionId']);
});

test('every evaluation appends an immutable assessed outcome whose rubric ref is the criteria version', async () => {
  const { store, svc } = makeService();
  await svc.evaluate({ owner: OWNER, submissionId: 's1', check: CHECK, answer: CORRECT });
  await svc.evaluate({ owner: OWNER, submissionId: 's2', check: CHECK, answer: { choiceIndex: 1 } });
  const outcomes = await store.outcomesFor(OWNER, CHECK.checkId);
  assert.equal(outcomes.length, 2, 'one immutable outcome per evaluation');
  for (const o of outcomes) {
    assert.equal(o.criteriaVersion, 'crit-2024-v3', 'rubric reference = criteria version');
    assert.ok(o.evaluatedAt, 'timestamped evidence');
  }
  const before = JSON.stringify(outcomes);
  await svc.evaluate({ owner: OWNER, submissionId: 's3', check: CHECK, answer: CORRECT });
  const after = await store.outcomesFor(OWNER, CHECK.checkId);
  assert.equal(JSON.stringify(after.slice(0, 2)), before, 'append-only: earlier outcomes unchanged');
});

test('unknown check or criteria refused (fail closed)', async () => {
  const { svc } = makeService();
  await assert.rejects(
    () => svc.evaluate({ owner: OWNER, submissionId: 's1', check: { ...CHECK, checkId: 'chk_missing' }, answer: CORRECT }),
    (e) => e.code === 'unknown_check',
  );
  // A check with a key but no criteria is also refused.
  const store2 = new InMemoryEvaluationStore();
  store2.setAnswerKey('c_x', { checkId: 'chk_x', sourceVersion: '1.0.0', key: 'a' });
  const svc2 = new EvaluationService(store2);
  await assert.rejects(
    () => svc2.evaluate({ owner: OWNER, submissionId: 's2', check: { conceptId: 'c_x', sourceVersion: '1.0.0', checkId: 'chk_x' }, answer: 'a' }),
    (e) => e.code === 'unknown_criteria',
  );
});
