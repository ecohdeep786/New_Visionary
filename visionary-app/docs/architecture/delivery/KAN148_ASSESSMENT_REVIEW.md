# KAN-148 — LEARN-12 — released assessment modes: fixed snapshots, server-owned scoring, durable sectional timing, evidence-qualified readiness

## Task review and verification handoff

Jira key / source ID: KAN-148 (LEARN-12)
Acceptance scope: feature-enabler (backend-owned timed-assessment domain; controller wiring, real released-paper ingestion and the validated reference-distribution measurement happen at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-148-timed-assessment`; based on the latest lane head `2b1d018a` (KAN-147 LEARN-11 reviewschedule), per D-098 (lane lineage …160 → 147 → 148).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-148-timed-assessment`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/assessment/assessment-types.ts` (AssessmentOwner, AssessmentSection, AssessmentPaper, SectionState, AssessmentSession, SessionResult, ReadinessReport, ReferenceDistribution, ProfessionalOutcome, AssessmentError)
- `backend/upstream/backend/src/assessment/assessment-lookups.ts` (AssessmentStore seam + InMemoryAssessmentStore contract-true state; protected-key seam; command-dedup ledger with result convergence)
- `backend/upstream/backend/src/assessment/assessment-service.ts` (AssessmentService — releasePaper, loadAnswerKey, startSession, tickSection, answerQuestion, submitSection, finalizeSession, readiness, rankPrediction, validateReferenceDistribution, professionalOutcome, awardCredential, resumeSession, recordAssessedEvidenceForReadiness)
- `backend/upstream/backend/src/assessment/index.ts`
- `backend/upstream/backend/tsconfig.assessment.json`
- `backend/tests/contracts/assessment/assessment.test.mjs` (LEARN-12 suite, 9 tests)
- `scripts/assessment-check.mjs`, `package.json` (`assessment:check`)
Prerequisites (native Blocks): LEARN-08 / KAN-74 (server-owned evaluation), CONTENT-08 / KAN-144 (versioned prerequisite graph), SYNC-02 / KAN-140 (cross-device sync) — all implemented and in Testing. Unblocks ACCEPT-05 / KAN-121. Composes the lane stances: LEARN-02 attempts, LEARN-08 protected keys + versioned criteria, KAN-139 record discipline, D-086 docs 15/19/20.

## Requirement

Implement only the released assessment modes: fixed source/criteria/official-paper snapshots, server-owned answers/scoring, durable sectional timing and interrupted mock resume, plus evidence-qualified exam-weighted readiness with missing-data/coverage labels. Rank predictions require a validated permitted reference distribution and remain unavailable otherwise; professional scenarios use capability/rubric vocabulary and never award a credential automatically. (source: BACKEND_LAUNCH_CHECKLIST.md LEARN-12; KAN-148 description; D-086 docs 15/19/20)

## Acceptance criteria → evidence (backend/tests/contracts/assessment/assessment.test.mjs, 9 tests)

- RELEASED MODES ONLY — a session starts only from a RELEASED paper snapshot: an unreleased paper refuses `source_not_released`, an unknown paper `paper_unknown`, and releasing requires a named releaser.
- FIXED SNAPSHOTS — the session pins source/criteria/official-paper refs at start; later paper edits never move a live session (read-back verbatim).
- SERVER-OWNED ANSWERS/SCORING — answer keys live server-side and never echo into session state; scoring runs against the pinned criteria and is immutable (resubmission converges to the identical score); a client claim that disagrees never decides.
- DURABLE SECTIONAL TIMING — ticking only ever decreases a section's remaining time; an exhausted section refuses further answers (`section_time_exhausted`); reconnect/resume NEVER resets any timer; unaffected sections keep their time.
- INTERRUPTED MOCK RESUME — two controllers over the same store observe the identical byte-stable session (equal digest); wrong uid/workspace refuses (`not_owner`/`workspace_mismatch`, no leak).
- COMMAND DEDUPLICATION — a replayed start command converges to the SAME session id; the same key with a changed payload refuses (`command_changed`).
- EVIDENCE-QUALIFIED READINESS — exam-weighted readiness derives only from immutable assessed evidence; missing concepts surface as visible coverage labels (`missing_data`/`partial`/`full` with missingConcepts listed); evidence-free readiness refuses (`evidence_required`).
- RANK REQUIRES A VALIDATED REFERENCE DISTRIBUTION — without one the rank stays honestly unavailable (`reference_distribution_unavailable`, `rank.available=false`); after an explicit named validation the rank is available.
- PROFESSIONAL VOCABULARY, NO AUTOMATIC CREDENTIAL — professional outcomes carry capability/rubric vocabulary with `credentialAwarded: false` by construction; an explicit award attempt always refuses (`credential_not_automatic`).
- Cross-layer closure: Frontend — N/A in the enabler. API — controller wiring binds validated schemas at cutover. Backend — AssessmentService composes the released-paper gate, the protected-key seam, server-owned timers and the evidence seam. Data — owning-store adapter at integration resolves from released-paper snapshots, durable session/section rows and immutable results. ML — validated reference distributions and calibrated weights are later, separately reviewed measurements; this enabler never invents percentiles.

## Commands, exit codes, test counts and timestamps

- Assessment compile + suite: `node scripts/assessment-check.mjs` → tsc `tsconfig.assessment.json` exit 0; `node --test` → 9 tests, 9 pass, 0 fail (2026-10-29).
- Lane regressions: all 42 contract modules on this candidate, 0 failures (assessment-new 9, reviewschedule 9, coaching 11, reports 6, guardian 6, entitlement 6, organization 6, professional 6, submissions 7, assignment 7, classroom 6, sceneprotocol 12, changefeed 10, scorecard 14, airaflow 14, modalities 5, deadline 6, usagereservation 6, mlgate 7, conversationauth 6, serviceidentity 7, providerscope 4, completion 4, sharing 4, runs 6, guidedbriefs 4, draftrecovery 6, projects 5, evaluation 5, journey 8, dailyplan 7, projections 7, attempts 6, learningsession 8, conceptgraph 8, catalogadapter 7, coverage 7, mediagate 7, retrievalgate 6, qualityscope 6, mlresilience 4, contextassembly 8).
- `data:check` (DATA-01 DDL) requires `DATA_TEST_DATABASE_URL` loopback PostgreSQL and is a DDL check, not part of the contract-module regression list; unchanged by this task and still out of the module-lane scope.

## Remaining defects, limitations and linked open gates

- The protected-key and assessed-evidence seams bind the real LEARN-02/08 stores at cutover; validated reference distributions (rank prerequisite) are a separately reviewed measurement — until then rank stays honestly unavailable.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates. Prerequisites KAN-74/144/140 and unblocks KAN-121 remain tracked in Jira.
- No model training, new price, data purge, broad AGI claim or expanded Done scope is claimed by this enabler.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
