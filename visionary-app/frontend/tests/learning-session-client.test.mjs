import test from 'node:test';
import assert from 'node:assert/strict';
import { createLearningSessionClient } from '../src/services/learningSessionClient.js';

const sessionId = () => crypto.randomUUID();
const receipt = (overrides = {}) => ({ version: 1, uid: 'owner', sessionId: sessionId(), workspaceId: 'demo-adult:student', status: 'active', phase: 'explain', revision: 0, failedChecks: 0, maxFailedChecks: 3, previousStrategy: null, checkPassed: false, reviewSuggested: false, check: null, createdAt: '2026-10-18T00:00:00.000Z', updatedAt: '2026-10-18T00:00:00.000Z', ...overrides });

test('the connected client sends owner-scoped commands on the durable learning routes', async () => {
  const calls = [];
  const client = createLearningSessionClient({ getAccountId: () => 'owner', request: async (path, options) => { calls.push({ path, options }); return receipt(); } });
  await client.start({ version: 1, commandId: crypto.randomUUID() });
  assert.equal(calls[0].path, 'sessions');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.accountId, 'owner');
  assert.equal(typeof calls[0].options.beforeSend, 'function');
  const id = sessionId();
  await client.get(id); await client.present(id, {}); await client.assess(id, {}); await client.cancel(id, {});
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
  const result = await client.assess(sessionId(), {});
  assert.deepEqual(result.receipt, value.receipt);
  assert.equal(result.checkPassed, true);
  assert.equal(result.phase, 'check_passed');
  assert.equal(Object.keys(result).includes('concept'), false);
  const altered = createLearningSessionClient({ getAccountId: () => 'owner', request: async () => ({ ...value, receipt: { ...value.receipt, passed: 'yes' } }) });
  await assert.rejects(altered.assess(sessionId(), {}), error => error.status === 503);
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
