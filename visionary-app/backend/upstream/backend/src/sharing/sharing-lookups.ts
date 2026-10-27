// BUILD-06 (KAN-80) — the sharing domain's typed state seams. The owning stores
// (shares, revisions, consents, class workspaces) implement these at integration;
// the in-memory implementation is contract-true and fails closed.
import type { ParentSummaryRequest, RevisionShare, ShareOwner } from './sharing-types';

export interface SharingStore {
  saveShare(share: RevisionShare): Promise<void>;
  byShareId(shareId: string): Promise<RevisionShare | undefined>;
  /** The exact payload at a project revision, or undefined. */
  payloadAt(projectId: string, revisionNo: number): Promise<unknown | undefined>;
  currentRevision(projectId: string): Promise<number>;
  appendRevision(projectId: string, payload: unknown): Promise<number>;
  createProject(owner: ShareOwner, title: string): Promise<string>;
  /** Private state that must NEVER cross a share/classroom boundary. */
  privateStateExists(projectId: string): Promise<boolean>;
  saveSummary(request: ParentSummaryRequest, summary: { sections: string[] }): Promise<void>;
}

/** Contract-true in-memory store; append-only revisions, private state quarantined. */
export class InMemorySharingStore implements SharingStore {
  private shares = new Map<string, RevisionShare>();
  private revisions = new Map<string, unknown[]>();
  private projects = new Map<string, ShareOwner>();
  private privateState = new Set<string>();
  private nextProjectId = 0;
  summaries: { request: ParentSummaryRequest; sections: string[] }[] = [];

  async saveShare(share: RevisionShare): Promise<void> {
    this.shares.set(share.shareId, { ...share, owner: { ...share.owner }, recipients: [...share.recipients] });
  }

  async byShareId(shareId: string): Promise<RevisionShare | undefined> {
    const found = this.shares.get(shareId);
    return found ? { ...found, owner: { ...found.owner }, recipients: [...found.recipients] } : undefined;
  }

  async payloadAt(projectId: string, revisionNo: number): Promise<unknown | undefined> {
    const list = this.revisions.get(projectId) ?? [];
    return list[revisionNo - 1];
  }

  async currentRevision(projectId: string): Promise<number> {
    return (this.revisions.get(projectId) ?? []).length;
  }

  async appendRevision(projectId: string, payload: unknown): Promise<number> {
    const list = this.revisions.get(projectId) ?? [];
    list.push(payload);
    this.revisions.set(projectId, list);
    return list.length;
  }

  async createProject(owner: ShareOwner, title: string): Promise<string> {
    const projectId = `prj_copy_${++this.nextProjectId}`;
    this.projects.set(projectId, { ...owner });
    this.revisions.set(projectId, []);
    return projectId;
  }

  /** Test hook: mark private drafts/conversations/history on a project. */
  markPrivateState(projectId: string): void {
    this.privateState.add(projectId);
  }

  async privateStateExists(projectId: string): Promise<boolean> {
    return this.privateState.has(projectId);
  }

  async saveSummary(request: ParentSummaryRequest, summary: { sections: string[] }): Promise<void> {
    this.summaries = [...this.summaries, { request: { ...request }, sections: [...summary.sections] }];
  }
}
