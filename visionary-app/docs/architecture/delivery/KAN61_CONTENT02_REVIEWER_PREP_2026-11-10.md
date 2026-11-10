# KAN-61 / CONTENT-02 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-61-ingestion-jobs` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: include correction `154a9944`, stack integration `42195008` (merge of dev `2e0b1fbb`; package.json scripts unioned — dev's privacycore:check + this branch's ingestion:check both live; tsconfig include unioned; data-04 rolling-clock fix present at HEAD, blob-verified against the canonical fix).

## Correction

**The delivery could not run its own gate**: `tsconfig.data.json`'s include never listed the ingestion sources, so `node --test backend/tests/contracts/ingestion/ingestion.test.mjs` failed with "Cannot find module ./dist/src/ingestion/ingestion.service.js" — the compiled orchestrator simply did not exist. `src/ingestion/*.ts` added to the include (same runbook-defect class as KAN-52's missing `tests/__init__.py`). After the fix the suite runs green without any product change.

## Review finding (verified, no defect)

The stage machine reviewed clean: the scan gate admits only FILE-01/02-verified, scanned-clean, manifest-verified generations under byte bounds; the parser refuses invalid UTF-8 loudly and bounds sections; the chunker never spans page/section boundaries, hard-splits oversize paragraphs at word boundaries, and enforces the chunk ceiling; the embedding stage dimension-checks every vector against the adapter descriptor; evaluation is deterministic over offset integrity, duplicate ratio and embedding consistency; chunk ids are content-derived (idempotent replays).

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Ingestion suite (CONTENT-02's own acceptance) | `node --test backend/tests/contracts/ingestion/ingestion.test.mjs` (after the include fix + `npx tsc -p tsconfig.data.json`, exit 0) | **14/14 pass** |
| Registered ingestion gate | `npm run ingestion:check` | **exit 0** |
| Data contracts | `npm run data:check` (disposable loopback PostgreSQL 16 on 127.0.0.1:5433 + Java 21 under `nv-tools/`) | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Notes for the reviewer

- The embedding adapter is injected; no provider is contacted anywhere in the slice — model qualification stays CONTENT/AI-lane work as recorded.
- Hosted ingestion at scale stays founder-gated as originally recorded; this slice's acceptance is the executed bounded-stage suite over the real composition.
