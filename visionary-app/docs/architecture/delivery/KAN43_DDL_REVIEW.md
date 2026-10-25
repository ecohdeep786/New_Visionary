# KAN-43 — DATA-08 — prove wrong UID/workspace/role, concurrent grants/revocation, stale writes, account-switch races; bound connection pools; reconnect recovery

## Task review and verification handoff

Jira key / source ID: KAN-43 (DATA-08)
Acceptance scope: enabler (deterministic authority/race proof runner + bounded connection pool gate; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: deepseek (senior backend engineer)
Reviewer: codex (senior agent) — must explicitly accept responsibility; an implementer cannot self-approve
Worker branch / candidate head: `codex/deepseek-kan-43-concurrency`
Base: origin/dev 65045d72 (which already carries the reviewed KAN-36/37 Prisma schema incl. outbox/consent/tombstone models; generated client regenerated in this worktree before the full build)
Owned files / contracts:
- `backend/upstream/backend/src/concurrency/concurrency-types.ts`
- `backend/upstream/backend/src/concurrency/concurrency-store.ts` (ProofStore contract + in-memory + BoundedConnectionPool)
- `backend/upstream/backend/src/concurrency/concurrency.service.ts` (ConcurrencyProver)
- `backend/upstream/backend/src/concurrency/index.ts`
- `backend/upstream/backend/tsconfig.data.json`
- `backend/tests/contracts/data-08/concurrency.test.mjs`
Prerequisites: DATA-01..07 domain stores (workspace_memberships, consent_grants, share_grants, command_results) and the UID/session authority they build on. This step *proves* that authority under concurrency and bounds the runtime pool.

## Requirement

Prove wrong UID/workspace/role, concurrent grants/revocation, stale writes and account-switch races; **bound total instances x connection pools and recover cleanly after reconnect**. Exit: every domain command is server-authorized and transactionally scoped.

## Acceptance criteria → evidence

- Criterion: wrong UID is denied — a grant/revoke/share on a resource owned by another uid, or a command keyed to another account, is rejected.
  - Evidence: tests "wrong uid: a grant/revoke on another account's resource is denied", "wrong-owner share", "stale writes ... replay keyed to another uid is denied (account-switch race)".
- Criterion: wrong workspace/role is denied — no verified membership or an insufficient role cannot authorize a workspace command; preview/fixture membership is never production permission.
  - Evidence: tests "wrong workspace/role: no verified membership or insufficient role is denied", command probe with preview- uid.
- Criterion: concurrent grants/revocation cannot double-commit and cannot revive a revoked grant.
  - Evidence: tests "concurrent grant/revocation: a second grant on an active subject purpose is rejected; a revoked grant stays revoked", "pending/fingerprints: a previously-revoked grant never revives".
- Criterion: stale writes are denied — same command key with a changed payload, or a duplicate commit, is rejected.
  - Evidence: tests "stale writes: same command key with changed payload is rejected".
- Criterion: bounded total instances x connection pools — the fleet-wide active connection count never exceeds `totalAllowed`.
  - Evidence: test "bounded pool: total connections cannot exceed the fleet-wide limit across instances".
- Criterion: clean recovery after reconnect — a dropped connection is retired and a fresh acquire succeeds, keeping the pool within bounds.
  - Evidence: test "clean reconnect recovery: a dropped connection is retired and a fresh acquire succeeds".
- Frontend → API → backend → data → jobs/ML → device outcome:
  - Frontend: N/A (enabler; no frontend ride).
  - API: N/A in the enabler; the prover and pool gate are the server-authority engine later controllers/adapters call.
  - Backend: ConcurrencyProver + BoundedConnectionPool (implemented).
  - Data: in-memory ProofStore emulates the owning store; Cloud SQL adapter (Prisma over DATA-01 rows) is the integration-time swap.
  - Jobs/ML: pool bound prevents unbounded worker connections; session/account-switch guard protects replayed jobs.

## Commands, exit codes, test counts and timestamps

- Compile (pure modules): `tsc --project backend/upstream/backend/tsconfig.data.json --typeRoots .../@types --types node --skipLibCheck` → exit 0.
- Prisma client regen (base requires it): `npx prisma generate` → exit 0 (needed because origin/dev 65045d72 merged KAN-37 repositories whose models are in the schema; the stale shared client rejected them — regenerating is the base fix, not a KAN-43 change).
- Full product build: `npm run build` (nest build, whole backend) → exit 0, dist/src/concurrency emitted.
- Tests: `node --test backend/tests/contracts/data-08/concurrency.test.mjs` → 9 tests, 9 pass, 0 fail (2026-10-25).
- Runtime smoke: compiled ConcurrencyProver + BoundedConnectionPool in-process → wrong-owner denied (`denied_wrong_owner`), pool active=1 / closed=1 after reconnect (2026-10-25).

## Remaining defects, limitations and linked open gates

- No live Cloud SQL/Firestore and no Nest controller yet; the prover/pool is an enabler and the real adapter swap happens at integration cutover.
- The fleet pool here is process-local; a real fleet across Cloud Run instances needs the shared (Redis/DB-backed) pool gate at PLAT/TEST integration.
- Hosted verification and Cloud SQL provisioning remain out of scope for an enabler; hosted/load/privacy gates stay open.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (codex)
- Verification result: pending
- Dev integration commit and checks: (after review)
- Jira transition/comment receipt: KAN-43 → Testing (transition 41)
- Next dependent task: DATA-09 (KAN-44) age/admission and guardian-first workflows.
