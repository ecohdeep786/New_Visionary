# KAN-90 — AI-08 — reconcile the whole-request teaching deadline and cancellation with provider work; long Build jobs use their own durable protocol; preserve partial/final distinction and disconnect cleanup

## Task review and verification handoff

Jira key / source ID: KAN-90 (AI-08)
Acceptance scope: feature-enabler (backend-owned deadline/cancel reconciliation domain; wired into the connected ML/runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-90-deadline-reconciliation`; based on the latest lane head `ac90f687` (KAN-89 AI-07 usage reservation), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-90-deadline-reconciliation`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/deadline/deadline-types.ts` (DeadlineOwner, OutcomeReason, RequestOutcome, DeadlineError)
- `backend/upstream/backend/src/deadline/deadline-lookups.ts` (DeadlineStore seam + InMemoryDeadlineStore contract-true state with durable-run registry)
- `backend/upstream/backend/src/deadline/deadline-service.ts` (DeadlineReconciliationService — begin, recordPartial, onProviderCheckpoint, cancel, complete, onDisconnect, beginForLongJob)
- `backend/upstream/backend/src/deadline/index.ts`
- `backend/upstream/backend/tsconfig.deadline.json`
- `backend/tests/contracts/deadline/deadline.test.mjs` (AI-08 suite, 6 tests)
- `scripts/deadline-check.mjs`, `package.json` (`deadline:check`)
Prerequisites: parent KAN-9; the lane head (CONTENT+LEARN+BUILD+AI-02/03/04/06/07 lineage) is the base; the durable-run registry seam composes with BUILD-04 (KAN-78).

## Requirement

Reconcile the existing whole-request teaching deadline and cancellation with provider work; long Build jobs use their own durable protocol. Preserve partial/final distinction and disconnect cleanup. Exit: evaluated, authorized assistance with bounded costs and no cross-user leakage.

## Acceptance criteria → evidence

- Criterion: the partial/final distinction is preserved — a completed request is `final: true` (reason `completed`); a request whose deadline passed at a provider checkpoint delivers its produced partial with `final: false`, reason `deadline`, and provider work stopped (nothing new after termination).
  - Evidence: test "a completed request is FINAL (reason completed); the deadline passing at a checkpoint delivers the partial honestly" and test "the deadline passing at a provider checkpoint delivers the PARTIAL, stops provider work".
- Criterion: cancellation reconciles with provider work — the cancel stops provider work at the checkpoint; any produced partial stays partial (`final: false`, reason `cancelled`).
  - Evidence: test "cancellation stops provider work; any partial stays partial".
- Criterion: a provider finishing AFTER the deadline delivers partial, never final (no deadline dodge).
  - Evidence: test "a provider finishing AFTER the deadline delivers partial, never final".
- Criterion: disconnect cleanup — provider work stopped (no orphans), the partial not presented as final, honest `disconnected` reason.
  - Evidence: test "disconnect cleanup: provider work stopped, partial not presented as final, honest reason".
- Criterion: long Build jobs use their own durable protocol — binding a registered durable run to the teaching deadline is refused (`long_job_requires_durable_protocol`); terminated requests accept no further transitions (`already_terminated`); wrong users denied; unknown requests fail closed.
  - Evidence: test "long Build jobs are refused the teaching deadline (they use the durable protocol); wrong users denied".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; the teaching interface renders partial vs final honestly at cutover.
  - API: N/A in the enabler; request controllers call the service at cutover with the authenticated caller.
  - Backend: DeadlineReconciliationService implements deadline/cancel reconciliation with preserved distinctions.
  - Data: in-memory store mirrors tracked requests + the durable-run registry; Cloud SQL adapter at integration resolves from request tracking tables.
  - Jobs/ML: the usage reservation (KAN-89) settles the partial usage on termination; the ML lane stops generation at the checkpoint at cutover.

## Commands, exit codes, test counts and timestamps

- Deadline reconciliation compile + suite: `node scripts/deadline-check.mjs` → tsc `tsconfig.deadline.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `usagereservation:check` (KAN-89) → 6 pass/0 fail; `mlgate:check` (KAN-88) → 7 pass/0 fail; `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Provider-side cancellation signals (stream aborts) bind through the ML lane at cutover; this enabler owns the reconciliation contract.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-90 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: AI-10 (KAN-92) voice/image/structured-activity schemas; the AI lane continues AI-08→10→12.
