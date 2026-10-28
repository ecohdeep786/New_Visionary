// AI-14 (KAN-143) — the AIRA deterministic teaching/workflow harness types.
//
// The checkpoint here is a BOUNDED workflow/agent harness over the durable run
// protocol (BUILD-04) — never an open-ended autonomous agent:
//   - ONE context owner: the flow records exactly one server-recorded owner;
//     every operation derives authority from the authenticated caller checked
//     against it (uniform denial, no existence leak).
//   - TYPED ALLOWLISTED TOOLS: tools exist only in a server-owned registry with
//     typed required params and an explicit effect class; an unregistered tool
//     refuses. Charging/publishing/grading/private-data families are BANNED —
//     the registry refuses them, so no autonomous charging, publishing,
//     grading or private-data access is even expressible.
//   - SERVER POLICY CHECKS PER CALL: capability + ownership + schema + version
//     pinning are re-checked on EVERY tool call — a past check is never reused.
//   - PINNED VERSIONS: source/model/prompt/tool-registry versions bind at
//     start and are immutable; server-recorded current versions that drift
//     from the pins refuse (no silent version drift).
//   - BOUNDED BRANCHES/RETRIES: the step budget bounds the whole flow; a step
//     retries only within the attempt bound.
//   - MODEL PLANS/MEMORY STAY PROVISIONAL: a model-proposed step produces no
//     product state until it actually executes and is observed.
//
// Exit: bounded, deterministic workflows with exactly-once accepted product
// side effects and measured usage.

/** The authenticated caller and single context owner. */
export interface FlowOwner {
  uid: string;
  workspaceId: string;
}

/** Tool families the registry may never register (no autonomous product acts). */
export type BannedToolFamily = 'charging' | 'publishing' | 'grading' | 'private_data';

/** Tool families the allowlist admits. */
export type AllowedToolFamily = 'retrieval' | 'composition' | 'scene_read' | 'draft_notification';

export type ToolFamily = AllowedToolFamily | BannedToolFamily;

/** Whether the tool observes the world or changes committed product state. */
export type ToolEffect = 'read_only' | 'product_effect';

/** A typed allowlisted tool (server-owned registry entry). */
export interface ToolSpec {
  tool: string;
  family: ToolFamily;
  /** Typed required params — a call missing any of them refuses. */
  requiredParams: readonly string[];
  effect: ToolEffect;
  /** Server capability required on EVERY call of this tool. */
  capability: string;
  /** Explicit approval pause before execution. */
  requiresApproval: boolean;
  /** Measured usage cost per fresh execution (duplicate replays cost nothing). */
  usageCost: number;
}

/** Versions pinned immutably at flow start (no silent version drift). */
export interface PinnedVersions {
  sourceRevision: string;
  model: string;
  prompt: string;
  toolRegistry: string;
}

/** A harness step. Model-proposed steps stay provisional until executed. */
export interface FlowStep {
  stepId: string;
  tool: string;
  params: Record<string, unknown>;
  /** Where the step's plan came from; model plans are provisional. */
  origin: 'model_plan' | 'server';
  provisional: boolean;
  status: 'pending' | 'awaiting_approval' | 'approved' | 'succeeded' | 'failed';
  attempt: number;
  /** Observed final state of the last execution attempt. */
  observed: ObservedOutcome | null;
  /** Set when this step is a safe replan of an observed failure. */
  replacesStepId: string | null;
}

export interface ObservedOutcome {
  outcome: 'succeeded' | 'failed';
  detail: string;
  effect: 'applied' | 'duplicate' | 'none';
}

export type FlowStatus = 'running' | 'paused_awaiting_approval' | 'succeeded' | 'stopped';

/** The AIRA workflow flow — bounded, checkpointed, measured. */
export interface AiraFlow {
  runId: string;
  /** The ONE context owner (server-recorded; authority derives from it). */
  owner: FlowOwner;
  /** The product context the flow acts on (project/conversation id). */
  projectId: string;
  pinned: PinnedVersions;
  status: FlowStatus;
  steps: FlowStep[];
  /** Append-only checkpoint ids; restart resumes from the last one. */
  checkpoints: readonly string[];
  /** Measured usage projection (the store ledger is the authority). */
  measuredUsage: number;
  maxSteps: number;
  maxAttempts: number;
}

/** What the store observed executing one tool call. */
export interface ToolExecution {
  outcome: 'succeeded' | 'failed';
  detail: string;
  /** For product_effect tools: whether the effect applied or was a duplicate. */
  effect: 'applied' | 'duplicate' | 'none';
}

export class AiraFlowError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_step'
      | 'flow_not_active'
      | 'tool_not_allowlisted'
      | 'tool_forbidden'
      | 'schema_invalid'
      | 'capability_required'
      | 'version_drift'
      | 'pin_invalid'
      | 'plan_empty'
      | 'approval_required'
      | 'approval_not_pending'
      | 'usage_exhausted'
      | 'retry_bound_exceeded'
      | 'branch_bound_exceeded'
      | 'replan_requires_observed_failure'
  ) {
    super(code);
  }
}
