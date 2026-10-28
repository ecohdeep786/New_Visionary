# KAN-142 — AI-13 — versioned product-capability scorecard for novel learning/Build tasks

## Task review and verification handoff

Jira key / source ID: KAN-142 (AI-13)
Acceptance scope: feature-enabler (backend-owned scorecard evaluation domain; wired into the connected evaluation/ML runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-142-capability-scorecard`; based on the latest lane head `c7ae4432` (KAN-143 AI-14 AIRA flow harness), per D-098 — the lane's most recent verified lane head on origin (lane lineage KAN-83 → 84 → 85 → 86 → 88 → 89 → 90 → 92 → 138 → 91 → 149 → 143).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-142-capability-scorecard`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/scorecard/scorecard-types.ts` (ScoreOwner, ScoreDimension — the six AI-13 dimensions, Thresholds, ScorecardDefinition, TaskFamily, TrialRecord, ScoreRun, ScoreReport, ScorecardError)
- `backend/upstream/backend/src/scorecard/scorecard-lookups.ts` (ScorecardStore seam + InMemoryScorecardStore contract-true state: append-only versioned definitions, family registry, contamination registry, runs)
- `backend/upstream/backend/src/scorecard/scorecard-service.ts` (ScorecardService — defineScorecard, reviewThresholds, registerFamily, markContaminated, startRun, recordTrial, report, stop)
- `backend/upstream/backend/src/scorecard/index.ts`
- `backend/upstream/backend/tsconfig.scorecard.json`
- `backend/tests/contracts/scorecard/scorecard.test.mjs` (AI-13 suite, 14 tests)
- `scripts/scorecard-check.mjs`, `package.json` (`scorecard:check`)
Prerequisites: parent KAN-9; AI-14 (KAN-143) delivered on this lane (candidate c7ae4432) and AI-11 (KAN-137) Done — both native Blocks satisfied. RELEASE-04 (KAN-127) remains the downstream gate.

## Requirement

Define and run a versioned product-capability scorecard for novel learning/Build tasks: reasoning, planning/replanning, permitted memory, tool execution, feedback-driven correction and transfer across released tasks/languages. Use held-out task families, contamination controls, human/teacher baselines where appropriate, repeated trials and observed final state; separate product reliability from broad AGI/generalization evidence and set reviewed thresholds before release (source: docs/architecture/BACKEND_LAUNCH_CHECKLIST.md AI-13; KAN-142 description).

## Acceptance criteria → evidence

- Criterion: VERSIONED scorecards — a conflicting same-version definition refuses (`scorecard_version_conflict`); an identical re-set is idempotent and preserves a recorded review; a run binds ONE explicit version (`scorecard_version_unknown` otherwise) and invalid definitions refuse (`definition_invalid`).
  - Evidence: tests "VERSIONED definitions…" and "a run binds ONE explicit scorecard version…".
- Criterion: REVIEWED thresholds before release — a named reviewer records the review (`reviewer_required` otherwise); an unreviewed threshold set computes scores but the verdict stays `pending_review` (reason `thresholds_unreviewed`).
  - Evidence: tests "threshold review requires a named reviewer…" and "VERDICT gating…".
- Criterion: HELD-OUT task families — evaluation on a non-held-out family refuses (`not_held_out`); family intake requires title, content hash, languages and dimensions (`family_incomplete`).
  - Evidence: tests "family intake is complete-or-refused…" and "HELD-OUT enforcement…".
- Criterion: CONTAMINATION controls — a family whose content hash is contaminated refuses trials (`contaminated`); contamination discovered AFTER recording excludes those trials from every aggregate and is counted in `excludedContaminatedTrials`.
  - Evidence: test "CONTAMINATION: a contaminated family refuses trials; contamination found later excludes recorded trials and is counted".
- Criterion: REPEATED trials + observed final state — a result without an OBSERVED outcome+evidence refuses (`observation_required`; a predicted/claimed outcome is not an observation); duplicate (family, language, attempt) refuses (`duplicate_trial`); attempts beyond the per-case budget refuse (`trial_bound_exceeded`); a verdict stays pending while any started case has fewer than the required repeats (`incomplete_released_coverage`).
  - Evidence: tests "OBSERVED final state required…", "REPEATED trials…", "VERDICT gating…".
- Criterion: SIX dimensions + transfer validity — dimension and language coverage are enforced per family (`dimension_not_in_family`, `language_not_covered`); a transfer family must reference an EXISTING registered source family+language (`transfer_source_invalid`).
  - Evidence: tests "dimension and language coverage…" and "transfer families must reference an EXISTING registered source family+language".
- Criterion: PRODUCT RELIABILITY vs GENERALIZATION separation — the report computes reliability from released-category trials and generalization from novel held-out trials as DISJOINT sets; the verdict comes from reliability alone; the generalization section carries the fixed value `not_adjudicated_by_design` and the serialized report contains no capability/AGI verdict key.
  - Evidence: test "RELIABILITY/GENERALIZATION separation: disjoint trial sets; the generalization section is not_adjudicated_by_design (no capability/AGI verdict exists)".
- Criterion: Deterministic reviewed verdicts — reviewed thresholds decide `meets_product_threshold`/`below_product_threshold` from per-dimension minimums and the overall minimum; identical inputs produce a byte-identical report (asserted by JSON equality).
  - Evidence: tests "VERDICT gating…" and "reviewed thresholds produce a BELOW verdict…".
- Criterion: Human/teacher baselines — where a family carries a baseline, the report emits `baselineComparison` (baseline, observed, delta); proven with a human baseline of 70 vs observed 80 (delta 10).
  - Evidence: test "RELIABILITY/GENERALIZATION separation…" (baseline assertions).
- Criterion: ONE context owner + bounded runs — unknown run, wrong uid and foreign workspace deny uniformly (`not_owner`, no existence leak) across trial/report/stop; an owner stop is terminal (`run_not_active` for further trials).
  - Evidence: tests "ONE context owner…" and the stop assertion in the separation test.
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; scorecards are server-owned evaluation state with no client authority surface.
  - API: N/A in the enabler; controller wiring binds validated schemas to ScorecardService at cutover; the verdict enum contains no capability/AGI value by type.
  - Backend: ScorecardService composes the lane's stance (mlgate pinned versions, usagereservation measured usage, airaflow observed-state semantics) into evaluation evidence.
  - Data: the store seam mirrors definitions/families/contamination/runs; the Cloud SQL adapter at integration resolves from scorecard_definition (unique scorecard_id+version), task_family, contamination_registry and score_run/score_trial tables.
  - Jobs/ML: the ml/evaluation lane binds real model runs to these trials at cutover; this enabler proves the contract on deterministic in-memory state and claims NO capability from it.

## What this task deliberately does NOT claim

No runtime capability or AGI/generalization claim is completed by this task (KAN-142 acceptance line). The generalization section is observation-only by construction; broad-capability evidence requires independently reviewed held-out corpora and thresholds on real product surfaces — RELEASE-04 (KAN-127) and the capability gates remain open.

## Commands, exit codes, test counts and timestamps

- Scorecard compile + suite: `node scripts/scorecard-check.mjs` → tsc `tsconfig.scorecard.json` exit 0; `node --test` → 14 tests, 14 pass, 0 fail (2026-10-28).
- Lane regressions (candidate does not regress the lane; all on this candidate): `airaflow:check` (KAN-143) → 14 pass/0 fail; `modalities:check` (KAN-92) → 5/0; `deadline:check` (KAN-90) → 6/0; `usagereservation:check` (KAN-89) → 6/0; `mlgate:check` (KAN-88) → 7/0; `conversationauth:check` (KAN-86) → 6/0; `serviceidentity:check` (KAN-85) → 7/0; `providerscope:check` (KAN-84) → 4/0; `completion:check` (KAN-81) → 4/0; `sharing:check` (KAN-80) → 4/0; `runs:check` (KAN-78) → 6/0; `guidedbriefs:check` (KAN-77) → 4/0; `draftrecovery:check` (KAN-76) → 6/0; `projects:check` (KAN-75) → 5/0; `evaluation:check` (KAN-74) → 5/0; `journey:check` (KAN-73) → 8/0; `dailyplan:check` (KAN-70) → 7/0; `projections:check` (KAN-69) → 7/0; `attempts:check` (KAN-68) → 6/0; `learningsession:check` (KAN-67) → 8/0; `conceptgraph:check` (KAN-144) → 8/0; `catalogadapter:check` (KAN-63) → 7/0; `coverage:check` (KAN-65) → 7/0; `mediagate:check` (KAN-66) → 7/0; `retrievalgate:check` (KAN-64) → 6/0; `qualityscope:check` (KAN-138) → 6/0; `mlresilience:check` (KAN-91) → 4/0; `contextassembly:check` (KAN-149) → 8/0.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover (store seam is the contract).
- The suite proves the contract on deterministic in-memory families; real held-out corpora, contamination scans of actual teaching content, and human/teacher baseline sessions are cutover work gated by the linked hosted/evaluation gates.
- Score aggregation is mean-based with reviewed thresholds; weighting or per-language breakdowns are future versions of the scorecard (append-only by design).
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
