// BUILD-06 (KAN-80) — exact-revision accepted-recipient sharing, consent-bound
// parent summaries and classroom-copy bridge; private drafts/conversations/
// history stay private.
//
// The checkpoint here is explicit, privacy-preserving sharing:
//   - Sharing is EXACT-REVISION: a share binds one specific project revision —
//     later private edits never leak into an existing share (the recipient sees
//     exactly the shared revision, nothing newer).
//   - Recipients are ACCEPTED: a share names explicit recipients; a non-listed
//     actor is denied (no link-based public leakage).
//   - Parent summaries are CONSENT-BOUND: a summary is produced only while the
//     guardian consent is active; a revoked/expired consent blocks summary
//     generation immediately (fail closed).
//   - Classroom-copy bridge: a teacher may copy a shared revision into a class
//     workspace as a NEW private project (ownership transfers to the class
//     owner; the original stays with its owner); private drafts, conversations
//     and revision history are NEVER copied — only the exact shared revision
//     payload.
//   - Wrong users denied everywhere; fail closed.
//
// Exit: current-document Build is server-backed without weakening existing
// privacy/recovery rules.

/** Actor/workspace ownership. */
export interface ShareOwner {
  uid: string;
  workspaceId: string;
}

/** An explicit-revision share to named accepted recipients. */
export interface RevisionShare {
  shareId: string;
  owner: ShareOwner;
  projectId: string;
  /** The exact revision being shared (later edits never leak in). */
  revisionNo: number;
  recipients: readonly string[];
  sharedAt: string;
}

/** A consent-bound parent summary request. */
export interface ParentSummaryRequest {
  summaryId: string;
  guardianUid: string;
  studentUid: string;
  projectId: string;
  /** Guardian consent state for this student's data. */
  consentActive: boolean;
}

export class SharingError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_share'
      | 'recipient_not_accepted'
      | 'consent_not_active'
      | 'unknown_revision'
      | 'unknown_project'
  ) {
    super(code);
  }
}
