// ROLE-02 (KAN-94) — fixed assignment publication + scheduling/timezones +
// close/archive/restore + supported response types.
//
// Core responsibilities (server-owned; role-aware; fail closed):
//   1. defineAssignment: a draft version bound to objective, permitted source
//      revision, rubric reference and the supported response types; wall-clock
//      publish/close times carry an EXPLICIT IANA timezone — an invalid
//      identifier refuses (`timezone_invalid`); close must be after publish
//      when both are given (`assignment_definition_invalid`).
//   2. publish: a draft becomes published, or SCHEDULED when publishAt is in
//      the future (in the assignment's own timezone); a published version is
//      immutable — editing it refuses (`published_immutable`), edits are a
//      NEW draft version.
//   3. editDraft: only drafts edit; unknown versions refuse.
//   4. submit: requires the assignment PUBLISHED (draft/scheduled refuse
//      `assignment_not_published`), not closed (explicit close or passed
//      close time → `assignment_closed`), not archived (`assignment_archived`);
//      the learner must be CURRENTLY enrolled via the owning store
//      (`not_enrolled`); the response type must be one of the PUBLISHED
//      version's supported types (`response_type_unsupported`) and satisfy
//      the per-type schema (`submission_schema_invalid`); duplicate
//      (learner, version) submissions converge idempotently.
//   5. close/archive/restore: teacher-only; archive records the prior status;
//      restore returns exactly that prior status.
//   6. Role-aware authority: teacher-only operations — unknown assignment and
//      foreign-workspace callers deny uniformly (`not_owner`); a
//      same-workspace non-teacher denies `not_class_teacher`.
import type {
  AssignmentError as AssignmentErrorType,
  AssignmentOwner,
  AssignmentVersion,
  ResponseType,
  Submission,
  SubmitOutcome,
  WallClock,
} from './assignment-types';
import { AssignmentError } from './assignment-types';
import type { AssignmentStore } from './assignment-lookups';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function strip<T>(value: T, keys: string[]): string {
  const copy = clone(value) as unknown as Record<string, unknown>;
  for (const key of keys) delete copy[key];
  return JSON.stringify(copy);
}

/** The status fields excluded from immutability comparison (lifecycle, not content). */
const LIFECYCLE_FIELDS = ['status', 'archived', 'priorStatus'];

/** Validate an IANA timezone and compute the UTC instant of a wall-clock time there. */
export function zonedInstant(wallClock: WallClock): number {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: wallClock.timezone });
  } catch {
    throw new AssignmentError('timezone_invalid');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(wallClock.date) || !/^\d{2}:\d{2}$/.test(wallClock.time)) {
    throw new AssignmentError('assignment_definition_invalid');
  }
  // Two-pass offset correction: treat as UTC, measure the zone's offset at
  // that instant, and re-interpret the wall clock in that zone.
  let instant = Date.parse(`${wallClock.date}T${wallClock.time}:00Z`);
  for (let pass = 0; pass < 2; pass++) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', {
        timeZone: wallClock.timezone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
        .formatToParts(new Date(instant))
        .map((p) => [p.type, p.value]),
    );
    const asUTC = Date.parse(
      `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00Z`,
    );
    instant = Date.parse(`${wallClock.date}T${wallClock.time}:00Z`) - (asUTC - instant);
  }
  return instant;
}

export class AssignmentService {
  private assignmentCounter = 0;

