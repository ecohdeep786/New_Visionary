// ROLE-07 (KAN-99) — authorized teacher/guardian/organization reports types.
export interface ReportOwner { uid: string; workspaceId: string }

export type RecipientType = 'teacher' | 'guardian' | 'organization';

/** APPROVED aggregation/suppression rules (versioned; named approver). */
export interface ReportRules {
  rulesId: string;
  version: number;
  /** Aggregation suppression: cohorts with fewer distinct learners suppress. */
  minCohortSize: number;
  /** Maximum permitted report period length in days. */
  periodMaxDays: number;
  approvedBy: string | null;
}

export interface ReportPeriod {
  from: string;
  to: string;
}

export interface ReportDataRow {
  learnerUid: string;
  cohort: string;
  metric: string;
  value: number;
}

export interface GeneratedReport {
  reportId: string;
  recipientType: RecipientType;
  recipientId: string;
  subjectRef: string;
  period: ReportPeriod;
  rulesId: string;
  rulesVersion: number;
  /** metric → aggregated value; suppressed cohorts appear in suppressedBuckets. */
  aggregated: Record<string, number>;
  suppressedBuckets: string[];
  provenance: { rulesId: string; rulesVersion: number; period: ReportPeriod; generatedAt: string; generatedBy: string };
}

export class ReportError extends Error {
  readonly code:
    | 'not_owner'
    | 'recipient_not_authorized'
    | 'rules_not_approved'
    | 'rules_version_unknown'
    | 'period_invalid'
    | 'private_content_forbidden'
    | 'report_definition_invalid';
  constructor(code: ReportError['code']) {
    super(code);
    this.code = code;
  }
}
