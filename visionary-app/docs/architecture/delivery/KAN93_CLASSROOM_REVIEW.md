# KAN-93 — ROLE-01 — verified teacher/class ownership, enrollment/join/invitation lifecycle

## Task review and verification handoff

Jira key / source ID: KAN-93 (ROLE-01)
Acceptance scope: feature-enabler (backend-owned classroom domain; controller wiring and real workspace adapters happen at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-93-classroom-roles`; based on the latest lane head `7790356c` (KAN-150 AI-16 scene protocol), per D-098 (lane lineage …143 → 142 → 139 → 150 → 93).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-93-classroom-roles`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/classroom/classroom-types.ts` (ClassroomOwner, TeacherStatus, Classroom, ClassInvite, Enrollment, ClassAttachment, ClassroomError)
- `backend/upstream/backend/src/classroom/classroom-lookups.ts` (ClassroomStore seam + InMemoryClassroomStore contract-true state)
- `backend/upstream/backend/src/classroom/classroom-service.ts` (ClassroomService — verifyTeacher, createClass, inviteLearner, revokeInvite, joinByInvite, attachMaterial, readAttachment, removeLearner, listLearners, archiveClass)
- `backend/upstream/backend/src/classroom/index.ts`
- `backend/upstream/backend/tsconfig.classroom.json`
- `backend/tests/contracts/classroom/classroom.test.mjs` (ROLE-01 suite, 6 tests)
- `scripts/classroom-check.mjs`, `package.json` (`classroom:check`)
Prerequisites: parent KAN-9; DATA-04 (KAN-39, invitations/verified roles, commit `a93cc508` in the base workspace infrastructure) — satisfied. Unblocks ROLE-02 (KAN-94).

## Requirement

Implement verified teacher/class ownership, enrollment/join/invitation lifecycle and workspace actions; independently check each class, attachment and learner operation (source: docs/architecture/BACKEND_LAUNCH_CHECKLIST.md ROLE-01; KAN-93 description).

## Acceptance criteria → evidence

- VERIFIED teacher ownership — self-claimed teacher status never creates classes (`teacher_unverified`); server-verified status is recorded by a named verifier (empty verifier refuses); the class owner is recorded server-side.
  - Evidence: test "VERIFIED teacher ownership…".
- Uniform denial + workspace isolation — unknown class and foreign-workspace callers deny uniformly (`not_owner`, no existence leak); a same-workspace non-teacher denies as `not_class_teacher` (role denial, distinct from existence leak).
  - Evidence: test "uniform denial: unknown class and foreign workspace are not_owner; a same-workspace non-teacher is not_class_teacher".
- Invitation lifecycle — teacher-issued, learner-BOUND invites with opaque codes and expiry; the invited learner joins; duplicate joins converge idempotently to exactly ONE enrollment record; revocation refuses (`invite_revoked`); expiry refuses with an injected clock (`invite_expired`); unknown code and wrong learner deny uniformly (`invite_invalid`, no leak).
  - Evidence: tests "invitation lifecycle…" and "uniform invite refusal…".
- Independent per-operation checks — teacher-only actions (invite/remove/attach/list) refuse non-teachers; learner reads require CURRENT enrollment: a removed learner loses access immediately (no cached role) and re-joins only with a NEW invite; archived classes refuse lifecycle actions (`class_archived`).
  - Evidence: test "independent per-operation checks…" and "listLearners is teacher-only…".
- Cross-layer closure: Frontend — N/A in the enabler; role screens bind at cutover. API — controller wiring binds validated schemas to ClassroomService at cutover; the DATA-04 workspace invitation infrastructure remains the account-level path. Backend — ClassroomService adds the classroom domain (verified teacher → class → enrollment → material) with per-call authority checks. Data — Cloud SQL adapter at integration resolves from classroom/class_invite/class_enrollment/class_attachment tables. Jobs — none required; lifecycle transitions are direct store transitions with recorded status.

## Commands, exit codes, test counts and timestamps

- Classroom compile + suite: `node scripts/classroom-check.mjs` → tsc `tsconfig.classroom.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-29).
- Lane regressions: all 32 modules on this candidate, 0 failures (classroom 6, sceneprotocol 12, changefeed 10, scorecard 14, airaflow 14, modalities 5, deadline 6, usagereservation 6, mlgate 7, conversationauth 6, serviceidentity 7, providerscope 4, completion 4, sharing 4, runs 6, guidedbriefs 4, draftrecovery 6, projects 5, evaluation 5, journey 8, dailyplan 7, projections 7, attempts 6, learningsession 8, conceptgraph 8, catalogadapter 7, coverage 7, mediagate 7, retrievalgate 6, qualityscope 6, mlresilience 4, contextassembly 8).
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real workspace/role adapters and two-device enrollment journeys are cutover work (ROLE-08/KAN-100 connects released role screens).
- Teacher verification is recorded by a named verifier; the identity-proofing workflow behind it remains the account/verification infrastructure's gate.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
