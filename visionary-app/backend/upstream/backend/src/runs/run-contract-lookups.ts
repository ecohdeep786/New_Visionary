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

  /** ATOMIC proposal acceptance: unseen decisionId required (idempotent), the
   * project's CURRENT revision must equal the proposal's base (base-moved
   * refuses), the payload appends, and the decision records — all together.
   * Two concurrent accepts (same or different proposals on the same base) can
   * never both commit. (SQL adapter: one transaction with the conditional
   * UPDATE + INSERT ... SELECT.) */
  acceptProposalAtomic(input: { decisionId: string; proposalId: string; projectId: string; baseRevision: number; payload: unknown }): Promise<{ ok: true; revisionNo: number } | { ok: false; reason: 'duplicate' | 'base_revision_moved' }>;
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

  async acceptProposalAtomic(input: { decisionId: string; proposalId: string; projectId: string; baseRevision: number; payload: unknown }): Promise<{ ok: true; revisionNo: number } | { ok: false; reason: 'duplicate' | 'base_revision_moved' }> {
    if (this.decisions.has(input.decisionId)) return { ok: false, reason: 'duplicate' };
    const current = (this.revisions.get(input.projectId) ?? []).length;
    if (current !== input.baseRevision) return { ok: false, reason: 'base_revision_moved' };
    const list = this.revisions.get(input.projectId) ?? [];
    list.push(input.payload);
    this.revisions.set(input.projectId, list);
    this.decisions.add(input.decisionId);
    const proposal = this.proposals.get(input.proposalId);
    if (proposal) this.proposals.set(input.proposalId, { ...proposal, status: 'accepted' });
    return { ok: true, revisionNo: list.length };
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
