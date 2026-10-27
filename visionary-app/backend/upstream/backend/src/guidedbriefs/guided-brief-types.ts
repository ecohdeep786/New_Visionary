// BUILD-03 (KAN-77) — verified guided briefs pinned to objective/source/rubric/
// check/practice evidence; blank projects stay available without guided-learning
// gates.
//
// The checkpoint here is evidence-pinned guided creation:
//   - A guided brief is VERIFIED: it may only pin an objective, source
//     revision, rubric, check and practice evidence that the server can prove
//     (released revision; existing check/rubric). A brief pinning unprovable
//     evidence is refused — a generated brief is not committed product state
//     until it verifies.
//   - Blank projects stay AVAILABLE without guided-learning gates: creating a
//     project with no brief requires no evidence, no verification and no gate —
//     guided learning is an optional layer, never a precondition for Build.
//   - Briefs are versioned and immutable once verified: amending a brief
//     creates a new version; the pinned evidence digest travels with the brief
//     so the pinned state is auditable.
//   - Wrong users denied; unknown evidence refused; fail closed.
//
// Exit: current-document Build is server-backed without weakening existing
// privacy/recovery rules.

/** Actor/workspace ownership. */
export interface BriefOwner {
  uid: string;
  workspaceId: string;
}

/** The evidence a guided brief pins (each must verify server-side). */
export interface BriefPins {
  /** The learning objective concept. */
  objectiveConceptId: string;
  sourceVersion: string;
  /** Rubric reference for the guided outcome. */
  rubricRef: string;
  /** The check the brief builds toward. */
  checkId: string;
  /** Practice evidence ids already recorded for this concept. */
  practiceEvidenceIds: readonly string[];
}

/** A verified guided brief. */
export interface GuidedBrief {
  briefId: string;
  owner: BriefOwner;
  projectId: string;
  pins: BriefPins;
  /** Version of the brief (amendments append versions). */
  version: number;
  /** Digest of the exact pinned evidence set. */
  pinsDigest: string;
  status: 'verified';
  createdAt: string;
}

export class GuidedBriefError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_project'
      | 'evidence_not_verified'
      | 'evidence_missing'
  ) {
    super(code);
  }
}
