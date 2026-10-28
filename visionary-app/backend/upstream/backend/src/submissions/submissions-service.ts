// ROLE-03 (KAN-95) — immutable submission copies, duplicate-safe submit,
// teacher draft/release/return/request-revision, retained attempt/feedback
// history; no silent resubmission replacement.
//
// Core responsibilities (server-owned; append-only; fail closed):
//   1. submit: each attempt is an IMMUTABLE COPY appended to the learner's
//      history. A resubmission is accepted ONLY after a teacher
//      request-revision (`revision_not_requested` otherwise — no silent
//      replacement); attempts are bounded by the granted revisions
//      (`attempt_bound_exceeded`); the assignment gate (published + open)
//      and CURRENT enrollment are checked per call; the same idempotency
//      key converges to the SAME attempt (duplicate-safe, first wins).
//   2. saveDraftGrade (teacher-only): a mutable DRAFT; once the grade leaves
//      draft it is immutable (`grade_released_immutable`).
//   3. releaseGrade (teacher-only): draft → released; byte-stable thereafter.
//   4. returnGrade (teacher-only): released → returned; the learner then
//      sees the feedback. requestRevision (teacher-only): records the
//      revision request, makes the feedback visible and GRANTS attempt N+1.
//   5. history: the learner sees their OWN attempt copies always and feedback
//      only once returned/revision_requested (`feedback_not_visible` before
//      that); the teacher sees all attempts and grades. Wrong caller →
//      uniform `not_owner` (no existence leak); non-teacher grading →
//      `not_class_teacher`; foreign workspace → `not_owner`.
import type {
  AttemptRecord,
  GradeRecord,
  SubOwner,
  SubmissionsError as SubmissionsErrorType,
} from './submissions-types';
import { SubmissionsError } from './submissions-types';
import type { SubmissionsStore } from './submissions-lookups';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export interface SubmitInput {
  assignmentId: string;
  version: number;
  response: { type: string; value: string };
  idempotencyKey?: string | null;
}

export class SubmissionsService {
  private attemptCounter = 0;

  constructor(private readonly store: SubmissionsStore) {}

  /** Submit one attempt (immutable copy; duplicate-safe; revision-gated). */
  async submit(learner: SubOwner, input: SubmitInput): Promise<AttemptRecord> {
    const classId = await this.store.classOf(input.assignmentId);
    if (!classId) throw new SubmissionsError('not_owner');
    if (!(await this.store.assignmentOpen(input.assignmentId, input.version))) {
      throw new SubmissionsError('assignment_closed');
    }
    if (!(await this.store.isEnrolled(classId, learner.uid))) {
      throw new SubmissionsError('not_enrolled');
    }
    // Duplicate-safe: the same idempotency key returns the SAME attempt.
    if (input.idempotencyKey) {
      const existing = await this.store.attemptByIdempotencyKey(input.idempotencyKey);
      if (existing) return existing;
    }
    const attempts = await this.store.attempts(input.assignmentId, input.version, learner.uid);
    const granted = 1 + (await this.store.revisionRequests(input.assignmentId, input.version, learner.uid));
    if (attempts.length + 1 > granted) {
      // No silent resubmission replacement: an ungranted resubmission is a
      // missing revision request; a consumed revision is the hard bound.
      const requests = await this.store.revisionRequests(input.assignmentId, input.version, learner.uid);
      throw new SubmissionsError(requests === 0 ? 'revision_not_requested' : 'attempt_bound_exceeded');
    }
    const attempt: AttemptRecord = {
      attemptId: `att_${++this.attemptCounter}`,
      assignmentId: input.assignmentId,
      version: input.version,
      learnerUid: learner.uid,
      attemptNo: attempts.length + 1,
      response: { ...input.response },
      submittedAt: new Date().toISOString(),
      idempotencyKey: input.idempotencyKey ?? null,
      answersRevisionNo: attempts.length === 0 ? null : attempts.length,
    };
    await this.store.appendAttempt(attempt);
    return attempt;
  }

