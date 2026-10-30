// BUILD-08 (KAN-82) — the device-adapter API service. It composes the
// durable-run (KAN-78), private-project (KAN-75) and exact-revision sharing
// (KAN-80) services over ONE owning store, and exposes typed, session-bound
// device adapters. The adapter is where client identity is bound: every call
// happens through a DeviceAdapter that carries the actor + explicit device;
// closing a session (account switch on that device) denies every further call,
// and a different account is denied everywhere by the underlying contracts.
import { createHash } from 'node:crypto';
import type {
  AdapterError as AdapterErrorType,
  DeviceActor,
  DeviceAdapter,
  DeviceSession,
} from './device-adapter-types';
import { AdapterError } from './device-adapter-types';
import { DeviceAdapterStore } from './device-adapter-lookups';
import { RunContractService } from '../runs/run-contract-service';
import { RunContractError, type RunStatus } from '../runs/run-contract-types';
import { PrivateProjectService } from '../projects/project-service';
import { ProjectError, type SaveRefusal, type SaveResult, type ProjectRevision } from '../projects/project-types';
import { SharingService } from '../sharing/sharing-service';
import { SharingError } from '../sharing/sharing-types';

export class DeviceAdapterService {
  private readonly runs: RunContractService;
  private readonly projects: PrivateProjectService;
  private readonly sharing: SharingService;
  private sessionCounter = 0;
  private sessions = new Map<string, DeviceSession>();

  constructor(private readonly store: DeviceAdapterStore) {
    this.runs = new RunContractService(store);
    this.projects = new PrivateProjectService(store);
    this.sharing = new SharingService(store);
  }

  /**
   * Open one session for (account × device). Sessions never infer identity
   * from a device token — they are explicit, and close on account switch.
   */
  async openSession(actor: DeviceActor): Promise<DeviceAdapter> {
    const session: DeviceSession = {
      sessionId: `sess_${++this.sessionCounter}`,
      actor: { ...actor },
      openedAt: new Date().toISOString(),
      open: true,
    };
    this.sessions.set(session.sessionId, session);
    return new BoundDeviceAdapter(this.store, this.runs, this.projects, this.sharing, session);
  }
}

/** The account- and device-bound adapter a client actually holds. */
class BoundDeviceAdapter implements DeviceAdapter {
  constructor(
    private readonly store: DeviceAdapterStore,
    private readonly runs: RunContractService,
    private readonly projects: PrivateProjectService,
    private readonly sharing: SharingService,
    public session: DeviceSession,
  ) {}

  private get actor(): DeviceActor {
    return this.session.actor;
  }

  private guard(): void {
    if (!this.session.open) throw new AdapterError('session_closed');
  }

  private static refusalReason(result: unknown): AdapterErrorType['code'] {
    return (result as SaveRefusal).reason as AdapterErrorType['code'];
  }

  private unwrap<T>(error: unknown, fallback: AdapterErrorType['code']): never {
    if (error instanceof RunContractError || error instanceof ProjectError || error instanceof SharingError) {
      throw new AdapterError(error.code as AdapterErrorType['code']);
    }
    throw new AdapterError(fallback);
  }

  async createProject(title: string): Promise<{ projectId: string; currentRevision: number }> {
    this.guard();
    const project = await this.projects.createProject(this.actor, title);
    return { projectId: project.projectId, currentRevision: project.currentRevision };
  }

  async saveDraft(input: {
    projectId: string;
    saveId: string;
    payload: unknown;
    expectedBaseRevision: number;
  }): Promise<{ outcome: 'committed' | 'duplicate'; revisionNo: number }> {
    this.guard();
    const result = await this.projects.saveDraft({ owner: this.actor, ...input });
    if ('ok' in result) throw new AdapterError(BoundDeviceAdapter.refusalReason(result));
    const ok = result as SaveResult;
    return { outcome: ok.outcome, revisionNo: ok.revisionNo };
  }

  async history(projectId: string): Promise<unknown[]> {
    this.guard();
    const result = await this.projects.history(projectId, this.actor);
    if ('ok' in result) throw new AdapterError(BoundDeviceAdapter.refusalReason(result));
    return result as ProjectRevision[];
  }

