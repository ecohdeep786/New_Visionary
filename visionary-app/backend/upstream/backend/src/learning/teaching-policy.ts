/** Product-owned VATS policy kernel. No HTTP DTO, datastore or model authority.
 * Call only inside an authorized command transaction using immutable server-
 * assessed receipts. Commit the projection/receipt/outbox atomically; a model,
 * browser flag, conversation, elapsed time or Build completion is not evidence.
 * Persistence, calibrated parameters and live adapter wiring remain release gates.
 */
export interface LearningScope { uid: string; workspaceId: string; conceptId: string; sourceVersion: string; criteriaVersion: string }
export interface KnowledgeParameters { version: string; guess: number; slip: number; transit: number }
export interface AssessedReceipt extends LearningScope {
  id: string; digest: string; sequence: number; correct: boolean; origin: 'server_assessment'; assessedAt: number;
}
export interface KnowledgeProjection extends LearningScope {
  modelVersion: string; pKnown: number; revision: number; lastSequence: number;
  lastReceiptId: string | null; lastReceiptDigest: string | null; assessedCount: number;
}
export class TeachingPolicyError extends Error {
  constructor(public readonly code: 'invalid' | 'scope_mismatch' | 'conflict' | 'rebuild_required', message: string) { super(message); }
}
const invalid = (message: string): never => { throw new TeachingPolicyError('invalid', message); };
const fields: (keyof LearningScope)[] = ['uid', 'workspaceId', 'conceptId', 'sourceVersion', 'criteriaVersion'];
function text(value: unknown): asserts value is string { if (typeof value !== 'string' || !value.length || value.length > 256) invalid('Invalid opaque reference.'); }
function integer(value: unknown, min = 0): asserts value is number { if (!Number.isSafeInteger(value) || Number(value) < min) invalid('Invalid sequence or timestamp.'); }
function probability(value: number) { if (!Number.isFinite(value) || value < 0 || value > 1) invalid('Invalid probability.'); }
export function sameLearningScope(expected: LearningScope, actual: LearningScope) {
  for (const key of fields) { text(expected?.[key]); text(actual?.[key]); if (expected[key] !== actual[key]) throw new TeachingPolicyError('scope_mismatch', 'Learning evidence scope changed.'); }
}
export function updateKnowledge(state: KnowledgeProjection, receipt: AssessedReceipt, parameters: KnowledgeParameters): { projection: KnowledgeProjection; replay: boolean } {
  sameLearningScope(state, receipt); text(parameters?.version); text(state.modelVersion);
  if (parameters.version !== state.modelVersion) throw new TeachingPolicyError('rebuild_required', 'Replay evidence before changing the knowledge model.');
  for (const value of [state.pKnown, parameters.guess, parameters.slip, parameters.transit]) probability(value);
  for (const value of [state.revision, state.lastSequence, state.assessedCount]) integer(value);
  integer(receipt.sequence, 1); integer(receipt.assessedAt); text(receipt.id); text(receipt.digest);
  if (receipt.origin !== 'server_assessment' || typeof receipt.correct !== 'boolean') invalid('Only an immutable server-assessed receipt can update knowledge.');
  if (receipt.sequence === state.lastSequence) {
    if (receipt.id === state.lastReceiptId && receipt.digest === state.lastReceiptDigest) return { projection: { ...state }, replay: true };
    throw new TeachingPolicyError('conflict', 'Evidence sequence has another receipt.');
  }
  if (receipt.id === state.lastReceiptId) throw new TeachingPolicyError('conflict', 'An immutable receipt cannot acquire a new sequence.');
  if (receipt.sequence !== state.lastSequence + 1) throw new TeachingPolicyError('rebuild_required', 'Ordered evidence replay is required.');
  if (state.revision === Number.MAX_SAFE_INTEGER || state.assessedCount === Number.MAX_SAFE_INTEGER) invalid('Projection requires a new bounded version.');
  const knownLikelihood = receipt.correct ? 1 - parameters.slip : parameters.slip;
  const unknownLikelihood = receipt.correct ? parameters.guess : 1 - parameters.guess;
  const denominator = state.pKnown * knownLikelihood + (1 - state.pKnown) * unknownLikelihood;
  if (!(denominator > 0)) invalid('Observation is impossible under the selected parameters.');
  const posterior = state.pKnown * knownLikelihood / denominator;
  const pKnown = Math.min(1, Math.max(0, posterior + (1 - posterior) * parameters.transit));
  return { replay: false, projection: { ...state, pKnown, revision: state.revision + 1, lastSequence: receipt.sequence, lastReceiptId: receipt.id, lastReceiptDigest: receipt.digest, assessedCount: state.assessedCount + 1 } };
}

