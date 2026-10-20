import { createAuthTransport } from '../api/firebase/authTransport.js';

// Connected client for the owner-scoped durable teaching loop. The server owns
// the authored answer key, so every receipt is re-checked here and any response
// that could expose a key, another account or impossible state is refused.
const id = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const strategies = ['socratic', 'worked_example', 'analogy', 'visual', 'practice'];
const phases = ['explain', 'check', 'check_passed', 'review_suggested'];
const confirmation = () => Object.assign(new Error('Learning progress could not be confirmed. Your saved work is kept; retry when connected.'), { status: 503 });

function learningReceipt(value, uid) {
  if (!value || value.version !== 1 || value.uid !== uid || typeof value.sessionId !== 'string' || !id.test(value.sessionId) ||
    typeof value.workspaceId !== 'string' || !value.workspaceId || !['active', 'cancelled'].includes(value.status) ||
    !phases.includes(value.phase) || !Number.isSafeInteger(value.revision) || value.revision < 0 ||
    !Number.isSafeInteger(value.failedChecks) || !Number.isSafeInteger(value.maxFailedChecks) ||
    value.maxFailedChecks < 1 || value.maxFailedChecks > 3 || value.failedChecks > value.maxFailedChecks ||
    value.previousStrategy !== null && !strategies.includes(value.previousStrategy) ||
    typeof value.checkPassed !== 'boolean' || typeof value.reviewSuggested !== 'boolean' ||
    value.check !== null && (!value.check || typeof value.check.checkId !== 'string' || !value.check.checkId ||
      !strategies.includes(value.check.strategy) || !Number.isSafeInteger(value.check.optionCount) ||
      value.check.optionCount < 2 || value.check.optionCount > 8) ||
    JSON.stringify(value).includes('answerIndex')) throw confirmation();
  const receipt = value.receipt === undefined ? null : value.receipt && typeof value.receipt === 'object' &&
    typeof value.receipt.id === 'string' && typeof value.receipt.checkId === 'string' && typeof value.receipt.passed === 'boolean'
    ? { id: value.receipt.id, checkId: value.receipt.checkId, passed: value.receipt.passed } : undefined;
  if (receipt === undefined) throw confirmation();
  return { version: 1, uid, sessionId: value.sessionId, workspaceId: value.workspaceId, status: value.status, phase: value.phase,
    revision: value.revision, failedChecks: value.failedChecks, maxFailedChecks: value.maxFailedChecks,
    previousStrategy: value.previousStrategy || null, checkPassed: value.checkPassed, reviewSuggested: value.reviewSuggested,
    check: value.check ? { checkId: value.check.checkId, strategy: value.check.strategy, optionCount: value.check.optionCount } : null,
    createdAt: value.createdAt, updatedAt: value.updatedAt,
    ...(typeof value.cancelledAt === 'string' ? { cancelledAt: value.cancelledAt } : {}),
    ...(receipt ? { receipt } : {}) };
}

export function createLearningSessionClient({ getAccountId, request = createAuthTransport({ basePath: '/api/account/learning' }) }) {
  const guard = () => {
    const uid = getAccountId();
    const check = () => { if (!uid || getAccountId() !== uid) throw Object.assign(new Error('The signed-in account changed.'), { status: 409 }); };
    check();
    return { uid, check };
  };
  const sessionPath = sessionId => {
    if (typeof sessionId !== 'string' || !id.test(sessionId)) throw Object.assign(new Error('This learning session reference is not valid.'), { status: 400 });
    return `sessions/${sessionId}`;
  };
  const command = async (path, options = {}, expected = {}) => {
    const { uid, check } = guard();
    const value = await request(path, { ...options, accountId: uid, beforeSend: check });
    check();
    const receipt = learningReceipt(value, uid);
    if (expected.sessionId !== undefined && receipt.sessionId !== expected.sessionId ||
      expected.workspaceId !== undefined && receipt.workspaceId !== expected.workspaceId ||
      expected.assessment && (!receipt.receipt || receipt.receipt.id !== expected.assessment.commandId ||
        receipt.receipt.checkId !== expected.assessment.checkId)) throw confirmation();
    return receipt;
  };
  return {
    start(input) { return command('sessions', { method: 'POST', body: input }, { workspaceId: input.workspaceId }); },
    async get(sessionId) { return command(sessionPath(sessionId), {}, { sessionId }); },
    async present(sessionId, input) { return command(`${sessionPath(sessionId)}/checks`, { method: 'POST', body: input }, { sessionId, workspaceId: input.workspaceId }); },
    async assess(sessionId, input) { return command(`${sessionPath(sessionId)}/assessments`, { method: 'POST', body: input }, { sessionId, workspaceId: input.workspaceId, assessment: { commandId: input.commandId, checkId: input.checkId } }); },
    async cancel(sessionId, input) { return command(`${sessionPath(sessionId)}/cancel`, { method: 'POST', body: input }, { sessionId, workspaceId: input.workspaceId }); },
    async list({ workspaceId, after, limit } = {}) {
      const { uid, check } = guard();
      const query = new URLSearchParams();
      if (workspaceId) query.set('workspaceId', String(workspaceId));
      if (after) query.set('after', String(after));
      if (limit) query.set('limit', String(limit));
      const search = query.toString();
      const value = await request(`sessions${search ? `?${search}` : ''}`, { accountId: uid, beforeSend: check });
      check();
      if (!value || value.version !== 1 || value.uid !== uid || !Array.isArray(value.items) || value.nextCursor !== null && typeof value.nextCursor !== 'string')
        throw confirmation();
      return { version: 1, uid, items: value.items.map(item => { const receipt = learningReceipt(item, uid); if (workspaceId !== undefined && receipt.workspaceId !== workspaceId) throw confirmation(); return receipt; }), nextCursor: value.nextCursor };
    },
  };
}
