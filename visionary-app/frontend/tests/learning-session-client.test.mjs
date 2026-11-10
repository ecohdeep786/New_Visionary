import test from 'node:test';
import assert from 'node:assert/strict';
import { createLearningSessionClient } from '../src/services/learningSessionClient.js';

const sessionId = () => crypto.randomUUID();
const receipt = (overrides = {}) => ({ version: 1, uid: 'owner', sessionId: sessionId(), workspaceId: 'demo-adult:student', concept: { sourceVersion: 'source-v1', criteriaVersion: 'criteria-v1' }, status: 'active', phase: 'explain', revision: 0, failedChecks: 0, maxFailedChecks: 3, previousStrategy: null, checkPassed: false, reviewSuggested: false, check: null, createdAt: '2026-10-18T00:00:00.000Z', updatedAt: '2026-10-18T00:00:00.000Z', ...overrides });

test('the default client and actual auth transport construct registered learning URLs for every operation', async () => {
  const originalFetch = globalThis.fetch, calls = [], target = sessionId();
  const valid = receipt({ sessionId: target });
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url === '/api/auth/csrf') return new Response(JSON.stringify({ token: 'fixture-csrf' }));
    const parsed = new URL(url, 'http://localhost');
    assert.match(parsed.pathname, /^\/api\/account\/learning\/sessions(?:\/[a-f0-9-]+(?:\/(?:checks|assessments|cancel))?)?$/);
    if (options.method === 'GET' && parsed.pathname.endsWith('/sessions'))
      return new Response(JSON.stringify({ version: 1, uid: 'owner', items: [valid], nextCursor: null }));
    const body = options.body ? JSON.parse(options.body) : null;
    return new Response(JSON.stringify({
      ...valid,
      ...(parsed.pathname.endsWith('/assessments') ? { receipt: { id: body.commandId, checkId: body.checkId, passed: true } } : {}),
      ...(parsed.pathname.endsWith('/cancel') ? { status: 'cancelled' } : {}),
    }));
  };
  try {
    // Do not inject request: this must exercise the real default URL join.
    const client = createLearningSessionClient({ getAccountId: () => 'owner' });
    const input = { version: 1, commandId: sessionId(), workspaceId: valid.workspaceId,
      sourceVersion: valid.concept.sourceVersion, criteriaVersion: valid.concept.criteriaVersion };
    await client.start(input);
    await client.get(target);
    await client.present(target, input);
    await client.assess(target, { ...input, checkId: 'check-1' });
    await client.cancel(target, input);
    await client.list({ workspaceId: valid.workspaceId, limit: 2 });
    const routed = calls.filter(c => c.url !== '/api/auth/csrf');
    assert.deepEqual(routed.map(c => [c.options.method, c.url]), [
      ['POST', '/api/account/learning/sessions'],
      ['GET', `/api/account/learning/sessions/${target}`],
      ['POST', `/api/account/learning/sessions/${target}/checks`],
      ['POST', `/api/account/learning/sessions/${target}/assessments`],
      ['POST', `/api/account/learning/sessions/${target}/cancel`],
      ['GET', '/api/account/learning/sessions?workspaceId=demo-adult%3Astudent&limit=2'],
    ]);
    for (const call of routed) {
      assert.equal(call.options.headers['X-Visionary-Account'], 'owner');
      assert.equal(call.options.credentials, 'same-origin');
      assert.equal(call.options.cache, 'no-store');
      if (call.options.method === 'POST') assert.equal(call.options.headers['X-CSRF-Token'], 'fixture-csrf');
    }
    assert.equal(calls.filter(c => c.url === '/api/auth/csrf').length, 4);
  } finally { globalThis.fetch = originalFetch; }
});

test('the connected client sends owner-scoped commands on the durable learning routes', async () => {
  const calls = [];
  const client = createLearningSessionClient({ getAccountId: () => 'owner', request: async (path, options) => { calls.push({ path, options }); const target = path.match(/^sessions\/([^/]+)/)?.[1]; return receipt({ ...(target ? { sessionId: target } : {}), ...(path.endsWith('/assessments') ? { receipt: { id: options.body.commandId, checkId: options.body.checkId, passed: true } } : {}) }); } });
  await client.start({ version: 1, commandId: crypto.randomUUID() });
  assert.equal(calls[0].path, 'sessions');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.accountId, 'owner');
  assert.equal(typeof calls[0].options.beforeSend, 'function');
  const id = sessionId();
  await client.get(id); await client.present(id, {}); await client.assess(id, { commandId: crypto.randomUUID(), checkId: 'check-1' }); await client.cancel(id, {});
  assert.deepEqual(calls.slice(1).map(call => call.path), [`sessions/${id}`, `sessions/${id}/checks`, `sessions/${id}/assessments`, `sessions/${id}/cancel`]);
  assert.deepEqual(calls.slice(1).map(call => call.options.method || 'GET'), ['GET', 'POST', 'POST', 'POST']);
  assert.deepEqual(new Set(calls.map(call => call.options.accountId)), new Set(['owner']));
});

