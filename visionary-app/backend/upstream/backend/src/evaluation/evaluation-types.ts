// LEARN-08 (KAN-74) — evaluate checks/practice using server-owned versioned
// criteria and protected answer keys. Client pass/score/completion flags are
// NEVER authoritative.
//
// The checkpoint here is server-owned evaluation (Doc 20: reproducible scoring):
//   - Answer keys are PROTECTED: they live server-side, are versioned with the
//     check, and are never echoed to the client. Evaluation runs on the server
//     against the key for the pinned check revision.
//   - Criteria are VERSIONED: every evaluation records the criteria version it
//     used; the same answer against the same (key, criteria) versions is
//     REPRODUCIBLE — identical verdicts, identically derived.
//   - Client-claimed pass/score/completion flags are never authoritative: a
//     client claim is stored as a CLAIM only; the authoritative verdict comes
//     exclusively from server evaluation. A claim that disagrees with the
//     server verdict never flips the outcome.
//   - Every evaluation appends an immutable, evidence-backed assessed outcome
//     (rubric reference = criteria version) — the mastery evidence LEARN-03
//     consumes.
//   - Wrong users denied; unknown check/revision refused; fail closed.
//
// Exit: reproducible, server-owned evaluation that the projections trust.

/** Server-owned evaluation authority. */
export interface EvaluationOwner {
  uid: string;
  workspaceId: string;
}

/** The check being evaluated (pinned to a source revision). */
export interface CheckRef {
  conceptId: string;
  sourceVersion: string;
  checkId: string;
}

/** A protected answer key: server-side only, never echoed to the client. */
export interface AnswerKey {
  checkId: string;
  sourceVersion: string;
  /** The authoritative correct answer (server-only). */
  key: unknown;
}

/** Versioned evaluation criteria (Doc 20: reproducible scoring). */
export interface EvaluationCriteria {
  /** Criteria version used for this evaluation. */
  criteriaVersion: string;
  /** Points the check is worth. */
  points: number;
  /** Minimum fraction of points required to pass. */
  passThreshold: number;
}

/** The client's self-claimed outcome — stored as a CLAIM, never authoritative. */
export interface ClientClaim {
  claimedPass: boolean;
  claimedScore: number | null;
}

/** The authoritative server evaluation of one submission. */
export interface EvaluationResult {
  submissionId: string;
  checkId: string;
  /** The criteria version that produced this verdict. */
  criteriaVersion: string;
  awarded: number;
  points: number;
  passed: boolean;
  /** True when the client's claim disagreed with the server verdict. */
  claimOverruled: boolean;
  evaluatedAt: string;
}

export class EvaluationError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_check'
      | 'unknown_criteria'
      | 'key_not_protected'
  ) {
    super(code);
  }
}
