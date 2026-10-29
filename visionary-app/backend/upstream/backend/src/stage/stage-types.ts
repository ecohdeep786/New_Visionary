// LEARN-14 (KAN-159) — backend-owned lifelong stage/curriculum continuity over
// the same UID: versioned authorized promotion/change events, conditional
// current-profile revisions, reviewed source/criteria mappings, retained prior
// sessions/evidence/projects and bridge gaps, preserved review due dates and
// fixed assignment labels, and post-commit plan/audience projections.
//
// Design constraints (server-owned; honest; fail closed):
//   - VERSIONED AUTHORIZED EVENTS: every stage change is an append-only,
//     versioned event carrying its authority — ordinary eligible progression
//     (from a REVIEWED mapping) applies with a notice/diff; evidence inference
//     alone is SUGGESTION-ONLY (it never auto-applies); board/institution/
//     safety-tier or larger jumps require explicit confirmation.
//   - CONDITIONAL CURRENT-PROFILE REVISIONS: the current stage profile is a
//     deterministic revision derived from the applied event set — duplicate or
//     REORDERED events converge to the same profile (revision is derived, not
//     a mutable last-write).
//   - REVIEWED MAPPINGS: a promotion requires a reviewed source/criteria
//     mapping for the jump; without one the promotion refuses
//     (`mapping_unavailable`) — no equivalent mastery is ever claimed from an
//     unreviewed mapping.
//   - RETENTION: prior sessions/evidence/projects and bridge gaps are retained
//     by construction (events append; nothing is deleted or rewritten); review
//     due dates and assignment labels are preserved (never rewritten here).
//   - POSTPONE 7 DAYS / UNDO 14 DAYS: an ordinary eligible progression may be
//     postponed by up to 7 days; a committed promotion may be undone within
//     14 days — undo appends a REVERT event, preserves work created since, and
//     never rewrites grades or claims equivalent mastery.
//   - AUTHORITY RECHECK: after institution exit, in-flight promotions refuse
//     (`exit_authority_revoked`).
//   - POST-COMMIT PROJECTIONS: plan/audience projections rebuild
//     deterministically from the committed event set (byte-stable, two-device
//     identical).
export interface StageOwner {
  uid: string;
  workspaceId: string;
}

/** The jump size class of a stage change. */
export type JumpClass = 'ordinary' | 'major';

/** Basis of a promotion proposal. */
export type PromotionBasis = 'authorized' | 'evidence_inference';

/** A reviewed source/criteria mapping between two stages. */
export interface StageMapping {
  mappingId: string;
  fromStage: string;
  toStage: string;
  sourceRef: string;
  criteriaRef: string;
  reviewedBy: string | null;
}

/** An append-only, versioned stage event. */
export interface StageEvent {
  eventId: string;
  owner: StageOwner;
  type: 'promotion' | 'revert' | 'exit';
  fromStage: string;
  toStage: string;
  mappingId: string | null;
  /** The authoritative basis recorded on the event. */
  basis: PromotionBasis;
  notice: string | null;
  committedAt: string;
}

/** The current conditional profile revision (derived from the event set). */
export interface StageProfile {
  owner: StageOwner;
  stage: string;
  /** Monotonic revision number (increments with each applied event set change). */
  revision: number;
  /** The applied event ids this revision derives from (deterministic order). */
  derivedFrom: readonly string[];
  digest: string;
}

/** A promotion proposal with its diff, notice and requirements. */
export interface PromotionProposal {
  proposalId: string;
  owner: StageOwner;
  fromStage: string;
  toStage: string;
  basis: PromotionBasis;
  jumpClass: JumpClass;
  mappingId: string;
  /** Understandable diff: concepts added and bridge gaps retained. */
  diff: { addedConcepts: readonly string[]; bridgeGaps: readonly string[] };
  notice: string;
  /** Major jumps require explicit confirmation; suggestions never auto-apply. */
  requiresConfirmation: boolean;
  suggestionOnly: boolean;
  /** Durable postpone (up to 7 days) — the proposal cannot apply before it. */
  postponedUntil: string | null;
}

export class StageError extends Error {
  readonly code:
    | 'not_owner'
    | 'workspace_mismatch'
    | 'mapping_unavailable'
    | 'confirmation_required'
    | 'evidence_suggestion_only'
    | 'postpone_invalid'
    | 'undo_window_expired'
    | 'exit_authority_revoked'
    | 'proposal_unknown'
    | 'event_unknown'
    | 'command_changed'
    | 'mapping_invalid'
    | 'exit_unknown';
  constructor(code: StageError['code']) {
    super(code);
    this.code = code;
  }
}