  async restore(input: {
    projectId: string;
    saveId: string;
    fromRevisionNo: number;
    expectedBaseRevision: number;
  }): Promise<{ outcome: 'committed'; revisionNo: number }> {
    this.guard();
    // Adapter-level guard: never restore corrupted bytes. The manifest digest
    // recorded at append time must still match the stored payload.
    const recorded = this.store.recordedDigest(input.projectId, input.fromRevisionNo);
    const payload = await this.store.payloadAt(input.projectId, input.fromRevisionNo);
    if (recorded === undefined || payload === undefined) throw new AdapterError('unknown_revision');
    const actual = createHash('sha256').update(Buffer.from(JSON.stringify(payload ?? null), 'utf8')).digest('hex');
    if (actual !== recorded) throw new AdapterError('export_integrity_failed');

    const result = await this.projects.restore({ owner: this.actor, saveId: input.saveId, projectId: input.projectId, fromRevisionNo: input.fromRevisionNo, expectedBaseRevision: input.expectedBaseRevision });
    if ('ok' in result) throw new AdapterError(BoundDeviceAdapter.refusalReason(result));
    return { outcome: 'committed', revisionNo: (result as SaveResult).revisionNo };
  }

  async startRun(projectId: string, baseRevision: number): Promise<{ runId: string; baseRevision: number; status: string }> {
    this.guard();
    const run = await this.runs.startRun(this.actor, projectId, baseRevision);
    return { runId: run.runId, baseRevision: run.baseRevision, status: run.status };
  }

  async transition(runId: string, status: string, detail: string): Promise<{ runId: string; status: string }> {
    this.guard();
    const run = await this.runs.transition(runId, this.actor, status as RunStatus, detail);
    return { runId: run.runId, status: run.status };
  }

  async propose(runId: string, payload: unknown): Promise<{ proposalId: string; baseRevision: number }> {
    this.guard();
    const proposal = await this.runs.propose(runId, this.actor, payload).catch((e) => this.unwrap(e, 'unknown_run'));
    return { proposalId: proposal.proposalId, baseRevision: proposal.baseRevision };
  }

  async acceptProposal(proposalId: string, decisionId: string): Promise<{ outcome: 'committed' | 'duplicate'; newRevisionNo: number | null }> {
    this.guard();
    return this.runs.acceptProposal({ owner: this.actor, proposalId, decisionId }).catch((e) => this.unwrap(e, 'unknown_proposal'));
  }

  async rejectProposal(proposalId: string, decisionId: string): Promise<{ outcome: 'committed' | 'duplicate' }> {
    this.guard();
    return this.runs.rejectProposal({ owner: this.actor, proposalId, decisionId, reason: 'declined' }).catch((e) => this.unwrap(e, 'unknown_proposal'));
  }

  async shareRevision(projectId: string, revisionNo: number, recipients: readonly string[]): Promise<{ shareId: string }> {
    this.guard();
    // Adapter-level ownership guard: only the project owner may share (the
    // same-account second device is allowed; a switched/foreign account is not).
    const project = await this.store.byProjectId(projectId);
    if (!project) throw new AdapterError('unknown_project');
    if (project.owner.uid !== this.actor.uid || project.owner.workspaceId !== this.actor.workspaceId) {
      throw new AdapterError('not_owner');
    }
    const share = await this.sharing.shareRevision(this.actor, projectId, revisionNo, recipients).catch((e) => this.unwrap(e, 'unknown_share'));
    return { shareId: share.shareId };
  }

  async viewShared(shareId: string): Promise<{ revisionNo: number; payload: unknown }> {
    this.guard();
    const viewed = await this.sharing.viewShared(shareId, this.actor.uid).catch((e) => this.unwrap(e, 'unknown_share'));
    return { revisionNo: viewed.revisionNo, payload: viewed.payload };
  }

  async exportRevision(projectId: string, revisionNo: number): Promise<{ payload: unknown; contentDigest: string }> {
    this.guard();
    const payload = await this.store.payloadAt(projectId, revisionNo);
    const recorded = this.store.recordedDigest(projectId, revisionNo);
    if (payload === undefined || recorded === undefined) throw new AdapterError('unknown_revision');
    const actual = createHash('sha256').update(Buffer.from(JSON.stringify(payload ?? null), 'utf8')).digest('hex');
    if (actual !== recorded) throw new AdapterError('export_integrity_failed');
    return { payload, contentDigest: recorded };
  }

  async closeSession(): Promise<void> {
    this.session = { ...this.session, open: false };
  }
}

export type { AdapterErrorType };
