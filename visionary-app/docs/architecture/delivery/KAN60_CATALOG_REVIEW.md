# KAN-60 — CONTENT-01 — stable curriculum/book/chapter/topic/concept IDs, source provider/version, rights, owner/visibility, grade/category and authored-language metadata

## Task review and verification handoff

Jira key / source ID: KAN-60 (CONTENT-01)
Acceptance scope: enabler (stable content catalog domain; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-60-content-catalog`, based on verified `origin/dev` f61292ef (KAN-37 reviewed local enabler closeout)
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-60-content-catalog`, D-098)
Owned files / contracts:
- `backend/upstream/backend/src/content/content-types.ts` (ContentNode, ContentKind, Visibility, PublicationState, SourceApproval, ContentRights, SourceVersion, PARENT_OF)
- `backend/upstream/backend/src/content/content-store.ts` (CatalogStore contract + InMemoryCatalogStore; atomic `insertIfAbsent` compare-and-set registration; owner-scoped update that cannot patch identity or reassign the owner)
- `backend/upstream/backend/src/content/catalog.service.ts` (CatalogService — derivePublicId, register, updateMetadata, setVisibility, updateSourceVersion, approveSource, rejectSource, publish, withdraw, lineage, eligibleForRetrieval, byKind, children)
- `backend/upstream/backend/src/content/index.ts`
- `backend/upstream/backend/tsconfig.data.json` (adds `src/content/**` to the data-lane compile)
- `backend/tests/contracts/data-content/content.test.mjs` (CONTENT-01 suite, 16 tests incl. the six review-probe regressions)
Prerequisites: none open — CONTENT-01 has no open blockers in the planning manifest (`blockedBy: []`). It blocks CONTENT-08 (KAN-144) versioned canonical concepts. DATA-01/02 (KAN-36/37) are the accepted data foundation this enabler compiles alongside.

Rework note: an earlier candidate (deepseek-kan-60-content-catalog 18d6ec4c, on the unmerged KAN-53..59 chain) was never reviewed and is superseded by this fresh candidate from verified dev; its branch remains pushed for archive only. The old chain base is not part of `dev`, so this rework re-lands the same proven contract directly on the accepted data foundation, with three deliberate deltas: the stable-ID digest uses synchronous `node:crypto` SHA-256 (no WebCrypto dependency), re-setting the CURRENT source version is an idempotent no-op that preserves an already-approved/released review (a retried command never resets review state), and concurrent duplicate registrations converge to the single durable row per identity.

Review rework (2026-11-04, implementer): the separate reviewer's 31 October probes returned CHANGES REQUESTED with six source-bound defects; each is fixed in this candidate with an explicit regression test:
1. Sibling collapse — the stable ID now derives from kind|parentId|NAME|provider|edition, so distinct siblings (two chapters of one book, two books of one curriculum) never share an ID; the title is part of the immutable identity and an in-place rename is refused (invalid_metadata_patch).
2. Rejected ancestor retrieval — `eligibleForRetrieval` now requires EVERY node in the lineage to carry its own approved/released source pointer (a pending or rejected ancestor blocks the subtree, reason `source_not_approved:<kind>` / `source_rejected:<kind>`).
3. Metadata patch bypassing approval/publication — `updateMetadata` accepts only grade/category/authoredLanguage (+ license via rights); publication/source/name/timestamp patches are refused, and a content-affecting edit on an approved/released pointer resets approval to pending (re-review before serving/publishing again).
4. Rights patch replacing the owner — ownership is preserved at BOTH layers: the service refuses a rights patch asserting a different owner/visibility, and the store carries `ownerUid` over from the current row no matter what the patch contains.
5. Concurrent different-owner registration — registration is now a store-level compare-and-set (`insertIfAbsent`): a racing different owner is fenced against the durable row and refused (`id_claimed`) instead of overwriting the first registration; same-owner retries stay idempotent.
6. Foreign attachment under a private parent — registration requires the parent's owner to match the registering uid (the whole lineage belongs to one owner), so a foreign uid cannot attach content beneath a parent it does not own, private or published.

