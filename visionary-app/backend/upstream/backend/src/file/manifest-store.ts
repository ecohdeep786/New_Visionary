// FILE-02 — manifest store contract + in-memory synthetic implementation.
// The Cloud SQL/adapter implements the same surface over private-object
// manifest rows. Durable generation + retainedBy let the enabler reproduce
// reference verification and safe collection without a live object store.
import type { ObjectManifest } from './manifest-types';

export type ManifestWriteResult = { ok: true; manifest: ObjectManifest } | { ok: false; reason: 'not_found' | 'conflict' | 'unauthorized' | 'immutable' };

export type ManifestPatch = Partial<Pick<ObjectManifest, 'retainedBy' | 'referenced' | 'collectedAt'>>;

export interface ManifestStore {
  insert(manifest: ObjectManifest): Promise<void>;
  get(objectId: string, generation: number): Promise<ObjectManifest | null>;
  generations(objectId: string): Promise<ObjectManifest[]>;
  /** Fenced update: applies `patch` only when the row's owner matches and it is not immutable except for allowed fields. */
  transition(objectId: string, generation: number, ownerUid: string, patch: ManifestPatch): Promise<ManifestWriteResult>;
  all(): Promise<ObjectManifest[]>;
  nextGeneration(objectId: string): Promise<number>;
}

export class InMemoryManifestStore implements ManifestStore {
  readonly manifests = new Map<string, ObjectManifest>();

  private key(objectId: string, generation: number): string {
    return `${objectId}:${generation}`;
  }

  async insert(manifest: ObjectManifest): Promise<void> { this.manifests.set(this.key(manifest.objectId, manifest.generation), manifest); }
  async get(objectId: string, generation: number): Promise<ObjectManifest | null> {
    return this.manifests.get(this.key(objectId, generation)) ?? null;
  }
  async generations(objectId: string): Promise<ObjectManifest[]> {
    return [...this.manifests.values()].filter((m) => m.objectId === objectId).sort((a, b) => a.generation - b.generation);
  }
  async transition(objectId: string, generation: number, ownerUid: string, patch: ManifestPatch): Promise<ManifestWriteResult> {
    const cur = this.manifests.get(this.key(objectId, generation));
    if (!cur) return { ok: false, reason: 'not_found' };
    if (cur.ownerUid !== ownerUid) return { ok: false, reason: 'unauthorized' };
    // Digest/size/type/generation/createdAt are immutable once published (FILE-02).
    const immutableFields = ['digest', 'size', 'type', 'ownerUid', 'createdAt', 'generation'] as const;
    for (const field of immutableFields) {
      if (field in patch) return { ok: false, reason: 'immutable' };
    }
    const next = { ...cur, ...patch } as ObjectManifest;
    this.manifests.set(this.key(objectId, generation), next);
    return { ok: true, manifest: next };
  }
  async all(): Promise<ObjectManifest[]> { return [...this.manifests.values()]; }
  async nextGeneration(objectId: string): Promise<number> {
    const gens = await this.generations(objectId);
    return gens.length === 0 ? 1 : gens[gens.length - 1].generation + 1;
  }
}
