/** L3 ML proposals are untrusted suggestions. This pure boundary checks their
 * binding to a server-created request before any candidate generation or state
 * change. It is not authentication, model/source validation or persistence.
 * A caller must also validate the pinned graph/target and current policy inside
 * its authorized command transaction. This module is not registered at runtime.
 */
import { sameLearningScope, LearningScope, Pedagogy, TeachingPolicyError, TeachingLoop } from './teaching-policy';
export interface ProposalScope extends LearningScope {
  sessionId: string; graphVersion: string; policyVersion: string;
  learnerRevision: number; loopRevision: number;
}
export interface ProposalRequest {
  requestId: string; scope: ProposalScope; eligibleConceptIds: readonly string[];
  allowedStrategies: readonly Pedagogy[]; hintsOnly: boolean;
  approvedVisualAvailable: boolean; phase: TeachingLoop['phase']; failedChecks: number;
  maxFailedChecks: number; previousStrategy: Pedagogy | null;
}
const strategies = ['socratic', 'worked_example', 'analogy', 'visual', 'practice'];
const reasons: Record<string, string[]> = {
  teach: ['prerequisite_gap', 'state_based_strategy'], assess_prior: ['insufficient_evidence'],
  await_response: ['check_pending'], check_complete: ['assessed_check_passed'], review: ['failure_bound', 'no_alternative'],
};
function reject(): never { throw new TeachingPolicyError('conflict', 'The teaching proposal no longer matches its authorized request.'); }
function object(value: unknown, keys: string[]): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join('|') !== [...keys].sort().join('|')) reject();
}
export function validatePedagogyProposal(request: ProposalRequest, candidate: unknown) {
  object(candidate, ['contractVersion', 'requestId', 'scope', 'action', 'reason', 'targetConceptId', 'strategy', 'requiresAssessment', 'answerPolicy']);
  if (candidate.contractVersion !== 'vats-pedagogy.v1' || !request.requestId || candidate.requestId !== request.requestId) reject();
  const scopeKeys = ['uid', 'workspaceId', 'conceptId', 'sourceVersion', 'criteriaVersion', 'sessionId', 'graphVersion', 'policyVersion', 'learnerRevision', 'loopRevision'];
  object(candidate.scope, scopeKeys);
  sameLearningScope(request.scope, candidate.scope as unknown as LearningScope);
  for (const key of scopeKeys) {
    const expected = request.scope[key as keyof ProposalScope];
    if (candidate.scope[key] !== expected) reject();
    if (key.endsWith('Revision') ? !Number.isSafeInteger(expected) || Number(expected) < 0 : typeof expected !== 'string' || !expected.trim() || expected.length > 256) reject();
  }
  if (request.scope.policyVersion !== 'doc03-reference-v1') reject();
  if (typeof candidate.action !== 'string' || !Object.prototype.hasOwnProperty.call(reasons, candidate.action) || typeof candidate.reason !== 'string' || !reasons[candidate.action].includes(candidate.reason)) reject();
  if (!Number.isSafeInteger(request.failedChecks) || !Number.isSafeInteger(request.maxFailedChecks) || request.failedChecks < 0 || request.maxFailedChecks < 1 || request.maxFailedChecks > 3 || request.failedChecks > request.maxFailedChecks) reject();
  const forced = request.phase === 'check' ? 'await_response' : request.phase === 'check_passed' ? 'check_complete' : request.phase === 'review_suggested' || request.failedChecks >= request.maxFailedChecks ? 'review' : null;
  if (forced ? candidate.action !== forced : request.phase !== 'explain' || !['teach', 'assess_prior', 'review'].includes(candidate.action)) reject();
  if (candidate.action === 'review') {
    if (candidate.reason !== (forced === 'review' ? 'failure_bound' : 'no_alternative')) reject();
    if (forced !== 'review' && request.allowedStrategies.some(s => (s !== 'visual' || request.approvedVisualAvailable) && (!request.failedChecks || s !== request.previousStrategy))) reject();
  }
  if (typeof candidate.targetConceptId !== 'string' || !request.eligibleConceptIds.includes(candidate.targetConceptId)) reject();
  if (candidate.action === 'teach') {
    if (typeof candidate.strategy !== 'string' || !strategies.includes(candidate.strategy) || !request.allowedStrategies.includes(candidate.strategy as Pedagogy)) reject();
    if (candidate.strategy === 'visual' && (!request.approvedVisualAvailable || candidate.targetConceptId !== request.scope.conceptId) || request.failedChecks > 0 && candidate.strategy === request.previousStrategy) reject();
  } else if (candidate.strategy !== null) reject();
  if (candidate.requiresAssessment !== ['teach', 'assess_prior'].includes(candidate.action)) reject();
  if (candidate.answerPolicy !== (request.hintsOnly ? 'hints_only' : 'teaching_example')) reject();
  // Fresh primitive fields only; no arbitrary model properties or nested object escapes.
  return { action: candidate.action, reason: candidate.reason, targetConceptId: candidate.targetConceptId, strategy: candidate.strategy as Pedagogy | null, requiresAssessment: candidate.requiresAssessment as boolean, answerPolicy: candidate.answerPolicy as string };
}
