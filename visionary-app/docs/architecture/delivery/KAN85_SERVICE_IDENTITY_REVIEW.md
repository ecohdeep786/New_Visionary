# KAN-85 — AI-03 — replace imported HMAC/browser-claim trust with private service identity and audience/expiry/run-bound authorized context

## Task review and verification handoff

Jira key / source ID: KAN-85 (AI-03)
Acceptance scope: feature-enabler (backend-owned service identity domain; wired into the connected ML/runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-85-service-identity`; based on the latest lane head `07478829` (KAN-84 AI-02 provider scope gate), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-85-service-identity`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/serviceidentity/service-identity-types.ts` (IdentityOwner, ServiceGrant, AuthorizedContext, BrowserClaim, IdentityError)
- `backend/upstream/backend/src/serviceidentity/service-identity-lookups.ts` (ServiceIdentityStore seam + InMemoryServiceIdentityStore contract-true state with revocation)
- `backend/upstream/backend/src/serviceidentity/service-identity.ts` (ServiceIdentityService — issueGrant, authorizeWithGrant, authorizeClaim (always rejects), revokeGrant)
- `backend/upstream/backend/src/serviceidentity/index.ts`
- `backend/upstream/backend/tsconfig.serviceidentity.json`
- `backend/tests/contracts/serviceidentity/service-identity.test.mjs` (AI-03 suite, 7 tests)
- `scripts/serviceidentity-check.mjs`, `package.json` (`serviceidentity:check`)
Prerequisites: parent KAN-9; the lane head (CONTENT+LEARN+BUILD+AI-02 lineage) is the base. The ML lane (ml/upstream) replaces imported HMAC/browser-claim trust with this service at cutover.

## Requirement

Replace imported HMAC/browser-claim trust with private service identity and audience/expiry/run-bound authorized context. D-085: permitted bounded ML/tools where used; server-owned authority; no browser-issued authorization anywhere.

## Acceptance criteria → evidence

- Criterion: private service grants are issued SERVER-SIDE and authorize with matching audience/run/scope; the authorized context carries NO secret material (subject/audience/run/scopes only).
  - Evidence: test "server-issued grants authorize with matching audience/run/scope; the context carries no secret material".
- Criterion: a browser-supplied claim is ALWAYS rejected (`browser_claim_rejected`) — the browser is never the authority; imported HMAC/browser-claim trust is replaced.
  - Evidence: test "a browser-supplied claim is ALWAYS rejected — the browser is never the authority".
- Criterion: grants are EXPIRY-bound — an expired grant refuses immediately even with matching audience/run; zero/negative TTL refuses at issuance.
  - Evidence: test "an expired grant refuses immediately, even with matching audience and run".
- Criterion: grants are AUDIENCE-bound — a retrieval grant cannot authorize the assessment audience (`audience_mismatch`).
  - Evidence: test "audience mismatch refuses: a retrieval grant cannot authorize the assessment audience".
- Criterion: grants are RUN-bound — a run-bound grant refuses a different run (`run_mismatch`); an unbound grant works across runs within its scopes.
  - Evidence: test "a run-bound grant cannot authorize a different run; unbound grants run within scope".
- Criterion: revocation is immediate and owner-only; revoked grants fail closed (`grant_revoked`); unknown grants fail closed (`unknown_grant`).
  - Evidence: test "revocation is immediate and owner-only; unknown grants fail closed".
- Criterion: scope enforcement — the required scope must be present on the grant (`scope_missing` otherwise).
  - Evidence: test "scope enforcement: the required scope must be present on the grant".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; no client ever holds or computes service authority.
  - API: N/A in the enabler; ML/service controllers call the service at cutover.
  - Backend: ServiceIdentityService implements server-issued, audience/expiry/run-bound, revocable identity.
  - Data: in-memory store mirrors grants/revocations; Cloud SQL adapter at integration resolves from service_grant tables.
  - Jobs/ML: the ML lane (ml/upstream) binds its service clients to issued grants at cutover; the provider scope gate (KAN-84) composes on top of the authorized context.

## Commands, exit codes, test counts and timestamps

- Service identity compile + suite: `node scripts/serviceidentity-check.mjs` → tsc `tsconfig.serviceidentity.json` exit 0; `node --test` → 7 tests, 7 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Grant signing/transport (mTLS or signed assertions between services) is a deployment-lane concern; this enabler owns the server-side grant model and bindings.
- Hosted verification and production keys remain open gates; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-85 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: AI-04 (KAN-86) conversation UID/workspace ownership enforcement; the AI lane continues AI-03→04→05→06.
