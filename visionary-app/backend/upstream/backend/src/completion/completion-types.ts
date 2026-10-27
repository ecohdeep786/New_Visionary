// BUILD-07 (KAN-81) — preserve completion criteria and professional
// self-review versioning; application evidence remains unverified until
// assessment and never awards mastery automatically.
//
// The checkpoint here is honest completion + self-review bookkeeping:
//   - Completion criteria are VERSIONED and explicit: a project's completion
//     claim is measured against one specific criteria version — the same
//     evidence against the same criteria version yields the same verdict.
//   - Professional self-reviews are VERSIONED: each self-review appends a new
//     immutable version (earlier self-reviews stay byte-stable); self-review is
//     the professional's OWN record, never an assessed outcome.
//   - Application evidence remains UNVERIFIED until assessment: submitting
//     application evidence marks it `unverified`; only an explicit assessment
//     record (with rubric provenance) moves it to `verified`. Nothing in this
//     domain ever awards mastery automatically — mastery flows only from the
//     assessed evidence the LEARN-03 projections consume.
//   - Wrong users denied; fail closed.
//
// Exit: current-document Build is server-backed without weakening existing
// privacy/recovery rules.

/** Actor/workspace ownership. */
export interface ReviewOwner {
  uid: string;
  workspaceId: string;
}

/** Versioned completion criteria for a project. */
export interface CompletionCriteria {
  criteriaId: string;
  projectId: string;
  version: number;
  /** Explicit criteria items (each checkable). */
  items: readonly { itemId: string; description: string }[];
}

/** A project's completion claim measured against one criteria version. */
export interface CompletionVerdict {
  projectId: string;
  criteriaVersion: number;
  satisfiedItemIds: readonly string[];
  missingItemIds: readonly string[];
  complete: boolean;
}

/** A versioned professional self-review (the professional's OWN record). */
export interface SelfReview {
  reviewId: string;
  owner: ReviewOwner;
  projectId: string;
  version: number;
  sections: readonly { title: string; body: string }[];
  createdAt: string;
}

/** Application evidence: unverified until assessed; never auto-mastery. */
export interface ApplicationEvidence {
  evidenceId: string;
  owner: ReviewOwner;
  projectId: string;
  payload: unknown;
  /** 'unverified' until an explicit assessment record lands. */
  status: 'unverified' | 'verified';
  assessmentRef: string | null;
  assessedAt: string | null;
}

export class CompletionError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_criteria'
      | 'unknown_evidence'
      | 'already_assessed'
  ) {
    super(code);
  }
}
