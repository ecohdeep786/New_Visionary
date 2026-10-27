# KAN-87 — AI-05 — disable unsafe global exact/semantic/template caches; add only scoped, source/policy/version-aware, reauthorized caching

## Task review and verification handoff

Jira key / source ID: KAN-87 (AI-05)
Acceptance scope: feature-enabler (backend-owned scoped cache domain; wired into the connected ML/runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-87-scoped-cache`; based on the latest lane head `80874b7f` (KAN-83 AI-01 benchmark harness), per D-098 — the next task creates its worktree from the latest working worktree. AI-05 was blocked by CACHE-01 (KAN-141), which was verified and moved to Testing earlier this session, unblocking this task.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-87-scoped-cache`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/scopedcache/scoped-cache-types.ts` (CacheCaller, CacheScope, ScopedCacheError)
- `backend/upstream/backend/src/scopedcache/scoped-cache-lookups.ts` (ScopedCacheStore seam with full-scope keys + delivery-time reauthorization + InMemoryScopedCacheStore contract-true state)
- `backend/upstream/backend/src/scopedcache/scoped-cache.ts` (ScopedCacheService — put with full-scope requirement, get with version-aware + delivery-time reauthorization, invalidateByPolicyVersion)
- `backend/upstream/backend/src/scopedcache/index.ts`
- `backend/upstream/backend/tsconfig.scopedcache.json`
- `backend/tests/contracts/scopedcache/scoped-cache.test.mjs` (AI-05 suite, 5 tests)
- `scripts/scopedcache-check.mjs`, `package.json` (`scopedcache:check`)
Prerequisites: parent KAN-9; CACHE-01 (KAN-141, in Testing) is the recorded prerequisite — this gate composes the product-wide cache policy; the lane head is the base.

## Requirement

Disable unsafe global exact/semantic/template caches. Add only scoped, source/policy/version-aware, reauthorized caching. Exit: evaluated, authorized assistance with bounded costs and no cross-user leakage. D-085: cache scope/invalidation or explicit no-cache; the cache never serves what live authorization would refuse.

## Acceptance criteria → evidence

- Criterion: unsafe global caches are DISABLED for EVERY kind (exact/semantic/template) — any missing scope binding (caller/source version/policy version) refuses (`global_cache_disabled`); no cache kind is exempt.
  - Evidence: test "unsafe global caches are DISABLED for every kind — a missing scope binding refuses".
- Criterion: private entries are NEVER shared — another caller with the same source version gets a miss (the full scope IS the key; no cross-user reads).
  - Evidence: test "private entries are NEVER shared: another caller with the same source gets a miss".
- Criterion: version-aware — an entry pinned to source version X is never served for version Y (`version_mismatch`).
  - Evidence: test "version-aware: an entry pinned to version X is never served for version Y".
- Criterion: reauthorized at delivery — a cached response serves only after the delivery-time reauthorization passes (server-live); a revoked caller's entries stop serving immediately (`reauthorization_failed`); the cache never serves what live authorization would refuse.
  - Evidence: test "reauthorized at delivery: a revoked caller's entries stop serving immediately (server-live)".
- Criterion: policy-aware invalidation — a policy version bump invalidates exactly the matching entries event-driven (CACHE-01 composition); entries on the current policy version survive.
  - Evidence: test "policy-version bump invalidates matching entries event-driven".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; client caches adopt CACHE-01 family policies at cutover.
  - API: N/A in the enabler; the ML runtime routes its exact/semantic/template lookups through this service at cutover.
  - Backend: ScopedCacheService implements the scoped-only, reauthorized cache layer.
  - Data: in-memory store mirrors scoped entries + authorization state; Cloud SQL/Redis adapter at integration resolves from scoped cache tables with the full-scope key.
  - Jobs/ML: policy-version bumps arrive event-driven from the owning stores (CACHE-01); retrieval-gate (KAN-64) reauthorization composes at delivery.

## Commands, exit codes, test counts and timestamps

- Scoped cache compile + suite: `node scripts/scopedcache-check.mjs` → tsc `tsconfig.scopedcache.json` exit 0; `node --test` → 5 tests, 5 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `benchmark:check` (KAN-83) → 4 pass/0 fail; `contextassembly:check` (KAN-149) → 8 pass/0 fail; `mlresilience:check` (KAN-91) → 4 pass/0 fail; `qualityscope:check` (KAN-138) → 6 pass/0 fail; `modalities:check` (KAN-92) → 5 pass/0 fail; `deadline:check` (KAN-90) → 6 pass/0 fail; `usagereservation:check` (KAN-89) → 6 pass/0 fail; `mlgate:check` (KAN-88) → 7 pass/0 fail; `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL/Redis and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Semantic-cache similarity thresholds are an ML-lane tuning concern; this enabler owns the scope/authorization contract.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-87 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: with AI-05 done, the remaining lane tasks are all dependency-gated (SYNC-01/02, SCOPE-02/03, FILE-03, JOB-01, DATA-05); the next eligible task is selected from live Jira before assignment.
