// CONTENT-05 (KAN-64) — enforce source/workspace/publication filtering before
// keyword/vector retrieval and cache lookup; withdrawal stops new access AND
// pending output.
//
// This module is the server-live authorization gate that every retrieval path
// (keyword, vector, hybrid) and every cache-lookup path must call BEFORE
// serving anything. Its rules, encoded as enforced invariants:
//
//   1. Decisions are never cached authoritatively (CACHE-01/KAN-141): every
//      authorization is computed fresh from injected lookups and marked
//      decisionSource 'server-live'. The returned fingerprint identifies the
//      exact inputs a decision was made on — for observation, never for reuse.
//   2. A publication pointer that is not released denies new access; a
//      WITHDRAWN pointer denies with its own reason. Withdrawal therefore stops
//      new access the moment the pointer stops (CONTENT-03 atomic swap).
//   3. Pending output stops too: results computed under an earlier decision
//      must pass delivery-time recheck (`authorizeDelivery`) against CURRENT
//      state before they may be served. A withdrawal between compute and
//      delivery drops the output.
//   4. Cache lookups are gated exactly like retrievals (`authorize` with
//      purpose 'cache-lookup'), so a cached derivative can never serve content
//      its live retrieval would be denied.
//   5. Locale and source-language stay distinct: `locale` is the request's
//      interface locale and must be among the pointer's released locales;
//      `authoredLanguage` travels with the source identity and is never used to
//      deny a locale-supported release (locale/source-language distinction).
//   6. Consent and workspace membership are per-request server checks through
//      the injected lookups; a missing lookup answer denies (fail closed).
//
// The lookups are typed seams: the SQL domain store (DATA work) and the
// publication pointer (KAN-62) implement them at integration; the in-memory
// implementations are contract-true for the tests and local runs.

export type RetrievalPurpose='retrieval'|'cache-lookup';

export interface SourceVersionIdentity {
  provider:string;
  edition:string;
  version:string;
}

export interface RetrievalQueryContext {
  requesterUid:string;
  workspaceId:string|null;
  nodeKey:string;
  source:SourceVersionIdentity;
  /** Request interface locale (BCP-47); null means caller takes the default. */
  locale:string|null;
  purpose:RetrievalPurpose;
}

/** Mirrored released-pointer state (shape of the KAN-62 publication pointer). */
export interface PointerState {
  state:'released'|'withdrawn'|'in_review'|'draft';
  revision:number;
  releasedLocales:readonly string[];
  source:SourceVersionIdentity;
}

/** Mirrored consent/authorization state for processing this source. */
export interface ConsentState {
  policyRevision:string;
  revoked:boolean;
}

export interface WorkspaceMembership {
  member:boolean;
  role:string|null;
}

export type GateDenyCode=
  |'AUTHORITY_MISSING'
  |'POINTER_NOT_RELEASED'
  |'WITHDRAWN_POINTER'
  |'SOURCE_VERSION_MISMATCH'
  |'LOCALE_UNSUPPORTED'
  |'CONSENT_MISSING'
  |'CONSENT_REVOKED'
  |'WORKSPACE_MISMATCH'
  |'STALE_DECISION';

export interface GateDecision {
  allowed:boolean;
  reason:GateDenyCode|null;
  decisionSource:'server-live';
  /** Digest of the exact inputs this decision was computed from. */
  fingerprint:string;
  checkedAt:string;
}

export interface PendingOutput {
  /** The decision the output was computed under. */
  originalDecision:GateDecision;
  queryContext:RetrievalQueryContext;
}
