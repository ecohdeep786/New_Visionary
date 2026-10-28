// ROLE-04 (KAN-96) — verified guardian relationships, granular purpose/expiry
// and explicit fixed summaries/goals/classwork digests types.
export interface Owner { uid: string; workspaceId: string }

/** A server-verified guardian relationship (never self-claimed). */
export interface GuardianLink {
  linkId: string;
  learnerUid: string;
  guardianUid: string;
  verified: boolean;
  verifiedBy: string | null;
}

/** Granular purpose of a guardian access grant. */
export type GrantPurpose = 'progress_summary' | 'goals' | 'classwork_digest';

/** One purpose/expiry-bound access grant (revocation is permanent). */
export interface AccessGrant {
  grantId: string;
  learnerUid: string;
  guardianUid: string;
  purpose: GrantPurpose;
  expiresAt: string;
  status: 'active' | 'revoked';
}

/** An explicit FIXED digest snapshot (immutable; no private content). */
export interface Digest {
  digestId: string;
  learnerUid: string;
  purpose: GrantPurpose;
  content: Record<string, string>;
  contentHash: string;
  generatedAt: string;
}

/** An append-only share of one digest to one guardian. */
export interface DigestShare {
  shareId: string;
  digestId: string;
  grantId: string;
  guardianUid: string;
  sharedAt: string;
  status: 'shared' | 'revoked';
}

export class GuardianError extends Error {
  readonly code:
    | 'not_owner'
    | 'guardian_unverified'
    | 'purpose_not_granted'
    | 'grant_expired'
    | 'grant_revoked'
    | 'private_content_forbidden'
    | 'digest_definition_invalid';
  constructor(code: GuardianError['code']) {
    super(code);
    this.code = code;
  }
}
