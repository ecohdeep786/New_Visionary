// AI-18 (KAN-156) — Indian-language speech/pedagogical-meaning qualification
// registry + reviewer-gated coverage.
//
// Core responsibilities (server-owned; fail closed):
//   1. registerCase: add a rights-cleared case (provenance, license, consent)
//      to the corpus; a held-out case that leaks into training is REJECTED
//      (leakage_detected), and missing license/consent is refused.
//   2. recordEvaluation: an AUTHOR records versioned evidence per case/per route
//      (errors, intelligibility, uncertainty, latency/cancellation, cost).
//   3. declareTargets: a reviewer preapproves qualification thresholds.
//   4. routeCoverage: the ONLY way a route becomes "covered". Dataset/model
//      language COUNTS never establish coverage — the contract refuses to
//      derive coverage from counts. Coverage requires held-out evidence AND a
//      QUALIFIED human reviewer's decision against the preapproved thresholds.
import type {
  CaseOutcome,
  CoverageVerdict,
  EvalCase,
  EvalRoute,
  QualifierOwner,
  QualificationThresholds,
  SpeechLanguageMatrix,
  SpeechQualError as SpeechQualErrorType,
} from './speechqualification-types';
import { SpeechQualError } from './speechqualification-types';
import type { SpeechQualStore } from './speechqualification-lookups';

export class SpeechQualificationService {
  constructor(private readonly store: SpeechQualStore) {}

  /** Declare training content so held-out leakage can be detected. */
  async setTrainingContent(refs: string[]): Promise<void> {
    await this.store.setTrainingContent(refs);
  }

  /** Register a rights-cleared case; held-out cases must pass the leakage check. */
  async registerCase(input: {
    matrix: SpeechLanguageMatrix;
    split: 'train' | 'heldout';
    sourceRef: string;
    license: string;
    consented: boolean;
    contentRef: string;
  }): Promise<EvalCase> {
    if (!input.consented) throw new SpeechQualError('missing_consent');
    if (!input.license || input.license.trim() === '') throw new SpeechQualError('missing_license');
    const c = await this.store.registerCase(input);
    if (input.split === 'heldout' && !c) throw new SpeechQualError('leakage_detected');
    if (!c) throw new SpeechQualError('unknown_case');
    return c;
  }

  /** Register a versioned route under evaluation (pinned ASR/TTS/model/prompt). */
  async registerRoute(route: Omit<EvalRoute, 'routeId'>): Promise<string> {
    return this.store.registerRoute(route);
  }

  /** An author records versioned per-case evaluation evidence. */
  async recordEvaluation(owner: QualifierOwner, outcome: Omit<CaseOutcome, 'evaluatedBy' | 'at'>): Promise<void> {
    if (owner.role !== 'author') throw new SpeechQualError('not_owner');
    if (!(await this.store.caseById(outcome.caseId))) throw new SpeechQualError('unknown_case');
    if (!(await this.store.routeById(outcome.routeId))) throw new SpeechQualError('unknown_route');
    await this.store.saveOutcome({ ...outcome, evaluatedBy: owner.uid, at: new Date().toISOString() });
  }

  /** A reviewer preapproves the qualification thresholds. */
  async declareTargets(owner: QualifierOwner, thresholds: QualificationThresholds): Promise<void> {
    if (owner.role !== 'reviewer') throw new SpeechQualError('unqualified_reviewer');
    await this.store.setThresholds(thresholds);
  }

  /**
   * The reviewer-gated coverage decision. Counts alone never establish
   * coverage; a route is covered only with held-out evidence AND a qualified
   * reviewer's acceptance against the preapproved thresholds.
   */
  async routeCoverage(owner: QualifierOwner, routeId: string): Promise<CoverageVerdict> {
    if (!(await this.store.routeById(routeId))) throw new SpeechQualError('unknown_route');
    if (owner.role !== 'reviewer') throw new SpeechQualError('unqualified_reviewer');

    const thresholds = await this.store.thresholds();
    if (!thresholds) throw new SpeechQualError('thresholds_not_defined');

    const outcomes = await this.store.outcomesFor(routeId);
    const heldoutCasesEvaluated = outcomes.filter((o) => !o.cancelled).length;

    // Counts/language coverage is NEVER sufficient by itself.
    if (heldoutCasesEvaluated < thresholds.heldoutMinimumCases) {
      return {
        routeId, covered: false, reviewerDecisionSet: false,
        evidence: { heldoutCasesEvaluated, semanticCriticalCount: 0, avgRecognitionError: 0, avgIntelligibility: 0, maxPerTaskCostUsd: 0 },
        reason: 'insufficient_heldout_evidence_counts_not_coverage',
      };
    }

    const semanticCritical = outcomes.filter((o) => o.semanticError === 'critical').length;
    const avgRecognition = outcomes.reduce((n, o) => n + o.recognitionErrorRate, 0) / outcomes.length;
    const avgIntelligibility = outcomes.reduce((n, o) => n + o.intelligibility, 0) / outcomes.length;
    const maxCost = Math.max(...outcomes.map((o) => o.perTaskCostUsd));
    const evidence = { heldoutCasesEvaluated, semanticCriticalCount: semanticCritical, avgRecognitionError: avgRecognition, avgIntelligibility, maxPerTaskCostUsd: maxCost };

    const numericallyMet = semanticCritical / outcomes.length <= thresholds.maxSemanticErrorRate &&
      avgRecognition <= thresholds.maxRecognitionErrorRate &&
      avgIntelligibility >= thresholds.minIntelligibility &&
      maxCost <= thresholds.maxPerTaskCostUsd;

    // Only a qualified human reviewer sets the final gate.
    const { set: decisionSet, accepted: reviewerAccepted } = await this.store.reviewDecision(routeId);
    let reason: string;
    if (!decisionSet) reason = 'reviewer_decision_pending';
    else if (reviewerAccepted && numericallyMet) reason = 'reviewer_accepted';
    else if (reviewerAccepted) reason = 'reviewer_accepted_numeric_gap';
    else reason = 'reviewer_rejected';
    return {
      routeId,
      covered: numericallyMet && decisionSet && reviewerAccepted,
      reviewerDecisionSet: decisionSet,
      evidence,
      reason,
    };
  }

  /** A qualified reviewer accepts (or rejects) a route against the thresholds. */
  async setReviewDecision(owner: QualifierOwner, routeId: string, accepted: boolean): Promise<void> {
    if (owner.role !== 'reviewer') throw new SpeechQualError('unqualified_reviewer');
    await this.store.setReviewDecision(routeId, accepted);
  }
}

export type { SpeechQualErrorType };
