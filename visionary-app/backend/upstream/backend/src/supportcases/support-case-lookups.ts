// PRIV-05 (KAN-114) — the support-case domain's typed state seams. The owning
// stores (cases, audit, incidents) implement these at integration; the
// in-memory implementation is contract-true and fails closed.
import type { Incident, OperatorAccess, SupportCase } from './support-case-types';

export interface SupportCaseStore {
  saveCase(supportCase: SupportCase): Promise<void>;
  byCaseId(caseId: string): Promise<SupportCase | undefined>;
  appendAudit(access: OperatorAccess): Promise<void>;
  auditFor(caseId: string): Promise<OperatorAccess[]>;
  saveIncident(incident: Incident): Promise<void>;
  byIncidentId(incidentId: string): Promise<Incident | undefined>;
}

/** Contract-true in-memory store; audit is append-only. */
export class InMemorySupportCaseStore implements SupportCaseStore {
  private cases = new Map<string, SupportCase>();
  private audit: OperatorAccess[] = [];
  private incidents = new Map<string, Incident>();

  async saveCase(supportCase: SupportCase): Promise<void> {
    this.cases.set(supportCase.caseId, { ...supportCase, owner: { ...supportCase.owner } });
  }

  async byCaseId(caseId: string): Promise<SupportCase | undefined> {
    const found = this.cases.get(caseId);
    return found ? { ...found, owner: { ...found.owner } } : undefined;
  }

  async appendAudit(access: OperatorAccess): Promise<void> {
    // Append-only: replaced with a new tail entry, never rewritten.
    this.audit = [...this.audit, { ...access }];
  }

  async auditFor(caseId: string): Promise<OperatorAccess[]> {
    return this.audit.filter((a) => a.caseId === caseId).map((a) => ({ ...a }));
  }

  async saveIncident(incident: Incident): Promise<void> {
    this.incidents.set(incident.incidentId, { ...incident });
  }

  async byIncidentId(incidentId: string): Promise<Incident | undefined> {
    const found = this.incidents.get(incidentId);
    return found ? { ...found } : undefined;
  }

  auditSnapshot(): string {
    return JSON.stringify(this.audit);
  }
}
