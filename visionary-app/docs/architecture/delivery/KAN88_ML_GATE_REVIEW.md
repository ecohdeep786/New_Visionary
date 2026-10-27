# KAN-88 — AI-06 — permission-filtered retrieval, pinned context/prompt/tool versions and schema/citation/locale/allowed-action validation

## Task review and verification handoff

Jira key / source ID: KAN-88 (AI-06)
Acceptance scope: feature-enabler (backend-owned ML request/response gate; wired into the connected ML/runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-88-ml-output-gate`; based on the latest lane head `241bd756` (KAN-86 AI-04 conversation ownership), per D-098 — the next task creates its worktree from the latest working worktree. (AI-05 / KAN-87 remains blocked by CACHE-01 / KAN-141 and was skipped for this eligible task.)
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-88-ml-output-gate`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/mlgate/ml-gate-types.ts` (MlCaller, MlSourceFact, PinnedVersions, FilteredRetrieval, ModelOutput, ValidatedOutput, MlGateError)
- `backend/upstream/backend/src/mlgate/ml-gate-lookups.ts` (MlSourceLookup seam + InMemoryMlStore contract-true permission filtering)
- `backend/upstream/backend/src/mlgate/ml-gate.ts` (MlOutputGate — filterRetrieval server-side, validateOutput with version/schema/citation/locale/action checks)
- `backend/upstream/backend/src/mlgate/index.ts`
- `backend/upstream/backend/tsconfig.mlgate.json`
- `backend/tests/contracts/mlgate/ml-gate.test.mjs` (AI-06 suite, 7 tests)
- `scripts/mlgate-check.mjs`, `package.json` (`mlgate:check`)
Prerequisites: parent KAN-9; the lane head (CONTENT+LEARN+BUILD+AI-02/03/04 lineage) is the base. The ML lane (ml/upstream) binds its retrieval and output paths to this gate at cutover.

## Requirement

Implement permission-filtered retrieval, pinned context/prompt/tool versions and schema/citation/locale/allowed-action validation. D-085: contextual turns, hints, locale/prompt version and valid sources; schema/citation/locale/allowed-action validation; a generated output is not committed product state.

## Acceptance criteria → evidence

- Criterion: retrieval is PERMISSION-FILTERED server-side — only eligible sources the caller may retrieve enter the model context; forbidden and unreleased sources are filtered out and recorded (audit trail) but never sent; locale isolation holds (an en request never sees a hi source).
  - Evidence: test "retrieval is permission-filtered server-side: only eligible, permitted sources enter the model context".
- Criterion: versions are PINNED — a model response generated against different context/prompt/tool versions is refused (`version_mismatch`; no version drift, no silent prompt swap).
  - Evidence: test "a model response generated against DIFFERENT pinned versions is refused".
- Criterion: citation validation — a citation outside the permitted (filtered) set is refused (`citation_not_permitted`); a filtered source can never be cited back.
  - Evidence: test "a citation outside the permitted (filtered) set is refused".
- Criterion: locale validation — a wrong-locale output is refused (`locale_mismatch`).
  - Evidence: test "a wrong-locale output is refused".
- Criterion: allowed-action validation — a non-allowed action is refused (`action_not_allowed`).
  - Evidence: test "a non-allowed action is refused".
- Criterion: schema validation — an output missing a required field (or null body) is refused (`schema_invalid`).
  - Evidence: test "a schema-invalid output (missing required field) is refused".
- Criterion: a fully valid output is accepted and carries the pinned versions + citations — the audit trail of exactly what was permitted and used.
  - Evidence: test "a fully valid output is accepted and carries the pinned versions + citations (audit trail)".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; teaching-interface surfaces render validated outputs at cutover; refusals render honest unavailable states.
  - API: N/A in the enabler; ML runtime calls the gate before/after every model call at cutover.
  - Backend: MlOutputGate implements filtered retrieval and fail-closed output validation.
  - Data: in-memory store mirrors source facts + workspace permissions; Cloud SQL adapter at integration resolves from the CONTENT/06 source facts and permission tables.
  - Jobs/ML: the ML lane (ml/upstream) binds its retrieval and generation paths to this gate at cutover; the provider scope gate (KAN-84) and service identity (KAN-85) compose beneath it.

## Commands, exit codes, test counts and timestamps

- ML gate compile + suite: `node scripts/mlgate-check.mjs` → tsc `tsconfig.mlgate.json` exit 0; `node --test` → 7 tests, 7 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- AI-05 (KAN-87) cache scoping composes on top of this gate; hosted ML verification and production keys remain open gates.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-88 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: the AI lane continues with AI-01 (KAN-83, blocked by AI-11) and AI-05 (KAN-87, blocked by CACHE-01) — both dependency-gated; the next eligible task is selected from live Jira before assignment.
