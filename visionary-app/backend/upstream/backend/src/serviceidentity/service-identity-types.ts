// AI-03 (KAN-85) — replace imported HMAC/browser-claim trust with private
// service identity and audience/expiry/run-bound authorized context.
//
// The checkpoint here is server-issued service identity (no browser trust):
//   - Authority is a PRIVATE service grant issued SERVER-SIDE and held in the
//     owning store — never an HMAC the browser computes, never a browser claim.
//     A client-supplied claim (no server grant behind it) is REJECTED explicitly:
//     the browser is never the authority.
//   - Grants are BOUND three ways: to an AUDIENCE (a grant minted for the ML
//     retrieval audience cannot authorize the assessment audience), to an EXPIRY
//     (an expired grant refuses immediately), and optionally to a RUN (a
//     run-bound grant cannot authorize a different run).
//   - Scopes are explicit: authorization requires the caller to present the
//     scope the operation needs; a grant without it refuses.
//   - Revocation is immediate: a revoked grant fails closed from that moment.
//   - No secret material ever leaves the store: validation results carry
//     subject/audience/run/scope — never the grant's private material.
//
// Exit: permitted, bounded, server-owned ML/service authorization.

/** The human or service actor requesting a grant. */
export interface IdentityOwner {
  uid: string;
  workspaceId: string;
}

/** A private service identity grant issued server-side (never in the browser). */
export interface ServiceGrant {
  grantId: string;
  owner: IdentityOwner;
  /** The service principal this grant authorizes (server-owned identity). */
  subject: string;
  /** The audience this grant may authorize (e.g. 'ml.retrieval'). */
  audience: string;
  /** When bound to a run, the grant authorizes only that run. */
  runId: string | null;
  scopes: readonly string[];
  issuedAt: string;
  expiresAt: string;
}

/** The validated authorized context (no secret material). */
export interface AuthorizedContext {
  grantId: string;
  subject: string;
  audience: string;
  runId: string | null;
  scopes: readonly string[];
  validatedAt: string;
}

/** A browser-supplied claim — never authority; always rejected. */
export interface BrowserClaim {
  claimedUid: string;
  claimedAudience: string;
  claimedScopes?: readonly string[];
}

export class IdentityError extends Error {
  constructor(
    public readonly code:
      | 'browser_claim_rejected'
      | 'unknown_grant'
      | 'grant_expired'
      | 'grant_revoked'
      | 'audience_mismatch'
      | 'run_mismatch'
      | 'scope_missing'
      | 'not_owner'
  ) {
    super(code);
  }
}
