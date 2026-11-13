// FILE-03 — private downloads, exports and revocation for immutable private
// file objects (the READY generations produced by FILE-01 and referenced by
// FILE-02 manifests).
//
// Two authorized delivery paths are qualified:
//   - AUTHENTICATED GATEWAY (`DownloadGateway`): every read goes through a
//     gateway that re-checks the grant's active state, owner and lease. When
//     the owner revokes, subsequent reads are refused immediately — no residual
//     window. Preferred wherever immediate revocation is required.
//   - SIGNED LINK (`issueSignedLink`): a time/use-bounded link carrying a token
//     and an explicit expiry. Residual validity is documented: bytes already
//     delivered to a device are NOT recalled, and a signed link remains
//     consumable only until its expiry (or revocation, whichever is earlier).
//
// Exports are bounded, owner-scoped records of READY generations; an export is
// read through the same authenticated gateway so export revocation is immediate
// too. Nothing is downloadable unless it is a READY/immutable generation owned
// by the acting uid — quarantine (INTENT/UPLOADING/VERIFYING/SCANNING), REJECTED
// or CANCELLED objects are never served.

/** Delivery channel — determines how revocation is enforced at read time. */
export type DownloadChannel = 'gateway' | 'signed_link';

/** Grant lifecycle. */
export type DownloadState = 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'USED';

/** Owner scoped, immutable-object download grant. */
export interface DownloadGrant {
  /** Grant id (opaque, used by all operations). */
  id: string;
  /** Owning uid — server-authoritative. */
  ownerUid: string;
  /** Immutable object generation being delivered (FILE-02 manifest identity). */
  objectId: string;
  generation: number;
  digest: string;
  size: number;
  type: string;
  channel: DownloadChannel;
  state: DownloadState;
  /** Wall-clock expiry; the grant refuses reads after this instant. */
  expiresAt: string;
  /** Signed-link token, if any (opaque, only matches this grant). */
  token: string | null;
  /** Remaining permitted reads; signed links typically allow 1. */
  remainingReads: number;
  /** When the grant entered REVOKED (null until revoked). */
  revokedAt: string | null;
  /** When the last read completed (null until first read). */
  lastReadAt: string | null;
  /** Bytes delivered across reads so far (durable accounting). */
  bytesDelivered: number;
  createdAt: string;
}

/** Bounded, owner-scoped export of READY immutable generations. */
export interface ExportRecord {
  /** Export id (opaque). */
  id: string;
  /** Owning uid — server-authoritative. */
  ownerUid: string;
  /** The exact immutable generations included (digest-pinned, never mutable). */
  objects: Array<{ objectId: string; generation: number; digest: string; size: number; type: string }>;
  state: DownloadState;
  expiresAt: string;
  createdAt: string;
  /** Non-owner reads are refused; already-delivered bytes are not recalled. */
  deliveredBytes: number;
}

/** Policy knobs for the FILE-03 enabler. */
export interface DownloadPolicy {
  /** Maximum READY object size the gateway will deliver. */
  maxDeliverableBytes: number;
  /** Default gateway grant lifetime (immediate-revocation channel). */
  gatewayLeaseMs: number;
  /** Default signed-link validity window (residual validity is documented). */
  signedLinkTtlMs: number;
  /** Default signed-link read budget (one-shot by default). */
  signedLinkMaxReads: number;
  /** Maximum objects permitted in a single export. */
  maxExportObjects: number;
  /** Default export lease lifetime. */
  exportLeaseMs: number;
}

export const DEFAULT_DOWNLOAD_POLICY: DownloadPolicy = {
  maxDeliverableBytes: 25 * 1024 * 1024,
  gatewayLeaseMs: 15 * 60 * 1000, // 15 minutes; re-checked on every read
  signedLinkTtlMs: 7 * 24 * 60 * 60 * 1000, // 7 days residual validity window
  signedLinkMaxReads: 1,
  maxExportObjects: 500,
  exportLeaseMs: 30 * 24 * 60 * 60 * 1000, // 30 days
};
