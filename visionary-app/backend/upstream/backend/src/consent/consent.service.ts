// DATA-05 — consent/share service: server-authorized purpose grants, expiry,
// revocation (which must block pending jobs, caches and newly requested
// downloads) and policy versions. Cache is never authority and time alone never
// revives a grant. Only the data subject (or verified delegating authority)
// grants or revokes their own consent; shares are created by the resource owner.
import { createHash, randomBytes } from 'node:crypto';
import type { ConsentGrant, ConsentPurpose, ConsentShareCommand, ConsentCommand, ConsentView, RevocationOutcome, ShareGrant, ConsentVersion, ConsentEvent } from './consent-types';
import type { ConsentStore } from './consent-store';

export class ConsentPolicyError extends Error {
  constructor(public readonly code: 'unauthorized' | 'wrong_subject' | 'missing_version' | 'unknown_purpose' | 'not_found' | 'revoked' | 'expired' | 'idempotent_duplicate' | 'foreign_share_target' | 'expiry_forbidden') {
    super(code);
  }
}

const KNOWN_PURPOSES: ConsentPurpose[] = ['learning_sessions', 'document_sharing', 'downloads', 'model_context', 'telemetry_optional'];
const MAX_EXPIRY_SECONDS = 366 * 24 * 60 * 60; // cap grant length at ~1 year; renewal requires fresh grant

export interface ConsentServiceOptions {
  now?: () => Date;
  idBytes?: number;
}

export class ConsentService {
  private readonly now: () => Date;
  private readonly idBytes: number;
  private readonly events: string[] = [];

  constructor(private readonly store: ConsentStore, options: ConsentServiceOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.idBytes = options.idBytes ?? 12;
  }

  history() { return this.events.slice(); }
  private when() { return this.now().toISOString(); }
  private newId(prefix: string) { return `${prefix}_${randomBytes(this.idBytes).toString('hex')}`; }
  private knownPurpose(p: unknown): p is ConsentPurpose { return typeof p === 'string' && (KNOWN_PURPOSES as string[]).includes(p); }

  private event(grant: ConsentGrant, from: ConsentView['state'], to: ConsentView['state'], reason: ConsentEvent['reason']): ConsentEvent {
    return { id: `ev_${this.when()}_${grant.id}`, grantId: grant.id, uid: grant.uid, from, to, purpose: grant.purpose,
      resourceId: grant.resourceId, consentVersion: grant.consentVersion, actorId: grant.uid, reason, happenedAt: this.when() };
  }

  private view(grant: ConsentGrant): ConsentView {
    return { id: grant.id, purpose: grant.purpose, resourceId: grant.resourceId, consentVersion: grant.consentVersion,
      state: grant.state, grantedAt: grant.grantedAt, expiresAt: grant.expiresAt, revokedAt: grant.revokedAt };
  }

  private hydrateActive(grant: ConsentGrant): ConsentGrant {
    // Time alone revives nothing: expiry marks a grant expired, never revoked.
    if (grant.state === 'active' && grant.revokedAt) return { ...grant, state: 'revoked' };
    if (grant.state === 'active' && grant.expiresAt && new Date(grant.expiresAt).getTime() <= this.now().getTime()) {
      return { ...grant, state: 'expired' };
    }
    return grant;
  }

  /** Grant (or renew) consent for the data subject on a purpose + policy version. */
  async grant(uid: string, command: ConsentCommand): Promise<ConsentView> {
    if (command.uid !== uid) throw new ConsentPolicyError('wrong_subject');
    if (!this.knownPurpose(command.purpose)) throw new ConsentPolicyError('unknown_purpose');
    if (!command.consentVersion || !/^v?\d+(\.\d+){0,3}$/.test(command.consentVersion)) throw new ConsentPolicyError('missing_version');
    const resourceId = command.resourceId ?? null;
    const existing = await this.store.findGrantBySubject(command.purpose, uid, resourceId);
    if (existing) {
      const current = this.hydrateActive(existing);
      // Idempotent replay of the same subject/purpose: return current state.
      if (current.state === 'active') return this.view(current);
      if (current.state === 'revoked') throw new ConsentPolicyError('revoked'); // must re-grant as a fresh grant after revocation
    }
    const expiresIn = command.expiresInSeconds;
    if (expiresIn !== undefined && (!Number.isSafeInteger(expiresIn) || expiresIn <= 0 || expiresIn > MAX_EXPIRY_SECONDS)) {
      throw new ConsentPolicyError('expiry_forbidden');
    }
    const at = this.when();
    const grant: ConsentGrant = {
      id: this.newId('cg'), uid, purpose: command.purpose, resourceId, consentVersion: command.consentVersion,
      grantedAt: at, expiresAt: expiresIn !== undefined ? new Date(this.now().getTime() + expiresIn * 1000).toISOString() : null,
      revokedAt: null, state: 'active',
    };
    await this.store.createGrant(grant);
    await this.store.appendEvent(this.event(grant, 'active', 'active', 'grant'));
    this.events.push(`grant ${grant.id}`);
    return this.view(grant);
  }

