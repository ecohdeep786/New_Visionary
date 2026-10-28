# KAN-95 — ROLE-03 — immutable submission copies, duplicate-safe submit, teacher grading lifecycle

## Task review and verification handoff

Jira key / source ID: KAN-95 (ROLE-03)
Acceptance scope: feature-enabler (backend-owned submission/grading domain; controller wiring and classroom/assignment adapters happen at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-95-submission-grading`; based on the latest lane head `fb3c72db` (KAN-94 ROLE-02 assignment), per D-098 (lane lineage …150 → 93 → 94 → 95).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-95-submission-grading`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/submissions/submissions-types.ts` (SubOwner, AttemptRecord, GradeRecord, SubmissionsError)
- `backend/upstream/backend/src/submissions/submissions-lookups.ts` (SubmissionsStore seam + InMemorySubmissionsStore contract-true state: append-only attempt copies, grades, revision grants, assignment gate, enrollment, teacher binding)
- `backend/upstream/backend/src/submissions/submissions-service.ts` (SubmissionsService — submit, saveDraftGrade, releaseGrade, returnGrade, requestRevision, learnerHistory, teacherHistory)
- `backend/upstream/backend/src/submissions/index.ts`
- `backend/upstream/backend/tsconfig.submissions.json`
- `backend/tests/contracts/submissions/submissions.test.mjs` (ROLE-03 suite, 7 tests)
- `scripts/submissions-check.mjs`, `package.json` (`submissions:check`)
Prerequisites: parent KAN-9; ROLE-02 (KAN-94, delivered `fb3c72db` on this lane) — satisfied. Unblocks the ROLE grading chain (KAN-99 ROLE-07 context).

## Requirement

Implement immutable submission copies, duplicate-safe submit, teacher draft/release/return/request-revision and retained attempt/feedback history; no silent resubmission replacement (source: docs/architecture/BACKEND_LAUNCH_CHECKLIST.md ROLE-03; KAN-95 description).

## Acceptance criteria → evidence

- IMMUTABLE submission copies — every attempt is an append-only byte-stable copy; a resubmission WITHOUT a teacher revision request refuses (`revision_not_requested`) and the first attempt is unchanged (deep-equal proof).
  - Evidence: test "immutable copies…".
- Revision-granted resubmission with a hard bound — after request-revision, attempt 2 is created (answersRevisionNo links the request); attempt 3 without another request refuses (`attempt_bound_exceeded`); attempt 1 stays byte-stable.
  - Evidence: test "after a teacher request-revision…".
- DUPLICATE-SAFE submit — the same idempotency key converges to the SAME attempt (first payload wins, retry payloads ignored); exactly one record exists.
  - Evidence: test "duplicate-safe submit…".
- Teacher grading lifecycle — mutable DRAFT (re-save allowed) → release makes the grade byte-stable (`grade_released_immutable` for any later edit or re-release) → return makes the feedback learner-visible; request-revision records the request, makes feedback visible and GRANTS attempt N+1.
  - Evidence: test "teacher grading lifecycle…".
- Retained attempt/feedback history — the learner always sees their own attempt copies but feedback only once returned/revision_requested (`feedback_not_visible` before); the teacher sees the full retained history; a stranger sees nothing (uniform `not_owner`, no leak).
  - Evidence: tests "feedback is hidden…" and "authority…" and "unenrolled learners cannot submit…" (teacher history).
- Authority — same-workspace non-teacher grading denies `not_class_teacher`; foreign workspace denies uniform `not_owner`; an unknown assignment denies uniformly (no leak); an unenrolled learner cannot submit (`not_enrolled`); the closed/unpublished assignment gate refuses submissions.
  - Evidence: tests "authority…" and "unenrolled learners cannot submit…".
- Cross-layer closure: Frontend — N/A in the enabler. API — controller wiring binds validated schemas at cutover. Backend — SubmissionsService composes the ROLE-02 assignment gate (published + open via the owning store seam) and ROLE-01 class membership. Data — Cloud SQL adapter at integration resolves from submission_attempt (append-only, unique attempt_id), submission_grade (unique attempt_id), revision_request tables. History — no destructive update exists in the contract: attempts and released grades are immutable by construction.

## Commands, exit codes, test counts and timestamps

- Submissions compile + suite: `node scripts/submissions-check.mjs` → tsc `tsconfig.submissions.json` exit 0; `node --test` → 7 tests, 7 pass, 0 fail (2026-10-29).
- Lane regressions: all 34 modules on this candidate, 0 failures (submissions 7, assignment 7, classroom 6, sceneprotocol 12, changefeed 10, scorecard 14, airaflow 14, modalities 5, deadline 6, usagereservation 6, mlgate 7, conversationauth 6, serviceidentity 7, providerscope 4, completion 4, sharing 4, runs 6, guidedbriefs 4, draftrecovery 6, projects 5, evaluation 5, journey 8, dailyplan 7, projections 7, attempts 6, learningsession 8, conceptgraph 8, catalogadapter 7, coverage 7, mediagate 7, retrievalgate 6, qualityscope 6, mlresilience 4, contextassembly 8).
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; classroom/assignment adapter binding and two-device grade visibility journeys are cutover work.
- Rubric-scoped grading semantics (per-criterion scores) remain ROLE-02's published rubric reference — bound at cutover.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
