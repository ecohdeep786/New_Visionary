# KAN-143 — AI-14 — AIRA deterministic teaching/workflow harness over the durable run protocol

## Task review and verification handoff

Jira key / source ID: KAN-143 (AI-14)
Acceptance scope: feature-enabler (backend-owned bounded workflow/agent harness domain; wired into the connected teaching/Build runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-143-deterministic-aira`; based on the latest lane head `eb2087c8` (KAN-149 AI-15 context assembly), per D-098 — the lane's most recent verified lane head on origin (lane lineage KAN-83 → 84 → 85 → 86 → 88 → 89 → 90 → 92 → 138 → 91 → 149).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-143-deterministic-aira`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/airaflow/airaflow-types.ts` (FlowOwner, ToolSpec, PinnedVersions, FlowStep, AiraFlow, ToolExecution, AiraFlowError; BannedToolFamily is a distinct union — charging/publishing/grading/private_data can never satisfy AllowedToolFamily)
- `backend/upstream/backend/src/airaflow/airaflow-lookups.ts` (AiraFlowStore seam + InMemoryAiraFlowStore contract-true state: typed registry, per-call capability grants, measured usage ledger, exactly-once effect ledger, append-only checkpoints)
- `backend/upstream/backend/src/airaflow/airaflow-service.ts` (AiraFlowService — registerTool, grantCapability, startFlow, executeStep, approveStep, replan, restart, stop, getFlow)
- `backend/upstream/backend/src/airaflow/index.ts`
- `backend/upstream/backend/tsconfig.airaflow.json`
- `backend/tests/contracts/airaflow/airaflow.test.mjs` (AI-14 suite, 14 tests)
- `scripts/airaflow-check.mjs`, `package.json` (`airaflow:check`)
Prerequisites: parent KAN-9; the lane head (CONTENT+LEARN+BUILD+AI lineage through KAN-149) is the base. AI-03 (KAN-85), AI-05 (KAN-87), AI-06 (KAN-88), AI-07 (KAN-89), JOB-02 (KAN-54) and BUILD-04 (KAN-78) are implemented on this lane; BUILD-04's durable run protocol (`src/runs`) is the substrate this harness extends.

## Requirement

Implement the AIRA deterministic teaching/workflow orchestrator over the durable run protocol: one context owner, typed allowlisted tools, server policy checks per call, pinned source/model/prompt/tool versions, bounded branches/retries, checkpoint/restart, explicit pause/resume/approval and stop conditions, and exactly one accepted product side effect with measured usage. No open-ended autonomous agent, charging, publishing, grading or private-data access; model plans/memory remain provisional (source: docs/architecture/BACKEND_LAUNCH_CHECKLIST.md AI-14; KAN-143 description).

## Acceptance criteria → evidence

- Criterion: ONE context owner — the flow records one server-recorded owner; unknown run, wrong uid and foreign workspace deny uniformly (`not_owner`, no existence leak) across execute/approve/restart/stop.
  - Evidence: test "ONE context owner: wrong uid, unknown run and foreign workspace are denied uniformly (no existence leak)".
- Criterion: TYPED ALLOWLISTED tools — unregistered tools refuse (`tool_not_allowlisted`); the typed plan is schema-checked at intake (`schema_invalid`); an empty plan refuses (`plan_empty`).
  - Evidence: test "TYPED ALLOWLISTED tools only; the typed plan is schema-checked at intake".
- Criterion: NO autonomous charging/publishing/grading/private-data access — the registry refuses every banned family at registration (`tool_forbidden`), so the banned product acts are not expressible as tools at all.
  - Evidence: test "BANNED product families are refused at registration — autonomous charging/publishing/grading/private-data access is not expressible".
- Criterion: SERVER capability checks on EVERY call — an ungranted capability refuses even when allowlisted, owned and schema-valid (`capability_required`); the step stays pending (no silent skip); granting server-side lets the same call proceed.
  - Evidence: test "SERVER capability checks on EVERY call: an ungranted capability refuses even when allowlisted, owned and schema-valid".
- Criterion: PINNED source/model/prompt/tool versions — start binds to the SERVER-RECORDED current versions (`version_drift` at start on mismatch); source-revision and registry-version drift refuse every later call; the pins stay byte-identical after start.
  - Evidence: test "PINNED versions: server-recorded drift refuses every call; the pins stay immutable after start".
- Criterion: BOUNDED branches/retries — a plan beyond the step budget refuses at start (`branch_bound_exceeded`); a third attempt beyond the attempt bound refuses (`retry_bound_exceeded`); observed failures are recorded with attempts counted.
  - Evidence: test "BOUNDED branches/retries: the step budget bounds the whole flow; a step retried beyond the attempt bound refuses".
- Criterion: EXPLICIT pause/resume/approval — an approval-required tool pauses the run (`approval_required`; status `paused_awaiting_approval`); execution while paused refuses (`flow_not_active`); a non-owner approval denies; the owner's explicit approval resumes and the step then executes.
  - Evidence: test "EXPLICIT pause/resume/approval: an approval-required tool pauses the run; only the OWNER resumes it".
- Criterion: CHECKPOINT/RESTART — every accepted step appends an immutable checkpoint; restart resumes from the LAST checkpoint with succeeded steps byte-stable (observed outcomes, measured usage and pins preserved) and lost in-flight state restored.
  - Evidence: test "CHECKPOINT/RESTART: a restart resumes from the LAST checkpoint — succeeded steps byte-stable, lost state restored".
- Criterion: EXACTLY-ONCE accepted product side effects with measured usage — the effect ledger keys on (runId, stepId); a crash window after application but before state save converges on retry to `duplicate` (`exactly_once_duplicate_preserved`), the effect applies EXACTLY once and the usage ledger debits exactly once (never twice).
  - Evidence: test "EXACTLY-ONCE product effects: a crash-window retry converges to duplicate; the effect applies exactly once and usage is debited once".
- Criterion: MEASURED usage + STOP conditions — the flow's measured usage equals executed tool costs and the store ledger debited the same; exhausting the usage budget is a terminal stop (`usage_exhausted` → `stopped`; no further transitions); an owner stop is terminal; an all-terminal step list with a latest observed success completes the flow.
  - Evidence: tests "MEASURED usage: the flow measures executed costs; exhausting the usage budget is a terminal stop condition" and "STOP conditions: an owner stop is terminal, and final-step success completes the flow".
- Criterion: SAFE replanning — a replacement is accepted only for an OBSERVED failure (`replan_requires_observed_failure` for pending/succeeded steps), records `replacesStepId`, stays within the branch bound, and the failed step keeps the run open until the owner stops or remaining steps complete.
  - Evidence: test "SAFE replanning: a replacement is accepted only after an OBSERVED failure and stays within the branch bound".
- Criterion: MODEL plans/memory stay PROVISIONAL — unexecuted plan steps produce no product state (effect count 0) and no usage; executing a step is what converts exactly that step into observed, non-provisional server state.
  - Evidence: test "MODEL plans stay provisional: unexecuted steps produce no product state and no usage".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; the harness has no client surface — every authority decision is server-side (continues the AI-03/04 stance: the browser is never the authority).
  - API: N/A in the enabler; controller wiring binds validated schemas to AiraFlowService at cutover with the same per-call checks.
  - Backend: AiraFlowService extends the BUILD-04 durable run protocol (`src/runs`) with the bounded harness; run/event/immutability semantics inherited.
  - Data: the store seam mirrors registries/grants/usage/effects/checkpoints; the Cloud SQL adapter at integration resolves from flow/step/checkpoint/effect/usage tables with the effect ledger UNIQUE(run_id, step_id) and atomic apply.
  - Jobs/ML: usage measurement follows the KAN-89 measured-ledger stance (the store ledger is the authority; the flow carries a projection); model plans enter only through `startFlow`/`replan` and never self-authorize.

## Commands, exit codes, test counts and timestamps

- AIRA flow harness compile + suite: `node scripts/airaflow-check.mjs` → tsc `tsconfig.airaflow.json` exit 0; `node --test` → 14 tests, 14 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `modalities:check` (KAN-92) → 5 pass/0 fail; `deadline:check` (KAN-90) → 6 pass/0 fail; `usagereservation:check` (KAN-89) → 6 pass/0 fail; `mlgate:check` (KAN-88) → 7 pass/0 fail; `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail; `qualityscope:check` (KAN-138) → 6 pass/0 fail; `mlresilience:check` (KAN-91) → 4 pass/0 fail; `contextassembly:check` (KAN-149) → 8 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Sequence decision record (founder-requested, non-random selection)

The task selection cross-checked three sources instead of trusting Jira statuses alone:
1. Live Jira (2026-10-28): AI-01..AI-12 all Testing (awaiting separate review per D-095 — cannot be self-closed); AI-11 (KAN-137) Done; KAN-142/KAN-143 To Do; KAN-150 shows Testing.
2. Implementation evidence: KAN-150 (AI-16) has NO branch, NO worktree and NO candidate commit anywhere local or on origin — its Testing status is STALE (the same stale-status condition KAN-149 documented and corrected at its start). KAN-139 (SYNC-01, a KAN-150 prerequisite) is also unimplemented, so AI-16 is doubly unavailable.
3. Canonical dependency order (docs/architecture/tracking/delivery-schedule.json `order`): AI-16 (88) blocked → AI-18/KAN-156 (90) externally gated ("Licensed/consented corpus and qualified language/meaning reviewers") → AI-14/KAN-143 (117) READY (prerequisites AI-03/05/06/07 + JOB-02 + BUILD-04 all implemented on this lane) and unblocks AI-13/KAN-142 (121).
Therefore AI-14 (KAN-143) is the next-in-sequence backend task, not a random pick. This record also flags for the founder: KAN-150's Testing status should be corrected to To Do (no implementation exists), and KAN-147 (LEARN-11, order 65) is the earliest ready task outside the AI lane if a second active window is opened.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover (store seam is the contract).
- The product-effect execution window (applyEffect → executeTool) is a single transaction at integration; the contract suite exercises the crash window through the exactly-once ledger only.
- Usage is measured per fresh execution (duplicate replays cost nothing); reservation-grade quota admission remains KAN-89's `usagereservation` domain at integration.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates. No AGI or runtime-capability claim is completed by this task (AI-13/KAN-142 owns the measured scorecard).

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
