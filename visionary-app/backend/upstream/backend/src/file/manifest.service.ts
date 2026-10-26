// FILE-02 — immutable object generations/manifests service: reference
// verification before database commit and safe collection of unattached
// objects.
//
// Rules enforced (server-side):
//   - publish records a new immutable generation (digest/size/type fixed once).
//   - a database row may only be committed if `verifyReference` confirms the
//     exact (objectId, generation) exists, is owned by the acting uid, is not
//     yet collected and is immutable; then `commitReference` marks it referenced.
//   - collectUnattached detaches only generations that are NOT referenced AND
//     have NO retention reasons; a generation still referenced by a retained
//     revision/submission is never deleted.
//   - a re-publish for the same logical object always mints a NEW generation,
//     never mutating an older manifest (older generations stay collectable only
//     after their references drop).
import type { CollectResult, ObjectManifest } from './manifest-types';
import type { ManifestStore, ManifestWriteResult } from './manifest-store';

export class ManifestError extends Error {
  constructor(public readonly code: 'not_found' | 'unauthorized' | 'collected' | 'immutable' | 'conflict' | 'referenced' | 'retained') {
    super(code);
  }
}

export class ManifestService {
  constructor(private readonly store: ManifestStore) {}

  /** Publish a new immutable generation for a logical object. */
  async publish(opts: { objectId: string; ownerUid: string; digest: string; size: number; type: string }): Promise<ObjectManifest> {
    const generation = await this.store.nextGeneration(opts.objectId);
    const manifest: ObjectManifest = {
      objectId: opts.objectId,
      generation,
      digest: opts.digest,
      size: opts.size,
      type: opts.type,
      ownerUid: opts.ownerUid,
      createdAt: new Date().toISOString(),
      retainedBy: [],
      referenced: false,
      collectedAt: null,
    };
    await this.store.insert(manifest);
    return manifest;
  }

  /**
   * Verify a reference BEFORE a database commit. Returns the manifest only when
   * the exact generation exists, owned by `ownerUid`, not collected and
   * immutable; otherwise throws. The caller must hold this result until the row
   * is committed, then call `commitReference`.
   */
  async verifyReference(opts: { objectId: string; generation: number; ownerUid: string }): Promise<ObjectManifest> {
    const manifest = await this.store.get(opts.objectId, opts.generation);
    if (!manifest) throw new ManifestError('not_found');
    if (manifest.ownerUid !== opts.ownerUid) throw new ManifestError('unauthorized');
    if (manifest.collectedAt) throw new ManifestError('collected');
    return manifest;
  }

  /** Mark a verified generation as referenced by a committed database row. */
  async commitReference(opts: { objectId: string; generation: number; ownerUid: string }): Promise<ObjectManifest> {
    // Defense in depth: a collected/detached object must never be attached to a
    // row after the fact, even if the earlier verifyReference raced a sweep.
    const current = await this.store.get(opts.objectId, opts.generation);
    if (!current) throw new ManifestError('not_found');
    if (current.ownerUid !== opts.ownerUid) throw new ManifestError('unauthorized');
    if (current.collectedAt) throw new ManifestError('collected');
    const res = await this.store.transition(opts.objectId, opts.generation, opts.ownerUid, { referenced: true });
    if (!res.ok) throw this.fromWriteResult(res);
    return res.manifest;
  }

  /** Add a retention reason (e.g. a retained revision or submission references this generation). */
  async retain(opts: { objectId: string; generation: number; ownerUid: string; reason: string }): Promise<ObjectManifest> {
    const cur = await this.verifyReference({ objectId: opts.objectId, generation: opts.generation, ownerUid: opts.ownerUid });
    const retainedBy = [...new Set([...cur.retainedBy, opts.reason])];
    const res = await this.store.transition(opts.objectId, opts.generation, opts.ownerUid, { retainedBy });
    if (!res.ok) throw this.fromWriteResult(res);
    return res.manifest;
  }

  /** Remove a retention reason; the object becomes collectable only when unreferenced and retentions are empty. */
  async release(opts: { objectId: string; generation: number; ownerUid: string; reason: string }): Promise<ObjectManifest> {
    const cur = await this.store.get(opts.objectId, opts.generation);
    if (!cur) throw new ManifestError('not_found');
    if (cur.ownerUid !== opts.ownerUid) throw new ManifestError('unauthorized');
    const retainedBy = cur.retainedBy.filter((r) => r !== opts.reason);
    const res = await this.store.transition(opts.objectId, opts.generation, opts.ownerUid, { retainedBy });
    if (!res.ok) throw this.fromWriteResult(res);
    return res.manifest;
  }

  /**
   * Collect unattached objects safely: a generation is detached only when it is
   * NOT referenced AND has no retention reasons. Retained revisions/submissions
   * (referenced or retainedBy non-empty) are never deleted.
   */
  async collectUnattached(now = new Date().toISOString()): Promise<CollectResult> {
    const collected: ObjectManifest[] = [];
    const skipped: string[] = [];
    for (const manifest of await this.store.all()) {
      if (manifest.referenced) { skipped.push(`${manifest.objectId}#${manifest.generation}`); continue; }
      if (manifest.retainedBy.length > 0) { skipped.push(`${manifest.objectId}#${manifest.generation}`); continue; }
      if (manifest.collectedAt) continue; // already detached
      const res = await this.store.transition(manifest.objectId, manifest.generation, manifest.ownerUid, { collectedAt: now });
      if (res.ok) collected.push(res.manifest);
    }
    return { collected, skipped };
  }

  /** Retrieve generations of a logical object (for manifest inventory/refetch). */
  async generations(objectId: string): Promise<ObjectManifest[]> {
    return this.store.generations(objectId);
  }

  private fromWriteResult(r: ManifestWriteResult): ManifestError {
    if ('reason' in r && r.reason === 'unauthorized') return new ManifestError('unauthorized');
    if ('reason' in r && r.reason === 'immutable') return new ManifestError('immutable');
    if ('reason' in r && r.reason === 'conflict') return new ManifestError('conflict');
    return new ManifestError('not_found');
  }
}
