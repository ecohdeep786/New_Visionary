import { createAuthTransport } from '../api/firebase/authTransport.js';

// Connected client for the owner-scoped knowledge projection service
// (KAN-145 / LEARN-09, integration/KNOWLEDGE_PROJECTION_CONTRACT.md). The
// server owns the policy kernel: the browser only references one immutable
// server-assessed receipt and never sends or receives a verdict field. Every
// response is re-checked here — anything that could expose another account's
// estimate, an invented verdict or an impossible state is refused.
const id = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const confirmation = () => Object.assign(new Error('The knowledge estimate could not be confirmed. Your learning evidence is kept; retry when connected.'), { status: 503 });
const unitInterval = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
const safeCount = value => Number.isSafeInteger(value) && value >= 0;
const reference = value => typeof value === 'string' && value.length > 0 && value.length <= 128;

// One knowledge receipt: the server's estimate for one exact scope. pKnown is
// an estimate with inspectable evidence — never a passed check, mastery label
// or taught flag, and the response carries no authored prompt or answer key.
function knowledgeReceipt(value, uid, scope) {
  if (!value || value.version !== 1 || value.uid !== uid || typeof value.replay !== 'boolean' ||
    value.workspaceId !== scope.workspaceId || value.sourceVersion !== scope.sourceVersion ||
    value.criteriaVersion !== scope.criteriaVersion || value.conceptId !== scope.conceptId ||
    !reference(value.modelVersion) || !unitInterval(value.pKnown) ||
    ![value.revision, value.lastSequence, value.assessedCount].every(safeCount) ||
    value.lastReceiptId !== null && !reference(value.lastReceiptId) ||
    value.lastReceiptDigest !== null && typeof value.lastReceiptDigest !== 'string') throw confirmation();
  // The estimate response never carries a verdict or a mastery field: an
  // injected `passed`/`correct`/`digest`/`taught` would be evidence the server
  // did not assess, so the whole response is refused rather than normalized.
  for (const forbidden of ['passed', 'correct', 'digest', 'assessedAt', 'taught', 'mastered', 'mastery']) {
    if (Object.prototype.hasOwnProperty.call(value, forbidden)) throw confirmation();
  }
  return { version: 1, uid, replay: value.replay, workspaceId: value.workspaceId, conceptId: value.conceptId,
    sourceVersion: value.sourceVersion, criteriaVersion: value.criteriaVersion, modelVersion: value.modelVersion,
    pKnown: value.pKnown, revision: value.revision, lastSequence: value.lastSequence,
    lastReceiptId: value.lastReceiptId, lastReceiptDigest: value.lastReceiptDigest, assessedCount: value.assessedCount };
}

// The server-selected calibrated model. Parameters are internal reference
// values, not an assessment of the learner — no pKnown or mastery label exists
// on this response by contract. `requires` names the scope the model was
// selected for (the live runtime returns {sourceVersion, criteriaVersion}).
function selectedModel(value, uid) {
  if (!value || value.version !== 1 || value.uid !== uid || !value.model ||
    !reference(value.model.version) || ![value.model.guess, value.model.slip, value.model.transit, value.model.initial].every(unitInterval) ||
    !reference(value.model.license) || !value.model.requires) throw confirmation();
  return { version: value.model.version, guess: value.model.guess, slip: value.model.slip,
    transit: value.model.transit, license: value.model.license, initial: value.model.initial, requires: value.model.requires };
}

export function createKnowledgeProjectionClient({ getAccountId, request = createAuthTransport({ basePath: '/api/account/learning/knowledge/' }) } = {}) {
  const guard = () => {
    const uid = getAccountId();
    const check = () => { if (!uid || getAccountId() !== uid) throw Object.assign(new Error('The signed-in account changed.'), { status: 409 }); };
    check();
    return { uid, check };
  };
  const scopeOf = ({ workspaceId, conceptId, sourceVersion, criteriaVersion }) => {
    const scope = { workspaceId, conceptId, sourceVersion, criteriaVersion };
    if (!Object.values(scope).every(reference)) throw Object.assign(new Error('Specify the workspace, concept, source version and criteria version.'), { status: 400 });
    return scope;
  };
  return {
    // The server-selected model for one source/criteria scope. 404 cannot
    // happen for the reference fallback, so any failure stays a failure.
    async models({ sourceVersion, criteriaVersion }) {
      if (!reference(sourceVersion) || !reference(criteriaVersion)) throw Object.assign(new Error('Specify the source version and criteria version.'), { status: 400 });
      const { uid, check } = guard();
      const query = new URLSearchParams({ sourceVersion, criteriaVersion });
      const value = await request(`models?${query}`, { accountId: uid, beforeSend: check });
      check();
      return { version: 1, uid, model: selectedModel(value, uid) };
    },
    // The owner's estimate for one exact scope, or null when nothing is
    // projected yet (the contract's honest empty state — nothing is invented).
    async projection(scopeInput) {
      const scope = scopeOf(scopeInput);
      const { uid, check } = guard();
      const query = new URLSearchParams(scope);
      let value;
      try { value = await request(`projections?${query}`, { accountId: uid, beforeSend: check }); }
      catch (error) { if (error?.status === 404) return null; throw error; }
      check();
      return knowledgeReceipt(value, uid, scope);
    },
    // Project one immutable server-assessed receipt into the estimate. An
    // identical command replays; the same command with different references
    // conflicts (409). The caller keeps the learning flow authoritative —
    // projection failures never invalidate the saved learning evidence.
    async project({ commandId, sessionId, receiptId, workspaceId, conceptId, sourceVersion, criteriaVersion }) {
      const scope = scopeOf({ workspaceId, conceptId, sourceVersion, criteriaVersion });
      if (!id.test(commandId) || !id.test(sessionId) || !id.test(receiptId)) throw Object.assign(new Error('This knowledge command reference is not valid.'), { status: 400 });
      const { uid, check } = guard();
      const value = await request('project', { method: 'POST', accountId: uid, beforeSend: check,
        body: { version: 1, commandId, sessionId, receiptId } });
      check();
      return knowledgeReceipt(value, uid, scope);
    },
  };
}
