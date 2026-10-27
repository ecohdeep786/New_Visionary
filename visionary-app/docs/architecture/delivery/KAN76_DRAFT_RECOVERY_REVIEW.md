# KAN-76 — BUILD-02 — per-tab original-base draft recovery and compare/resolve conflicts; import local originals only through reviewed ownership mapping, idempotent transfer and count/digest verification

## Task review and verification handoff

Jira key / source ID: KAN-76 (BUILD-02)
Acceptance scope: feature-enabler (backend-owned draft recovery + reviewed import domain; wired into the connected runtime/UI at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-76-draft-recovery`; based on the latest lane head `0619f41c` (KAN-75 BUILD-01 private projects), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-76-draft-recovery`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/draftrecovery/draft-recovery-types.ts` (RecoveryOwner, TabDraft, DraftConflict, ConflictResolution, OwnershipMapping, ImportBatch, ImportResult, DraftRecoveryError)
- `backend/upstream/backend/src/draftrecovery/draft-recovery-lookups.ts` (DraftRecoveryStore seam + InMemoryDraftRecoveryStore contract-true append-only state)
- `backend/upstream/backend/src/draftrecovery/draft-recovery.ts` (DraftRecoveryService — registerTabDraft, recoverDraft, saveFromTab, resolveConflict, recordOwnershipMapping, importOriginals with count/digest verification)
- `backend/upstream/backend/src/draftrecovery/index.ts`
- `backend/upstream/backend/tsconfig.draftrecovery.json`
- `backend/tests/contracts/draftrecovery/draft-recovery.test.mjs` (BUILD-02 suite, 6 tests)
- `scripts/draftrecovery-check.mjs`, `package.json` (`draftrecovery:check`)
Prerequisites: parent KAN-8 (P06); BUILD-01 (KAN-75, in Testing on this lane) is the revision/manifest foundation; local originals retained until reviewed migration — the import path is the reviewed migration seam.

## Requirement

Preserve per-tab original-base draft recovery and compare/resolve conflicts. Import local originals only through reviewed ownership mapping, idempotent transfer and count/digest verification. Exit: current-document Build is server-backed without weakening existing privacy/recovery rules.

## Acceptance criteria → evidence

- Criterion: per-tab original-base draft recovery — a tab's unsaved draft registers against an explicit base revision and recovers byte-exactly by (project, tab); owner-scoped; unknown tab fails closed.
  - Evidence: test "per-tab drafts recover byte-exactly; owner-scoped; unknown tab fails closed".
- Criterion: compare/resolve conflicts — the first tab from a base commits; a tab whose base was overtaken receives an explicit conflict carrying BOTH payloads (server + tab) for comparison.
  - Evidence: test "two tabs from the same base: first save commits; second gets an explicit conflict with BOTH payloads".
- Criterion: resolution is deliberate ('server' | 'tab' | 'merged'), appends a NEW revision with resolution provenance, cannot resolve twice, and history is append-only across resolutions (never rewritten).
  - Evidence: test "resolution is deliberate (server/tab/merged), appends a new revision with provenance, cannot resolve twice".
- Criterion: local originals import ONLY through a reviewed ownership mapping bound to this owner — an unreviewed or foreign-owned mapping is refused.
  - Evidence: test "local originals import ONLY through a reviewed ownership mapping bound to this owner".
- Criterion: idempotent transfer — a retried import converges to the same result with no duplicate originals.
  - Evidence: test "transfer is idempotent by import id: retried import converges with no duplicate originals".
- Criterion: count/digest verification — every batch is verified by declared count AND SHA-256 digest before anything is accepted; mismatches refuse.
  - Evidence: test "every batch is verified by declared count AND digest before acceptance".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; ArtifactStudio per-tab editing surfaces consume register/recover/resolve at cutover; conflicts render both payloads side by side.
  - API: N/A in the enabler; recovery/import controllers call the service at cutover with validated schema and import-id idempotency.
  - Backend: DraftRecoveryService implements per-tab recovery, explicit conflicts, deliberate resolution, reviewed imports.
  - Data: in-memory store mirrors tab drafts/conflicts/resolutions/mappings/imports; Cloud SQL adapter at integration resolves from tab_draft/conflict/resolution/mapping tables.
  - Jobs/ML: import verification events flow through the owning-store outbox at cutover; no unreviewed local original ever enters server state.

## Commands, exit codes, test counts and timestamps

- Draft recovery compile + suite: `node scripts/draftrecovery-check.mjs` → tsc `tsconfig.draftrecovery.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-27).
- Lane regressions (unchanged base; candidate does not regress the lane): `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Ownership-mapping review records come from the review workflow at integration; this enabler enforces that the mapping exists, is reviewed, and belongs to the importer.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-76 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: BUILD-04 (KAN-78) durable runs waits on BUILD-01 (in Testing on this lane); the next eligible task is selected from live Jira before assignment.
