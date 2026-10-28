// AI-16 (KAN-150) — the versioned approved scene registry + structured action
// protocol service.
//
// Core responsibilities (server-owned; bounded; read-only; fail closed):
//   1. registerScene: versioned (conflicting same-version redefinition refuses
//      `scene_version_conflict`; identical re-set is idempotent); requires a
//      concept + permitted source revision, language coverage, declared
//      operations and the keyboard+text fallback floor (`fallback_floor_required`,
//      `scene_definition_invalid`). A scene that embeds generated code refuses
//      at registration (`generated_execution_refused`).
//   2. approveScene: explicit server approval records the approver; an
//      unapproved scene never executes (`scene_not_approved`).
//   3. advertiseCapabilities: 3D/voice are advertised ONLY for the
//      server-released scene+language coverage — honestly empty otherwise.
//   4. executeAction: the structured protocol — the run must exist, be
//      running, belong to the caller and carry the SAME permitted source
//      revision as the scene (`stale_run_rejected` otherwise); the language
//      must be released for the scene (`language_not_released`); the
//      operation must be allowlisted for the scene
//      (`operation_not_allowlisted`); parameters must be within the
//      registered bounds (`param_out_of_bounds`); a generated-code/URL/raw-
//      token payload refuses (`generated_execution_refused`); the result is
//      an observed read-only value plus the synchronized event position.
//   5. recordSceneEvent / replayEvents: the synchronized approved
//      narration/event stream per (run, scene) — replay from any sequence
//      position is deterministic (`replay_seq_invalid` for a bad position);
//      a cancelled run rejects further events and actions (`run_cancelled`).
//   6. Uniform denial: unknown run and wrong owner are the same `not_owner`
//      (no existence leak).
import type {
  SceneAction,
  SceneDefinition,
  SceneEvent,
  SceneObservation,
  SceneOwner,
  SceneProtocolError as SceneProtocolErrorType,
} from './scene-types';
import { SceneProtocolError } from './scene-types';
import type { SceneProtocolStore } from './scene-lookups';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function strip<T>(value: T, keys: string[]): string {
  const copy = clone(value) as unknown as Record<string, unknown>;
  for (const key of keys) delete copy[key];
  return JSON.stringify(copy);
}

/** Registration comparison ignores the approval fields (a later approval must not break re-sets). */
const APPROVAL_FIELDS = ['approved', 'approvedBy'];

export class SceneProtocolService {
  private eventCounter = 0;

  constructor(private readonly store: SceneProtocolStore) {}

  /** Register one versioned scene definition (append-only per version). */
  async registerScene(def: SceneDefinition): Promise<SceneDefinition> {
    if (
      !def.sceneId ||
      !Number.isInteger(def.version) ||
      def.version < 1 ||
      !def.conceptId ||
      !def.sourceRevision ||
      !def.languages?.length ||
      !def.operations?.length
    ) {
      throw new SceneProtocolError('scene_definition_invalid');
    }
    if (!def.fallbacks.includes('keyboard') || !def.fallbacks.includes('text')) {
      throw new SceneProtocolError('fallback_floor_required');
    }
    // A scene that embeds generated code is not a representation — refuse.
    for (const key of Object.keys(def as unknown as Record<string, unknown>)) {
      if (/code|script|url|token/i.test(key) && (def as unknown as Record<string, unknown>)[key]) {
        throw new SceneProtocolError('generated_execution_refused');
      }
    }
    const existing = await this.store.scene(def.sceneId, def.version);
    if (existing) {
      if (strip(existing, APPROVAL_FIELDS) !== strip(def, APPROVAL_FIELDS)) {
        throw new SceneProtocolError('scene_version_conflict');
      }
      return existing;
    }
    await this.store.saveScene({
      ...clone(def),
      approved: false,
      approvedBy: null,
      languages: [...def.languages],
      operations: [...def.operations],
      fallbacks: [...def.fallbacks],
      declaredCapabilities: [...(def.declaredCapabilities ?? [])],
      releasedCapabilities: [...(def.releasedCapabilities ?? [])],
      narrationRefs: [...(def.narrationRefs ?? [])],
    });
    return def;
  }

  /** Explicit server approval; an unapproved scene never executes. */
  async approveScene(sceneId: string, version: number, approver: string): Promise<SceneDefinition> {
    if (!approver?.trim()) throw new SceneProtocolError('scene_not_approved');
    const def = await this.getScene(sceneId, version);
    const updated: SceneDefinition = { ...def, approved: true, approvedBy: approver };
    await this.store.saveScene(updated);
    return updated;
  }

  /**
   * Released-coverage honesty: 3D/voice are advertised ONLY where the server
   * released them for this scene AND the requested language is covered.
   */
  async advertiseCapabilities(
    owner: SceneOwner,
    sceneId: string,
    version: number,
    language: string,
  ): Promise<{ capabilities: string[] }> {
    const def = await this.getScene(sceneId, version);
    if (!def.languages.includes(language)) return { capabilities: [] };
    const released = def.releasedCapabilities.filter((c) => def.declaredCapabilities.includes(c));
    return { capabilities: [...released] };
  }

