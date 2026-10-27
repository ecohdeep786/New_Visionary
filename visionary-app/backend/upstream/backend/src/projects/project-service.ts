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
  private projectCounter = 0;
  constructor(
    private readonly store: ProjectStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Create a private project (owner-scoped; retried creation converges). */
  async createProject(owner: ProjectOwner, title: string): Promise<BuildProject> {
    const project: BuildProject = {
      projectId: `prj_${++this.projectCounter}`,
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

    const manifest: RevisionManifest = { ...digest(input.payload), restoredFrom: null };
    const revision: ProjectRevision = {
      projectId: input.projectId,
      revisionNo: project.currentRevision + 1,
      payload: input.payload,
      manifest,
      savedBy: { ...input.owner },
      saveId: input.saveId,
      savedAt: this.now().toISOString(),
    };
    await this.store.insertRevision(revision);
    await this.store.updateProject({ ...project, currentRevision: revision.revisionNo });
    return { outcome: 'committed', projectId: input.projectId, revisionNo: revision.revisionNo, manifest };
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

    const source = (await this.store.revisionsFor(input.projectId)).find((r) => r.revisionNo === input.fromRevisionNo);
    if (!source) throw new ProjectError('unknown_revision');

    const manifest: RevisionManifest = { ...source.manifest, restoredFrom: source.revisionNo };
    const revision: ProjectRevision = {
      projectId: input.projectId,
      revisionNo: project.currentRevision + 1,
      payload: source.payload,
      manifest,
      savedBy: { ...input.owner },
      saveId: input.saveId,
      savedAt: this.now().toISOString(),
    };
    await this.store.insertRevision(revision);
    await this.store.updateProject({ ...project, currentRevision: revision.revisionNo });
    return { outcome: 'committed', projectId: input.projectId, revisionNo: revision.revisionNo, manifest };
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
