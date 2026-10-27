# KAN-111 — PRIV-02 — authenticated bounded export/deletion jobs across Firestore, SQL, objects, provider artifacts and caches; stop new work/downloads first and verify completion/reconciliation

## Task review and verification handoff

Jira key / source ID: KAN-111 (PRIV-02)
Acceptance scope: feature-enabler (backend-owned lifecycle-job domain; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-111-privacy-export`; based on the latest lane head `b99eb31f` (KAN-110 PRIV-01 privacy core), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-111-privacy-export`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/privacyjobs/privacy-jobs-types.ts` (JobOwner, StoreKind, StoreReconciliation, JobKind, JobReceipt, PrivacyJobError)
- `backend/upstream/backend/src/privacyjobs/privacy-jobs-lookups.ts` (PrivacyJobStore seam with freeze-first + per-store declare/sweep + InMemoryPrivacyJobStore contract-true state)
- `backend/upstream/backend/src/privacyjobs/privacy-jobs-service.ts` (PrivacyLifecycleJobService — runJob with stop-first + five-store reconciliation, assertNotFrozen, inspect)
- `backend/upstream/backend/src/privacyjobs/index.ts`
- `backend/upstream/backend/tsconfig.privacyjobs.json`
- `backend/tests/contracts/privacyjobs/privacy-jobs.test.mjs` (PRIV-02 suite, 5 tests)
- `scripts/privacyjobs-check.mjs`, `package.json` (`privacyjobs:check`)
Prerequisites: parent KAN-10/PRIV family; PRIV-01 (KAN-110, in Testing on this lane) is the policy foundation the jobs enforce; the lane head is the base.

## Requirement

Implement authenticated bounded export/deletion jobs across Firestore, SQL, objects, provider artifacts and caches; stop new work/downloads first and verify completion/reconciliation. Exit: real-user data has enforceable access, lifecycle and support procedures.

## Acceptance criteria → evidence

- Criterion: STOP NEW WORK FIRST — the owner's new-work authorization freezes BEFORE any store is touched; new work while frozen refuses (`owner_frozen`); nothing escapes the sweep.
  - Evidence: test "STOP NEW WORK FIRST: the owner is frozen before any store is touched; new work while frozen refuses".
- Criterion: the job sweeps ALL FIVE stores (firestore, sql, objects, provider_artifacts, caches) with per-store reconciliation (declared vs actual).
  - Evidence: test "the job sweeps ALL FIVE stores with per-store reconciliation and completes honestly".
- Criterion: the receipt is COMPLETE only when every store reconciles; a mismatching store marks the job INCOMPLETE honestly with the store named — never a fake success.
  - Evidence: test "a mismatching store marks the job INCOMPLETE honestly with the store named — never a fake success".
- Criterion: deletion jobs run the same five-store sweep with reconciliation.
  - Evidence: test "deletion jobs sweep the same five stores with reconciliation".
- Criterion: idempotent per jobId — a retried job returns the same receipt (no duplicate sweep); wrong users cannot run or inspect another's job; unknown jobs fail closed.
  - Evidence: test "wrong users cannot run or inspect another's job; unknown jobs fail closed" plus the retry assertion in the five-store test.
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; Settings/Privacy export/delete surfaces consume the receipts at cutover.
  - API: N/A in the enabler; privacy job controllers call the service at cutover with the authenticated owner.
  - Backend: PrivacyLifecycleJobService implements stop-first, five-store sweeps, honest reconciliation.
  - Data: the five stores (Firestore, SQL, objects, provider artifacts, caches) report declared/actual counts at integration; receipts persist per jobId.
  - Jobs/ML: the freeze composes with KAN-85 service-identity revocation and KAN-91 policy revocation; caches compose with CACHE-01/AI-05 invalidation.

## Commands, exit codes, test counts and timestamps

- Privacy jobs compile + suite: `node scripts/privacyjobs-check.mjs` → tsc `tsconfig.privacyjobs.json` exit 0; `node --test` → 5 tests, 5 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `privacycore:check` (KAN-110) → 6 pass/0 fail; `scopedcache:check` (KAN-87) → 5 pass/0 fail; `benchmark:check` (KAN-83) → 4 pass/0 fail; `contextassembly:check` (KAN-149) → 8 pass/0 fail; `mlresilience:check` (KAN-91) → 4 pass/0 fail; `qualityscope:check` (KAN-138) → 6 pass/0 fail; `modalities:check` (KAN-92) → 5 pass/0 fail; `deadline:check` (KAN-90) → 6 pass/0 fail; `usagereservation:check` (KAN-89) → 6 pass/0 fail; `mlgate:check` (KAN-88) → 7 pass/0 fail; `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Firestore/Cloud SQL/object stores wired yet; the five stores' real adapters report counts at integration cutover.
- Long-running job scheduling/observability is an operations concern; this enabler owns the job contract and reconciliation.
- Hosted verification and real support-procedure drills remain open gates; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-111 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: PRIV-03..07 (consent ledger, support procedures, retention verification) continue on this head.
