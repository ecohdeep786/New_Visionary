// PRIV-07 (KAN-116) — launch privacy/commercial disclosures and
// content/model/provider rights review with accountable owners; approvals
// recorded SEPARATELY.
//
// The checkpoint here is an accountable disclosure/rights registry:
//   - DISCLOSURES: privacy and commercial disclosure drafts are recorded with
//     a version and an ACCOUNTABLE OWNER — a disclosure without an owner
//     refuses.
//   - APPROVALS ARE SEPARATE RECORDS: the disclosure itself NEVER carries an
//     approved flag; publishing requires a distinct approval record binding
//     the EXACT disclosure version (approving v1 does not approve v2), with
//     the approver identity and date. An unapproved disclosure cannot publish.
//   - RIGHTS REVIEW: every content source, model and provider in the launch
//     set requires a rights-review record with an accountable owner and the
//     reviewed rights scope; a missing review refuses the launch checklist.
//   - HONEST CHECKLIST: the launch checklist reports approved vs pending per
//     item — never a blanket claim.
//
// Exit: real-user data has enforceable access, lifecycle and support
// procedures — with the disclosures and rights review to match.

/** Who is accountable for a disclosure or rights review. */
export interface AccountableOwner {
  ownerId: string;
  role: string;
}

/** A privacy/commercial disclosure draft (never self-approving). */
export interface Disclosure {
  disclosureId: string;
  kind: 'privacy' | 'commercial';
  version: number;
  title: string;
  body: string;
  accountableOwner: AccountableOwner;
}

/** A separate approval record binding the exact disclosure version. */
export interface DisclosureApproval {
  disclosureId: string;
  version: number;
  approver: AccountableOwner;
  approvedAt: string;
}

/** A rights-review record for content/model/provider. */
export interface RightsReview {
  reviewId: string;
  subjectKind: 'content_source' | 'model' | 'provider';
  subjectId: string;
  accountableOwner: AccountableOwner;
  /** The reviewed rights scope (what use is approved). */
  rightsScope: string;
}

export class DisclosureError extends Error {
  constructor(
    public readonly code:
      | 'owner_required'
      | 'not_approved'
      | 'version_mismatch'
      | 'rights_review_missing'
      | 'unknown_disclosure'
  ) {
    super(code);
  }
}
