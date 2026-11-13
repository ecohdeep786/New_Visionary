import fs from 'node:fs';

export const limits = JSON.parse(fs.readFileSync(new URL('../request-limits.v1.json', import.meta.url)));
const ref = name => ({ $ref: `#/$defs/${name}` });
const text = maxLength => ({ type: 'string', minLength: 1, maxLength });
const integer = (minimum = 0, maximum = Number.MAX_SAFE_INTEGER) => ({ type: 'integer', minimum, maximum });
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, required });
const list = (items, maxItems = 50) => ({ type: 'array', items, maxItems });
const enumeration = (...values) => ({ type: 'string', enum: values });
const common = {
  version: { const: 1, type: 'integer' }, mutationId: ref('Uuid'),
  workspaceId: ref('Ref'), expectedRevision: ref('Revision'), expectedPolicyRevision: ref('Ref'),
};
const command = (properties, optional = []) => {
  const fields = { ...common, ...properties };
  return object(fields, Object.keys(fields).filter(name => !optional.includes(name)));
};

export const definitions = {
  Ref: { ...text(160), pattern: '^[A-Za-z0-9][A-Za-z0-9:._-]*$' },
  Uuid: { type: 'string', format: 'uuid', maxLength: 36 },
  Revision: integer(), Digest: { type: 'string', pattern: '^[a-f0-9]{64}$' },
  Cursor: { ...text(512), pattern: '^[A-Za-z0-9_-]+(?:\\.[A-Za-z0-9_-]+)*$' },
  SourceBinding: object({ sourceId: ref('Ref'), sourceRevision: ref('Ref'), criteriaRevision: ref('Ref') }),
  ProjectDraft: command({ projectId: ref('Ref'), title: text(limits.profiles['project-revision'].text.title.max), body: text(limits.profiles['project-revision'].text.body.max) }),
  SubmissionRevision: command({ submissionId: ref('Ref'), source: ref('SourceBinding'), body: text(limits.profiles['submission-revision'].text.body.max) }),
  TeachingTurn: command({ sessionId: ref('Ref'), source: ref('SourceBinding'), input: text(limits.profiles['teaching-turn'].text.input.max) }),
  FileIntent: command({ filename: text(200), mediaType: { ...text(100), pattern: '^[a-z0-9!#$&^_.+-]+/[a-z0-9!#$&^_.+-]+$' }, byteLength: integer(1), digest: ref('Digest') }),
  ProposalDecision: command({ proposalId: ref('Ref'), proposalDigest: ref('Digest'), decision: enumeration('accept', 'reject') }),
  ActivityProposal: object({ version: common.version, proposalId: ref('Ref'), workspaceId: ref('Ref'), baseRevision: ref('Revision'), source: ref('SourceBinding'), digest: ref('Digest'), kind: enumeration('document-revision', 'teaching-activity'), status: { const: 'proposed', type: 'string' } }),
  VoiceSession: command({ source: ref('SourceBinding'), language: { ...text(35), pattern: '^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$' } }),
  VoiceChunk: object({ version: common.version, sessionId: ref('Ref'), turnId: ref('Ref'), chunkId: ref('Uuid'), sequence: integer(0, 65535), mediaRef: ref('Ref'), digest: ref('Digest'), finalChunk: { type: 'boolean' } }),
  VoiceTranscript: object({ version: common.version, sessionId: ref('Ref'), turnId: ref('Ref'), sequence: integer(), text: text(4000), finality: enumeration('interim', 'final'), kind: { const: 'transcript', type: 'string' } }),
  Cancel: command({ targetId: ref('Ref'), reason: enumeration('user-request', 'superseded') }),
  PackManifest: object({ version: common.version, packId: ref('Ref'), workspaceId: ref('Ref'), source: ref('SourceBinding'), policyRevision: ref('Ref'), expiresAt: { type: 'string', format: 'date-time', maxLength: 40 }, digest: ref('Digest'), entries: list(object({ entryId: ref('Ref'), digest: ref('Digest'), byteLength: integer(1) }), 100) }),
  OfflineReplay: object({ version: common.version, packId: ref('Ref'), packDigest: ref('Digest'), commands: list(ref('TeachingTurn'), 20) }),
  StageEvent: {
    ...command({ eventId: ref('Uuid'), expectedProfileRevision: ref('Revision'), mappingId: ref('Ref'), mappingRevision: ref('Ref'), source: ref('SourceBinding'), consentRevision: ref('Ref'), action: enumeration('propose', 'confirm', 'postpone', 'undo'), relatedReceiptId: ref('Ref') }, ['relatedReceiptId']),
    allOf: [{
      if: { properties: { action: { enum: ['undo', 'postpone'] } }, required: ['action'] },
      then: { properties: { relatedReceiptId: ref('Ref') }, required: ['relatedReceiptId'] },
    }],
  },
  StageMapping: object({ version: common.version, mappingId: ref('Ref'), revision: ref('Ref'), fromStage: ref('Ref'), toStage: ref('Ref'), source: ref('SourceBinding'), publicationReceiptId: ref('Ref') }),
  ProfileSnapshot: object({ version: common.version, profileId: ref('Ref'), revision: ref('Revision'), stage: ref('Ref'), policyRevision: ref('Ref'), lastTransitionReceiptId: ref('Ref'), projection: enumeration('current', 'pending') }),
  CoachingGoal: command({ goalId: ref('Ref'), text: text(2000), visibility: { const: 'private', type: 'string' } }),
  SummaryRequest: command({ purpose: enumeration('self-review', 'authorized-progress-report'), audienceRef: ref('Ref'), relationshipRevision: ref('Ref'), consentRevision: ref('Ref'), source: ref('SourceBinding'), summaryRevision: ref('Revision') }),
  PageQuery: object({ limit: integer(1, limits.observed.pageMax), cursor: ref('Cursor') }, []),
  ResourcePage: object({ version: common.version, items: list(object({ id: ref('Ref'), revision: ref('Revision') }), limits.observed.pageMax), nextCursor: { anyOf: [ref('Cursor'), { type: 'null' }] } }),
  Error: object({ version: common.version, requestId: ref('Uuid'), code: enumeration('INVALID_REQUEST', 'UNAUTHENTICATED', 'DENIED', 'NOT_FOUND', 'COMMAND_CONFLICT', 'STALE_REVISION', 'CURSOR_EXPIRED', 'PAYLOAD_TOO_LARGE', 'UNSUPPORTED_MEDIA', 'UNSUPPORTED_OPERATION', 'QUOTA_EXCEEDED', 'UNAVAILABLE', 'DEADLINE_EXCEEDED'), message: text(240), retryable: { type: 'boolean' }, retryAfterSeconds: integer(0, 3600) }, ['version', 'requestId', 'code', 'message', 'retryable']),
  CommitReceipt: object({ version: common.version, receiptId: ref('Ref'), mutationId: ref('Uuid'), workspaceId: ref('Ref'), revision: integer(1), policyRevision: ref('Ref'), status: { const: 'committed', type: 'string' }, projection: enumeration('current', 'pending') }),
  AcceptedRun: object({ version: common.version, runId: ref('Ref'), mutationId: ref('Uuid'), status: { const: 'accepted', type: 'string' } }),
  ChangeEvent: object({ version: common.version, eventId: ref('Uuid'), sequence: integer(1), cursor: ref('Cursor'), workspaceId: ref('Ref'), resourceId: ref('Ref'), revision: integer(1), kind: enumeration('invalidate', 'revoked'), action: { const: 'refetch', type: 'string' } }),
  StreamEvent: object({ version: common.version, runId: ref('Ref'), sequence: integer(1), kind: enumeration('delta', 'complete', 'cancelled'), text: { type: 'string', maxLength: 4000 }, committed: { const: false, type: 'boolean' } }),
};

