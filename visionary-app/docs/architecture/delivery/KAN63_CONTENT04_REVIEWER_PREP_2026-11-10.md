# KAN-63 / CONTENT-04 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-63-catalog-adapter` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: stack integration `41fa1801` (merge of dev `2e0b1fbb`; package.json scripts unioned — privacycore/data/ingestion/publication/catalogadapter checks all live) and data-04 rolling-clock fix `dee15bce` (byte-identical).

## Review finding (verified, no defect)

The catalog→DTO adapter reviewed clean and enforces exactly the law CONTENT-04 demands:

- **Null-on-miss, never invented curriculum**: `getSubjects`/`getSyllabus`/`getConcept` return null when no released, eligible concept proves the selection — a UI label or a selection alone is never coverage.
- **Locale honesty**: authored/interface/released locales stay distinct; a present-but-unsupported language returns `languageUnavailable: true` with the true `availableLocales` — never an invented translation.
- **Server-live**: every DTO is recomputed from current store state; withdrawal/demotion/rejection immediately changes what adapters return.
- Concept admission requires released source + retrieval eligibility + non-empty released locales; authoring representations pass through unchanged with provenance.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Catalog-adapter suite (CONTENT-04's own acceptance) | `node --test backend/tests/contracts/catalogadapter/catalog-adapter.test.mjs` (after `npx tsc -p tsconfig.catalogadapter.json` + `tsconfig.data.json`, both exit 0) | **7/7 pass** |
| Registered adapter gate | `npm run catalogadapter:check` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Notes for the reviewer

- The lookup interface is injected (`CatalogAdapterLookup`); the SQL adapter maps onto the CONTENT-01 catalog rows. No UI label or selector value feeds coverage.
- Live retrieval at scale stays founder-gated as originally recorded; the learner-facing journey over released content runs through ACCEPT-01's chain.
