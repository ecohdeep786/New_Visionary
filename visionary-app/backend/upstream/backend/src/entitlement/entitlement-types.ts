// ROLE-09 (KAN-101) — reconcile organization-sponsored entitlement
// requirements with real approved commercial contracts types.
export interface EntOwner { uid: string; workspaceId: string }

/** A REAL approved commercial contract (recorded; the only entitlement source). */
export interface CommercialContract {
  contractId: string;
  companyId: string;
  seats: number;
  validFrom: string;
  validTo: string;
  approvedBy: string;
}

/** A seat request — a PREVIEW/REQUEST, never a billing obligation. */
export interface SeatRequest {
  requestId: string;
  companyId: string;
  requestedSeats: number;
  requestedBy: string;
  status: 'pending_approval' | 'entitled';
  contractId: string | null;
  createdAt: string;
}

export interface ReconciliationReport {
  companyId: string;
  contractId: string | null;
  contractSeats: number | null;
  activeSponsoredMembers: number;
  requestedSeats: number;
  entitledSeats: number;
  overBound: number;
}

export class EntitlementError extends Error {
  readonly code:
    | 'not_owner'
    | 'sponsor_only'
    | 'no_approved_contract'
    | 'contract_expired'
    | 'contract_seat_bound_exceeded'
    | 'seat_request_invalid'
    | 'no_administrative_authority_from_request';
  constructor(code: EntitlementError['code']) {
    super(code);
    this.code = code;
  }
}
