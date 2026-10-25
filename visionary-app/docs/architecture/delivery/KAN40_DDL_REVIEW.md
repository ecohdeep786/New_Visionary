# KAN-40 — DATA-05 — consent/share purpose, expiry/revocation and policy versions

## Task review and verification handoff

Jira key / source ID: KAN-40 (DATA-05)
Acceptance scope: enabler (consent/share domain + contract store; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: deepseek (senior backend engineer)
Reviewer: codex (senior agent) — must explicitly accept responsibility; an implementer cannot self-approve
Worker branch / candidate head: `codex/deepseek-kan-40-data-consent`
Owned files / contracts:
- `backend/upstream/backend/src/consent/consent-types.ts`
- `backend/upstream/backend/src/consent/consent-store.ts` (contract + in-memory + side-effect emulation)
- `backend/upstream/backend/src/consent/consent.service.ts`
- `backend/upstream/backend/src/consent/consent.controller.ts` (NestJS, compiles at integration cutover)
- `backend/upstream/backend/src/consent/consent.module.ts`
- `backend/upstream/backend/tsconfig.data.json`
- `backend/tests/contracts/data-05/consent.test.mjs`
Prerequisites: DATA-01 consent_grants/share_grants DDL as adopted at integration; verified OWNER/ADMIN authority for sensitive mutations via DATA-04 membership model.

## Requirement

Implement consent/share purpose, expiry/revocation and policy versions. Recheck sensitive mutations/delivery; **revocation must affect pending jobs, caches and newly requested downloads**. Exit: every domain command is server-authorized and transactionally scoped.

## Acceptance criteria → evidence

- Criterion: grant is only by the data subject (server uid), on an explicit purpose and policy version.
  - Evidence: test "grant requires matching server-uid and an explicit policy version"; "unknown purpose is rejected; grant is idempotent".
- Criterion: expiry is durable and rechecked; time alone never revives a grant or share.
  - Evidence: tests "expiry is durable; time alone never revives consent", "share expiry hides the share from the recipient".
- Criterion: revocation is immediate and visible to side effects — pays pending jobs, flushes caches, blocks newly requested downloads.
  - Evidence: test "revocation blocks pending jobs, flushes caches and blocks newly requested downloads" — blockedPendingJobs/flushedCaches/blockedDownloads counts verified.
- Criterion: revocation only by the data subject; shares only by the resource owner; wrong-uid and missing-grant reject.
  - Evidence: tests "revocation by the data subject only", "share revocation is owner-only; recipient cannot revoke".
- Criterion: shares target verified recipient uids only (no email match, no guessed id); self-share and unbounded/shared-capsule expiry rejected.
  - Evidence: tests "share targets a verified recipient UID, not an email or guessed id", "share requires owner uid and cannot be to self; expiry bounded".
- Criterion: sensitive operations (jobs, downloads) deny when consent is missing, expired, or for a foreign purpose.
  - Evidence: test "checks on pending jobs/downloads deny once consent is missing".
- Criterion: consent lifecycle history is append-only, purpose-tagged and readable by the subject.
  - Evidence: test "revocation lifecycle history is append-only and complete".
- Frontend → API → backend → data → jobs/ML → device outcome:
  - Frontend: N/A (no frontend ride in this enabler).
  - API: consent controller present (`/api/consent`), not yet compiled into connected runtime (later cutover).
  - Backend: consent/share domain + lifecycle/revocation service (implemented).
  - Data: in-memory contract store; Cloud SQL adapter (Prisma over consent_grants/share_grants) is the integration-time swap.
  - Jobs/ML: revocation path exposes blockPendingJobs (used by stage jobs) and blockPendingDownloads — modelled; ML consumption stays gated by check().
  - Device: N/A (no device outcome before two-device capacities are wired).

## Commands, exit codes, test counts and timestamps

- Compile (pure modules): `tsc --project backend/upstream/backend/tsconfig.data.json --typeRoots backend/upstream/backend/node_modules/@types` → exit 0.
- Tests: `node --test backend/tests/contracts/data-05/consent.test.mjs` → 11 tests, 11 pass, 0 fail (2026-10-25).
- NestJS controller/module included as product wiring; compile only where backend package deps are installed (verified at integration cutover, matching DATA-01..04).

## Remaining defects, limitations and linked open gates

- Controller not imported by `FirebaseProductModule`; Cloud SQL adapter swap and controller cutover are later, separately reviewed integration.
- No hosted Firestore/Cloud SQL write in this step; side-effect emulation (jobs/caches/downloads) stands in for real stage queue via outbox — real wiring is later integration work.
- Live hosted verification and Cloud SQL provisioning remain out of scope for an enabler and budget-guarded.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (codex)
- Verification result: pending
- Dev integration commit and checks: (after review)
- Jira transition/comment receipt: KAN-40 → Testing (transition 41)
- Next dependent task: KAN-41 (DATA-06) after this submission.
