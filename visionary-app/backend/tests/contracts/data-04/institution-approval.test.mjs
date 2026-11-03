import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from '../data-02/postgres-fixture.cjs';

const { createInstitutionApproval, assertActiveInstitutionApproval } = fixture.req('./dist/src/invitations/institution-approval.js');
const now = new Date('2026-11-03T00:00:00Z');
const expiresAt = new Date('2026-11-04T00:00:00Z');
const reviewers = new Set(['operations-reviewer']);
const input = { workspaceId: 'classroom', administratorUid: 'administrator', reviewerUid: 'operations-reviewer', evidenceRef: 'proof_opaque_reference_001', expiresAt };
const denied = error => error.code === 'unauthorized';

test('approval requires a configured independent reviewer and the current canonical owner', () => {
  assert.throws(() => createInstitutionApproval(input, 'administrator', now, new Set()), denied);
  assert.throws(() => createInstitutionApproval(input, 'other-administrator', now, reviewers), denied);
  assert.throws(() => createInstitutionApproval({ ...input, reviewerUid: 'administrator' }, 'administrator', now, new Set(['administrator'])), denied);
  assert.throws(() => createInstitutionApproval({ ...input, evidenceRef: 'https://example.invalid/private' }, 'administrator', now, reviewers), denied);
  assert.throws(() => createInstitutionApproval({ ...input, expiresAt: now }, 'administrator', now, reviewers), denied);
});

test('approval is restricted to its workspace and owner and fails closed on expiry or revocation', () => {
  const approval = createInstitutionApproval(input, 'administrator', now, reviewers);
  assert.doesNotThrow(() => assertActiveInstitutionApproval(approval, 'classroom', 'administrator', now));
  assert.throws(() => assertActiveInstitutionApproval(null, 'classroom', 'administrator', now), denied);
  assert.throws(() => assertActiveInstitutionApproval(approval, 'other-classroom', 'administrator', now), denied);
  assert.throws(() => assertActiveInstitutionApproval(approval, 'classroom', 'other-administrator', now), denied);
  assert.throws(() => assertActiveInstitutionApproval(approval, 'classroom', 'administrator', expiresAt), denied);
  assert.throws(() => assertActiveInstitutionApproval({ ...approval, revokedAt: now }, 'classroom', 'administrator', now), denied);
  assert.throws(() => assertActiveInstitutionApproval({ ...approval, policy: 'obsolete' }, 'classroom', 'administrator', now), denied);
});

test('approval retains only the opaque reference when internal input has extra evidence fields', () => {
  const approval = createInstitutionApproval({ ...input, rawProof: 'synthetic private evidence', contactEmail: 'synthetic@example.invalid' }, 'administrator', now, reviewers);
  assert.equal(approval.evidenceRef, input.evidenceRef);
  assert.deepEqual(Object.keys(approval).sort(), ['administratorUid', 'approvedAt', 'evidenceRef', 'expiresAt', 'policy', 'reviewerUid', 'revokedAt', 'workspaceId']);
});