## Requirement

Implement stable curriculum/book/chapter/topic/concept IDs and source provider/version, rights, owner/visibility, grade/category and authored-language metadata. D-085 delivery trace: catalog/concept/source-version queries and upload→scan→review→publish/withdraw commands; approved released-language/source pointers; retained source_versions/publications/content_nodes plus immutable manifests; no invented syllabus coverage.

## Acceptance criteria → evidence

- Criterion: stable public IDs — derived once from the immutable identity (kind|parent|NAME|provider|edition) and never recycled; metadata edits and source-version advances do not change the ID; the title is identity, so an in-place rename is refused.
  - Evidence: test "KAN-60 stable IDs: metadata edits and source-version advances do not change the public ID; a rename is refused".
- Criterion: distinct siblings never collapse — same parent/provider/edition with different titles yields different public IDs (review probe 1).
  - Evidence: test "KAN-60 distinct siblings never collapse: same parent/provider/edition, different names are different nodes".
- Criterion: idempotent registration — re-registering the same identity returns the same node (retries cannot duplicate or drift); a foreign owner claiming the same public ID is refused; concurrent duplicate registrations converge to one durable row.
  - Evidence: test "KAN-60 idempotent registration: same identity returns the same node; concurrent duplicates converge to one row".
- Criterion: racing different-owner registration is fenced (review probe 5) — one winner, the loser refused `id_claimed`, the durable row keeps the first owner.
  - Evidence: test "KAN-60 concurrent different-owner registration is fenced: one winner, the loser refused, first owner durable".
- Criterion: structural lineage — book under curriculum, chapter under book, topic under chapter, concept under topic; missing/wrong-kind parent refused.
  - Evidence: test "KAN-60 structural lineage: a chapter needs a book, a book needs a curriculum, wrong kind refused".
- Criterion: source provider/version first-class — updateSourceVersion keeps the stable public ID and resets approval to pending; re-setting the current version is an idempotent no-op that preserves review state.
  - Evidence: tests "KAN-60 stable IDs …" and "KAN-60 same-version source update is an idempotent no-op that preserves the review state".
- Criterion: forward-only, strictly step-wise source approval — pending → approved → released; jumps/downgrades refuse; rejected is terminal for that version and replaceable by a new version.
  - Evidence: test "KAN-60 source approval is forward-only: approve → released; reverse/downgrade and reject-after-release refuse".
- Criterion: publish requires an approved/released source; a pending or rejected source cannot publish.
  - Evidence: test "KAN-60 publish requires an approved/released source; a pending or rejected source cannot publish".
- Criterion: owner authority — only the owning uid may update metadata, advance source, approve/reject, publish or withdraw; identity (kind/parent/publicId/provenance anchor) stays immutable; unknown nodes refuse every operation.
  - Evidence: test "KAN-60 owner authority: only the owning uid may update, advance, approve, publish or withdraw; identity stays immutable".
- Criterion: publication lifecycle + eligibility gating — register (draft/private) → publish → withdraw; retrieval eligibility requires node AND every ancestor published & public AND EACH node's own approved/released source; withdrawing an ancestor blocks the whole subtree immediately.
  - Evidence: tests "KAN-60 eligibility gating: a private/draft ancestor or pending source blocks retrieval; a fully released public chain is eligible" and "KAN-60 a rejected or pending ANCESTOR source blocks the whole subtree from retrieval" (review probe 2).
- Criterion: a typed metadata patch cannot bypass approval/publication or replace the owner (review probes 3+4) — publication/source/name/timestamp patches refuse; a rights patch asserting another owner refuses at the service and is neutralized at the store; a content edit on a released pointer resets approval to pending.
  - Evidence: test "KAN-60 a typed metadata patch cannot bypass approval/publication or replace the owner (service + store)".
- Criterion: foreign attachment beneath a parent the uid does not own is refused (review probe 6), private or published.
  - Evidence: test "KAN-60 a foreign owner cannot attach content beneath a parent it does not own".