  /** Execute one structured, bounded, read-only scene action. */
  async executeAction(action: SceneAction): Promise<SceneObservation> {
    const run = await this.store.run(action.runId);
    if (!run || run.owner.uid !== action.owner.uid || run.owner.workspaceId !== action.owner.workspaceId) {
      throw new SceneProtocolError('not_owner');
    }
    if (run.status === 'cancelled') throw new SceneProtocolError('run_cancelled');
    const def = await this.getScene(action.sceneId, action.sceneVersion);
    if (!def.approved) throw new SceneProtocolError('scene_not_approved');
    // Tied to permitted revisions: the run's recorded revision must match.
    if (run.sourceRevision !== def.sourceRevision || run.conceptId !== def.conceptId) {
      throw new SceneProtocolError('stale_run_rejected');
    }
    if (!def.languages.includes(action.language)) throw new SceneProtocolError('language_not_released');
    if (!def.operations.includes(action.operation)) {
      throw new SceneProtocolError('operation_not_allowlisted');
    }
    // No generated JavaScript, no URLs, no raw SCENE-token execution.
    for (const key of Object.keys(action.params)) {
      if (/code|script|url|token|scene_token/i.test(key)) {
        throw new SceneProtocolError('generated_execution_refused');
      }
    }
    // Bounded parameters against the registered bounds.
    for (const [key, value] of Object.entries(action.params)) {
      const bound = def.paramBounds[key];
      if (!bound) throw new SceneProtocolError('param_out_of_bounds');
      if (typeof value === 'number') {
        if (bound.min !== undefined && value < bound.min) throw new SceneProtocolError('param_out_of_bounds');
        if (bound.max !== undefined && value > bound.max) throw new SceneProtocolError('param_out_of_bounds');
      } else if (typeof value === 'string') {
        if (bound.maxLength !== undefined && value.length > bound.maxLength) {
          throw new SceneProtocolError('param_out_of_bounds');
        }
      } else {
        throw new SceneProtocolError('param_out_of_bounds');
      }
    }
    const result = await this.runOperation(def, action);
    const events = await this.store.sceneEvents(action.runId, `${action.sceneId}@${action.sceneVersion}`);
    return {
      runId: action.runId,
      sceneId: action.sceneId,
      sceneVersion: action.sceneVersion,
      operation: action.operation,
      result,
      eventSeq: events.length,
    };
  }

  /** Record one synchronized scene event on the (run, scene) stream. */
  async recordSceneEvent(
    runId: string,
    owner: SceneOwner,
    sceneId: string,
    version: number,
    kind: string,
    narrationRef: string | null,
  ): Promise<SceneEvent> {
    const run = await this.store.run(runId);
    if (!run || run.owner.uid !== owner.uid || run.owner.workspaceId !== owner.workspaceId) {
      throw new SceneProtocolError('not_owner');
    }
    if (run.status === 'cancelled') throw new SceneProtocolError('run_cancelled');
    const def = await this.getScene(sceneId, version);
    if (run.sourceRevision !== def.sourceRevision || run.conceptId !== def.conceptId) {
      throw new SceneProtocolError('stale_run_rejected');
    }
    const events = await this.store.sceneEvents(runId, `${sceneId}@${version}`);
    const event: SceneEvent = {
      seq: events.length + 1,
      kind,
      narrationRef,
      at: new Date().toISOString(),
    };
    await this.store.appendSceneEvent(runId, `${sceneId}@${version}`, event);
    return event;
  }

  /** Deterministic synchronized replay of approved narration/events. */
  async replayEvents(
    runId: string,
    owner: SceneOwner,
    sceneId: string,
    version: number,
    fromSeq: number,
  ): Promise<SceneEvent[]> {
    const run = await this.store.run(runId);
    if (!run || run.owner.uid !== owner.uid || run.owner.workspaceId !== owner.workspaceId) {
      throw new SceneProtocolError('not_owner');
    }
    await this.getScene(sceneId, version);
    const events = await this.store.sceneEvents(runId, `${sceneId}@${version}`);
    if (!Number.isInteger(fromSeq) || fromSeq < 0 || fromSeq > events.length) {
      throw new SceneProtocolError('replay_seq_invalid');
    }
    return events.slice(fromSeq);
  }

  /** Open a durable scene run bound to the permitted concept + revision. */
  async openRun(owner: SceneOwner, runId: string, conceptId: string, sourceRevision: string): Promise<void> {
    await this.store.insertRun({ runId, owner: { ...owner }, conceptId, sourceRevision, status: 'running' });
  }

  /** Cancel a run (cancellation semantics); further actions/events refuse. */
  async cancelRun(runId: string, owner: SceneOwner): Promise<void> {
    const run = await this.store.run(runId);
    if (!run || run.owner.uid !== owner.uid || run.owner.workspaceId !== owner.workspaceId) {
      throw new SceneProtocolError('not_owner');
    }
    await this.store.insertRun({ ...run, status: 'cancelled' });
  }

  /** Allowlisted read-only operations (deterministic; no product writes). */
  private async runOperation(def: SceneDefinition, action: SceneAction): Promise<string> {
    if (action.operation === 'math_evaluate') {
      const a = action.params.a as number;
      const b = action.params.b as number;
      const op = action.params.op as string;
      if (op === 'add') return String(a + b);
      if (op === 'subtract') return String(a - b);
      if (op === 'multiply') return String(a * b);
      if (op === 'divide') {
        if (b === 0) return 'observed_failed:divide_by_zero';
        return String(a / b);
      }
      throw new SceneProtocolError('operation_not_allowlisted');
    }
    if (action.operation === 'scene_state_read') {
      const key = action.params.stateKey as string;
      const value = def.stateValues[key];
      if (value === undefined) return 'observed_failed:unknown_state_key';
      return value;
    }
    // narration_step_read: approved narration references only.
    const stepId = action.params.stepId as string;
    const step = def.narrationRefs.find((n) => n.stepId === stepId && n.language === action.language);
    if (!step) return 'observed_failed:unknown_narration_step';
    return step.narrationRef;
  }

  private async getScene(sceneId: string, version: number): Promise<SceneDefinition> {
    const def = await this.store.scene(sceneId, version);
    if (!def) throw new SceneProtocolError('scene_version_unknown');
    return def;
  }
}

export type { SceneProtocolErrorType };
