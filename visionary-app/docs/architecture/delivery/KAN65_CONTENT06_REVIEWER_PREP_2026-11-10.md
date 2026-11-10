# KAN-65 / CONTENT-06 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-65-coverage-evaluation` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: stack integration `7e6fbf61` (merge of dev `2e0b1fbb`; package.json scripts unioned — privacycore/data/ingestion/publication/catalogadapter/retrievalgate/coverage checks all live) and data-04 rolling-clock fix `e582cc8b` (byte-identical).

## Review finding (verified, no defect)

The coverage/retrieval evaluator reviewed clean and enforces the honest-coverage law:

- **Store-derived segments only**: released (category, language) segments are derived from proving sources; frontend labels are structurally incapable of fabricating support.
- **`provesCoverage` is exact**: retrieval-eligible + source released + an exact-language RELEASED pointer — no cross-language leak (Hindi/Bengali included).
- **Honest gaps**: nodes whose authored language claims a segment but fails to prove it are reported as `unprovedClaims` with status `partial` — the UI must not advertise them as supported; nodes in other languages are not counted as claims for the segment.
- **Server-live**: a withdrawal, pointer demotion or source rejection immediately drops a node from coverage (no authoritative cache).

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Coverage suite (CONTENT-06's own acceptance) | `node --test backend/tests/contracts/coverage/coverage.test.mjs` (after `npx tsc -p tsconfig.coverage.json`, exit 0) | **7/7 pass** |
| Registered gate | `npm run coverage:check` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Notes for the reviewer

- The `CatalogLookup` is injected; the SQL adapter maps onto the CONTENT-01 pointer/catalog rows. Hosted coverage evaluation at scale stays founder-gated as originally recorded; the learner journey over released content runs through ACCEPT-01's chain.
