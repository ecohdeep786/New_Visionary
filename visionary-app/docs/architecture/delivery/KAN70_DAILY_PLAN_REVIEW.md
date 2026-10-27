# KAN-70 — LEARN-04 — persist permitted goals/daily plans/review scheduling and eligible discovery results with understandable reasons; a rebuilding projection must not overwrite evidence

## Task review and verification handoff

Jira key / source ID: KAN-70 (LEARN-04)
Acceptance scope: feature-enabler (backend-owned daily planning domain; wired into the connected runtime/UI at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-70-daily-plan`; based on the latest lane head `4428f61c` (KAN-69 LEARN-03 projections), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-70-daily-plan`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/dailyplan/daily-plan-types.ts` (PlanOwner, LearningGoal, PlanItem, DailyPlan, ScheduledReview, DiscoveryResult, DailyPlanError)
- `backend/upstream/backend/src/dailyplan/daily-plan-lookups.ts` (PlanStore + PlanEligibilityLookup + ReviewDueLookup + EvidenceLedgerReader seams + InMemoryPlanStore contract-true state)
- `backend/upstream/backend/src/dailyplan/daily-plan.ts` (DailyPlanService — setGoal, buildDailyPlan, scheduleReview, discover, evidenceUnchanged)
- `backend/upstream/backend/src/dailyplan/index.ts`
- `backend/upstream/backend/tsconfig.dailyplan.json`
- `backend/tests/contracts/dailyplan/daily-plan.test.mjs` (LEARN-04 suite, 7 tests)
- `scripts/dailyplan-check.mjs`, `package.json` (`dailyplan:check`)
Prerequisites: parent KAN-7 (P05); the LEARN lane head (KAN-67/68/69 lineage) is the base — review-due facts come from the LEARN-03 projection semantics (assessed retry/refresh, self-review follow-up; never consumption).

## Requirement

Persist permitted goals/daily plans/review scheduling and eligible discovery results with understandable reasons; a rebuilding projection must not overwrite evidence. D-085 trace: trusted evidence and reproducible, distinct progress metrics; evaluated recommendations with reasons.

## Acceptance criteria → evidence

- Criterion: goals are PERMITTED — a goal may only target a concept with a released source revision (unreleased refused); goals are owner-scoped.
  - Evidence: test "goals are permitted only for released concepts; wrong users cannot see another learner's goals".
- Criterion: daily plans rebuild deterministically from goals + due reviews, and every item carries an understandable human-readable reason (goal target text / evidence-derived review reason).
  - Evidence: test "daily plans rebuild deterministically from goals + due reviews with understandable reasons".
- Criterion (the invariant): a rebuilding projection must not overwrite evidence — the evidence ledger digest stays byte-identical across rebuilds.
  - Evidence: test "a rebuilding projection must not overwrite evidence: the ledger stays byte-identical across rebuilds".
- Criterion: plan versions append and never rewrite past versions (v1 content byte-stable after v2 build).
  - Evidence: test "plan versions append and never rewrite past versions".
- Criterion: review scheduling only from real due reasons (from LEARN-03 projection semantics); a consumption-only/non-due concept is never scheduled.
  - Evidence: test "review scheduling only from real due reasons; consumption-only or non-due concepts refused".
- Criterion: discovery returns only eligible released concepts, each with an understandable reason; ineligible filtered.
  - Evidence: test "discovery returns only eligible released concepts, each with an understandable reason".
- Criterion: privacy — plans/reviews/goals are owner-scoped; a stranger reads nothing of another learner.
  - Evidence: test "plans and reviews are owner-scoped: a stranger reads nothing of another learner".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; Progress/Home daily-plan surfaces consume plans/reviews/discovery at cutover — reasons render verbatim.
  - API: N/A in the enabler; planning controllers call the service at cutover.
  - Backend: DailyPlanService implements permitted goals, deterministic versioned rebuilds, evidence-preserving planning.
  - Data: in-memory store mirrors goals/plans/reviews + read-only evidence ledger; Cloud SQL adapter at integration resolves from goals/plans/review_schedule tables with evidence tables read-only.
  - Jobs/ML: evaluated recommendations with reasons (ML lane) feed discovery candidates at cutover; a generated plan is not committed product state until saved here.

## Commands, exit codes, test counts and timestamps

- Daily plan compile + suite: `node scripts/dailyplan-check.mjs` → tsc `tsconfig.dailyplan.json` exit 0; `node --test` → 7 tests, 7 pass, 0 fail (2026-10-27).
- Lane regressions (unchanged base; candidate does not regress the lane): `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Review-due interval calibration is a separate product/ML decision; this enabler schedules only from evidence-derived due reasons.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-70 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: LEARN-06 (KAN-72) is gated by SYNC-02 (KAN-140) per the manifest; the lane continues with the next eligible LEARN task (LEARN-07 / KAN-73).
