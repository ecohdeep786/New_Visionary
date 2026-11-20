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

## Integration candidate — 2026-11-20

The original branch incorporates the delivery and atomic claim changes from
`2c934257`. The store compares the current attempt on every settlement.
A delayed failure cannot reopen an event completed by a newer worker. If the
store write returns an error, the dispatcher reads the current state before
reporting the outcome. Each poll bounds the sum of quarantines and deliveries.

The original and rework branches passed 10 and 12 focused tests respectively.
The combined implementation passed 16. The new tests cover stale settlement,
an acknowledgement response lost after commit, concurrent job claims, and
completion after cancellation. Job claims, settlement, and cancellation are
atomic in the store. The standard backend data check now runs this suite.

### Durable consent delivery

Migration 7 adds a delivery ledger keyed by the existing PostgreSQL outbox
cursor. The revocation write and source event still commit together in the
workspace repository. The dispatcher reads committed `consent.revoked` events
above an explicit replay checkpoint and leaves other topics and the source
event untouched. Use zero to replay all eligible events. Establish a nonzero
checkpoint only after writers are quiescent and earlier events are reconciled.
The ledger keeps the lease, retry time and attempt through process restarts.

The Cloud Run dispatcher uses its runtime access token to admit tasks to
`visionary-consent-staging` or `visionary-consent-production` in Mumbai.
Each task sends a decimal cursor and attempt to
`/internal/outbox/consent-revocations` using the queue environment's dedicated
OIDC invoker. Task names are deterministic per event and attempt. Successful
admission or an existing task leaves the delivery leased until the receiver
commits a receipt or the lease expires. The receiver checks the Google
signature, Cloud Run audience and configured service account subject. It locks
the delivery row, checks the lease against the database clock, reads the
committed event and validates it against the revoked grant. It cancels only
pending jobs bound to that grant and writes the completion receipt in the
same transaction. An authenticated replay returns HTTP 204 from that receipt.

The job repository admits downloads and model-context requests against
separate workload queues. It binds each job to the exact authorized grant
under the same account lock used by revocation. Hosted workload execution,
and cache invalidation require their own evidence.

The product image compiles a separate process. Deploy the private receiver
with command `node` and arguments `dist/src/outbox/main-consent-outbox.js,receive`.
Run the dispatcher as a separate, bounded job using the same command with
`dispatch`. Configure explicit staging or production SQL socket, database,
schema, and non-privileged workload-specific role under `OUTBOX_*`. The
dispatcher uses `OUTBOX_INVOKER_SERVICE_ACCOUNT` for the environment's
`visionary-outbox-invoke-stg` or `visionary-outbox-invoke-prod` account.
Grant the dispatcher task creation on its queue and actAs on that account.
Grant the invoker Cloud Run invocation only on its environment's receiver,
and configure the account's numeric subject as `OUTBOX_CALLER_SUBJECT` there.
Keep the queue and receiver retry window bounded by the 90-second database
lease. Each dispatch job claims at most five events. Rotate SQL credentials
through the existing pinned Secret Manager path. Give the receiver and
dispatcher only the SQL privileges required by their respective statements.
The migration identity and credentials belong only to the migration job.

The PostgreSQL and loopback HTTP tests exercise the receiver using a synthetic
consent grant, Cloud Tasks API responses, and substitute caller verification.
Hosted migration requires an exact staging receipt. Verify the private
Cloud Run invocation policy, deployed authentication, queue trigger, and
recovery before applying this path to production traffic.
