// FILE-02 — immutable object generations/manifests.
//
// Mirrors the private-object manifest shape used by FILE-01/DATA-01 so the
// enabler maps 1:1 onto object-store rows at integration. Each logical object
// has immutable generations: a digest (sha256) + type + size recorded once at
// publish and never mutated. A database row may only commit a reference to a
// generation AFTER `verifyReference` confirms the manifest exists, is owned by
// the acting uid, is not yet collected and is immutable. Unattached objects are
// collected safely: a generation still referenced by a retained revision or
// submission is never deleted.

export interface ObjectManifest {
  /** Stable logical object id (same across generations). */
  objectId: string;
  /** Monotonic generation number; immutable once published. */
  generation: number;
  /** sha256 hex of the object bytes (immutable). */
  digest: string;
  size: number;
  type: string;
  /** Owning uid — server-authoritative. */
  ownerUid: string;
  createdAt: string;
  /** Retention reasons (e.g. `revision:<id>`, `submission:<id>`). Empty = unreferenced. */
  retainedBy: string[];
  /** True once a database row references this exact generation. */
  referenced: boolean;
  /** Set when the collector safely detached the object. */
  collectedAt: string | null;
}

/** Output of a collection sweep (unattached objects safely detached). */
export interface CollectResult {
  collected: ObjectManifest[];
  skipped: string[]; // manifests retained or still referenced
}
