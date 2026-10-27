# KAN-84 — AI-02 — reviewed provider purpose/region/retention/tools and contract settings; minimize sent data and approve any fallback

## Task review and verification handoff

Jira key / source ID: KAN-84 (AI-02)
Acceptance scope: feature-enabler (backend-owned provider-request scope gate; wired into the connected ML/runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-84-provider-scope`; based on the latest lane head `8ea1881d` (KAN-81 BUILD-07 completion criteria), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-84-provider-scope`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/providerscope/provider-scope-types.ts` (ProviderCaller, ProviderPurpose, ProviderContract, ProviderRequest, MinimizedRequest, ProviderScopeError)
- `backend/upstream/backend/src/providerscope/provider-scope-lookups.ts` (ProviderContractStore seam + InMemoryProviderContractStore contract-true state)
- `backend/upstream/backend/src/providerscope/provider-scope.ts` (ProviderScopeGate — authorize, authorizeFallback, bind with minimization + fail-closed field/tool checks)
- `backend/upstream/backend/src/providerscope/index.ts`
- `backend/upstream/backend/tsconfig.providerscope.json`
- `backend/tests/contracts/providerscope/provider-scope.test.mjs` (AI-02 suite, 4 tests)
- `scripts/providerscope-check.mjs`, `package.json` (`providerscope:check`)
Prerequisites: parent KAN-9; the lane head (CONTENT+LEARN+BUILD lineage) is the base. The ML lane (ml/upstream) binds to this gate at cutover — provider calls run only through it.

## Requirement

Review selected provider purpose/region/retention/tools and contract settings; minimize sent data and approve any fallback. D-085: permitted bounded ML/tools where used; minimize sent data; approved fallbacks only; redacted telemetry.

## Acceptance criteria → evidence

- Criterion: requests run only against the ACTIVE reviewed contract version — the minimized output records contract version, region and retention; revoked and unknown contracts refuse (fail closed).
  - Evidence: test "requests run only against the ACTIVE reviewed contract; minimized output records version/region/retention".
- Criterion: sent data is MINIMIZED — only contract-permitted fields are forwarded; a request needing a non-permitted field is refused (`field_not_permitted`), never silently widened.
  - Evidence: test "sent data is MINIMIZED: a request needing a non-permitted field is refused, never silently widened".
- Criterion: only contract-permitted tools are allowed (`tool_not_permitted` otherwise).
  - Evidence: test "only contract-permitted tools are allowed".
- Criterion: fallback to another provider/region requires an explicit pre-approved entry in the primary contract (`fallback_not_approved` otherwise); an approved fallback binds to the fallback's own reviewed contract.
  - Evidence: test "fallback to another provider/region requires an explicit pre-approved entry; unapproved fallbacks refuse".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; no provider payload leaves the client.
  - API: N/A in the enabler; ML runtime calls the gate before every provider request at cutover.
  - Backend: ProviderScopeGate implements reviewed-contract, minimized, fail-closed provider authorization.
  - Data: in-memory store mirrors reviewed contracts; Cloud SQL adapter at integration resolves from provider_contract tables.
  - Jobs/ML: the ML lane (ml/upstream) binds its provider clients to this gate at cutover; redacted telemetry records the contract version per call.

## Commands, exit codes, test counts and timestamps

- Provider scope compile + suite: `node scripts/providerscope-check.mjs` → tsc `tsconfig.providerscope.json` exit 0; `node --test` → 4 tests, 4 pass, 0 fail (2026-10-27).
- Lane regressions (unchanged base; candidate does not regress the lane): `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live provider contract (purpose/region/retention review) has been signed with any vendor yet; the reviewed-contract RECORDS are product decisions this gate consumes at cutover.
- AI-05 (KAN-87) owns cache scoping for these requests; hosted provider verification and production keys remain open gates.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-84 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: AI-03 (KAN-85) private service identity/audience-expiry-run-bound context; the AI lane continues AI-02→03→04→05→06.
