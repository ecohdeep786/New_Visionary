// ROLE-05 (KAN-97) — separate professional personal/company records,
// sponsored membership and explicit portfolio/project shares types.
export interface ProOwner { uid: string; workspaceId: string }

export type RecordScope = 'personal' | 'company';

/** A professional record — personal and company scopes are strictly separate. */
export interface ProRecord {
  recordId: string;
  ownerUid: string;
  workspaceId: string;
  scope: RecordScope;
  /** For company records: the company scope it belongs to. */
  companyId: string | null;
  kind: string;
  value: string;
  createdAt: string;
}

/** Sponsored membership: company benefits ONLY — never personal-learning access. */
export interface Sponsorship {
  sponsorshipId: string;
  companyId: string;
  memberUid: string;
  tier: string;
  sponsoredBy: string;
  /** Fixed by construction: sponsorship grants no personal-learning access. */
  grantsPersonalLearningAccess: false;
}

/** An explicit, revocable share of one item to one company. */
export interface ShareGrant {
  shareId: string;
  ownerUid: string;
  companyId: string;
  itemType: 'portfolio' | 'project';
  itemRef: string;
  purpose: string;
  revoked: boolean;
}

export class ProfessionalError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'scope_mismatch'
      | 'personal_learning_forbidden'
      | 'sponsor_only'
      | 'share_grant_required'
      | 'profile_definition_invalid'
  ) {
    super(code);
  }
}
