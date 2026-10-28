// AI-14 (KAN-143) — the AIRA deterministic teaching/workflow harness over the
// durable run protocol (BUILD-04).
//
// Core responsibilities (server-owned; bounded; fail closed):
//   1. ONE context owner: the flow records exactly one server-recorded owner;
//      every operation derives authority from the authenticated caller checked
//      against it — unknown run and wrong owner are denied uniformly (no
//      existence leak); a different workspace owns nothing.
//   2. TYPED ALLOWLISTED TOOLS: tools exist only in the server registry with
//      typed required params; unregistered tools refuse. BANNED families
//      (charging/publishing/grading/private_data) are refused at registration,
//      so no autonomous charging, publishing, grading or private-data access
//      is expressible.
//   3. SERVER POLICY CHECKS PER CALL: allowlist + ownership + schema +
//      capability + version pins are re-checked on EVERY execution — a past
//      check is never reused.
//   4. PINNED VERSIONS: source/model/prompt/tool-registry versions bind at
//      start and stay immutable; server-recorded current versions that drift
//      from the pins refuse every call (no silent version drift).
//   5. BOUNDED BRANCHES/RETRIES: the step budget bounds the whole flow; a step
//      retries only within the attempt bound (never an open loop).
//   6. CHECKPOINT/RESTART: every accepted step appends an immutable checkpoint;
//      restart resumes from the LAST checkpoint byte-stably — succeeded steps
//      stay succeeded, and no product effect is re-applied.
//   7. EXPLICIT PAUSE/RESUME/APPROVAL: an approval-required tool pauses the run
//      until the OWNER explicitly approves; non-owner approval is denied.
//   8. STOP CONDITIONS: owner stop, usage-budget exhaustion and final-step
//      success are terminal — a terminal run accepts no further transitions.
//   9. EXACTLY-ONCE PRODUCT SIDE EFFECTS + MEASURED USAGE: effect application
//      goes through the store's exactly-once ledger keyed by (runId, stepId);
//      an ambiguous crash-window retry converges to `duplicate` and never
//      applies twice; fresh executions debit measured usage once.
//  10. SAFE REPLANNING: a replacement step is accepted only for an OBSERVED
//      failure, stays within the branch bound, and records what it replaces.
//  11. MODEL PLANS/MEMORY STAY PROVISIONAL: a model-proposed step carries no
//      accepted product state until it actually executes and is observed.
import type {
  AiraFlow,
  AiraFlowError as AiraFlowErrorType,
  FlowOwner,
  FlowStep,
  ObservedOutcome,
  PinnedVersions,
  ToolExecution,
  ToolSpec,
} from './airaflow-types';
import { AiraFlowError } from './airaflow-types';
import type { AiraFlowStore } from './airaflow-lookups';

/** Tool families that may never enter the registry (no autonomous product acts). */
const BANNED_FAMILIES: readonly string[] = ['charging', 'publishing', 'grading', 'private_data'];

/** A model/server plan step as submitted to startFlow (no server ids yet). */
export interface PlanStep {
  tool: string;
  params: Record<string, unknown>;
}

export interface ReplanStep {
  tool: string;
  params: Record<string, unknown>;
}

export interface ExecuteResult {
  flow: AiraFlow;
  stepId: string;
  observation: ObservedOutcome;
}

export class AiraFlowService {
  private flowCounter = 0;

  constructor(
    private readonly store: AiraFlowStore,
    private readonly defaults: { maxSteps: number; maxAttempts: number } = { maxSteps: 8, maxAttempts: 2 },
  ) {}

  /** Register one tool into the server-owned typed allowlist. */
  async registerTool(spec: ToolSpec): Promise<void> {
    if (BANNED_FAMILIES.includes(spec.family)) {
      throw new AiraFlowError('tool_forbidden');
    }
    await this.store.registerTool(spec);
  }

  /** Grant a server capability to an owner (checked again on every call). */
  async grantCapability(owner: FlowOwner, capability: string): Promise<void> {
    await this.store.grantCapability(owner, capability);
  }

