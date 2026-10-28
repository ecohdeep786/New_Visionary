// ROLE-01 (KAN-93) — the classroom domain's typed state seams. The owning
// store (verified teacher status, classes, invites, enrollments, attachments)
// implements these at integration; the in-memory implementation is
// contract-true and fails closed.
import type {
  ClassAttachment,
  ClassInvite,
  Classroom,
  Enrollment,
  TeacherStatus,
} from './classroom-types';

export interface ClassroomStore {
  setTeacherStatus(status: TeacherStatus): Promise<void>;
  teacherStatus(uid: string, workspaceId: string): Promise<TeacherStatus | undefined>;
  saveClassroom(classroom: Classroom): Promise<void>;
  classroom(classId: string): Promise<Classroom | undefined>;
  saveInvite(invite: ClassInvite): Promise<void>;
  invite(inviteId: string): Promise<ClassInvite | undefined>;
  invitesByCode(code: string): Promise<ClassInvite[]>;
  saveEnrollment(enrollment: Enrollment): Promise<void>;
  enrollment(classId: string, learnerUid: string): Promise<Enrollment | undefined>;
  enrollments(classId: string): Promise<Enrollment[]>;
  saveAttachment(attachment: ClassAttachment): Promise<void>;
  attachment(attachmentId: string): Promise<ClassAttachment | undefined>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Contract-true in-memory store; every seam fails closed. */
export class InMemoryClassroomStore implements ClassroomStore {
  private teachers = new Map<string, TeacherStatus>();
  private classes = new Map<string, Classroom>();
  private invites = new Map<string, ClassInvite>();
  private enrollmentRecords = new Map<string, Enrollment>();
  private attachments = new Map<string, ClassAttachment>();

  async setTeacherStatus(status: TeacherStatus): Promise<void> {
    this.teachers.set(`${status.uid}|${status.workspaceId}`, clone(status));
  }

  async teacherStatus(uid: string, workspaceId: string): Promise<TeacherStatus | undefined> {
    const found = this.teachers.get(`${uid}|${workspaceId}`);
    return found ? clone(found) : undefined;
  }

  async saveClassroom(classroom: Classroom): Promise<void> {
    this.classes.set(classroom.classId, clone(classroom));
  }

  async classroom(classId: string): Promise<Classroom | undefined> {
    const found = this.classes.get(classId);
    return found ? clone(found) : undefined;
  }

  async saveInvite(invite: ClassInvite): Promise<void> {
    this.invites.set(invite.inviteId, clone(invite));
  }

  async invite(inviteId: string): Promise<ClassInvite | undefined> {
    const found = this.invites.get(inviteId);
    return found ? clone(found) : undefined;
  }

  async invitesByCode(code: string): Promise<ClassInvite[]> {
    return [...this.invites.values()].filter((i) => i.code === code).map(clone);
  }

  async saveEnrollment(enrollment: Enrollment): Promise<void> {
    this.enrollmentRecords.set(`${enrollment.classId}|${enrollment.learnerUid}`, clone(enrollment));
  }

  async enrollment(classId: string, learnerUid: string): Promise<Enrollment | undefined> {
    const found = this.enrollmentRecords.get(`${classId}|${learnerUid}`);
    return found ? clone(found) : undefined;
  }

  async enrollments(classId: string): Promise<Enrollment[]> {
    return [...this.enrollmentRecords.values()]
      .filter((e) => e.classId === classId)
      .map(clone);
  }

  async saveAttachment(attachment: ClassAttachment): Promise<void> {
    this.attachments.set(attachment.attachmentId, clone(attachment));
  }

  async attachment(attachmentId: string): Promise<ClassAttachment | undefined> {
    const found = this.attachments.get(attachmentId);
    return found ? clone(found) : undefined;
  }
}
