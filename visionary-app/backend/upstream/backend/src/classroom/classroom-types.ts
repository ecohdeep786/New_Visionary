// ROLE-01 (KAN-93) — verified teacher/class ownership, enrollment/join/
// invitation lifecycle and workspace actions types.
//
// The checkpoint here is an INDEPENDENTLY CHECKED classroom domain:
//   - VERIFIED TEACHER OWNERSHIP: only a SERVER-verified teacher creates
//     classes (self-claimed status is never authority); the class owner is
//     recorded server-side and every class operation derives authority from
//     the authenticated caller checked against it (uniform denial, no
//     existence leak, workspace isolation).
//   - INVITATION LIFECYCLE: teacher-issued, learner-BOUND invites carry an
//     opaque code, an expiry and revocation; joining requires the exact
//     invited learner + valid unexpired unrevoked code (uniform refusal, no
//     leak); duplicate joins converge idempotently to one enrollment record.
//   - INDEPENDENT CHECK PER OPERATION: EVERY class, attachment and learner
//     operation re-checks authority at call time — teacher-only actions
//     refuse learners, learner reads require CURRENT enrollment (removed
//     learners lose access immediately — no cached role), archived classes
//     refuse.
//
// Exit: verified teacher/class ownership with checked enrollment/join/
// invitation lifecycle and workspace-scoped actions.

/** The authenticated caller. */
export interface ClassroomOwner {
  uid: string;
  workspaceId: string;
}

/** Server-verified teacher status (never self-claimed). */
export interface TeacherStatus {
  uid: string;
  workspaceId: string;
  verified: boolean;
  verifiedBy: string | null;
}

/** A class owned by a verified teacher (server-recorded). */
export interface Classroom {
  classId: string;
  teacher: ClassroomOwner;
  workspaceId: string;
  title: string;
  status: 'active' | 'archived';
}

/** A learner-bound invitation with opaque code, expiry and revocation. */
export interface ClassInvite {
  inviteId: string;
  classId: string;
  /** Bound learner: only this uid may join with the code. */
  learnerUid: string;
  code: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'revoked';
}

export interface Enrollment {
  classId: string;
  learnerUid: string;
  enrolledAt: string;
  status: 'enrolled' | 'removed';
}

/** Class material attachment (teacher-managed, learner-readable). */
export interface ClassAttachment {
  attachmentId: string;
  classId: string;
  title: string;
  materialRef: string;
}

export class ClassroomError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'teacher_unverified'
      | 'not_class_teacher'
      | 'not_enrolled'
      | 'invite_invalid'
      | 'invite_expired'
      | 'invite_revoked'
      | 'class_archived'
      | 'class_definition_invalid'
  ) {
    super(code);
  }
}
