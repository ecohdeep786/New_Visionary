# KAN-144 — CONTENT-08 — versioned prerequisite graph and verified curriculum/exam views

## Task review and verification handoff

Jira key / source ID: KAN-144 (CONTENT-08)
Acceptance scope: feature-enabler (backend-owned versioned concept/prerequisite DAG curation and source-versioned curriculum/exam views; wired into the connected runtime/UI at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-144-concept-graph`; based on the latest content lane head `306fec1d` (KAN-63 CONTENT-04 catalog adapter, which itself contains the full KAN-64→65→66 lineage), per D-098 — the next content-lane task creates its worktree from the latest working content worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-144-concept-graph`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Note: KAN-144 was found in Jira `Testing` with no implementation anywhere (no branch, no commits, no receipts); the status was stale. It was moved back to In Progress at task start and is returned to Testing now with a real candidate.
Owned files / contracts:
- `backend/upstream/backend/src/conceptgraph/concept-graph-types.ts` (CurationState, SourceClass, ConceptProvenance, CanonicalConcept, TranslationView, PrerequisiteEdge, GraphSnapshot, ExamWeight, ExamMetadata, ExamView, CurriculumView, GapQueueEntry, ConceptGraphError)
- `backend/upstream/backend/src/conceptgraph/concept-graph-lookups.ts` (ConceptGraphStore seam + InMemoryConceptGraphStore contract-true state with immutable versioned snapshots)
- `backend/upstream/backend/src/conceptgraph/concept-graph.ts` (ConceptGraphService — registerCanonical, addTranslationView, addPrerequisite with cycle rejection, snapshot/rollbackTo, curriculumView, examView, queueGap)
- `backend/upstream/backend/src/conceptgraph/index.ts`
- `backend/upstream/backend/tsconfig.conceptgraph.json`
- `backend/tests/contracts/conceptgraph/concept-graph.test.mjs` (CONTENT-08 suite, 8 tests)
- `scripts/conceptgraph-check.mjs`, `package.json` (`conceptgraph:check`)
Prerequisites: parent KAN-6 (P04); CONTENT-01 (KAN-60 catalog) and DATA-01 (KAN-36) are the recorded prerequisites; the content lane head (KAN-63→66) is the base. CONTENT-08 unblocks LEARN-09 (KAN-145) and LEARN-12 (KAN-148).

## Requirement

Implement reviewed concept/prerequisite DAG curation and source-versioned curriculum/exam views: preserve canonical concepts, official school/exam metadata, approved professional/institutional sources, edition/current-syllabus/verification provenance and rollback. Reject cycles; distinguish reviewed, provisional and unavailable coverage; a gap queue cannot invent an official syllabus or promise an unstaffed replacement deadline. (Doc 02/11/20 reconciliation.)

## Acceptance criteria → evidence

- Criterion: canonical concepts — idempotent registration per identity; conflicting duplicates refused; a translation view is locale-tagged on the SAME identity and never duplicates it.
  - Evidence: test "canonical concepts: idempotent re-register, conflicting duplicate refused; translation view never duplicates the identity".
- Criterion: acyclic prerequisites — a cycle-creating edge is rejected; self-loops and unknown concepts refused; the DAG keeps exactly the accepted edges.
  - Evidence: test "acyclic curation: prerequisite edges form a DAG — a cycle-creating edge is rejected, self-loops and unknown concepts refused".
- Criterion: versioned snapshots and rollback — rollbackTo restores an exact earlier snapshot; concepts/edges registered later do not leak back in; unknown version refused.
  - Evidence: test "versioned snapshots + rollback: rollbackTo restores an exact earlier snapshot and later edits do not leak back in".
- Criterion: coverage distinguished — reviewed (verified in this edition), provisional (registered but unverified or another edition), unavailable (referenced but no source); provisional is never presented as official coverage.
  - Evidence: tests "curriculum view distinguishes reviewed / provisional / unavailable …" and "curriculum view marks unverified concepts provisional …".
- Criterion: exam views preserve official metadata; weights without calibration provenance refused; unknown concept weights refused; per-concept coverage stays honest (reviewed vs provisional).
  - Evidence: test "exam view: official metadata preserved; weight without calibration provenance refused; unknown concept refused; coverage honest".
- Criterion: a gap queue entry never creates syllabus coverage and never promises a replacement deadline (`promisedDeadline` is always null); gap-driven coverage stays unavailable, never invented official.
  - Evidence: tests "a gap queue entry never creates syllabus coverage …" and "gap-driven coverage stays unavailable, never invented official".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; curriculum/exam views and the gap queue feed OrganizationCurriculum/contentRepository at cutover — a gap entry is never a syllabus row.
  - API: N/A in the enabler; graph/exam-view controllers call the service at cutover.
  - Backend: ConceptGraphService implements canonical DAG curation, versioned snapshots/rollback and honest views.
  - Data: in-memory store mirrors canonical concepts + prerequisite edges + versioned snapshots + exam views + gap queue; Cloud SQL adapter at integration resolves from content_nodes/prerequisite_edges/graph_snapshots.
  - Jobs/ML: review/verification events flow through the owning-store outbox at cutover; exam weights always carry calibration provenance (no rank band without an approved reference distribution).

## Commands, exit codes, test counts and timestamps

- Concept graph compile + suite: `node scripts/conceptgraph-check.mjs` → tsc `tsconfig.conceptgraph.json` exit 0; `node --test` → 8 tests, 8 pass, 0 fail (2026-10-27).
- Lane regressions (unchanged base; candidate does not regress the content lane): `node scripts/catalogadapter-check.mjs` (KAN-63 suite) → 7 pass/0 fail; `node scripts/coverage-check.mjs` (KAN-65 suite) → 7 pass/0 fail; `node scripts/mediagate-check.mjs` (KAN-66 suite) → 7 pass/0 fail; `node scripts/retrievalgate-check.mjs` (KAN-64 suite) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; the real adapter swap + controller wiring happen at cutover (canonical concepts/prerequisite edges/graph snapshots DDL resolved by DATA).
- Exam weights are validated for calibration provenance only; producing calibrated weights is a content/calibration decision, not made by this service.
- Hosted verification, real exam-board ingestion and production source-provider approval remain out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-144 In Progress at start (stale Testing corrected), → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: CONTENT-08 unblocks LEARN-09 (KAN-145) durable knowledge projection storage/replay and LEARN-12 (KAN-148); the content lane is now sequence-complete through CONTENT-08.
