# KAN-55 — JOB-03 — admission limits, queue fairness, provider budgets, retry ceilings and durable status/events with replay/refetch semantics

## Task review and verification handoff

Jira key / source ID: KAN-55 (JOB-03)
Acceptance scope: enabler (admission/budget/observation domain on top of the JOB-01/JOB-02 outbox enablers; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: deepseek (senior principal backend engineer)
Reviewer: codex (senior agent) — must explicitly accept responsibility; an implementer cannot self-approve
Worker branch / candidate head: `codex/deepseek-kan-55-admission-limits`
Base: `codex/deepseek-kan-54-job-fencing` f441acf6 (JOB-02 candidate; JOB-03 planning-sequence depends on JOB-02), itself on origin/dev 65045d72
Owned files / contracts:
- `backend/upstream/backend/src/outbox/outbox-types.ts` (AdmissionLimits, ProviderBudget, JobEvent)
- `backend/upstream/backend/src/outbox/outbox-store.ts` (liveJobCounts, provider budget ledger, appendJobEvent/jobEventsAfter/jobEventsAll)
- `backend/upstream/backend/src/outbox/outbox.limits.ts` (OutboxLimits — admission check, provider budget, durable event recording/replay)
- `backend/upstream/backend/src/outbox/outbox.dispatcher.ts` (enqueue admission gate + durable events on claim/run/complete/fail/cancel)
- `backend/upstream/backend/src/outbox/index.ts`, `tsconfig.data.json`
- `backend/tests/contracts/data-jobs/admission.test.mjs` (new JOB-03 suite)
Prerequisites: JOB-01 (KAN-53) outbox dispatch; JOB-02 (KAN-54) leases/fencing/deadlines/quarantine/sweeper; DATA-01 outbox_events / command_results rows at integration.

## Requirement

Enforce per-user/workspace and fleet admission limits, queue fairness, provider budgets and retry ceilings; expose durable status/events with replay/refetch semantics. Exit: an overloaded user, workspace, provider or fleet cannot starve other workloads; a disconnected device resumes authorized committed state exactly once.

## Acceptance criteria → evidence

- Criterion: per-user admission limit — a uid with `perUserMax` live jobs refuses further enqueues (admission_per_user); other uids are unaffected.
  - Evidence: test "per-user admission: a uid with live jobs at the cap refuses the next enqueue".
- Criterion: per-workspace admission limit — a workspace at its cap refuses further enqueues for that workspace (admission_per_workspace); other workspaces admitted.
  - Evidence: test "per-workspace admission: a workspace at its cap refuses more enqueues for that workspace".
- Criterion: fleet admission limit — the fleet cap refuses enqueues for any user once reached (admission_fleet).
  - Evidence: test "fleet admission: the fleet cap refuses enqueues for any user once reached".
- Criterion: provider budgets — an exhausted provider refuses enqueues (provider_budget) and committed executions are counted.
  - Evidence: test "provider budget: an exhausted provider refuses enqueues and executions are counted".
- Criterion: queue fairness — independent workloads each keep their own queue and are admitted in order; no single queue monopolises admission.
  - Evidence: test "queue fairness: independent workloads keep their own queues without monopolising admission".
- Criterion: retry ceiling — a job failed to its ceiling is QUARANTINED, never silently dropped (reuses JOB-02 fail/quarantine).
  - Evidence: test "retry ceiling: a job failed to its ceiling is QUARANTINED, never silently dropped".
- Criterion: durable status/events with replay/refetch — enqueue/claim/run/complete append ordered JobEvents; replay(>cursor) returns exactly the later events so a second device resumes committed state without re-reading history.
  - Evidence: test "durable events: enqueue/claim/run/complete append ordered events; replay(>cursor) returns exactly later events".
- Frontend → API → backend → data → jobs/ML → device outcome:
  - Frontend: N/A in the enabler; replay/refetch status surfaces consume the durable event stream at SYNC-01 cutover.
  - API: N/A in the enabler; enqueue admission and event replay are the engine controllers call at cutover.
  - Backend: OutboxLimits + enqueue admission gate + durable JobEvent recording implemented.
  - Data: in-memory ledger for live counts/provider budget/events; Cloud SQL adapter swap at integration (outbox_events / command_results + observation rows).
  - Jobs/ML: bounded private delivery with permission/source rechecks remains; this enabler proves admission/budget/observation core.

## Commands, exit codes, test counts and timestamps

- Compile (pure modules): `tsc --project backend/upstream/backend/tsconfig.data.json --skipLibCheck` → exit 0 (2026-10-26).
- Backend build: `npm run build` (nest build) in `backend/upstream/backend` → exit 0 (2026-10-26).
- Contract tests: `node --test backend/tests/contracts/data-jobs/outbox.test.mjs backend/tests/contracts/data-jobs/jobs.test.mjs backend/tests/contracts/data-jobs/admission.test.mjs` → 24 tests, 24 pass, 0 fail (2026-10-26).
- Root check `npm run check`: 82 script tests + 35 API contract tests + 624 frontend tests, 0 fail, frontend build ✓ (2026-10-26).

## Remaining defects, limitations and linked open gates

- No live Cloud SQL/Firestore and no Nest controller/worker yet; the real adapter swap + worker wiring happen at integration cutover.
- Fleet/provider budget windows are enabler constants; real billing/provider quota plumb-through (BILL-03, provider qualification) remains.
- Durable change/run observation across all released domains (SYNC-01 KAN-139) consumes this event model once integrated.
- Hosted verification, real queue/worker provisioning and Cloud SQL remain out of scope for an enabler; hosted/load/privacy gates stay open.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (codex)
- Verification result: pending
- Dev integration commit and checks: (after review)
- Jira transition/comment receipt: KAN-55 → Testing (transition 41)
- Next dependent tasks: SYNC-01 (KAN-139) durable observation; FILE-01 (KAN-56); ACCEPT-03 release gate.
