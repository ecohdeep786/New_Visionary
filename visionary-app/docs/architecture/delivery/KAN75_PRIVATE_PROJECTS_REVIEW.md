# KAN-75 — BUILD-01 — private projects, immutable revisions/manifests, conditional draft saves, history and restore-as-new-revision with actor/workspace ownership

## Task review and verification handoff

Jira key / source ID: KAN-75 (BUILD-01)
Acceptance scope: feature-enabler (backend-owned private Build project domain; wired into the connected runtime/UI at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-75-private-projects`; based on the latest lane head `4845d387` (KAN-74 LEARN-08 evaluation), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-75-private-projects`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/projects/project-types.ts` (ProjectOwner, RevisionManifest, ProjectRevision, BuildProject, SaveResult, SaveRefusal, ProjectError)
- `backend/upstream/backend/src/projects/project-lookups.ts` (ProjectStore seam + InMemoryProjectStore contract-true append-only state)
- `backend/upstream/backend/src/projects/project-service.ts` (PrivateProjectService — createProject, conditional saveDraft, history, restore-as-new-revision, verifyManifest)
- `backend/upstream/backend/src/projects/index.ts`
- `backend/upstream/backend/tsconfig.projects.json`
- `backend/tests/contracts/projects/private-projects.test.mjs` (BUILD-01 suite, 5 tests)
- `scripts/projects-check.mjs`, `package.json` (`projects:check`)
Prerequisites: parent KAN-8 (P06); phase prerequisites P01/P03/P05 — the lane head (CONTENT+LEARN lineage) is the base. BUILD-01 blocks BUILD-04 (KAN-78) durable runs.

## Requirement

Implement private projects, immutable revisions/manifests, conditional draft saves, history and restore-as-new-revision with actor/workspace ownership. Exit: current-document Build is server-backed without weakening existing privacy/recovery rules. D-085 trace: private projects, conditional revisions, durable runs, proposal acceptance and explicit distribution.

## Acceptance criteria → evidence

- Criterion: projects are PRIVATE with actor/workspace ownership — wrong uid and wrong workspace denied before anything persists (saves and history reads).
  - Evidence: test "projects are private and owner-scoped: wrong uid and wrong workspace denied before anything persists".
- Criterion: conditional draft saves — a save applies only against the expected base revision; a stale base is refused with the local draft preserved visibly and the current revision returned for rebase; the rebased save commits.
  - Evidence: test "conditional draft saves: revision-fenced; stale base refused with visible preservation and rebase revision".
- Criterion: revisions are IMMUTABLE with SHA-256 manifests — history is append-only and byte-stable across later saves; a tampered payload is detected by re-digesting.
  - Evidence: test "revisions are immutable with SHA-256 manifests; history is append-only and byte-stable; tampering detectable".
- Criterion: duplicate saves are idempotent by client save id — the same committed revision is returned, no duplicate row.
  - Evidence: test "duplicate saves are idempotent by save id: same revision returned, no duplicate row".
- Criterion: RESTORE-AS-NEW-REVISION — restoring an earlier revision appends a new revision whose manifest records `restoredFrom`; prior history is byte-stable; the restored content matches the source; an unknown revision is refused.
  - Evidence: test "restore-as-new-revision: restoring an earlier revision appends a NEW revision recording restoredFrom; history never rewrites".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; ArtifactStudio current-document Build consumes the project service at cutover; `preservedLocal` surfaces draft recovery.
  - API: N/A in the enabler; project controllers call the service at cutover with validated schema and save-id idempotency.
  - Backend: PrivateProjectService implements owner-scoped conditional saves with immutable manifests.
  - Data: in-memory store mirrors private projects/revisions/manifests; Cloud SQL adapter at integration resolves from private project/revision/manifest tables.
  - Jobs/ML: guided creation/critique proposals (AI lane) bind to these revisions at cutover; a generated draft is not committed product state until saved here.

## Commands, exit codes, test counts and timestamps

- Private projects compile + suite: `node scripts/projects-check.mjs` → tsc `tsconfig.projects.json` exit 0; `node --test` → 5 tests, 5 pass, 0 fail (2026-10-27).
- Lane regressions (unchanged base; candidate does not regress the lane): `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Artifact binary/object storage binds through the FILE lane manifests at integration; this enabler owns revision/manifest contracts.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-75 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: BUILD-02 (KAN-76) per-tab original-base draft recovery/conflict resolution (no open blockers); BUILD-04 (KAN-78) waits on BUILD-01; BUILD-03 (KAN-77) waits on LEARN-08 (in Testing on this lane).