export const schema = { $schema: 'https://json-schema.org/draft/2020-12/schema', $id: 'urn:visionary:api:v1', $defs: definitions };
export const manifest = {
  schemaVersion: 1, jiraKey: 'KAN-30', state: 'draft-preparation', frozen: false,
  runtimeEndpointsRegistered: 0, authorityImplemented: false, persistenceImplemented: false,
  freezeGates: ['KAN-29 source decisions', 'KAN-31 authority acceptance', 'KAN-32 admission and policy acceptance'],
  runtimeGates: ['server authority and consent/source checks', 'atomic owning-store receipts and outbox', 'signed scoped expiring cursors', 'voice and offline admission', 'hosted integration and recovery'],
  currentRoutes: limits.currentRoutes, infrastructureSurfaces: limits.infrastructureSurfaces.routes,
  operations: {
    ProjectDraft: 'project-revision', SubmissionRevision: 'submission-revision', TeachingTurn: 'teaching-turn', FileIntent: 'file-intent',
    ProposalDecision: 'existing-json', VoiceSession: 'teaching-turn', VoiceChunk: 'file-intent', VoiceTranscript: 'teaching-turn',
    Cancel: 'existing-json', PackManifest: 'existing-json', OfflineReplay: 'existing-json', StageEvent: 'existing-json',
    StageMapping: 'existing-json', ProfileSnapshot: 'existing-json', CoachingGoal: 'existing-json', SummaryRequest: 'existing-json',
    ActivityProposal: 'existing-json', PageQuery: 'existing-json', ResourcePage: 'existing-json', Error: 'existing-json',
    CommitReceipt: 'existing-json', AcceptedRun: 'existing-json', ChangeEvent: 'existing-json', StreamEvent: 'existing-json',
  },
};

