// ROLE-02 (KAN-94) — the assignment domain's typed state seams. The owning
// store (versioned assignments, submissions, class membership) implements
// these at integration; the in-memory implementation is contract-true and
// fails closed.
import type { AssignmentVersion, Submission } from './assignment-types';

export interface AssignmentStore {
  saveVersion(version: AssignmentVersion): Promise<void>;
  version(assignmentId: string, versionNo: number): Promise<AssignmentVersion | undefined>;
  latestVersionNo(assignmentId: string): Promise<number>;
  saveSubmission(submission: Submission): Promise<void>;
  submission(assignmentId: string, version: number, learnerUid: string): Promise<Submission | undefined>;
  /** CURRENT class membership (the classroom owning store at integration). */
  isEnrolled(classId: string, learnerUid: string): Promise<boolean>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Contract-true in-memory store; every seam fails closed. */
export class InMemoryAssignmentStore implements AssignmentStore {
  private versions = new Map<string, AssignmentVersion>();
  private submissions = new Map<string, Submission>();
  private enrolled = new Set<string>();

  private versionKey(assignmentId: string, version: number): string {
    return `${assignmentId}@${version}`;
  }

  seedEnrollment(classId: string, learnerUid: string): void {
    this.enrolled.add(`${classId}|${learnerUid}`);
  }

  async saveVersion(version: AssignmentVersion): Promise<void> {
    this.versions.set(this.versionKey(version.assignmentId, version.version), clone(version));
  }

  async version(assignmentId: string, versionNo: number): Promise<AssignmentVersion | undefined> {
    const found = this.versions.get(this.versionKey(assignmentId, versionNo));
    return found ? clone(found) : undefined;
  }

  async latestVersionNo(assignmentId: string): Promise<number> {
    let latest = 0;
    for (const key of this.versions.keys()) {
      if (key.startsWith(`${assignmentId}@`)) {
        const v = Number(key.split('@')[1]);
        if (v > latest) latest = v;
      }
    }
    return latest;
  }

  async saveSubmission(submission: Submission): Promise<void> {
    this.submissions.set(
      `${submission.assignmentId}@${submission.version}|${submission.learnerUid}`,
      clone(submission),
    );
  }

  async submission(
    assignmentId: string,
    version: number,
    learnerUid: string,
  ): Promise<Submission | undefined> {
    const found = this.submissions.get(`${assignmentId}@${version}|${learnerUid}`);
    return found ? clone(found) : undefined;
  }

  async isEnrolled(classId: string, learnerUid: string): Promise<boolean> {
    return this.enrolled.has(`${classId}|${learnerUid}`);
  }
}
