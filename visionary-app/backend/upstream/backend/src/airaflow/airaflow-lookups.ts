// AI-14 (KAN-143) — the AIRA workflow harness's typed state seams. The owning
// store (tool registry, capability grants, usage ledger, exactly-once effect
// ledger, flow persistence + checkpoints) implements these at integration; the
// in-memory implementation is contract-true and fails closed.
import type {
  AiraFlow,
  FlowOwner,
  ToolExecution,
  ToolSpec,
} from './airaflow-types';

/** The server-recorded current versions (the authority for drift checks). */
export interface CurrentVersions {
  sourceRevision: string;
  toolRegistry: string;
}

export interface AiraFlowStore {
  // Typed allowlisted tool registry (server-owned).
  registerTool(spec: ToolSpec): Promise<void>;
  tool(toolName: string): Promise<ToolSpec | undefined>;

  // Server capability grants (checked on EVERY call, never cached client-side).
  grantCapability(owner: FlowOwner, capability: string): Promise<void>;
  capabilityGranted(owner: FlowOwner, capability: string): Promise<boolean>;

  // Measured usage ledger (atomic debit; the authority for measured usage).
  tryConsumeUsage(owner: FlowOwner, cost: number): Promise<boolean>;
  usageDebited(owner: FlowOwner): Promise<number>;

  // Exactly-once product side effects (atomic with execution at integration).
  applyEffect(runId: string, stepId: string): Promise<'applied' | 'duplicate'>;
  effectCount(runId: string, stepId: string): Promise<number>;

  // Server-recorded current versions (source revision, registry version).
  currentVersions(): Promise<CurrentVersions>;

  // Deterministic tool execution (provider work; failures are observable).
  executeTool(toolName: string, params: Record<string, unknown>): Promise<ToolExecution>;

  // Flow persistence + append-only checkpoints (restart resumes from the last).
  insertFlow(flow: AiraFlow): Promise<void>;
  saveFlow(flow: AiraFlow): Promise<void>;
  flow(runId: string): Promise<AiraFlow | undefined>;
  appendCheckpoint(flow: AiraFlow): Promise<string>;
  restoreLatestCheckpoint(runId: string): Promise<AiraFlow | undefined>;
}

/** Deep-copy a flow (byte-stable snapshots for checkpoints). */
function cloneFlow(flow: AiraFlow): AiraFlow {
  return JSON.parse(JSON.stringify(flow)) as AiraFlow;
}

/** Contract-true in-memory store; every seam fails closed. */
export class InMemoryAiraFlowStore implements AiraFlowStore {
  private tools = new Map<string, ToolSpec>();
  private capabilities = new Set<string>();
  private usageBalances = new Map<string, number>();
  private usageDebitedTotal = new Map<string, number>();
  private effectAttempts = new Map<string, number>();
  private effectsApplied = new Map<string, number>();
  private flows = new Map<string, AiraFlow>();
  private checkpoints = new Map<string, AiraFlow[]>();
  private sourceRevision = '';
  private registryVersion = '';
  private queuedFailures = new Map<string, number>();

  setVersions(sourceRevision: string, toolRegistry: string): void {
    this.sourceRevision = sourceRevision;
    this.registryVersion = toolRegistry;
  }

  /** Test seam: queue N observed provider failures for a tool. */
  queueToolFailures(toolName: string, count: number): void {
    this.queuedFailures.set(toolName, count);
  }

  seedUsage(owner: FlowOwner, amount: number): void {
    this.usageBalances.set(`${owner.uid}|${owner.workspaceId}`, amount);
  }

  async registerTool(spec: ToolSpec): Promise<void> {
    this.tools.set(spec.tool, { ...spec, requiredParams: [...spec.requiredParams] });
  }

  async tool(toolName: string): Promise<ToolSpec | undefined> {
    const found = this.tools.get(toolName);
    return found ? { ...found, requiredParams: [...found.requiredParams] } : undefined;
  }

  async grantCapability(owner: FlowOwner, capability: string): Promise<void> {
    this.capabilities.add(`${owner.uid}|${owner.workspaceId}|${capability}`);
  }

  async capabilityGranted(owner: FlowOwner, capability: string): Promise<boolean> {
    return this.capabilities.has(`${owner.uid}|${owner.workspaceId}|${capability}`);
  }

  async tryConsumeUsage(owner: FlowOwner, cost: number): Promise<boolean> {
    const key = `${owner.uid}|${owner.workspaceId}`;
    const balance = this.usageBalances.get(key) ?? 0;
    if (balance < cost) return false;
    this.usageBalances.set(key, balance - cost);
    this.usageDebitedTotal.set(key, (this.usageDebitedTotal.get(key) ?? 0) + cost);
    return true;
  }

  async usageDebited(owner: FlowOwner): Promise<number> {
    return this.usageDebitedTotal.get(`${owner.uid}|${owner.workspaceId}`) ?? 0;
  }

  async applyEffect(runId: string, stepId: string): Promise<'applied' | 'duplicate'> {
    const key = `${runId}|${stepId}`;
    const attempts = this.effectAttempts.get(key) ?? 0;
    this.effectAttempts.set(key, attempts + 1);
    if (attempts > 0) return 'duplicate';
    // Only the FIRST application commits; every later attempt is a duplicate.
    this.effectsApplied.set(key, 1);
    return 'applied';
  }

  async effectCount(runId: string, stepId: string): Promise<number> {
    return this.effectsApplied.get(`${runId}|${stepId}`) ?? 0;
  }

  async currentVersions(): Promise<CurrentVersions> {
    return { sourceRevision: this.sourceRevision, toolRegistry: this.registryVersion };
  }

  async executeTool(toolName: string, params: Record<string, unknown>): Promise<ToolExecution> {
    const queued = this.queuedFailures.get(toolName) ?? 0;
    if (queued > 0) {
      this.queuedFailures.set(toolName, queued - 1);
      return { outcome: 'failed', detail: 'provider_error', effect: 'none' };
    }
    return { outcome: 'succeeded', detail: 'ok', effect: 'none' };
  }

  async insertFlow(flow: AiraFlow): Promise<void> {
    this.flows.set(flow.runId, cloneFlow(flow));
  }

  async saveFlow(flow: AiraFlow): Promise<void> {
    this.flows.set(flow.runId, cloneFlow(flow));
  }

  async flow(runId: string): Promise<AiraFlow | undefined> {
    const found = this.flows.get(runId);
    return found ? cloneFlow(found) : undefined;
  }

  async appendCheckpoint(flow: AiraFlow): Promise<string> {
    const checkpointId = `${flow.runId}_chk${flow.checkpoints.length + 1}`;
    const list = this.checkpoints.get(flow.runId) ?? [];
    list.push(cloneFlow(flow));
    this.checkpoints.set(flow.runId, list);
    return checkpointId;
  }

  async restoreLatestCheckpoint(runId: string): Promise<AiraFlow | undefined> {
    const list = this.checkpoints.get(runId);
    if (!list || list.length === 0) return undefined;
    return cloneFlow(list[list.length - 1]);
  }
}
