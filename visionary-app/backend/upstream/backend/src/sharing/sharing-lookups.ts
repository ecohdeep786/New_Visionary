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
  /** SERVER-DERIVED ownership of a project (the enforcement source for
   * shareRevision; the sharing domain never trusts a caller's claim). */
  projectOwnerOf(projectId: string): Promise<ShareOwner | undefined>;
  recordProjectOwner(projectId: string, owner: ShareOwner): Promise<void>;
  /** SERVER-DERIVED guardian consent (client flags are never authoritative). */
  consentFor(guardianUid: string, studentUid: string, projectId: string): Promise<'active' | 'revoked' | 'expired' | undefined>;
  setConsent(guardianUid: string, studentUid: string, projectId: string, state: 'active' | 'revoked' | 'expired'): Promise<void>;
  saveSummary(request: ParentSummaryRequest, summary: { sections: string[] }): Promise<void>;
}

/** Contract-true in-memory store; append-only revisions, private state quarantined. */
export class InMemorySharingStore implements SharingStore {
  private shares = new Map<string, RevisionShare>();
  private revisions = new Map<string, unknown[]>();
  private projects = new Map<string, ShareOwner>();
  private consents = new Map<string, 'active' | 'revoked' | 'expired'>();
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
  async projectOwnerOf(projectId: string): Promise<ShareOwner | undefined> {
    const owner = this.projects.get(projectId);
    return owner ? { ...owner } : undefined;
  }
  async recordProjectOwner(projectId: string, owner: ShareOwner): Promise<void> {
    if (!this.projects.has(projectId)) this.projects.set(projectId, { ...owner });
  }
  consentKey(guardianUid: string, studentUid: string, projectId: string): string {
    return `${guardianUid}|${studentUid}|${projectId}`;
  }
  async consentFor(guardianUid: string, studentUid: string, projectId: string): Promise<'active' | 'revoked' | 'expired' | undefined> {
    return this.consents.get(this.consentKey(guardianUid, studentUid, projectId));
  }
  async setConsent(guardianUid: string, studentUid: string, projectId: string, state: 'active' | 'revoked' | 'expired'): Promise<void> {
    this.consents.set(this.consentKey(guardianUid, studentUid, projectId), state);
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
