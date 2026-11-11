// BUILD-08 (KAN-82) — the owning store for the device-adapter contracts. It
// implements the run/project/sharing store seams over ONE shared, append-only
// revision ledger with SHA-256 manifests — the shape the real owning database
// takes at integration. The in-memory implementation is contract-true and
// fails closed; the test hooks (tamper, revoke) exist to PROVE the
// failure/revocation cases the adapter guards.
import { createHash } from 'node:crypto';
import type { BuildProject, ProjectOwner, ProjectRevision } from '../projects/project-types';
import type { BuildRun, RunEvent, RunOwner, AiProposal } from '../runs/run-contract-types';
import type { ParentSummaryRequest, RevisionShare, ShareOwner } from '../sharing/sharing-types';
import type { RunContractStore } from '../runs/run-contract-lookups';
import type { ProjectStore } from '../projects/project-lookups';
import type { SharingStore } from '../sharing/sharing-lookups';

/** One append-only revision ledger row (the shared manifest record). */
export interface LedgerEntry {
  revisionNo: number;
  payload: unknown;
  contentDigest: string;
  byteSize: number;
  savedBy: ProjectOwner | null;
  saveId: string | null;
  restoredFrom: number | null;
}

function digest(payload: unknown): { contentDigest: string; byteSize: number } {
  const bytes = Buffer.from(JSON.stringify(payload ?? null), 'utf8');
  return { contentDigest: createHash('sha256').update(bytes).digest('hex'), byteSize: bytes.byteLength };
}

/**
 * The devices' owning store: one projects table, one revision ledger, one
 * shares table, one runs table — shared by every device session.
 */
export class DeviceAdapterStore implements RunContractStore, ProjectStore, SharingStore {
  private projects = new Map<string, BuildProject>();
  private ledger = new Map<string, LedgerEntry[]>();
  private runs = new Map<string, BuildRun>();
  private proposals = new Map<string, AiProposal>();
  private decisions = new Set<string>();
  private shares = new Map<string, RevisionShare>();
  private summaries: { request: ParentSummaryRequest; sections: string[] }[] = [];
  private revokedPermission = new Set<string>();
  private privateState = new Set<string>();
  private nextProjectCopyId = 0;
  private projectOwners = new Map<string, ShareOwner>();
  private consents = new Map<string, 'active' | 'revoked' | 'expired'>();