// Keep draft URLs separate from the unchanged legacy inventory. No server imports this module.
const operations = [
  ['put', '/api/v1/projects/{projectId}/draft', 'ProjectDraft', 'CommitReceipt', 200],
  ['post', '/api/v1/submissions/{submissionId}/revisions', 'SubmissionRevision', 'CommitReceipt', 200],
  ['post', '/api/v1/teaching/turns', 'TeachingTurn', 'AcceptedRun', 202],
  ['post', '/api/v1/files/intents', 'FileIntent', 'AcceptedRun', 202],
  ['post', '/api/v1/proposals/{proposalId}/decisions', 'ProposalDecision', 'CommitReceipt', 200],
  ['post', '/api/v1/voice/sessions', 'VoiceSession', 'AcceptedRun', 202],
  ['post', '/api/v1/voice/chunks', 'VoiceChunk', 'AcceptedRun', 202],
  ['post', '/api/v1/cancellations', 'Cancel', 'AcceptedRun', 202],
  ['post', '/api/v1/offline/replay', 'OfflineReplay', 'AcceptedRun', 202],
  ['post', '/api/v1/profile/stage-events', 'StageEvent', 'CommitReceipt', 200],
  ['post', '/api/v1/coaching/goals', 'CoachingGoal', 'CommitReceipt', 200],
  ['post', '/api/v1/summaries', 'SummaryRequest', 'AcceptedRun', 202],
];
const component = name => ({ $ref: `#/components/schemas/${name}` });
const content = name => ({ 'application/json': { schema: component(name) } });
const parameters = [{ name: 'X-Visionary-Account', in: 'header', required: true, schema: { type: 'string', minLength: 1, maxLength: 128 }, description: 'Expected account hint only; server authenticates session and device and compares UID.' }];
const paths = Object.fromEntries(operations.map(([method, route, request, response, status]) => [route, { [method]: {
  operationId: request, 'x-runtime-registered': false, 'x-limit-profile': manifest.operations[request],
  description: 'DRAFT. Not registered. Revalidate current server authority on every attempt, including duplicate commands. No arbitrary model or spoken action execution.',
  parameters: [...parameters, ...[...route.matchAll(/\{(\w+)\}/g)].map(([,name]) => ({ name, in: 'path', required: true, schema: component('Ref') })),
    ...(request === 'ProjectDraft' ? [{ name: 'If-Match', in: 'header', required: true, schema: { type: 'string', pattern: '^"[0-9]+"$' }, description: 'Strong ETag of expectedRevision. Body and header must agree; stale is 412.' }] : [])],
  security: [{ session: [], device: [], csrf: [] }],
  requestBody: { required: true, content: content(request) },
  responses: { [status]: { description: status === 202 ? 'Accepted durable operation, not a committed domain revision.' : 'Owning-store committed receipt; projection may still be pending.', content: content(response) }, ...Object.fromEntries([400,401,403,404,409,412,413,415,429,501,503,504].map(code => [code, { description: ({409:'Changed mutation payload or expected-account conflict.',412:'Stale expected revision or mismatched strong ETag.',501:'Explicit unsupported operation.',504:'Operation deadline exceeded; inspect durable status before any replay.'})[code] ?? 'Safe typed error; no input echo.', content: content('Error') }])) },
} }]));
// Rewrite local refs for a standalone OpenAPI components document.
const components = JSON.parse(JSON.stringify(definitions).replaceAll('#/$defs/', '#/components/schemas/'));
export const openapi = {
  openapi: '3.1.1', info: { title: 'Visionary API v1 draft contracts', version: '0.1.0', description: 'Offline preparation only. Freeze blocked by source, authority and admission decisions. Legacy routes remain unchanged.' },
  'x-contract-state': manifest.state, 'x-freeze-gates': manifest.freezeGates,
  paths, components: { schemas: components, securitySchemes: {
    session: { type: 'apiKey', in: 'cookie', name: '__Host-visionary-session' },
    device: { type: 'apiKey', in: 'cookie', name: '__Host-visionary-device' },
    csrf: { type: 'apiKey', in: 'header', name: 'X-CSRF-Token', description: '64 hex characters matching the HttpOnly CSRF cookie; exact allowed Origin also required. Loopback cookie prefix is visionary-.' },
  } },
};
