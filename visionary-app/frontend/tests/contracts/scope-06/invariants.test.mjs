import test from 'node:test';
import assert from 'node:assert/strict';
import { invariantCases } from '../../../../backend/tests/contracts/scope-06/invariants.mjs';

const byId = Object.fromEntries(invariantCases.map((item) => [item.id, item]));

test('KAN-33 maps current frontend regressions to server-owned deny and recovery expectations', () => {
  assert.equal(byId['stale-revision'].expected.errorClass, 'stale-revision');
  assert.equal(byId['stale-revision'].expected.sideEffects, 'none');
  assert.equal(byId['draft-preserved-after-conflict'].expected.sideEffects, 'preserve-draft');
  assert.equal(byId['two-device-reconnect'].expected.outcome, 'refetch-current');
});

test('KAN-33 keeps unsupported coverage and unverified workspace membership explicit', () => {
  assert.equal(byId['unsupported-category-language'].expected.errorClass, 'unsupported-scope');
  assert.equal(byId['workspace-membership-not-verified'].expected.errorClass, 'workspace-membership-required');
  assert.equal(byId['workspace-membership-not-verified'].expected.sideEffects, 'none');
});

test('KAN-33 does not treat a client-supplied identity, source or consent flag as authority', () => {
  for (const id of ['owner-read-wrong-user', 'consent-required', 'source-revoked']) {
    assert.equal(byId[id].expected.outcome, 'deny', id);
    assert.equal(byId[id].expected.sideEffects, 'none', id);
  }
});
