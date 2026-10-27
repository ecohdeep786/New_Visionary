# KAN-69 — LEARN-03 — versioned mastery/progress/review projections from immutable evidence; distinguish consumption, attempts, self-review and assessed outcomes

## Task review and verification handoff

Jira key / source ID: KAN-69 (LEARN-03)
Acceptance scope: feature-enabler (backend-owned versioned projection domain; wired into the connected runtime/UI at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-69-mastery-projections`; based on the latest lane head `e40bc637` (KAN-68 LEARN-02 attempt persistence), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-69-mastery-projections`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/projections/projection-types.ts` (ProjectionOwner, EvidenceClass, EvidenceEvent, MasteryState, ConceptProjection, ProjectionSnapshot, ProjectionError)
- `backend/upstream/backend/src/projections/projection-lookups.ts` (EvidenceStore + SnapshotStore seams + InMemoryProjectionStore contract-true append-only evidence)
- `backend/upstream/backend/src/projections/projection-service.ts` (ProjectionService — record with rubric gate, deterministic versioned project with fingerprint caching)
- `backend/upstream/backend/src/projections/index.ts`
- `backend/upstream/backend/tsconfig.projections.json`
- `backend/tests/contracts/projections/projection.test.mjs` (LEARN-03 suite, 7 tests)
- `scripts/projections-check.mjs`, `package.json` (`projections:check`)
Prerequisites: parent KAN-7 (P05); LEARN-02 (KAN-68, in Testing on this lane) is the immutable-evidence foundation these projections read; base is the lane head (KAN-63→66→144→67→68 lineage).

## Requirement

Implement versioned mastery/progress/review projections from immutable evidence; distinguish consumption, attempts, self-review and assessed outcomes. D-085/Doc 13: do not mark taught/mastered from consumption, model confidence or probability alone; distinct learning evidence; no posterior-only mastery.

## Acceptance criteria → evidence

- Criterion: the four evidence classes (consumption / attempt / self_review / assessed) stay distinct in the projection and are never conflated.
  - Evidence: test "four evidence classes stay distinct in the projection and are never conflated".
- Criterion: only assessed outcomes with rubric evidence are mastery-eligible — consumption/self-review never mark mastery (model certainty is not learner mastery); attempted-without-assessment reports `practiced`, assessed failure reports `assessed_not_passed`.
  - Evidence: test "only assessed outcomes with rubric evidence are mastery-eligible; consumption/self-review never mark mastery".
- Criterion: projections are versioned and deterministic — identical evidence yields an identical version (fingerprint cache, no churn); new evidence advances the version.
  - Evidence: test "projections are versioned and deterministic: same evidence yields the same version; new evidence advances it".
- Criterion: evidence is immutable — projection reads never rewrite the append-only ledger.
  - Evidence: test "evidence is immutable — projection reads never rewrite the append-only ledger".
- Criterion: review scheduling carries explicit reasons and never derives from consumption.
  - Evidence: test "review scheduling has explicit reasons and never comes from consumption".
- Criterion: an assessed event without rubric provenance is refused (mastery evidence must be rubric-backed).
  - Evidence: test "an assessed event without rubric provenance is refused".
- Criterion: empty evidence reports an honest zero projection (`not_started`, nothing invented).
  - Evidence: test "empty evidence reports an honest zero projection (no invented mastery)".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; Progress/Home surfaces consume projections at cutover — consumption counts are displayed as context, never as mastery.
  - API: N/A in the enabler; projection controllers call the service at cutover.
  - Backend: ProjectionService implements deterministic versioned projections with honest mastery semantics.
  - Data: in-memory store mirrors immutable evidence events + versioned snapshots; Cloud SQL adapter at integration resolves from evidence/projection tables.
  - Jobs/ML: evaluated recommendations with reasons (ML lane) consume these projections at cutover; no posterior-only mastery.

## Commands, exit codes, test counts and timestamps

- Projection compile + suite: `node scripts/projections-check.mjs` → tsc `tsconfig.projections.json` exit 0; `node --test` → 7 tests, 7 pass, 0 fail (2026-10-27).
- Lane regressions (unchanged base; candidate does not regress the lane): `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Review scheduling here derives explicit reasons from evidence classes; spaced-repetition interval calibration is a separate product/ML decision.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-69 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: LEARN-04 (KAN-70); the LEARN lane continues KAN-67→68→69→70→72→73→74→145→147→148.
