// LEARN-13 (KAN-153) — rights-aware offline lessons and pending-attempt
// reconciliation.
//
// The checkpoint here is the server-owned offline-learning contract:
//   - Packs are SERVER-AUTHORED and RIGHTS-APPROVED: an offline pack is a fixed
//     bundle bound to exact immutable source / criteria / renderer versions.
//     The payload carries a SHA-256 digest and a bounded size, and is only
//     issued to an eligible owner (bounded device storage quota).
//   - PENDING ANSWERS ARE PRESERVED, NOT PASSED OFFLINE: a client stages a
//     pending attempt against the pack's ORIGINAL base version with an explicit
//     command identity. Reconnect replays in order; duplicate / out-of-order
//     commands converge. THE SERVER re-authorizes (session eligibility,
//     consent, source withdrawal, lease) and reassesses using the PROTECTED
//     criteria key. A client "passed" flag is a claim only, never accepted
//     evidence.
//   - OFFLINE USE IS LEASED: a reviewed offline-use lease with expiry; the
//     revocation limitation for already-downloaded bytes is DISCLOSED, never
//     hidden; expiry/source withdrawal denies new offline commands (fail
//     closed) while committed evidence stays.
//   - ACCOUNT-SWITCHED USERS ARE NEVER LEAKED: downloads and pending attempts
//     are bound to the owning account; a different account cannot read or
//     reconcile them (not_owner). Wrong users denied everywhere; AI generation
//     stays online (no on-device model is qualified here).
export interface OfflineOwner {
  uid: string;
  workspaceId: string;
}

/** One server-authored, rights-approved offline pack (immutable versions). */
export interface OfflinePack {
  packId: string;
  sourceId: string;
  lessonId: string;
  /** Exact immutable versions the pack was approved against. */
  sourceVersion: number;
  criteriaVersion: number;
  rendererVersion: number;
  sizeBytes: number;
  contentDigest: string;
}

/** The issued download (a device holds the payload bytes + digest). */
export interface PackDownload {
  downloadId: string;
  owner: OfflineOwner;
  packId: string;
  sizeBytes: number;
  contentDigest: string;
  downloadedAt: string;
}

/** A bounded-storage quota refusal / honest offline limitation. */
export type DownloadDecision = {
  ok: true;
  downloadId: string;
  packId: string;
  sizeBytes: number;
  contentDigest: string;
  offlineAvailability: boolean;
  revocationLimitation: string;
} | {
  ok: false;
  reason: 'storage_limit' | 'source_withdrawn' | 'consent_not_active' | 'lease_expired' | 'unknown_pack' | 'not_owner';
  usedBytes: number;
  quotaBytes: number;
};

/** A device-staged pending attempt (base-version-bound + command identity). */
export interface PendingAttempt {
  commandId: string;
  owner: OfflineOwner;
  packId: string;
  /** The pack version the attempt references (original base, never moves). */
  baseVersion: number;
  answer: unknown;
  /** CLIENT claim only — overruled by server assessment, never evidence. */
  clientClaimedPass: boolean;
  stagedAt: string;
}

export type AttemptVerdict = 'pass' | 'retry' | 'needs_review';

/** Server-owned assessment result for one replayed attempt. */
export interface ReconcileOutcome {
  commandId: string;
  outcome: 'assessed' | 'duplicate';
  verdict: AttemptVerdict | null;
  awardedPoints: number | null;
  criteriaVersion: number;
  claimedPass: boolean;
  acceptEvidence: boolean;
}

export interface ReconcileResult {
  owner: OfflineOwner;
  outcomes: readonly ReconcileOutcome[];
  reauthorization: { sessionEligible: boolean; consentActive: boolean; sourceWithdrawn: boolean; leaseExpired: boolean };
  /** Honest disclosure: revocation cannot remove already-downloaded bytes. */
  revocationLimitation: string;
}

export type OfflineErrorCode =
  | 'not_owner'
  | 'unknown_pack'
  | 'storage_limit'
  | 'source_withdrawn'
  | 'consent_not_active'
  | 'lease_expired'
  | 'integrity_failed'
  | 'session_ineligible';

export class OfflineError extends Error {
  constructor(public readonly code: OfflineErrorCode) {
    super(code);
  }
}
