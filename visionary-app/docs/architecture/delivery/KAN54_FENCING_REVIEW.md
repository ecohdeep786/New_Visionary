# KAN-54 — JOB-02 — leases, attempt fencing, idempotent completion, deadlines, cancellation, quarantine of failed cleanup and a sweeper for orphaned/stuck work

## Task review and verification handoff

Jira key / source ID: KAN-54 (JOB-02)
Acceptance scope: enabler (lease/fencing/sweeper domain on top of the JOB-01 outbox/job enabler; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: deepseek (senior principal backend engineer)
Reviewer: codex (senior agent) — must explicitly accept responsibility; an implementer cannot self-approve
Worker branch / candidate head: `codex/deepseek-kan-54-job-fencing`
Base: `codex/deepseek-kan-53-outbox-jobs` 9e8dc2e5 (KAN-53 candidate; JOB-02 planning-sequence depends on JOB-01), which itself is based on origin/dev 65045d72
Owned files / contracts:
- `backend/upstream/backend/src/outbox/outbox-types.ts` (JobState + Job fields: leaseToken, attemptToken, cleanupAttempts, cleanupError, runBy, nextAttemptAt; DEFAULT_LEASE)
- `backend/upstream/backend/src/outbox/outbox-store.ts` (contract + in-memory + atomic `transition` — the single fencing point)
- `backend/upstream/backend/src/outbox/outbox.dispatcher.ts` (claim/startRun/heartbeat/complete/fail/cancel/failCleanup)
- `backend/upstream/backend/src/outbox/outbox.sweeper.ts` (OutboxSweeper — reclaim + deadline + quarantine)
- `backend/upstream/backend/src/outbox/index.ts`
- `backend/upstream/backend/tsconfig.data.json`
- `backend/tests/contracts/data-jobs/jobs.test.mjs` (new JOB-02 suite)
- `backend/tests/contracts/data-jobs/outbox.test.mjs` (updated cancelled-job fencing to lease API)
Prerequisites: JOB-01 (KAN-53) outbox dispatch; DATA-01 outbox_events / command_results rows at integration.

## Requirement

Add leases, attempt fencing, idempotent completion, deadlines, cancellation, quarantine of failed cleanup and a sweeper for orphaned/stuck work. Exit: restarts, retries and malformed files cannot lose work or bypass policy; stuck/crashed runners cannot mutate jobs they no longer own.

## Acceptance criteria → evidence

- Criterion: leases — `claim` mints lease + attempt tokens and sets `claimedUntil`; `heartbeat` extends a lease while progress continues.
  - Evidence: tests "claim: a job is claimed with a lease token and the same holder can run+complete it" and "heartbeat extends a lease so a progressing job is not reclaimed".
- Criterion: attempt fencing — a stale runner whose lease/attempt token no longer matches is refused; a reclaimed or cancelled job is never completed by a zombie.
  - Evidence: tests "attempt fencing: a stale lease holder cannot start/complete after the token changed" and "a stale worker holding an old token cannot complete after cancel".
- Criterion: idempotent completion — a job already DONE stays DONE; a duplicate ack/complete never re-executes; a fresh claim on a DONE job conflicts.
  - Evidence: test "idempotent completion: a DONE job stays DONE and a second complete is a no-op".
- Criterion: deadlines — a job past `runBy` is failed by the sweeper (never run late), and a subsequent claim conflicts.
  - Evidence: test "deadline: a job past runBy is failed by the sweeper, never run late".
- Criterion: cancellation — `cancel` fences CLAIMED/RUNNING holders at the store; the cancelled state never runs/completes.
  - Evidence: tests "a stale worker holding an old token cannot complete after cancel" and JOB-01 "cancelled job is fenced" (updated to the lease API).
- Criterion: quarantine of failed cleanup — post-run cleanup is retried up to `maxCleanupAttempts`; past the ceiling it is QUARANTINED, never silently dropped.
  - Evidence: test "quarantine of failed cleanup: bounded retries then QUARANTINED, never silently dropped".
- Criterion: sweeper for orphaned/stuck work — expired leases are reclaimed to PENDING (with the old token fenced) or QUARANTINED past the ceiling; deadlines are enforced.
  - Evidence: tests "sweeper: expired lease reclaim requeues for a fresh claim; bogus token is fenced" and "sweeper: stale work past the attempt ceiling is QUARANTINED, never lost".
- Frontend → API → backend → data → jobs/ML → device outcome:
  - Frontend: N/A in the enabler; status/events surfaces consume the durable outbox later (SYNC-01/02, PRIV-04).
  - API: N/A in the enabler; claim/heartbeat/complete/cancel/sweep are the engine controllers/workers call at cutover.
  - Backend: OutboxDispatcher + OutboxSweeper implemented; single fencing enforcement point is `store.transition`.
  - Data: in-memory OutboxStore with `transition` (lease token + state guard); Cloud SQL adapter swap at integration.
  - Jobs/ML: bounded private delivery with permission recheck stays in scope for JOB-03 (fleet admission/budgets) and SYNC-01 (observation); this enabler proves lease/fencing/sweep core.

## Commands, exit codes, test counts and timestamps

- Compile (pure modules): `tsc --project backend/upstream/backend/tsconfig.data.json --skipLibCheck` → exit 0 (2026-10-25).
- Backend build: `npm run build` (nest build) in `backend/upstream/backend` → exit 0; dist/src/outbox includes `outbox.sweeper.js` (2026-10-25).
- JOB-01 + JOB-02 contract tests: `node --test backend/tests/contracts/data-jobs/outbox.test.mjs backend/tests/contracts/data-jobs/jobs.test.mjs` → 17 tests, 17 pass, 0 fail (2026-10-25).
- Root check `npm run check` (layout + imports + continuity + script tests + API contracts + frontend lint/typecheck/test/build): pass totals — 82 script tests, 35 API contract tests, 624 frontend tests, 0 fail, frontend build ✓ (2026-10-25).

## Remaining defects, limitations and linked open gates

- No live Cloud SQL/Firestore and no Nest controller/worker yet; the real adapter swap + worker wiring happen at integration cutover.
- Fleet/per-user admission limits, queue fairness, provider budgets and retry ceilings are JOB-03 (KAN-55) scope.
- Durable change/run observation (SYNC-01 KAN-139) consumes this outbox once integrated.
- Hosted verification, real queue/worker provisioning and Cloud SQL remain out of scope for an enabler; hosted/load/privacy gates stay open.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (codex)
- Verification result: pending
- Dev integration commit and checks: (after review)
- Jira transition/comment receipt: KAN-54 → Testing (transition 41)
- Next dependent tasks: JOB-03 (KAN-55) admission limits, FILE-01 (KAN-56), SYNC-01 (KAN-139).
