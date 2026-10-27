# KAN-115 — PRIV-06 — protect exports, object links, search results, error messages and telemetry through negative authorization tests; include log/backup/access-review and secret-rotation procedures

## Task review and verification handoff

Jira key / source ID: KAN-115 (PRIV-06)
Acceptance scope: feature-enabler (backend-owned negative-authorization gate; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-115-retention-verification`; based on the latest lane head `df0489c4` (KAN-114 PRIV-05 support cases), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-115-retention-verification`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/negativeauth/negative-auth-types.ts` (PrivacyActor, SignedLink, SearchHit, OperatingProcedure, NegativeAuthError)
- `backend/upstream/backend/src/negativeauth/negative-auth-lookups.ts` (NegativeAuthStore seam + InMemoryNegativeAuthStore contract-true state)
- `backend/upstream/backend/src/negativeauth/negative-auth-gate.ts` (NegativeAuthorizationGate — resolveLink (owner+window), search (visibility filtering), uniformDenialText, telemetryCheck, validateProcedures)
- `backend/upstream/backend/src/negativeauth/index.ts`
- `backend/upstream/backend/tsconfig.negativeauth.json`
- `backend/tests/contracts/negativeauth/negative-auth.test.mjs` (PRIV-06 suite, 5 tests)
- `scripts/negativeauth-check.mjs`, `package.json` (`negativeauth:check`)
Prerequisites: parent KAN-10/PRIV family; the lane head (CONTENT+LEARN+BUILD+AI+CACHE+PRIV lineage) is the base; KAN-91 redaction composes into telemetry checks.

## Requirement

Protect exports, object links, search results, error messages and telemetry through negative authorization tests; include log/backup/access-review and secret-rotation procedures. Exit: real-user data has enforceable access, lifecycle and support procedures.

## Acceptance criteria → evidence

- Criterion: EXPORT/OBJECT LINKS are owner-bound and expiring — a stranger's use of another user's link refuses (`link_not_owned`); an expired link refuses (`link_expired`); the owner within the window resolves.
  - Evidence: test "EXPORT/OBJECT LINKS: a stranger refuses, an expired link refuses, the owner within the window resolves".
- Criterion: SEARCH results leak nothing — another user's private matches never appear; own private and public matches do.
  - Evidence: test "SEARCH: another user's private matches never appear — public results do (no search leak)".
- Criterion: ERROR MESSAGES leak no existence — wrong-user and unknown-id denials are byte-equal.
  - Evidence: test "ERROR MESSAGES: wrong-user and unknown-id denials are byte-equal (no existence leak)".
- Criterion: TELEMETRY carries no raw private text — any occurrence refuses (`telemetry_leak`); redacted placeholders (KAN-91) pass.
  - Evidence: test "TELEMETRY: raw private text present refuses; redacted records pass".
- Criterion: PROCEDURES are first-class and validated — log-retention, backup-hold, access-review and secret-rotation records require positive cadences and concrete steps; a missing procedure refuses (`procedure_invalid`).
  - Evidence: test "PROCEDURES: log/backup/access-review/rotation records validate; a missing procedure refuses".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; export/download surfaces consume resolved links at cutover.
  - API: N/A in the enabler; export/object/search controllers call the gate at cutover.
  - Backend: NegativeAuthorizationGate implements the negative tests as executable checks.
  - Data: in-memory store mirrors links/hits/procedures; Cloud SQL adapter at integration resolves from export_link/search visibility/procedure tables.
  - Jobs/ML: secret rotation composes with KAN-85 service-identity grants (old signatures reject); telemetry composes with KAN-91 redaction.

## Commands, exit codes, test counts and timestamps

- Negative authorization compile + suite: `node scripts/negativeauth-check.mjs` → tsc `tsconfig.negativeauth.json` exit 0; `node --test` → 5 tests, 5 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `supportcases:check` (KAN-114) → 6 pass/0 fail; `notifications:check` (KAN-113) → 7 pass/0 fail; `restoretombstone:check` (KAN-112) → 6 pass/0 fail; `privacyjobs:check` (KAN-111) → 5 pass/0 fail; `privacycore:check` (KAN-110) → 6 pass/0 fail; `scopedcache:check` (KAN-87) → 5 pass/0 fail; `benchmark:check` (KAN-83) → 4 pass/0 fail; `contextassembly:check` (KAN-149) → 8 pass/0 fail; `mlresilience:check` (KAN-91) → 4 pass/0 fail; `qualityscope:check` (KAN-138) → 6 pass/0 fail; `modalities:check` (KAN-92) → 5 pass/0 fail; `deadline:check` (KAN-90) → 6 pass/0 fail; `usagereservation:check` (KAN-89) → 6 pass/0 fail; `mlgate:check` (KAN-88) → 7 pass/0 fail; `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL/object storage wired yet; real export links and object URLs bind at cutover.
- Secret-rotation execution (actual key ceremony) is a deployment-lane procedure; this enabler owns the procedure record and validation.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-115 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: PRIV-07 continues on this head.
