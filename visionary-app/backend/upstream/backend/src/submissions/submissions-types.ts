// ROLE-03 (KAN-95) — immutable submission copies, duplicate-safe submit,
// teacher draft/release/return/request-revision and retained attempt/feedback
// history; no silent resubmission replacement.
export interface SubOwner { uid: string; workspaceId: string }

/** One immutable submission attempt copy (append-only, byte-stable). */
export interface AttemptRecord {
  attemptId: string;
  assignmentId: string;
  version: number;
  learnerUid: string;
  attemptNo: number;
  response: { type: string; value: string };
  submittedAt: string;
  idempotencyKey: string | null;
  /** The revision request this attempt answers (attempt 1 = null). */
  answersRevisionNo: number | null;
}

/** Teacher grading lifecycle per attempt: draft → released → returned | revision_requested. */
export interface GradeRecord {
  attemptId: string;
  status: 'draft' | 'released' | 'returned' | 'revision_requested';
  score: number | null;
  feedback: string;
  gradedBy: string;
  updatedAt: string;
}

export class SubmissionsError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'not_class_teacher'
      | 'not_enrolled'
      | 'assignment_closed'
      | 'revision_not_requested'
      | 'attempt_bound_exceeded'
      | 'grade_released_immutable'
      | 'grade_not_released'
      | 'feedback_not_visible'
  ) {
    super(code);
  }
}