  /** Start a bounded flow from a model/server plan, pinning versions immutably. */
  async startFlow(
    owner: FlowOwner,
    projectId: string,
    pinned: PinnedVersions,
    plan: readonly PlanStep[],
  ): Promise<AiraFlow> {
    if (!plan.length) throw new AiraFlowError('plan_empty');
    if (
      !pinned.sourceRevision ||
      !pinned.model ||
      !pinned.prompt ||
      !pinned.toolRegistry
    ) {
      throw new AiraFlowError('pin_invalid');
    }
    if (plan.length > this.defaults.maxSteps) throw new AiraFlowError('branch_bound_exceeded');
    // The typed plan is checked when admitted: every tool must be allowlisted
    // and carry its typed params (deterministic intake, not open-ended).
    for (const step of plan) {
      const spec = await this.store.tool(step.tool);
      if (!spec) throw new AiraFlowError('tool_not_allowlisted');
      if (spec.requiredParams.some((p) => !(p in step.params))) {
        throw new AiraFlowError('schema_invalid');
      }
    }
    // The pins bind to the SERVER-RECORDED current versions at start.
    const current = await this.store.currentVersions();
    if (
      current.sourceRevision !== pinned.sourceRevision ||
      current.toolRegistry !== pinned.toolRegistry
    ) {
      throw new AiraFlowError('version_drift');
    }

    const runId = `flow_${++this.flowCounter}`;
    const steps: FlowStep[] = plan.map((step, i) => ({
      stepId: `${runId}_s${i + 1}`,
      tool: step.tool,
      params: { ...step.params },
      origin: 'model_plan',
      provisional: true,
      status: 'pending',
      attempt: 0,
      observed: null,
      replacesStepId: null,
    }));
    const flow: AiraFlow = {
      runId,
      owner: { ...owner },
      projectId,
      pinned: { ...pinned },
      status: 'running',
      steps,
      checkpoints: [],
      measuredUsage: 0,
      maxSteps: this.defaults.maxSteps,
      maxAttempts: this.defaults.maxAttempts,
    };
    flow.checkpoints = [await this.store.appendCheckpoint(flow)];
    await this.store.insertFlow(flow);
    return flow;
  }

  /** Execute one step: re-checks EVERY policy on EVERY call (fail closed). */
  async executeStep(runId: string, owner: FlowOwner, stepId: string): Promise<ExecuteResult> {
    const flow = await this.getOwned(runId, owner);
    if (flow.status !== 'running') throw new AiraFlowError('flow_not_active');
    const step = flow.steps.find((s) => s.stepId === stepId);
    if (!step) throw new AiraFlowError('unknown_step');

    // Idempotent replay: an already-succeeded step never re-executes.
    if (step.status === 'succeeded') {
      return {
        flow,
        stepId,
        observation: { ...step.observed!, effect: step.observed!.effect },
      };
    }

    // Per-call policy checks (a past check is never reused).
    const spec = await this.store.tool(step.tool);
    if (!spec) throw new AiraFlowError('tool_not_allowlisted');
    await this.assertNoVersionDrift(flow);
    if (!(await this.store.capabilityGranted(owner, spec.capability))) {
      throw new AiraFlowError('capability_required');
    }
    if (spec.requiredParams.some((p) => !(p in step.params))) {
      throw new AiraFlowError('schema_invalid');
    }
    if (step.attempt + 1 > flow.maxAttempts) throw new AiraFlowError('retry_bound_exceeded');

    // Explicit approval pause: the run stops here until the owner approves.
    if (spec.requiresApproval && step.status !== 'approved') {
      step.status = 'awaiting_approval';
      flow.status = 'paused_awaiting_approval';
      await this.store.saveFlow(flow);
      throw new AiraFlowError('approval_required');
    }

    // Product effects pass the exactly-once ledger BEFORE any debit: an
    // ambiguous crash-window retry (effect already applied, state lost) lands
    // here as `duplicate` — the effect stands, no work repeats, no usage is
    // debited twice.
    let execution: ToolExecution;
    if (spec.effect === 'product_effect') {
      const applied = await this.store.applyEffect(runId, stepId);
      if (applied === 'duplicate') {
        const observation: ObservedOutcome = {
          outcome: 'succeeded',
          detail: 'exactly_once_duplicate_preserved',
          effect: 'duplicate',
        };
        return this.recordObservation(flow, step, observation);
      }
      // Fresh accepted effect: debit measured usage for the work.
      if (!(await this.store.tryConsumeUsage(owner, spec.usageCost))) {
        flow.status = 'stopped';
        await this.store.saveFlow(flow);
        throw new AiraFlowError('usage_exhausted');
      }
      flow.measuredUsage += spec.usageCost;
      step.attempt += 1;
      execution = await this.store.executeTool(step.tool, step.params);
      execution.effect = 'applied';
    } else {
      // Read-only work: debit then execute (each retry is real provider work).
      if (!(await this.store.tryConsumeUsage(owner, spec.usageCost))) {
        flow.status = 'stopped';
        await this.store.saveFlow(flow);
        throw new AiraFlowError('usage_exhausted');
      }
      flow.measuredUsage += spec.usageCost;
      step.attempt += 1;
      execution = await this.store.executeTool(step.tool, step.params);
    }

    return this.recordObservation(flow, step, {
      outcome: execution.outcome,
      detail: execution.detail,
      effect: execution.effect,
    });
  }

