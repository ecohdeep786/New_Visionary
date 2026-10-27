# KAN-112 — PRIV-03 — test restore against deletion/consent tombstones and current policy, so backup recovery cannot revive prohibited access or erased derived records

## Task review and verification handoff

Jira key / source ID: KAN-112 (PRIV-03)
Acceptance scope: feature-enabler (backend-owned tombstone-aware restore domain; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-112-consent-ledger`; based on the latest lane head `d73c954a` (KAN-111 PRIV-02 lifecycle jobs), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-112-consent-ledger`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/restoretombstone/restore-tombstone-types.ts` (RestoreOwner, Tombstone, BackupRecord, RestoreReceipt, RestoreError)
- `backend/upstream/backend/src/restoretombstone/restore-tombstone-lookups.ts` (RestoreStore seam with tombstones + current-policy permitted fields + derived classes + InMemoryRestoreStore contract-true state)
- `backend/upstream/backend/src/restoretombstone/restore-tombstone-service.ts` (RestoreTombstoneService — restore with the tombstone/consent/current-policy/derived/raw-text drop order and an honest receipt)
- `backend/upstream/backend/src/restoretombstone/index.ts`
- `backend/upstream/backend/tsconfig.restoretombstone.json`
- `backend/tests/contracts/restoretombstone/restore-tombstone.test.mjs` (PRIV-03 suite, 6 tests)
- `scripts/restoretombstone-check.mjs`, `package.json` (`restoretombstone:check`)
Prerequisites: parent KAN-10/PRIV family; PRIV-01 (policy) and PRIV-02 (lifecycle jobs, in Testing on this lane) are the foundations the restore composes; the lane head is the base.

## Requirement

Test restore against deletion/consent tombstones and current policy, so backup recovery cannot revive prohibited access or erased derived records. Exit: real-user data has enforceable access, lifecycle and support procedures.

## Acceptance criteria → evidence

- Criterion: DELETION TOMBSTONES WIN — a record the owner erased is dropped on restore (never resurrected); the store shows no resurrection.
  - Evidence: test "DELETION TOMBSTONES WIN: erased records are dropped on restore — never resurrected".
- Criterion: CONSENT TOMBSTONES WIN — learning-data records for a consent-revoked learner are dropped; a non-guarded class still restores.
  - Evidence: test "CONSENT TOMBSTONES WIN: learning-data records for a consent-revoked learner are dropped".
- Criterion: CURRENT POLICY WINS — a record carrying a field the current policy no longer permits is dropped (the backup-era policy does not survive recovery).
  - Evidence: test "CURRENT POLICY WINS: a record carrying a now-forbidden field is dropped (backup-era policy does not survive)".
- Criterion: DERIVED records are never revived — erased caches/artifacts stay erased; derived state regenerates under current policy.
  - Evidence: test "DERIVED records are never revived: erased caches/artifacts stay erased".
- Criterion: raw private text inside a backup record refuses that record (`raw_private_text` drop reason).
  - Evidence: test "raw private text inside a backup record refuses that record".
- Criterion: the receipt is HONEST — per-drop reasons and counts; clean records restore fully; a mixed backup restores exactly the survivors.
  - Evidence: test "the receipt is honest: per-drop reasons and counts; clean backups restore fully".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; support/restore surfaces consume the receipt at cutover.
  - API: N/A in the enabler; restore controllers call the service at cutover with the authenticated owner.
  - Backend: RestoreTombstoneService implements the tombstone/consent/policy/derived drop order.
  - Data: tombstones outlive backups (separate tombstone tables); the current policy is PRIV-01's shipped policy.
  - Jobs/ML: restore composes with PRIV-02 lifecycle jobs and PRIV-01 erasure; derived caches regenerate through CACHE-01/AI-05 after restore.

## Commands, exit codes, test counts and timestamps

- Restore compile + suite: `node scripts/restoretombstone-check.mjs` → tsc `tsconfig.restoretombstone.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `privacyjobs:check` (KAN-111) → 5 pass/0 fail; `privacycore:check` (KAN-110) → 6 pass/0 fail; `scopedcache:check` (KAN-87) → 5 pass/0 fail; `benchmark:check` (KAN-83) → 4 pass/0 fail; `contextassembly:check` (KAN-149) → 8 pass/0 fail; `mlresilience:check` (KAN-91) → 4 pass/0 fail; `qualityscope:check` (KAN-138) → 6 pass/0 fail; `modalities:check` (KAN-92) → 5 pass/0 fail; `deadline:check` (KAN-90) → 6 pass/0 fail; `usagereservation:check` (KAN-89) → 6 pass/0 fail; `mlgate:check` (KAN-88) → 7 pass/0 fail; `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live backup/restore infrastructure wired yet; the real backup store adapter reports records at integration cutover.
- Hosted restore drills (real backups, real tombstones) remain open gates; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-112 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: PRIV-04..07 continue on this head.
