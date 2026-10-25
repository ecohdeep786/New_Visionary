# KAN-42 — DATA-07 — owner-scoped repositories/DTOs, paginated UID account/domain projections

## Task review and verification handoff

Jira key / source ID: KAN-42 (DATA-07)
Acceptance scope: enabler (owner-scoped repository/DTO layer + paginated projections + redaction; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: deepseek (senior backend engineer)
Reviewer: codex (senior agent) — must explicitly accept responsibility; an implementer cannot self-approve
Worker branch / candidate head: `codex/deepseek-kan-42-owner-projections`
Owned files / contracts:
- `backend/upstream/backend/src/overview/overview-types.ts`
- `backend/upstream/backend/src/overview/overview-store.ts` (contract + in-memory + owner-scoped query enforcement)
- `backend/upstream/backend/src/overview/overview.service.ts`
- `backend/upstream/backend/src/overview/overview.controller.ts` (NestJS, compiles at integration cutover)
- `backend/upstream/backend/src/overview/overview.module.ts`
- `backend/upstream/backend/src/overview/index.ts`
- `backend/upstream/backend/tsconfig.data.json`
- `backend/tests/contracts/data-07/overview.test.mjs`
Prerequisites: DATA-01 DDL pillars (persons/workspaces/memberships/consent_grants/command_results/audit_events/outbox_events/deletion_tombstones) as adopted at integration; verified OWNER/ADMIN authority via DATA-04 membership model.

## Requirement

Implement owner-scoped repositories/DTOs and paginated UID account/domain overview projections; **redact private security fields and avoid one unlimited user-history document**. Exit: every domain command is server-authorized and transactionally scoped.

## Acceptance criteria → evidence

- Criterion: owner-scoped repository reads — a caller only ever sees rows where the uid is the subject (membership, consent, command history, audit) or belongs to a workspace the uid is a member of / created. No role bucket, guessed id or browser record grants visibility.
  - Evidence: tests "workspaces are only those the uid created or belongs to; a guest sees nothing", "a foreign uid sees no account data", "a foreign cursor yields an empty page, never another user's rows".
- Criterion: DTOs redact private security fields (tokens, session ids, raw IP, user agent, payment identifiers) — they never appear in any projection.
  - Evidence: tests "redaction: no private security field (token/session/ip/userAgent) appears in any projection", "overview ... redacted" listing refresh_token/session_id; HTTP proof hasToken=false on the live response.
- Criterion: avoid one unlimited user-history document — history is cursor-paginated and bounded (MAX_PAGE_SIZE 50), no unbounded page is returned.
  - Evidence: test "history is cursor-paginated, bounded, and never an unlimited document" (25 seeded rows → 10/10/5 pages); HTTP proof paginates 10/10 with nextCursor.
- Criterion: invalid page size or malformed cursor is rejected; a foreign cursor returns empty, leaking nothing.
  - Evidence: tests "invalid page size or cursor is rejected with no partial data", "a foreign cursor yields an empty page, never another user's rows".
- Criterion: API surface is wired as a NestJS controller (`/api/overview`) with server-verified uid; customer-visible projections carry `asOf` and redacted marking.
  - Evidence: `overview.controller.ts` extends ProductRequestAuthority; full `nest build` includes the module (dist/src/overview/*).
- Frontend → API → backend → data outcome:
  - Frontend: N/A (enabler; frontend /dashboard adapters connect at later cutover).
  - API: `/api/overview`, `/api/overview/history`, `/api/overview.audit` controller present.
  - Backend: OverviewService + OverviewStore contract (implemented).
  - Data: in-memory contract store; Cloud SQL adapter (Prisma over persons/workspaces/memberships/consent_grants/command_results/audit_events) is the integration-time swap.
  - ML/jobs: projections are read-only; no ML/job path in this enabler.

## Commands, exit codes, test counts and timestamps

- Compile (pure modules): `tsc --project backend/upstream/backend/tsconfig.data.json --typeRoots .../@types --types node --skipLibCheck` → exit 0.
- Full product build: `npm run build` (nest build, whole backend) → exit 0, dist/src/overview emitted.
- Tests: `node --test backend/tests/contracts/data-07/overview.test.mjs` → 8 tests, 8 pass, 0 fail (2026-10-25).
- Runtime HTTP proof: compiled OverviewService behind real HTTP server → `/api/overview` returns redacted owner-scoped projection; history paginates 10/10 with cursor (2026-10-25).

## Remaining defects, limitations and linked open gates

- NestJS controller is present but not mounted in `app.module` (enabler cutover is later, separately reviewed integration, matching DATA-01..06).
- No live Cloud SQL/Firestore used; in-memory store stands in for the real repository adapter. Hosted verification and Cloud SQL provisioning remain out of scope for an enabler.
- Pagination cursors are id-based (stable in SQL); Firestore adapter will carry the same contract for account tree pagination.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (codex)
- Verification result: pending
- Dev integration commit and checks: (after review)
- Jira transition/comment receipt: KAN-42 → Testing (transition 41)
- Next dependent task: DATA-08 (KAN-43) concurrent/wrong-authority enforcement, then DATA-09 (KAN-44) admission.
