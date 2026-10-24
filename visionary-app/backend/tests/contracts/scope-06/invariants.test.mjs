import test from 'node:test';
import assert from 'node:assert/strict';
import { invariantCases, SCOPE, STATUS } from './invariants.mjs';

const requiredFamilies = new Set(['authority', 'consent', 'source', 'revision', 'idempotency', 'recovery']);
const denyCases = invariantCases.filter((item) => item.expected.outcome === 'deny');

test('KAN-33 matrix is explicitly marked as proposed synthetic preparation', () => {
  assert.equal(SCOPE, 'SCOPE-06');
  assert.equal(STATUS, 'proposed-contract-case');
  assert.ok(invariantCases.length >= 9);
  assert.equal(new Set(invariantCases.map((item) => item.id)).size, invariantCases.length);
});

test('KAN-33 covers each authority, consent, source, revision, replay and recovery family', () => {
  const families = new Set(invariantCases.map((item) => item.family));
  for (const family of requiredFamilies) assert.ok(families.has(family), `missing ${family}`);
  for (const item of invariantCases) {
    assert.match(item.operation, /[a-z-]+/);
    assert.match(item.precondition, /\S/);
    assert.match(item.recovery, /\S/);
    assert.match(item.evidence, /\S/);
  }
});

test('deny cases are side-effect free and state an explicit error class', () => {
  assert.ok(denyCases.length >= 5);
  for (const item of denyCases) {
    assert.equal(item.expected.sideEffects, 'none', item.id);
    assert.match(item.expected.errorClass, /^[a-z-]+$/, item.id);
  }
});

test('replay and recovery cases preserve receipts or drafts rather than inventing permission', () => {
  const replay = invariantCases.find((item) => item.id === 'duplicate-command');
  const conflict = invariantCases.find((item) => item.id === 'draft-preserved-after-conflict');
  const reconnect = invariantCases.find((item) => item.id === 'two-device-reconnect');
  assert.deepEqual(replay.expected, { outcome: 'replay-receipt', errorClass: null, sideEffects: 'one-commit' });
  assert.equal(conflict.expected.sideEffects, 'preserve-draft');
  assert.equal(reconnect.expected.outcome, 'refetch-current');
});
