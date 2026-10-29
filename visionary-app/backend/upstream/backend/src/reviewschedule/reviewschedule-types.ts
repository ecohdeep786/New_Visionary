// LEARN-11 (KAN-147) — versioned durable review scheduling from assessed
// evidence with bounded baseline SRS rules, due-queue projections, command
// deduplication, timezone/quiet/preference handling and two-device recovery.
//
// Design constraints (server-owned; honest; fail closed):
//   - BOUNDED BASELINE SRS: scheduling uses a VERSIONED, explicitly-approved
//     baseline rules object — never an unvalidated exponential formula.
//     Personalized forgetting claims require a CALIBRATED baseline (measured);
//     before calibration, projections carry only the baseline reason.
//   - SCHEDULING FROM ASSESSED EVIDENCE ONLY: a review reschedule derives only
//     from assessed evidence (LEARN-02 attempts). Self-rating NEVER reschedules;
//     it is recorded separately and preserved for manual control.
//   - DUE-QUEUE PROJECTIONS are deterministic rebuilds from assessed evidence +
//     bounded baseline rules + manual control; every due item carries an
//     understandable reason. Projections are versioned and append, never
//     rewrite assessed evidence.
//   - COMMAND DEDUPLICATION: each scheduling/rating command carries a stable
//     mutation key; a repeated command with the SAME payload converges
//     idempotently, a repeated command with a CHANGED payload refuses
//     (`command_changed`) — recovery/retry never double-schedules.
//   - TIMEZONE/QUIET/PREFERENCES: a due projection respects the owner's saved
//     timezone and quiet hours (never due inside quiet hours unless explicit).
//   - TWO-DEVICE RECOVERY: two controllers over the same store observe the
//     identical byte-stable due queue (identical projection digest).
//   - NO RETENTION TTLs: no unvalidated retention/purge TTL is applied.
export interface ReviewOwner {
  uid: string;
  workspaceId: string;
}

/** Grade a scheduled review item receives (bounded baseline ladder). */
export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

/**
 * VERSIONED, APPROVED bounded baseline SRS rules. The interval ladder is an
 * explicit, human-approved table — not an unvalidated exponential formula.
 * `calibrated` flips true only when forgetting estimates were MEASURED against
 * real evidence; until then projections carry only the uncalibrated baseline.
 */
export interface BaselineRules {
  rulesId: string;
  version: number;
  /** Bounded interval ladder days per grade (again < hard <= good <= easy). */
  ladder: Record<ReviewGrade, number>;
  /** Maximum permitted interval in days (bounded — never open-ended). */
  maxIntervalDays: number;
  /** Personalized-forgetting calibration (measured, not invented). */
  calibrated: boolean;
  approvedBy: string | null;
}

/** Assessed evidence reference (LEARN-02 attempt outcome, durable). */
export interface AssessedEvidence {
  evidenceId: string;
  conceptId: string;
  /** Server-assessed outcome; only this reschedules a review. */
  grade: ReviewGrade;
  assessedAt: string;
  /** Server-side command payload revision (dedup + change detection). */
  payloadVersion: number;
}

/** A separate self-rating — recorded, NEVER reschedules a review. */
export interface SelfRating {
  ratingId: string;
  conceptId: string;
  grade: ReviewGrade;
  ratedAt: string;
  /** Server-side command payload revision (dedup + change detection). */
  payloadVersion: number;
}

/** Closed-form due item: what is due, when, and the understandable reason. */
export interface DueItem {
  conceptId: string;
  dueAt: string;
  /** Understandable reason (baseline rules + evidence source). */
  reason: string;
}

/** A versioned due-queue projection (deterministic rebuild; append-only). */
export interface DueProjection {
  projectId: string;
  owner: ReviewOwner;
  asOf: string;
  items: readonly DueItem[];
  /** Baseline rules id/version that produced this projection. */
  rules: { rulesId: string; version: number; calibrated: boolean };
  /** Byte-stable digest of the projection body (two-device identity). */
  digest: string;
}

/** Saved owner preferences (timezone + quiet hours). */
export interface ReviewPreferences {
  owner: ReviewOwner;
  timezone: string;
  /** Quiet hours in 24h [start,end); only whole UTC-offset minutes applied. */
  quietStartMinutes: number;
  quietEndMinutes: number;
}

export class ReviewScheduleError extends Error {
  readonly code:
    | 'not_owner'
    | 'workspace_mismatch'
    | 'rules_not_approved'
    | 'rules_unknown'
    | 'rules_invalid'
    | 'calibration_required'
    | 'command_changed'
    | 'evidence_unknown'
    | 'projection_definition_invalid'
    | 'preferences_invalid';
  constructor(code: ReviewScheduleError['code']) {
    super(code);
    this.code = code;
  }
}
