# KAN-74 — LEARN-08 — evaluate checks/practice using server-owned versioned criteria and protected answer keys; client pass/score/completion flags never authoritative

## Task review and verification handoff

Jira key / source ID: KAN-74 (LEARN-08)
Acceptance scope: feature-enabler (backend-owned evaluation domain; wired into the connected runtime/UI at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-74-criteria-evaluation`; based on the latest lane head `56992975` (KAN-73 LEARN-07 journey verification), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-74-criteria-evaluation`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/evaluation/evaluation-types.ts` (EvaluationOwner, CheckRef, AnswerKey, EvaluationCriteria, ClientClaim, EvaluationResult, EvaluationError)
- `backend/upstream/backend/src/evaluation/evaluation-lookups.ts` (EvaluationStore seam + InMemoryEvaluationStore contract-true state; the key never leaves the store)
- `backend/upstream/backend/src/evaluation/evaluation-service.ts` (EvaluationService — evaluate with claim-overrule semantics, verdictDigest for reproducible scoring)
- `backend/upstream/backend/src/evaluation/index.ts`
- `backend/upstream/backend/tsconfig.evaluation.json`
- `backend/tests/contracts/evaluation/evaluation.test.mjs` (LEARN-08 suite, 5 tests)
- `scripts/evaluation-check.mjs`, `package.json` (`evaluation:check`)
Prerequisites: parent KAN-7 (P05); the LEARN lane head (KAN-67/68/69/70/73 lineage) is the base — evaluation appends the assessed outcomes LEARN-03 projections consume.

## Requirement

Evaluate checks/practice using server-owned versioned criteria and protected answer keys. Client pass/score/completion flags never authoritative. D-085/Doc 20: reproducible scoring, qualified source-weighted readiness; no rank band without an approved reference distribution.

## Acceptance criteria → evidence

- Criterion: the server verdict comes from the protected key + versioned criteria; scoring is REPRODUCIBLE (identical answer/key/criteria yield identical verdict digests).
  - Evidence: test "server verdict from protected key + versioned criteria; reproducible scoring (same inputs => identical verdict)".
- Criterion: client pass/score/completion claims are NEVER authoritative — a disagreeing claim is recorded as `claimOverruled` and never flips the server verdict (in either direction).
  - Evidence: test "client pass/score/completion claims are NEVER authoritative — a disagreeing claim is overruled".
- Criterion: the answer key never leaves the store — evaluation results expose only awarded/points/passed/criteriaVersion, never the key or the correct answer.
  - Evidence: test "the answer key never leaves the store — results expose only awarded/points/passed".
- Criterion: every evaluation appends an immutable assessed outcome whose rubric reference IS the criteria version (the mastery evidence LEARN-03 consumes); earlier outcomes unchanged after later appends.
  - Evidence: test "every evaluation appends an immutable assessed outcome whose rubric ref is the criteria version".
- Criterion: unknown check or criteria refused (fail closed).
  - Evidence: test "unknown check or criteria refused (fail closed)".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; Practice/checks surfaces display server verdicts at cutover — client flags render as claims only.
  - API: N/A in the enabler; evaluation controllers call the service at cutover with validated schema.
  - Backend: EvaluationService implements protected-key, versioned-criteria, claim-overrule evaluation.
  - Data: in-memory store mirrors protected keys/versioned criteria/assessed outcomes; Cloud SQL adapter at integration resolves from criteria/answer_key/outcome tables.
  - Jobs/ML: reviewed feedback/remediation proposals (AI lane) consume assessed outcomes at cutover; no model confidence decides mastery.

## Commands, exit codes, test counts and timestamps

- Evaluation compile + suite: `node scripts/evaluation-check.mjs` → tsc `tsconfig.evaluation.json` exit 0; `node --test` → 5 tests, 5 pass, 0 fail (2026-10-27).
- Lane regressions (unchanged base; candidate does not regress the lane): `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Scoring here is exact-match against the protected key; rubric-scored free responses and calibrated exam weights are separate review concerns (Doc 20 gates).
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-74 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: LEARN-09 (KAN-145, Done) and LEARN-11/12/13 remain gated by SYNC-02/JOB-01 prerequisites per the manifest; the next eligible task is selected from live Jira before assignment.
