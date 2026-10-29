# KAN-160 — ROLE-10 — teachers' private ongoing subject/pedagogy learning and evidence-based coaching

## Task review and verification handoff

Jira key / source ID: KAN-160 (ROLE-10)
Acceptance scope: feature-enabler (backend-owned teacher-coaching domain; controller wiring, the evaluated connected coaching adapter and real recipient/class adapters happen at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-160-teacher-learning`; based on the latest lane head `4586bc74` (KAN-99 ROLE-07 reports), per D-098 (lane lineage …96 → 99 → 160).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-160-teacher-learning`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/coaching/coaching-types.ts` (CoachOwner, GoalFocus, CheckpointKind, TeachingGoal, CoachingCheckpoint, CoachingSuggestion, CoachingCorrection, CoachingJournalEntry, CoachingError)
- `backend/upstream/backend/src/coaching/coaching-lookups.ts` (CoachingStore seam + InMemoryCoachingStore contract-true state; class-summary permission seam + connected-adapter acceptance seam)
- `backend/upstream/backend/src/coaching/coaching-service.ts` (CoachingService — createGoal, addCheckpoint, suggest, correctSuggestion, revokeGoal, resumeCoach, reviewJournal)
- `backend/upstream/backend/src/coaching/index.ts`
- `backend/upstream/backend/tsconfig.coaching.json`
- `backend/tests/contracts/coaching/coaching.test.mjs` (ROLE-10 suite, 11 tests)
- `scripts/coaching-check.mjs`, `package.json` (`coaching:check`)
Prerequisites: DATA-03 / KAN-38, DATA-05 / KAN-40, LEARN-10 / KAN-146, AI-15 / KAN-149 (native Blocks). Compose the lane stances: ROLE-01/06 recorded relationship seams (class-summary permission seam), KAN-146 teaching-loop semantics, KAN-149 scoped memory; KAN-139 record discipline.

## Requirement

Implement teachers' private ongoing subject/pedagogy learning and evidence-based coaching through explicit personal goals, scoped assessed practice, teach-back/Build and reflection checkpoints, understandable recommendation reasons and manual correction. Keep personal learning/memory separate from class preparation, learner reports and organization employment; use only currently permitted class summaries for an explicitly chosen teaching goal. Replace random-tip behavior only when the evaluated connected adapter is accepted; unavailable evidence yields an authored, clearly generic suggestion. Prove personal/class workspace switching, changed employment, revocation, two-device resume and independent teacher-usefulness/outcome review; no inferred teaching-quality ranking, credential or disclosure of private learner doubts. (source: BACKEND_LAUNCH_CHECKLIST.md ROLE-10; KAN-160 description)

## Acceptance criteria → evidence (backend/tests/contracts/coaching/coaching.test.mjs, 11 tests)

- EXPLICIT PERSONAL GOALS — a goal requires a CURRENTLY-PERMITTED class summary (`class_summary_not_permitted` for an unpermitted summary); the goal records the explicit choice.
- PRIVATE SEPARATION — personal goals/coaching live in the teacher's PERSONAL workspace, separate from class preparation/learner reports/org employment; a different teacher or a class-preparation workspace refuses uniformly (`not_owner` / `workspace_mismatch`, no leak).
- SCOPED CHECKPOINTS — assessed practice / teach-back-Build / reflection checkpoints bind to one explicit goal and to its currently-permitted summary; private-learner-doubt content refuses (`private_learner_doubt_forbidden`, no leak).
- NO RANDOM TIPS — with an ACCEPTED connected adapter, an evidence-based suggestion cites the currently-permitted summary and carries an understandable reason (`connected_adapter`); without an accepted adapter, an authored clearly-generic suggestion is returned (`generic_authored`) — a random tip is never produced.
- NO INFERRED RANKING/CREDENTIAL — a suggestion never contains teaching-quality ranking, credential or qualified-teacher claims.
- MANUAL CORRECTION — the teacher corrects a suggestion (append-only; marked `corrected`); another teacher cannot (`not_owner`).
- REVOCATION — revoking a goal makes further coaching refuse (`goal_revoked`).
- CHANGED EMPLOYMENT / revoked summary — after the class-summary permission is revoked, checkpointing and suggesting refuse `class_summary_not_permitted` and never reuse the old summary.
- TWO-DEVICE RESUME — two controllers over the same store observe the identical byte-stable history (equal digest/journal).
- INDEPENDENT REVIEW — the append-only journal is readable for teacher-usefulness/outcome review; another teacher cannot (`not_owner`).
- Cross-layer closure: Frontend — N/A in the enabler (release role screens bind through the ROLE-08 membership gate at cutover). API — controller wiring binds validated schemas at cutover. Backend — CoachingService composes the class-summary permissions (ROLE-01/06 seams), the accepted adapter seam and the personal workspace boundary. Data — owning-store adapter at integration resolves from coached goal/checkpoint/journal tables. ML — the evaluated connected coaching adapter is a separate, reviewed cutover; this enabler never produces a random tip and marks generic suggestions visibly.

## Commands, exit codes, test counts and timestamps

- Coaching compile + suite: `node scripts/coaching-check.mjs` → tsc `tsconfig.coaching.json` exit 0; `node --test` → 11 tests, 11 pass, 0 fail (2026-10-29).
- Lane regressions: all 40 contract modules on this candidate, 0 failures (coaching-new 11, reports 6, guardian 6, entitlement 6, organization 6, professional 6, submissions 7, assignment 7, classroom 6, sceneprotocol 12, changefeed 10, scorecard 14, airaflow 14, modalities 5, deadline 6, usagereservation 6, mlgate 7, conversationauth 6, serviceidentity 7, providerscope 4, completion 4, sharing 4, runs 6, guidedbriefs 4, draftrecovery 6, projects 5, evaluation 5, journey 8, dailyplan 7, projections 7, attempts 6, learningsession 8, conceptgraph 8, catalogadapter 7, coverage 7, mediagate 7, retrievalgate 6, qualityscope 6, mlresilience 4, contextassembly 8).
- `data:check` (DATA-01 DDL) requires `DATA_TEST_DATABASE_URL` loopback PostgreSQL and is a DDL check, not part of the contract-module regression list; unchanged by this task and still out of the module-lane scope.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- The class-summary permission seam binds the real ROLE-01/06 relationship stores at cutover; the connected coaching adapter (an accepted, evaluated adapter producing evidence-based suggestions) is a separately reviewed cutover. Until then, suggestions are authored generic ones, honestly marked.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates. Prerequisites KAN-38/40/149 and unblocks KAN-118/157 remain tracked in Jira.
- No model training, new price, data purge, broad AGI claim or expanded Done scope is claimed by this enabler.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
