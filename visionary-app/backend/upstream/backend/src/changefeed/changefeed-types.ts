// SYNC-01 (KAN-139) — authorized durable change/run observation types.
//
// The checkpoint here is an OBSERVATION-only change feed over owning-store
// event/outbox records:
//   - OWNING-STORE RECORDS: domains append immutable, per-surface ordered
//     events (account, billing, workspace, build, teaching, content, quality)
//     carrying kinds + reference ids — never raw private content.
//   - OPAQUE SCOPED CURSORS: server-issued, nonce-padded tokens bound to
//     (owner, surface); tampered, foreign or expired cursors fail closed.
//   - ORDERED REVISIONS + REPLAY/REFETCH: polling replays events strictly
//     after a cursor in per-surface sequence order; a cursor that has fallen
//     out of the retention window refuses honestly (cursor_expired) with a
//     resync point.
//   - BOUNDED POLLING + SSE: bounded pages are the default; SSE is allowed
//     for streams; a WebSocket surface refuses without a recorded explicit
//     bidirectional need.
//   - REAUTHORIZED CONNECT/RECONNECT/DELIVERY: every poll/subscription
//     re-derives authority from the authenticated caller; a cursor alone is
//     worthless; a revoked delivery refuses.
//   - A FEED EVENT NEVER EXECUTES A COMMAND OR PROVES COMMIT: the surface is
//     observation-only and every record is not a commit receipt — the owning
//     API remains the only command path and the commit authority.
//
// Exit: authorized durable change/run observation with honest expiry and no
// command execution through the observation channel.

/** The authenticated caller. */
export interface FeedOwner {
  uid: string;
  workspaceId: string;
}

/** Released observation surfaces (owning domains). */
export type FeedSurface =
  | 'account'
  | 'billing'
  | 'workspace'
  | 'build'
  | 'teaching'
  | 'content'
  | 'quality';

export const RELEASED_SURFACES: readonly FeedSurface[] = [
  'account',
  'billing',
  'workspace',
  'build',
  'teaching',
  'content',
  'quality',
];

export type DeliveryMode = 'bounded_polling' | 'sse' | 'websocket';

/**
 * One owning-store observation record. Reference ids only — the feed never
 * carries raw private content, and it is never a commit receipt.
 */
export interface FeedEvent {
  surface: FeedSurface;
  /** Strictly increasing per (owner, surface) ordered revision. */
  seq: number;
  kind: string;
  /** Reference ids for the owning APIs (no payloads, no raw content). */
  refs: Record<string, string>;
  at: string;
  /** Fixed by construction: observation records never prove commit. */
  isCommitProof: false;
}

/** A server-issued, opaque, (owner, surface)-scoped cursor. */
export interface FeedCursor {
  token: string;
  owner: FeedOwner;
  surface: FeedSurface;
  seq: number;
  issuedAt: string;
}

/** One bounded observation page. */
export interface FeedPage {
  surface: FeedSurface;
  events: FeedEvent[];
  nextCursor: FeedCursor | null;
  hasMore: boolean;
}

export interface StreamRegistration {
  mode: DeliveryMode;
  surface: FeedSurface;
  /** Required recorded justification for a websocket surface. */
  bidirectionalNeed: string | null;
}

export class ChangefeedError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_surface'
      | 'cursor_invalid'
      | 'cursor_expired'
      | 'limit_exceeded'
      | 'websocket_requires_explicit_need'
      | 'delivery_revoked'
      | 'observation_only'
      | 'private_content_refused'
  ) {
    super(code);
  }
}
