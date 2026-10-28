// ROLE-09 (KAN-101) — the entitlement domain's typed state seams.
import type { CommercialContract, SeatRequest } from './entitlement-types';

export interface EntitlementStore {
  saveContract(contract: CommercialContract): Promise<void>;
  contract(contractId: string): Promise<CommercialContract | undefined>;
  activeContract(companyId: string): Promise<CommercialContract | undefined>;
  saveSeatRequest(request: SeatRequest): Promise<void>;
  seatRequests(companyId: string): Promise<SeatRequest[]>;
  activeSponsoredMembers(companyId: string): Promise<number>;
  orgRole(orgId: string, uid: string): Promise<string | undefined>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Contract-true in-memory store; every seam fails closed. */
export class InMemoryEntitlementStore implements EntitlementStore {
  private contracts = new Map<string, CommercialContract>();
  private requests = new Map<string, SeatRequest>();
  private sponsored = new Map<string, number>();
  private roles = new Map<string, string>();

  seedSponsoredMembers(companyId: string, count: number): void {
    this.sponsored.set(companyId, count);
  }

  seedOrgRole(orgId: string, uid: string, role: string): void {
    this.roles.set(`${orgId}|${uid}`, role);
  }

  async saveContract(contract: CommercialContract): Promise<void> {
    this.contracts.set(contract.contractId, clone(contract));
  }

  async contract(contractId: string): Promise<CommercialContract | undefined> {
    const found = this.contracts.get(contractId);
    return found ? clone(found) : undefined;
  }

  async activeContract(companyId: string): Promise<CommercialContract | undefined> {
    const found = [...this.contracts.values()].filter((c) => c.companyId === companyId);
    return found.length ? clone(found[found.length - 1]) : undefined;
  }

  async saveSeatRequest(request: SeatRequest): Promise<void> {
    this.requests.set(request.requestId, clone(request));
  }

  async seatRequests(companyId: string): Promise<SeatRequest[]> {
    return [...this.requests.values()].filter((r) => r.companyId === companyId).map(clone);
  }

  async activeSponsoredMembers(companyId: string): Promise<number> {
    return this.sponsored.get(companyId) ?? 0;
  }

  async orgRole(orgId: string, uid: string): Promise<string | undefined> {
    return this.roles.get(`${orgId}|${uid}`);
  }
}
