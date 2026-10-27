// AI-05 (KAN-87) — disable unsafe global exact/semantic/template caches; add
// only scoped, source/policy/version-aware, reauthorized caching.
//
// The checkpoint here is an honest, safe cache layer (composes CACHE-01/KAN-141):
//   - UNSAFE GLOBAL CACHES ARE DISABLED: registering a cache entry without a
//     full scope binding (caller + source version + policy version) is refused
//     (`global_cache_disabled`) — no exact/semantic/template cache may key
//     globally, for any cache kind.
//   - SCOPED ONLY: an entry binds exactly one caller (uid+workspace), one
//     source version, one policy version. Private entries are NEVER shared —
//     another caller with the same source gets a miss (no cross-user reads).
//   - VERSION-AWARE: an entry pinned to source-version X is never served for
//     version Y (`version_mismatch`).
//   - REAUTHORIZED AT DELIVERY: a cached response is served only after the
//     delivery-time reauthorization check passes (KAN-64 semantics); a revoked
//     policy or withdrawn source stops serving the entry immediately —
//     server-live, no authoritative cache-of-the-cache.
//   - POLICY-AWARE invalidation: a policy version bump invalidates matching
//     entries (event-driven, CACHE-01).
//
// Exit: evaluated, authorized assistance with bounded costs — the cache never
// serves what live authorization would refuse.

/** The caller a scoped cache entry is bound to. */
export interface CacheCaller {
  uid: string;
  workspaceId: string;
}

/** The full scope binding every cache entry must carry. */
export interface CacheScope {
  caller: CacheCaller;
  sourceVersion: string;
  policyVersion: string;
  /** The cache kind — every kind requires the full scope binding. */
  kind: 'exact' | 'semantic' | 'template';
}

export class ScopedCacheError extends Error {
  constructor(
    public readonly code:
      | 'global_cache_disabled'
      | 'version_mismatch'
      | 'reauthorization_failed'
  ) {
    super(code);
  }
}
