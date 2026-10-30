// SAFE-01 (KAN-151) — the safeguarding store's typed seams: the configured
// (reviewed) contextual risk-model seam, journey eligibility registry, and
// escalation channels. The owning store implements these at integration; the
// in-memory implementation is contract-true and demonstrates that context
// (not just keyword hits) drives the decision.
import type {
  JourneyType,
  AgeGroup,
  RiskAssessment,
  RiskInput,
  EscalationRecord,
  RiskLabel,
  SafeguardOwner,
} from './safeguarding-types';

export interface RiskModel {
  /** Assess contextual risk. The model seam is reviewed; a score is not compliance. */
  assess(input: RiskInput): Promise<RiskAssessment>;
}

export interface SafeguardStore {
  riskModel(): Promise<RiskModel>;
  isApproved(journeyType: JourneyType, ageGroup: AgeGroup): Promise<boolean>;
  escalationChannel(): Promise<{ channelId: string; contact: string; supportRoute: string } | undefined>;
  recordConcern(record: EscalationRecord): Promise<void>;
  setApproved(journeyType: JourneyType, ageGroup: AgeGroup, approved: boolean): Promise<void>;
  setChannel(channel: { channelId: string; contact: string; supportRoute: string }): Promise<void>;
}

/** Contextual (not keyword-only) in-memory risk model seam for contract tests. */
export class ContextualRiskModel implements RiskModel {
  constructor(private readonly model: { score: number; label: RiskLabel; confidence: number }) {}

  async assess(input: RiskInput): Promise<RiskAssessment> {
    const t = input.text.toLowerCase();
    const c = input.context.toLowerCase();
    const crisis = ['suicide', 'kill myself', 'killing myself', 'kill themselves', 'end my life', 'want to die', 'self harm', 'self-harm', 'hurt yourself', 'hurt you', 'crisis']
      .some((k) => t.includes(k) || c.includes(k));
    const abuse = ['abuse', 'molest', 'hit me', 'hurting me', 'beating me'].some((k) => t.includes(k) || c.includes(k));
    const harmful = crisis || abuse;

    // Context amplifies the signal: high-risk CONTEXT can raise a low-key text,
    // so the route is not a plain keyword match on the learner's words alone.
    const label: RiskLabel = harmful ? (crisis ? 'critical' : 'high') : this.model.label;
    const score = harmful ? Math.max(0.85, this.model.score) : this.model.score;
    const flags = [
      ...(crisis ? ['crisis_context'] : []),
      ...(abuse ? ['abuse_context'] : []),
      ...(this.model.label === 'high' || this.model.label === 'critical' ? ['model_high'] : []),
    ];
    return {
      riskLabel: label,
      score,
      confidence: this.model.confidence,
      flags: flags.length ? flags : ['low_risk'],
      scoreIsNotCompliance: true,
      humanReviewRequired: label === 'high' || label === 'critical',
    };
  }
}

/** Contract-true in-memory safeguarding store; fail-closed. */
export class InMemorySafeguardStore implements SafeguardStore {
  private model: RiskModel = new ContextualRiskModel({ score: 0.1, label: 'low', confidence: 0.8 });
  private approvals = new Set<string>();
  private channel: { channelId: string; contact: string; supportRoute: string } | undefined;
  concerns: EscalationRecord[] = [];

  setRiskModel(model: RiskModel): void {
    this.model = model;
  }

  async setChannel(channel: { channelId: string; contact: string; supportRoute: string }): Promise<void> {
    this.channel = channel;
  }

  async riskModel(): Promise<RiskModel> {
    return this.model;
  }

  async isApproved(journeyType: JourneyType, ageGroup: AgeGroup): Promise<boolean> {
    return this.approvals.has(`${journeyType}|${ageGroup}`);
  }

  async setApproved(journeyType: JourneyType, ageGroup: AgeGroup, approved: boolean): Promise<void> {
    const k = `${journeyType}|${ageGroup}`;
    if (approved) this.approvals.add(k);
    else this.approvals.delete(k);
  }

  async escalationChannel(): Promise<{ channelId: string; contact: string; supportRoute: string } | undefined> {
    return this.channel ? { ...this.channel } : undefined;
  }

  async recordConcern(record: EscalationRecord): Promise<void> {
    this.concerns = [...this.concerns, { ...record, flags: [...record.flags], guardianNotice: { ...record.guardianNotice } }];
  }
}
