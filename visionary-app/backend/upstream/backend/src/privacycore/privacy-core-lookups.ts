// PRIV-01 (KAN-110) — the privacy core's typed state seams. The owning stores
// (per-class records, artifacts, derived caches) implement these at integration;
// the in-memory implementation is contract-true and fails closed.
import type { PrivacyPolicy } from './privacy-core-types';

export interface PrivacyPolicyStore {
  currentPolicy(): Promise<PrivacyPolicy>;
  /** Whether the actor owns records of this class (uid+workspace). */
  isOwner(dataClass: string, uid: string, workspaceId: string): Promise<boolean>;
  /** Event-driven erasure: delete the owner's data for one class. */
  deleteOwnerData(dataClass: string, ownerUid: string, workspaceId: string): Promise<void>;
  /** Revoke derived caches + authorization (CACHE-01/AI-05 composition). */
  revokeDerivedCaches(ownerUid: string): Promise<void>;
  saveArtifact(fields: Record<string, string | number>): Promise<void>;
}

/** Contract-true in-memory store. */
export class InMemoryPrivacyStore implements PrivacyPolicyStore {
  private ownership = new Set<string>();
  private artifacts: Record<string, string | number>[] = [];

  seedOwnership(dataClass: string, uid: string, workspaceId: string): void {
    this.ownership.add(`${dataClass}|${uid}|${workspaceId}`);
  }

  async currentPolicy(): Promise<PrivacyPolicy> {
    // The shipped policy is the store's policy (integration reads the
    // approved, versioned policy record).
    const { shippedPrivacyPolicy } = await import('./privacy-policy');
    return shippedPrivacyPolicy();
  }

  async isOwner(dataClass: string, uid: string, workspaceId: string): Promise<boolean> {
    return this.ownership.has(`${dataClass}|${uid}|${workspaceId}`);
  }

  async deleteOwnerData(dataClass: string, ownerUid: string, _workspaceId: string): Promise<void> {
    // Drop the ownership rows for this owner+class (erasure executed).
    for (const key of [...this.ownership]) {
      if (key.startsWith(`${dataClass}|${ownerUid}|`)) this.ownership.delete(key);
    }
  }

  async revokeDerivedCaches(ownerUid: string): Promise<void> {
    this.revokedUids.add(ownerUid);
  }

  revokedUids = new Set<string>();

  async saveArtifact(fields: Record<string, string | number>): Promise<void> {
    this.artifacts = [...this.artifacts, { ...fields }];
  }

  artifactCount(): number {
    return this.artifacts.length;
  }
}
