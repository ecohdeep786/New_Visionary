// ROLE-01 (KAN-93) — verified teacher/class ownership + checked enrollment/
// join/invitation lifecycle service.
//
// Core responsibilities (server-owned; independently checked per call):
//   1. verifyTeacher: server-verified status recorded by a named verifier —
//      self-claimed teacher status is never authority; only a verified
//      teacher creates classes (`teacher_unverified`).
//   2. createClass: the owner is recorded server-side; uniform denial
//      (`not_owner`) for wrong uid / foreign workspace on every class op —
//      no existence leak; workspace isolation (the same uid in another
//      workspace owns nothing).
//   3. inviteLearner (class teacher only): a learner-BOUND invite with an
//      opaque code and expiry; expired/revoked invites refuse at join.
//   4. joinByInvite: only the invited learner, with the exact code
//      (`invite_invalid` — uniform with unknown code, no leak), not expired
//      (`invite_expired`), not revoked (`invite_revoked`); duplicate joins
//      converge idempotently to exactly ONE enrollment record.
//   5. Independent checks on EVERY operation: attachMaterial/listLearners/
//      removeLearner/archiveClass are class-teacher-only
//      (`not_class_teacher`); readAttachment requires CURRENT enrollment
//      (`not_enrolled`) — a removed learner loses access immediately (no
//      cached role); an archived class refuses further lifecycle actions
//      (`class_archived`).
import type {
  ClassAttachment,
  ClassInvite,
  Classroom,
  ClassroomError as ClassroomErrorType,
  ClassroomOwner,
  Enrollment,
} from './classroom-types';
import { ClassroomError } from './classroom-types';
import type { ClassroomStore } from './classroom-lookups';

export interface JoinResult {
  classId: string;
  learnerUid: string;
  outcome: 'enrolled' | 'duplicate';
}

export class ClassroomService {
  private classCounter = 0;
  private inviteCounter = 0;
  private attachmentCounter = 0;

