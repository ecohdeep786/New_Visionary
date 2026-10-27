# KAN-77 — BUILD-03 — verified guided briefs pinned to objective/source/rubric/check/practice evidence; keep blank projects available without guided-learning gates

## Task review and verification handoff

Jira key / source ID: KAN-77 (BUILD-03)
Acceptance scope: feature-enabler (backend-owned guided-brief domain; wired into the connected runtime/UI at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-77-guided-briefs`; based on the latest lane head `2845ba6b` (KAN-76 BUILD-02 draft recovery), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-77-guided-briefs`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/guidedbriefs/guided-brief-types.ts` (BriefOwner, BriefPins, GuidedBrief, GuidedBriefError)
- `backend/upstream/backend/src/guidedbriefs/guided-brief-lookups.ts` (BriefEvidenceLookup + GuidedBriefStore seams + InMemoryGuidedBriefStore contract-true immutable versions)
- `backend/upstream/backend/src/guidedbriefs/guided-brief-service.ts` (GuidedBriefService — createBrief with full server-side pin verification, amendBrief appending immutable versions)
- `backend/upstream/backend/src/guidedbriefs/index.ts`
- `backend/upstream/backend/tsconfig.guidedbriefs.json`
- `backend/tests/contracts/guidedbriefs/guided-brief.test.mjs` (BUILD-03 suite, 4 tests)
- `scripts/guidedbriefs-check.mjs`, `package.json` (`guidedbriefs:check`)
Prerequisites: parent KAN-8 (P06); LEARN-08 (KAN-74, in Testing on this lane) supplies the assessed/check evidence the briefs pin; BUILD-01/02 (in Testing on this lane) supply the project/draft foundations.

## Requirement

Implement verified guided briefs pinned to objective/source/rubric/check/practice evidence; keep blank projects available without guided-learning gates. Exit: current-document Build is server-backed without weakening existing privacy/recovery rules. D-085/Doc 13: guided creation tied to permitted concepts; a generated brief is not committed product state until it verifies.

## Acceptance criteria → evidence

- Criterion: blank projects stay available WITHOUT guided-learning gates — a project with no brief requires no evidence, no verification and no gate (guided learning is an optional layer, never a precondition).
  - Evidence: test "blank projects stay available without guided-learning gates: no brief requires no evidence and no verification".
- Criterion: a guided brief verifies EVERY pin server-side before committing — released (concept, source revision), existing rubric, existing check, owner-bound practice evidence; unprovable evidence refuses (fail closed).
  - Evidence: test "a guided brief verifies EVERY pin server-side before committing; unprovable evidence refused".
- Criterion: the pinned evidence digest travels with the brief; amendments append immutable versions with the previous version byte-stable; the digest tracks the pinned set.
  - Evidence: test "amendments append immutable versions; previous versions stay byte-stable; digest changes with pins".
- Criterion: wrong users denied; unknown projects refused (owner-scoped).
  - Evidence: test "wrong users denied; unknown projects refused".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; ArtifactStudio guided flows consume briefs at cutover; the blank-project path renders with no gate.
  - API: N/A in the enabler; brief controllers call the service at cutover with validated schema.
  - Backend: GuidedBriefService implements evidence-pinned, verified, versioned briefs.
  - Data: in-memory store mirrors briefs + evidence facts; Cloud SQL adapter at integration resolves from brief tables plus the LEARN-08/CONTENT evidence tables.
  - Jobs/ML: guided creation/critique proposals (AI lane) bind to verified briefs at cutover; a generated brief is not committed product state until it verifies here.

## Commands, exit codes, test counts and timestamps

- Guided briefs compile + suite: `node scripts/guidedbriefs-check.mjs` → tsc `tsconfig.guidedbriefs.json` exit 0; `node --test` → 4 tests, 4 pass, 0 fail (2026-10-27).
- Lane regressions (unchanged base; candidate does not regress the lane): `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Brief generation (AI proposals) is a separate AI-lane concern; this enabler owns verification/pinning of briefs.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-77 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: BUILD-04 (KAN-78) durable runs/proposal contracts (BUILD-01 in Testing on this lane); the next eligible task is selected from live Jira before assignment.
