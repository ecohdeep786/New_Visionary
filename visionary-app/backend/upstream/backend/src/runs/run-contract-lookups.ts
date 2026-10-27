// BUILD-04 (KAN-78) — the durable-run contract's typed state seams. The owning
// stores (runs/events, proposals, decisions, project revisions, permission
// grants) implement these at integration; the in-memory implementation is
// contract-true and fails closed.
import type { AiProposal, BuildRun, RunEvent, RunOwner } from './run-contract-types';

export interface RunContractStore {
  insertRun(run: BuildRun): Promise<void>;
  byRunId(runId: string): Promise<BuildRun | undefined>;
  appendEvent(event: RunEvent): Promise<void>;
  saveProposal(proposal: AiProposal): Promise<void>;
  byProposalId(proposalId: string): Promise<AiProposal | undefined>;
  decisionExists(decisionId: string): Promise<boolean>;
  recordDecision(decisionId: string, proposalId: string, decision: 'accepted' | 'rejected'): Promise<void>;
  currentRevision(projectId: string): Promise<number>;
  appendRevision(projectId: string, payload: unknown): Promise<number>;
  permissionRevoked(owner: RunOwner, projectId: string): Promise<boolean>;
}

/** Contract-true in-memory store; events append-only, status derived. */
export class InMemoryRunContractStore implements RunContractStore {
  private runs = new Map<string, BuildRun>();
  private proposals = new Map<string, AiProposal>();
  private decisions = new Set<string>();
  private revisions = new Map<string, unknown[]>();
  private revoked = new Set<string>();

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
    const events = [...run.events, event];
    this.runs.set(event.runId, { ...run, status: event.status, events });
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

  async currentRevision(projectId: string): Promise<number> {
    return (this.revisions.get(projectId) ?? []).length;
  }

  async appendRevision(projectId: string, payload: unknown): Promise<number> {
    const list = this.revisions.get(projectId) ?? [];
    list.push(payload);
    this.revisions.set(projectId, list);
    return list.length;
  }

  async permissionRevoked(owner: RunOwner, projectId: string): Promise<boolean> {
    return this.revoked.has(`${owner.uid}|${projectId}`);
  }

  /** Test hook: revoke AI-proposal permission for a uid on a project. */
  revokePermission(uid: string, projectId: string): void {
    this.revoked.add(`${uid}|${projectId}`);
  }
}
