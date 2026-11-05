# KAN-53 — JOB-01 — owning-store outbox dispatch, private authenticated task delivery, per-workload queues, bounded retry/backoff, crash recovery

## Task review and verification handoff

Jira key / source ID: KAN-53 (JOB-01)
Acceptance scope: enabler (owning-store outbox/job delivery domain + crash recovery; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: deepseek (senior principal backend engineer)
Reviewer: codex (senior agent) — must explicitly accept responsibility; an implementer cannot self-approve
Worker branch / candidate head: `codex/deepseek-kan-53-outbox-jobs`
Base: origin/dev 65045d72 (KAN-37 Prisma schema; generated client regenerated in this worktree before the full build)
Owned files / contracts:
- `backend/upstream/backend/src/outbox/outbox-types.ts`
- `backend/upstream/backend/src/outbox/outbox-store.ts` (contract + in-memory + crash/ack emulation)
- `backend/upstream/backend/src/outbox/outbox.dispatcher.ts` (OutboxDispatcher)
- `backend/upstream/backend/src/outbox/index.ts`
- `backend/upstream/backend/tsconfig.data.json`
- `backend/tests/contracts/data-jobs/outbox.test.mjs`
Prerequisites: DATA-01 outbox_events DDL and DATA-06 command_results/outbox as adopted at integration; owning-store durable cursor + per-workload queue routing.

## Requirement

Implement owning-store outbox dispatch, private authenticated task delivery, per-workload queues, bounded retry/backoff and recovery after commit/dispatch/ack crashes. Exit: restarts, retries and malformed files cannot lose work or bypass policy.

## Acceptance criteria → evidence

- Criterion: owning-store outbox dispatch — pending events are polled and delivered with a durable cursor.
  - Evidence: test "dispatch: pending events are delivered and acked as DONE exactly once".
- Criterion: private authenticated task delivery — a client cannot inject a queue it does not own (server-authoritative assertAuthorized); delivery is owned per uid/queue.
  - Evidence: test "per-workload queues: a client cannot inject a queue it does not own".
- Criterion: per-workload queues — jobs route to their own queue; cancel fences a stale runner.
  - Evidence: test "queues: jobs route to their per-workload queue and a cancelled job is fenced".
- Criterion: bounded retry/backoff — attempts are capped at maxAttempts with exponential backoff; a quarantined row is FAILED, never silently dropped.
  - Evidence: tests "bounded retry/backoff" (backoffDelay 100→200→400→capped 1000) and "quarantine: an event that keeps failing past maxAttempts is FAILED, never lost".
- Criterion: recovery after commit/dispatch/ack crashes — a partially-committed or ack-failed event is re-dispatched on the next poll without loss or double-commit.
  - Evidence: tests "recovery: a crash before dispatch (commit) leaves a pending row that later dispatches" and "crash recovery after ack failure: the event is re-dispatched on the next poll without loss".
- Criterion: idempotent completion — a DONE cursor is never re-dispatched (no duplicate underlying action).
  - Evidence: test "idempotent: a DONE event is not re-dispatched (no double commit)".
- Frontend → API → backend → data → jobs/ML → device outcome:
  - Frontend: N/A in the enabler; notification/sync surfaces consume the durable outbox later (SYNC-01/02, PRIV-04).
  - API: N/A in the enabler; dispatch/poll/cancel are the server engine later controllers/workers call.
  - Backend: OutboxDispatcher (dispatch/enqueue/runJob/cancel/queues) implemented.
  - Data: in-memory OutboxStore over outbox_events + job rows; Cloud SQL adapter is the integration-time swap.
  - Jobs/ML: bounded private delivery with permission recheck at worker completion stays in scope for JOB-02/03; this enabler proves dispatch/crash-safe core.

## Commands, exit codes, test counts and timestamps

- Compile (pure modules): `tsc --project backend/upstream/backend/tsconfig.data.json --typeRoots .../@types --types node --skipLibCheck` → exit 0.
- Prisma client regen (base requires it): `npx prisma generate` → exit 0 (stale-client fix on the dev base, not a KAN-53 code change).
- Full product build: `npm run build` (nest build, whole backend) → exit 0, dist/src/outbox emitted.
- Tests: `node --test backend/tests/contracts/data-jobs/outbox.test.mjs` → 8 tests, 8 pass, 0 fail (2026-10-25).
- Runtime smoke: compiled OutboxDispatcher in-process → event dispatched to DONE; job enqueued to its owned queue (2026-10-25).

## Remaining defects, limitations and linked open gates

- No live Cloud SQL/Firestore and no Nest controller/worker yet; the real adapter swap + worker wiring happen at integration cutover.
- Leases/attempt fencing, deadlines, quarantine sweeper and fleet admission limits are the JOB-02/03 scope (next tasks).
- Hosted verification, real queue/worker provisioning and Cloud SQL remain out of scope for an enabler; hosted/load/privacy gates stay open.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (codex)
- Verification result: pending
- Dev integration commit and checks: (after review)
- Jira transition/comment receipt: KAN-53 → Testing (transition 41)
- Next dependent tasks: JOB-02 (KAN-54) leases/fencing, JOB-03 (KAN-55) admission limits, then SYNC-01 (KAN-139).

## Rework 2 (2026-11-05) — review findings 10582 addressed

Reviewer blockers on 9e8dc2e5e13b356d4f5049736e7c812a8d0982d9 were reproduced
and fixed in the dispatcher/store contract:

1. Dishonest reporting: the old `ack()` swallowed a lost DONE ack and still
   returned DISPATCHED while the row stayed PENDING. Now the owning store's
   `ackOutbox` is the only DONE writer; a lost ack leaves the row durably
   DISPATCHED under a recovery lease and the poll reports DISPATCHED only
   because the row IS DISPATCHED (delivery confirmed, ack pending).
2. Attempts burned before `nextAttemptAt`: `pendingOutbox` ignored the retry
   slot. Now `claimDueOutbox(limit, now, maxAttempts, leaseMs)` performs the
   ATOMIC DUE CLAIM on the owning store (one mutation per row: due check +
   status DISPATCHED + attempts+1 + lease). A poll before `nextAttemptAt`
   returns nothing and burns no attempt; concurrent polls cannot double-claim.
3. DONE without delivery: there was no delivery handler at all. The dispatcher
   now requires a registered topic handler (or default); DONE commits only
   after the handler resolves. An event with no handler stays PENDING with
   `NO_DELIVERY_HANDLER` and a bounded retry slot. Jobs likewise never reach
   DONE without their handler (`NO_JOB_HANDLER`).

New surface: `OutboxStore.claimDueOutbox/exhaustedOutbox/ackOutbox`,
`BackoffPolicy.leaseMs`, `DispatchOutcome {cursor, status, delivered}`,
`DeliveryHandler` (idempotent per cursor — recovery re-delivers after a lost
ack and the consumer dedupes on the durable cursor).

Verification: tsc --project tsconfig.data.json exit 0; nest build exit 0;
node --test tests/contracts/data-jobs/outbox.test.mjs → 12 pass / 0 fail
(includes restart recovery after ack crash, deadline-respecting backoff,
concurrent double-dispatcher claims, batch bound, quarantine at the ceiling
and the ack-crash quarantine sweep). Reviewer probe replay (kan53-probe):
PROBE1 honest DISPATCHED=row status; PROBE2 early poll burns nothing;
PROBE3 no-handler never DONE; PROBE4 concurrent claims atomic (4/4 unique).

The Cloud SQL adapter swap and worker/controller wiring remain the declared
later, separately reviewed integration (unchanged scope boundary).
