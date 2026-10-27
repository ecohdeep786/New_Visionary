# KAN-138 — AI-12 — replace unsafe legacy quality export before ML integration

## Task review and verification handoff

Jira key / source ID: KAN-138 (AI-12)
Acceptance scope: feature-enabler (backend-owned scoped quality collection domain; wired into the connected ML/runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-138-scoped-collection`; based on the latest lane head `50808df2` (KAN-92 AI-10 modality gate), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-138-scoped-collection`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/qualityscope/quality-scope-types.ts` (QualityOperator, ApprovedPurpose, QualityEntry, QualityScopeError)
- `backend/upstream/backend/src/qualityscope/quality-scope-lookups.ts` (QualityScopeStore seam + InMemoryQualityScopeStore contract-true state)
- `backend/upstream/backend/src/qualityscope/quality-scope.ts` (QualityScopeService — legacyExport (always refused), collect with scoped-operator/purpose/ground-truth/raw-text/scope-binding checks, exportDataset, recordPurpose)
- `backend/upstream/backend/src/qualityscope/index.ts`
- `backend/upstream/backend/tsconfig.qualityscope.json`
- `backend/tests/contracts/qualityscope/quality-scope.test.mjs` (AI-12 suite, 6 tests)
- `scripts/qualityscope-check.mjs`, `package.json` (`qualityscope:check`)
Prerequisites: parent KAN-9; the lane head (CONTENT+LEARN+BUILD+AI lineage) is the base. The ML lane (ml/upstream) binds any quality evaluation to this service at cutover; the imported gateway's legacy quality-export path stays disconnected.

## Requirement

Keep legacy raw-text quality collection/export disconnected; replace it only with an approved purpose, scoped operator policy and reviewed ground truth (source review: global Redis quality keys, raw query/response/retrieved-context records, fixed TTLs, weekly training-style dataset generation, export routes on the ordinary gateway without a scoped operator policy; the feedback judge's generated GoldenResponse is not reviewed ground truth). Exit: no unsafe quality export reaches ML integration.

## Acceptance criteria → evidence

- Criterion: the legacy raw-text quality export path is PERMANENTLY disconnected — raw dumps, global-key exports and training-style dataset generation refuse (`legacy_export_disconnected`) for any requester; no flag or role re-enables them.
  - Evidence: test "the legacy raw-text quality export path is PERMANENTLY disconnected — any requester, any filters".
- Criterion: the ordinary authenticated identity is NOT sufficient — collection/export require a DISTINCT scoped operator carrying `quality.review:<purposeId>` (`operator_scope_required` otherwise).
  - Evidence: test "the ordinary authenticated identity is NOT sufficient — collection/export require the scoped operator".
- Criterion: collection only through an APPROVED, ACTIVE purpose bound to explicit scope filters; a revoked purpose refuses immediately (`purpose_not_active`).
  - Evidence: test "collection only through an approved ACTIVE purpose; a revoked purpose refuses immediately".
- Criterion: ground truth requires a HUMAN review record — the feedback judge's generated response is refused (`not_ground_truth`).
  - Evidence: test "ground truth requires a HUMAN review record — the judge-generated response is refused".
- Criterion: raw private-text fields (rawQuery/rawResponse/retrievedContext/fullTranscript) are forbidden in collected entries (`raw_text_forbidden`).
  - Evidence: test "raw private-text fields are forbidden in collected entries".
- Criterion: scope binding — an entry beyond the approved purpose's scope filters refuses (`beyond_approved_scope`).
  - Evidence: test "an entry beyond the approved scope filters refuses".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; no quality export surface exists outside the scoped operator path.
  - API: N/A in the enabler; scoped operator endpoints call the service at cutover with validated schemas.
  - Backend: QualityScopeService implements the disconnected legacy path and the scoped replacement.
  - Data: in-memory store mirrors approved purposes/entries; Cloud SQL adapter at integration resolves from quality_purpose/quality_entry tables; legacy Redis quality keys are not migrated.
  - Jobs/ML: the ML lane (ml/upstream) consumes ONLY exported reviewed datasets through the scoped path at cutover; weekly training-style dataset generation stays disconnected.

## Commands, exit codes, test counts and timestamps

- Quality scope compile + suite: `node scripts/qualityscope-check.mjs` → tsc `tsconfig.qualityscope.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `modalities:check` (KAN-92) → 5 pass/0 fail; `deadline:check` (KAN-90) → 6 pass/0 fail; `usagereservation:check` (KAN-89) → 6 pass/0 fail; `mlgate:check` (KAN-88) → 7 pass/0 fail; `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- The imported gateway's legacy code remains pinned upstream; this enabler guarantees the product-side replacement refuses the legacy behavior — upstream decommissioning is a separate ML-lane patch with recorded provenance.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-138 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: AI-09 (KAN-91) waits on AI-12 (this task, now implemented); AI-16 (KAN-150) and AI-15 (KAN-149) are next by planning order among eligible tasks.
