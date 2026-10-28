// ROLE-04 (KAN-96) — the guardian domain's typed state seams.
import type { Digest, DigestShare, GuardianLink, AccessGrant } from './guardian-types';

export interface GuardianStore {
  saveLink(link: GuardianLink): Promise<void>;
  link(linkId: string): Promise<GuardianLink | undefined>;
  saveGrant(grant: AccessGrant): Promise<void>;
  grant(grantId: string): Promise<AccessGrant | undefined>;
  saveDigest(digest: Digest): Promise<void>;
  digest(digestId: string): Promise<Digest | undefined>;
  saveShare(share: DigestShare): Promise<void>;
  share(shareId: string): Promise<DigestShare | undefined>;
  sharesByGrant(grantId: string): Promise<DigestShare[]>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class InMemoryGuardianStore implements GuardianStore {
  private links = new Map<string, GuardianLink>();
  private grants = new Map<string, AccessGrant>();
  private digests = new Map<string, Digest>();
  private shares = new Map<string, DigestShare>();

  async saveLink(link: GuardianLink): Promise<void> { this.links.set(link.linkId, clone(link)); }
  async link(linkId: string): Promise<GuardianLink | undefined> {
    const found = this.links.get(linkId); return found ? clone(found) : undefined;
  }
  async saveGrant(grant: AccessGrant): Promise<void> { this.grants.set(grant.grantId, clone(grant)); }
  async grant(grantId: string): Promise<AccessGrant | undefined> {
    const found = this.grants.get(grantId); return found ? clone(found) : undefined;
  }
  async saveDigest(digest: Digest): Promise<void> { this.digests.set(digest.digestId, clone(digest)); }
  async digest(digestId: string): Promise<Digest | undefined> {
    const found = this.digests.get(digestId); return found ? clone(found) : undefined;
  }
  async saveShare(share: DigestShare): Promise<void> { this.shares.set(share.shareId, clone(share)); }
  async share(shareId: string): Promise<DigestShare | undefined> {
    const found = this.shares.get(shareId); return found ? clone(found) : undefined;
  }
  async sharesByGrant(grantId: string): Promise<DigestShare[]> {
    return [...this.shares.values()].filter((s) => s.grantId === grantId).map(clone);
  }
}