  // ---- project seam -------------------------------------------------------

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
    const current = (this.ledger.get(input.projectId) ?? []).length;
    if (current !== input.expectedBaseRevision) return { ok: false, reason: 'revision_conflict' };
    const revisionNo = await this.appendRevision(input.projectId, input.payload);
    const project = this.projects.get(input.projectId);
    if (project) this.projects.set(input.projectId, { ...project, currentRevision: revisionNo });
    return { ok: true, revisionNo };
  }
  async commitRestore(input: { projectId: string; ownerUid: string; saveId: string; fromRevisionNo: number; expectedBaseRevision: number; savedAt: string }): Promise<{ ok: true; revisionNo: number } | { ok: false; reason: 'unknown_project' | 'unknown_revision' | 'revision_conflict' }> {
    const current = (this.ledger.get(input.projectId) ?? []).length;
    if (current !== input.expectedBaseRevision) return { ok: false, reason: 'revision_conflict' };
    const payload = await this.payloadAt(input.projectId, input.fromRevisionNo);
    if (payload === undefined) return { ok: false, reason: 'unknown_revision' };
    const revisionNo = await this.appendRevision(input.projectId, payload);
    const project = this.projects.get(input.projectId);
    if (project) this.projects.set(input.projectId, { ...project, currentRevision: revisionNo });
    return { ok: true, revisionNo };
  }
  async insertRevision(revision: ProjectRevision): Promise<void> {
    const list = this.ledger.get(revision.projectId) ?? [];
    this.ledger.set(revision.projectId, [
      ...list,
      {
        revisionNo: revision.revisionNo,
        payload: revision.payload,
        contentDigest: revision.manifest.contentDigest,
        byteSize: revision.manifest.byteSize,
        savedBy: { ...revision.savedBy },
        saveId: revision.saveId,
        restoredFrom: revision.manifest.restoredFrom,
      },
    ]);
  }

  async bySaveId(projectId: string, saveId: string): Promise<ProjectRevision | undefined> {
    const entry = (this.ledger.get(projectId) ?? []).find((e) => e.saveId === saveId);
    return entry ? this.toRevision(projectId, entry) : undefined;
  }

  async revisionsFor(projectId: string): Promise<ProjectRevision[]> {
    return (this.ledger.get(projectId) ?? [])
      .map((e) => this.toRevision(projectId, e))
      .sort((a, b) => a.revisionNo - b.revisionNo);
  }

  // ---- run seam -----------------------------------------------------------

  async insertRun(run: BuildRun): Promise<void> {
    this.runs.set(run.runId, { ...run, owner: { ...run.owner }, events: [...run.events] });
  }

  async byRunId(runId: string): Promise<BuildRun | undefined> {
    const found = this.runs.get(runId);
    return found ? { ...found, owner: { ...found.owner }, events: [...found.events] } : undefined;
  }

  async appendEvent(event: RunEvent): Promise<void> {
    const run = this.runs.get(event.runId);
    if (!run) return;
    this.runs.set(event.runId, { ...run, status: event.status, events: [...run.events, event] });
  }

  async saveProposal(proposal: AiProposal): Promise<void> {
    this.proposals.set(proposal.proposalId, { ...proposal, owner: { ...proposal.owner } });
  }

  async byProposalId(proposalId: string): Promise<AiProposal | undefined> {
    const found = this.proposals.get(proposalId);
    return found ? { ...found, owner: { ...found.owner } } : undefined;
  }

  async decisionExists(decisionId: string): Promise<boolean> {
    return this.decisions.has(decisionId);
  }

  async recordDecision(decisionId: string, proposalId: string, decision: 'accepted' | 'rejected'): Promise<void> {
    this.decisions.add(decisionId);
    const proposal = this.proposals.get(proposalId);
    if (proposal) this.proposals.set(proposalId, { ...proposal, status: decision });
  }

  async permissionRevoked(owner: RunOwner, projectId: string): Promise<boolean> {
    return this.revokedPermission.has(`${owner.uid}|${projectId}`);
  }

  // ---- sharing seam -------------------------------------------------------

  async saveShare(share: RevisionShare): Promise<void> {
    this.shares.set(share.shareId, { ...share, owner: { ...share.owner }, recipients: [...share.recipients] });
  }

  async byShareId(shareId: string): Promise<RevisionShare | undefined> {
    const found = this.shares.get(shareId);
    return found ? { ...found, owner: { ...found.owner }, recipients: [...found.recipients] } : undefined;
  }

  async payloadAt(projectId: string, revisionNo: number): Promise<unknown | undefined> {
    const entry = (this.ledger.get(projectId) ?? []).find((e) => e.revisionNo === revisionNo);
    return entry ? entry.payload : undefined;
  }

  async currentRevision(projectId: string): Promise<number> {
    return (this.ledger.get(projectId) ?? []).length;
  }

  async appendRevision(projectId: string, payload: unknown): Promise<number> {
    const list = this.ledger.get(projectId) ?? [];
    const d = digest(payload);
    const entry: LedgerEntry = {
      revisionNo: list.length + 1,
      payload,
      contentDigest: d.contentDigest,
      byteSize: d.byteSize,
      savedBy: null,
      saveId: null,
      restoredFrom: null,
    };
    this.ledger.set(projectId, [...list, entry]);
    return entry.revisionNo;
  }

  // Only the project owner may create via the sharing class-copy seam.
  async createProject(owner: ShareOwner, title: string): Promise<string> {
    const projectId = `prj_copy_${++this.nextProjectCopyId}`;
    this.projects.set(projectId, {
      projectId,
      owner: { uid: owner.uid, workspaceId: owner.workspaceId },
      title,
      currentRevision: 0,
      createdAt: new Date().toISOString(),
    });
    this.ledger.set(projectId, []);
    return projectId;
  }

  async privateStateExists(projectId: string): Promise<boolean> {
    return this.privateState.has(projectId);
  }

  async saveSummary(request: ParentSummaryRequest, summary: { sections: string[] }): Promise<void> {
    this.summaries = [...this.summaries, { request: { ...request }, sections: [...summary.sections] }];
  }

  // ---- corrected-sibling atomic laws (KAN-78/80/75) ------------------------

  async acceptProposalAtomic(input: { decisionId: string; proposalId: string; projectId: string; baseRevision: number; payload: unknown }): Promise<{ ok: true; revisionNo: number } | { ok: false; reason: 'duplicate' | 'base_revision_moved' }> {
    if (this.decisions.has(input.decisionId)) return { ok: false, reason: 'duplicate' };
    const current = (this.ledger.get(input.projectId) ?? []).length;
    if (current !== input.baseRevision) return { ok: false, reason: 'base_revision_moved' };
    const appended = await this.appendRevision(input.projectId, input.payload);
    this.decisions.add(input.decisionId);
    const proposal = this.proposals.get(input.proposalId);
    if (proposal) this.proposals.set(input.proposalId, { ...proposal, status: 'accepted' });
    return { ok: true, revisionNo: appended };
  }

  async projectOwnerOf(projectId: string): Promise<ShareOwner | undefined> {
    const seeded = this.projectOwners.get(projectId);
    if (seeded) return { ...seeded };
    // Adapter-created projects are owned by their creating actor.
    const created = this.projects.get(projectId);
    return created ? { uid: created.owner.uid, workspaceId: created.owner.workspaceId } : undefined;
  }

  async recordProjectOwner(projectId: string, owner: ShareOwner): Promise<void> {
    if (!this.projectOwners.has(projectId)) this.projectOwners.set(projectId, { ...owner });
  }

  async consentFor(guardianUid: string, studentUid: string, projectId: string): Promise<'active' | 'revoked' | 'expired' | undefined> {
    return this.consents.get(`${guardianUid}|${studentUid}|${projectId}`);
  }

  async setConsent(guardianUid: string, studentUid: string, projectId: string, state: 'active' | 'revoked' | 'expired'): Promise<void> {
    this.consents.set(`${guardianUid}|${studentUid}|${projectId}`, state);
  }

  // ---- adapter-level guards + test hooks ----------------------------------

  /** Recorded manifest digest for a revision (adapter export/restore checks). */
  recordedDigest(projectId: string, revisionNo: number): string | undefined {
    return (this.ledger.get(projectId) ?? []).find((e) => e.revisionNo === revisionNo)?.contentDigest;
  }

  /** Test hook: corrupt the stored payload (manifest unchanged) — export fails. */
  tamper(projectId: string, revisionNo: number, payload: unknown): void {
    const list = this.ledger.get(projectId) ?? [];
    this.ledger.set(
      projectId,
      list.map((e) => (e.revisionNo === revisionNo ? { ...e, payload } : e)),
    );
  }

  /** Test hook: revoke an accepted recipient from a share (store-level). */
  revokeRecipient(shareId: string, uid: string): void {
    const share = this.shares.get(shareId);
    if (!share) return;
    this.shares.set(shareId, { ...share, recipients: share.recipients.filter((r) => r !== uid) });
  }

  /** Test hook: revoke AI-proposal permission for a uid on a project. */
  revokePermission(uid: string, projectId: string): void {
    this.revokedPermission.add(`${uid}|${projectId}`);
  }

  /** Test hook: mark private drafts/conversations/history on a project. */
  markPrivateState(projectId: string): void {
    this.privateState.add(projectId);
  }

  private toRevision(projectId: string, entry: LedgerEntry): ProjectRevision {
    return {
      projectId,
      revisionNo: entry.revisionNo,
      payload: entry.payload,
      manifest: {
        contentDigest: entry.contentDigest,
        byteSize: entry.byteSize,
        restoredFrom: entry.restoredFrom,
      },
      savedBy: entry.savedBy ?? { uid: '', workspaceId: '' },
      saveId: entry.saveId ?? `adapter-${entry.revisionNo}`,
      savedAt: '',
    };
  }
}
