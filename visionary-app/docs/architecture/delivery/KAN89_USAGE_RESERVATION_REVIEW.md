# KAN-89 — AI-07 — atomic usage reservation, bounded context/tokens/tool loops/attempts, measured usage ledger, terminal settlement and ambiguous-timeout reconciliation without duplicate user debit

## Task review and verification handoff

Jira key / source ID: KAN-89 (AI-07)
Acceptance scope: feature-enabler (backend-owned usage/entitlement settlement domain; wired into the connected ML/runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-89-usage-reservation`; based on the latest lane head `825b899b` (KAN-88 AI-06 ML output gate), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-89-usage-reservation`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/usagereservation/usage-reservation-types.ts` (UsageOwner, UsageBounds, UsageReservation, UsageLedgerEntry, SettleResult, UsageError)
- `backend/upstream/backend/src/usagereservation/usage-reservation-lookups.ts` (UsageStore seam with ATOMIC tryReserve critical section + InMemoryUsageStore contract-true state, append-only ledger)
- `backend/upstream/backend/src/usagereservation/usage-reservation.ts` (UsageReservationService — reserve, ensureWithinBound, settle with ambiguous-timeout idempotency)
- `backend/upstream/backend/src/usagereservation/index.ts`
- `backend/upstream/backend/tsconfig.usagereservation.json`
- `backend/tests/contracts/usagereservation/usage-reservation.test.mjs` (AI-07 suite, 6 tests)
- `scripts/usagereservation-check.mjs`, `package.json` (`usagereservation:check`)
Prerequisites: parent KAN-9; the lane head (CONTENT+LEARN+BUILD+AI-02/03/04/06 lineage) is the base. The ML runtime settles through this service at cutover; the billing lane consumes measured ledger entries.

## Requirement

Implement atomic usage reservation, bounded context/tokens/tool loops/attempts, measured usage ledger, terminal settlement and ambiguous-timeout reconciliation without duplicate user debit. Exit: evaluated, authorized assistance with bounded costs and no cross-user leakage.

## Acceptance criteria → evidence

- Criterion: reservation is ATOMIC — the quota check and deduction happen in one critical section; over-quota refuses (`insufficient_quota`); two concurrent reservations racing for the last unit resolve to exactly one granted and one refused, with no double deduction.
  - Evidence: test "reservation is ATOMIC: over-quota refuses; two concurrent reservations of the last unit — exactly one succeeds".
- Criterion: bounds enforced BEFORE any spend — tokens over the cap, tool loops beyond `maxToolLoops`, and attempts beyond `maxAttempts` all refuse with `bound_exceeded` and no deduction.
  - Evidence: test "bounds enforced BEFORE any spend: tokens, tool loops, attempts refuse with bound_exceeded".
- Criterion: settlement is TERMINAL and idempotent — an ambiguous-timeout retry of the same settle converges to `duplicate` and NEVER debits twice (balance verified unchanged after the retry).
  - Evidence: test "settlement is TERMINAL and idempotent: an ambiguous-timeout retry NEVER debits twice".
- Criterion: the ledger is MEASURED and append-only — reserved/settled/released entries carry exact amounts verbatim; earlier entries stay byte-stable after later appends.
  - Evidence: test "the ledger is MEASURED and append-only: reserved/settled/released entries with exact amounts".
- Criterion: no cross-user leakage — another user's quota balance and ledger are untouched by this owner's reservations and settlements.
  - Evidence: test "no cross-user leakage: another user's quota and ledger are untouched by this owner's activity".
- Criterion: wrong-user and unknown-reservation settles fail closed; a fully unused reservation releases the entire reservation without charge.
  - Evidence: test "wrong-user and unknown-reservation settles fail closed; unused reservations release fully".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; Plans/Subscription surfaces consume measured usage at cutover.
  - API: N/A in the enabler; ML runtime reserves before each model call and settles after at cutover.
  - Backend: UsageReservationService implements atomic reservation, bounded execution, terminal idempotent settlement.
  - Data: in-memory store mirrors quota balances/reservations/ledger; Cloud SQL adapter mirrors the critical section with a transaction at integration.
  - Jobs/ML: the ML lane (ml/upstream) binds every provider call to a reservation at cutover; the billing lane (Razorpay test billing) consumes measured ledger entries — estimates never bill.

## Commands, exit codes, test counts and timestamps

- Usage reservation compile + suite: `node scripts/usagereservation-check.mjs` → tsc `tsconfig.usagereservation.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `mlgate:check` (KAN-88) → 7 pass/0 fail; `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; the SQL adapter mirrors the in-memory critical section with a transaction at integration cutover.
- AI-08 (KAN-90) composes deadline/cancellation reconciliation on top of this settlement; hosted usage verification and live billing remain open gates.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-89 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: AI-08 (KAN-90) deadline/cancellation reconciliation with provider work; the AI lane continues AI-07→08→10→12.
