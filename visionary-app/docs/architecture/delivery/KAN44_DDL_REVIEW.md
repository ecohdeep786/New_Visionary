# KAN-44 — DATA-09 — approved age/admission and guardian-first account/linking workflow

## Task review and verification handoff

Jira key / source ID: KAN-44 (DATA-09)
Acceptance scope: enabler (server-authoritative admission + guardian-first linking domain; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: deepseek (senior backend engineer)
Reviewer: codex (senior agent) — must explicitly accept responsibility; an implementer cannot self-approve
Worker branch / candidate head: `codex/deepseek-kan-44-admission`
Base: origin/dev 65045d72 (KAN-37 Prisma schema; generated client regenerated in this worktree before the full build)
Owned files / contracts:
- `backend/upstream/backend/src/admission/admission-types.ts`
- `backend/upstream/backend/src/admission/admission-store.ts` (contract + in-memory + guardian-link records)
- `backend/upstream/backend/src/admission/admission.service.ts` (AdmissionService)
- `backend/upstream/backend/src/admission/index.ts`
- `backend/upstream/backend/tsconfig.data.json`
- `backend/tests/contracts/data-09/admission.test.mjs`
Prerequisites: DATA-01 persons DDL (server-birth registry), DATA-04 verified memberships/roles, and the UID/session authority they build on. This step implements server-side admission gates over that foundation.

## Requirement

Implement the approved age/admission and guardian-first account/linking workflow before supporting currently blocked minors; **never bypass admission using client age or role flags**. Exit: every domain command is server-authorized and transactionally scoped.

## Acceptance criteria → evidence

- Criterion: client age/role flags never establish admission — admission derives only from the server-owned birth registry entry.
  - Evidence: test "deny: client-claimed age alone NEVER admits (no verified birth registry entry)" (blocked), "deny: a role flag cannot convert an unsupported/minor account".
- Criterion: verified adult (18+) is admitted without a guardian.
  - Evidence: test "adult: verified adult is admitted without a guardian".
- Criterion: supported minor (13–17) is guardian-first — blocked from sensitive operations until a verified guardian account links them.
  - Evidence: tests "supported minor: needs a verified guardian link; sensitive op denied until linked" (pending_guardian → requireAdmitted denies → after confirm admitted), "guardian-first: supported minor without any guardian link stays blocked".
- Criterion: a minor cannot bypass by self-linking or fabricating a guardian; only the verified guardian may confirm/deny.
  - Evidence: test "deny: a minor cannot link themselves or fabricate a guardian" (wrong_parties, guardian_required).
- Criterion: duplicate/cancelled work is checked — an already-linked minor cannot be linked or re-confirmed again.
  - Evidence: test "deny: already-linked minor cannot be linked twice (idempotent/cancelled work checked)".
- Criterion: input validation — malformed subject/uid is rejected and nothing is admitted.
  - Evidence: test "invalid subject: bad uid or undefined input is rejected and nothing is admitted".
- Frontend → API → backend → data → jobs/ML → device outcome:
  - Frontend: N/A in the enabler; admission is server-side, frontend age/role inputs are hints only.
  - API: N/A in the enabler; service is the server-authority engine later controllers call.
  - Backend: AdmissionService (admit/requireAdmitted/requestLink/confirmLink/denyLink) implemented.
  - Data: in-memory AdmissionStore over persons birth registry + guardian-links; Cloud SQL adapter is the integration-time swap.
  - Safety: unsupported minors remain blocked; no client flag converts them (D-086 Doc 23 safeguarding honored).

## Commands, exit codes, test counts and timestamps

- Compile (pure modules): `tsc --project backend/upstream/backend/tsconfig.data.json --typeRoots .../@types --types node --skipLibCheck` → exit 0.
- Prisma client regen (base requires it): `npx prisma generate` → exit 0 (stale-client fix on the dev base, not a KAN-44 code change).
- Full product build: `npm run build` (nest build, whole backend) → exit 0, dist/src/admission emitted.
- Tests: `node --test backend/tests/contracts/data-09/admission.test.mjs` → 8 tests, 8 pass, 0 fail (2026-10-25).
- Runtime smoke: compiled AdmissionService in-process → forged age blocked, minor pending_guardian, after guardian link admitted, adult admitted (2026-10-25).

## Remaining defects, limitations and linked open gates

- No live Cloud SQL/Firestore and no Nest controller yet; the real adapter swap + controller cutover happen at integration.
- `birthYear` here is the server-owned registry value; real identity-provider birth verification and age-eligibility review remain at hosted/provider gates (PLAT-05, SAFE-01).
- Hosted verification and Cloud SQL provisioning remain out of scope for an enabler; hosted/load/privacy gates stay open.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (codex)
- Verification result: pending
- Dev integration commit and checks: (after review)
- Jira transition/comment receipt: KAN-44 → Testing (transition 41)
- Next dependent tasks: ROLE-08 (KAN-100) connected role workflows; BUILD-06 (KAN-80) build admission; SAFE-01 (KAN-151).
