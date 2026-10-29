# KAN-147 — LEARN-11 — versioned durable review scheduling from assessed evidence

## Task review and verification handoff

Jira key / source ID: KAN-147 (LEARN-11)
Acceptance scope: feature-enabler (backend-owned review-scheduling domain; controller wiring, real assessed-evidence ingestion from LEARN-02 attempts, and the calibrated-forgetting measurement happen at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-147-review-schedule`; based on the latest lane head `9d5767dd` (KAN-160 ROLE-10 coaching), per D-098 (lane lineage …99 → 160 → 147).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-147-review-schedule`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/reviewschedule/reviewschedule-types.ts` (ReviewOwner, ReviewGrade, BaselineRules, AssessedEvidence, SelfRating, DueItem, DueProjection, ReviewPreferences, ReviewScheduleError)
- `backend/upstream/backend/src/reviewschedule/reviewschedule-lookups.ts` (ReviewScheduleStore seam + InMemoryReviewScheduleStore contract-true state; command-dedup ledger)
- `backend/upstream/backend/src/reviewschedule/reviewschedule-service.ts` (ReviewScheduleService — defineBaselineRules, calibrateBaseline, recordAssessedEvidence, recordSelfRating, postponeReview, projectDueQueue, setPreferences, resumeQueue)
- `backend/upstream/backend/src/reviewschedule/index.ts`
- `backend/upstream/backend/tsconfig.reviewschedule.json`
- `backend/tests/contracts/reviewschedule/reviewschedule.test.mjs` (LEARN-11 suite, 11 tests)
- `scripts/reviewschedule-check.mjs`, `package.json` (`reviewschedule:check`)
Prerequisites (native Blocks): LEARN-02 / KAN-68 (assessed attempts), JOB-01 / KAN-53 (outbox jobs), LEARN-09 / KAN-145 (knowledge projections) — all implemented and in Testing/Done. Unblocks ACCEPT-01 / KAN-117 and LEARN-14 / KAN-159. Composes the lane stances: LEARN-04 daily-plan review scheduling, LEARN-03 review-due projections, KAN-139 record discipline.

## Requirement

Implement versioned, durable review scheduling from assessed evidence with bounded baseline SRS rules, due-queue projections, command deduplication, timezone/quiet/preference handling and two-device recovery. Calibrate forgetting estimates before personalized claims; separate self-rating from assessment, preserve manual control and avoid unvalidated exponential scheduling or retention TTLs. (source: BACKEND_LAUNCH_CHECKLIST.md LEARN-11; KAN-147 description; D-086 docs 09/15/22)

## Acceptance criteria → evidence (backend/tests/contracts/reviewschedule/reviewschedule.test.mjs, 9 tests)

- BOUNDED BASELINE SRS — only a versioned, APPROVED baseline rules object schedules anything; an unknown version (`rules_unknown`), an empty approver (`rules_not_approved`), and an invalid/non-monotonic/over-max ladder (`rules_invalid`) all refuse. The ladder is an explicit table (again < hard <= good <= easy) bounded by maxIntervalDays — never an unvalidated exponential formula.
- CALIBRATION BEFORE PERSONALIZED CLAIMS — an uncalibrated baseline projection explicitly declines any personalized claim (`no personalized claim` in the reason); `calibrateBaseline` (measured) flips the projection to the calibrated baseline reason.
- SCHEDULING FROM ASSESSED EVIDENCE ONLY — only server-assessed evidence reschedules a review; a self-rating recorded for the same concept changes nothing (byte-identical due dates).
- COMMAND DEDUPLICATION — the same commandKey + same payload converges idempotently (an evidence replay returns the ORIGINAL evidence row — no duplicate rows); the same commandKey with a CHANGED payload refuses (`command_changed`).
- MANUAL CONTROL IS DURABLE — a postpone persists and due projections honor it (due pushed later, reason visibly marked `manual postpone`); other concepts unaffected; an over-max postpone refuses.
- DETERMINISTIC DUE QUEUE — the projection rebuilds byte-stably (equal digest/items for identical inputs), sorted by dueAt, every item carrying an understandable reason.
- PREFERENCES (quiet hours/timezone) — a due time inside the saved quiet window shifts to the allowed boundary; invalid preferences refuse.
- TWO-DEVICE RECOVERY — two controllers over the same store observe the identical byte-stable projection history (equal digest/count).
- NO RETENTION TTLS — evidence and projections persist (no purge applied).
- OWNER/WORKSPACE BOUNDARY — another uid or workspace sees an empty queue (no leak).
- Cross-layer closure: Frontend — N/A in the enabler. API — controller wiring binds validated schemas at cutover. Backend — ReviewScheduleService composes the LEARN-02 assessed-evidence seam, the approved baseline rules and the owner preferences. Data — owning-store adapter at integration resolves from versioned baseline tables, assessed-evidence rows and append-only due-projections. ML — calibrated forgetting estimates are a later, separately reviewed measurement; this enabler never invents personalized numbers.

## Commands, exit codes, test counts and timestamps

- ReviewSchedule compile + suite: `node scripts/reviewschedule-check.mjs` → tsc `tsconfig.reviewschedule.json` exit 0; `node --test` → 11 tests, 11 pass, 0 fail (2026-10-29).
- Candidate revision note: after the initial candidate (2b1d018a) the implementer's self-audit found the manual-postpone result was returned but not persisted/consumed, and an evidence replay appended a duplicate row. The corrected candidate makes postpones durable and consumed by projections and makes evidence replay converge to the original row (2 added tests).
- Lane regressions: all 41 contract modules on this candidate, 0 failures (reviewschedule-new 11, coaching 11, reports 6, guardian 6, entitlement 6, organization 6, professional 6, submissions 7, assignment 7, classroom 6, sceneprotocol 12, changefeed 10, scorecard 14, airaflow 14, modalities 5, deadline 6, usagereservation 6, mlgate 7, conversationauth 6, serviceidentity 7, providerscope 4, completion 4, sharing 4, runs 6, guidedbriefs 4, draftrecovery 6, projects 5, evaluation 5, journey 8, dailyplan 7, projections 7, attempts 6, learningsession 8, conceptgraph 8, catalogadapter 7, coverage 7, mediagate 7, retrievalgate 6, qualityscope 6, mlresilience 4, contextassembly 8).
- `data:check` (DATA-01 DDL) requires `DATA_TEST_DATABASE_URL` loopback PostgreSQL and is a DDL check, not part of the contract-module regression list; unchanged by this task and still out of the module-lane scope.

## Remaining defects, limitations and linked open gates

- The assessed-evidence seam binds the real LEARN-02 attempt rows at cutover; the calibrated-forgetting measurement (per D-086 doc 22) is a separately reviewed step — until then projections are honestly uncalibrated.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates. Prerequisites KAN-68/53/145 and unblocks KAN-117/159 remain tracked in Jira.
- No model training, new price, data purge, broad AGI claim or expanded Done scope is claimed by this enabler.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
