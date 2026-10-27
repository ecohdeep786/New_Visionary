# KAN-78 — BUILD-04 — durable run/status/event and proposal accept/reject contracts; AI proposals bound to a base revision; new edits or revoked permission block acceptance

## Task review and verification handoff

Jira key / source ID: KAN-78 (BUILD-04)
Acceptance scope: feature-enabler (backend-owned durable run + AI proposal contract; wired into the connected runtime/UI at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-78-durable-runs`; based on the latest lane head `80b5b1f1` (KAN-77 BUILD-03 guided briefs), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-78-durable-runs`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/runs/run-contract-types.ts` (RunOwner, RunStatus, RunEvent, BuildRun, AiProposal, AcceptResult, RunContractError)
- `backend/upstream/backend/src/runs/run-contract-lookups.ts` (RunContractStore seam + InMemoryRunContractStore contract-true append-only events/revisions)
- `backend/upstream/backend/src/runs/run-contract-service.ts` (RunContractService — startRun, transition, propose, acceptProposal with base/permission guards, rejectProposal)
- `backend/upstream/backend/src/runs/index.ts`
- `backend/upstream/backend/tsconfig.runs.json`
- `backend/tests/contracts/runs/run-contract.test.mjs` (BUILD-04 suite, 6 tests)
- `scripts/runs-check.mjs`, `package.json` (`runs:check`)
Prerequisites: parent KAN-8 (P06); BUILD-01 (KAN-75, in Testing on this lane) supplies the revision model acceptance appends into.

## Requirement

Add durable run/status/event and proposal accept/reject contracts. AI proposals are bound to a base revision; new edits or revoked permission block acceptance. Exit: current-document Build is server-backed without weakening existing privacy/recovery rules. D-085/Doc 13: durable runs, proposal acceptance and explicit distribution; a generated plan/event is not committed product state.

## Acceptance criteria → evidence

- Criterion: runs are DURABLE — status transitions append immutable events and status is derived from the event list (never mutated in place); earlier events stay byte-stable.
  - Evidence: test "runs are durable: transitions append immutable events and status is derived, never mutated in place".
- Criterion: AI proposals bind to the exact base revision; a cancelled run yields no proposals (duplicate/cancelled behavior).
  - Evidence: test "AI proposals bind to the exact base revision; a cancelled run yields no proposals".
- Criterion: NEW EDITS block acceptance — when the project's current revision has moved past the proposal's base, acceptance is refused (`base_revision_moved`).
  - Evidence: test "NEW EDITS block acceptance: base revision moved since the proposal was generated".
- Criterion: REVOKED PERMISSION blocks acceptance (`permission_revoked`).
  - Evidence: test "REVOKED PERMISSION blocks acceptance".
- Criterion: acceptance APPENDS a new revision (apply-as-new-revision); rejection records the decision without touching history; both decisions are idempotent per decision id (no double-append).
  - Evidence: test "acceptance appends a new revision; rejection records without history; decisions idempotent per decision id".
- Criterion: wrong users denied; unknown runs/proposals fail closed.
  - Evidence: test "wrong users denied; unknown runs/proposals fail closed".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; ArtifactStudio run/proposal surfaces consume the contract at cutover; blocked acceptance renders the honest reason.
  - API: N/A in the enabler; run/proposal controllers call the service at cutover with validated schema and decision-id idempotency.
  - Backend: RunContractService implements durable events, base-bound proposals, guarded acceptance.
  - Data: in-memory store mirrors runs/events/proposals/decisions; Cloud SQL adapter at integration resolves from run/proposal/decision tables.
  - Jobs/ML: AI proposals arrive from the permitted ML lane at cutover; a generated proposal is not committed product state until accepted here.

## Commands, exit codes, test counts and timestamps

- Run contract compile + suite: `node scripts/runs-check.mjs` → tsc `tsconfig.runs.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-27).
- Lane regressions (unchanged base; candidate does not regress the lane): `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- AI proposal generation itself is the AI lane's concern; this enabler owns the durable run + accept/reject contract.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-78 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: BUILD-05 (KAN-79); the next eligible task is selected from live Jira before assignment.
