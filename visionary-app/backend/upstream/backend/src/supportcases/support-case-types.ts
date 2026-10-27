// PRIV-05 (KAN-114) — support cases/reporting, scoped operator access,
// reason/audit and incident/abuse response. No unrestricted user dump or
// default open access.
//
// The checkpoint here is a support surface with DEFAULT-CLOSED authority:
//   - Case filing: an authenticated user files a case with an explicit reason
//     (support/abuse/report); the case is owner-scoped; an empty reason
//     refuses.
//   - SCOPED OPERATOR ACCESS ONLY: an operator reads a case ONLY with the
//     `support.review` scope AND a per-case binding — and every access records
//     WHO accessed WHICH case WHY (append-only audit). An ordinary user
//     identity is never an operator.
//   - NO UNRESTRICTED DUMP: an operator requesting a whole-user data dump
//     refuses (`operator_dump_refused`) — access is per-case, reason-required,
//     never a bulk export of a user's data.
//   - INCIDENT/ABUSE RESPONSE: an abuse report opens an incident; the incident
//     can RESTRICT the reported content pending review; resolution records the
//     outcome (action taken) and closes honestly.
//   - AUDIT IS APPEND-ONLY: earlier audit entries stay byte-stable forever.
//   - Wrong users denied; unknown cases fail closed.
//
// Exit: real-user data has enforceable access, lifecycle and support
// procedures.

/** The case filer (authenticated user). */
export interface CaseOwner {
  uid: string;
  workspaceId: string;
}

export type CaseReason = 'support' | 'abuse_report' | 'content_report' | 'account_issue';

/** A support case. */
export interface SupportCase {
  caseId: string;
  owner: CaseOwner;
  reason: CaseReason;
  detail: string;
  status: 'open' | 'restricted' | 'resolved';
  /** For abuse/content reports: the incident opened from this case. */
  incidentId: string | null;
  filedAt: string;
}

/** An operator's audited access to one case. */
export interface OperatorAccess {
  accessId: string;
  operatorId: string;
  caseId: string;
  reason: string;
  at: string;
}

/** An incident opened from an abuse/content report. */
export interface Incident {
  incidentId: string;
  caseId: string;
  reportedContentRef: string;
  /** Restricted = content hidden pending review (incident/abuse response). */
  restricted: boolean;
  outcome: 'pending' | 'action_taken' | 'no_action';
  resolvedBy: string | null;
}

export class SupportCaseError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_case'
      | 'reason_required'
      | 'operator_scope_required'
      | 'operator_dump_refused'
      | 'already_resolved'
  ) {
    super(code);
  }
}
