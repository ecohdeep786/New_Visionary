// BUILD-01 (KAN-75) — the project domain's typed state seams. The owning store
// (private projects, immutable revisions, manifests) implements these at
// integration; the in-memory implementation is contract-true and fails closed.
import { createHash } from 'node:crypto';
import type { BuildProject, ProjectOwner, ProjectRevision } from './project-types';

export interface ProjectStore {
  insertProject(project: BuildProject): Promise<void>;
  byProjectId(projectId: string): Promise<BuildProject | undefined>;
  updateProject(project: BuildProject): Promise<void>;
  insertRevision(revision: ProjectRevision): Promise<void>;
  bySaveId(projectId: string, saveId: string): Promise<ProjectRevision | undefined>;
  revisionsFor(projectId: string): Promise<ProjectRevision[]>;

  /** Atomic revision-fenced save: unseen saveId + current revision == expected
   * base, revision row + project advance together. Two concurrent saves with
   * the same base can never both commit. (SQL adapter: one conditional UPDATE
   * ... WHERE currentRevision = expected inside the insert transaction.) */
  commitSave(input: { projectId: string; ownerUid: string; saveId: string; payload: unknown; expectedBaseRevision: number; savedAt: string }): Promise<{ ok: true; revisionNo: number } | { ok: false; reason: 'unknown_project' | 'duplicate' | 'revision_conflict' }>;
  /** Atomic restore-as-new-revision under the same fence; restoredFrom recorded. */
  commitRestore(input: { projectId: string; ownerUid: string; saveId: string; fromRevisionNo: number; expectedBaseRevision: number; savedAt: string }): Promise<{ ok: true; revisionNo: number } | { ok: false; reason: 'unknown_project' | 'unknown_revision' | 'revision_conflict' }>;
}

/** Contract-true in-memory store; append-only revisions, never rewritten. */
export class InMemoryProjectStore implements ProjectStore {
  private projects = new Map<string, BuildProject>();
  private revisions: ProjectRevision[] = [];

  async insertProject(project: BuildProject): Promise<void> {
    this.projects.set(project.projectId, { ...project, owner: { ...project.owner } });
  }

  async byProjectId(projectId: string): Promise<BuildProject | undefined> {
    const found = this.projects.get(projectId);
    return found ? { ...found, owner: { ...found.owner } } : undefined;
  }

  async updateProject(project: BuildProject): Promise<void> {
    this.projects.set(project.projectId, { ...project, owner: { ...project.owner } });
  }

    async commitSave(input: { projectId: string; ownerUid: string; saveId: string; payload: unknown; expectedBaseRevision: number; savedAt: string }): Promise<{ ok: true; revisionNo: number } | { ok: false; reason: 'unknown_project' | 'duplicate' | 'revision_conflict' }> {
    const project = this.projects.get(input.projectId);
    if (!project) return { ok: false, reason: 'unknown_project' };
    if (await this.bySaveId(input.projectId, input.saveId)) return { ok: false, reason: 'duplicate' };
    if (project.currentRevision !== input.expectedBaseRevision) return { ok: false, reason: 'revision_conflict' };
    const bytes = Buffer.from(JSON.stringify(input.payload ?? null), 'utf8');
    const manifest = { contentDigest: createHash('sha256').update(bytes).digest('hex'), byteSize: bytes.byteLength, restoredFrom: null };
    const revisionNo = project.currentRevision + 1;
    this.revisions.push({ projectId: input.projectId, revisionNo, payload: input.payload, manifest, savedBy: { uid: input.ownerUid, workspaceId: project.owner.workspaceId }, saveId: input.saveId, savedAt: input.savedAt });
    this.projects.set(input.projectId, { ...project, currentRevision: revisionNo });
    return { ok: true, revisionNo };
  }
  async commitRestore(input: { projectId: string; ownerUid: string; saveId: string; fromRevisionNo: number; expectedBaseRevision: number; savedAt: string }): Promise<{ ok: true; revisionNo: number } | { ok: false; reason: 'unknown_project' | 'unknown_revision' | 'revision_conflict' }> {
    const project = this.projects.get(input.projectId);
    if (!project) return { ok: false, reason: 'unknown_project' };
    if (project.currentRevision !== input.expectedBaseRevision) return { ok: false, reason: 'revision_conflict' };
    const sourceList = (await this.revisionsFor(input.projectId)).find((r) => r.revisionNo === input.fromRevisionNo);
    if (!sourceList) return { ok: false, reason: 'unknown_revision' };
    const revisionNo = project.currentRevision + 1;
    const manifest = { ...sourceList.manifest, restoredFrom: sourceList.revisionNo };
    this.revisions.push({ projectId: input.projectId, revisionNo, payload: sourceList.payload, manifest, savedBy: { uid: input.ownerUid, workspaceId: project.owner.workspaceId }, saveId: input.saveId, savedAt: input.savedAt });
    this.projects.set(input.projectId, { ...project, currentRevision: revisionNo });
    return { ok: true, revisionNo };
  }
  async insertRevision(revision: ProjectRevision): Promise<void> {
    this.revisions = [...this.revisions, { ...revision, manifest: { ...revision.manifest }, savedBy: { ...revision.savedBy } }];
  }

  async bySaveId(projectId: string, saveId: string): Promise<ProjectRevision | undefined> {
    const found = this.revisions.find((r) => r.projectId === projectId && r.saveId === saveId);
    return found ? { ...found, manifest: { ...found.manifest }, savedBy: { ...found.savedBy } } : undefined;
  }

  async revisionsFor(projectId: string): Promise<ProjectRevision[]> {
    return this.revisions
      .filter((r) => r.projectId === projectId)
      .map((r) => ({ ...r, manifest: { ...r.manifest }, savedBy: { ...r.savedBy } }))
      .sort((a, b) => a.revisionNo - b.revisionNo);
  }
}
