# KAN-91 — AI-09 — remove raw private-text logging; classroom/NAT fairness, provider 429/outage handling, and policy revocation honored mid-run

## Task review and verification handoff

Jira key / source ID: KAN-91 (AI-09)
Acceptance scope: feature-enabler (backend-owned ML resilience domain; wired into the connected ML/runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-91-redaction-resilience`; based on the latest lane head `f4167263` (KAN-138 AI-12 scoped quality collection), per D-098 — the next task creates its worktree from the latest working worktree. AI-09 was blocked by AI-12, which is now implemented on this lane.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-91-redaction-resilience`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/mlresilience/ml-resilience-types.ts` (MlRunCaller, RedactedLogRecord, RevokedRunOutcome, ResilienceError)
- `backend/upstream/backend/src/mlresilience/ml-resilience-lookups.ts` (ResilienceStore seam with atomic egress-window critical section + InMemoryResilienceStore contract-true state)
- `backend/upstream/backend/src/mlresilience/ml-resilience.ts` (MlResilienceService — redactForLog, containsRawText proof, acquireProviderSlot, onProviderResponse, checkpointRun)
- `backend/upstream/backend/src/mlresilience/index.ts`
- `backend/upstream/backend/tsconfig.mlresilience.json`
- `backend/tests/contracts/mlresilience/ml-resilience.test.mjs` (AI-09 suite, 4 tests)
- `scripts/mlresilience-check.mjs`, `package.json` (`mlresilience:check`)
Prerequisites: parent KAN-9; AI-12 (KAN-138, in Testing on this lane) is the recorded prerequisite; the lane head is the base. The ML lane (ml/upstream) binds its logging, scheduling, and run checkpoints to this service at cutover.

## Requirement

Remove raw private-text logging; test classroom/NAT fairness, provider 429/outage handling, and policy revocation honored mid-run. Exit: evaluated, authorized assistance with bounded costs and no cross-user leakage. D-085: redacted telemetry; no cross-user leakage.

## Acceptance criteria → evidence

- Criterion: NO raw private text in logs — every private string becomes a typed length-noting placeholder (`learner_text:<len:N>`); the original content appears nowhere in the record (provably absent, not truncated or hashed).
  - Evidence: test "NO raw private text in logs: private strings become typed length-noting placeholders, provably absent".
- Criterion: classroom/NAT fairness — a shared egress window caps the aggregate rate atomically; one learner cannot starve the classroom; exhausted windows refuse honestly (`egress_window_exhausted`); other egresses are unaffected (no cross-egress leakage).
  - Evidence: test "classroom/NAT fairness: a shared egress window caps the aggregate rate — one learner cannot starve the classroom".
- Criterion: provider 429/outage handling — honest refusals (`provider_rate_limited` / `provider_outage`), no silent degradation, no retry storm inside the request.
  - Evidence: test "provider 429/outage: honest refusals, no silent degradation".
- Criterion: policy revocation honored mid-run — the checkpoint stops the run with the produced partial kept partial (`final: false`, reason `policy_revoked`); an active policy keeps the run going.
  - Evidence: test "policy revocation mid-run stops the run: partial stays partial, no further work".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; surfaced refusals render honest retry states.
  - API: N/A in the enabler; ML runtime calls the redactor for every log record and the slot/checkpoint services around provider work at cutover.
  - Backend: MlResilienceService implements redaction, fair egress scheduling, honest provider failure handling, and mid-run revocation.
  - Data: in-memory store mirrors policy state + egress windows; Cloud SQL adapter at integration resolves from policy/egress tables (the egress critical section mirrors with a transaction).
  - Jobs/ML: the ML lane (ml/upstream) binds logging/scheduling/checkpoints to this service at cutover; KAN-89 usage settlement and KAN-90 deadline semantics compose at the termination point.

## Commands, exit codes, test counts and timestamps

- ML resilience compile + suite: `node scripts/mlresilience-check.mjs` → tsc `tsconfig.mlresilience.json` exit 0; `node --test` → 4 tests, 4 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `qualityscope:check` (KAN-138) → 6 pass/0 fail; `modalities:check` (KAN-92) → 5 pass/0 fail; `deadline:check` (KAN-90) → 6 pass/0 fail; `usagereservation:check` (KAN-89) → 6 pass/0 fail; `mlgate:check` (KAN-88) → 7 pass/0 fail; `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Real classroom/NAT load and provider 429/outage behavior need hosted verification; local tests prove the contract, not the hosted gates.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-91 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: AI-15 (KAN-149) qualify imported ingestion/retrieval behind product adapters with recorded provenance patches; the lane continues through the remaining AI tasks.
