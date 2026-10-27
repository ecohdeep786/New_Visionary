// PRIV-05 (KAN-114) — support cases with scoped operator access, audit, and
// incident/abuse response.
//
// Core responsibilities (server-owned; default-closed operator authority):
//   1. fileCase: an authenticated user files a case with an explicit reason;
//     an empty detail refuses (`reason_required`); the case is owner-scoped.
//   2. operatorAccess: reading a case requires the `support.review` scope AND
//      a per-case access with a recorded reason — every access appends an
//      audited entry (who/which case/why/when). An operator WITHOUT the scope
//      refuses (`operator_scope_required`); the ordinary user identity is
//      never an operator.
//   3. operatorDump: ALWAYS refused (`operator_dump_refused`) — there is no
//      bulk access to a user's data, for any operator, any reason.
//   4. openIncident / restrictContent / resolveIncident: the incident/abuse
//      response — an abuse/content report opens an incident, the reported
//      content can be RESTRICTED pending review, and resolution records the
//      outcome and closes the case honestly.
//   5. The owner may inspect their own case (status and incident reference).
import type {
  CaseOwner,
  Incident,
  SupportCase,
  SupportCaseError as SupportCaseErrorType,
} from './support-case-types';
import { SupportCaseError } from './support-case-types';
import type { SupportCaseStore } from './support-case-lookups';

export class SupportCaseService {
  private caseCounter = 0;
  private incidentCounter = 0;
  private accessCounter = 0;
  constructor(
    private readonly store: SupportCaseStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** File a support/abuse/report case (owner-scoped; reason required). */
  async fileCase(owner: CaseOwner, reason: SupportCase['reason'], detail: string, reportedContentRef?: string): Promise<SupportCase> {
    if (!detail || detail.trim().length === 0) throw new SupportCaseError('reason_required');
    const supportCase: SupportCase = {
      caseId: `case_${++this.caseCounter}`,
      owner: { ...owner },
      reason,
      detail,
      status: 'open',
      incidentId: null,
      filedAt: this.now().toISOString(),
    };
    await this.store.saveCase(supportCase);
    // Abuse/content reports open an incident immediately (response flow).
    if (reason === 'abuse_report' || reason === 'content_report') {
      await this.openIncident(supportCase.caseId, owner, reportedContentRef ?? detail);
      // Return the stored row (the incident updated status/incidentId).
      return (await this.store.byCaseId(supportCase.caseId)) as SupportCase;
    }
    return supportCase;
  }

  /** Owner inspection: their own case only. */
  async inspectOwn(caseId: string, owner: CaseOwner): Promise<SupportCase> {
    const supportCase = await this.getCase(caseId);
    if (supportCase.owner.uid !== owner.uid || supportCase.owner.workspaceId !== owner.workspaceId) {
      throw new SupportCaseError('not_owner');
    }
    return supportCase;
  }

  /**
   * Scoped operator access to ONE case with a recorded reason. Every access
   * appends an audit entry (append-only).
   */
  async operatorAccess(input: { operatorId: string; scopes: readonly string[]; caseId: string; reason: string }): Promise<SupportCase> {
    if (!input.operatorId.startsWith('op_') || !input.scopes.includes('support.review')) {
      throw new SupportCaseError('operator_scope_required');
    }
    if (!input.reason || input.reason.trim().length === 0) throw new SupportCaseError('reason_required');
    const supportCase = await this.getCase(input.caseId);
    await this.store.appendAudit({
      accessId: `acc_${++this.accessCounter}`,
      operatorId: input.operatorId,
      caseId: input.caseId,
      reason: input.reason,
      at: this.now().toISOString(),
    });
    return supportCase;
  }

  /** NO unrestricted user dump — refused for any operator, any reason. */
  async operatorDump(_operatorId: string, _scopes: readonly string[], _targetUid: string, _reason: string): Promise<never> {
    throw new SupportCaseError('operator_dump_refused');
  }

  /** Open an incident from an abuse/content report. */
  async openIncident(caseId: string, owner: CaseOwner, reportedContentRef: string): Promise<Incident> {
    const incident: Incident = {
      incidentId: `inc_${++this.incidentCounter}`,
      caseId,
      reportedContentRef,
      restricted: true, // abuse/content response restricts pending review
      outcome: 'pending',
      resolvedBy: null,
    };
    await this.store.saveIncident(incident);
    const supportCase = await this.getCase(caseId);
    await this.store.saveCase({ ...supportCase, status: 'restricted', incidentId: incident.incidentId });
    void owner;
    return incident;
  }

  /** Resolve an incident: record the outcome, close the case honestly. */
  async resolveIncident(input: { operatorId: string; scopes: readonly string[]; incidentId: string; outcome: 'action_taken' | 'no_action'; reason: string }): Promise<Incident> {
    if (!input.scopes.includes('support.review')) throw new SupportCaseError('operator_scope_required');
    const incident = await this.store.byIncidentId(input.incidentId);
    if (!incident) throw new SupportCaseError('unknown_case');
    if (incident.outcome !== 'pending') throw new SupportCaseError('already_resolved');
    const resolved: Incident = { ...incident, outcome: input.outcome, resolvedBy: input.operatorId };
    await this.store.saveIncident(resolved);
    const supportCase = await this.getCase(incident.caseId);
    await this.store.saveCase({ ...supportCase, status: 'resolved' });
    await this.store.appendAudit({
      accessId: `acc_${++this.accessCounter}`,
      operatorId: input.operatorId,
      caseId: incident.caseId,
      reason: `incident ${input.incidentId} resolved: ${input.outcome} — ${input.reason}`,
      at: this.now().toISOString(),
    });
    return resolved;
  }

  /** The append-only audit trail for one case. */
  async auditTrail(caseId: string, operator: { scopes: readonly string[] }): Promise<{ caseId: string; entries: Awaited<ReturnType<SupportCaseStore['auditFor']>> }> {
    if (!operator.scopes.includes('support.review')) throw new SupportCaseError('operator_scope_required');
    return { caseId, entries: await this.store.auditFor(caseId) };
  }

  private async getCase(caseId: string): Promise<SupportCase> {
    const supportCase = await this.store.byCaseId(caseId);
    if (!supportCase) throw new SupportCaseError('unknown_case');
    return supportCase;
  }
}

export type { SupportCaseErrorType };
