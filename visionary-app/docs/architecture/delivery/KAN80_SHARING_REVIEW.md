# KAN-80 — BUILD-06 — exact-revision accepted-recipient sharing, consent-bound parent summaries and classroom-copy bridge; private drafts/conversations/history stay private

## Task review and verification handoff

Jira key / source ID: KAN-80 (BUILD-06)
Acceptance scope: feature-enabler (backend-owned explicit sharing domain; wired into the connected runtime/UI at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-80-explicit-sharing`; based on the latest lane head `e09fb72d` (KAN-78 BUILD-04 durable runs), per D-098 — the next task creates its worktree from the latest working worktree. (BUILD-05 / KAN-79 remains blocked by FILE-03 per the manifest and was skipped for this eligible task.)
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-80-explicit-sharing`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/sharing/sharing-types.ts` (ShareOwner, RevisionShare, ParentSummaryRequest, SharingError)
- `backend/upstream/backend/src/sharing/sharing-lookups.ts` (SharingStore seam + InMemorySharingStore contract-true state with private-state quarantine)
- `backend/upstream/backend/src/sharing/sharing-service.ts` (SharingService — shareRevision, viewShared, parentSummary with consent gate, classroomCopy with privacy assertion)
- `backend/upstream/backend/src/sharing/index.ts`
- `backend/upstream/backend/tsconfig.sharing.json`
- `backend/tests/contracts/sharing/sharing.test.mjs` (BUILD-06 suite, 4 tests)
- `scripts/sharing-check.mjs`, `package.json` (`sharing:check`)
Prerequisites: parent KAN-8 (P06); BUILD-01 (KAN-75, in Testing on this lane) supplies the exact-revision model shares bind to.

## Requirement

Implement exact-revision accepted-recipient sharing, consent-bound parent summaries and classroom-copy bridge; private drafts/conversations/history stay private. Exit: current-document Build is server-backed without weakening existing privacy/recovery rules. D-085: private projects, conditional revisions, proposal acceptance and EXPLICIT distribution.

## Acceptance criteria → evidence

- Criterion: sharing binds ONE exact revision — later private edits never leak into an existing share (the recipient sees exactly the shared revision, nothing newer).
  - Evidence: test "sharing binds ONE exact revision; later private edits never leak into the share".
- Criterion: recipients are ACCEPTED — a non-listed actor is denied (`recipient_not_accepted`); unknown shares/revisions fail closed.
  - Evidence: test "only ACCEPTED recipients can view; non-listed actors denied; unknown shares fail closed".
- Criterion: parent summaries are CONSENT-BOUND — generation proceeds only while guardian consent is active; revoked/expired consent blocks immediately (`consent_not_active`).
  - Evidence: test "parent summaries are consent-bound: revoked/expired consent blocks generation immediately".
- Criterion: classroom-copy bridge — the teacher's copy is a NEW private project owned by the class containing ONLY the shared revision payload; the original's private drafts/conversations/history never cross (`privateStateCopied: false` asserted); non-recipients cannot copy.
  - Evidence: test "classroom copy creates a NEW private project with ONLY the shared revision payload; private state never crosses".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; ArtifactStudio share/classroom surfaces consume the service at cutover.
  - API: N/A in the enabler; sharing controllers call the service at cutover with validated schema.
  - Backend: SharingService implements exact-revision, accepted-recipient, consent-bound distribution.
  - Data: in-memory store mirrors shares/consents/summaries with private-state quarantine; Cloud SQL adapter at integration resolves from share/consent/summary tables.
  - Jobs/ML: share/consent events flow through the owning-store outbox at cutover; aggregate suppression for parent summaries stays a reporting-lane concern.

## Commands, exit codes, test counts and timestamps

- Sharing compile + suite: `node scripts/sharing-check.mjs` → tsc `tsconfig.sharing.json` exit 0; `node --test` → 4 tests, 4 pass, 0 fail (2026-10-27).
- Lane regressions (unchanged base; candidate does not regress the lane): `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Guardian consent lifecycle (grant/renew/revoke UX) is the consent lane's concern; this enforcer fails closed on consent state.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-80 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: BUILD-07 (KAN-81) completion criteria / professional self-review versioning; BUILD-05 (KAN-79) stays blocked by FILE-03.
