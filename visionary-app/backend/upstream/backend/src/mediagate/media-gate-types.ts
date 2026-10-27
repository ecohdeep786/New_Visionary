// CONTENT-07 (KAN-66) — media delivery authorization gate.
//
// The checkpoint here is server-owned delivery authorization for source media:
//   - Official approved embeds are PRESERVED where suitable: an official embed
//     (e.g. an approved publisher/board page or an institution-sanctioned host)
//     is deliverable only when the owning source node is released + eligible
//     (published, public, approved) and the embed's rights gate passes. A
//     frontend media label is a CLAIM, never a delivery proof.
//   - Owned media processing/delivery is added ONLY when released content
//     requires it AND the rights, privacy and cost gates all pass. If any gate
//     fails, the owned media reports an honest blocked/withheld state — fail
//     closed, exactly like a withdrawal.
//   - Delivery is server-live: it is recomputed from the injected store on every
//     call and carries no authoritative cache (CACHE-01 / KAN-141). A
//     withdrawal, a demoted pointer or a newly failed gate drops a media item
//     from delivery immediately.
//   - Learners receive only authorized, supported, published versions.
//
// Exit: learners receive only authorized, supported, published versions.

/** How a piece of media is provided to a learner. */
export type MediaKind = 'official_embed' | 'owned_media';

/**
 * Per-media gate state. Every media pointer carries rights/privacy/cost gates;
 * a gate is 'approved' only when the corresponding review signed it off.
 * 'blocked' means the gate review (or an operator withdrawal) denied it.
 */
export type MediaGateState = 'approved' | 'blocked';

/** Source-release state mirrored from the catalog (CONTENT-01/06). */
export type SourceReleaseState = 'pending' | 'approved' | 'released' | 'rejected';

/** One media pointer on a released source node. */
export interface MediaPointer {
  /** Stable per-source media key (unique within the source version). */
  mediaKey: string;
  /** Whatever the media is: official approved embed or owned media object. */
  kind: MediaKind;
  /** Official embed URL (kind=official_embed) or owned object ref (kind=owned_media). */
  ref: string;
  /** The three delivery gates. Only an 'approved' gate passes. */
  rights: MediaGateState;
  privacy: MediaGateState;
  cost: MediaGateState;
}

/** The eligibility and media facts the gate needs mapped from the store. */
export interface SourceMediaFacts {
  nodeKey: string;
  /** Source version this media belongs to (a different version inherits none). */
  nodeVersion: string;
  sourceRelease: SourceReleaseState;
  /** Catalog eligibility: published + public + source approved/released + ancestors. */
  eligibleForDelivery: boolean;
  /** Media pointers declared for this exact node version. */
  media: readonly MediaPointer[];
}

/** Honest reason a media item is not deliverable (fail-closed states only). */
export type DeliveryBlockReason =
  | 'rights_gate'
  | 'privacy_gate'
  | 'cost_gate'
  | 'not_published'
  | 'source_not_released'
  | 'unknown_node'
  | 'unknown_media';

/** Verdict for one media pointer. */
export interface MediaDeliveryItem {
  mediaKey: string;
  kind: MediaKind;
  ref: string;
  status: 'deliverable' | 'blocked';
  /** Present exactly when status is 'blocked'. */
  reason?: DeliveryBlockReason;
}

/** The per-node delivery outcome. */
export interface NodeMediaDelivery {
  nodeKey: string;
  nodeVersion: string;
  /** Media a learner may actually receive, in published order. */
  deliverable: readonly MediaDeliveryItem[];
  /** Media that must NOT be delivered, with the honest reason. */
  blocked: readonly MediaDeliveryItem[];
}

/** Full server-live media delivery report. */
export interface MediaDeliveryReport {
  nodes: readonly NodeMediaDelivery[];
  decisionSource: 'server-live';
  evaluatedAt: string;
}

/** A frontend media label: a CLAIM that this media exists for learners. */
export interface MediaClaim {
  nodeKey: string;
  /** The media key the frontend labels as available. */
  mediaKey: string;
}

/** Result of evaluating one claim (media labels never establish delivery). */
export interface ClaimMediaEvaluation {
  nodeKey: string;
  mediaKey: string;
  /** True only if the backend gates approve delivery for this exact media. */
  proved: boolean;
  status: 'deliverable' | 'blocked' | 'unknown_node' | 'unknown_media';
  /** Present when blocked: the reason a learner may not receive it. */
  reason?: DeliveryBlockReason;
}
