# KAN-81 — BUILD-07 — preserve completion criteria and professional self-review versioning; application evidence remains unverified until assessment and never awards mastery automatically

## Task review and verification handoff

Jira key / source ID: KAN-81 (BUILD-07)
Acceptance scope: feature-enabler (backend-owned completion/self-review domain; wired into the connected runtime/UI at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-81-completion-criteria`; based on the latest lane head `5f2e3277` (KAN-80 BUILD-06 sharing), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-81-completion-criteria`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/completion/completion-types.ts` (ReviewOwner, CompletionCriteria, CompletionVerdict, SelfReview, ApplicationEvidence, CompletionError)
- `backend/upstream/backend/src/completion/completion-lookups.ts` (CompletionStore seam + InMemoryCompletionStore contract-true append-only state)
- `backend/upstream/backend/src/completion/completion-service.ts` (CompletionService — defineCriteria, assessCompletion, submitSelfReview, submitEvidence, recordAssessment)
- `backend/upstream/backend/src/completion/index.ts`
- `backend/upstream/backend/tsconfig.completion.json`
- `backend/tests/contracts/completion/completion.test.mjs` (BUILD-07 suite, 4 tests)
- `scripts/completion-check.mjs`, `package.json` (`completion:check`)
Prerequisites: parent KAN-8 (P06); the BUILD lane head (KAN-75/76/77/78/80 lineage) is the base; LEARN-03 semantics (assessed evidence only) are respected by the never-auto-verify rule.

## Requirement

Preserve completion criteria and professional self-review versioning; application evidence remains unverified until assessment and never awards mastery automatically. Exit: current-document Build is server-backed without weakening existing privacy/recovery rules. D-085/Doc 13: completion criteria explicit; self-review is not assessed mastery; model certainty is not learner mastery.

## Acceptance criteria → evidence

- Criterion: completion criteria are VERSIONED — amendments append versions and the completion verdict is measured against ONE explicit version, deterministically (same inputs → same verdict).
  - Evidence: test "completion criteria are versioned; amendments append versions; the verdict is measured against ONE explicit version".
- Criterion: professional self-reviews are VERSIONED and append-only — earlier versions stay byte-stable.
  - Evidence: test "professional self-reviews are versioned and append-only; earlier versions byte-stable".
- Criterion: application evidence lands `unverified` and STAYS unverified until an explicit assessment record (rubric provenance) moves it to `verified` — completing all criteria does NOT auto-verify; double assessment refused; wrong users denied.
  - Evidence: test "application evidence lands UNVERIFIED and stays unverified until explicit assessment — never auto-verified" and test "wrong users denied on assessment; unknown evidence fails closed".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; Career/portfolio completion and self-review surfaces consume the service at cutover; unverified evidence renders honestly.
  - API: N/A in the enabler; completion controllers call the service at cutover with validated schema.
  - Backend: CompletionService implements versioned criteria, versioned self-reviews, and the explicit-assessment-only verification path.
  - Data: in-memory store mirrors criteria/self-reviews/evidence; Cloud SQL adapter at integration resolves from criteria/self_review/evidence tables.
  - Jobs/ML: assessed evidence flows to LEARN-03 projections at cutover; no automatic mastery from application evidence anywhere in this domain.

## Commands, exit codes, test counts and timestamps

- Completion compile + suite: `node scripts/completion-check.mjs` → tsc `tsconfig.completion.json` exit 0; `node --test` → 4 tests, 4 pass, 0 fail (2026-10-27).
- Lane regressions (unchanged base; candidate does not regress the lane): `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Who may record assessments (assessor authority) is a ROLE-lane concern; this enabler fails closed on ownership and double-assessment.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-81 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: the BUILD lane (BUILD-01..04, 06, 07) is now implemented through this head; BUILD-05 (KAN-79) remains blocked by FILE-03; the next eligible task is selected from live Jira before assignment.
