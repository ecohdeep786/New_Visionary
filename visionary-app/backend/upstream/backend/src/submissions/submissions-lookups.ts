// ROLE-03 (KAN-95) — the submissions domain's typed state seams.
import type { AttemptRecord, GradeRecord } from './submissions-types';

export interface SubmissionsStore {
  appendAttempt(attempt: AttemptRecord): Promise<void>;
  attempt(attemptId: string): Promise<AttemptRecord | undefined>;
  attempts(assignmentId: string, version: number, learnerUid: string): Promise<AttemptRecord[]>;
  allAttempts(assignmentId: string, version: number): Promise<AttemptRecord[]>;
  attemptByIdempotencyKey(key: string): Promise<AttemptRecord | undefined>;
  saveGrade(grade: GradeRecord): Promise<void>;
  grade(attemptId: string): Promise<GradeRecord | undefined>;
  revisionRequests(assignmentId: string, version: number, learnerUid: string): Promise<number>;
  recordRevisionRequest(assignmentId: string, version: number, learnerUid: string): Promise<void>;
  /** The assignment gate (published + not closed) from the ROLE-02 owning store. */
  assignmentOpen(assignmentId: string, version: number): Promise<boolean>;
  isEnrolled(classId: string, learnerUid: string): Promise<boolean>;
  classOf(assignmentId: string): Promise<string | undefined>;
  teacherOf(assignmentId: string): Promise<{ uid: string; workspaceId: string } | undefined>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Contract-true in-memory store; every seam fails closed. */
export class InMemorySubmissionsStore implements SubmissionsStore {
  private attemptList = new Map<string, AttemptRecord[]>();
  private attemptById = new Map<string, AttemptRecord>();
  private byKey = new Map<string, AttemptRecord>();
  private grades = new Map<string, GradeRecord>();
  private revisions = new Map<string, number>();
  private open = new Map<string, boolean>();
  private enrolled = new Set<string>();
  private bindings = new Map<string, { classId: string; teacher: { uid: string; workspaceId: string } }>();

  seedAssignment(assignmentId: string, version: number, classId: string, teacher: { uid: string; workspaceId: string }, open = true): void {
    this.open.set(`${assignmentId}@${version}`, open);
    this.bindings.set(assignmentId, { classId, teacher });
  }

  seedEnrollment(classId: string, learnerUid: string): void {
    this.enrolled.add(`${classId}|${learnerUid}`);
  }

  async appendAttempt(attempt: AttemptRecord): Promise<void> {
    const key = `${attempt.assignmentId}@${attempt.version}|${attempt.learnerUid}`;
    const list = this.attemptList.get(key) ?? [];
    list.push(clone(attempt));
    this.attemptList.set(key, list);
    this.attemptById.set(attempt.attemptId, clone(attempt));
    if (attempt.idempotencyKey) this.byKey.set(attempt.idempotencyKey, clone(attempt));
  }

  async attempt(attemptId: string): Promise<AttemptRecord | undefined> {
    const found = this.attemptById.get(attemptId);
    return found ? clone(found) : undefined;
  }

  async attempts(assignmentId: string, version: number, learnerUid: string): Promise<AttemptRecord[]> {
    return (this.attemptList.get(`${assignmentId}@${version}|${learnerUid}`) ?? []).map(clone);
  }

  async allAttempts(assignmentId: string, version: number): Promise<AttemptRecord[]> {
    const prefix = `${assignmentId}@${version}|`;
    const out: AttemptRecord[] = [];
    for (const [key, list] of this.attemptList) {
      if (key.startsWith(prefix)) out.push(...list.map(clone));
    }
    return out;
  }

  async attemptByIdempotencyKey(key: string): Promise<AttemptRecord | undefined> {
    const found = this.byKey.get(key);
    return found ? clone(found) : undefined;
  }

  async saveGrade(grade: GradeRecord): Promise<void> {
    this.grades.set(grade.attemptId, clone(grade));
  }

  async grade(attemptId: string): Promise<GradeRecord | undefined> {
    const found = this.grades.get(attemptId);
    return found ? clone(found) : undefined;
  }

  async revisionRequests(assignmentId: string, version: number, learnerUid: string): Promise<number> {
    return this.revisions.get(`${assignmentId}@${version}|${learnerUid}`) ?? 0;
  }

  async recordRevisionRequest(assignmentId: string, version: number, learnerUid: string): Promise<void> {
    const key = `${assignmentId}@${version}|${learnerUid}`;
    this.revisions.set(key, (this.revisions.get(key) ?? 0) + 1);
  }

  async assignmentOpen(assignmentId: string, version: number): Promise<boolean> {
    return this.open.get(`${assignmentId}@${version}`) ?? false;
  }

  async isEnrolled(classId: string, learnerUid: string): Promise<boolean> {
    return this.enrolled.has(`${classId}|${learnerUid}`);
  }

  async classOf(assignmentId: string): Promise<string | undefined> {
    return this.bindings.get(assignmentId)?.classId;
  }

  async teacherOf(assignmentId: string): Promise<{ uid: string; workspaceId: string } | undefined> {
    const b = this.bindings.get(assignmentId);
    return b ? { ...b.teacher } : undefined;
  }
}
