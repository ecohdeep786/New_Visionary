// ROLE-02 (KAN-94) — fixed assignment/objective/source/rubric publication,
// scheduling/timezones, close/archive/restore and supported response types.
//
// The checkpoint here is a FIXED-PUBLICATION assignment domain:
//   - FIXED PUBLICATION: the published version binds the objective, permitted
//     source revision, rubric reference and SUPPORTED response types — a
//     published version is immutable (`published_immutable`); edits happen
//     only as a NEW draft version, and submissions bind the exact version.
//   - SCHEDULING/TIMEZONES: publish/close are wall-clock times in an EXPLICIT
//     IANA timezone recorded on the assignment; evaluation is deterministic
//     in that timezone (an invalid identifier refuses `timezone_invalid`);
//     a future publish time schedules (learners see not-published until it).
//   - CLOSE/ARCHIVE/RESTORE: an explicit teacher close or a passed close time
//     refuses submissions (`assignment_closed`); archive hides the assignment
//     and refuses submissions (`assignment_archived`) while remembering the
//     prior status; restore returns exactly that prior status.
//   - SUPPORTED RESPONSE TYPES: submissions outside the published response
//     types refuse (`response_type_unsupported`) and fail per-type schema
//     checks (text length, choice option, file-ref shape)
//     (`submission_schema_invalid`); duplicate (learner, version)
//     submissions converge idempotently to one record.
//   - AUTHORITY: teacher-only operations are role-aware (unknown/foreign
//     workspace → uniform `not_owner`; same-workspace non-teacher →
//     `not_class_teacher`); submissions require CURRENT class membership via
//     the owning store (`not_enrolled`).
//
// Exit: fixed assignment publication with timezone-deterministic scheduling,
// close/archive/restore and schema-checked supported response types.

/** The authenticated caller. */
export interface AssignmentOwner {
  uid: string;
  workspaceId: string;
}

/** Supported response types (the published version fixes the set). */
export type ResponseType = 'text' | 'choice' | 'file_ref';

/** Wall-clock schedule in an explicit IANA timezone. */
export interface WallClock {
  date: string;
  time: string;
  timezone: string;
}

/** One versioned assignment (draft → scheduled/published → closed). */
export interface AssignmentVersion {
  assignmentId: string;
  version: number;
  classId: string;
  workspaceId: string;
  teacher: AssignmentOwner;
  title: string;
  objective: string;
  /** Permitted source revision the work is bound to. */
  sourceRevision: string;
  rubricRef: string;
  responseTypes: readonly ResponseType[];
  /** Per-type schema bounds (text maxLength; choice options). */
  schema: { textMaxLength?: number; choiceOptions?: readonly string[] };
  publishAt: WallClock | null;
  closeAt: WallClock | null;
  status: 'draft' | 'scheduled' | 'published' | 'closed';
  archived: boolean;
  priorStatus: 'draft' | 'scheduled' | 'published' | 'closed' | null;
}

export interface Submission {
  submissionId: string;
  assignmentId: string;
  version: number;
  learnerUid: string;
  response: { type: ResponseType; value: string };
  submittedAt: string;
}

export type SubmitOutcome =
  | { outcome: 'accepted'; submissionId: string }
  | { outcome: 'duplicate'; submissionId: string };

export class AssignmentError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'not_class_teacher'
      | 'assignment_definition_invalid'
      | 'assignment_version_unknown'
      | 'published_immutable'
      | 'timezone_invalid'
      | 'assignment_closed'
      | 'assignment_archived'
      | 'assignment_not_published'
      | 'response_type_unsupported'
      | 'submission_schema_invalid'
      | 'not_enrolled'
  ) {
    super(code);
  }
}
