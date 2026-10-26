// CACHE-01 (KAN-141) — product-wide cache behavior, defined per feature family
// as an executable policy. The canonical statements this module encodes:
//
//   1. Every family names its canonical datastore and the revision that makes a
//      cached copy stale. Cache invalidation is EVENT-DRIVEN (commit,
//      withdrawal, consent/entitlement change, revision bump); a TTL is a
//      freshness bound only and NEVER a deletion mechanism — the union type
//      below makes a "deletion-by-TTL" policy unrepresentable.
//   2. Private (UID/workspace/learner-scoped) responses are never shared-CDN
//      cacheable. Public families may cache hashed assets and public catalog
//      revisions only, with revalidation.
//   3. Entitlement, consent and permission decisions are always resolved
//      server-side at request time; no cache layer is authoritative for them.
//   4. The launch default is NO server-side cache. `activation` stays
//      'blocked-until-measured-need' for every family: enabling a server cache
//      (Redis/specialized) requires the measured-need and isolation evidence of
//      the LATER-05 gate (KAN-136), not a preference.
//   5. Cache-down fallback is explicit per family: private reads fail closed
//      (the canonical store is the authority); public reads may pass through.
//
// The policy is checked against docs/architecture/tracking/feature-delivery.json
// (the feature-delivery matrix): every family in the matrix has exactly one
// entry, keyed by its stable id, so new families cannot ship without a cache
// decision (see backend/tests/contracts/cachepolicy/).

export type CanonicalStore=
  |'firestore-account'      // account/billing authority (connected locally)
  |'sql-domain'             // durable workspace/domain authority (DATA work)
  |'object-storage'         // private file generations/manifests (FILE work)
  |'none';                  // stateless/public-asset families with no domain store

export type InvalidationKind='event-driven'|'no-store';

export interface CachePolicyEntry {
  /** Feature-delivery matrix family id (stable). */
  family:string;
  /** Where the authoritative record lives. */
  canonicalStore:CanonicalStore;
  /** What makes a cached copy stale (the revision/cursor to revalidate against). */
  revisionSource:string;
  /** Required scope key composition for any cached derivative. */
  scopeKeys:readonly string[];
  /** True when responses carry UID/workspace/learner-scoped material. */
  privateResponse:boolean;
  /** Derived guard: must be false whenever privateResponse is true. */
  sharedCdnCacheable:boolean;
  browserCache:{
    enabled:boolean;
    /** Freshness bound only; never a deletion mechanism. */
    maxAgeSeconds:number|null;
    invalidation:InvalidationKind;
  };
  apiCache:{
    enabled:boolean;
    maxAgeSeconds:number|null;
    invalidation:InvalidationKind;
  };
  /**
   * Cache-down behavior: private reads fail closed to the canonical store;
   * public reads may pass through degraded.
   */
  fallback:'fail-closed'|'pass-through';
  /** The concrete events that must invalidate (or the no-store statement). */
  invalidationTriggers:readonly string[];
  /** Server cache activation stance; never flips without the LATER-05 gate. */
  activation:'blocked-until-measured-need';
  notes:string;
}

export interface CachePolicyViolation {
  family:string;
  rule:string;
  detail:string;
}

export interface CachePolicyReport {
  valid:boolean;
  violations:CachePolicyViolation[];
}
