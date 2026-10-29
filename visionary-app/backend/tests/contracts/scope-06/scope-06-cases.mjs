// SCOPE-06 (KAN-33) — executable synthetic fixture matrix for backend
// contract/deny/replay cases. Every case binds REAL input/state fixtures and
// owning-store fields to an expectation that is checked against the accepted
// draft v1 contract validator (validateWire/fingerprint/replayComparison/
// compareRevision) by scope-06.test.mjs. Removing or gutting any fixture
// breaks the suite, because expectations are compared with actual validator
// output — not with static strings.
//
// Replay semantics follow integration/contracts/v1/README.md: command storage
// is scoped by authenticated actor/workspace and mutation identity; EVERY
// replay is reauthorized against current authority/consent/source; the same
// payload alone does not authorize returning a prior result; a same-key
// changed payload is a command conflict; a cancellation acknowledgment is
// never proof of a domain commit.
const uuid = '00000000-0000-4000-8000-000000000001';
const digest = 'a'.repeat(64);

const baseState = {
  workspaceId: 'sample:workspace',
  actorUid: 'sample:learner',
  actorRole: 'learner',
  /** Server-side owning-store state at evaluation time. */
  store: { currentRevision: 2, policyRevision: 'policy:1', consentCurrent: true, sourceCurrent: true, sessionCurrent: true },
};

const submitPayload = (overrides = {}) => ({
  version: 1,
  mutationId: uuid,
  workspaceId: baseState.workspaceId,
  expectedRevision: 2,
  expectedPolicyRevision: 'policy:1',
  submissionId: 'sample:submission',
  source: { sourceId: 'sample:source', sourceRevision: '1', criteriaRevision: '1' },
  body: 'Synthetic learner answer for the vertical slice.',
  ...overrides,
});

const cancelPayload = (overrides = {}) => ({
  version: 1,
  mutationId: uuid,
  workspaceId: baseState.workspaceId,
  expectedRevision: 2,
  expectedPolicyRevision: 'policy:1',
  targetId: 'sample:run',
  reason: 'user-request',
  ...overrides,
});

export const cases = [
  {
    caseId: 'SC06-01-learner-submit-positive',
    boundary: 'draft v1 contract validator (SubmissionRevision)',
    state: { ...baseState },
    operation: { dto: 'SubmissionRevision', payload: submitPayload() },
    precondition: { authorityCurrent: true, consentCurrent: true, sourceCurrent: true },
    expected: { kind: 'commit', error: null },
    recovery: 'none required — owning store appends revision 3 with a CommitReceipt',
  },
  {
    caseId: 'SC06-02-forged-role-shape-deny',
    boundary: 'draft v1 contract validator (SubmissionRevision)',
    state: { ...baseState },
    // Forged actor/role fields are a SHAPE denial at the contract boundary.
    // Wrong-user/workspace AUTHORIZATION denial needs the connected server
    // and stays with the linked gates (v1 README boundary note).
    operation: { dto: 'SubmissionRevision', payload: submitPayload({ actorUid: 'forged', role: 'admin' }) },
    precondition: { authorityCurrent: true, consentCurrent: true, sourceCurrent: true },
    expected: { kind: 'deny', error: 'INVALID_REQUEST' },
    recovery: 'client resubmits without forged authority fields',
  },
  {
    caseId: 'SC06-03-stale-revision-deny',
    boundary: 'draft v1 contract validator + compareRevision',
    state: { ...baseState, store: { ...baseState.store, currentRevision: 3 } },
    operation: { dto: 'SubmissionRevision', payload: submitPayload({ expectedRevision: 2 }) },
    precondition: { authorityCurrent: true, consentCurrent: true, sourceCurrent: true },
    expected: { kind: 'deny', error: 'STALE_REVISION' },
    recovery: 'client refetches current revision 3 and resubmits with expectedRevision 3',
  },
  {
    caseId: 'SC06-04-replay-authorized-positive',
    boundary: 'draft v1 contract validator + fingerprint/replayComparison',
    state: { ...baseState },
    // Same mutationId + same payload, and the server's CURRENT
    // authority/consent/source recheck passes — the precondition is what
    // authorizes the replayed receipt, never the same payload itself.
    operation: { dto: 'SubmissionRevision', payload: submitPayload() },
    replay: { sameMutationPayload: true, priorHashRequired: true },
    precondition: { authorityCurrent: true, consentCurrent: true, sourceCurrent: true },
    expected: { kind: 'replayed-receipt', error: null },
    recovery: 'return the stored receipt for this mutation identity',
  },
  {
    caseId: 'SC06-05-replay-revoked-consent-deny',
    boundary: 'draft v1 contract validator + fingerprint/replayComparison',
    state: { ...baseState, store: { ...baseState.store, consentCurrent: false } },
    operation: { dto: 'SubmissionRevision', payload: submitPayload() },
    replay: { sameMutationPayload: true, priorHashRequired: true },
    precondition: { authorityCurrent: true, consentCurrent: false, sourceCurrent: true },
    expected: { kind: 'deny', error: 'DENIED' },
    recovery: 're-consent creates a NEW consent revision; a fresh command may then be submitted',
  },
  {
    caseId: 'SC06-06-replay-changed-payload-conflict',
    boundary: 'draft v1 contract validator + fingerprint/replayComparison',
    state: { ...baseState },
    operation: { dto: 'SubmissionRevision', payload: submitPayload({ body: 'Changed answer under the same mutation identity.' }) },
    replay: { sameMutationPayload: false, priorHashRequired: true },
    precondition: { authorityCurrent: true, consentCurrent: true, sourceCurrent: true },
    expected: { kind: 'deny', error: 'COMMAND_CONFLICT' },
    recovery: 'client issues a NEW mutationId for the corrected payload',
  },
  {
    caseId: 'SC06-07-cancel-acknowledge-no-commit',
    boundary: 'draft v1 contract validator (Cancel)',
    state: { ...baseState },
    operation: { dto: 'Cancel', payload: cancelPayload() },
    precondition: { authorityCurrent: true, consentCurrent: true, sourceCurrent: true },
    expected: { kind: 'acknowledgment', error: null, notACommit: true },
    recovery: 'late delivery after cancellation is recorded as acknowledgment only — never as a domain commit',
  },
  {
    caseId: 'SC06-08-cancel-late-delivery-acknowledgment-only',
    boundary: 'draft v1 contract validator (Cancel + CommitReceipt kinds)',
    state: { ...baseState },
    operation: { dto: 'Cancel', payload: cancelPayload({ reason: 'superseded' }) },
    precondition: { authorityCurrent: true, consentCurrent: true, sourceCurrent: true },
    expected: { kind: 'acknowledgment', error: null, notACommit: true },
    recovery: 'the superseded run observes terminal status through authorized durable reads, not through the acknowledgment',
  },
  {
    caseId: 'SC06-09-payload-too-large-deny',
    boundary: 'draft v1 contract validator escaped wire budget (SubmissionRevision)',
    state: { ...baseState },
    // Control characters blow the complete escaped wire budget (the documented
    // PAYLOAD_TOO_LARGE path), independent of the 4000-char body maximum.
    operation: { dto: 'SubmissionRevision', payload: submitPayload({ body: '\u0001'.repeat(24000) }) },
    precondition: { authorityCurrent: true, consentCurrent: true, sourceCurrent: true },
    expected: { kind: 'deny', error: 'PAYLOAD_TOO_LARGE' },
    recovery: 'client splits the answer into bounded submissions',
  },
];
