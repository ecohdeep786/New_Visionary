export * from './changefeed-types';
export * from './changefeed-lookups';
export * from './changefeed-service';
// SYNC-01 (KAN-139) — authorized durable change/run observation.
//
// The checkpoint here is an OBSERVATION-only feed over owning-store
// event/outbox records:
//   - owning-store records append per-surface ordered revisions (reference
//     ids only — raw private content refuses at the record boundary);
//   - opaque scoped cursors (server-issued, nonce-padded, (owner, surface)-
//     bound) authorize replay/refetch; a cursor alone grants nothing — every
//     poll re-derives authority from the authenticated caller;
//   - replay is deterministic and ordered; a cursor fallen out of the
//     retention window refuses honestly (cursor_expired) with a resync point;
//   - bounded polling pages are the default, SSE where streaming is needed,
//     and a websocket surface refuses without a recorded explicit
//     bidirectional need;
//   - revoked delivery refuses; reconnect reauthorizes;
//   - the feed never executes a command and never proves commit
//     (isCommitProof is false by construction; the execute path is absent).
//
// Exit: authorized durable change/run observation with honest expiry and no
// command execution through the observation channel.
