// BUILD-01 (KAN-75) — the project domain's typed state seams. The owning store
// (private projects, immutable revisions, manifests) implements these at
// integration; the in-memory implementation is contract-true and fails closed.
import type { BuildProject, ProjectOwner, ProjectRevision } from './project-types';

export interface ProjectStore {
  insertProject(project: BuildProject): Promise<void>;
  byProjectId(projectId: string): Promise<BuildProject | undefined>;
  updateProject(project: BuildProject): Promise<void>;
  insertRevision(revision: ProjectRevision): Promise<void>;
  bySaveId(projectId: string, saveId: string): Promise<ProjectRevision | undefined>;
  revisionsFor(projectId: string): Promise<ProjectRevision[]>;
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
