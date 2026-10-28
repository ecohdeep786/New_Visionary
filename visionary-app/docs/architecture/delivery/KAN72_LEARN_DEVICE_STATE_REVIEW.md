# KAN-72 — LEARN-06 — authorized change cursors/refetch, stale-response rejection, per-device workspace selection, offline/conflict recovery, sign-out/account-switch handling

## Task review and verification handoff

Jira key / source ID: KAN-72 (LEARN-06)
Acceptance scope: feature-enabler (frontend device-state domain; wiring released learning journeys onto it happens at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-72-change-cursors`; based on the latest lane head `b87b941b` (KAN-140 SYNC-02 sync coordinator), per D-098 (lane lineage …95 → 97 → 98 → 140 → 72).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-72-change-cursors`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `frontend/src/services/learningDeviceState.ts` (LearningDeviceState — selectWorkspace, workspaceOf, issueCursor, refetch, acceptResponse, queueDraft, recover, conflicts, switchAccount, signOut, isSignedOut)
- `frontend/tests/learning-device-state.test.mjs` (LEARN-06 suite, 6 tests)
Prerequisites: parent KAN-9; SYNC-02 (KAN-140, delivered `b87b941b` on this lane) — satisfied. Unblocks ACCEPT-01 (KAN-117).

## Requirement

Add authorized change cursors/refetch, stale-response rejection, independent workspace selection per device, offline/conflict recovery and sign-out/account-switch handling (source: BACKEND_LAUNCH_CHECKLIST.md LEARN-06; KAN-72 description).

## Acceptance criteria → evidence (frontend/tests/learning-device-state.test.mjs, 6 tests)

- Independent workspace selection PER DEVICE — device B switching to another workspace never affects device A's selection; an account switch on the same device isolates per account (draft queues do not leak across accounts).
- AUTHORIZED cursors — issued per (device, workspace, surface) with identity binding; another device's refetch refuses; a stale token copy refuses; an old-workspace cursor refuses after the device switches workspace (cursors drop on switch).
- REFETCH — refetching from a retained cursor returns the exact ordered suffix (fromSeq honored).
- STALE-RESPONSE rejection — monotonically increasing generations: out-of-order (2 after 3) and equal generations are rejected; only newer generations apply.
- OFFLINE/CONFLICT recovery — drafts queue bound to the BASE revision; recovery applies a draft whose base still matches; a moved base becomes an EXPLICIT CONFLICT with both the draft and the server revision retained (no silent overwrite).
- SIGN-OUT — wipes ALL device state (cursors, drafts, selection); every use refuses (`signed_out`) until re-authentication creates a fresh state.
- Cross-layer closure: Frontend — the device state composes the SYNC-02 coordinator (per-surface cursors, per-account drafts). Backend — the KAN-139 change-feed contract supplies the ordered suffixes. Two devices — the per-device/per-account isolation proven here is what ROLE-08 verifies on real devices.

## Commands, exit codes, test counts and timestamps

- Device-state suite: `node --test --test-concurrency=1 tests/learning-device-state.test.mjs` → 6 tests, 6 pass, 0 fail (2026-10-29).
- Frontend typecheck: `npm run typecheck` → exit 0; ESLint on the new files → clean.
- Full frontend suite: `npm test` → 638 pass / 1 fail — the single failure is the PRE-EXISTING SCOPE-01 inventory audit drift on the base lineage (recorded in KAN-140's handoff with the stash-verification; this candidate adds 6 passing tests: 633 → 639 total).
- Backend lane: unchanged by this candidate (frontend-only files).

## Remaining defects, limitations and linked open gates

- Released learning journeys bind onto this state at cutover; real two-device acceptance is ROLE-08 (KAN-100).
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