  /** Revoke consent immediately. Blocked pending jobs, cache flush and download refusals are reported. */
  async revoke(uid: string, grantId: string): Promise<RevocationOutcome> {
    const grant = await this.store.findGrant(grantId);
    if (!grant) throw new ConsentPolicyError('not_found');
    if (grant.uid !== uid) throw new ConsentPolicyError('wrong_subject');
    const current = this.hydrateActive(grant);
    if (current.state === 'revoked') throw new ConsentPolicyError('revoked');
    const at = this.when();
    await this.store.updateGrant(grantId, { state: 'revoked', revokedAt: at });
    await this.store.appendEvent(this.event(current, current.state, 'revoked', 'revocation'));
    // Revocation must affect pending jobs, caches and freshly requested downloads.
    const blockedJobs = await this.store.blockPendingJobs(uid, grant.purpose, grant.resourceId);
    const flushedCaches = await this.store.flushCaches(uid, grant.purpose, grant.resourceId);
    const blockedDownloads = await this.store.blockPendingDownloads(uid, grant.purpose, grant.resourceId);
    this.events.push(`revoke ${grantId}`);
    return { grantId, state: 'revoked', blockedPendingJobs: blockedJobs.length, flushedCaches: flushedCaches.length, blockedDownloads: blockedDownloads.length };
  }

  /** Share a resource to a verified recipient uid under a purpose + version. */
  async share(ownerUid: string, command: ConsentShareCommand): Promise<ShareGrant> {
    if (command.uid !== ownerUid) throw new ConsentPolicyError('wrong_subject');
    if (!this.knownPurpose(command.purpose)) throw new ConsentPolicyError('unknown_purpose');
    if (!command.consentVersion || !/^v?\d+(\.\d+){0,3}$/.test(command.consentVersion)) throw new ConsentPolicyError('missing_version');
    if (!command.grantedToUid || /[@\s]/.test(command.grantedToUid)) throw new ConsentPolicyError('foreign_share_target');
    if (command.grantedToUid === ownerUid) throw new ConsentPolicyError('foreign_share_target');
    const expiresIn = command.expiresInSeconds;
    if (expiresIn !== undefined && (!Number.isSafeInteger(expiresIn) || expiresIn <= 0 || expiresIn > MAX_EXPIRY_SECONDS)) {
      throw new ConsentPolicyError('expiry_forbidden');
    }
    const at = this.when();
    const share: ShareGrant = {
      id: this.newId('sg'), uid: ownerUid, resourceType: command.resourceType, resourceId: command.resourceId,
      grantedToUid: command.grantedToUid, purpose: command.purpose, scope: command.scope,
      consentVersion: command.consentVersion, grantedAt: at,
      expiresAt: expiresIn !== undefined ? new Date(this.now().getTime() + expiresIn * 1000).toISOString() : null,
      revokedAt: null, state: 'active',
    };
    await this.store.createShare(share);
    this.events.push(`share ${share.id}`);
    return share;
  }

  /** Revoke a share. Recipient-side grants are not touched; owner revokes. */
  async revokeShare(ownerUid: string, shareId: string): Promise<ShareGrant> {
    const share = await this.store.findShare(shareId);
    if (!share) throw new ConsentPolicyError('not_found');
    if (share.uid !== ownerUid) throw new ConsentPolicyError('wrong_subject');
    if (share.state === 'revoked') throw new ConsentPolicyError('revoked');
    const at = this.when();
    const updated = await this.store.updateShare(shareId, { state: 'revoked', revokedAt: at });
    this.events.push(`revokeShare ${shareId}`);
    return updated!;
  }

  /** Read the subject's grants (self-service) with expiry/revocation hydration. */
  async list(uid: string): Promise<ConsentView[]> {
    const grants = await this.store.listGrants(uid);
    return grants.map((g) => this.view(this.hydrateActive(g)));
  }

  /** Still-active consent check used by sensitive operations (jobs, downloads). */
  async check(uid: string, purpose: ConsentPurpose, resourceId?: string): Promise<boolean> {
    if (!this.knownPurpose(purpose)) return false;
    const grant = await this.store.findGrantBySubject(purpose, uid, resourceId ?? null);
    if (grant) {
      const current = this.hydrateActive(grant);
      if (current.state === 'active') return true;
      // Lazily persist expiry so it is durable, not recomputed forever.
      if (current.state === 'expired' && grant.state === 'active') await this.store.updateGrant(grant.id, { state: 'expired' });
    }
    return false;
  }

  /** Share visibility for the recipient — only active, unexpired shares. Time alone never revives a share. */
  async sharesFor(uid: string): Promise<ShareGrant[]> {
    const rows = await this.store.listSharesTo(uid);
    const now = this.now().getTime();
    return rows
      .filter((s) => !(s.expiresAt && new Date(s.expiresAt).getTime() <= now))
      .map((s) => ({ ...s, state: 'active' as const }));
  }

  /** Append-only lifecycle history for the subject. */
  async track(uid: string): Promise<ConsentEvent[]> {
    return this.store.events(uid);
  }
}
