/** KAN-145 — the knowledge projection client contract.
 *
 * The browser only references one immutable server-assessed receipt and never
 * sends or receives a verdict field. These fixtures prove the registered
 * HTTP contract (integration/KNOWLEDGE_PROJECTION_CONTRACT.md): exact URLs and
 * owner headers, strict response validation (scope echo, no invented verdicts,
 * no mastery labels), 404 reads as the honest empty state, replay visibility,
 * and the honest confirmation error when the server cannot confirm.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createKnowledgeProjectionClient } from '../src/services/knowledgeProjectionClient.js';

const uuid = () => crypto.randomUUID();
const scope = { workspaceId: 'demo-adult:student', conceptId: 'concept-1', sourceVersion: 'a2', criteriaVersion: 'rubric-a2' };
const receipt = (overrides = {}) => ({ version: 1, uid: 'owner', replay: false, ...scope, modelVersion: 'a2-calib-v1', pKnown: 0.42, revision: 1, lastSequence: 1, lastReceiptId: uuid(), lastReceiptDigest: 'digest-1', assessedCount: 1, ...overrides });
const model = { version: 1, uid: 'owner', model: { version: 'a2-calib-v1', guess: 0.25, slip: 0.08, transit: 0.15, license: 'reference', initial: 0.35, requires: { sourceVersion: 'a2', criteriaVersion: 'rubric-a2' } } };

test('the default client hits the registered knowledge URLs with the owner header and CSRF', async () => {
  const originalFetch = globalThis.fetch, calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url === '/api/auth/csrf') return new Response(JSON.stringify({ token: 'fixture-csrf' }));
    return new Response(JSON.stringify(url.includes('/models') ? model : receipt()));
  };
  try {
    const client = createKnowledgeProjectionClient({ getAccountId: () => 'owner' });
    await client.models({ sourceVersion: scope.sourceVersion, criteriaVersion: scope.criteriaVersion });
    await client.projection(scope);
    await client.project({ commandId: uuid(), sessionId: uuid(), receiptId: uuid(), ...scope });
    const routed = calls.filter(call => call.url !== '/api/auth/csrf');
    assert.deepEqual(routed.map(call => [call.options.method, call.url]), [
      ['GET', `/api/account/learning/knowledge/models?sourceVersion=${scope.sourceVersion}&criteriaVersion=${scope.criteriaVersion}`],
      ['GET', `/api/account/learning/knowledge/projections?${new URLSearchParams(scope)}`],
      ['POST', '/api/account/learning/knowledge/project'],
    ]);
    for (const call of routed) {
      assert.equal(call.options.headers['X-Visionary-Account'], 'owner');
      assert.equal(call.options.credentials, 'same-origin');
      assert.equal(call.options.cache, 'no-store');
      if (call.options.method === 'POST') assert.equal(call.options.headers['X-CSRF-Token'], 'fixture-csrf');
    }
    const body = JSON.parse(routed[2].options.body);
    assert.deepEqual(Object.keys(body).sort(), ['commandId', 'receiptId', 'sessionId', 'version'], 'the command carries only references — no verdict field ever leaves the browser');
  } finally { globalThis.fetch = originalFetch; }
});

test('a projection read maps 404 to the honest empty state and validates the scope echo', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'No assessments are projected for this scope yet.' }), { status: 404 });
  try {
    const client = createKnowledgeProjectionClient({ getAccountId: () => 'owner' });
    assert.equal(await client.projection(scope), null, '404 is the contract empty state, not an error');
  } finally { globalThis.fetch = originalFetch; }
  // A response that does not echo the requested scope is refused.
  globalThis.fetch = async () => new Response(JSON.stringify(receipt({ conceptId: 'another-concept' })));
  try {
    const client = createKnowledgeProjectionClient({ getAccountId: () => 'owner' });
    await assert.rejects(() => client.projection(scope), error => error?.status === 503);
  } finally { globalThis.fetch = originalFetch; }
});

test('the client refuses invented verdicts, mastery labels and out-of-range estimates', async () => {
  const originalFetch = globalThis.fetch;
  const bad = [
    receipt({ pKnown: 1.4 }), receipt({ pKnown: -0.1 }), receipt({ uid: 'someone-else' }),
    receipt({ replay: 'yes' }), receipt({ assessedCount: -1 }), receipt({ modelVersion: '' }),
    { ...receipt(), passed: true }, { ...receipt(), mastery: 'high' },
    { ...model, model: { ...model.model, pKnown: 0.5 } }, { ...model, model: { ...model.model, version: '' } },
    { ...model, model: { ...model.model, requires: null } },
  ];
  try {
    const client = createKnowledgeProjectionClient({ getAccountId: () => 'owner' });
    for (const value of bad) {
      globalThis.fetch = async () => new Response(JSON.stringify(value));
      await assert.rejects(() => client.projection(scope), error => error?.status === 503, JSON.stringify(value));
    }
  } finally { globalThis.fetch = originalFetch; }
});

test('replay visibility and invalid references behave exactly as the contract states', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(receipt({ replay: true })));
  try {
    const client = createKnowledgeProjectionClient({ getAccountId: () => 'owner' });
    const value = await client.project({ commandId: uuid(), sessionId: uuid(), receiptId: uuid(), ...scope });
    assert.equal(value.replay, true, 'the caller can distinguish an original commit from an idempotent replay');
  } finally { globalThis.fetch = originalFetch; }
  globalThis.fetch = async () => { throw new Error('must not be called'); };
  try {
    const client = createKnowledgeProjectionClient({ getAccountId: () => 'owner' });
    await assert.rejects(() => client.project({ commandId: 'not-a-uuid', sessionId: uuid(), receiptId: uuid(), ...scope }), error => error?.status === 400);
    await assert.rejects(() => client.projection({ ...scope, conceptId: '' }), error => error?.status === 400);
    await assert.rejects(() => client.models({ sourceVersion: '', criteriaVersion: scope.criteriaVersion }), error => error?.status === 400);
  } finally { globalThis.fetch = originalFetch; }
});

test('an account change mid-flight refuses the response instead of cross-reading estimates', async () => {
  const originalFetch = globalThis.fetch;
  let account = 'owner';
  globalThis.fetch = async () => new Response(JSON.stringify(receipt()));
  try {
    const client = createKnowledgeProjectionClient({ getAccountId: () => account });
    const pending = client.projection(scope);
    account = 'someone-else';
    await assert.rejects(() => pending, error => error?.status === 409);
  } finally { globalThis.fetch = originalFetch; }
});

/* Source law — the Progress panel binds the server estimate honestly. */
import { readFileSync } from 'node:fs';