export type Pedagogy = 'socratic' | 'worked_example' | 'analogy' | 'visual' | 'practice';
const strategies: Pedagogy[] = ['socratic', 'worked_example', 'analogy', 'visual', 'practice'];
export interface TeachingLoop extends LearningScope {
  sessionId: string; revision: number; phase: 'explain' | 'check' | 'check_passed' | 'review_suggested';
  failedChecks: number; maxFailedChecks: number; previousStrategy: Pedagogy | null;
  checkId: string | null; lastReceiptId: string | null; lastReceiptDigest: string | null;
}
export function startTeachingLoop(scope: LearningScope, sessionId: string, maxFailedChecks = 3): TeachingLoop {
  sameLearningScope(scope, scope); text(sessionId); integer(maxFailedChecks, 1);
  if (maxFailedChecks > 3) invalid('Teaching must stop or offer review within three failed checks.');
  return { ...scope, sessionId, revision: 0, phase: 'explain', failedChecks: 0, maxFailedChecks, previousStrategy: null, checkId: null, lastReceiptId: null, lastReceiptDigest: null };
}
function loopState(state: TeachingLoop) {
  sameLearningScope(state, state); text(state.sessionId); integer(state.revision); integer(state.failedChecks); integer(state.maxFailedChecks, 1);
  if (state.revision === Number.MAX_SAFE_INTEGER || state.maxFailedChecks > 3 || state.failedChecks > state.maxFailedChecks) invalid('Invalid bounded teaching state.');
}
export function presentTeachingCheck(state: TeachingLoop, candidate: LearningScope & { sessionId: string; strategy: Pedagogy; checkId: string; validation: 'passed' }): TeachingLoop {
  loopState(state); sameLearningScope(state, candidate);
  if (state.phase !== 'explain' || candidate.sessionId !== state.sessionId || candidate.validation !== 'passed') throw new TeachingPolicyError('conflict', 'A validated explanation and current session are required.');
  text(candidate.checkId);
  if (!strategies.includes(candidate.strategy)) invalid('Unsupported pedagogy.');
  if (state.failedChecks > 0 && candidate.strategy === state.previousStrategy) throw new TeachingPolicyError('conflict', 'Use a different teaching strategy after a failed check.');
  return { ...state, phase: 'check', revision: state.revision + 1, previousStrategy: candidate.strategy, checkId: candidate.checkId };
}
export function recordTeachingCheck(state: TeachingLoop, receipt: LearningScope & { sessionId: string; checkId: string; id: string; digest: string; origin: 'server_assessment'; passed: boolean }): { loop: TeachingLoop; replay: boolean } {
  loopState(state); sameLearningScope(state, receipt); text(receipt.id); text(receipt.digest); text(receipt.checkId);
  if (receipt.sessionId !== state.sessionId || receipt.origin !== 'server_assessment' || typeof receipt.passed !== 'boolean') invalid('An assessment from the current session is required.');
  if (receipt.id === state.lastReceiptId) {
    if (receipt.digest !== state.lastReceiptDigest || receipt.checkId !== state.checkId) throw new TeachingPolicyError('conflict', 'The assessment receipt changed.');
    return { loop: { ...state }, replay: true };
  }
  if (state.phase !== 'check' || receipt.checkId !== state.checkId) throw new TeachingPolicyError('conflict', 'This check is no longer awaiting an assessment.');
  const failedChecks = state.failedChecks + (receipt.passed ? 0 : 1);
  const phase = receipt.passed ? 'check_passed' : failedChecks >= state.maxFailedChecks ? 'review_suggested' : 'explain';
  return { replay: false, loop: { ...state, phase, failedChecks, revision: state.revision + 1, lastReceiptId: receipt.id, lastReceiptDigest: receipt.digest } };
}
