// LEARN-08 (KAN-74) — the evaluation domain's typed state seams. The owning
// store (protected answer keys, versioned criteria, assessed outcomes)
// implements these at integration; the in-memory implementation is contract-true
// and fails closed: an unknown check/criteria/revision proves nothing.
import type { AnswerKey, EvaluationCriteria, EvaluationOwner, EvaluationResult } from './evaluation-types';

export interface EvaluationStore {
  /** The protected key for the check revision, or undefined. */
  answerKey(check: { conceptId: string; sourceVersion: string; checkId: string }): Promise<AnswerKey | undefined>;
  /** The criteria version applicable to this check revision, or undefined. */
  criteriaFor(check: { conceptId: string; sourceVersion: string; checkId: string }): Promise<EvaluationCriteria | undefined>;
  /** Record the immutable assessed outcome (rubric ref = criteria version). */
  recordOutcome(owner: EvaluationOwner, result: EvaluationResult, answer: unknown): Promise<void>;
  outcomesFor(owner: EvaluationOwner, checkId: string): Promise<(EvaluationResult & { answer: unknown })[]>;
}

/** Contract-true in-memory store; the key never leaves the store. */
export class InMemoryEvaluationStore implements EvaluationStore {
  private keys = new Map<string, AnswerKey>();
  private criteria = new Map<string, EvaluationCriteria>();
  private outcomes: (EvaluationResult & { answer: unknown; owner: EvaluationOwner })[] = [];

  setAnswerKey(conceptId: string, key: AnswerKey): void {
    this.keys.set(`${conceptId}@${key.sourceVersion}|${key.checkId}`, { ...key });
  }

  setCriteria(conceptId: string, sourceVersion: string, checkId: string, criteria: EvaluationCriteria): void {
    this.criteria.set(`${conceptId}@${sourceVersion}|${checkId}`, { ...criteria });
  }

  async answerKey(check: { conceptId: string; sourceVersion: string; checkId: string }): Promise<AnswerKey | undefined> {
    const found = this.keys.get(`${check.conceptId}@${check.sourceVersion}|${check.checkId}`);
    return found ? { ...found } : undefined;
  }

  async criteriaFor(check: { conceptId: string; sourceVersion: string; checkId: string }): Promise<EvaluationCriteria | undefined> {
    const found = this.criteria.get(`${check.conceptId}@${check.sourceVersion}|${check.checkId}`);
    return found ? { ...found } : undefined;
  }

  async recordOutcome(owner: EvaluationOwner, result: EvaluationResult, answer: unknown): Promise<void> {
    this.outcomes = [...this.outcomes, { ...result, answer, owner: { ...owner } }];
  }

  async outcomesFor(owner: EvaluationOwner, checkId: string): Promise<(EvaluationResult & { answer: unknown })[]> {
    return this.outcomes
      .filter((o) => o.owner.uid === owner.uid && o.checkId === checkId)
      .map((o) => ({ ...o, owner: undefined })) as (EvaluationResult & { answer: unknown })[];
  }
}
