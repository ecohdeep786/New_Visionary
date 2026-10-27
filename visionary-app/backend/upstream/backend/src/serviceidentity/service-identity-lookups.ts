// AI-03 (KAN-85) — the service-identity domain's typed state seams. The owning
// store (server-issued grants, revocations) implements this at integration; the
// in-memory implementation is contract-true and fails closed.
import type { IdentityOwner, ServiceGrant } from './service-identity-types';

export interface ServiceIdentityStore {
  saveGrant(grant: ServiceGrant): Promise<void>;
  byGrantId(grantId: string): Promise<ServiceGrant | undefined>;
  revokeGrant(grantId: string): Promise<void>;
}

/** Contract-true in-memory store; grants are server-private state. */
export class InMemoryServiceIdentityStore implements ServiceIdentityStore {
  private grants = new Map<string, ServiceGrant>();
  private revoked = new Set<string>();

  async saveGrant(grant: ServiceGrant): Promise<void> {
    this.grants.set(grant.grantId, { ...grant, owner: { ...grant.owner }, scopes: [...grant.scopes] });
  }

  async byGrantId(grantId: string): Promise<ServiceGrant | undefined> {
    const found = this.grants.get(grantId);
    return found ? { ...found, owner: { ...found.owner }, scopes: [...found.scopes] } : undefined;
  }

  async revokeGrant(grantId: string): Promise<void> {
    this.revoked.add(grantId);
  }

  isRevoked(grantId: string): boolean {
    return this.revoked.has(grantId);
  }
}
