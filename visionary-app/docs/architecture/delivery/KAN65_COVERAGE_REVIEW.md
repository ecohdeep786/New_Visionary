# KAN-65 — CONTENT-06 — evaluate coverage and retrieval on every released category/language, including Hindi/Bengali segmentation where released

## Task review and verification handoff

Jira key / source ID: KAN-65 (CONTENT-06)
Acceptance scope: feature-enabler (backend-owned coverage & retrieval evaluation domain; wired into the connected runtime/UI at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-65-coverage-evaluation`; based on the previous content worktree `codex/principal-kan-64-retrieval-gate` head `02c467c1` (KAN-64 CONTENT-05 retrieval gate), which itself is based on verified `origin/dev` f61292ef — the sequence of the content lane is preserved.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-65-coverage-evaluation`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/coverage/coverage-evaluation-types.ts` (LanguageTag, CoverageStatus, ReleasedSourceEvidence, CategoryLanguageRow, CategoryCoverage, CoverageReport, CategoryLabelClaim, CatalogNodeFacts, ClaimEvaluation)
- `backend/upstream/backend/src/coverage/coverage-evaluation-lookups.ts` (CatalogLookup seam + InMemoryCoverageStore contract-true state)
- `backend/upstream/backend/src/coverage/coverage-evaluation.ts` (CoverageEvaluator — evaluateAll, evaluateClaims, evaluateClaim, evaluateRetrieval, provesCoverage; server-live, labels never establish support)
- `backend/upstream/backend/src/coverage/index.ts`
- `backend/upstream/backend/tsconfig.coverage.json`
- `backend/tests/contracts/coverage/coverage.test.mjs` (CONTENT-06 suite, 7 tests)
- `scripts/coverage-check.mjs`, `package.json` (`coverage:check`)
Prerequisites: parent KAN-6 (P04), phase prerequisites P01/P03 (CONTENT-01..05 and DATA/ROLE foundations); the content lane is sequenced KAN-60→61→62→64 and now 65. CONTENT-06 unblocks LEARN-01 (KAN-67).

## Requirement

Evaluate coverage and retrieval on every released category/language, including Hindi/Bengali segmentation where released; frontend category labels do not establish content support. D-085 trace: catalog/concept/source-version queries; covered by approved released-language/source pointers; no invented syllabus coverage.

## Acceptance criteria → evidence

- Criterion: released category/language is derived from the backend store — a released eligible source proves its exact language; released languages are listed and never invented.
  - Evidence: test "released category/language is derived from the store …".
- Criterion: Hindi/Bengali segmentation where released — authored language never establishes coverage; only released pointer locales do; `hi`/`bn`/`en` segments do not leak across locales.
  - Evidence: test "Hindi/Bengali segmentation where released: authored language never establishes coverage; only released pointer locales do".
- Criterion: frontend category labels do not establish content support — a claim with no released source reports `not_released`/`unavailable`, never `supported`; `evaluateClaims` returns unproved labels.
  - Evidence: tests "frontend category labels do not establish content support …" and "evaluateClaims returns unproved labels …".
- Criterion: withdrawal / pointer demotion / source rejection immediately drop a node from coverage (server-live, no authoritative cache).
  - Evidence: test "withdrawal / pointer demotion / source rejection immediately drop a node from coverage (server-live, no cache)".
- Criterion: retrieval evaluation on a released (category, language) returns exactly the eligible released nodes for that language only.
  - Evidence: test "retrieval evaluation on a released (category, language) returns exactly the eligible released nodes for that language only".
- Criterion: a category with no eligible nodes reports honestly (no released language, no invented coverage row).
  - Evidence: test "a category with no eligible nodes at all is partial/unavailable honestly, not silently supported".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; the frontend coverage labels/curriculum UI consume the evaluator's report at cutover — a label is a claim, never evidence.
  - API: N/A in the enabler; coverage report/claim controllers call the evaluator at cutover.
  - Backend: CoverageEvaluator implements the honest, server-owned coverage + retrieval evaluation.
  - Data: in-memory CoverageStore interface mirrors catalog (CONTENT-01) + published pointer (CONTENT-03) + retrieval gate (CONTENT-05) facts; Cloud SQL adapter at integration resolves from source_versions/publications/content_nodes.
  - Jobs/ML: retrieval gating (KAN-64) and publication pointers (KAN-62) feed the evaluator at cutover; no invented syllabus content.

## Commands, exit codes, test counts and timestamps

- Coverage compile + suite: `node scripts/coverage-check.mjs` → tsc `tsconfig.coverage.json` exit 0; `node --test` → 7 tests, 7 pass, 0 fail (2026-10-27).
- Baseline regression: `node scripts/retrievalgate-check.mjs` (KAN-64 suite) → 6 tests, 6 pass, 0 fail (unchanged base; coverage candidate does not regress the content lane).
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL/object store and no Nest controller/worker wired yet; the real adapter swap + controller wiring happen at integration cutover (source_versions/publications/content_nodes DDL resolved by DATA).
- Hindi/Bengali coverage is evaluated where pointers release those locales; releasing an additional language is a content/rights decision, not made by this evaluator.
- Hosted verification, real content-feed ingestion and production source-provider approval remain out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-65 → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: CONTENT-06 unblocks LEARN-01 (KAN-67) learning sessions; the content lane continues with CONTENT-07 (KAN-66) and CONTENT-08 (KAN-144).
