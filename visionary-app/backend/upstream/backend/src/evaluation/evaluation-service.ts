// LEARN-08 (KAN-74) — server-owned evaluation with versioned criteria and
// protected answer keys.
//
// Core responsibilities (server-owned; client flags never authoritative):
//   1. evaluate: run server-side against the PROTECTED key for the pinned check
//      revision and the VERSIONED criteria. Reproducible: the same answer
//      against the same (key, criteria) versions yields the identical verdict.
//   2. Client claims (pass/score/completion) are stored as CLAIMS only — a
//      claim that disagrees with the server verdict is OVERRULED and never
//      flips the outcome.
//   3. Every evaluation appends an immutable assessed outcome whose rubric
//      reference IS the criteria version — exactly the evidence LEARN-03 needs.
//   4. The answer key never leaves the store: evaluation results expose only
//      awarded/points/passed — never the key or the correct answer.
//   5. Wrong users denied; unknown check/criteria refused; fail closed.
import { createHash } from 'node:crypto';
import type {
  CheckRef,
  ClientClaim,
  EvaluationOwner,
  EvaluationResult,
} from './evaluation-types';
import { EvaluationError } from './evaluation-types';
import type { EvaluationStore } from './evaluation-lookups';

export class EvaluationService {
  constructor(
    private readonly store: EvaluationStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * Authoritatively evaluate one submission. The verdict comes ONLY from the
   * server key + versioned criteria; the client claim never decides.
   */
  async evaluate(input: {
    owner: EvaluationOwner;
    submissionId: string;
    check: CheckRef;
    answer: unknown;
    claim?: ClientClaim;
  }): Promise<EvaluationResult> {
    const key = await this.store.answerKey(input.check);
    if (!key) throw new EvaluationError('unknown_check');
    const criteria = await this.store.criteriaFor(input.check);
    if (!criteria) throw new EvaluationError('unknown_criteria');

    // Server-side scoring against the protected key (exact match scoring).
    const correct = this.isCorrect(input.answer, key.key);
    const awarded = correct ? criteria.points : 0;
    const passed = awarded / criteria.points >= criteria.passThreshold;

    // The client claim is recorded, never authoritative: a disagreeing claim
    // is overruled by the server verdict.
    const claimOverruled = input.claim !== undefined && input.claim.claimedPass !== passed;

    const result: EvaluationResult = {
      submissionId: input.submissionId,
      checkId: input.check.checkId,
      criteriaVersion: criteria.criteriaVersion,
      awarded,
      points: criteria.points,
      passed,
      claimOverruled,
      evaluatedAt: this.now().toISOString(),
    };
    await this.store.recordOutcome(input.owner, result, input.answer);
    return result;
  }

  /**
   * Reproducibility fingerprint: identical (answer, key, criteria) produce the
   * same verdict digest — Doc 20's reproducible scoring.
   */
  static verdictDigest(result: Pick<EvaluationResult, 'criteriaVersion' | 'awarded' | 'points' | 'passed'>): string {
    const canonical = `${result.criteriaVersion}|${result.awarded}|${result.points}|${result.passed}`;
    return createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 16);
  }

  private isCorrect(answer: unknown, key: unknown): boolean {
    return JSON.stringify(answer ?? null) === JSON.stringify(key ?? null);
  }
}
