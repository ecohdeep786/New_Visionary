# KAN-73 — LEARN-07 — verify concept → check/practice → private project → save → second-device resume, including source withdrawal, concurrent edits, failed saves and session expiry

## Task review and verification handoff

Jira key / source ID: KAN-73 (LEARN-07)
Acceptance scope: feature-enabler (composed server-owned learner-journey contract; wired into the connected runtime/UI at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-73-journey-verify`; based on the latest lane head `ae4306e2` (KAN-70 LEARN-04 daily plans), per D-098 — the next task creates its worktree from the latest working worktree. (LEARN-06 / KAN-72 remains blocked by SYNC-02 / KAN-140 per the manifest and was skipped in favor of the next eligible task.)
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-73-journey-verify`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/journey/journey-types.ts` (JourneyOwner, JourneyState, SourceAvailability, JourneyAttempt, JourneyDraft, JourneyResume, JourneyCommandResult, JourneyRefusal, JourneyError)
- `backend/upstream/backend/src/journey/journey-lookups.ts` (JourneyStore seam incl. server-live source availability + InMemoryJourneyStore contract-true state)
- `backend/upstream/backend/src/journey/journey.ts` (LearnerJourneyService — startJourney, practice, saveDraft, resume, expire, withdrawSource; every refusal preserves local visibly)
- `backend/upstream/backend/src/journey/index.ts`
- `backend/upstream/backend/tsconfig.journey.json`
- `backend/tests/contracts/journey/journey.test.mjs` (LEARN-07 suite, 8 tests)
- `scripts/journey-check.mjs`, `package.json` (`journey:check`)
Prerequisites: parent KAN-7 (P05); the LEARN lane head (KAN-67/68/69/70 lineage) is the base — the journey composes the lane's established session/attempt/eligibility/withdrawal semantics.

## Requirement

Verify concept → check/practice → private project → save → second-device resume, including source withdrawal, concurrent edits, failed saves and session expiry. Exit: a committed learner journey resumes correctly on another device. D-085 trace: owned session/checkpoint/resume commands behind existing facades; wrong-user/workspace/source/revision denies; duplicate/cancelled behavior.

## Acceptance criteria → evidence

- Criterion (the exit): concept → practice → private draft save → ANOTHER DEVICE resumes the committed journey — resume carries concept pin, source version, committed attempts, latest draft, committed revision, server-live availability.
  - Evidence: test "happy path: concept → practice → private draft save → second-device resume carries the committed journey (the exit)".
- Criterion: source withdrawal mid-journey — new practice/draft commands denied with `preservedLocal`; the committed journey stays resumable with honest `withdrawn` availability.
  - Evidence: test "source withdrawal mid-journey: new commands denied with preserved local; committed journey resumable with honest withdrawn state".
- Criterion: concurrent edits — stale revisions refused with visible local preservation and the committed revision returned for rebase; the rebased command commits.
  - Evidence: test "concurrent edits: stale revision refused with preserved local and committed revision for rebase".
- Criterion: failed saves preserve the local draft visibly; nothing partial persists; a retry commits cleanly.
  - Evidence: test "failed saves preserve local work visibly; nothing partial persists and a retry succeeds".
- Criterion: duplicate submissions deduplicate (idempotent replay, no double-advance).
  - Evidence: test "duplicate practice submissions deduplicate (idempotent, no double-advance)".
- Criterion: wrong-user/workspace denied on practice/draft/resume/expire; unknown journeys fail closed.
  - Evidence: test "wrong users denied on every operation; unknown journeys fail closed".
- Criterion: session expiry — new commands refused with `journey_expired`; expire idempotent; committed state resumable and honestly marked expired.
  - Evidence: test "session expiry: new commands refused honestly; committed state remains resumable as expired".
- Criterion: journeys start only from released (concept, source revision); unknown revisions refused before anything persists.
  - Evidence: test "journeys start only from released source revisions; unknown revisions refused before anything persists".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; LearningWorkspace/learningPipelineService drive the journey at cutover; `preservedLocal` surfaces unsaved local recovery.
  - API: N/A in the enabler; journey controllers call the service at cutover with validated schema.
  - Backend: LearnerJourneyService composes the lane semantics end to end with visible recovery on every refusal.
  - Data: in-memory store mirrors journeys/attempts/drafts + server-live source availability; Cloud SQL adapter at integration resolves from owned journey/attempt/draft tables and the retrieval gate.
  - Jobs/ML: withdrawal events flow through the owning-store outbox at cutover; no model output is committed product state.

## Commands, exit codes, test counts and timestamps

- Journey compile + suite: `node scripts/journey-check.mjs` → tsc `tsconfig.journey.json` exit 0; `node --test` → 8 tests, 8 pass, 0 fail (2026-10-27).
- Lane regressions (unchanged base; candidate does not regress the lane): `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Two-device recovery here is the committed-journey contract; hosted device-farm verification and real sync observation (SYNC-01/02) remain linked open gates.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-73 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: LEARN-08 (KAN-74) server-owned versioned criteria evaluation with protected answer keys; the lane continues through the LEARN series with blocked tasks (LEARN-06/11/12/13) waiting on SYNC-02/JOB-01 prerequisites.