test('keyed, foreign, impossible or malformed receipts are refused without echoing their content', async () => {
  const broken = inputs => createLearningSessionClient({ getAccountId: () => 'owner', request: async () => inputs.shift() });
  for (const input of [
    receipt({ uid: 'other' }),
    receipt({ version: 2 }),
    receipt({ status: 'deleted' }),
    receipt({ phase: 'mastered' }),
    receipt({ revision: -1 }),
    receipt({ checkPassed: 'yes' }),
    receipt({ failedChecks: 4 }),
    receipt({ maxFailedChecks: 4 }),
    receipt({ previousStrategy: 'lecture' }),
    receipt({ check: { checkId: 'check-1', strategy: 'lecture', optionCount: 3 } }),
    receipt({ check: { checkId: 'check-1', strategy: 'analogy', optionCount: 1 } }),
    receipt({ check: { checkId: '', strategy: 'analogy', optionCount: 2 } }),
    receipt({ answerIndex: 0 }),
    { ...receipt(), receipt: { id: 'receipt-1', passed: true } },
    { ...receipt(), receipt: { id: 7, checkId: 'check-1', passed: true } },
  ]) {
    await assert.rejects(broken([input]).start({}), error => error.status === 503 && /could not be confirmed/.test(error.message) && !/answerIndex|lecture/.test(error.message));
  }
});

test('assessment receipts keep the server verdict and only the bounded receipt fields', async () => {
  const value = { ...receipt({ phase: 'check_passed', revision: 2, checkPassed: true, failedChecks: 1 }), receipt: { id: sessionId(), checkId: 'check-1', passed: true } };
  const client = createLearningSessionClient({ getAccountId: () => 'owner', request: async () => value });
  const input = { commandId: value.receipt.id, checkId: value.receipt.checkId, workspaceId: value.workspaceId, sourceVersion: value.concept.sourceVersion, criteriaVersion: value.concept.criteriaVersion };
  const result = await client.assess(value.sessionId, input);
  assert.deepEqual(result.receipt, value.receipt);
  assert.equal(result.checkPassed, true);
  assert.equal(result.phase, 'check_passed');
  assert.deepEqual(result.concept, { sourceVersion: 'source-v1', criteriaVersion: 'criteria-v1' });
  const altered = createLearningSessionClient({ getAccountId: () => 'owner', request: async () => ({ ...value, receipt: { ...value.receipt, passed: 'yes' } }) });
  await assert.rejects(altered.assess(value.sessionId, input), error => error.status === 503);
});

test('listing builds a bounded query and validates every item and the cursor', async () => {
  const calls = [];
  const client = createLearningSessionClient({ getAccountId: () => 'owner', request: async (path, options) => { calls.push({ path, options }); return { version: 1, uid: 'owner', items: [receipt()], nextCursor: null }; } });
  const page = await client.list({ workspaceId: 'demo-adult:student', limit: 2 });
  assert.equal(calls[0].path, 'sessions?workspaceId=demo-adult%3Astudent&limit=2');
  assert.equal(page.items.length, 1); assert.equal(page.nextCursor, null);
  const cursor = sessionId();
  await client.list({ after: cursor });
  assert.equal(calls[1].path, `sessions?after=${cursor}`);
  await assert.rejects(createLearningSessionClient({ getAccountId: () => 'owner', request: async () => ({ version: 1, uid: 'owner', items: [receipt({ uid: 'other' })], nextCursor: null }) }).list(), error => error.status === 503);
  await assert.rejects(createLearningSessionClient({ getAccountId: () => 'owner', request: async () => ({ version: 1, uid: 'owner', items: [], nextCursor: 4 }) }).list(), error => error.status === 503);
});

test('a changed account and an invalid session reference are refused before trusting any response', async () => {
  let account = 'owner';
  const switched = createLearningSessionClient({ getAccountId: () => account, request: async (path, options) => { options.beforeSend(); account = null; return receipt(); } });
  await assert.rejects(switched.get(sessionId()), error => error.status === 409);
  let called = false;
  const guarded = createLearningSessionClient({ getAccountId: () => 'owner', request: async () => { called = true; return receipt(); } });
  await assert.rejects(guarded.get('other/../session'), error => error.status === 400);
  await assert.rejects(guarded.present('not-a-uuid', {}), error => error.status === 400);
  assert.equal(called, false);
  const signedOut = createLearningSessionClient({ getAccountId: () => null, request: async () => receipt() });
  await assert.rejects(signedOut.start({}), error => error.status === 409);
});


test('each routed response and assessment must match the exact requested session, workspace, command and check', async () => {
  const target = sessionId(), commandId = sessionId(), checkId = 'check-original';
  const input = { commandId, checkId, workspaceId: 'workspace-original', sourceVersion: 'source-v1', criteriaVersion: 'criteria-v1' };
  const valid = receipt({ sessionId: target, workspaceId: input.workspaceId, receipt: { id: commandId, checkId, passed: true } });
  const mutations = [
    x => ({ ...x, sessionId: sessionId() }),
    x => ({ ...x, workspaceId: 'another-workspace' }),
    x => ({ ...x, concept: { ...x.concept, sourceVersion: 'different-source' } }),
    x => ({ ...x, concept: { ...x.concept, criteriaVersion: 'different-criteria' } }),
    x => ({ ...x, receipt: { ...x.receipt, id: sessionId() } }),
    x => ({ ...x, receipt: { ...x.receipt, checkId: 'another-check' } }),
  ];
  for (const mutate of mutations) {
    const client = createLearningSessionClient({ getAccountId: () => 'owner', request: async () => mutate(valid) });
    await assert.rejects(client.assess(target, input), e => e.status === 503);
  }
  for (const method of ['get', 'present', 'cancel']) {
    const client = createLearningSessionClient({ getAccountId: () => 'owner', request: async () => receipt({ sessionId: sessionId() }) });
    await assert.rejects(client[method](target, input), e => e.status === 503);
  }
  for (const method of ['start', 'present', 'cancel']) {
    const client = createLearningSessionClient({ getAccountId: () => 'owner', request: async () => receipt({ sessionId: target, workspaceId: 'wrong' }) });
    await assert.rejects(method === 'start' ? client.start(input) : client[method](target, input), e => e.status === 503);
  }
});
