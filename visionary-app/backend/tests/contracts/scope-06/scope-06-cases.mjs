// Synthetic inputs, not a permission implementation or a released curriculum.
// Schema examples exercise only the accepted draft validator. Runtime inputs
// below are passed to the real LearningController/LearningService in runtime.test.cjs.
const mutationId = '00000000-0000-4000-8000-000000000001';
const submission = {
  version: 1, mutationId, workspaceId: 'sample:workspace', expectedRevision: 2,
  expectedPolicyRevision: 'policy:1', submissionId: 'sample:submission',
  source: { sourceId: 'sample:source', sourceRevision: '1', criteriaRevision: '1' },
  body: 'Synthetic answer.',
};
export const schemaCases = [
  { id: 'schema-valid', dto: 'SubmissionRevision', payload: submission, expected: { ok: true } },
  { id: 'schema-forged-role', dto: 'SubmissionRevision', payload: { ...submission, actorUid: 'forged', role: 'admin' }, expected: { ok: false, code: 'INVALID_REQUEST' } },
  { id: 'schema-wire-budget', dto: 'SubmissionRevision', payload: { ...submission, body: '\u0001'.repeat(24000) }, expected: { ok: false, code: 'PAYLOAD_TOO_LARGE' } },
];
export const runtimeScope = {
  ownerUid: 'scope06-owner', workspaceId: 'demo-adult:student',
  conceptId: 'fractions-equivalent', provider: 'authored-sample',
  sourceId: 'sample:fractions', sourceVersion: 'content-v1', criteriaVersion: 'rubric-v1',
};
export const runtimeCases = [
  { id: 'owner', actorUid: 'scope06-owner', sessionCurrent: true, workspaceId: 'demo-adult:student', expectedRevision: 1, selection: 0, status: 201 },
  { id: 'other-account', actorUid: 'scope06-other', sessionCurrent: true, workspaceId: 'demo-adult:student', expectedRevision: 1, selection: 0, status: 404 },
  { id: 'wrong-workspace', actorUid: 'scope06-owner', sessionCurrent: true, workspaceId: 'demo-adult:other', expectedRevision: 1, selection: 0, status: 409 },
  { id: 'stale-revision', actorUid: 'scope06-owner', sessionCurrent: true, workspaceId: 'demo-adult:student', expectedRevision: 0, selection: 0, status: 409 },
  { id: 'revoked-session', actorUid: 'scope06-owner', sessionCurrent: false, workspaceId: 'demo-adult:student', expectedRevision: 1, selection: 0, status: 401 },
];
