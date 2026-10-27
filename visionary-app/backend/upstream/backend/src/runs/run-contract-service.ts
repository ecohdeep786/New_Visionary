// BUILD-04 (KAN-78) — durable run/status/event + proposal accept/reject
// contracts.
//
// Core responsibilities (server-owned; base-revision-bound; fail closed):
//   1. startRun: a durable run whose status transitions append immutable
//     events; status is DERIVED from the event list (never mutated in place).
//   2. propose: an AI proposal binds to the run and the exact base revision;
//     a cancelled run yields no proposals.
//   3. acceptProposal: guarded — blocks when the project's current revision has
//     moved past the proposal's base (new edits), or when the actor's AI
//     permission on the project is revoked. Acceptance APPENDS a new revision
//     (apply-as-new-revision); the decision is idempotent per decision id.
//   4. rejectProposal: records the decision without touching history.
//   5. Wrong users denied; unknown runs/proposals fail closed.
import type {
  AcceptResult,
  AiProposal,
  BuildRun,
  RunContractError as RunContractErrorType,
  RunEvent,
  RunOwner,
  RunStatus,
} from './run-contract-types';
import { RunContractError } from './run-contract-types';
import type { RunContractStore } from './run-contract-lookups';

export class RunContractService {
  private runCounter = 0;
  private proposalCounter = 0;
  constructor(
    private readonly store: RunContractStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Start a durable run from a project base revision. */
  async startRun(owner: RunOwner, projectId: string, baseRevision: number): Promise<BuildRun> {
    const runId = `run_${++this.runCounter}`;
    const event: RunEvent = { eventId: `${runId}_e1`, runId, status: 'queued', detail: 'run queued', at: this.now().toISOString() };
    const run: BuildRun = { runId, owner: { ...owner }, projectId, baseRevision, status: 'queued', events: [event] };
    await this.store.insertRun(run);
    return run;
  }

  /** Record a status transition (immutable event; derived status). */
  async transition(runId: string, owner: RunOwner, status: RunStatus, detail: string): Promise<BuildRun> {
    const run = await this.getOwned(runId, owner);
    const event: RunEvent = { eventId: `${runId}_e${run.events.length + 1}`, runId, status, detail, at: this.now().toISOString() };
    await this.store.appendEvent(event);
    return (await this.store.byRunId(runId)) as BuildRun;
  }

  /** Bind an AI proposal to the run and its exact base revision. */
  async propose(runId: string, owner: RunOwner, payload: unknown): Promise<AiProposal> {
    const run = await this.getOwned(runId, owner);
    if (run.status === 'cancelled') throw new RunContractError('cancelled_run_no_proposal');
    const proposal: AiProposal = {
      proposalId: `prp_${++this.proposalCounter}`,
      runId,
      owner: { ...owner },
      projectId: run.projectId,
      baseRevision: run.baseRevision,
      payload,
      status: 'pending',
    };
    await this.store.saveProposal(proposal);
    return proposal;
  }

  /**
   * Accept a proposal: blocked by new edits (base moved) or revoked permission;
   * acceptance appends a new revision; idempotent per decision id.
   */
  async acceptProposal(input: {
    owner: RunOwner;
    proposalId: string;
    decisionId: string;
  }): Promise<AcceptResult> {
    const existing = await this.store.decisionExists(input.decisionId);
    if (existing) return { decisionId: input.decisionId, proposalId: input.proposalId, outcome: 'duplicate', newRevisionNo: null };

    const proposal = await this.getProposal(input.proposalId, input.owner);
    if (await this.store.permissionRevoked(input.owner, proposal.projectId)) {
      throw new RunContractError('permission_revoked');
    }
    const current = await this.store.currentRevision(proposal.projectId);
    if (current !== proposal.baseRevision) {
      // New edits landed after the proposal was generated: acceptance blocked.
      throw new RunContractError('base_revision_moved');
    }
    const newRevisionNo = await this.store.appendRevision(proposal.projectId, proposal.payload);
    await this.store.recordDecision(input.decisionId, input.proposalId, 'accepted');
    return { decisionId: input.decisionId, proposalId: input.proposalId, outcome: 'committed', newRevisionNo };
  }

  /** Reject a proposal: records the decision; history untouched. */
  async rejectProposal(input: { owner: RunOwner; proposalId: string; decisionId: string; reason: string }): Promise<{ decisionId: string; outcome: 'committed' | 'duplicate' }> {
    const existing = await this.store.decisionExists(input.decisionId);
    if (existing) return { decisionId: input.decisionId, outcome: 'duplicate' };
    await this.getProposal(input.proposalId, input.owner);
    await this.store.recordDecision(input.decisionId, input.proposalId, 'rejected');
    return { decisionId: input.decisionId, outcome: 'committed' };
  }

  private async getOwned(runId: string, owner: RunOwner): Promise<BuildRun> {
    const run = await this.store.byRunId(runId);
    if (!run) throw new RunContractError('unknown_run');
    if (run.owner.uid !== owner.uid || run.owner.workspaceId !== owner.workspaceId) throw new RunContractError('not_owner');
    return run;
  }

  private async getProposal(proposalId: string, owner: RunOwner): Promise<AiProposal> {
    const proposal = await this.store.byProposalId(proposalId);
    if (!proposal) throw new RunContractError('unknown_proposal');
    if (proposal.owner.uid !== owner.uid || proposal.owner.workspaceId !== owner.workspaceId) throw new RunContractError('not_owner');
    return proposal;
  }
}

export type { RunContractErrorType };
