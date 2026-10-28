// ROLE-04 (KAN-96) — verified guardian relationships, granular purpose/expiry
// grants and explicit fixed digests; revocation/reconsent never revives old
// shares.
//
// Core responsibilities (server-owned; granular; fail closed):
//   1. VERIFIED guardian relationships: only a SERVER-verified link grants
//      anything (self-claimed guardianship refuses `guardian_unverified`);
//      the learner (owner) grants and revokes.
//   2. GRANULAR purpose/expiry: every grant binds ONE purpose
//      (progress_summary | goals | classwork_digest) and an expiry — access
//      beyond the granted purpose refuses (`purpose_not_granted`); expired
//      grants refuse (`grant_expired`).
//   3. EXPLICIT FIXED digests: a digest is an immutable snapshot generated
//      from permitted fields ONLY — a digest carrying private chat/draft
//      content refuses at generation (`private_content_forbidden`); the
//      content hash is byte-stable on re-read.
//   4. REVOCATION/RECONSENT NEVER REVIVES OLD SHARES: revoking a grant ends
//      its access permanently (`grant_revoked`); re-consent creates a NEW
//      grant and a NEW share — the old share stays revoked in the
//      append-only history.
import type {
  AccessGrant,
  Digest,
  DigestShare,
  GuardianError as GuardianErrorType,
  GrantPurpose,
  GuardianLink,
  Owner,
} from './guardian-types';
import { GuardianError } from './guardian-types';
import type { GuardianStore } from './guardian-lookups';

import { createHash } from 'node:crypto';

const PRIVATE_HINTS = ['chat', 'draft', 'transcript', 'learner_text', 'conversation'];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class GuardianService {
  private linkCounter = 0;
  private grantCounter = 0;
  private digestCounter = 0;
  private shareCounter = 0;

  constructor(
    private readonly store: GuardianStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Record a guardian link (verified only by a named verifier). */
  async verifyGuardianLink(learner: Owner, guardianUid: string, verifiedBy: string): Promise<GuardianLink> {
    if (!verifiedBy?.trim()) throw new GuardianError('guardian_unverified');
    const link: GuardianLink = {
      linkId: `lnk_${++this.linkCounter}`,
      learnerUid: learner.uid,
      guardianUid,
      verified: true,
      verifiedBy,
    };
    await this.store.saveLink(link);
    return link;
  }

  /** Grant one granular purpose with expiry (learner-only; link must be verified). */
  async grantAccess(learner: Owner, guardianUid: string, purpose: GrantPurpose, ttlMs: number): Promise<AccessGrant> {
    const links = await this.findVerifiedLink(learner.uid, guardianUid);
    if (!links.length) throw new GuardianError('guardian_unverified');
    const grant: AccessGrant = {
      grantId: `grt_${++this.grantCounter}`,
      learnerUid: learner.uid,
      guardianUid,
      purpose,
      expiresAt: new Date(this.now().getTime() + ttlMs).toISOString(),
      status: 'active',
    };
    await this.store.saveGrant(grant);
    return grant;
  }

  /** Revoke a grant (learner-only; PERMANENT — re-consent creates a new grant). */
  async revokeGrant(learner: Owner, grantId: string): Promise<AccessGrant> {
    const grant = await this.requireOwnedGrant(learner, grantId);
    const revoked: AccessGrant = { ...grant, status: 'revoked' };
    await this.store.saveGrant(revoked);
    // Cascade: the grant's outstanding shares end with it (append-only
    // history keeps them revoked — re-consent never revives them).
    for (const share of await this.store.sharesByGrant(grantId)) {
      if (share.status === 'shared') {
        await this.store.saveShare({ ...share, status: 'revoked' });
      }
    }
    return revoked;
  }

  /** Generate one explicit FIXED digest from permitted fields only. */
  async generateDigest(learner: Owner, purpose: GrantPurpose, content: Record<string, string>): Promise<Digest> {
    for (const key of Object.keys(content)) {
      if (PRIVATE_HINTS.some((h) => key.toLowerCase().includes(h))) {
        throw new GuardianError('private_content_forbidden');
      }
    }
    const digest: Digest = {
      digestId: `dig_${++this.digestCounter}`,
      learnerUid: learner.uid,
      purpose,
      content: { ...content },
      contentHash: createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 16),
      generatedAt: this.now().toISOString(),
    };
    await this.store.saveDigest(digest);
    return digest;
  }

  /** Share one digest under an ACTIVE, matching-purpose, unexpired grant. */
  async shareDigest(learner: Owner, digestId: string, grantId: string): Promise<DigestShare> {
    const digest = await this.store.digest(digestId);
    if (!digest || digest.learnerUid !== learner.uid) throw new GuardianError('not_owner');
    const grant = await this.requireOwnedGrant(learner, grantId);
    if (grant.status === 'revoked') throw new GuardianError('grant_revoked');
    if (this.now().getTime() >= new Date(grant.expiresAt).getTime()) {
      throw new GuardianError('grant_expired');
    }
    if (grant.purpose !== digest.purpose) throw new GuardianError('purpose_not_granted');
    const share: DigestShare = {
      shareId: `shr_${++this.shareCounter}`,
      digestId,
      grantId,
      guardianUid: grant.guardianUid,
      sharedAt: this.now().toISOString(),
      status: 'shared',
    };
    await this.store.saveShare(share);
    return share;
  }

  /** Guardian reads a shared digest: share active + grant active/unexpired + link verified. */
  async readDigest(guardianUid: string, shareId: string, nowMs?: number): Promise<Digest> {
    const share = await this.store.share(shareId);
    if (!share || share.guardianUid !== guardianUid) throw new GuardianError('not_owner');
    if (share.status === 'revoked') throw new GuardianError('grant_revoked');
    const grant = await this.store.grant(share.grantId);
    if (!grant) throw new GuardianError('not_owner');
    if (grant.status === 'revoked') throw new GuardianError('grant_revoked');
    const at = nowMs ?? this.now().getTime();
    if (at >= new Date(grant.expiresAt).getTime()) throw new GuardianError('grant_expired');
    const links = await this.findVerifiedLink(grant.learnerUid, guardianUid);
    if (!links.length) throw new GuardianError('guardian_unverified');
    const digest = await this.store.digest(share.digestId);
    if (!digest) throw new GuardianError('not_owner');
    return digest;
  }

  /** Revoke one share (learner-only; the append-only history keeps it revoked). */
  async revokeShare(learner: Owner, shareId: string): Promise<DigestShare> {
    const share = await this.store.share(shareId);
    if (!share) throw new GuardianError('not_owner');
    const digest = await this.store.digest(share.digestId);
    if (!digest || digest.learnerUid !== learner.uid) throw new GuardianError('not_owner');
    const revoked: DigestShare = { ...share, status: 'revoked' };
    await this.store.saveShare(revoked);
    return revoked;
  }

  private async findVerifiedLink(learnerUid: string, guardianUid: string): Promise<GuardianLink[]> {
    const links: GuardianLink[] = [];
    for (let i = 1; i <= this.linkCounter; i++) {
      const link = await this.store.link(`lnk_${i}`);
      if (link && link.learnerUid === learnerUid && link.guardianUid === guardianUid) links.push(link);
    }
    return links.filter((l) => l.verified);
  }

  private async requireOwnedGrant(learner: Owner, grantId: string): Promise<AccessGrant> {
    const grant = await this.store.grant(grantId);
    if (!grant || grant.learnerUid !== learner.uid) throw new GuardianError('not_owner');
    return grant;
  }
}

export type { GuardianErrorType };