  /** Teacher-only mutable DRAFT grade. */
  async saveDraftGrade(
    teacher: SubOwner,
    attemptId: string,
    score: number,
    feedback: string,
  ): Promise<GradeRecord> {
    const attempt = await this.requireTeacher(attemptId, teacher);
    const existing = await this.store.grade(attemptId);
    if (existing && existing.status !== 'draft') {
      throw new SubmissionsError('grade_released_immutable');
    }
    const grade: GradeRecord = {
      attemptId,
      status: 'draft',
      score,
      feedback,
      gradedBy: teacher.uid,
      updatedAt: new Date().toISOString(),
    };
    await this.store.saveGrade(grade);
    return grade;
  }

  /** Teacher-only release: the grade becomes byte-stable. */
  async releaseGrade(teacher: SubOwner, attemptId: string): Promise<GradeRecord> {
    await this.requireTeacher(attemptId, teacher);
    const grade = await this.store.grade(attemptId);
    if (!grade) throw new SubmissionsError('grade_not_released');
    if (grade.status !== 'draft') throw new SubmissionsError('grade_released_immutable');
    const released: GradeRecord = { ...grade, status: 'released', updatedAt: new Date().toISOString() };
    await this.store.saveGrade(released);
    return released;
  }

  /** Teacher-only return: the learner then sees the feedback. */
  async returnGrade(teacher: SubOwner, attemptId: string): Promise<GradeRecord> {
    await this.requireTeacher(attemptId, teacher);
    const grade = await this.store.grade(attemptId);
    if (!grade || grade.status !== 'released') throw new SubmissionsError('grade_not_released');
    const returned: GradeRecord = { ...grade, status: 'returned', updatedAt: new Date().toISOString() };
    await this.store.saveGrade(returned);
    return returned;
  }

  /** Teacher-only request-revision: visible feedback + grants attempt N+1. */
  async requestRevision(
    teacher: SubOwner,
    attemptId: string,
    feedback: string,
  ): Promise<{ grade: GradeRecord; grantedAttempts: number }> {
    const attempt = await this.requireTeacher(attemptId, teacher);
    const existing = await this.store.grade(attemptId);
    if (existing && existing.status !== 'draft') {
      throw new SubmissionsError('grade_released_immutable');
    }
    const grade: GradeRecord = {
      attemptId,
      status: 'revision_requested',
      score: existing?.score ?? null,
      feedback,
      gradedBy: teacher.uid,
      updatedAt: new Date().toISOString(),
    };
    await this.store.saveGrade(grade);
    await this.store.recordRevisionRequest(attempt.assignmentId, attempt.version, attempt.learnerUid);
    const granted = 1 + (await this.store.revisionRequests(attempt.assignmentId, attempt.version, attempt.learnerUid));
    return { grade, grantedAttempts: granted };
  }

  /** The learner's own retained history: attempts always, feedback when visible. */
  async learnerHistory(learner: SubOwner, assignmentId: string, version: number) {
    const attempts = await this.store.attempts(assignmentId, version, learner.uid);
    if (!attempts.length) throw new SubmissionsError('not_owner');
    const withGrades = [];
    for (const attempt of attempts) {
      const grade = await this.store.grade(attempt.attemptId);
      const visible =
        grade && (grade.status === 'returned' || grade.status === 'revision_requested');
      withGrades.push({
        attempt,
        grade: visible ? grade : null,
        feedbackVisible: !!visible,
      });
    }
    return withGrades;
  }

  /** The teacher's full retained history for one assignment version. */
  async teacherHistory(teacher: SubOwner, assignmentId: string, version: number) {
    const binding = await this.store.teacherOf(assignmentId);
    if (!binding) throw new SubmissionsError('not_owner');
    if (binding.workspaceId !== teacher.workspaceId) throw new SubmissionsError('not_owner');
    if (binding.uid !== teacher.uid) throw new SubmissionsError('not_class_teacher');
    const attempts = await this.store.allAttempts(assignmentId, version);
    return attempts;
  }

  /** Role-aware teacher authority (uniform no-leak vs role denial). */
  private async requireTeacher(attemptId: string, teacher: SubOwner): Promise<AttemptRecord> {
    const attempt = await this.store.attempt(attemptId);
    const binding = attempt ? await this.store.teacherOf(attempt.assignmentId) : undefined;
    if (!attempt || !binding) throw new SubmissionsError('not_owner');
    if (binding.workspaceId !== teacher.workspaceId) throw new SubmissionsError('not_owner');
    if (binding.uid !== teacher.uid) throw new SubmissionsError('not_class_teacher');
    return attempt;
  }
}

export type { SubmissionsErrorType };
