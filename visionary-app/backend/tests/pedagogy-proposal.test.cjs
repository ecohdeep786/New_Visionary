const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { validatePedagogyProposal } = require('../upstream/backend/dist/src/learning/pedagogy-proposal');
const fixtures = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../integration/contracts/fixtures/vats-pedagogy.v1.json'))).fixtures;
const binding = r => ({ requestId: r.requestId, scope: r.scope, eligibleConceptIds: r.nodes.map(n => n.conceptId), ...r.teaching, ...r.observations });
test('shared ML policy candidates bind to the current server request without becoming committed learning evidence', () => {
  for (const f of fixtures) {
    const before = JSON.stringify(f.expected), result = validatePedagogyProposal(binding(f.request), f.expected);
    assert.equal(result.action, f.expected.action); assert.equal(JSON.stringify(f.expected), before);
    assert.equal(result.mastered, undefined); assert.equal(result.commit, undefined);
  }
});
test('every UID/session/source/criteria/graph/policy/revision binding rejects stale or cross-scope ML output', () => {
  const f = fixtures[0];
  for (const key of Object.keys(f.expected.scope)) {
    const candidate = structuredClone(f.expected); candidate.scope[key] = typeof candidate.scope[key] === 'number' ? candidate.scope[key] + 1 : 'different';
    assert.throws(() => validatePedagogyProposal(binding(f.request), candidate), key);
  }
  for (const fields of [{ requestId: 'other' }, { mastered: true }, { targetConceptId: 'outside-graph' }, { strategy: 'execute_code' }, { answerPolicy: 'reveal_answer' }, { requiresAssessment: false }, { action: '__proto__' }]) {
    assert.throws(() => validatePedagogyProposal(binding(f.request), { ...f.expected, ...fields }));
  }
});
test('model output cannot skip pending checks, forge a passed check, repeat failed pedagogy or force an unavailable visual', () => {
  const f = fixtures[0], request = binding(f.request);
  assert.throws(() => validatePedagogyProposal({ ...request, phase: 'check' }, f.expected));
  assert.throws(() => validatePedagogyProposal(request, fixtures.find(f => f.name === 'passed-check-is-not-mastery').expected));
  assert.throws(() => validatePedagogyProposal({ ...request, failedChecks: 1, previousStrategy: 'worked_example' }, f.expected));
  assert.throws(() => validatePedagogyProposal(request, { ...f.expected, strategy: 'visual' }));
  assert.throws(() => validatePedagogyProposal({ ...request, failedChecks: 3 }, f.expected));
  assert.throws(() => validatePedagogyProposal(request, { ...f.expected, action: 'review', strategy: null, reason: 'no_alternative', requiresAssessment: false }));
  const ancestor = fixtures.find(f => f.name === 'earliest-prerequisite-gap');
  assert.throws(() => validatePedagogyProposal({ ...binding(ancestor.request), approvedVisualAvailable: true }, { ...ancestor.expected, strategy: 'visual' }));
});
