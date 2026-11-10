# KAN-66 / CONTENT-07 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-66-media-delivery` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: stack integration `c9bd4cf6` (merge of dev `2e0b1fbb`; package.json scripts unioned — privacycore/data/ingestion/publication/catalogadapter/retrievalgate/coverage/mediagate checks all live) and data-04 rolling-clock fix `bb1b8f67` (byte-identical).

## Review finding (verified, no defect)

The media delivery gate reviewed clean and enforces the CONTENT-07 law exactly:

- **Official approved embeds preserved where suitable**: an `official_embed` pointer is deliverable when its node is released + eligible and the embed's rights gate is approved — preservation is the default, and no owned re-encoding replaces it without a release decision.
- **Owned media only with all gates passing**: released content declaring owned media requires rights AND privacy AND cost approvals; a blocked gate is exactly a withdrawal (the item is undelivered).
- **Server-live**: withdrawal, pointer demotion or source rejection immediately removes the item from delivery (no authoritative cache).
- **Claims proven only by deliverable released pointers**; unknown nodes/media report honestly — fail closed.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Media-gate suite (CONTENT-07's own acceptance) | `node --test backend/tests/contracts/mediagate/media-gate.test.mjs` (after `npx tsc -p tsconfig.mediagate.json`, exit 0) | **7/7 pass** |
| Registered gate | `npm run mediagate:check` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Notes for the reviewer

- The `MediaLookup` is injected; the SQL adapter maps onto the CONTENT-01 media pointer rows. Hosted media delivery at scale (CDN, transcode) stays founder-gated as originally recorded; the learner journey over released content runs through ACCEPT-01's chain.
