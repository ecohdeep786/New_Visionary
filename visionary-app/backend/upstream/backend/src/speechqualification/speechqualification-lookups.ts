// AI-18 (KAN-156) — the speech-qualification store's typed seams: the held-out
// corpus registry (with split/leakage checks), the versioned evaluation
// evidence ledger, and the reviewer gate. A leakage check is contract-true:
// a held-out case whose source or content overlaps the training set is refused.
import { createHash } from 'node:crypto';
import type {
  SpeechLanguageMatrix,
  EvalCase,
  EvalRoute,
  CaseOutcome,
  CoverageVerdict,
  QualificationThresholds,
  QualifierOwner,
} from './speechqualification-types';

export interface SpeechQualStore {
  setTrainingContent(refs: string[]): Promise<void>;
  registerCase(input: Omit<EvalCase, 'caseId' | 'contentDigest'> & { contentRef: string }): Promise<EvalCase | undefined>;
  caseById(caseId: string): Promise<EvalCase | undefined>;
  /** True when a held-out case shares a training source/content (must be rejected). */
  trainingOverlap(sourceRef: string, contentRef: string): Promise<boolean>;
  registerRoute(route: Omit<EvalRoute, 'routeId'>): Promise<string>;
  routeById(routeId: string): Promise<EvalRoute | undefined>;
  saveOutcome(outcome: CaseOutcome): Promise<void>;
  outcomesFor(routeId: string): Promise<CaseOutcome[]>;
  setThresholds(thresholds: QualificationThresholds): Promise<void>;
  thresholds(): Promise<QualificationThresholds | undefined>;
  /** Always records a decision (accept OR reject) — a decision exists once set. */
  setReviewDecision(routeId: string, accepted: boolean): Promise<void>;
  reviewDecision(routeId: string): Promise<{ set: boolean; accepted: boolean }>;
}

function digest(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

export class InMemorySpeechQualStore implements SpeechQualStore {
  private cases = new Map<string, EvalCase>();
  private caseCounter = 0;
  private trainContent = new Set<string>();
  private routes = new Map<string, EvalRoute>();
  private routeCounter = 0;
  private outcomes: CaseOutcome[] = [];
  private thresholdsConfig: QualificationThresholds | undefined;
  private reviewDecisions = new Map<string, boolean>(); // routeId -> accepted

  /** Declare training content refs so leakage can be detected. */
  async setTrainingContent(refs: string[]): Promise<void> {
    for (const r of refs) this.trainContent.add(r);
  }

  async registerCase(input: Omit<EvalCase, 'caseId' | 'contentDigest'> & { contentRef: string }): Promise<EvalCase | undefined> {
    if (input.split === 'heldout' && await this.trainingOverlap(input.sourceRef, input.contentRef)) return undefined;
    const c: EvalCase = {
      caseId: `ec_${++this.caseCounter}`,
      matrix: { ...input.matrix },
      split: input.split,
      sourceRef: input.sourceRef,
      license: input.license,
      consented: input.consented,
      contentDigest: digest(input.contentRef),
    };
    this.cases.set(c.caseId, c);
    return c;
  }

  async caseById(caseId: string): Promise<EvalCase | undefined> {
    const c = this.cases.get(caseId);
    return c ? { ...c, matrix: { ...c.matrix } } : undefined;
  }

  async trainingOverlap(sourceRef: string, contentRef: string): Promise<boolean> {
    return this.trainContent.has(sourceRef) || this.trainContent.has(digest(contentRef));
  }

  async registerRoute(route: Omit<EvalRoute, 'routeId'>): Promise<string> {
    const routeId = `rt_${++this.routeCounter}`;
    this.routes.set(routeId, { ...route, routeId });
    return routeId;
  }

  async routeById(routeId: string): Promise<EvalRoute | undefined> {
    return this.routes.get(routeId);
  }

  async saveOutcome(outcome: CaseOutcome): Promise<void> {
    this.outcomes = [...this.outcomes, { ...outcome }];
  }

  async outcomesFor(routeId: string): Promise<CaseOutcome[]> {
    return this.outcomes.filter((o) => o.routeId === routeId);
  }

  async setThresholds(thresholds: QualificationThresholds): Promise<void> {
    this.thresholdsConfig = thresholds;
  }

  async thresholds(): Promise<QualificationThresholds | undefined> {
    return this.thresholdsConfig;
  }

  async setReviewDecision(routeId: string, accepted: boolean): Promise<void> {
    this.reviewDecisions.set(routeId, accepted);
  }

  async reviewDecision(routeId: string): Promise<{ set: boolean; accepted: boolean }> {
    const accepted = this.reviewDecisions.get(routeId);
    return accepted === undefined ? { set: false, accepted: false } : { set: true, accepted };
  }
}
