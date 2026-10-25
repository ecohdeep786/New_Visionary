# KAN-39 — DATA-04: invitations, acceptance, verified roles, lifecycle history

## Task review and verification handoff

Jira key / source ID: KAN-39 (DATA-04)
Acceptance scope: enabler (domain modules + contract store; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: deepseek (senior backend engineer, under codex review)
Reviewer: codex (senior agent) — must explicitly accept responsibility; an implementer cannot self-approve
Worker branch / candidate head: `codex/deepseek-kan-39-invitations`
Owned files / contracts:
- `backend/upstream/backend/src/invitations/invitation-types.ts`
- `backend/upstream/backend/src/invitations/invitation-store.ts` (contract + in-memory)
- `backend/upstream/backend/src/invitations/invitation.service.ts`
- `backend/upstream/backend/src/invitations/invitation.controller.ts` (NestJS, not yet compiled into runtime)
- `backend/upstream/backend/src/invitations/invitations.module.ts`
- `backend/upstream/backend/tsconfig.data.json`
- `backend/tests/contracts/data-04/invitations.test.mjs`
Prerequisites: DATA-01 invariants (invitation + workspace_membership DDL) as adopted at integration; verified OWNER/ADMIN authority for issuing.

## Requirement

Implement invitations, acceptance, verified organization/classroom roles and lifecycle history. **A role picker, email match, guessed ID or browser record cannot establish permission.**

## Acceptance criteria → evidence

- Criterion: an actor with verified OWNER/ADMIN over the workspace can issue an invite; anything weaker is denied.
  - Evidence: test "actor without ADMIN cannot issue; non-member cannot list/track" — non-member issue and list both reject; verified member list returns rows. `npm test` suite pass 9/9.
- Criterion: email is a delivery hint, never the permission bound; membership is created only from an accepted, unexpired, one-time token by the authenticated uid.
  - Evidence: test "owner issues a valid invite … no membership until accept" and "accept binds the authenticated uid, not the email; token is one-time".
- Criterion: a guessed ID alone never establishes permission.
  - Evidence: test "a guessed ID alone never establishes permission" — wrong/empty token rejects even with a real invitation id.
- Criterion: role picker cannot raise privilege (invitee never chooses their own role; OWNER/GUEST cannot be issued by invite).
  - Evidence: test "role picker cannot raise privilege" — OWNER and GUEST issues reject; accepted role equals the invited role.
- Criterion: expiry bounds acceptance; revocation by ADMIN/OWNER only; a revoked token is dead.
  - Evidence: tests "expired token cannot be accepted" and "revoke by ADMIN/OWNER only; revoked cannot be accepted".
- Criterion: lifecycle history is append-only and complete (pending → accepted/revoked), readable only by workspace members.
  - Evidence: test "lifecycle history is append-only and complete" and "acceptance returns the invite lifecycle view and grants invited role".
- Criterion: plaintext invite tokens never stored (SHA-256 hash only; token returned once at issue).
  - Evidence: test "owner issues a valid invite" asserts stored tokenHash is a 64-char hash, never equal to the returned token.
- Frontend → API → backend → data → jobs/ML → device outcome:
  - Frontend: N/A for this enabler (no frontend ride) — role picker explicitly not a permission source.
  - API: controller present (`api/invitations`), not yet compiled into the connected runtime (later cutover).
  - Backend: invitation domain + lifecycle service (implemented).
  - Data: in-memory contract store; Cloud SQL adapter (Prisma over DATA-01 `invitation`/`workspace_membership`) is the integration-time swap.
  - Jobs/ML: N/A.
  - Device outcome: N/A.

## Commands, exit codes, test counts and timestamps

- Compile (pure modules): `tsc --project backend/upstream/backend/tsconfig.data.json --typeRoots backend/upstream/backend/node_modules/@types` → exit 0.
- Tests: `node --test backend/tests/contracts/data-04/invitations.test.mjs` → 9 tests, 9 pass, 0 fail (timestamp 2026-10-25).
- The NestJS controller/module are included in the branch as product wiring; they compile only where backend package deps are installed (repository pattern; verified at integration cutover, matching DATA-01/02/03).

## Remaining defects, limitations and linked open gates

- Controller is not yet imported by `FirebaseProductModule`; Cloud SQL adapter swap and controller cutover are later, separately reviewed integration work (consistent with DATA-01..03 enablers).
- No email delivery service (nodemailer) is wired in this step — issuing returns the token to the caller; end-to-end delivery belongs to a later task.
- Live hosted verification and real Cloud SQL provisioning are out of scope for an enabler and remain budget-guarded release work.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (to be filled by codex)
- Verification result: pending
- Dev integration commit and checks: (after reviewers)
- Jira transition/comment receipt: KAN-39 → Testing (transition id 41), handoff comment id recorded at transition time.
- Next dependent task: KAN-40 (DATA-05 consent) after this submission.
