// LEARN-03 (KAN-69) — versioned mastery/progress/review projections from
// immutable evidence; distinguish consumption, attempts, self-review and
// assessed outcomes.
//
// The checkpoint here is honest, versioned projection (Doc 13 / D-088):
//   - Four evidence classes stay DISTINCT and are never conflated:
//       consumption  — the learner viewed/used content (NOT mastery evidence),
//       attempts     — evidence-backed submissions (LEARN-02 records),
//       self_review  — the learner's own review marker (never assessed),
//       assessed     — rubric/outcome-rated results (the ONLY mastery evidence).
//   - Model certainty is not learner mastery: consumption, self-review and
//     model/probability signals NEVER mark a concept mastered. Only assessed
//     outcomes with rubric evidence make a concept mastery-eligible.
//   - Projections are VERSIONED and DETERMINISTIC: the same immutable evidence
//     always produces the same projection version; new evidence advances the
//     version; evidence is never mutated by projection (append-only reads).
//   - Review scheduling derives from assessed outcomes and self-reviews with
//     explicit reasons; consumption never schedules a review.
//   - Projections are private to the learner; a wrong uid/workspace is denied.
//
// Exit: distinct learning evidence the progress surfaces can trust.

/** Server-owned projection ownership. */
export interface ProjectionOwner {
  uid: string;
  workspaceId: string;
}

/**
 * The four evidence classes. `consumption` and `self_review` are context, never
 * mastery; `assessed` is the only mastery-eligible class.
 */
export type EvidenceClass = 'consumption' | 'attempt' | 'self_review' | 'assessed';

/** One immutable evidence record (append-only; projections never rewrite it). */
export interface EvidenceEvent {
  eventId: string;
  owner: ProjectionOwner;
  conceptId: string;
  evidenceClass: EvidenceClass;
  /** rubric/outcome reference — required for `assessed`, else null. */
  rubricRef: string | null;
  /** Whether the assessed outcome passed its rubric (assessed only). */
  passed: boolean | null;
  recordedAt: string;
}

/** The honest mastery verdict for one concept. */
export type MasteryState =
  | 'not_started'
  | 'consumed_only'
  | 'practiced'
  | 'self_reviewed'
  | 'assessed_not_passed'
  | 'assessed_passed';

/** A versioned projection for one concept. */
export interface ConceptProjection {
  conceptId: string;
  /** Distinct counts per evidence class — never conflated. */
  consumptionCount: number;
  attemptCount: number;
  selfReviewCount: number;
  /** Assessed outcomes: { total, passed } — the only mastery evidence. */
  assessed: { total: number; passed: number };
  masteryState: MasteryState;
  /** True only when assessed outcomes with rubric evidence back mastery. */
  masteryEligible: boolean;
  /** Review scheduling with explicit reasons (never from consumption). */
  reviewDue: { due: boolean; reason: string | null };
}

/** A versioned projection snapshot. */
export interface ProjectionSnapshot {
  owner: ProjectionOwner;
  conceptId: string;
  /** Version advances when evidence changes; identical evidence => identical version. */
  projectionVersion: number;
  /** Fingerprint of the evidence set this projection was computed from. */
  evidenceFingerprint: string;
  projection: ConceptProjection;
  computedAt: string;
}

export class ProjectionError extends Error {
  constructor(
    public readonly code: 'not_owner' | 'unknown_evidence' | 'assessed_without_rubric'
  ) {
    super(code);
  }
}
