// SAFE-01 (KAN-151) — reviewed, localized safeguarding route separate from
// normal teaching.
//
// The checkpoint here is the server-owned safeguarding contract:
//   - INPUT/OUTPUT CHECKS are a SEPARATE ROUTE from teaching: learner input
//     and assistant output are assessed by a CONFIGURED contextual risk model
//     (a seam for a reviewed classifier), NOT a keyword list and NOT a single
//     unexplained score. Criterion: an NLI/similarity score is NEVER equated
//     with safety or legal compliance — high/critical risk always requires a
//     human review decision.
//   - JOURNEY ELIGIBILITY is gated: unsupported minor/adult journeys stay
//     blocked until approved admission and consent are recorded; unapproved
//     journeys fail closed.
//   - TRUTHFUL SUPPORT/REPORTING: a concern routes to a CONFIGURED escalation
//     channel. The alleged abuser is NEVER auto-notified, and private learner
//     text is NEVER disclosed to a guardian (the guardian receives a truthful
//     summary with a support route, not the raw text).
export interface SafeguardOwner {
  uid: string;
  workspaceId: string;
}

export type JourneyType = 'learner' | 'teacher' | 'guardian' | 'professional';
export type AgeGroup = 'child' | 'minor' | 'adult';
export type RiskLabel = 'low' | 'medium' | 'high' | 'critical';

/** The input handed to the (configured, reviewed) risk model. */
export interface RiskInput {
  text: string;
  context: string;
  journeyType: JourneyType;
  ageGroup: AgeGroup;
}

export interface RiskAssessment {
  riskLabel: RiskLabel;
  score: number;        // 0..1
  confidence: number;   // 0..1
  flags: readonly string[];
  /** A score never equals safety/legal compliance. */
  scoreIsNotCompliance: true;
  /** high/critical (or crisis context) always demands a human decision. */
  humanReviewRequired: boolean;
}

export interface EligibilityDecision {
  journeyType: JourneyType;
  ageGroup: AgeGroup;
  allowed: boolean;
  reason: 'approved' | 'blocked_unsupported_minor' | 'blocked_consent_missing' | 'blocked_unknown';
}

/** A concern report routed to the configured escalation channel. */
export interface EscalationRecord {
  recordId: string;
  reporter: SafeguardOwner;
  subjectUid: string;
  journeyType: JourneyType;
  ageGroup: AgeGroup;
  riskLabel: RiskLabel;
  score: number;
  confidence: number;
  flags: readonly string[];
  channelId: string;
  /** NEVER auto-notified in this contract. */
  allegedAbuserNotified: false;
  guardianNotice: {
    /** Truthful summary — never the raw learner text. */
    summary: string;
    supportRoute: string;
    escalationContact: string;
    rawTextIncluded: false;
  };
  recordedAt: string;
}

export type SafeguardErrorCode =
  | 'not_owner'
  | 'journey_not_eligible'
  | 'unknown_risk_model'
  | 'escalation_channel_unconfigured'
  | 'reporter_is_subject_alleged_abuser'
  | 'output_blocked';

export class SafeguardError extends Error {
  constructor(public readonly code: SafeguardErrorCode) {
    super(code);
  }
}
