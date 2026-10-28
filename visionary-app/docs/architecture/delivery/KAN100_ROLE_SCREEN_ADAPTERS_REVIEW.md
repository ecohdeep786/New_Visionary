# KAN-100 — ROLE-08 — released role screens through the membership gate (pending/expired/revoked while reads/writes/jobs are in flight)

## Task review and verification handoff

Jira key / source ID: KAN-100 (ROLE-08)
Acceptance scope: feature-enabler (frontend role-access gate domain; the real two-device device-lab journeys across every released screen remain the acceptance gate at cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-100-role-screen-adapters`; based on the latest lane head `c24ee6f3` (KAN-72 LEARN-06 device state), per D-098 (lane lineage …140 → 72 → 100).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-100-role-screen-adapters`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `frontend/src/services/roleScreenAdapters.ts` (RoleAccessController — registerRoleScreen, isRegistered, applyMembershipEvent, stateOf, beginOperation, completeOperation, inFlightOperations, revokeMidFlight)
- `frontend/tests/role-screen-adapters.test.mjs` (ROLE-08 suite, 7 tests)
Prerequisites: parent KAN-9; SYNC-02 (KAN-140, delivered `b87b941b`) and LEARN-06 (KAN-72, delivered `c24ee6f3`) — both satisfied. Unblocks ACCEPT-02 (KAN-118).

## Requirement

Connect every released role screen to backend adapters and test pending/expired/revoked membership while reads/writes/jobs are in flight, across all released categories/languages (source: BACKEND_LAUNCH_CHECKLIST.md ROLE-08; KAN-100 description).

## Acceptance criteria → evidence (frontend/tests/role-screen-adapters.test.mjs, 7 tests)

- Released screens register through ONE gate — an unreleased locale refuses registration (`role_screen_unregistered`).
- PENDING — no data access: reads, writes and jobs all refuse (`membership_pending`).
- ACTIVE — reads, writes and jobs flow with tracked in-flight operations.
- EXPIRED — new writes and jobs refuse (`membership_expired`); the renewal-path read still works.
- REVOKED MID-FLIGHT — every in-flight operation aborts as an honest PARTIAL (recorded `aborted_partial`, never silently completed), the in-flight set empties, and everything further refuses (`membership_revoked`); re-activation is a fresh feed event.
- TWO DEVICES — the same membership event applied to two controllers moves both consistently (both revoked, both refusing); a state set on only one device stays per-device (per LEARN-06 isolation).
- RELEASED categories/languages — the gate behaves identically across released locales (en-IN, bn); an unreleased locale refuses regardless of membership.
- Cross-layer closure: Frontend — released role screens bind through this gate onto the SYNC-02 coordinator and LEARN-06 device state. Backend — membership transitions arrive as KAN-139 change-feed events; the classroom/organization adapters (ROLE-01/ROLE-06) supply the states. Two devices — the consistency and isolation semantics proven here are what the device-lab acceptance exercises.

## Commands, exit codes, test counts and timestamps

- Role-access suite: `node --test --test-concurrency=1 tests/role-screen-adapters.test.mjs` → 7 tests, 7 pass, 0 fail (2026-10-29).
- Frontend typecheck: `npm run typecheck` → exit 0; ESLint on the new files → clean.
- Full frontend suite: `npm test` → 645 pass / 1 fail — the single failure is the PRE-EXISTING SCOPE-01 inventory audit drift on the base lineage (recorded with stash-verification in KAN-140's handoff; this candidate adds 7 passing tests: 639 → 646 total).
- Backend lane: unchanged by this candidate (frontend-only files).

## Remaining defects, limitations and linked open gates

- The real device-lab journeys (actual two devices, real accounts, every released screen) remain the acceptance gate at cutover — this enabler proves the gate semantics the screens bind through.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
