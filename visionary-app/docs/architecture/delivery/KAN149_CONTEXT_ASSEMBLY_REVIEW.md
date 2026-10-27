# KAN-149 — AI-15 — AIRA P0–P3 context assembly and inspectable scoped memory

## Task review and verification handoff

Jira key / source ID: KAN-149 (AI-15)
Acceptance scope: feature-enabler (backend-owned AIRA context-assembly domain; wired into the connected ML/runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Note: KAN-149 was found in Jira `Testing` with no implementation anywhere (no branch, no commits); the status was stale. It was moved to In Progress at task start and is returned to Testing now with a real candidate.
Worker branch / base commit / candidate head commit: `codex/principal-kan-149-context-assembly`; based on the latest lane head `f9f99dd0` (KAN-91 AI-09 resilience), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-149-context-assembly`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/contextassembly/context-assembly-types.ts` (AssemblyOwner, ConstitutionPolicy, PermittedFact, MemoryObservation, ContextAssembly, AssemblyError)
- `backend/upstream/backend/src/contextassembly/context-assembly-lookups.ts` (ContextAssemblyStore seam + InMemoryContextStore contract-true state with immutable constitution)
- `backend/upstream/backend/src/contextassembly/context-assembly.ts` (AiraContextAssembler — setConstitution with immutability, correctMemory/disableMemory controls, assemble with P0–P3 layering and the grounding-never-dropped rule)
- `backend/upstream/backend/src/contextassembly/index.ts`
- `backend/upstream/backend/tsconfig.contextassembly.json`
- `backend/tests/contracts/contextassembly/context-assembly.test.mjs` (AI-15 suite, 8 tests)
- `scripts/contextassembly-check.mjs`, `package.json` (`contextassembly:check`)
Prerequisites: parent KAN-9; the lane head (CONTENT+LEARN+BUILD+AI lineage incl. KAN-86 conversation boundary, KAN-88 ML gate, KAN-91 resilience) is the base. The ML runtime binds its context assembly to this service at cutover.

## Requirement

Implement AIRA P0–P3 context assembly and evidence-backed memory observations behind the current scoped conversation boundary: immutable server constitution/policy, permitted learner/context snapshot, bounded current-session history and authorized retrieval. Required factual grounding must not be dropped to meet a token/latency budget; abstain or use approved authored material. Preserve provenance/correction/disable controls, label onboarding facts, return fewer observations when evidence is insufficient, and separate all five role/workspace/purpose/language contexts without automatic training.

## Acceptance criteria → evidence

- Criterion (P0): the server constitution is IMMUTABLE — a same-version conflicting overwrite refuses (`constitution_conflict`); identical re-set is idempotent; every assembly stamps the constitution version it ran under.
  - Evidence: test "P0: the constitution is IMMUTABLE — same-version conflicting overwrite refuses; assemblies stamp the version".
- Criterion (P1): five-way context separation — permitted snapshot facts surface only for the exact role/workspace/purpose/language context; other purposes/languages never leak in.
  - Evidence: test "P1: five-way context separation — different purpose/language/role never see each other's facts".
- Criterion (P2): bounded current-session history — only the most recent bounded turns are included; older turns are dropped and honestly COUNTED (not hidden).
  - Evidence: test "P2: bounded current-session history — older turns dropped and honestly COUNTED".
- Criterion (P3): only authorized retrieval sources enter the assembly; the scoped conversation boundary denies strangers (`not_owner`).
  - Evidence: test "P3: only authorized retrieval sources enter; the scoped boundary denies strangers".
- Criterion: required factual grounding is NEVER dropped for a token/latency budget — a budget that would cut grounding abstains (`budget_would_drop_grounding`); approved authored material is the only alternate grounding path.
  - Evidence: test "grounding is NEVER dropped for a budget: a tight budget ABSTAINS instead of truncating grounding".
- Criterion: insufficient evidence returns FEWER observations — never an invented one (`insufficient_evidence` abstention).
  - Evidence: test "insufficient evidence returns FEWER observations — never an invented one".
- Criterion: provenance/correction/disable controls preserved — disabled memories excluded, corrections supersede originals, every observation carries provenance, onboarding facts labeled.
  - Evidence: test "provenance/correction/disable controls work; onboarding facts labeled".
- Criterion: NO automatic training — the assembly result carries no training sink and the service exposes no training-write method.
  - Evidence: test "no automatic training: the assembly exposes no training write path".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; the teaching interface renders grounding/abstention states honestly at cutover.
  - API: N/A in the enabler; ML runtime calls the assembler before generation at cutover.
  - Backend: AiraContextAssembler implements the layered assembly with the grounding rule.
  - Data: in-memory store mirrors constitution/conversations/memories; Cloud SQL adapter at integration resolves from constitution/memory tables; the conversation boundary reuses KAN-86 ownership.
  - Jobs/ML: the ML lane (ml/upstream) consumes only assembled, grounded context at cutover; no assembly result is ever a training write (automatic training stays disconnected).

## Commands, exit codes, test counts and timestamps

- Context assembly compile + suite: `node scripts/contextassembly-check.mjs` → tsc `tsconfig.contextassembly.json` exit 0; `node --test` → 8 tests, 8 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `mlresilience:check` (KAN-91) → 4 pass/0 fail; `qualityscope:check` (KAN-138) → 6 pass/0 fail; `modalities:check` (KAN-92) → 5 pass/0 fail; `deadline:check` (KAN-90) → 6 pass/0 fail; `usagereservation:check` (KAN-89) → 6 pass/0 fail; `mlgate:check` (KAN-88) → 7 pass/0 fail; `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Token accounting here is character-length based (a deterministic proxy); the ML lane binds the real tokenizer at cutover without changing the abstention rule.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-149 In Progress at start (stale Testing corrected), → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: remaining AI-lane tasks (AI-16 blocked by SYNC-01; AI-01 blocked by AI-11); the next eligible task is selected from live Jira before assignment.
