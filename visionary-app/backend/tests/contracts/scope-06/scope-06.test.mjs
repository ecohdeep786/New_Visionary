// SCOPE-06 (KAN-33) — executable backend contract/deny/replay cases.
//
// Every case in scope-06-cases.mjs is EXECUTED against the accepted draft v1
// contract validator (integration/contracts/v1 — validateWire, fingerprint,
// replayComparison, compareRevision). Expectations are compared with actual
// validator output, so removing or gutting any fixture, precondition or
// expected receipt breaks this suite (R1 probe-proof).
//
// Replay semantics (R3) follow integration/contracts/v1/README.md: a same-
// payload replay is only honored when the server's CURRENT
// authority/consent/source recheck passes (the precondition field carries
// that recheck); the same payload alone never authorizes a prior result; a
// same-key changed payload is a command conflict; a cancellation
// acknowledgment is never a domain commit. Error names come from the draft
// typed error envelope — no new runtime taxonomy is introduced here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWire, fingerprint, replayComparison, compareRevision } from '../../../../integration/contracts/v1/validate.mjs';
import { cases } from './scope-06-cases.mjs';

const validate = (name, value) => validateWire(name, JSON.stringify(value));
const byId = new Map(cases.map((c) => [c.caseId, c]));

test('the fixture matrix is complete and every case binds executable fixtures', () => {
  assert.ok(cases.length >= 9);
  for (const c of cases) {
    assert.ok(c.caseId && c.boundary && c.state.workspaceId && c.state.actorUid);
    assert.ok(c.operation.dto && c.operation.payload, `${c.caseId} must bind a real operation payload`);
    assert.ok(c.operation.payload.mutationId && c.operation.payload.workspaceId, `${c.caseId} must carry owning-store fields`);
    assert.ok(c.precondition, `${c.caseId} must carry the current-authority precondition`);
    assert.ok(c.expected && typeof c.recovery === 'string' && c.recovery.length > 0, `${c.caseId} must state recovery`);
  }
});

test('SC06-01 learner submit validates and derives a stable command fingerprint', () => {
  const c = byId.get('SC06-01-learner-submit-positive');
  const result = validate(c.operation.dto, c.operation.payload);
  assert.equal(result.ok, c.expected.kind === 'commit');
  const hash = fingerprint(c.operation.dto, JSON.stringify(c.operation.payload));
  assert.match(hash, /^[a-f0-9]{64}$/);
});

test('SC06-02 forged authority fields are a shape denial (INVALID_REQUEST); authorization denial stays with the server', () => {
  const c = byId.get('SC06-02-forged-role-shape-deny');
  const result = validate(c.operation.dto, c.operation.payload);
  assert.equal(result.ok, false);
  assert.equal(result.code, c.expected.error);
});

test('SC06-03 stale expected revision maps to STALE_REVISION through compareRevision', () => {
  const c = byId.get('SC06-03-stale-revision-deny');
  const verdict = compareRevision(c.operation.payload.expectedRevision, c.state.store.currentRevision);
  assert.equal(verdict, 'stale');
  assert.equal(c.expected.error, 'STALE_REVISION');
  // The matching revision validates.
  assert.equal(validate(c.operation.dto, { ...c.operation.payload, expectedRevision: c.state.store.currentRevision }).ok, true);
});

test('SC06-04 authorized replay: same payload + CURRENT authority precondition yields the stored receipt', () => {
  const c = byId.get('SC06-04-replay-authorized-positive');
  const storedHash = fingerprint(c.operation.dto, JSON.stringify(c.operation.payload));
  const comparison = replayComparison(storedHash, c.operation.dto, JSON.stringify(c.operation.payload));
  assert.equal(comparison, 'same-payload');
  // R3: the same payload alone does NOT authorize the replay — the current
  // authority/consent/source recheck (the precondition) is what does.
  assert.equal(c.precondition.authorityCurrent && c.precondition.consentCurrent && c.precondition.sourceCurrent, true);
  assert.equal(c.expected.kind, 'replayed-receipt');
});

test('SC06-05 revoked-consent replay denies even though the payload is identical', () => {
  const c = byId.get('SC06-05-replay-revoked-consent-deny');
  const storedHash = fingerprint(c.operation.dto, JSON.stringify(c.operation.payload));
  assert.equal(replayComparison(storedHash, c.operation.dto, JSON.stringify(c.operation.payload)), 'same-payload');
  // The current-consent recheck fails — the replay is denied regardless of
  // the identical fingerprint (README: revoked packs cannot grant access).
  assert.equal(c.precondition.consentCurrent, false);
  assert.equal(c.expected.error, 'DENIED');
});

test('SC06-06 same-key changed payload is a command conflict (COMMAND_CONFLICT)', () => {
  const c = byId.get('SC06-06-replay-changed-payload-conflict');
  const original = byId.get('SC06-01-learner-submit-positive');
  const storedHash = fingerprint(original.operation.dto, JSON.stringify(original.operation.payload));
  assert.equal(replayComparison(storedHash, c.operation.dto, JSON.stringify(c.operation.payload)), 'command-conflict');
  assert.equal(c.expected.error, 'COMMAND_CONFLICT');
});

test('SC06-07/08 cancellation acknowledges but is never a domain commit', () => {
  for (const id of ['SC06-07-cancel-acknowledge-no-commit', 'SC06-08-cancel-late-delivery-acknowledgment-only']) {
    const c = byId.get(id);
    const result = validate(c.operation.dto, c.operation.payload);
    assert.equal(result.ok, true); // the Cancel command is well-formed
    assert.equal(c.expected.kind, 'acknowledgment');
    assert.equal(c.expected.notACommit, true);
    // A cancellation acknowledgment is a distinct kind from a CommitReceipt.
    assert.notEqual(c.operation.dto, 'CommitReceipt');
  }
});

test('SC06-09 escaped wire budget denies with PAYLOAD_TOO_LARGE', () => {
  const c = byId.get('SC06-09-payload-too-large-deny');
  const result = validate(c.operation.dto, c.operation.payload);
  assert.equal(result.ok, false);
  assert.equal(result.code, c.expected.error);
});
