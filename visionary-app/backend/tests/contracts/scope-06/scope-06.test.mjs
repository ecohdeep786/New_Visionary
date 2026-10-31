// Draft wire/schema evidence only. Authorization, receipt replay and
// cancellation execute separately in runtime.test.cjs through actual HTTP.
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWire, fingerprint, replayComparison, compareRevision } from '../../../../integration/contracts/v1/validate.mjs';
import { schemaCases } from './scope-06-cases.mjs';

for (const c of schemaCases) test(c.id, () => {
  const actual = validateWire(c.dto, JSON.stringify(c.payload));
  assert.equal(actual.ok, c.expected.ok);
  if (!c.expected.ok) assert.equal(actual.code, c.expected.code);
});
test('draft fingerprint compares complete payload bytes; this does not authorize replay', () => {
  const c = schemaCases[0], hash = fingerprint(c.dto, JSON.stringify(c.payload));
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.equal(replayComparison(hash, c.dto, JSON.stringify(c.payload)), 'same-payload');
  assert.equal(replayComparison(hash, c.dto, JSON.stringify({ ...c.payload, body: 'Changed answer.' })), 'command-conflict');
});
test('draft revision comparison distinguishes stale and matching values without writing state', () => {
  assert.equal(compareRevision(2, 3), 'stale');
  assert.notEqual(compareRevision(3, 3), 'stale');
});
