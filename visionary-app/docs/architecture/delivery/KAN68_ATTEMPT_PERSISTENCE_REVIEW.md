# KAN-68 — LEARN-02 — persist checks, answers, attempts, rubric/evidence references and revision history; validate eligibility server-side and deduplicate repeat submissions

## Task review and verification handoff

Jira key / source ID: KAN-68 (LEARN-02)
Acceptance scope: feature-enabler (backend-owned private attempt persistence; wired into the connected runtime/UI at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-68-attempt-persistence`; based on the latest lane head `e69bab61` (KAN-67 LEARN-01 learning sessions), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-68-attempt-persistence`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/attempts/attempt-types.ts` (AttemptOwner, CheckRef, EvidenceRefs, Attempt, AttemptHistoryEntry, AttemptOutcome, SubmitResult, AttemptDenial, AttemptError)
- `backend/upstream/backend/src/attempts/attempt-lookups.ts` (AttemptEligibilityLookup + AttemptStore seams + InMemoryAttemptStore contract-true append-only history)
- `backend/upstream/backend/src/attempts/attempt-service.ts` (AttemptService — submit with server-side eligibility + dedup, attemptsFor, historyFor)
- `backend/upstream/backend/src/attempts/index.ts`
- `backend/upstream/backend/tsconfig.attempts.json`
- `backend/tests/contracts/attempts/attempt-persistence.test.mjs` (LEARN-02 suite, 6 tests)
- `scripts/attempts-check.mjs`, `package.json` (`attempts:check`)
Prerequisites: parent KAN-7 (P05); LEARN-01 (KAN-67, in Testing on this lane) is the session foundation the attempts bind to; base is the lane head (KAN-63→66→144→67 lineage). LEARN-02 blocks LEARN-03 (KAN-69), LEARN-11 (KAN-147) and LEARN-13 (KAN-153).

## Requirement

Persist checks, answers, attempts, rubric/evidence references and revision history; validate eligibility server-side and deduplicate repeat submissions. Exit: distinct learning evidence the projections (LEARN-03) can trust. D-085 trace: private attempts, revisions, due review and distinct learning evidence.

## Acceptance criteria → evidence

- Criterion: eligibility validated SERVER-SIDE before recording — owned active session, released (concept, source revision), existing check; denials record nothing and consume no attempt number.
  - Evidence: test "eligibility validated server-side: owned session + released revision + existing check; denial records nothing and consumes no attempt".
- Criterion: wrong uid/workspace denied before anything persists (private attempts).
  - Evidence: test "wrong uid/workspace denied before anything persists".
- Criterion: repeat submissions deduplicate by client submission id — same attempt number returned, no duplicate attempt rows, no duplicate history entries.
  - Evidence: test "repeat submissions deduplicate by submission id: same attempt number, no duplicate row".
- Criterion: attempt numbering derives from ACCEPTED submissions only, per check; denied submissions never inflate numbering.
  - Evidence: test "attempt numbers derive from ACCEPTED submissions only, per check".
- Criterion: rubric/evidence references and answers preserved verbatim with exact read-back.
  - Evidence: test "rubric/evidence references and answers are preserved verbatim with read-back".
- Criterion: revision history is immutable and append-only — the earliest entry stays byte-identical after later appends.
  - Evidence: test "revision history is immutable and append-only; earlier entries never rewritten".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; Practice/learningPipeline submit and review flows consume the attempt service at cutover.
  - API: N/A in the enabler; submission controllers call the service at cutover with validated schema and submission-id idempotency.
  - Backend: AttemptService implements server-side eligibility, dedup and append-only evidence.
  - Data: in-memory store mirrors private attempts/revision history/command outcomes; Cloud SQL adapter at integration resolves from owned attempt/revision tables.
  - Jobs/ML: reviewed feedback/remediation proposals (AI lane) consume these attempts as evidence at cutover; no posterior-only mastery from consumption.

## Commands, exit codes, test counts and timestamps

- Attempt persistence compile + suite: `node scripts/attempts-check.mjs` → tsc `tsconfig.attempts.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-27).
- Lane regressions (unchanged base; candidate does not regress the lane): `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Attempt scoring/rubric evaluation is a separate review concern; this enabler persists evidence-backed attempts, not scores.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-68 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: LEARN-03 (KAN-69) versioned mastery/progress/review projections from immutable evidence; the LEARN lane continues KAN-67→68→69→70→72→73→74→145→147→148.
