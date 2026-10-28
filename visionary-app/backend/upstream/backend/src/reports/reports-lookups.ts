// ROLE-07 (KAN-99) — the reports domain's typed state seams.
import type { GeneratedReport, ReportDataRow, ReportRules } from './reports-types';

export interface ReportsStore {
  saveRules(rules: ReportRules): Promise<void>;
  rules(rulesId: string, version: number): Promise<ReportRules | undefined>;
  /** Recipient authorization against the recorded relationships (ROLE-01/04/06 stances). */
  isAuthorized(recipientType: string, recipientId: string, subjectRef: string): Promise<boolean>;
  /** Distinct learner count for one cohort in the period (aggregation input). */
  cohortSize(rows: ReportDataRow[], cohort: string): number;
  saveReport(report: GeneratedReport): Promise<void>;
  report(reportId: string): Promise<GeneratedReport | undefined>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class InMemoryReportsStore implements ReportsStore {
  private rulesList = new Map<string, ReportRules>();
  private reportList = new Map<string, GeneratedReport>();
  private authorized = new Set<string>();

  seedAuthorization(recipientType: string, recipientId: string, subjectRef: string): void {
    this.authorized.add(`${recipientType}|${recipientId}|${subjectRef}`);
  }

  async saveRules(rules: ReportRules): Promise<void> {
    this.rulesList.set(`${rules.rulesId}@${rules.version}`, clone(rules));
  }
  async rules(rulesId: string, version: number): Promise<ReportRules | undefined> {
    const found = this.rulesList.get(`${rulesId}@${version}`);
    return found ? clone(found) : undefined;
  }
  async isAuthorized(recipientType: string, recipientId: string, subjectRef: string): Promise<boolean> {
    return this.authorized.has(`${recipientType}|${recipientId}|${subjectRef}`);
  }
  cohortSize(rows: ReportDataRow[], cohort: string): number {
    return new Set(rows.filter((r) => r.cohort === cohort).map((r) => r.learnerUid)).size;
  }
  async saveReport(report: GeneratedReport): Promise<void> {
    this.reportList.set(report.reportId, clone(report));
  }
  async report(reportId: string): Promise<GeneratedReport | undefined> {
    const found = this.reportList.get(reportId);
    return found ? clone(found) : undefined;
  }
}
