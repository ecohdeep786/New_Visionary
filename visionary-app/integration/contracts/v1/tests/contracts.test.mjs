import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { definitions, manifest, limits, openapi } from '../definitions.mjs';
import { validateWire, fingerprint, replayComparison, compareRevision } from '../validate.mjs';

const uuid = '00000000-0000-4000-8000-000000000001';
const digest = 'a'.repeat(64);
const common = { version: 1, mutationId: uuid, workspaceId: 'sample:workspace', expectedRevision: 2, expectedPolicyRevision: 'policy:1' };
const source = { sourceId: 'sample:source', sourceRevision: '1', criteriaRevision: '1' };
const fixtures = {
  ProjectDraft: { ...common, projectId: 'sample:project', title: 'Example', body: 'Synthetic draft' },
  SubmissionRevision: { ...common, submissionId: 'sample:submission', source, body: 'Synthetic answer' },
  TeachingTurn: { ...common, sessionId: 'sample:session', source, input: 'Synthetic question' },
  FileIntent: { ...common, filename: 'example.txt', mediaType: 'text/plain', byteLength: 20, digest },
  ProposalDecision: { ...common, proposalId: 'sample:proposal', proposalDigest: digest, decision: 'accept' },
  ActivityProposal: { version: 1, proposalId: 'sample:proposal', workspaceId: common.workspaceId, baseRevision: 2, source, digest, kind: 'document-revision', status: 'proposed' },
  VoiceSession: { ...common, source, language: 'en-IN' },
  VoiceChunk: { version: 1, sessionId: 'sample:session', turnId: 'sample:turn', chunkId: uuid, sequence: 0, mediaRef: 'sample:media', digest, finalChunk: true },
  VoiceTranscript: { version: 1, sessionId: 'sample:session', turnId: 'sample:turn', sequence: 1, text: 'Synthetic words', finality: 'interim', kind: 'transcript' },
  Cancel: { ...common, targetId: 'sample:run', reason: 'user-request' },
  PackManifest: { version: 1, packId: 'sample:pack', workspaceId: common.workspaceId, source, policyRevision: 'policy:1', expiresAt: '2026-10-25T00:00:00Z', digest, entries: [{ entryId: 'sample:entry', digest, byteLength: 20 }] },
  StageEvent: { ...common, eventId: uuid, expectedProfileRevision: 2, mappingId: 'mapping:1', mappingRevision: '1', source, consentRevision: 'consent:1', action: 'undo', relatedReceiptId: 'receipt:1' },
  StageMapping: { version: 1, mappingId: 'mapping:1', revision: '1', fromStage: 'stage:a', toStage: 'stage:b', source, publicationReceiptId: 'receipt:publication' },
  ProfileSnapshot: { version: 1, profileId: 'profile:1', revision: 2, stage: 'stage:a', policyRevision: 'policy:1', lastTransitionReceiptId: 'receipt:1', projection: 'pending' },
  CoachingGoal: { ...common, goalId: 'goal:1', text: 'Synthetic goal', visibility: 'private' },
  SummaryRequest: { ...common, purpose: 'self-review', audienceRef: 'audience:self', relationshipRevision: 'relation:1', consentRevision: 'consent:1', source, summaryRevision: 2 },
  PageQuery: {}, ResourcePage: { version: 1, items: [{ id: 'resource:1', revision: 2 }], nextCursor: null },
  Error: { version: 1, requestId: uuid, code: 'DENIED', message: 'Unavailable for this request.', retryable: false },
  CommitReceipt: { version: 1, receiptId: 'receipt:1', mutationId: uuid, workspaceId: common.workspaceId, revision: 3, policyRevision: 'policy:1', status: 'committed', projection: 'pending' },
  AcceptedRun: { version: 1, runId: 'run:1', mutationId: uuid, status: 'accepted' },
  ChangeEvent: { version: 1, eventId: uuid, sequence: 1, cursor: 'opaque_token.signature', workspaceId: common.workspaceId, resourceId: 'resource:1', revision: 3, kind: 'invalidate', action: 'refetch' },
  StreamEvent: { version: 1, runId: 'run:1', sequence: 1, kind: 'delta', text: 'Synthetic partial', committed: false },
};
fixtures.OfflineReplay = { version: 1, packId: 'sample:pack', packDigest: digest, commands: [fixtures.TeachingTurn] };
const validate = (name, value) => validateWire(name, JSON.stringify(value));
for (const name of Object.keys(manifest.operations)) {
  test(`${name}: positive, unsupported version, unknown authority and missing required field`, () => {
    const value = structuredClone(fixtures[name]);
    assert.equal(validate(name, value).ok, true);
    assert.equal(validate(name, { ...value, version: 2 }).ok, false);
    assert.equal(validate(name, { ...value, actorUid: 'forged', role: 'admin' }).ok, false);
    const key = definitions[name].required[0];
    if (key) { delete value[key]; assert.equal(validate(name, value).ok, false); }
  });
}
test('all declared DTOs have fixtures; legacy route inventory remains identical', () => {
  assert.deepEqual(Object.keys(manifest.operations).sort(), Object.keys(fixtures).sort());
  assert.equal(Object.keys(manifest.currentRoutes).length, 37);
  assert.deepEqual(manifest.currentRoutes, limits.currentRoutes);
  assert.deepEqual(manifest.infrastructureSurfaces, limits.infrastructureSurfaces.routes);
  assert.equal(manifest.frozen, false); assert.equal(manifest.runtimeEndpointsRegistered, 0);
  assert.equal(manifest.freezeGates.length, 3);
});
test('Unicode scalar limits and complete escaped wire budget are independent', () => {
  assert.equal(validate('ProjectDraft', { ...fixtures.ProjectDraft, title: '😀'.repeat(200) }).ok, true);
  assert.equal(validate('ProjectDraft', { ...fixtures.ProjectDraft, title: '😀'.repeat(201) }).ok, false);
  assert.equal(validate('ProjectDraft', { ...fixtures.ProjectDraft, body: 'x'.repeat(24000) }).ok, true);
  assert.equal(validate('ProjectDraft', { ...fixtures.ProjectDraft, body: 'x'.repeat(24001) }).ok, false);
  assert.equal(validate('ProjectDraft', { ...fixtures.ProjectDraft, body: '\u0001'.repeat(24000) }).code, 'PAYLOAD_TOO_LARGE');
  assert.equal(validate('ProjectDraft', { ...fixtures.ProjectDraft, body: '\ud800' }).ok, false);
  assert.equal(validate('TeachingTurn', { ...fixtures.TeachingTurn, input: 'x'.repeat(4001) }).ok, false);
  assert.equal(validate('SubmissionRevision', { ...fixtures.SubmissionRevision, body: 'x'.repeat(12001) }).ok, false);
});
test('wire parser rejects malformed/non JSON and unsupported names without input echo', () => {
  for (const wire of ['{', 'null', '[]', '1e999', '"secret"', '', undefined]) {
    assert.deepEqual(validateWire('ProjectDraft', wire), { ok: false, code: 'INVALID_REQUEST' });
  }
  assert.deepEqual(validateWire('AdminGrant', '{}'), { ok: false, code: 'UNSUPPORTED_OPERATION' });
  assert.equal(validateWire('ProjectDraft', ' '.repeat(131073)).code, 'PAYLOAD_TOO_LARGE');
});
test('strict validation does not coerce, default, trim or remove client fields', () => {
  const value = { ...fixtures.ProjectDraft, expectedRevision: '2' };
  const wire = JSON.stringify(value);
  assert.equal(validateWire('ProjectDraft', wire).ok, false);
  assert.equal(JSON.stringify(value), wire);
  assert.deepEqual(validate('PageQuery', {}).value, {});
  for (const expectedRevision of [-1, 1.5, 9007199254740992]) assert.equal(validate('ProjectDraft', { ...fixtures.ProjectDraft, expectedRevision }).ok, false);
});
test('pagination bounds items, cursor syntax and response wire; cursors are not authentication', () => {
  assert.equal(validate('PageQuery', { limit: 50, cursor: 'opaque_token.signature' }).ok, true);
  for (const limit of [0, 51, '20', 1.5]) assert.equal(validate('PageQuery', { limit }).ok, false);
  for (const cursor of ['x'.repeat(513), '../private', '']) assert.equal(validate('PageQuery', { cursor }).ok, false);
  assert.equal(validate('ResourcePage', { ...fixtures.ResourcePage, items: Array(51).fill(fixtures.ResourcePage.items[0]) }).ok, false);
  assert.equal(validateWire('ResourcePage', ' '.repeat(262145)).code, 'UNAVAILABLE');
});
test('identical retry fingerprint is deterministic, changed content/scope/revision conflicts', () => {
  const first = fixtures.ProjectDraft;
  const hash = fingerprint('ProjectDraft', JSON.stringify(first));
  const reversed = Object.fromEntries(Object.entries(first).reverse());
  assert.equal(replayComparison(hash, 'ProjectDraft', JSON.stringify(reversed)), 'same-payload');
  for (const [key,value] of Object.entries({ body: 'Changed', workspaceId: 'other:workspace', expectedRevision: 3, expectedPolicyRevision: 'policy:2', projectId: 'other:project' })) {
    assert.equal(replayComparison(hash, 'ProjectDraft', JSON.stringify({ ...first, [key]: value })), 'command-conflict');
  }
  assert.throws(() => fingerprint('ProjectDraft', '{}'));
  assert.throws(() => replayComparison('invalid', 'ProjectDraft', '{}'));
  assert.equal(compareRevision(2,2), 'matches'); assert.equal(compareRevision(2,3), 'stale');
  assert.throws(() => compareRevision(-1,3));
});
test('proposal, interim/final transcript, partial/complete/cancelled stream never grant commit', () => {
  assert.equal(validate('CommitReceipt', fixtures.ActivityProposal).ok, false);
  assert.equal(validate('ProposalDecision', fixtures.VoiceTranscript).ok, false);
  for (const finality of ['interim', 'final']) {
    assert.equal(validate('VoiceTranscript', { ...fixtures.VoiceTranscript, finality }).ok, true);
    assert.equal(validate('ProposalDecision', { ...fixtures.VoiceTranscript, finality }).ok, false);
  }
  for (const kind of ['delta', 'complete', 'cancelled']) {
    assert.equal(validate('StreamEvent', { ...fixtures.StreamEvent, kind }).ok, true);
    assert.equal(validate('StreamEvent', { ...fixtures.StreamEvent, kind, committed: true }).ok, false);
  }
  assert.equal(validate('StreamEvent', { ...fixtures.StreamEvent, text: '😀'.repeat(4000) }).code, 'UNAVAILABLE');
  assert.equal(validate('CommitReceipt', { ...fixtures.CommitReceipt, revision: 0 }).ok, false);
  assert.equal(validate('AcceptedRun', { ...fixtures.AcceptedRun, status: 'committed' }).ok, false);
});
test('no inline file, private summary dump, public coaching, invalid pack or oversized replay', () => {
  assert.equal(validate('FileIntent', { ...fixtures.FileIntent, base64: 'eA==' }).ok, false);
  assert.equal(validate('SummaryRequest', { ...fixtures.SummaryRequest, privateDoubts: ['synthetic'] }).ok, false);
  assert.equal(validate('CoachingGoal', { ...fixtures.CoachingGoal, visibility: 'public' }).ok, false);
  assert.equal(validate('PackManifest', { ...fixtures.PackManifest, expiresAt: 'yesterday' }).ok, false);
  assert.equal(validate('OfflineReplay', { ...fixtures.OfflineReplay, commands: Array(21).fill(fixtures.TeachingTurn) }).ok, false);
  assert.equal(validate('StageEvent', { ...fixtures.StageEvent, actorUid: 'forged' }).ok, false);
  const stage = { ...fixtures.StageEvent }; delete stage.relatedReceiptId;
  assert.equal(validate('StageEvent', stage).ok, false);
  assert.equal(validate('StageEvent', { ...stage, action: 'propose' }).ok, true);
});
test('errors are bounded, typed, cannot echo arbitrary data', () => {
  for (const change of [{ details: { secret: 'example' } }, { message: 'x'.repeat(241) }, { retryAfterSeconds: 3601 }, { code: 'STACK_TRACE' }]) {
    assert.equal(validate('Error', { ...fixtures.Error, ...change }).ok, false);
  }
});
test('OpenAPI uses standalone component refs, explicit draft security and all path parameters', () => {
  assert.equal(openapi.openapi, '3.1.1');
  assert.equal(JSON.stringify(openapi).includes('#/$defs/'), false);
  for (const [route, methods] of Object.entries(openapi.paths)) for (const operation of Object.values(methods)) {
    assert.equal(operation['x-runtime-registered'], false);
    assert.deepEqual(operation.security, [{ session: [], device: [], csrf: [] }]);
    for (const [,name] of route.matchAll(/\{(\w+)\}/g)) assert.ok(operation.parameters.some(p => p.in === 'path' && p.name === name && p.required));
    for (const response of Object.values(operation.responses)) assert.ok(response.content['application/json'].schema.$ref);
  }
  assert.equal(openapi.components.securitySchemes.device.name, '__Host-visionary-device');
  for (const file of ['schemas.json','openapi.json','manifest.json']) assert.ok(fs.existsSync(new URL(`../${file}`, import.meta.url)));
});
