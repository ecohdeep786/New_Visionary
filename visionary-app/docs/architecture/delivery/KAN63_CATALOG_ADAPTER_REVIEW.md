# KAN-63 — CONTENT-04 — connect catalog/concept adapters to reviewed server DTOs; preserve locale/source-language distinctions, authoring representations and clear unsupported/unavailable states

## Task review and verification handoff

Jira key / source ID: KAN-63 (CONTENT-04)
Acceptance scope: feature-enabler (backend-owned catalog/concept → reviewed DTO adapter; wired into the connected runtime/UI at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-63-catalog-adapter`; based on the latest working content worktree `codex/principal-kan-66-media-delivery` head `a4ca9af0` (KAN-66 CONTENT-07 media gate), per D-098 — CONTENT-04 was skipped in the original lane dispatch and is being landed now on the latest verified content head to restore sequence before CONTENT-08 (KAN-144).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-63-catalog-adapter`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/catalogadapter/catalog-adapter-types.ts` (Status, Provenance, Locale, SourceReleaseState, Representation, ConceptDTO, SyllabusDTO, GraphDTO, SubjectCatalogueDTO, CatalogNodeFacts)
- `backend/upstream/backend/src/catalogadapter/catalog-adapter-lookups.ts` (CatalogAdapterLookup + SubjectLookup seams + InMemoryAdapterStore contract-true state)
- `backend/upstream/backend/src/catalogadapter/catalog-adapter.ts` (CatalogDtoAdapter — getSubjects, getSyllabus, getConcept; server-live, a miss is null)
- `backend/upstream/backend/src/catalogadapter/index.ts`
- `backend/upstream/backend/tsconfig.catalogadapter.json`
- `backend/tests/contracts/catalogadapter/catalog-adapter.test.mjs` (CONTENT-04 suite, 7 tests)
- `scripts/catalogadapter-check.mjs`, `package.json` (`catalogadapter:check`)
Prerequisites: parent KAN-6 (P04), phase prerequisites P01/P03 (CONTENT-01..03 content catalog/publication foundations); the content lane is sequenced KAN-60→61→62→(63 restored)→64→65→66 and then 67/144. The adapter consumes released, eligible catalog + published-pointer facts (CONTENT-01/03/05 shape) and unblocks LEARN-01 (KAN-67).

## Requirement

Connect catalog/concept adapters to reviewed server DTOs; preserve locale/source-language distinctions, authoring representations and clear unsupported/unavailable states. Exit: learners receive only authorized, supported, published versions. D-085 trace: eligible catalog/concept/source-version queries; reviewed server DTO shapes; `content.syllabus`/`content.concept` facade operations preserved.

## Acceptance criteria → evidence

- Criterion: the adapter returns the REVIEWED server DTO shapes (syllabus graph, concept, subject catalogue) derived from released, eligible catalog facts — a selection/concept with no released source returns null (a miss is null, never invented curriculum).
  - Evidence: tests "getSyllabus returns the reviewed graph DTO from released eligible catalog facts (a miss is null)" and "getSubjects returns only subjects with released eligible content; null when none".
- Criterion: locale/source-language distinctions preserved — authored language never fabricates a locale; released locales gate what is served; a released+eligible concept outside the requested interface locale reports `languageUnavailable: true` with true `availableLocales`.
  - Evidence: test "locale/source-language distinction preserved: released locales gate what is served; authored language never fabricates a locale".
- Criterion: authoring representations preserved unchanged on the concept DTO.
  - Evidence: test "authoring representations are preserved unchanged on the concept DTO".
- Criterion: unsupported/unavailable states explicit — unknown, unreleased, or not-eligible concepts and selections return null (fail closed).
  - Evidence: test "unknown / unreleased / not-eligible concept returns null — a miss is null (never invented)".
- Criterion: withdrawal / pointer demotion / source rejection immediately change adapter output (server-live, no authoritative cache).
  - Evidence: test "withdrawal / pointer demotion / source rejection immediately change adapter output (server-live, no cache)".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: the adapter produces the reviewed contentRepository shapes at cutover; frontend keeps its `ContentRepositoryAdapter` boundary (miss ⇒ null). No frontend change in this enabler.
  - API: N/A in the enabler; syllabus/concept controllers call the adapter at cutover.
  - Backend: CatalogDtoAdapter implements the honest, server-owned mapping to reviewed DTOs.
  - Data: in-memory store mirrors catalog (CONTENT-01) + published pointer (CONTENT-03/05) facts; Cloud SQL adapter at integration resolves from source_versions/publications/content_nodes.
  - Jobs/ML: release/withdraw and reviewed mapping events flow through the owning-store outbox at cutover; no invented content.

## Commands, exit codes, test counts and timestamps

- Catalog adapter compile + suite: `node scripts/catalogadapter-check.mjs` → tsc `tsconfig.catalogadapter.json` exit 0; `node --test` → 7 tests, 7 pass, 0 fail (2026-10-27).
- Lane regressions (unchanged base; candidate does not regress the content lane): `node scripts/coverage-check.mjs` (KAN-65 suite) → 7 pass/0 fail; `node scripts/mediagate-check.mjs` (KAN-66 suite) → 7 pass/0 fail; `node scripts/retrievalgate-check.mjs` (KAN-64 suite) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover (source_versions/publications/content_nodes DDL resolved by DATA).
- The adapter maps released, eligible catalog facts; it never annotates more locales than are released, and it does not perform translation (a language-unavailable concept is a product/content decision).
- Hosted verification, real content-feed ingestion and production source-provider approval remain out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-63 → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: CONTENT-04 unblocks LEARN-01 (KAN-67) learning sessions; the content lane continues with CONTENT-08 (KAN-144) versioned prerequisite graph / curriculum-exam views.
