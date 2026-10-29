// LEARN-12 (KAN-148) — only the released assessment modes: fixed
// source/criteria/official-paper snapshots, server-owned answers/scoring,
// durable sectional timing and interrupted mock resume, plus evidence-qualified
// exam-weighted readiness with missing-data/coverage labels.
//
// Design constraints (server-owned; honest; fail closed):
//   - RELEASED MODES ONLY: an exam session starts only from a RELEASED paper
//     snapshot (named releaser; pinned source/criteria/official-paper refs).
//     An unreleased paper refuses (`source_not_released`).
//   - FIXED SNAPSHOTS: the session pins the paper's source/criteria/
//     official-paper refs at start; later paper edits never move a live session.
//   - SERVER-OWNED ANSWERS/SCORING: answer keys live server-side and are never
//     echoed; scoring runs against the pinned criteria version; the result is
//     immutable and reproducible (byte-stable digest). Client pass/score flags
//     are CLAIMS — a disagreeing claim is overruled, never authoritative.
//   - DURABLE SECTIONAL TIMING: per-section remaining time is durable,
//     server-owned, and NEVER resets on reconnect; an exhausted section refuses
//     further answers (`section_time_exhausted`).
//   - INTERRUPTED MOCK RESUME: a second controller (or a reconnect) resumes the
//     identical byte-stable session state — remaining times preserved.
//   - EVIDENCE-QUALIFIED READINESS: exam-weighted readiness derives ONLY from
//     immutable assessed evidence; missing-data/coverage labels stay visible;
//     an evidence-free readiness refuses (`evidence_required`).
//   - RANK PREDICTIONS REQUIRE A VALIDATED PERMITTED REFERENCE DISTRIBUTION:
//     without one, rank stays honestly unavailable
//     (`reference_distribution_unavailable`) — never an invented percentile.
//   - PROFESSIONAL SCENARIOS USE CAPABILITY/RUBRIC VOCABULARY AND NEVER AWARD A
//     CREDENTIAL AUTOMATICALLY (`credential_not_automatic`).
export interface AssessmentOwner {
  uid: string;
  workspaceId: string;
}

/** One fixed exam section (duration + weight + question ids). */
export interface AssessmentSection {
  sectionId: string;
  durationMs: number;
  points: number;
  questionIds: readonly string[];
}

/**
 * A FIXED paper snapshot: released source/criteria/official-paper refs and the
 * sectional timing/weights. Immutable once released.
 */
export interface AssessmentPaper {
  paperId: string;
  sourceRef: string;
  sourceVersion: string;
  criteriaVersion: string;
  officialPaperRef: string;
  sections: readonly AssessmentSection[];
  released: boolean;
  releasedBy: string | null;
}

/** Durable per-section state (server-owned timing + server-scored answers). */
export interface SectionState {
  sectionId: string;
  /** Remaining time in ms — durable; NEVER reset on reconnect. */
  remainingMs: number;
  answers: Record<string, unknown>;
  submitted: boolean;
  score: { awarded: number; points: number } | null;
}

/** A durable timed mock session pinned to the paper snapshot. */
export interface AssessmentSession {
  sessionId: string;
  owner: AssessmentOwner;
  paperId: string;
  /** FIXED snapshot refs pinned at start. */
  snapshot: { sourceRef: string; sourceVersion: string; criteriaVersion: string; officialPaperRef: string };
  sections: SectionState[];
  status: 'active' | 'completed';
  startedAt: string;
}

/** Immutable, reproducible session result (server-owned scoring). */
export interface SessionResult {
  sessionId: string;
  totalAwarded: number;
  totalPoints: number;
  criteriaVersion: string;
  /** Byte-stable digest of the scoring body (reproducible scoring). */
  digest: string;
  scoredAt: string;
}

/** Evidence-qualified, exam-weighted readiness with visible coverage labels. */
export interface ReadinessReport {
  owner: AssessmentOwner;
  paperId: string;
  /** 0-100 exam-weighted readiness from immutable assessed evidence. */
  readinessPercent: number;
  coverage: 'full' | 'partial' | 'missing_data';
  missingConcepts: readonly string[];
  /** Rank is available ONLY with a validated permitted reference distribution. */
  rank: { available: false; reason: 'reference_distribution_unavailable' } | { available: true; percentile: number };
}

/** A validated, permitted reference distribution (rank prerequisite). */
export interface ReferenceDistribution {
  distributionId: string;
  paperRef: string;
  validated: boolean;
  validatedBy: string | null;
}

/** A professional (capability/rubric) outcome — never an automatic credential. */
export interface ProfessionalOutcome {
  outcomeId: string;
  owner: AssessmentOwner;
  paperRef: string;
  /** Capability/rubric vocabulary — never school vocabulary on adults. */
  capabilities: Record<string, number>;
  rubricVersion: string;
  /** Fixed by construction: a probability never awards a credential. */
  credentialAwarded: false;
}

export class AssessmentError extends Error {
  readonly code:
    | 'not_owner'
    | 'workspace_mismatch'
    | 'paper_unknown'
    | 'source_not_released'
    | 'paper_invalid'
    | 'session_unknown'
    | 'section_unknown'
    | 'section_time_exhausted'
    | 'section_already_submitted'
    | 'session_completed'
    | 'evidence_required'
    | 'reference_distribution_unavailable'
    | 'credential_not_automatic'
    | 'command_changed';
  constructor(code: AssessmentError['code']) {
    super(code);
    this.code = code;
  }
}
