// ROLE-09 (KAN-101) — reconcile organization-sponsored entitlement
// requirements with REAL approved commercial contracts.
//
// Core responsibilities (server-owned; honest boundaries; fail closed):
//   1. A seat-request PREVIEW cannot invent institutional billing: with no
//      REAL approved commercial contract recorded, a preview reports
//      `no_approved_contract` honestly and creates NO billing artifact
//      (no invoice, no obligation — the store has no such write path).
//   2. A seat request without a contract stays a REQUEST
//      (`pending_approval`) — no entitlement, no billing.
//   3. NO ADMINISTRATIVE AUTHORITY from a request: a seat request never
//      elevates anyone's organization role — admin authority comes only
//      from recorded org roles (ROLE-06); an attempt to attach authority to
//      a request refuses (`no_administrative_authority_from_request`).
//   4. REAL contract binding: entitlement derives ONLY from an approved,
//      valid contract (named approver, seat count, validity window) — seats
//      beyond the bound refuse (`contract_seat_bound_exceeded`), an expired
//      contract refuses (`contract_expired`), and every entitlement carries
//      its contract provenance (id + approver).
//   5. RECONCILIATION: a deterministic report reconciles requested seats vs
//      contract seats vs active sponsored members (requested, entitled,
//      over-bound) — the input for real commercial acceptance, never a
//      substitute for it.
import type {
  EntOwner,
  EntitlementError as EntitlementErrorType,
  ReconciliationReport,
  SeatRequest,
} from './entitlement-types';
import { EntitlementError } from './entitlement-types';
import type { EntitlementStore } from './entitlement-lookups';

export interface ContractInput {
  companyId: string;
  seats: number;
  validFrom: string;
  validTo: string;
  approvedBy: string;
}

export class EntitlementService {
  private requestCounter = 0;

  constructor(private readonly store: EntitlementStore) {}

  /** Record a REAL approved commercial contract (named approver required). */
  async recordContract(approver: EntOwner, input: ContractInput): Promise<string> {
    if (!approver.uid.startsWith('company_') || !input.approvedBy?.trim()) {
      throw new EntitlementError('sponsor_only');
    }
    if (!input.companyId || !Number.isInteger(input.seats) || input.seats < 1) {
      throw new EntitlementError('seat_request_invalid');
    }
    if (Date.parse(input.validTo) <= Date.parse(input.validFrom)) {
      throw new EntitlementError('seat_request_invalid');
    }
    const contractId = `con_${Math.random().toString(36).slice(2, 10)}`;
    await this.store.saveContract({ ...input, contractId });
    return contractId;
  }

  /** Submit a seat request — a REQUEST, never a billing obligation. */
  async requestSeats(sponsor: EntOwner, companyId: string, requestedSeats: number): Promise<SeatRequest> {
    if (!sponsor.uid.startsWith('company_')) throw new EntitlementError('sponsor_only');
    if (!Number.isInteger(requestedSeats) || requestedSeats < 1) {
      throw new EntitlementError('seat_request_invalid');
    }
    const contract = await this.store.activeContract(companyId);
    let status: SeatRequest['status'] = 'pending_approval';
    let contractId: string | null = null;
    if (contract) {
      if (this.now().getTime() >= Date.parse(contract.validTo)) {
        throw new EntitlementError('contract_expired');
      }
      if (requestedSeats > contract.seats) {
        throw new EntitlementError('contract_seat_bound_exceeded');
      }
      status = 'entitled';
      contractId = contract.contractId;
    }
    const request: SeatRequest = {
      requestId: `req_${++this.requestCounter}`,
      companyId,
      requestedSeats,
      requestedBy: sponsor.uid,
      status,
      contractId,
      createdAt: this.now().toISOString(),
    };
    await this.store.saveSeatRequest(request);
    return request;
  }

  /**
   * The PREVIEW: what the org would get. With no approved contract it
   * reports honestly and creates NOTHING — no billing artifact exists.
   */
  async previewSeatRequest(companyId: string, requestedSeats: number): Promise<{
    entitled: boolean;
    reason: string;
    contractId: string | null;
    contractSeats: number | null;
    billingArtifactCreated: false;
  }> {
    const contract = await this.store.activeContract(companyId);
    if (!contract) {
      return {
        entitled: false,
        reason: 'no_approved_contract',
        contractId: null,
        contractSeats: null,
        billingArtifactCreated: false,
      };
    }
    if (this.now().getTime() >= Date.parse(contract.validTo)) {
      return {
        entitled: false,
        reason: 'contract_expired',
        contractId: contract.contractId,
        contractSeats: contract.seats,
        billingArtifactCreated: false,
      };
    }
    return {
      entitled: requestedSeats <= contract.seats,
      reason: requestedSeats <= contract.seats ? 'within_contract_seats' : 'contract_seat_bound_exceeded',
      contractId: contract.contractId,
      contractSeats: contract.seats,
      billingArtifactCreated: false,
    };
  }

  /** A seat request CANNOT carry administrative authority. */
  async attachAdministrativeAuthority(): Promise<never> {
    throw new EntitlementError('no_administrative_authority_from_request');
  }

  /** Deterministic reconciliation report (input for commercial acceptance). */
  async reconcile(companyId: string): Promise<ReconciliationReport> {
    const contract = await this.store.activeContract(companyId);
    const requests = await this.store.seatRequests(companyId);
    const requestedSeats = requests.reduce((s, r) => s + r.requestedSeats, 0);
    const activeMembers = await this.store.activeSponsoredMembers(companyId);
    const contractSeats = contract ? contract.seats : null;
    const entitledSeats = contract && this.now().getTime() < Date.parse(contract.validTo)
      ? Math.min(requestedSeats, contractSeats ?? 0)
      : 0;
    return {
      companyId,
      contractId: contract ? contract.contractId : null,
      contractSeats,
      activeSponsoredMembers: activeMembers,
      requestedSeats,
      entitledSeats,
      overBound: contractSeats !== null ? Math.max(0, requestedSeats - contractSeats) : requestedSeats,
    };
  }

  private now(): Date {
    return new Date();
  }
}

export type { EntitlementErrorType };
