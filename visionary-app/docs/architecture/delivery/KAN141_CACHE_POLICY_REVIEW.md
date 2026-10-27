# KAN-141 — CACHE-01 — product-wide cache policy per feature family as executable invariants; no server cache at launch, private never shared-CDN, event-driven invalidation, no data-deletion TTL

## Task review and verification handoff

Jira key / source ID: KAN-141 (CACHE-01)
Acceptance scope: feature-enabler (backend-owned cache policy domain; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Note: the implementation on this branch predates this session (built in an earlier lane session, committed and pushed as `e1f437ec` but never given a review handoff or a Jira record). This session verified the existing candidate (suite green), added the missing review handoff, and recorded the task in Jira — completing the stale lane state so CACHE-01 can gate AI-05.
Worker branch / base commit / candidate head commit: `codex/principal-kan-141-cache-policy`; implementation commit `e1f437ec` based on verified `origin/dev` f61292ef (KAN-37 closeout) — a parallel lane branch like CONTENT-01..03; the review handoff commit is the branch head.
Current dev commit / comparison range: f61292ef → candidate head (worktree `principal-kan-141-cache-policy`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/cachepolicy/cache-policy-types.ts` (per-feature-family cache policy types)
- `backend/upstream/backend/src/cachepolicy/cache-policy.ts` (the shipped product-wide cache policy + executable invariant validator)
- `backend/upstream/backend/src/cachepolicy/index.ts`
- `backend/upstream/backend/tsconfig.cachepolicy.json`
- `backend/tests/contracts/cachepolicy/cache-policy.test.mjs` (CACHE-01 suite, 8 tests)
- `scripts/cachepolicy-check.mjs`, `package.json` (`cachepolicy:check`)
- `docs/architecture/delivery/KAN141_CACHE_POLICY_REVIEW.md` (this handoff, added at verification)
Prerequisites: parent KAN-9/CACHE family; based on the verified data foundation. CACHE-01 gates AI-05 (KAN-87 scoped caching).

## Requirement

Product-wide cache policy per feature family as executable invariants: no server cache at launch, private never shared-CDN, event-driven invalidation, no data-deletion TTL. D-085: cache scope/invalidation or explicit no-cache.

## Acceptance criteria → evidence

- Criterion: the shipped policy passes every CACHE-01 invariant (executable validation, not prose).
  - Evidence: test "the shipped policy passes every CACHE-01 invariant".
- Criterion: the policy covers EXACTLY the feature-delivery matrix families — completeness validation refuses both missing and orphan entries.
  - Evidence: tests "the policy covers exactly the feature-delivery matrix families" and "completeness refuses both missing and orphan policy entries".
- Criterion: sources — permission-filtered scope keys and withdrawal-stops-retrieval invalidation triggers.
  - Evidence: test "sources: permission-filtered scope keys and withdrawal-stops-retrieval triggers".
- Criterion: public hashed-asset caching stays public, bounded and revalidated.
  - Evidence: test "public: hashed-asset caching stays public, bounded and revalidated".
- Criterion: billing, account and ask families are private, authoritative and never server-cached at launch.
  - Evidence: test "billing, account and ask: private, authoritative and never server-cached at launch".
- Criterion: privacy — revocation covers derived caches and no retention TTL is invented.
  - Evidence: test "privacy: revocation covers derived caches and no retention TTL is invented".
- Criterion: the validator rejects tampered policies (fail closed).
  - Evidence: test "the validator rejects tampered policies".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; client caches adopt the same family policy at cutover.
  - API: N/A in the enabler; response caching headers derive from the policy at cutover.
  - Backend: the executable policy + validator are the single source of cache truth.
  - Data: no data-deletion TTL anywhere in the policy; invalidation is event-driven (withdrawal/revocation events from the owning stores).
  - Jobs/ML: AI-05 (KAN-87) composes scoped, reauthorized caching on top of this policy at cutover.

## Commands, exit codes, test counts and timestamps

- Cache policy compile + suite: `node scripts/cachepolicy-check.mjs` → tsc `tsconfig.cachepolicy.json` exit 0; `node --test` → 8 tests, 8 pass, 0 fail (2026-10-28, verified in this session).
- Note: this branch is based on dev f61292ef (parallel lane branch), so the newer lane suites are not present in this worktree; the full lane regression ran on the lane head worktrees (see KAN-149/KAN-83 receipts).
- Backend dependency install: present in the worktree (earlier session); tsc + suite verified exit 0 today.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL/CDN and no Nest controller wired yet; real header/cache wiring happens at cutover.
- AI-05 (KAN-87) scoped caching composes on top of this policy; hosted cache verification remains an open gate.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-141 → In Progress at verification start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: CACHE-01 gates AI-05 (KAN-87) scoped, source/policy/version-aware, reauthorized caching.
