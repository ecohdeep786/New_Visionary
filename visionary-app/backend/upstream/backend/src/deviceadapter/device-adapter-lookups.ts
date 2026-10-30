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
