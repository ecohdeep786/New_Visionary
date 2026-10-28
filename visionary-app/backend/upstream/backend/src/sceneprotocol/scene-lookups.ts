// AI-16 (KAN-150) — the scene-protocol domain's typed state seams. The owning
// store (versioned scene registry, durable run bindings, per-(run, scene)
// synchronized event streams) implements these at integration; the in-memory
// implementation is contract-true and fails closed.
import type { SceneDefinition, SceneEvent, SceneOwner } from './scene-types';

/** A durable run bound for scene execution (BUILD-04/AI-14 lineage). */
export interface SceneRun {
  runId: string;
  owner: SceneOwner;
  conceptId: string;
  /** The source revision recorded at run start (stale-run detection). */
  sourceRevision: string;
  status: 'running' | 'cancelled';
}

export interface SceneProtocolStore {
  saveScene(def: SceneDefinition): Promise<void>;
  scene(sceneId: string, version: number): Promise<SceneDefinition | undefined>;
  insertRun(run: SceneRun): Promise<void>;
  run(runId: string): Promise<SceneRun | undefined>;
  appendSceneEvent(runId: string, sceneKey: string, event: SceneEvent): Promise<void>;
  sceneEvents(runId: string, sceneKey: string): Promise<SceneEvent[]>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Contract-true in-memory store; every seam fails closed. */
export class InMemorySceneProtocolStore implements SceneProtocolStore {
  private scenes = new Map<string, SceneDefinition>();
  private runs = new Map<string, SceneRun>();
  private eventStreams = new Map<string, SceneEvent[]>();

  async saveScene(def: SceneDefinition): Promise<void> {
    this.scenes.set(`${def.sceneId}@${def.version}`, clone(def));
  }

  async scene(sceneId: string, version: number): Promise<SceneDefinition | undefined> {
    const found = this.scenes.get(`${sceneId}@${version}`);
    return found ? clone(found) : undefined;
  }

  async insertRun(run: SceneRun): Promise<void> {
    this.runs.set(run.runId, clone(run));
  }

  async run(runId: string): Promise<SceneRun | undefined> {
    const found = this.runs.get(runId);
    return found ? clone(found) : undefined;
  }

  async appendSceneEvent(runId: string, sceneKey: string, event: SceneEvent): Promise<void> {
    const key = `${runId}|${sceneKey}`;
    const list = this.eventStreams.get(key) ?? [];
    list.push(clone(event));
    this.eventStreams.set(key, list);
  }

  async sceneEvents(runId: string, sceneKey: string): Promise<SceneEvent[]> {
    return (this.eventStreams.get(`${runId}|${sceneKey}`) ?? []).map(clone);
  }
}
