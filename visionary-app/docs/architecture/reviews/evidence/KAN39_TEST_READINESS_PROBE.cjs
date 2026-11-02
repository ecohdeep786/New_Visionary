// Harness-only evidence: executes the exact extracted readiness expressions.
// No SQL, product identity, application service or shared dependency is used.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');
const vm = require('node:vm');
const root = resolve(__dirname, '../../../..');
const expected = process.env.KAN39_REVIEW_SOURCE;
if (!/^[a-f0-9]{40}$/.test(expected || '')) throw Error('Explicit exact reviewed source required');
execFileSync('git', ['diff', '--exit-code', expected, '--', 'backend/tests/contracts/data-04/invitations.test.mjs'], { cwd: root, stdio: 'pipe' });
const source = readFileSync(resolve(root, 'backend/tests/contracts/data-04/invitations.test.mjs'), 'utf8');
const expressions = source.match(/Promise\.race\(\[(?:pause\.)?ready,\s*(?:pending|first)\]\)/g) ?? [];
assert.equal(expressions.length, 4);
assert.equal((source.match(/\{ timeout: 15000 \}/g) ?? []).length, 4);
for (const [index, expression] of expressions.entries()) {
  test('actual test readiness expression ' + (index + 1) + ' exposes early operation rejection', async () => {
    const early = Error('synthetic early SQL-operation rejection');
    const ready = new Promise(() => {}), pending = Promise.reject(early);
    const result = vm.runInNewContext(expression, { Promise, ready, pause: { ready }, pending, first: pending });
    let timer;
    try {
      await assert.rejects(Promise.race([result, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('readiness did not fail fast')), 1000); })]), error => error === early);
    } finally { clearTimeout(timer); }
  });
}
