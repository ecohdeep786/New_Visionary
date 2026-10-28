// AI-16 (KAN-150) — the versioned approved representation/scene registry and
// structured action protocol types.
//
// The checkpoint here is an APPROVED, VERSIONED scene registry with a
// STRUCTURED, BOUNDED, READ-ONLY action protocol — never raw execution:
//   - VERSIONED + APPROVED: scenes register per version (conflicting
//     redefinition refuses; identical re-set idempotent) and execute only
//     after an explicit server approval.
//   - TIED TO PERMITTED REVISIONS: every scene binds one concept + permitted
//     source revision; every action runs inside a durable run whose recorded
//     source revision must match — a moved revision rejects the run as stale.
//   - ALLOWLISTED READ-ONLY OPERATIONS with BOUNDED parameters: typed
//     math/state/narration reads with numeric ranges and string lengths;
//     NO generated JavaScript, NO URLs, NO raw SCENE-token execution — a
//     generated payload refuses at the action boundary, and a scene that
//     embeds code refuses at registration.
//   - SYNCHRONIZED APPROVED NARRATION/EVENTS: the per-(run, scene) event
//     stream replays deterministically from any sequence position; a
//     cancelled run rejects further events and actions.
//   - DEVICE FALLBACKS: keyboard + text are the accessibility floor at
//     registration; 2D and reduced-motion are declared per scene.
//   - RELEASED COVERAGE HONESTY: 3D/voice are advertised ONLY for the
//     server-released scene/language coverage — an unreleased capability
//     reports unavailable, never advertised.
//
// Exit: synchronized approved representations with bounded read-only actions
// and honest released coverage.

/** The authenticated caller. */
export interface SceneOwner {
  uid: string;
  workspaceId: string;
}

/** Allowlisted read-only operations (no product side effects). */
export type SceneOperation = 'math_evaluate' | 'scene_state_read' | 'narration_step_read';

export const ALLOWED_OPERATIONS: readonly SceneOperation[] = [
  'math_evaluate',
  'scene_state_read',
  'narration_step_read',
];

export type SceneFallback = 'keyboard' | 'text' | '2d' | 'reduced_motion';

export type SceneCapability = '3d' | 'voice';

/** Param bounds (numeric ranges / string lengths) — bounded parameters. */
export interface ParamBound {
  min?: number;
  max?: number;
  maxLength?: number;
}

/** One versioned, approved scene definition. */
export interface SceneDefinition {
  sceneId: string;
  version: number;
  /** Explicit server approval — an unapproved scene never executes. */
  approved: boolean;
  approvedBy: string | null;
  /** Permitted binding: the scene teaches exactly this concept at this revision. */
  conceptId: string;
  sourceRevision: string;
  languages: readonly string[];
  operations: readonly SceneOperation[];
  paramBounds: Record<string, ParamBound>;
  /** Declared device fallbacks (keyboard + text are the floor). */
  fallbacks: readonly SceneFallback[];
  /** Declared vs server-released capabilities (3D/voice honesty). */
  declaredCapabilities: readonly SceneCapability[];
  releasedCapabilities: readonly SceneCapability[];
  /** Approved narration step references (no raw content in the registry). */
  narrationRefs: readonly { stepId: string; language: string; narrationRef: string }[];
  /** Read-only state the scene may expose. */
  stateValues: Record<string, string>;
}

/** A structured scene action — typed, bounded, read-only. */
export interface SceneAction {
  owner: SceneOwner;
  /** The durable run this action executes inside (BUILD-04/AI-14 lineage). */
  runId: string;
  sceneId: string;
  sceneVersion: number;
  language: string;
  operation: SceneOperation;
  params: Record<string, number | string>;
}

/** One synchronized scene event (approved narration/event sequence). */
export interface SceneEvent {
  seq: number;
  kind: string;
  narrationRef: string | null;
  at: string;
}

export interface SceneObservation {
  runId: string;
  sceneId: string;
  sceneVersion: number;
  operation: SceneOperation;
  /** Observed read-only result (e.g. math result, state value, narration ref). */
  result: string;
  /** Current synchronized event position for replay. */
  eventSeq: number;
}

export class SceneProtocolError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_run'
      | 'run_cancelled'
      | 'stale_run_rejected'
      | 'scene_definition_invalid'
      | 'scene_version_conflict'
      | 'scene_version_unknown'
      | 'scene_not_approved'
      | 'fallback_floor_required'
      | 'generated_execution_refused'
      | 'operation_not_allowlisted'
      | 'param_out_of_bounds'
      | 'language_not_released'
      | 'replay_seq_invalid'
  ) {
    super(code);
  }
}
