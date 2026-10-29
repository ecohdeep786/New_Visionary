# KAN-159 — LEARN-14 — backend-owned lifelong stage/curriculum continuity

## Task review and verification handoff

Jira key / source ID: KAN-159 (LEARN-14)
Acceptance scope: feature-enabler (backend-owned stage-continuity domain; controller wiring, real source/criteria mapping ingestion and the connected frontend stage/bridge adapters happen at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-159-stage-continuity`; based on the latest lane head `f019bc67` (KAN-147 LEARN-11 corrected candidate), per D-098 (lane lineage …147 → 159).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-159-stage-continuity`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/stage/stage-types.ts` (StageOwner, JumpClass, PromotionBasis, StageMapping, StageEvent, StageProfile, PromotionProposal, StageError)
- `backend/upstream/backend/src/stage/stage-lookups.ts` (StageStore seam + InMemoryStageStore contract-true state; preserved due-dates/assignment-label pass-through; command-dedup ledger)
- `backend/upstream/backend/src/stage/stage-service.ts` (StageService — recordMapping, proposePromotion, postponeProposal, applyPromotion, undoPromotion, recordExit, exitGateActive, currentProfile, postCommitProjection)
- `backend/upstream/backend/src/stage/index.ts`
- `backend/upstream/backend/tsconfig.stage.json`
- `backend/tests/contracts/stage/stage.test.mjs` (LEARN-14 suite, 10 tests)
- `scripts/stage-check.mjs`, `package.json` (`stage:check`)
Prerequisites (native Blocks): DATA-01 / KAN-36, DATA-06 / KAN-41, CONTENT-08 / KAN-144, LEARN-09 / KAN-145, LEARN-11 / KAN-147 (implemented; corrected candidate f019bc67), SYNC-02 / KAN-140, DATA-05 / KAN-40, AI-15 / KAN-149, PRIV-01 / KAN-110 — all implemented and in Testing/Done. Unblocks ACCEPT-01 / KAN-117, ACCEPT-02 / KAN-118, ACCEPT-04 / KAN-120. Composes the lane stances: LEARN-11 review scheduling, LEARN-09 knowledge projections, CONTENT-08 curriculum graph, KAN-139 record discipline.

## Requirement

Implement backend-owned lifelong stage/curriculum continuity over the same UID: versioned authorized promotion/change events, conditional current-profile revisions, reviewed source/criteria mappings, retained prior sessions/evidence/projects and bridge gaps, preserved review due dates and fixed assignment labels, and post-commit plan/audience projections. Ordinary eligible progression may apply with notice/diff, Postpone 7 days and Undo 14 days; evidence inference alone is suggestion-only, and board/institution/safety-tier or larger jumps retain required confirmation. Undo preserves work created since and never rewrites grades or claims equivalent mastery from an unreviewed mapping. Recheck authority on in-flight jobs and institution exit; test concurrent devices, duplicate/reordered events, restart/lost receipt, long absence, changed source, unavailable mapping and rollback through existing UI adapters. (source: BACKEND_LAUNCH_CHECKLIST.md LEARN-14; KAN-159 description)

## Acceptance criteria → evidence (backend/tests/contracts/stage/stage.test.mjs, 9 tests)

- REVIEWED MAPPINGS REQUIRED — a promotion proposal requires a reviewed source/criteria mapping for the exact jump; missing/unreviewed refuses (`mapping_unavailable`); recording a mapping requires a named reviewer (`mapping_invalid`).
- EVIDENCE INFERENCE IS SUGGESTION-ONLY — an inferred proposal is marked suggestionOnly and ALWAYS refuses to apply (`evidence_suggestion_only`).
- ORDINARY VS MAJOR JUMPS — an ordinary eligible progression applies with a notice/diff (added concepts + retained bridge gaps counted in the notice); board/institution/safety-tier (major) jumps apply only with explicit confirmation (`confirmation_required`).
- VERSIONED DERIVED PROFILE — the current profile revision is DERIVED from the append-only event set: a replayed apply command converges to the SAME event; reordered/duplicate events never double-apply; two controllers derive the identical byte-stable profile (equal digest).
- POSTPONE 7 / UNDO 14 — an ordinary proposal postpones durably up to 7 days (applying during the window refuses `postpone_invalid`; beyond 7 days refuses); a committed promotion undoes within 14 days by appending a REVERT event (history kept; derived profile returns to the prior stage; work created since preserved; no grades rewritten); undo beyond the window refuses (`undo_window_expired`).
- AUTHORITY RECHECK ON EXIT — an institution exit event revokes in-flight promotion authority; a fresh-key apply after exit refuses (`exit_authority_revoked`).
- PRESERVED STATE — review due dates and fixed assignment labels pass through the projection untouched across a stage change (continuity never rewrites them).
- POST-COMMIT PROJECTIONS — the plan/audience projection rebuilds deterministically from the committed event set (equal digest on rebuild).
- OWNER/WORKSPACE BOUNDARY — another learner cannot act on a proposal that is not theirs (`not_owner`, no leak).
- Cross-layer closure: Frontend — N/A in the enabler (existing stage/bridge UI adapters bind at cutover). API — controller wiring binds validated schemas at cutover. Backend — StageService composes the reviewed-mapping seam (CONTENT-08), the append-only event set and the derived profile revision. Data — owning-store adapter at integration resolves from stage_events (append-only), stage_mappings (reviewed) and preserved due-date/label rows. ML — none (no inference authority; evidence inference stays suggestion-only).

## Commands, exit codes, test counts and timestamps

- Stage compile + suite: `node scripts/stage-check.mjs` → tsc `tsconfig.stage.json` exit 0; `node --test` → 10 tests, 10 pass, 0 fail (2026-10-29).
- Candidate revision note: the implementer's post-push self-audit found that a replayed undo/exit command appended a duplicate revert/exit event to the append-only ledger. The corrected candidate converges replayed undo/exit commands to the ORIGINAL events (command result refs) and adds a replay-convergence regression test (suite 9 → 10).
- Lane regressions: all 42 contract modules on this candidate, 0 failures (stage-new 9, reviewschedule 11 (corrected f019bc67), coaching 11, reports 6, guardian 6, entitlement 6, organization 6, professional 6, submissions 7, assignment 7, classroom 6, sceneprotocol 12, changefeed 10, scorecard 14, airaflow 14, modalities 5, deadline 6, usagereservation 6, mlgate 7, conversationauth 6, serviceidentity 7, providerscope 4, completion 4, sharing 4, runs 6, guidedbriefs 4, draftrecovery 6, projects 5, evaluation 5, journey 8, dailyplan 7, projections 7, attempts 6, learningsession 8, conceptgraph 8, catalogadapter 7, coverage 7, mediagate 7, retrievalgate 6, qualityscope 6, mlresilience 4, contextassembly 8).
- `data:check` (DATA-01 DDL) requires `DATA_TEST_DATABASE_URL` loopback PostgreSQL and is a DDL check, not part of the contract-module regression list; unchanged by this task and still out of the module-lane scope.

## Remaining defects, limitations and linked open gates

- The reviewed-mapping seam binds the real CONTENT-08 curriculum graph at cutover; long-absence/changed-source reconciliation beyond mapping unavailability is cutover evidence.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates. Unblocks KAN-117/118/120 remain tracked in Jira.
- No model training, new price, data purge, broad AGI claim or expanded Done scope is claimed by this enabler.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
