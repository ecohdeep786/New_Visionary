// CONTENT-03 (KAN-62) — draft/review/release/withdrawal/restore lifecycle with
// atomic publication/index pointer changes; incomplete ingestion cannot appear
// published.
//
// Boundaries this module keeps (docs/architecture/BACKEND_LAUNCH_CHECKLIST.md):
//   - The catalog (CONTENT-01, KAN-60) owns stable content node ids and
//     source-version approval. Node/source identity is mirrored here by shape
//     (provider/edition/version + nodeKey) and integrated, not imported.
//   - Ingestion (CONTENT-02, KAN-61) owns extraction readiness. The caller
//     presents a readiness receipt { jobId, inputDigest, evaluationPassed }; a
//     publication can neither be created nor released from incomplete ingestion.
//   - Retrieval gating (CONTENT-05, KAN-64) owns workspace/role/consent
//     filtering of readers. This module exposes the released pointer only when
//     the publication is actually released; withdrawn pointers stop new access
//     immediately.
//   - Review authority is a separate actor: the owner cannot approve their own
//     publication (content/education review responsibility; the founder gate
//     remains the human authority for launch acceptance).
//
// Lifecycle: draft → in_review → (approved) → released → withdrawn →
// restore → in_review → … Restore deliberately re-enters REVIEW, never
// released: withdrawn content cannot reappear without a fresh approval and an
// atomic pointer swap. Every release bumps the pointer revision through a
// compare-and-swap, so readers see the old or the new pointer — never a
// partially applied change — and a replayed release command is idempotent
// while a conflicting one is refused.

export type PublicationState='draft'|'in_review'|'released'|'withdrawn';

/** The released pointer: what authorized readers may currently resolve. */
export interface PublicationPointer {
  nodeKey:string;
  source:SourceVersionIdentity;
  /** Monotonic per nodeKey; bumps only through an atomic compare-and-swap. */
  revision:number;
  /** Digest binding nodeKey+source+revision+ingestion receipt for CAS replay. */
  targetDigest:string;
  releasedAt:string;
}

/** Source-version identity mirrored from the catalog by shape (CONTENT-01). */
export interface SourceVersionIdentity {
  provider:string;
  edition:string;
  version:string;
}

/**
 * Ingestion readiness receipt mirrored from CONTENT-02 by shape: a succeeded
 * job whose deterministic evaluation passed. Anything else is incomplete and
 * can never appear published.
 */
export interface IngestionReadiness {
  jobId:string;
  inputDigest:string;
  evaluationPassed:boolean;
}

export interface ReviewApproval {
  reviewerUid:string;
  decidedAt:string;
  note:string;
}

export type PublicationEventType=
  |'created'|'submitted_for_review'|'review_approved'|'review_rejected'
  |'released'|'released_replay'|'withdrawn'|'restored';

export interface PublicationEvent {
  seq:number;
  at:string;
  type:PublicationEventType;
  actorUid:string;
  detail:string;
}

export interface PublicationRecord {
  publicationId:string;
  nodeKey:string;
  ownerUid:string;
  workspaceId:string|null;
  source:SourceVersionIdentity;
  state:PublicationState;
  /** Current pointer revision; 0 until the first release. */
  revision:number;
  /** Present only while state is released. */
  pointer:PublicationPointer|null;
  review:ReviewApproval|null;
  rejection:ReviewApproval|null;
  ingestion:IngestionReadiness;
  history:readonly PublicationEvent[];
  createdAt:string;
  updatedAt:string;
}

export interface PublicationEventPage {
  events:readonly PublicationEvent[];
  nextCursor:number|null;
}
