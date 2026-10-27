// AI-05 (KAN-87) — the scoped-cache domain's typed state seams. The owning
// stores (cache entries, authorization state) implement these at integration;
// the in-memory implementation is contract-true and fails closed.
import type { CacheScope } from './scoped-cache-types';

export interface ScopedCacheStore {
  putEntry(key: string, scope: CacheScope, value: unknown): Promise<void>;
  getEntry(key: string, scope: CacheScope): Promise<{ scope: CacheScope; value: unknown } | undefined>;
  invalidateByPolicyVersion(policyVersion: string): Promise<number>;
  /** Delivery-time reauthorization (KAN-64 semantics; server-live). */
  reauthorizationPasses(callerUid: string, sourceVersion: string): Promise<boolean>;
}

/** Contract-true in-memory store; entries are private per full scope key. */
export class InMemoryScopedCacheStore implements ScopedCacheStore {
  private entries = new Map<string, { scope: CacheScope; value: unknown }>();
  private revoked = new Set<string>();

  private static key(scope: CacheScope): string {
    // The lookup key binds caller + kind + policy version; the SOURCE VERSION
    // is carried on the entry and verified at delivery (fail closed with
    // version_mismatch rather than a silent miss across versions).
    return `${scope.kind}|${scope.caller.uid}|${scope.caller.workspaceId}|${scope.policyVersion}`;
  }

  async putEntry(_key: string, scope: CacheScope, value: unknown): Promise<void> {
    this.entries.set(InMemoryScopedCacheStore.key(scope), { scope: { ...scope, caller: { ...scope.caller } }, value });
  }

  async getEntry(_key: string, scope: CacheScope): Promise<{ scope: CacheScope; value: unknown } | undefined> {
    const found = this.entries.get(InMemoryScopedCacheStore.key(scope));
    return found ? { scope: { ...found.scope, caller: { ...found.scope.caller } }, value: found.value } : undefined;
  }

  async invalidateByPolicyVersion(policyVersion: string): Promise<number> {
    let removed = 0;
    for (const [key, entry] of [...this.entries.entries()]) {
      if (entry.scope.policyVersion === policyVersion) {
        this.entries.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  async reauthorizationPasses(callerUid: string, _sourceVersion: string): Promise<boolean> {
    return !this.revoked.has(callerUid);
  }

  /** Test/integration hook: revoke a caller's authorization (server-live). */
  revoke(callerUid: string): void {
    this.revoked.add(callerUid);
  }
}
