# KAN-83 — AI-01 — benchmark candidate APIs on permitted sources, teaching quality, released languages, citation correctness, safety, latency, quotas and total per-use cost; pin the selected route/version

## Task review and verification handoff

Jira key / source ID: KAN-83 (AI-01)
Acceptance scope: feature-enabler (backend-owned benchmark harness; wired into the connected ML/runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-83-api-benchmark`; based on the latest lane head `eb2087c8` (KAN-149 AI-15 context assembly), per D-098 — the next task creates its worktree from the latest working worktree. AI-01 was blocked by AI-11 (KAN-137), which is Done in Jira, making this task eligible.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-83-api-benchmark`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/benchmark/benchmark-types.ts` (BenchmarkCandidate, LanguageMatrix, BenchmarkScenario, DimensionScores, BenchmarkResult, PinnedSelection, BenchmarkError)
- `backend/upstream/backend/src/benchmark/benchmark-lookups.ts` (BenchmarkStore seam with injected candidate runner + InMemoryBenchmarkStore contract-true state)
- `backend/upstream/backend/src/benchmark/benchmark-harness.ts` (BenchmarkHarness — runBenchmark with permitted-source/locale-matrix/deterministic-digest scoring, selectAndPin with reviewed thresholds)
- `backend/upstream/backend/src/benchmark/index.ts`
- `backend/upstream/backend/tsconfig.benchmark.json`
- `backend/tests/contracts/benchmark/benchmark.test.mjs` (AI-01 suite, 4 tests)
- `scripts/benchmark-check.mjs`, `package.json` (`benchmark:check`)
Prerequisites: parent KAN-9; AI-11 (KAN-137, Done) is the recorded prerequisite; the lane head is the base. The live-API candidate runner binds at cutover — this enabler owns the reproducible harness and the pin.

## Requirement

Benchmark candidate APIs on permitted sources, teaching quality, English/Hindi/Bengali or actual released languages, citation correctness, safety, latency, quotas and total per-use cost; pin the selected route/version. Exit: evaluated, authorized assistance — the pinned route/version is the auditable selection.

## Acceptance criteria → evidence

- Criterion: benchmarking runs on PERMITTED sources only — a scenario on a non-permitted source refuses (`source_not_permitted`); raw private text is never a benchmark corpus.
  - Evidence: test "benchmarking runs on PERMITTED sources only — a non-permitted source refuses (never raw private text)".
- Criterion: the language matrix is the ACTUAL RELEASED languages — a released locale with no scenarios reports `supported: false` honestly (no invented scores, no penalty).
  - Evidence: test "the language matrix is the ACTUAL RELEASED languages: a locale with no scenarios reports unsupported honestly".
- Criterion: scoring is REPRODUCIBLE — identical candidate + scenarios + rubric version yield an identical SHA-256 score digest; a rubric-version change visibly changes the digest.
  - Evidence: test "scoring is REPRODUCIBLE: identical inputs yield identical score digests".
- Criterion: selection PINS the exact route/version/rubric (the only thing downstream may consume); a below-threshold candidate refuses selection (`no_candidate_meets_threshold`).
  - Evidence: test "selection PINS the exact route/version; a below-threshold candidate cannot be pinned".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; no benchmark surface outside the ML lane.
  - API: N/A in the enabler; the ML lane calls the harness at cutover with injected candidate runners.
  - Backend: BenchmarkHarness implements permitted-source, released-locale, deterministic benchmarking and the auditable pin.
  - Data: in-memory store mirrors permitted sources; the candidate runner is the live-API adapter at integration.
  - Jobs/ML: measured costs feed the usage ledger (KAN-89) at cutover; the pinned route/version is what the provider scope gate (KAN-84) authorizes.

## Commands, exit codes, test counts and timestamps

- Benchmark compile + suite: `node scripts/benchmark-check.mjs` → tsc `tsconfig.benchmark.json` exit 0; `node --test` → 4 tests, 4 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `contextassembly:check` (KAN-149) → 8 pass/0 fail; `mlresilience:check` (KAN-91) → 4 pass/0 fail; `qualityscope:check` (KAN-138) → 6 pass/0 fail; `modalities:check` (KAN-92) → 5 pass/0 fail; `deadline:check` (KAN-90) → 6 pass/0 fail; `usagereservation:check` (KAN-89) → 6 pass/0 fail; `mlgate:check` (KAN-88) → 7 pass/0 fail; `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live provider calls were made: the harness is proven with injected runners; the live-API benchmark run (real candidates, real scores) is the ML-lane cutover with hosted evidence.
- Bengali (bn) has no scenarios in this candidate's fixture — it reports unsupported honestly until reviewed bn scenarios land (a content decision).
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-83 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: the remaining AI-lane tasks are dependency-gated (AI-16 by SYNC-01, AI-18 by SCOPE-02); the next eligible task is selected from live Jira before assignment.
