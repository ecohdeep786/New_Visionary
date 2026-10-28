# KAN-94 — ROLE-02 — fixed assignment publication, scheduling/timezones, close/archive/restore, supported response types

## Task review and verification handoff

Jira key / source ID: KAN-94 (ROLE-02)
Acceptance scope: feature-enabler (backend-owned assignment domain; controller wiring and classroom adapters happen at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-94-assignment-publication`; based on the latest lane head `9badbefa` (KAN-93 ROLE-01 classroom), per D-098 (lane lineage …139 → 150 → 93 → 94).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-94-assignment-publication`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/assignment/assignment-types.ts` (AssignmentOwner, ResponseType, WallClock, AssignmentVersion, Submission, SubmitOutcome, AssignmentError)
- `backend/upstream/backend/src/assignment/assignment-lookups.ts` (AssignmentStore seam + InMemoryAssignmentStore contract-true state)
- `backend/upstream/backend/src/assignment/assignment-service.ts` (AssignmentService — defineAssignment, editDraft, publish, close, archive, restore, submit, getAssignment; zonedInstant helper)
- `backend/upstream/backend/src/assignment/index.ts`
- `backend/upstream/backend/tsconfig.assignment.json`
- `backend/tests/contracts/assignment/assignment.test.mjs` (ROLE-02 suite, 7 tests)
- `scripts/assignment-check.mjs`, `package.json` (`assignment:check`)
Prerequisites: parent KAN-9; ROLE-01 (KAN-93, delivered `9badbefa` on this lane) — satisfied. Unblocks ROLE-03 (KAN-95).

## Requirement

Implement fixed assignment/objective/source/rubric publication, scheduling/timezones, close/archive/restore and supported response types (source: docs/architecture/BACKEND_LAUNCH_CHECKLIST.md ROLE-02; KAN-94 description).

## Acceptance criteria → evidence

- FIXED publication — the published version binds objective, permitted source revision, rubric reference and supported response types; editing or re-publishing a published version refuses (`published_immutable`); edits happen as a NEW draft version; submissions record the exact version answered.
  - Evidence: test "FIXED publication…".
- SCHEDULING/TIMEZONES — publish/close are wall-clock times in an EXPLICIT IANA timezone; an invalid identifier refuses (`timezone_invalid`); close ordering validates at definition (`assignment_definition_invalid`); a future publishAt SCHEDULES and the assignment goes live automatically at the publish instant (own timezone — Kolkata verified: 23:59 IST = 18:29Z via `zonedInstant`); submissions before the publish instant refuse (`assignment_not_published`).
  - Evidence: tests "TIMEZONES…" and "SCHEDULING…".
- CLOSE — explicit teacher close refuses submissions; a passed close time refuses (evaluated in the assignment's own timezone: a 19:00Z submission is late in Kolkata even though it is before 23:59 UTC).
  - Evidence: tests "CLOSE…" and "TIMEZONES…".
- ARCHIVE/RESTORE — archive refuses submissions (`assignment_archived`) and records the prior status; restore returns EXACTLY that prior status (published → open again; closed → still closed).
  - Evidence: test "ARCHIVE/RESTORE…".
- SUPPORTED response types — submissions outside the published version's response types refuse (`response_type_unsupported`); per-type schema checks refuse (text over max length, choice outside options, malformed file ref) (`submission_schema_invalid`); duplicate (learner, version) submissions converge idempotently to one record.
  - Evidence: test "SUPPORTED response types…".
- ROLE-AWARE authority — same-workspace non-teacher denies `not_class_teacher`; unknown assignment and foreign workspace deny uniformly `not_owner` (no existence leak); submissions require CURRENT class membership via the owning store (`not_enrolled`).
  - Evidence: test "ROLE-AWARE authority…".
- Cross-layer closure: Frontend — N/A in the enabler. API — controller wiring binds validated schemas at cutover. Backend — AssignmentService composes the ROLE-01 classroom domain (membership via the owning store seam). Data — Cloud SQL adapter at integration resolves from assignment_version (unique assignment_id+version), assignment_submission (unique assignment+version+learner) tables. Timezones — stored wall-clock + IANA identifier; instants computed server-side (no client clock trust).

## Commands, exit codes, test counts and timestamps

- Assignment compile + suite: `node scripts/assignment-check.mjs` → tsc `tsconfig.assignment.json` exit 0; `node --test` → 7 tests, 7 pass, 0 fail (2026-10-29).
- Lane regressions: all 33 modules on this candidate, 0 failures (assignment 7, classroom 6, sceneprotocol 12, changefeed 10, scorecard 14, airaflow 14, modalities 5, deadline 6, usagereservation 6, mlgate 7, conversationauth 6, serviceidentity 7, providerscope 4, completion 4, sharing 4, runs 6, guidedbriefs 4, draftrecovery 6, projects 5, evaluation 5, journey 8, dailyplan 7, projections 7, attempts 6, learningsession 8, conceptgraph 8, catalogadapter 7, coverage 7, mediagate 7, retrievalgate 6, qualityscope 6, mlresilience 4, contextassembly 8).
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; classroom adapter binding (isEnrolled → the ROLE-01 store) and two-device submission journeys are cutover work.
- DST edge cases use the two-pass offset computation (verified for fixed-offset IST); DST-observing zones should be covered at cutover with the released timezone set.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
