export const SCOPE = 'SCOPE-06';
export const STATUS = 'proposed-contract-case';

/**
 * Synthetic cases only. These describe the deny/receipt contract to reconcile
 * with KAN-30 schemas and KAN-35 limits; they are not connected runtime proof.
 */
export const invariantCases = [
  {
    id: 'owner-read-wrong-user',
    family: 'authority',
    operation: 'read-owned-object',
    precondition: 'Authenticated actor UID differs from the object owner UID.',
    expected: { outcome: 'deny', errorClass: 'wrong-actor', sideEffects: 'none' },
    recovery: 'Refetch only after authenticating as the owning UID.',
    evidence: 'Synthetic deny receipt; connected server evidence remains open.',
  },
  {
    id: 'workspace-membership-not-verified',
    family: 'authority',
    operation: 'read-or-mutate-workspace-object',
    precondition: 'Client supplies a workspace ID without a current server-verified membership.',
    expected: { outcome: 'deny', errorClass: 'workspace-membership-required', sideEffects: 'none' },
    recovery: 'Show unavailable state; do not promote a preview role or workspace tag to authority.',
    evidence: 'Synthetic deny receipt; membership store and route integration remain open.',
  },
  {
    id: 'consent-required',
    family: 'consent',
    operation: 'use-purpose-scoped-source',
    precondition: 'Actor is authenticated but required purpose/guardian/provider consent is absent or revoked.',
    expected: { outcome: 'deny', errorClass: 'consent-required', sideEffects: 'none' },
    recovery: 'Keep the operation unavailable and preserve unrelated authorized work.',
    evidence: 'Synthetic policy case; consent authority and durable receipt remain open.',
  },
  {
    id: 'source-revoked',
    family: 'source',
    operation: 'read-or-submit-against-source',
    precondition: 'The referenced source release is withdrawn or no longer permitted for the operation.',
    expected: { outcome: 'deny', errorClass: 'source-unavailable', sideEffects: 'none' },
    recovery: 'Refetch current released source metadata; never silently switch versions.',
    evidence: 'Synthetic source case; founder-approved released source is not selected yet.',
  },
  {
    id: 'unsupported-category-language',
    family: 'source',
    operation: 'start-learning-or-build-operation',
    precondition: 'Requested category/language/source tuple is outside the selected released coverage.',
    expected: { outcome: 'deny', errorClass: 'unsupported-scope', sideEffects: 'none' },
    recovery: 'Render an explicit unavailable state and retain the user draft.',
    evidence: 'Synthetic coverage case; KAN-29 source decisions remain a prerequisite.',
  },
  {
    id: 'stale-revision',
    family: 'revision',
    operation: 'mutate-versioned-object',
    precondition: 'Command expectedRevision is older than the owning object revision.',
    expected: { outcome: 'deny', errorClass: 'stale-revision', sideEffects: 'none' },
    recovery: 'Return current revision metadata and preserve the unsaved local draft for comparison.',
    evidence: 'Mirrors existing artifact/classwork conflict tests; connected domain store remains open.',
  },
  {
    id: 'duplicate-command',
    family: 'idempotency',
    operation: 'submit-command',
    precondition: 'The same actor, object, command identity and payload fingerprint are replayed.',
    expected: { outcome: 'replay-receipt', errorClass: null, sideEffects: 'one-commit' },
    recovery: 'Return the original receipt; do not create a second durable mutation or charge.',
    evidence: 'Synthetic replay case; durable receipt/outbox implementation remains open.',
  },
  {
    id: 'draft-preserved-after-conflict',
    family: 'recovery',
    operation: 'save-editor-draft-after-conflict',
    precondition: 'Another device commits a newer revision while this device has unsaved edits.',
    expected: { outcome: 'conflict-with-draft', errorClass: 'stale-revision', sideEffects: 'preserve-draft' },
    recovery: 'Keep the draft and current server revision separately; explicit merge/save is required.',
    evidence: 'Mirrors artifact-conflict.test.mjs; no cross-device runtime proof claimed.',
  },
  {
    id: 'two-device-reconnect',
    family: 'recovery',
    operation: 'resume-after-reconnect',
    precondition: 'A device reconnects after an acknowledged commit made from another device.',
    expected: { outcome: 'refetch-current', errorClass: null, sideEffects: 'none' },
    recovery: 'Refetch the owning revision and receipt; stale cached data cannot grant permission.',
    evidence: 'Synthetic observation case; durable sync/observation remains open.',
  },
];

export function caseIdsByFamily(family) {
  return invariantCases.filter((item) => item.family === family).map((item) => item.id);
}
