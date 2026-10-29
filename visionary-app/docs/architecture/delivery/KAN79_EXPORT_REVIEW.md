# KAN-79 — BUILD-05 — explicit saved-revision Markdown/document export through the private file lifecycle

## Task review and verification handoff

Jira key / source ID: KAN-79 (BUILD-05)
Acceptance scope: feature-enabler (backend-owned document-export domain; controller wiring, the real BUILD-01 saved-revision store and the hosted P03 object lifecycle bind at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-79-revision-export`; based on the latest lane head `a7bd9cbe` (KAN-71 LEARN-05 conversation), per D-098 (lane lineage …71 → 79).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-79-revision-export`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/export/export-types.ts` (ExportOwner, ExportFormat, SavedRevision, ExportArtifact, ExportError)
- `backend/upstream/backend/src/export/export-lookups.ts` (ExportStore seam + InMemoryExportStore contract-true state; saved-revision seam; command-dedup ledger)
- `backend/upstream/backend/src/export/export-service.ts` (ExportService — exportRevision, readExport, revokeExport)
- `backend/upstream/backend/src/export/index.ts`
- `backend/upstream/backend/tsconfig.export.json`
- `backend/tests/contracts/export/export.test.mjs` (BUILD-05 suite, 6 tests)
- `scripts/export-check.mjs`, `package.json` (`export:check`)
Prerequisites (native Blocks): FILE-03 / KAN-58 (private downloads/exports + revocation — implemented, Testing). Unblocks feature/phase acceptance gates as mapped. Composes the lane stances: BUILD-01/KAN-75 immutable revisions, BUILD-02/KAN-76 draft recovery, FILE-03 revocation semantics, KAN-139 record discipline.

## Requirement

Connect explicit saved-revision Markdown/document export and supported assets through P03; generation/preview cannot silently save, share, submit or deploy. Exit: current document Build is server-backed without weakening existing privacy/recovery rules. (source: BACKEND_LAUNCH_CHECKLIST.md BUILD-05; KAN-79 description)

## Acceptance criteria → evidence (backend/tests/contracts/export/export.test.mjs, 6 tests)

- SAVED REVISIONS ONLY — an export resolves content from the BUILD-01 saved-revision seam; a generation/preview id (or any unsaved id) refuses `revision_not_saved` — generation/preview cannot silently save.
- NO SILENT SHARE/SUBMIT/DEPLOY — the export surface exposes no share, submit, deploy or publish operation (asserted against the service prototype); the only operations are exportRevision, readExport, revokeExport.
- SUPPORTED FORMATS ONLY — markdown | plaintext | html; anything else refuses `export_type_unsupported`.
- BYTE-STABLE ARTIFACTS — identical (saved content, format) produce identical bodies and content hashes (distinct explicit exports); markdown export is verbatim; html/plaintext render deterministically; read-back is verbatim; the source revision is never modified by exporting.
- COMMAND DEDUPLICATION — a replayed export command converges to the SAME export; the same commandKey with a changed payload refuses (`command_changed`).
- PRIVATE LIFECYCLE (P03) — artifacts are private and owner-gateway read; wrong uid/workspace refuses uniformly (`not_owner`/`workspace_mismatch`, no leak); owner revocation makes the export unreadable (`export_revoked`); another user cannot revoke; unknown ids refuse (`export_unknown`).
- Cross-layer closure: Frontend — N/A in the enabler (ArtifactStudio/artifactEditorDraft bind at cutover). API — controller wiring binds validated schemas at cutover. Backend — ExportService composes the saved-revision seam (BUILD-01) and the private-artifact lifecycle (P03/FILE-03 revocation semantics). Data — owning-store adapter at integration resolves from build_revisions (read-only here) and private export artifacts. ML — none.

## Commands, exit codes, test counts and timestamps

- Export compile + suite: `node scripts/export-check.mjs` → tsc `tsconfig.export.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-29).
- Lane regressions: all 44 contract modules on this candidate, 0 failures (export-new 6, conversation 6, stage 9, reviewschedule 11, coaching 11, reports 6, guardian 6, entitlement 6, organization 6, professional 6, submissions 7, assignment 7, classroom 6, sceneprotocol 12, changefeed 10, scorecard 14, airaflow 14, modalities 5, deadline 6, usagereservation 6, mlgate 7, conversationauth 6, serviceidentity 7, providerscope 4, completion 4, sharing 4, runs 6, guidedbriefs 4, draftrecovery 6, projects 5, evaluation 5, journey 8, dailyplan 7, projections 7, attempts 6, learningsession 8, conceptgraph 8, catalogadapter 7, coverage 7, mediagate 7, retrievalgate 6, qualityscope 6, mlresilience 4, contextassembly 8).
- `data:check` (DATA-01 DDL) requires `DATA_TEST_DATABASE_URL` loopback PostgreSQL and is a DDL check, not part of the contract-module regression list; unchanged by this task and still out of the module-lane scope.

## Remaining defects, limitations and linked open gates

- The saved-revision seam binds the real BUILD-01 store and the artifact lifecycle binds the hosted P03 object store at cutover; hosted download/revocation evidence remains with FILE-03's open gates.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.
- No model training, new price, data purge, broad AGI claim or expanded Done scope is claimed by this enabler.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