test('the Progress page binds the knowledge estimate panel and the guided rows carry the server scope', () => {
  const page = readFileSync(new URL('../src/pages/dashboard/LearningProgress.jsx', import.meta.url), 'utf8');
  assert.match(page, /import KnowledgeEstimatePanel from '@\/components\/dashboard\/KnowledgeEstimatePanel';/, 'the panel is imported');
  assert.match(page, /<KnowledgeEstimatePanel ctx=\{ctx\} rows=\{report\.objectives\} locale=\{locale\} \/>/, 'the panel receives the report rows');
  const service = readFileSync(new URL('../src/services/learningProgressService.ts', import.meta.url), 'utf8');
  assert.match(service, /knowledge:scopeProvenance\?\{conceptId,sourceVersion:scopeProvenance\.version,criteriaVersion:scopeProvenance\.version\}:null/, 'guided rows carry the durable scope (provenance version is both source and criteria version)');
});

test('the estimate panel shows only server-computed state with honest empty and unavailable states', () => {
  const panel = readFileSync(new URL('../src/components/dashboard/KnowledgeEstimatePanel.jsx', import.meta.url), 'utf8');
  assert.match(panel, /client\.projection/, 'the panel reads through the projection client');
  assert.match(panel, /Math\.round\(entry\.estimate\.pKnown \* 100\)/, 'the estimate is shown exactly as the server computed it');
  assert.match(panel, /estimateNone/, 'a scope with no estimate shows the honest empty state, never a fabricated number');
  assert.match(panel, /estimateRetry/, 'a failed read offers the real retry action');
  assert.match(panel, /estimateConflictNote/, 'a model-change conflict tells the truth: the estimate replays from retained evidence');
  assert.doesNotMatch(panel, /[Mm]astered|mastery|taught/, 'the panel never renders a mastery or taught label');
  assert.match(panel, /MAX_SCOPES = 6/, 'requests stay bounded');
  assert.match(panel, /createKnowledgeProjectionClient\(\{ getAccountId/, 'the panel reads through the same verified identity');
  const client = readFileSync(new URL('../src/services/knowledgeProjectionClient.js', import.meta.url), 'utf8');
  assert.match(client, /error\?\.status === 404\) return null/, 'a missing projection is the honest empty state at the client');
  assert.match(client, /no pKnown or mastery label exists/, 'the model read stays parameter-only');
  assert.match(client, /value\.uid !== uid/, 'every response is checked against the signed-in owner');
});

test('the pipeline wires the projection after a confirmed assessment and nothing else', () => {
  const pipeline = readFileSync(new URL('../src/services/learningPipelineService.ts', import.meta.url), 'utf8');
  assert.match(pipeline, /export function configureKnowledgeProjectionAdapter\(adapter:KnowledgeProjectionAdapter\|null\)\{knowledgeProjections=adapter;\}/, 'the adapter is injected like the session adapter');
  assert.match(pipeline, /projectKnowledgeEstimate\(ctx,unit,scope,receipt\.receipt\.id\)/, 'the projection fires only after the assessment is confirmed');
  assert.match(pipeline, /\.catch\(\(\)=>\{\}\)/, 'a projection failure never invalidates the saved learning evidence');
  const workspace = readFileSync(new URL('../src/pages/dashboard/LearningWorkspace.jsx', import.meta.url), 'utf8');
  assert.match(workspace, /configureKnowledgeProjectionAdapter\(createKnowledgeProjectionClient\(/, 'the workspace configures the estimate adapter with the same verified identity');
  assert.match(workspace, /configureKnowledgeProjectionAdapter\(null\)/, 'signed-out visitors get no estimate adapter');
});