- Criterion: visibility buckets — `school` is a scoped bucket; only `public` is broadly retrievable; visibility changes are an owner-only command (`setVisibility`), not a metadata patch.
  - Evidence: test "KAN-60 school visibility is a scoped bucket, not broadly retrievable".
- Criterion: publish history — re-publication after withdraw keeps the first publish instant and clears the withdraw record.
  - Evidence: test "KAN-60 re-publication after withdraw keeps the first publish instant and clears the withdraw record".
- Criterion: metadata — grade/category/authored-language are recorded and editable; source provider/edition preserved (and immutable as identity anchor); per-kind inventory available; the title is not a metadata field.
  - Evidence: tests "KAN-60 metadata: grade/category/authored-language are recorded and editable; the title is not a metadata field" and "KAN-60 same-version source update is an idempotent no-op; provider/edition identity anchor is immutable".
- Frontend → API → backend → data → jobs/ML → device outcome:
  - Frontend: N/A in the enabler; catalog content lists/curriculum UI consume the service + eligibility gate at cutover.
  - API: N/A in the enabler; catalog/source-version query + publish/withdraw controllers call the service at cutover.
  - Backend: CatalogService implemented (stable IDs, source versions, approval, publish/withdraw, eligibility).
  - Data: in-memory CatalogStore with owner-scoped fenced updates; Cloud SQL adapter over source_versions/publications/content_nodes at integration (DATA DDL names resolved there).
  - Jobs/ML: publish/withdraw and review events flow through the owning-store outbox at cutover; no invented syllabus content.

## Commands, exit codes, test counts and timestamps

- Compile (data + content lanes): `npx tsc --project backend/upstream/backend/tsconfig.data.json --types node --typeRoots node_modules/@types --skipLibCheck` (run inside `backend/upstream/backend` after `npx prisma generate`) → exit 0 (2026-11-04 IST; the only diagnostics are the pre-existing `@prisma/client` resolution errors in `src/data/migration-store.ts` when the backend `node_modules` are absent — environment-only, unchanged by this candidate).
- Content suite: `node --test backend/tests/contracts/data-content/content.test.mjs` → 16 tests, 16 pass, 0 fail (2026-11-04 IST), including the six review-probe regressions.
- Backend dependency install: `npm ci --ignore-scripts` → exit 0 (653 packages), followed by `npx prisma generate` → exit 0.
- Data-lane PostgreSQL suites (data-01/data-02): NOT re-run in this session — no disposable loopback PostgreSQL could be provisioned (Docker engine cannot start on this host and no local PostgreSQL service is installed). The data module's code is unchanged by this candidate and the combined `tsconfig.data.json` compile (data + content) passes; the reviewer may re-run these suites with `DATA_TEST_DATABASE_URL` set.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL/object store and no Nest controller/worker yet; the real adapter swap + controller wiring happen at integration cutover (source_versions/publications/content_nodes DDL names resolved by DATA).
- Syllabus coverage is NOT promised by this enabler: only concrete registered source nodes exist; eligibility of coverage depends on release/approval + API wiring at cutover.
- The JOB series (KAN-53/54/55) and FILE series (KAN-56/57/58/59) remain unmerged feature-branch work outside `dev`; CONTENT-01 integrates with them at cutover and does not depend on them for its own contract.
- Hosted verification, real content-feed ingestion and production source-provider approval remain out of scope for an enabler; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending (re-review of the 2026-11-04 rework candidate; the 31 October review returned CHANGES REQUESTED on candidate 8316a3b0 with six source-bound probes — all six are fixed above with regression tests)
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: content suite 16/16 green on the rework candidate (2026-11-04 IST)
- Dev integration commit and checks: (after review)
- Jira transition/comment receipt: KAN-60 → Testing with the exact rework candidate SHA (after push)
- Next dependent task: CONTENT-08 (KAN-144) versioned canonical concepts — also waits on DATA-01 (KAN-36) acceptance per the planning manifest; then CONTENT-02..07.
