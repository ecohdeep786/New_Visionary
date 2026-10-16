const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const { createRequire } = require('node:module');
const req = createRequire(path.resolve(__dirname, '../upstream/backend/package.json'));
const { updateKnowledge, startTeachingLoop, presentTeachingCheck, recordTeachingCheck } = req('./dist/src/learning/teaching-policy.js');
const scope = { uid: 'opaque-firebase-uid', workspaceId: 'personal', conceptId: 'concept', sourceVersion: 'source-v1', criteriaVersion: 'rubric-v1' };
const parameters = { version: 'bkt-fixture-v1', guess: 0.2, slip: 0.1, transit: 0.1 };
const projection = () => ({ ...scope, modelVersion: parameters.version, pKnown: 0.4, revision: 0, lastSequence: 0, lastReceiptId: null, lastReceiptDigest: null, assessedCount: 0 });
const observation = (extra = {}) => ({ ...scope, id: 'receipt-1', digest: 'immutable-digest', sequence: 1, correct: true, origin: 'server_assessment', assessedAt: 1000, ...extra });
const candidate = (extra = {}) => ({ ...scope, sessionId: 'session', strategy: 'worked_example', checkId: 'check-1', validation: 'passed', ...extra });
const check = (extra = {}) => ({ ...scope, sessionId: 'session', checkId: 'check-1', id: 'receipt-1', digest: 'digest-1', origin: 'server_assessment', passed: false, ...extra });
test('knowledge estimates follow hand-calculated Bayes evidence, without creating mastery or mutating source state', () => {
  const state = projection(), result = updateKnowledge(state, observation(), parameters);
  // P(correct)=.4*.9+.6*.2=.48; posterior=.75; after transition=.775.
  assert.ok(Math.abs(result.projection.pKnown - 0.775) < 1e-12);
  const wrong = updateKnowledge(state, observation({ correct: false }), parameters);
  assert.ok(Math.abs(wrong.projection.pKnown - (0.04 / 0.52 * 0.9 + 0.1)) < 1e-12);
  assert.equal(state.revision, 0); assert.equal(state.pKnown, 0.4); assert.equal(result.projection.mastered, undefined);
});
test('retries are idempotent; changed receipts, gaps, replay order and model changes cannot silently alter knowledge', () => {
  const first = updateKnowledge(projection(), observation(), parameters).projection;
  assert.deepEqual(updateKnowledge(first, observation(), parameters), { projection: first, replay: true });
  assert.throws(() => updateKnowledge(first, observation({ digest: 'changed' }), parameters), e => e.code === 'conflict');
  assert.throws(() => updateKnowledge(first, observation({ sequence: 2 }), parameters), e => e.code === 'conflict');
  for (const sequence of [3, 0]) assert.throws(() => updateKnowledge(first, observation({ sequence }), parameters));
  assert.throws(() => updateKnowledge(first, observation({ sequence: 2, id: 'receipt-2' }), { ...parameters, version: 'new-model' }), e => e.code === 'rebuild_required');
});
test('wrong owner/workspace/source/rubric and unsupported or impossible evidence fail explicitly', () => {
  for (const key of Object.keys(scope)) assert.throws(() => updateKnowledge(projection(), observation({ [key]: 'another' }), parameters), e => e.code === 'scope_mismatch');
  for (const pKnown of [-1, 1.1, NaN, Infinity]) assert.throws(() => updateKnowledge({ ...projection(), pKnown }, observation(), parameters));
  assert.throws(() => updateKnowledge(projection(), observation({ origin: 'model' }), parameters));
  assert.throws(() => updateKnowledge({ ...projection(), pKnown: 0 }, observation(), { ...parameters, guess: 0 }));
});
test('verified explanation is followed by a check; failure uses another strategy and stops after three failures', () => {
  let state = startTeachingLoop(scope, 'session');
  for (let i = 1; i <= 3; i++) {
    const strategy = i % 2 ? 'worked_example' : 'analogy';
    state = presentTeachingCheck(state, candidate({ checkId: 'check-' + i, strategy }));
    assert.equal(state.phase, 'check');
    const receipt = check({ checkId: 'check-' + i, id: 'receipt-' + i, digest: 'digest-' + i });
    state = recordTeachingCheck(state, receipt).loop;
    assert.deepEqual(recordTeachingCheck(state, receipt), { loop: state, replay: true });
    assert.equal(state.phase, i === 3 ? 'review_suggested' : 'explain');
    if (i < 3) assert.throws(() => presentTeachingCheck(state, candidate({ strategy })), e => e.code === 'conflict');
  }
  assert.throws(() => presentTeachingCheck(state, candidate()));
  assert.equal(state.mastered, undefined); assert.equal(state.notifyGuardian, undefined);
});
test('a check pass stays distinct from mastery; unverified drafts and stale/cross-scope receipts cannot advance the loop', () => {
  const start = startTeachingLoop(scope, 'session');
  assert.throws(() => presentTeachingCheck(start, candidate({ validation: 'unavailable' })));
  const ready = presentTeachingCheck(start, candidate());
  for (const extra of [{ uid: 'other' }, { checkId: 'old-check' }, { sessionId: 'other' }, { origin: 'client' }]) assert.throws(() => recordTeachingCheck(ready, check(extra)));
  const passed = recordTeachingCheck(ready, check({ passed: true })).loop;
  assert.equal(passed.phase, 'check_passed'); assert.equal(passed.mastered, undefined);
  assert.throws(() => recordTeachingCheck(passed, check({ digest: 'altered' })), e => e.code === 'conflict');
  assert.throws(() => startTeachingLoop(scope, 'session', 4));
});
