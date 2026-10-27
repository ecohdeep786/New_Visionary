# KAN-67 — LEARN-01 — owned learning sessions, selected source/revision, checkpoints and resume cursors behind current frontend facades; preserve unsaved local recovery visibly

## Task review and verification handoff

Jira key / source ID: KAN-67 (LEARN-01)
Acceptance scope: feature-enabler (backend-owned learning-session domain; wired into the connected runtime/UI at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-67-learning-sessions`; based on the latest lane head `587d90ff` (KAN-144 CONTENT-08 concept graph), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-67-learning-sessions`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/learningsession/learning-session-types.ts` (SessionOwner, SourcePin, SessionStatus, LearningSession, Checkpoint, ResumeCursor, CommandOutcome, CheckpointResult, PreservedLocalRefusal, LearningSessionError)
- `backend/upstream/backend/src/learningsession/learning-session-lookups.ts` (LearningSessionStore + SourceRevisionLookup seams + InMemoryLearningSessionStore contract-true state)
- `backend/upstream/backend/src/learningsession/learning-session.ts` (LearningSessionService — startSession, checkpoint, completeSession, cancelSession, resume; owner-scoped, revision-fenced, idempotent)
- `backend/upstream/backend/src/learningsession/index.ts`
- `backend/upstream/backend/tsconfig.learningsession.json`
- `backend/tests/contracts/learningsession/learning-session.test.mjs` (LEARN-01 suite, 8 tests)
- `scripts/learningsession-check.mjs`, `package.json` (`learningsession:check`)
Prerequisites: parent KAN-7 (P05); DATA-03 (KAN-38 workspace provisioning) and CONTENT-04 (KAN-63 catalog adapter — completed and in Testing on this lane) are the recorded prerequisites; base is the content-lane head (KAN-63→66→144 lineage).

## Requirement

Implement owned learning sessions, selected source/revision, checkpoints and resume cursors behind current frontend facades; preserve unsaved local recovery visibly. Exit: a committed learner journey resumes correctly on another device. D-085 trace: owned learning session/checkpoint/resume commands and source-pinned concept queries behind existing facades (LearningWorkspace.jsx / learningPipelineService.ts).

## Acceptance criteria → evidence

- Criterion: a session pins an exact RELEASED source revision; unknown/unreleased revisions are refused (a journey never binds to unprovable content).
  - Evidence: test "sessions pin an exact released source revision; unknown or unreleased revisions are refused".
- Criterion: wrong user / wrong workspace denied on every operation (server-derived authority); refusals preserve the local draft visibly (`preservedLocal: true`).
  - Evidence: test "checkpoints are owner-only and commit with read-back; wrong uid and wrong workspace denied".
- Criterion: duplicate/stale command behavior — idempotency by client command id (replay converges, no duplicate rows, no double-advance) and optimistic revision fencing (stale commands refused with the committed revision returned for rebase).
  - Evidence: tests "duplicate commands are idempotent …" and "stale revisions are refused with visible local preservation and the committed revision for rebase".
- Criterion (the exit): a committed learner journey resumes correctly on ANOTHER device — the resume cursor carries the pinned selection, the latest committed payload, the committing device and the committed revision; the second device continues committing from it.
  - Evidence: test "a committed learner journey resumes correctly on ANOTHER device (the exit)".
- Criterion: privacy/authority closure — a stranger can never resume another learner's journey; unknown sessions fail closed.
  - Evidence: test "wrong user can never resume another learner's journey; unknown session fails closed".
- Criterion: cancelled/completed sessions refuse further checkpoints (local preserved visibly) while the committed cursor stays resumable; settle commands are idempotent.
  - Evidence: tests "cancelled sessions refuse later checkpoints …" and "complete is owner-only and idempotent …".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; LearningWorkspace/learningPipelineService consume session/checkpoint/resume at cutover; unsaved local recovery is surfaced by `preservedLocal`.
  - API: N/A in the enabler; session/checkpoint/resume controllers call the service at cutover with validated schema and idempotency keys.
  - Backend: LearningSessionService implements owner-scoped, revision-fenced, idempotent session commands.
  - Data: in-memory store mirrors owned sessions/checkpoints/source revisions; Cloud SQL adapter at integration resolves from owned session/checkpoint/source_revision tables (DATA-03 foundation).
  - Jobs/ML: checkpoint events flow through the owning-store outbox at cutover; no model output is committed product state.

## Commands, exit codes, test counts and timestamps

- Learning session compile + suite: `node scripts/learningsession-check.mjs` → tsc `tsconfig.learningsession.json` exit 0; `node --test` → 8 tests, 8 pass, 0 fail (2026-10-27).
- Lane regressions (unchanged base; candidate does not regress the lane): `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover (DATA-03 workspace/session tables).
- Two-device recovery here is the committed-cursor contract; hosted device-farm verification and real SSE/polling observation remain linked open gates.
- Hosted verification and production identity remain out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-67 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: LEARN-02 (KAN-68) persists checks/answers/attempts with server-side eligibility and submission dedup; the LEARN lane is sequenced KAN-67→68→69→70→72→73→74→145→147→148.
