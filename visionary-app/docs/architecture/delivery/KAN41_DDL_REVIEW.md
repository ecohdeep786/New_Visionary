# KAN-41 — DATA-06 — scoped command results, conditional revisions, trusted timestamps, unique constraints, transactional outbox, deletion tombstones

## Task review and verification handoff

Jira key / source ID: KAN-41 (DATA-06)
Acceptance scope: enabler (command/outbox/tombstone domain + contract store; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: deepseek (senior backend engineer)
Reviewer: codex (senior agent) — must explicitly accept responsibility; an implementer cannot self-approve
Worker branch / candidate head: `codex/deepseek-kan-41-data-commands`
Owned files / contracts:
- `backend/upstream/backend/src/commands/command-types.ts`
- `backend/upstream/backend/src/commands/command-store.ts` (contract + in-memory + unique-constraint + transactional-commit emulation)
- `backend/upstream/backend/src/commands/command.service.ts`
- `backend/upstream/backend/src/commands/index.ts`
- `backend/upstream/backend/tsconfig.data.json`
- `backend/tests/contracts/data-06/commands.test.mjs`
Prerequisites: DATA-01 command_results / outbox_events / deletion_tombstones / audit_events DDL as adopted at integration (KAN-36); DATA-03/04/05 domain commands feed this execution layer.

## Requirement

Add scoped command results, conditional revisions, trusted timestamps, unique constraints, transactional outbox and deletion tombstones; **reject same command key with a changed payload**. Exit: every domain command is server-authorized and transactionally scoped.

## Acceptance criteria → evidence

- Criterion: command results are scoped to the verified uid (and optional workspace); a client cannot attach a foreign scope or replay another account's command.
  - Evidence: tests "commits a scoped command result with a server trusted timestamp and outbox event", "a command belonging to another account cannot be replayed".
- Criterion: unique constraints — a command key committed once cannot be recreated; replaying the same key + identical payload returns the prior result with no new row.
  - Evidence: tests "the same command key + identical payload replays, no new row", "same command key with a changed payload is rejected (CONFLICT)".
- Criterion: conditional revisions — `expectedRevision` is compared to the store's max revision for uid+kind; a mismatch rejects as stale and matching expectedRevision commits the next revision.
  - Evidence: test "a stale expectedRevision is rejected, matching expectedRevision commits".
- Criterion: trusted timestamps — attemptedAt/committedAt/createdAt are the server clock only; the client payload can never supply them.
  - Evidence: test "commits a scoped command result with a server trusted timestamp" (committedAt fixed to injected clock).
- Criterion: transactional outbox — a command result and its outbox event commit (or roll back) together; a failed outbox append rolls back the result, then a retry recovers exactly once.
  - Evidence: tests "an outbox append failure rolls back the command result", "outbox dispatch: pending events dispatch in cursor order, bounded".
- Criterion: deletion tombstones — a deleted resource cannot be recreated while its tombstone is active; after tombstone expiry recreation is allowed again.
  - Evidence: tests "a deleted resource cannot be recreated until the tombstone expires", "after the tombstone expires recreation is allowed again".
- Criterion: invalid input (blank/bad commandId, bad kind, non-object payload) never commits anything.
  - Evidence: test "invalid command input never commits".
- Frontend → API → backend → data → jobs/ML → device outcome:
  - Frontend: N/A (no frontend ride in this enabler).
  - API: N/A in the enabler; the command execution layer is the server-authority engine that later controllers/adapters call.
  - Backend: command/outbox/audit/tombstone execution + lifecycle service (implemented).
  - Data: in-memory contract store; Cloud SQL adapter (Prisma over command_results/outbox_events/deletion_tombstones) is the integration-time swap.
  - Jobs/ML: durable outbox events are the owning-store delivery primitive consumed by job/stage workers at integration (SYNC/JOB-01..03).
  - Device: N/A (no device outcome before two-device capacities are wired).

## Commands, exit codes, test counts and timestamps

- Compile (pure modules): `tsc --project backend/upstream/backend/tsconfig.data.json --typeRoots backend/upstream/backend/node_modules/@types --types node --skipLibCheck` → exit 0.
- Tests: `node --test backend/tests/contracts/data-06/commands.test.mjs` → 10 tests, 10 pass, 0 fail (2026-10-25).
- Companion contract suites (prerequisites): data-03 (10/10), data-04 (9/9), data-05 (11/11) all pass.

## Remaining defects, limitations and linked open gates

- No NestJS controller/module and no Cloud SQL adapter in this enabler; wiring + Prisma adapter swap and controller cutover are later, separately reviewed integration (DATA-07/08 and SYNC/JOB work).
- No hosted Firestore/Cloud SQL write in this step; the in-memory store stands in for the real transactional store; real wiring is later integration work.
- Live hosted verification and Cloud SQL provisioning remain out of scope for an enabler and budget-guarded; hosted/load/privacy gates stay open.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (codex)
- Verification result: pending
- Dev integration commit and checks: (after review)
- Jira transition/comment receipt: KAN-41 → Testing (transition 41)
- Next dependent task: DATA-07 (KAN-42) repository/DTO projections, then DATA-08 race/authority enforcement.
