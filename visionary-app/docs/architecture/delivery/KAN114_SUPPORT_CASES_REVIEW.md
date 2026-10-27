# KAN-114 — PRIV-05 — support cases/reporting, scoped operator access, reason/audit and incident/abuse response; no unrestricted user dump or default open access

## Task review and verification handoff

Jira key / source ID: KAN-114 (PRIV-05)
Acceptance scope: feature-enabler (backend-owned support-case domain; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-114-support-cases`; based on the latest lane head `49dbfc98` (KAN-113 PRIV-04 notifications), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-114-support-cases`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/supportcases/support-case-types.ts` (CaseOwner, CaseReason, SupportCase, OperatorAccess, Incident, SupportCaseError)
- `backend/upstream/backend/src/supportcases/support-case-lookups.ts` (SupportCaseStore seam with append-only audit + InMemorySupportCaseStore contract-true state)
- `backend/upstream/backend/src/supportcases/support-case-service.ts` (SupportCaseService — fileCase, inspectOwn, operatorAccess (scoped/reason-required/audited), operatorDump (always refused), openIncident/resolveIncident, auditTrail)
- `backend/upstream/backend/src/supportcases/index.ts`
- `backend/upstream/backend/tsconfig.supportcases.json`
- `backend/tests/contracts/supportcases/support-case.test.mjs` (PRIV-05 suite, 6 tests)
- `scripts/supportcases-check.mjs`, `package.json` (`supportcases:check`)
Prerequisites: parent KAN-10/PRIV family; the lane head (CONTENT+LEARN+BUILD+AI+CACHE+PRIV lineage) is the base.

## Requirement

Implement support cases/reporting, scoped operator access, reason/audit and incident/abuse response. No unrestricted user dump or default open access. Exit: real-user data has enforceable access, lifecycle and support procedures.

## Acceptance criteria → evidence

- Criterion: case filing is owner-scoped with an explicit reason; an empty reason refuses; abuse/content reports open an incident that RESTRICTS the reported content pending review.
  - Evidence: test "case filing: owner-scoped with explicit reason; empty reason refuses; abuse reports open a RESTRICTING incident".
- Criterion: SCOPED OPERATOR ACCESS ONLY — without the `support.review` scope (or without an operator identity) access refuses; with it, access is per-case, reason-required, and every access appends the audit (who/which case/why/when).
  - Evidence: test "scoped operator access: without the scope (or operator identity) access refuses; with it, per-case reason-required audited access".
- Criterion: NO unrestricted user dump — a whole-user data dump refuses for ANY operator with ANY scopes/reason (`operator_dump_refused`); access is per-case only.
  - Evidence: test "NO unrestricted dump: a whole-user data dump refuses for ANY operator, ANY reason".
- Criterion: the audit trail is APPEND-ONLY — earlier entries stay byte-stable after later accesses.
  - Evidence: test "audit is append-only: earlier entries stay byte-stable after later accesses".
- Criterion: incident/abuse response — resolution records the outcome and the resolver, closes the case honestly, refuses double resolution, and audits the decision.
  - Evidence: test "incident resolution records the outcome, closes the case, and audits the decision".
- Criterion: wrong users denied on own-case inspection; unknown cases fail closed.
  - Evidence: test "wrong users denied on own-case inspection; unknown cases fail closed".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; Support/Settings surfaces file and track cases at cutover.
  - API: N/A in the enabler; support-case controllers call the service at cutover with the authenticated identity (user or scoped operator).
  - Backend: SupportCaseService implements default-closed operator authority with per-case audited access.
  - Data: in-memory store mirrors cases/audit/incidents; Cloud SQL adapter at integration resolves from support_case/audit/incident tables.
  - Jobs/ML: incident restriction composes with the sharing gate (KAN-80) and modality gate (KAN-92) at cutover; audit entries feed the tamper-evident trail.

## Commands, exit codes, test counts and timestamps

- Support case compile + suite: `node scripts/supportcases-check.mjs` → tsc `tsconfig.supportcases.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `notifications:check` (KAN-113) → 7 pass/0 fail; `restoretombstone:check` (KAN-112) → 6 pass/0 fail; `privacyjobs:check` (KAN-111) → 5 pass/0 fail; `privacycore:check` (KAN-110) → 6 pass/0 fail; `scopedcache:check` (KAN-87) → 5 pass/0 fail; `benchmark:check` (KAN-83) → 4 pass/0 fail; `contextassembly:check` (KAN-149) → 8 pass/0 fail; `mlresilience:check` (KAN-91) → 4 pass/0 fail; `qualityscope:check` (KAN-138) → 6 pass/0 fail; `modalities:check` (KAN-92) → 5 pass/0 fail; `deadline:check` (KAN-90) → 6 pass/0 fail; `usagereservation:check` (KAN-89) → 6 pass/0 fail; `mlgate:check` (KAN-88) → 7 pass/0 fail; `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Operator identity issuance (who may hold `support.review`) is a ROLE-lane decision; this enabler enforces the scoped, audited, default-closed access contract.
- Hosted verification and real support drills remain open gates; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-114 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: PRIV-06/07 continue on this head.