  constructor(
    private readonly store: AssignmentStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Define a draft assignment version (fixed content at publication). */
  async defineAssignment(
    owner: AssignmentOwner,
    def: Omit<AssignmentVersion, 'version' | 'teacher' | 'status' | 'archived' | 'priorStatus'>,
  ): Promise<AssignmentVersion> {
    if (
      !def.classId ||
      !def.title ||
      !def.objective ||
      !def.sourceRevision ||
      !def.rubricRef ||
      !def.responseTypes?.length ||
      !def.publishAt?.timezone ||
      !def.closeAt?.timezone
    ) {
      throw new AssignmentError('assignment_definition_invalid');
    }
    // Timezones and ordering validate at definition time.
    const publishInstant = def.publishAt ? zonedInstant(def.publishAt) : null;
    const closeInstant = zonedInstant(def.closeAt);
    if (publishInstant !== null && closeInstant <= publishInstant) {
      throw new AssignmentError('assignment_definition_invalid');
    }
    const nextVersion = (await this.store.latestVersionNo(def.assignmentId)) + 1;
    const version: AssignmentVersion = {
      ...clone(def),
      version: nextVersion,
      workspaceId: owner.workspaceId,
      teacher: { ...owner },
      status: 'draft',
      archived: false,
      priorStatus: null,
    };
    await this.store.saveVersion(version);
    return version;
  }

  /** Edit a DRAFT version; a published version is immutable. */
  async editDraft(
    owner: AssignmentOwner,
    assignmentId: string,
    versionNo: number,
    changes: Partial<Pick<AssignmentVersion, 'title' | 'objective' | 'sourceRevision' | 'rubricRef' | 'responseTypes' | 'schema' | 'publishAt' | 'closeAt'>>,
  ): Promise<AssignmentVersion> {
    const version = await this.requireTeacherVersion(assignmentId, versionNo, owner);
    if (version.status !== 'draft') throw new AssignmentError('published_immutable');
    const updated: AssignmentVersion = { ...version, ...clone(changes) };
    await this.store.saveVersion(updated);
    return updated;
  }

  /** Publish a draft — or schedule it when publishAt is in the future. */
  async publish(owner: AssignmentOwner, assignmentId: string, versionNo: number): Promise<AssignmentVersion> {
    const version = await this.requireTeacherVersion(assignmentId, versionNo, owner);
    if (version.status !== 'draft') throw new AssignmentError('published_immutable');
    let status: AssignmentVersion['status'] = 'published';
    if (version.publishAt && zonedInstant(version.publishAt) > this.now().getTime()) {
      status = 'scheduled';
    }
    const updated: AssignmentVersion = { ...version, status };
    await this.store.saveVersion(updated);
    return updated;
  }

  /** Teacher close: submissions refuse afterwards. */
  async close(owner: AssignmentOwner, assignmentId: string, versionNo: number): Promise<AssignmentVersion> {
    const version = await this.requireTeacherVersion(assignmentId, versionNo, owner);
    const updated: AssignmentVersion = { ...version, status: 'closed' };
    await this.store.saveVersion(updated);
    return updated;
  }

  /** Archive (records prior status); submissions refuse while archived. */
  async archive(owner: AssignmentOwner, assignmentId: string, versionNo: number): Promise<AssignmentVersion> {
    const version = await this.requireTeacherVersion(assignmentId, versionNo, owner);
    if (version.archived) throw new AssignmentError('assignment_archived');
    const updated: AssignmentVersion = {
      ...version,
      archived: true,
      priorStatus: version.status,
    };
    await this.store.saveVersion(updated);
    return updated;
  }

  /** Restore exactly the prior (pre-archive) status. */
  async restore(owner: AssignmentOwner, assignmentId: string, versionNo: number): Promise<AssignmentVersion> {
    const version = await this.requireTeacherVersion(assignmentId, versionNo, owner);
    if (!version.archived || !version.priorStatus) throw new AssignmentError('assignment_archived');
    const updated: AssignmentVersion = {
      ...version,
      archived: false,
      status: version.priorStatus,
      priorStatus: null,
    };
    await this.store.saveVersion(updated);
    return updated;
  }

  /** Submit one response against the exact published version. */
  async submit(
    learner: AssignmentOwner,
    assignmentId: string,
    versionNo: number,
    response: { type: ResponseType; value: string },
  ): Promise<SubmitOutcome> {
    const version = await this.store.version(assignmentId, versionNo);
    if (!version) throw new AssignmentError('assignment_version_unknown');
    if (version.archived) throw new AssignmentError('assignment_archived');
    if (version.status === 'closed') throw new AssignmentError('assignment_closed');
    if (version.status !== 'published') {
      // A scheduled assignment goes live at its publish instant (own timezone).
      const live = version.status === 'scheduled' && version.publishAt
        && this.now().getTime() >= zonedInstant(version.publishAt);
      if (!live) throw new AssignmentError('assignment_not_published');
    }
    // Close time evaluated in the assignment's own timezone.
    if (version.closeAt && this.now().getTime() >= zonedInstant(version.closeAt)) {
      throw new AssignmentError('assignment_closed');
    }
    if (!(await this.store.isEnrolled(version.classId, learner.uid))) {
      throw new AssignmentError('not_enrolled');
    }
    // Supported response types are fixed by the published version.
    if (!version.responseTypes.includes(response.type)) {
      throw new AssignmentError('response_type_unsupported');
    }
    if (
      response.type === 'text' &&
      version.schema.textMaxLength !== undefined &&
      response.value.length > version.schema.textMaxLength
    ) {
      throw new AssignmentError('submission_schema_invalid');
    }
    if (
      response.type === 'choice' &&
      !(version.schema.choiceOptions ?? []).includes(response.value)
    ) {
      throw new AssignmentError('submission_schema_invalid');
    }
    if (response.type === 'file_ref' && !/^mat_[A-Za-z0-9_-]+$/.test(response.value)) {
      throw new AssignmentError('submission_schema_invalid');
    }
    const existing = await this.store.submission(assignmentId, versionNo, learner.uid);
    if (existing) return { outcome: 'duplicate', submissionId: existing.submissionId };
    const submission: Submission = {
      submissionId: `sub_${assignmentId}_${versionNo}_${learner.uid}`,
      assignmentId,
      version: versionNo,
      learnerUid: learner.uid,
      response: { ...response },
      submittedAt: this.now().toISOString(),
    };
    await this.store.saveSubmission(submission);
    return { outcome: 'accepted', submissionId: submission.submissionId };
  }

  /** Read one version (teachers any time; learners only when visible). */
  async getAssignment(assignmentId: string, versionNo: number): Promise<AssignmentVersion | undefined> {
    const found = await this.store.version(assignmentId, versionNo);
    return found ? clone(found) : undefined;
  }

  /** Role-aware teacher authority: uniform `not_owner` vs `not_class_teacher`. */
  private async requireTeacherAuthority(assignmentId: string, owner: AssignmentOwner): Promise<void> {
    const latest = await this.store.latestVersionNo(assignmentId);
    if (latest === 0) throw new AssignmentError('not_owner');
    const anyVersion = await this.store.version(assignmentId, 1);
    if (!anyVersion) throw new AssignmentError('not_owner');
    if (anyVersion.workspaceId !== owner.workspaceId) throw new AssignmentError('not_owner');
    if (anyVersion.teacher.uid !== owner.uid) throw new AssignmentError('not_class_teacher');
  }

  private async requireTeacherVersion(
    assignmentId: string,
    versionNo: number,
    owner: AssignmentOwner,
  ): Promise<AssignmentVersion> {
    await this.requireTeacherAuthority(assignmentId, owner);
    const version = await this.store.version(assignmentId, versionNo);
    if (!version) throw new AssignmentError('assignment_version_unknown');
    return version;
  }
}
