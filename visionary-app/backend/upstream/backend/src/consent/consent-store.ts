// DATA-05 — consent/share store contract + in-memory synthetic implementation.
// A Cloud SQL adapter must enforce this contract before product activation.
import type { ConsentGrant, ShareGrant, ConsentEvent, ConsentState, ConsentPurpose } from './consent-types';

export interface ConsentStore {
  createGrant(grant: ConsentGrant): Promise<ConsentGrant>;
  findGrant(id: string): Promise<ConsentGrant | null>;
  findGrantBySubject(purpose: ConsentPurpose, uid: string, resourceId: string | null, consentVersion: string): Promise<ConsentGrant | null>;
  listGrants(uid: string): Promise<ConsentGrant[]>;
  updateGrant(id: string, update: Partial<Pick<ConsentGrant, 'state' | 'revokedAt' | 'expiresAt'>>): Promise<ConsentGrant | null>;
  /** Persist only if the owner and verified recipient are confirmed in the same operation. */
  createAuthorizedShare(share: ShareGrant): Promise<ShareGrant | null>;
  findShare(id: string): Promise<ShareGrant | null>;
  listSharesByOwner(uid: string): Promise<ShareGrant[]>;
  listSharesTo(uid: string): Promise<ShareGrant[]>;
  updateShare(id: string, update: Partial<Pick<ShareGrant, 'state' | 'revokedAt' | 'expiresAt'>>): Promise<ShareGrant | null>;
  appendEvent(event: ConsentEvent): Promise<void>;
  events(uid: string): Promise<ConsentEvent[]>;

  // Side-effect surfaces revocation must touch: pending jobs, caches, downloads.
  /** Pending jobs gated by this uid+purpose (+ optional resource). Returns ids cancelled now. */
  blockPendingJobs(uid: string, purpose: ConsentPurpose, resourceId: string | null): Promise<string[]>;
  /** Cache entries keyed by this uid+purpose. Returns ids flushed now. */
  flushCaches(uid: string, purpose: ConsentPurpose, resourceId: string | null): Promise<string[]>;
  /** In-flight/new download requests that must be refused. Returns ids blocked now. */
  blockPendingDownloads(uid: string, purpose: ConsentPurpose, resourceId: string | null): Promise<string[]>;
}

export class InMemoryConsentStore implements ConsentStore {
  readonly resourceOwners = new Map<string, Map<string, string>>();
  readonly verifiedRecipients = new Set<string>();
  readonly grants = new Map<string, ConsentGrant>();
  readonly shares = new Map<string, ShareGrant>();
  readonly history: ConsentEvent[] = [];
  readonly jobs = new Map<string, { uid: string; purpose: ConsentPurpose; resourceId: string | null; status: string }>();
  readonly caches = new Map<string, { uid: string; purpose: ConsentPurpose; resourceId: string | null }>();
  readonly downloads = new Map<string, { uid: string; purpose: ConsentPurpose; resourceId: string | null; status: 'pending' | 'blocked' }>();
  private seq = 0;

  private nextId(prefix: string) { return `${prefix}_${++this.seq}`; }

  async createGrant(grant: ConsentGrant) { this.grants.set(grant.id, grant); return grant; }
  async findGrant(id: string) { return this.grants.get(id) ?? null; }
  async findGrantBySubject(purpose: ConsentPurpose, uid: string, resourceId: string | null, consentVersion: string) {
    let latest: ConsentGrant | null = null;
    for (const g of this.grants.values()) {
      if (g.purpose === purpose && g.uid === uid && (g.resourceId ?? null) === resourceId && g.consentVersion === consentVersion) latest = g;
    }
    return latest;
  }
  async listGrants(uid: string) { return [...this.grants.values()].filter((g) => g.uid === uid); }
  async updateGrant(id, update) {
    const existing = this.grants.get(id);
    if (!existing) return null;
    const next = { ...existing, ...update };
    this.grants.set(id, next);
    return next;
  }
  async createAuthorizedShare(share: ShareGrant) {
    const owner = this.resourceOwners.get(share.resourceType)?.get(share.resourceId);
    if (!owner || owner !== share.uid || !this.verifiedRecipients.has(share.grantedToUid)) return null;
    this.shares.set(share.id, share);
    return share;
  }
  async findShare(id: string) { return this.shares.get(id) ?? null; }
  async listSharesByOwner(uid: string) { return [...this.shares.values()].filter((s) => s.uid === uid); }
  async listSharesTo(uid: string) { return [...this.shares.values()].filter((s) => s.grantedToUid === uid && s.state === 'active'); }
  async updateShare(id, update) {
    const existing = this.shares.get(id);
    if (!existing) return null;
    const next = { ...existing, ...update };
    this.shares.set(id, next);
    return next;
  }
  async appendEvent(event: ConsentEvent) { this.history.push(event); }
  async events(uid: string) { return this.history.filter((e) => e.uid === uid); }

  // ---- test/emulation helpers ----
  seedJob(key: string, uid: string, purpose: ConsentPurpose, resourceId: string | null) {
    this.jobs.set(key, { uid, purpose, resourceId, status: 'pending' });
  }
  seedCache(key: string, uid: string, purpose: ConsentPurpose, resourceId: string | null) {
    this.caches.set(key, { uid, purpose, resourceId });
  }
  seedDownload(key: string, uid: string, purpose: ConsentPurpose, resourceId: string | null) {
    this.downloads.set(key, { uid, purpose, resourceId, status: 'pending' });
  }

  async blockPendingJobs(uid, purpose, resourceId) {
    const cancelled: string[] = [];
    for (const [key, job] of this.jobs) {
      if (job.uid === uid && job.purpose === purpose && (job.resourceId ?? null) === (resourceId ?? null) && job.status === 'pending') {
        job.status = 'cancelled';
        cancelled.push(key);
      }
    }
    return cancelled;
  }
  async flushCaches(uid, purpose, resourceId) {
    const flushed: string[] = [];
    for (const [key, entry] of this.caches) {
      if (entry.uid === uid && entry.purpose === purpose && (entry.resourceId ?? null) === (resourceId ?? null)) {
        this.caches.delete(key);
        flushed.push(key);
      }
    }
    return flushed;
  }
  async blockPendingDownloads(uid, purpose, resourceId) {
    const blocked: string[] = [];
    for (const [key, d] of this.downloads) {
      if (d.uid === uid && d.purpose === purpose && (d.resourceId ?? null) === (resourceId ?? null) && d.status === 'pending') {
        d.status = 'blocked';
        blocked.push(key);
      }
    }
    return blocked;
  }
}
