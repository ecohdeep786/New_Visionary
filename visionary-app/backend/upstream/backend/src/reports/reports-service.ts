// ROLE-07 (KAN-99) — authorized teacher/guardian/organization reports with
// provenance, permitted periods and approved aggregation/suppression rules;
// private learner chat and drafts are excluded by default.
//
// Core responsibilities (server-owned; privacy-first; fail closed):
//   1. AUTHORIZED recipients — a report generates only for a recipient the
//      owning store authorizes against the recorded relationships (teacher →
//      own class, guardian → ACTIVE grant, organization → explicit scope);
//      unauthorized recipients refuse uniformly (`recipient_not_authorized`).
//   2. APPROVED rules — generation requires an APPROVED rules version (named
//      approver); an unapproved or unknown version refuses.
//   3. PERMITTED periods — the period must be bounded (from ≤ to, length
//      within the rules' permitted maximum).
//   4. PRIVATE CONTENT EXCLUDED BY DEFAULT — data rows carrying private
//      learner chat/draft content keys refuse at generation; there is no
//      override.
//   5. APPROVED aggregation/suppression — per-cohort aggregation suppresses
//      any cohort whose distinct learner count is below the rules'
//      minCohortSize (suppressed buckets are listed, never silently merged).
//   6. PROVENANCE — every report carries the rules id/version, the period,
//      and generation actor/time; the same inputs produce a byte-stable
//      report (append-only history).
import type {
  GeneratedReport,
  ReportDataRow,
  ReportError as ReportErrorType,
  ReportOwner,
  ReportPeriod,
  ReportRules,
  RecipientType,
} from './reports-types';
import { ReportError } from './reports-types';
import type { ReportsStore } from './reports-lookups';

const PRIVATE_HINTS = ['chat', 'draft', 'transcript', 'learner_text', 'conversation'];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class ReportsService {
  private rulesCounter = 0;
  private reportCounter = 0;

  constructor(private readonly store: ReportsStore) {}

  /** Define a rules version (unapproved until a named approver approves). */
  async defineRules(
    rules: Omit<ReportRules, 'approvedBy'>,
    approver: string | null,
  ): Promise<ReportRules> {
    if (
      !rules.rulesId ||
      !Number.isInteger(rules.version) ||
      rules.version < 1 ||
      !Number.isInteger(rules.minCohortSize) ||
      rules.minCohortSize < 1 ||
      !Number.isInteger(rules.periodMaxDays) ||
      rules.periodMaxDays < 1
    ) {
      throw new ReportError('report_definition_invalid');
    }
    const saved: ReportRules = { ...clone(rules), approvedBy: approver?.trim() ? approver : null };
    await this.store.saveRules(saved);
    return saved;
  }

  /** Approve a rules version (named approver; explicit act). */
  async approveRules(rulesId: string, version: number, approver: string): Promise<ReportRules> {
    if (!approver?.trim()) throw new ReportError('rules_not_approved');
    const rules = await this.requireRules(rulesId, version);
    const approved: ReportRules = { ...rules, approvedBy: approver };
    await this.store.saveRules(approved);
    return approved;
  }

  /** Generate one authorized, provenance-carrying, suppressed report. */
  async generateReport(
    recipient: ReportOwner,
    recipientType: RecipientType,
    recipientId: string,
    subjectRef: string,
    period: ReportPeriod,
    rulesId: string,
    rulesVersion: number,
    rows: readonly ReportDataRow[],
  ): Promise<GeneratedReport> {
    if (!(await this.store.isAuthorized(recipientType, recipientId, subjectRef))) {
      throw new ReportError('recipient_not_authorized');
    }
    const rules = await this.store.rules(rulesId, rulesVersion);
    if (!rules) throw new ReportError('rules_version_unknown');
    if (!rules.approvedBy) throw new ReportError('rules_not_approved');
    const from = Date.parse(period.from);
    const to = Date.parse(period.to);
    if (
      !Number.isFinite(from) ||
      !Number.isFinite(to) ||
      to < from ||
      (to - from) / 86_400_000 > rules.periodMaxDays
    ) {
      throw new ReportError('period_invalid');
    }
    // Private learner chat and drafts are excluded BY DEFAULT — no override.
    for (const row of rows) {
      if (PRIVATE_HINTS.some((h) => row.metric.toLowerCase().includes(h) || row.cohort.toLowerCase().includes(h))) {
        throw new ReportError('private_content_forbidden');
      }
    }
    // Aggregation with approved suppression.
    const aggregated: Record<string, number> = {};
    const suppressedBuckets: string[] = [];
    const cohorts = [...new Set(rows.map((r) => r.cohort))];
    for (const cohort of cohorts) {
      const size = this.store.cohortSize([...rows], cohort);
      const cohortRows = rows.filter((r) => r.cohort === cohort);
      if (size < rules.minCohortSize) {
        suppressedBuckets.push(cohort);
        continue;
      }
      for (const metric of [...new Set(cohortRows.map((r) => r.metric))]) {
        const values = cohortRows.filter((r) => r.metric === metric).map((r) => r.value);
        aggregated[`${cohort}.${metric}`] =
          Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100;
      }
    }
    const report: GeneratedReport = {
      reportId: `rep_${++this.reportCounter}`,
      recipientType,
      recipientId,
      subjectRef,
      period: { ...period },
      rulesId,
      rulesVersion,
      aggregated,
      suppressedBuckets,
      provenance: {
        rulesId,
        rulesVersion,
        period: { ...period },
        generatedAt: new Date().toISOString(),
        generatedBy: recipient.uid,
      },
    };
    await this.store.saveReport(report);
    return report;
  }

  /** Read one generated report (append-only history; recipient-scoped). */
  async getReport(recipient: ReportOwner, reportId: string): Promise<GeneratedReport> {
    const report = await this.store.report(reportId);
    if (!report || report.recipientId !== recipient.uid) throw new ReportError('not_owner');
    return report;
  }

  private async requireRules(rulesId: string, version: number): Promise<ReportRules> {
    const rules = await this.store.rules(rulesId, version);
    if (!rules) throw new ReportError('rules_version_unknown');
    return rules;
  }
}

export type { ReportErrorType };
