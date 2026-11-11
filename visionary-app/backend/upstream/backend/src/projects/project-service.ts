import { randomUUID } from 'node:crypto';
// BUILD-01 (KAN-75) — private projects with immutable revisions/manifests.
//
// Core responsibilities (server-owned; private; append-only):
//   1. createProject: owner-scoped; identity is stable; a retried creation
//      converges; a conflicting duplicate is refused.
//   2. saveDraft: CONDITIONAL — applies only against the expected base
//      revision; stale bases are refused with visible local preservation and
//      the current revision for rebase. Idempotent by client save id. Each
//      accepted save appends an IMMUTABLE revision with a SHA-256 manifest.
//   3. history: the full append-only revision list — byte-stable forever.
//   4. restore: RESTORE-AS-NEW-REVISION — restoring an earlier revision
//      appends a new revision recording `restoredFrom`; history never rewrites.
import { createHash } from 'node:crypto';
import type {
  BuildProject,
  ProjectError as ProjectErrorType,
  ProjectOwner,
  ProjectRevision,
  RevisionManifest,
  SaveRefusal,
  SaveResult,
} from './project-types';
import { ProjectError } from './project-types';
import type { ProjectStore } from './project-lookups';

function digest(payload: unknown): { contentDigest: string; byteSize: number } {
  const bytes = Buffer.from(JSON.stringify(payload ?? null), 'utf8');
  return { contentDigest: createHash('sha256').update(bytes).digest('hex'), byteSize: bytes.byteLength };
}

export class PrivateProjectService {
  constructor(
    private readonly store: ProjectStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Create a private project (owner-scoped; retried creation converges). */
  async createProject(owner: ProjectOwner, title: string): Promise<BuildProject> {
    const project: BuildProject = {
      projectId: `prj_${randomUUID()}`,
      owner: { ...owner },
      title,
      currentRevision: 0,
      createdAt: this.now().toISOString(),
    };
    await this.store.insertProject(project);
    return project;
  }

  /** Conditional draft save: revision-fenced, idempotent, immutable append. */
  async saveDraft(input: {
    projectId: string;
    owner: ProjectOwner;
    saveId: string;
    payload: unknown;
    expectedBaseRevision: number;
  }): Promise<SaveResult | SaveRefusal> {
    const project = await this.store.byProjectId(input.projectId);
    if (!project) return this.refusal('unknown_project');
    if (project.owner.uid !== input.owner.uid || project.owner.workspaceId !== input.owner.workspaceId) {
      return this.refusal('not_owner');
    }

    // Idempotent replay: a retried save converges to the committed revision.
    const existing = await this.store.bySaveId(input.projectId, input.saveId);
    if (existing) {
      return { outcome: 'duplicate', projectId: input.projectId, revisionNo: existing.revisionNo, manifest: { ...existing.manifest } };
    }
    if (project.currentRevision !== input.expectedBaseRevision) {
      return { ok: false, reason: 'revision_conflict', preservedLocal: true, currentRevision: project.currentRevision };
    }

    // The revision fence is enforced ATOMICALLY by the store: two concurrent
    // saves with the same expectedBaseRevision can never both commit.
    const committed = await this.store.commitSave({
      projectId: input.projectId,
      ownerUid: input.owner.uid,
      saveId: input.saveId,
      payload: input.payload,
      expectedBaseRevision: input.expectedBaseRevision,
      savedAt: this.now().toISOString(),
    });
    if (committed.ok === false) {
      if (committed.reason === 'duplicate') {
        const dup = await this.store.bySaveId(input.projectId, input.saveId);
        return { outcome: 'duplicate', projectId: input.projectId, revisionNo: dup!.revisionNo, manifest: { ...dup!.manifest } };
      }
      return { ok: false as const, reason: 'revision_conflict', preservedLocal: true as const, currentRevision: project.currentRevision };
    }
    const manifest: RevisionManifest = { ...digest(input.payload), restoredFrom: null };
    return { outcome: 'committed', projectId: input.projectId, revisionNo: committed.revisionNo, manifest };
  }

  /** The append-only revision history (byte-stable; oldest first). */
  async history(projectId: string, owner: ProjectOwner): Promise<ProjectRevision[] | SaveRefusal> {
    const project = await this.store.byProjectId(projectId);
    if (!project) return this.refusal('unknown_project');
    if (project.owner.uid !== owner.uid || project.owner.workspaceId !== owner.workspaceId) return this.refusal('not_owner');
    return this.store.revisionsFor(projectId);
  }

  /** RESTORE-AS-NEW-REVISION: append a new revision from an earlier one. */
  async restore(input: {
    projectId: string;
    owner: ProjectOwner;
    saveId: string;
    fromRevisionNo: number;
    expectedBaseRevision: number;
  }): Promise<SaveResult | SaveRefusal> {
    const project = await this.store.byProjectId(input.projectId);
    if (!project) return this.refusal('unknown_project');
    if (project.owner.uid !== input.owner.uid || project.owner.workspaceId !== input.owner.workspaceId) return this.refusal('not_owner');
    if (project.currentRevision !== input.expectedBaseRevision) {
      return { ok: false, reason: 'revision_conflict', preservedLocal: true, currentRevision: project.currentRevision };
    }

    // RESTORE-AS-NEW-REVISION under the same atomic fence.
    const restored = await this.store.commitRestore({
      projectId: input.projectId,
      ownerUid: input.owner.uid,
      saveId: input.saveId,
      fromRevisionNo: input.fromRevisionNo,
      expectedBaseRevision: input.expectedBaseRevision,
      savedAt: this.now().toISOString(),
    });
    if (restored.ok === false) {
      if (restored.reason === 'unknown_revision') throw new ProjectError('unknown_revision');
      return { ok: false as const, reason: 'revision_conflict', preservedLocal: true as const, currentRevision: project.currentRevision };
    }
    const source = (await this.store.revisionsFor(input.projectId)).find((r) => r.revisionNo === input.fromRevisionNo)!;
    const manifest: RevisionManifest = { ...source.manifest, restoredFrom: source.revisionNo };
    return { outcome: 'committed', projectId: input.projectId, revisionNo: restored.revisionNo, manifest };
  }

  /** Verify a revision's manifest integrity by re-digesting its payload. */
  static verifyManifest(revision: ProjectRevision): boolean {
    return digest(revision.payload).contentDigest === revision.manifest.contentDigest;
  }

  private refusal(reason: SaveRefusal['reason']): SaveRefusal {
    return { ok: false, reason, preservedLocal: true };
  }
}

export type { ProjectErrorType };
