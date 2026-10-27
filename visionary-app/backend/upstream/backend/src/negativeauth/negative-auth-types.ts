// PRIV-06 (KAN-115) — negative authorization tests across the privacy surfaces
// (exports, object links, search results, error messages, telemetry), plus the
// log/backup/access-review and secret-rotation procedures.
//
// The checkpoint here is a NEGATIVE-AUTHORIZATION test suite over one gate:
//   - EXPORTS: a signed export link serves ONLY its owner within its validity
//     window — a stranger, or a link past expiry, is refused.
//   - OBJECT LINKS: a private object's signed URL is bound to its owner and
//     expires; another user's object link refuses.
//   - SEARCH RESULTS: search returns only results the caller may see — another
//     user's private matches never appear (no leakage through search).
//   - ERROR MESSAGES: denials are uniform — a wrong-user error is
//     indistinguishable from an unknown-id error (no existence leak through
//     error text).
//   - TELEMETRY: telemetry records carry redacted fields only — raw private
//     text is provably absent (KAN-91 composition).
//   - PROCEDURES: the log-retention, backup-hold, access-review and
//     secret-rotation procedures are first-class records with explicit
//     cadences — validated, not prose.
//
// Exit: real-user data has enforceable access, lifecycle and support
// procedures.

/** The authenticated actor for negative tests. */
export interface PrivacyActor {
  uid: string;
  workspaceId: string;
  scopes?: readonly string[];
}

/** A signed, expiring, owner-bound link (exports and object URLs). */
export interface SignedLink {
  token: string;
  ownerUid: string;
  resourceRef: string;
  expiresAt: number;
}

/** The procedure records (validated, not prose). */
export interface OperatingProcedure {
  procedureId: string;
  kind: 'log_retention' | 'backup_hold' | 'access_review' | 'secret_rotation';
  /** Cadence in days (rotation/review) or the retention window. */
  cadenceDays: number;
  /** The concrete steps the procedure mandates. */
  steps: readonly string[];
}

export class NegativeAuthError extends Error {
  constructor(
    public readonly code:
      | 'link_expired'
      | 'link_not_owned'
      | 'search_leak'
      | 'non_uniform_error'
      | 'telemetry_leak'
      | 'procedure_invalid'
  ) {
    super(code);
  }
}
