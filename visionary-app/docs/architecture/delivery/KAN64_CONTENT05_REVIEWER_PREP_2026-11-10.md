# KAN-64 / CONTENT-05 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-64-retrieval-gate` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: stack integration `db018d80` (merge of dev `2e0b1fbb`; package.json scripts unioned — privacycore/data/ingestion/publication/catalogadapter/retrievalgate checks all live) and data-04 rolling-clock fix `949ed063` (byte-identical).

## Review finding (verified, no defect)

The retrieval gate reviewed clean and enforces the law in ordered, fail-closed steps:

- **Ordered authorization**: authority → pointer released (exact source-version match, locale support) → consent (present, unrevoked) → workspace membership. First failure wins; every check recomputes fresh (server-live).
- **Typed denials are answers**: a denial is a valid observable `GateDecision` with a typed reason (`POINTER_NOT_RELEASED`, `WITHDRAWN_POINTER`, `SOURCE_VERSION_MISMATCH`, `LOCALE_UNSUPPORTED`, `CONSENT_MISSING`, `CONSENT_REVOKED`, `WORKSPACE_MISMATCH`), never an exception path.
- **Fingerprinted decision basis**: every decision binds the SHA-256 of its exact basis (query + pointer revision/state/locales + consent revision/revocation + membership role).
- **Delivery-time staleness recheck**: pending output may only be served if a FRESH authorization still allows it AND the fingerprint is bit-identical — a withdrawal, revision bump or consent change between compute and delivery drops the output (withdrawal stops pending output, not just new access).

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Retrieval-gate suite (CONTENT-05's own acceptance) | `node --test backend/tests/contracts/retrievalgate/retrieval-gate.test.mjs` (after `npx tsc -p tsconfig.retrievalgate.json`, exit 0) | **6/6 pass** |
| Registered gate | `npm run retrievalgate:check` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Notes for the reviewer

- The lookups (pointers/consents/workspaces) are injected; the SQL adapter maps onto the CONTENT-01 pointer rows and the consent/workspace stores. The fingerprint requires canonical key-order serialization in the adapter (the in-memory reference constructs deterministically).
- Hosted retrieval at scale stays founder-gated as originally recorded; the learner journey over released content runs through ACCEPT-01's chain.
