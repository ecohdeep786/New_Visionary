// AI-05 (KAN-87) — scoped, version/policy-aware, reauthorized caching.
//
// Core responsibilities (server-owned; the cache never serves what live
// authorization would refuse):
//   1. put: EVERY cache kind (exact/semantic/template) requires the FULL scope
//      binding (caller + source version + policy version). A partial/global
//      scope refuses (`global_cache_disabled`) — unsafe global caches are
//      disabled, period.
//   2. get: an entry serves only to its OWN caller (private never shared —
//      another caller with the same source is a different key and gets a
//      miss), only for its OWN source version (`version_mismatch`), and only
//      after the DELIVERY-TIME reauthorization passes (server-live; a revoked
//      caller's entries stop serving immediately).
//   3. invalidateByPolicyVersion: a policy version bump invalidates matching
//      entries event-driven (CACHE-01) — the count of removed entries is
//      returned for the audit trail.
import type {
  CacheScope,
  ScopedCacheError as ScopedCacheErrorType,
} from './scoped-cache-types';
import { ScopedCacheError } from './scoped-cache-types';
import type { ScopedCacheStore } from './scoped-cache-lookups';

export class ScopedCacheService {
  constructor(private readonly store: ScopedCacheStore) {}

  /** Put a cache entry — requires the FULL scope binding, any kind. */
  async put(scope: CacheScope, value: unknown): Promise<void> {
    this.assertFullScope(scope);
    await this.store.putEntry('', scope, value);
  }

  /** Get a cached entry — private, version-aware, reauthorized at delivery. */
  async get(scope: CacheScope): Promise<{ value: unknown; reauthorized: true } | null> {
    this.assertFullScope(scope);
    const entry = await this.store.getEntry('', scope);
    if (!entry) return null;
    if (entry.scope.sourceVersion !== scope.sourceVersion) throw new ScopedCacheError('version_mismatch');
    // Delivery-time reauthorization (server-live; KAN-64 semantics).
    if (!(await this.store.reauthorizationPasses(scope.caller.uid, scope.sourceVersion))) {
      throw new ScopedCacheError('reauthorization_failed');
    }
    return { value: entry.value, reauthorized: true };
  }

  /** Policy version bump: event-driven invalidation of matching entries. */
  async invalidateByPolicyVersion(policyVersion: string): Promise<number> {
    return this.store.invalidateByPolicyVersion(policyVersion);
  }

  private assertFullScope(scope: CacheScope): void {
    // Unsafe global caches are disabled: any missing binding (no caller, no
    // source version, no policy version) refuses for EVERY cache kind.
    if (!scope.caller?.uid || !scope.caller?.workspaceId || !scope.sourceVersion || !scope.policyVersion) {
      throw new ScopedCacheError('global_cache_disabled');
    }
  }
}

export type { ScopedCacheErrorType };