  constructor(
    private readonly store: ClassroomStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Record server-verified teacher status (named verifier; never self-claim). */
  async verifyTeacher(uid: string, workspaceId: string, verifiedBy: string): Promise<void> {
    if (!verifiedBy?.trim()) throw new ClassroomError('teacher_unverified');
    await this.store.setTeacherStatus({ uid, workspaceId, verified: true, verifiedBy });
  }

  /** Create a class (verified teacher only; owner recorded server-side). */
  async createClass(owner: ClassroomOwner, title: string): Promise<Classroom> {
    const status = await this.store.teacherStatus(owner.uid, owner.workspaceId);
    if (!status?.verified) throw new ClassroomError('teacher_unverified');
    const classroom: Classroom = {
      classId: `cls_${++this.classCounter}`,
      teacher: { ...owner },
      workspaceId: owner.workspaceId,
      title,
      status: 'active',
    };
    await this.store.saveClassroom(classroom);
    return classroom;
  }

  /** Invite one learner (class teacher only; bound, opaque code, expiry). */
  async inviteLearner(
    owner: ClassroomOwner,
    classId: string,
    learnerUid: string,
    ttlMs: number,
  ): Promise<ClassInvite> {
    const classroom = await this.requireClassTeacher(classId, owner);
    if (classroom.status === 'archived') throw new ClassroomError('class_archived');
    const invite: ClassInvite = {
      inviteId: `inv_${++this.inviteCounter}`,
      classId,
      learnerUid,
      code: `join_${Math.random().toString(36).slice(2, 12)}`,
      expiresAt: new Date(this.now().getTime() + ttlMs).toISOString(),
      status: 'pending',
    };
    await this.store.saveInvite(invite);
    return invite;
  }

  /** Revoke an invite (class teacher only). */
  async revokeInvite(owner: ClassroomOwner, inviteId: string): Promise<void> {
    const invite = await this.store.invite(inviteId);
    if (!invite) throw new ClassroomError('invite_invalid');
    await this.requireClassTeacher(invite.classId, owner);
    await this.store.saveInvite({ ...invite, status: 'revoked' });
  }

  /** Join with the invite code (invited learner only; idempotent duplicate). */
  async joinByInvite(learner: ClassroomOwner, code: string): Promise<JoinResult> {
    const invites = await this.store.invitesByCode(code);
    const invite = invites.find((i) => i.learnerUid === learner.uid);
    // Uniform refusal: unknown code, wrong learner — same `invite_invalid`.
    if (!invite) throw new ClassroomError('invite_invalid');
    if (invite.status === 'revoked') throw new ClassroomError('invite_revoked');
    if (this.now().getTime() >= new Date(invite.expiresAt).getTime()) {
      throw new ClassroomError('invite_expired');
    }
    const classroom = await this.store.classroom(invite.classId);
    if (!classroom) throw new ClassroomError('invite_invalid');
    if (classroom.status === 'archived') throw new ClassroomError('class_archived');
    const existing = await this.store.enrollment(invite.classId, learner.uid);
    if (existing?.status === 'enrolled') {
      // Idempotent duplicate: still exactly one enrollment record.
      return { classId: invite.classId, learnerUid: learner.uid, outcome: 'duplicate' };
    }
    await this.store.saveEnrollment({
      classId: invite.classId,
      learnerUid: learner.uid,
      enrolledAt: this.now().toISOString(),
      status: 'enrolled',
    });
    await this.store.saveInvite({ ...invite, status: 'accepted' });
    return { classId: invite.classId, learnerUid: learner.uid, outcome: 'enrolled' };
  }

  /** Attach class material (class teacher only; archived classes refuse). */
  async attachMaterial(
    owner: ClassroomOwner,
    classId: string,
    title: string,
    materialRef: string,
  ): Promise<ClassAttachment> {
    const classroom = await this.requireClassTeacher(classId, owner);
    if (classroom.status === 'archived') throw new ClassroomError('class_archived');
    const attachment: ClassAttachment = {
      attachmentId: `att_${++this.attachmentCounter}`,
      classId,
      title,
      materialRef,
    };
    await this.store.saveAttachment(attachment);
    return attachment;
  }

  /** Read one attachment (teacher OR currently-enrolled learner). */
  async readAttachment(owner: ClassroomOwner, attachmentId: string): Promise<ClassAttachment> {
    const attachment = await this.store.attachment(attachmentId);
    if (!attachment) throw new ClassroomError('not_enrolled');
    const classroom = await this.store.classroom(attachment.classId);
    if (!classroom) throw new ClassroomError('not_enrolled');
    if (classroom.teacher.uid === owner.uid && classroom.workspaceId === owner.workspaceId) {
      return attachment;
    }
    const enrollment = await this.store.enrollment(attachment.classId, owner.uid);
    // CURRENT enrollment only — a removed learner has no access, immediately.
    if (owner.workspaceId !== classroom.workspaceId || enrollment?.status !== 'enrolled') {
      throw new ClassroomError('not_enrolled');
    }
    return attachment;
  }

  /** Remove one learner (class teacher only; access ends immediately). */
  async removeLearner(owner: ClassroomOwner, classId: string, learnerUid: string): Promise<void> {
    await this.requireClassTeacher(classId, owner);
    const enrollment = await this.store.enrollment(classId, learnerUid);
    if (!enrollment || enrollment.status !== 'enrolled') throw new ClassroomError('not_enrolled');
    await this.store.saveEnrollment({ ...enrollment, status: 'removed' });
  }

  /** List enrolled learners (class teacher only). */
  async listLearners(owner: ClassroomOwner, classId: string): Promise<Enrollment[]> {
    await this.requireClassTeacher(classId, owner);
    const all = await this.store.enrollments(classId);
    return all.filter((e) => e.status === 'enrolled');
  }

  /** Archive a class (class teacher only); further lifecycle actions refuse. */
  async archiveClass(owner: ClassroomOwner, classId: string): Promise<Classroom> {
    const classroom = await this.requireClassTeacher(classId, owner);
    const archived: Classroom = { ...classroom, status: 'archived' };
    await this.store.saveClassroom(archived);
    return archived;
  }

  /** Uniform denial: unknown class and wrong owner are the same `not_owner`. */
  private async getOwned(classId: string, owner: ClassroomOwner): Promise<Classroom> {
    const classroom = await this.store.classroom(classId);
    if (
      !classroom ||
      classroom.teacher.uid !== owner.uid ||
      classroom.workspaceId !== owner.workspaceId
    ) {
      throw new ClassroomError('not_owner');
    }
    return classroom;
  }

  /**
   * Teacher-only operations: unknown class and foreign-workspace callers
   * deny uniformly (`not_owner`, no existence leak); a same-workspace
   * non-teacher (e.g. an enrolled learner) denies as `not_class_teacher`.
   */
  private async requireClassTeacher(classId: string, owner: ClassroomOwner): Promise<Classroom> {
    const classroom = await this.store.classroom(classId);
    if (!classroom) throw new ClassroomError('not_owner');
    if (classroom.workspaceId !== owner.workspaceId) throw new ClassroomError('not_owner');
    if (classroom.teacher.uid !== owner.uid) throw new ClassroomError('not_class_teacher');
    return classroom;
  }
}

export type { ClassroomErrorType };
