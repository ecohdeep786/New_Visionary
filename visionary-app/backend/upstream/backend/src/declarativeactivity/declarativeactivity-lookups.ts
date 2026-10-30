// BUILD-09 (KAN-154) — the declarative activity store's typed seams. The
// owning store (schemas, admitted activities, decisions) plus the shared
// project/proposal ledger (DeviceAdapterStore) implement these at integration;
// the in-memory implementation composes them and is contract-true, failing
// closed.
import type { DeviceAdapterStore } from '../deviceadapter/device-adapter-lookups';
import type { ActivitySchema, DeclarativeActivity, ActivityOwner, ActivityManifest } from './declarativeactivity-types';

export interface ActivityStore {
  registerSchema(schema: ActivitySchema): Promise<void>;
  schemaAt(schemaId: string, version: number): Promise<ActivitySchema | undefined>;
  saveActivity(activity: DeclarativeActivity): Promise<void>;
  byActivityId(activityId: string): Promise<DeclarativeActivity | undefined>;
  decisionExists(decisionId: string): Promise<boolean>;
  recordDecision(activityId: string, decisionId: string, decision: 'accepted' | 'rejected'): Promise<void>;
  // Ledger/proposal delegation (the shared owning database).
  byProjectId(projectId: string): Promise<{ owner: ActivityOwner; currentRevision: number } | undefined>;
  byProposal(proposalId: string): Promise<{ runId: string; owner: ActivityOwner; projectId: string; baseRevision: number } | undefined>;
  runStatus(runId: string): Promise<string | undefined>;
  currentRevision(projectId: string): Promise<number>;
  appendRevision(projectId: string, payload: unknown): Promise<number>;
  recordedDigest(projectId: string, revisionNo: number): Promise<string | undefined>;
  payloadAt(projectId: string, revisionNo: number): Promise<unknown | undefined>;
}

/** Contract-true in-memory store over a shared DeviceAdapterStore ledger. */
export class InMemoryActivityStore implements ActivityStore {
  private schemas = new Map<string, ActivitySchema>();
  private activities = new Map<string, DeclarativeActivity>();
  private decisions = new Map<string, string>(); // decisionId -> activityId

  constructor(private readonly ledger: DeviceAdapterStore) {}

  async registerSchema(schema: ActivitySchema): Promise<void> {
    this.schemas.set(`${schema.schemaId}@${schema.version}`, schema);
  }

  async schemaAt(schemaId: string, version: number): Promise<ActivitySchema | undefined> {
    return this.schemas.get(`${schemaId}@${version}`);
  }

  async saveActivity(activity: DeclarativeActivity): Promise<void> {
    this.activities.set(activity.activityId, { ...activity, owner: { ...activity.owner }, manifest: { ...activity.manifest, params: { ...activity.manifest.params } } });
  }

  async byActivityId(activityId: string): Promise<DeclarativeActivity | undefined> {
    const found = this.activities.get(activityId);
    return found ? { ...found, owner: { ...found.owner }, manifest: { ...found.manifest, params: { ...found.manifest.params } } } : undefined;
  }

  async decisionExists(decisionId: string): Promise<boolean> {
    return this.decisions.has(decisionId);
  }

  async recordDecision(activityId: string, decisionId: string, decision: 'accepted' | 'rejected'): Promise<void> {
    this.decisions.set(decisionId, activityId);
    const activity = this.activities.get(activityId);
    if (activity) this.activities.set(activityId, { ...activity, status: decision });
  }

  async byProjectId(projectId: string): Promise<{ owner: ActivityOwner; currentRevision: number } | undefined> {
    const project = await this.ledger.byProjectId(projectId);
    if (!project) return undefined;
    return { owner: { uid: project.owner.uid, workspaceId: project.owner.workspaceId }, currentRevision: project.currentRevision };
  }

  async byProposal(proposalId: string): Promise<{ runId: string; owner: ActivityOwner; projectId: string; baseRevision: number } | undefined> {
    const proposal = await this.ledger.byProposalId(proposalId);
    if (!proposal) return undefined;
    return { runId: proposal.runId, owner: { uid: proposal.owner.uid, workspaceId: proposal.owner.workspaceId }, projectId: proposal.projectId, baseRevision: proposal.baseRevision };
  }

  async runStatus(runId: string): Promise<string | undefined> {
    const run = await this.ledger.byRunId(runId);
    return run ? run.status : undefined;
  }

  async currentRevision(projectId: string): Promise<number> {
    return this.ledger.currentRevision(projectId);
  }

  async appendRevision(projectId: string, payload: unknown): Promise<number> {
    return this.ledger.appendRevision(projectId, payload);
  }

  async recordedDigest(projectId: string, revisionNo: number): Promise<string | undefined> {
    return this.ledger.recordedDigest(projectId, revisionNo);
  }

  async payloadAt(projectId: string, revisionNo: number): Promise<unknown | undefined> {
    return this.ledger.payloadAt(projectId, revisionNo);
  }
}