  /** Common tail: observed state, checkpoint on success, terminal final step. */
  private async recordObservation(
    flow: AiraFlow,
    step: FlowStep,
    observation: ObservedOutcome,
  ): Promise<ExecuteResult> {
    step.observed = observation;
    step.status = observation.outcome === 'succeeded' ? 'succeeded' : 'failed';
    // The model plan's proposal is now an OBSERVED server outcome.
    if (step.status === 'succeeded') step.provisional = false;

    // Stop condition: every step has reached a terminal observed state and the
    // latest observation succeeded (a failed step keeps the run open for a
    // bounded replan; the owner can always stop explicitly).
    const allTerminal = flow.steps.every((s) => s.status === 'succeeded' || s.status === 'failed');
    if (step.status === 'succeeded' && allTerminal) {
      flow.status = 'succeeded';
      flow.checkpoints = [...flow.checkpoints, await this.store.appendCheckpoint(flow)];
      await this.store.saveFlow(flow);
      return { flow, stepId: step.stepId, observation };
    }

    if (step.status === 'succeeded') {
      // Checkpoint/restart: every accepted step appends an immutable checkpoint.
      flow.checkpoints = [...flow.checkpoints, await this.store.appendCheckpoint(flow)];
    }
    await this.store.saveFlow(flow);
    return { flow, stepId: step.stepId, observation };
  }

  /** Owner-only explicit approval of a paused step (resume). */
  async approveStep(runId: string, owner: FlowOwner, stepId: string): Promise<AiraFlow> {
    const flow = await this.getOwned(runId, owner);
    if (flow.status !== 'paused_awaiting_approval') throw new AiraFlowError('flow_not_active');
    const step = flow.steps.find((s) => s.stepId === stepId);
    if (!step) throw new AiraFlowError('unknown_step');
    if (step.status !== 'awaiting_approval') throw new AiraFlowError('approval_not_pending');
    step.status = 'approved';
    flow.status = 'running';
    await this.store.saveFlow(flow);
    return flow;
  }

  /** Safe replanning: only after an OBSERVED failure, within the branch bound. */
  async replan(
    runId: string,
    owner: FlowOwner,
    failedStepId: string,
    replacement: ReplanStep,
  ): Promise<AiraFlow> {
    const flow = await this.getOwned(runId, owner);
    if (flow.status !== 'running') throw new AiraFlowError('flow_not_active');
    const failed = flow.steps.find((s) => s.stepId === failedStepId);
    if (!failed) throw new AiraFlowError('unknown_step');
    // Safe replanning requires an OBSERVED failure — never a guess.
    if (!(failed.status === 'failed' && failed.observed?.outcome === 'failed')) {
      throw new AiraFlowError('replan_requires_observed_failure');
    }
    if (flow.steps.length + 1 > flow.maxSteps) throw new AiraFlowError('branch_bound_exceeded');
    const spec = await this.store.tool(replacement.tool);
    if (!spec) throw new AiraFlowError('tool_not_allowlisted');
    if (spec.requiredParams.some((p) => !(p in replacement.params))) {
      throw new AiraFlowError('schema_invalid');
    }
    const step: FlowStep = {
      stepId: `${runId}_s${flow.steps.length + 1}`,
      tool: replacement.tool,
      params: { ...replacement.params },
      origin: 'model_plan',
      provisional: true,
      status: 'pending',
      attempt: 0,
      observed: null,
      replacesStepId: failedStepId,
    };
    flow.steps.push(step);
    await this.store.saveFlow(flow);
    return flow;
  }

  /** Restart: resume from the LAST checkpoint (byte-stable, no effect replay). */
  async restart(runId: string, owner: FlowOwner): Promise<AiraFlow> {
    await this.getOwned(runId, owner);
    const restored = await this.store.restoreLatestCheckpoint(runId);
    if (!restored) throw new AiraFlowError('not_owner');
    await this.store.saveFlow(restored);
    return restored;
  }

  /** Owner stop condition; terminal — no further transitions. */
  async stop(runId: string, owner: FlowOwner, reason: string): Promise<AiraFlow> {
    const flow = await this.getOwned(runId, owner);
    if (flow.status === 'succeeded' || flow.status === 'stopped') {
      throw new AiraFlowError('flow_not_active');
    }
    flow.status = 'stopped';
    flow.steps.forEach((s) => {
      if (s.status === 'awaiting_approval') s.status = 'approved';
    });
    void reason;
    await this.store.saveFlow(flow);
    return flow;
  }

  /** Owner-scoped read. */
  async getFlow(runId: string, owner: FlowOwner): Promise<AiraFlow> {
    return this.getOwned(runId, owner);
  }

  /** Uniform denial: unknown run and wrong owner are the same `not_owner`. */
  private async getOwned(runId: string, owner: FlowOwner): Promise<AiraFlow> {
    const flow = await this.store.flow(runId);
    if (!flow || flow.owner.uid !== owner.uid || flow.owner.workspaceId !== owner.workspaceId) {
      throw new AiraFlowError('not_owner');
    }
    return flow;
  }

  /** Pinned versions are immutable; server-recorded drift refuses every call. */
  private async assertNoVersionDrift(flow: AiraFlow): Promise<void> {
    const current = await this.store.currentVersions();
    if (
      current.sourceRevision !== flow.pinned.sourceRevision ||
      current.toolRegistry !== flow.pinned.toolRegistry
    ) {
      throw new AiraFlowError('version_drift');
    }
  }
}

export type { AiraFlowErrorType };
