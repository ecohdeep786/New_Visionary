# KAN-60 — CONTENT-01 — stable curriculum/book/chapter/topic/concept IDs, source provider/version, rights, owner/visibility, grade/category and authored-language metadata

## Task review and verification handoff

Jira key / source ID: KAN-60 (CONTENT-01)
Acceptance scope: enabler (stable content catalog domain; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: deepseek (senior principal backend engineer)
Reviewer: codex (senior agent) — must explicitly accept responsibility; an implementer cannot self-approve
Worker branch / candidate head: `codex/deepseek-kan-60-content-catalog`
Base: `codex/deepseek-kan-59-file-security` 187b4fa7 (FILE-04 candidate; CONTENT-01 planning-sequence follows the FILE series), itself on the origin/dev chain 65045d72
Owned files / contracts:
- `backend/upstream/backend/src/content/content-types.ts` (ContentNode, Kind, Visibility, PublicationState, SourceApproval, SourceVersion, PARENT_OF)
- `backend/upstream/backend/src/content/content-store.ts` (CatalogStore contract + in-memory + owner-scoped update that cannot patch identity)
- `backend/upstream/backend/src/content/catalog.service.ts` (CatalogService — derivePublicId, register, updateMetadata, updateSourceVersion, approveSource, rejectSource, publish, withdraw, lineage, eligibleForRetrieval)
- `backend/upstream/backend/src/content/index.ts`
- `backend/upstream/backend/tsconfig.data.json`
- `backend/tests/contracts/data-content/content.test.mjs` (new CONTENT-01 suite)
Prerequisites: FILE-01 (KAN-56) READY objects; FILE-02 (KAN-57) manifests; FILE-04 (KAN-59) security proofs; DATA-01 / source_versions + publications + content_nodes rows at integration.

## Requirement

Implement stable curriculum/book/chapter/topic/concept IDs and source provider/version, rights, owner/visibility, grade/category and authored-language metadata. D-085 delivery trace: catalog/concept/source-version queries and upload→scan→review→publish/withdraw commands; approved released-language/source pointers; retained source_versions/publications/content_nodes plus immutable manifests; no invented syllabus coverage.

## Acceptance criteria → evidence

- Criterion: stable public IDs — derived once from the immutable identity (kind|parent|provider|edition) and never recycled; metadata edits and source-version advances do not change the ID.
  - Evidence: test "stable IDs: metadata edits and source-version advances do not change the public ID".
- Criterion: idempotent registration — re-registering the same identity returns the same node (retries cannot duplicate or drift); a foreign owner claiming the same public ID is refused.
  - Evidence: test "idempotent registration: same identity returns the same node; a foreign owner claiming the ID is refused".
- Criterion: structural lineage — book under curriculum, chapter under book, topic under chapter, concept under topic; missing/wrong-kind parent refused.
  - Evidence: test "structural lineage: a chapter needs a book, a book needs a curriculum, wrong kind refused".
- Criterion: source provider/version first-class — updateSourceVersion keeps the stable public ID and resets approval to pending (a new version is a fresh release candidate).
  - Evidence: test "stable IDs … and source-version advances" (source.version updated, approval reset to pending).
- Criterion: forward-only, strictly step-wise source approval — pending → approved → released; jumps/downgrades refuse; rejected is terminal for that version.
  - Evidence: test "source approval is forward-only: approve → released; reverse/downgrade and reject-after-release refuse".
- Criterion: publish requires an approved/released source; a pending or rejected source cannot publish.
  - Evidence: test "publish requires an approved/released source; a pending or rejected source cannot publish".
- Criterion: owner authority — only the owning uid may update metadata, advance source, approve/reject, publish or withdraw; identity (kind/parent/publicId/provenance anchor) stays immutable.
  - Evidence: test "owner authority: only the owning uid may update, advance, approve, publish or withdraw".
- Criterion: publication lifecycle + eligibility gating — register (draft/private) → publish → withdraw; retrieval eligibility requires node AND every ancestor published & public AND approved/released source; withdrawing an ancestor blocks the whole subtree immediately.
  - Evidence: test "eligibility gating: a private/draft ancestor or pending source blocks retrieval; a fully released public chain is eligible".
- Criterion: metadata — grade/category/authored-language are recorded and editable; source provider/edition preserved.
  - Evidence: test "metadata: grade/category/authored-language are recorded and editable; provenance preserved".
- Frontend → API → backend → data → jobs/ML → device outcome:
  - Frontend: N/A in the enabler; catalog content lists/curriculum UI consumes the service + eligibility gate at cutover.
  - API: N/A in the enabler; catalog/source-version query + publish/withdraw controllers call the service at cutover.
  - Backend: CatalogService implemented (stable IDs, source versions, approval, publish/withdraw, eligibility).
  - Data: in-memory CatalogStore with owner-scoped fenced updates; Cloud SQL adapter over source_versions/publications/content_nodes at integration.
  - Jobs/ML: publish/withdraw and review events flow through the owning-store outbox (JOB-01) at cutover; no invented syllabus content.

## Commands, exit codes, test counts and timestamps

- Compile (pure modules): `tsc --project backend/upstream/backend/tsconfig.data.json --types node --typeRoots node_modules/@types --skipLibCheck` → exit 0 (2026-10-26).
- Contract tests: `node --test backend/tests/contracts/data-content/content.test.mjs` → 8 tests, 8 pass, 0 fail (2026-10-26).
- Data-lane regression: `node --test backend/tests/contracts/data-content/content.test.mjs backend/tests/contracts/data-jobs/outbox.test.mjs backend/tests/contracts/data-jobs/jobs.test.mjs backend/tests/contracts/data-jobs/admission.test.mjs backend/tests/contracts/data-files/upload.test.mjs backend/tests/contracts/data-files/download.test.mjs` → 41 tests, 41 pass, 0 fail (2026-10-26).
- Backend build: `npm run build` (nest build) in `backend/upstream/backend` — to be rerun at review as part of the exact-commit check.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL/object store and no Nest controller/worker yet; the real adapter swap + worker wiring happen at integration cutover (source_versions/publications/content_nodes DDL names resolved by DATA-01).
- Syllabus coverage is NOT promised by this enabler: only concrete registered source nodes exist; eligibility of coverage depends on release/approval + API wiring at cutover.
- FILE series (KAN-56/57/58/59) and JOB series (KAN-53/54/55) remain on feature branches in Testing; CONTENT-01 joins that shared-enabler chain and integrates with them at cutover.
- Hosted verification, real content-feed ingestion and production source-provider approval remain out of scope for an enabler; hosted/load/privacy/commercial gates stay open.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (codex)
- Verification result: pending
- Dev integration commit and checks: (after review)
- Jira transition/comment receipt: KAN-60 → Testing (transition 41)
- Next dependent tasks: CONTENT-08 (KAN-144) versioned canonical concepts; then CONTENT-02..07 and the content family; FILE/JOB/DATA integration at cutover.
