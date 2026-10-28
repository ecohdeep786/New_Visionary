# KAN-140 — SYNC-02 — shared account/workspace sync coordinator for every released frontend adapter

## Task review and verification handoff

Jira key / source ID: KAN-140 (SYNC-02)
Acceptance scope: feature-enabler (frontend sync-coordinator domain; wiring every released role screen's adapter onto it is ROLE-08/KAN-100's two-device acceptance work at cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-140-sync-coordinator`; based on the latest lane head `b9c5c1a9` (KAN-98 ROLE-06 organization), per D-098 (lane lineage …95 → 97 → 98 → 140).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-140-sync-coordinator`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `frontend/src/services/syncCoordinator.ts` (SyncCoordinator — registerAdapter, pollOnce, resync, queueDraft, pendingDrafts, reconnect, nextBackoffMs, canReconnect, switchAccount, markRevoked, reauthorize, onStorageEvent, countersNow)
- `frontend/src/services/syncTypes.ts` (SyncSurface, SyncIdentity)
- `frontend/tests/sync-coordinator.test.mjs` (SYNC-02 suite, 9 tests)
Prerequisites: parent KAN-9; SYNC-01 (KAN-139, delivered `e90812c0` — the bounded-polling/opaque-cursor server contract this coordinator consumes) and CACHE-01 (KAN-141, delivered `d068d8fe`) — both satisfied. Unblocks LEARN-06 (KAN-72) and ROLE-08 (KAN-100).

## Requirement

Connect every released frontend adapter to the shared account/workspace sync coordinator: validate response schemas, reject stale identity/policy/revision results, deduplicate events, invalidate/refetch exact query scopes, recover gaps/offline drafts/conflicts, and verify two devices. Test disconnect, duplicate/reordered events, account switch, revocation and reconnect storms with bounded backoff/connections; cross-browser storage events are not cross-device sync (source: BACKEND_LAUNCH_CHECKLIST.md SYNC-02; KAN-140 description).

## Acceptance criteria → evidence (frontend/tests/sync-coordinator.test.mjs, 9 tests)

- Response schema validation — an event failing its registered adapter validator is rejected and never reaches app state (`rejectedSchema` counted).
- Stale rejection + dedup + ordering — reordered events apply in seq order; a replayed page is fully deduplicated; an event at/below the applied revision is rejected stale and not applied.
- Exact-scope invalidation — an event invalidates exactly its `surface:ref` scope (the invalidation log receives only those scopes).
- Gap recovery — a missing seq is counted; `resync` drops local state and repolls honestly (server feed is the authority).
- Offline drafts — queued while offline; flushed in order on reconnect; drafts are held PER ACCOUNT (an account switch shows none of the other account's drafts).
- Account switch — cursors, dedup state and applied revisions reset; polling resumes under the NEW identity (transport called with it).
- Revocation — a revoked delivery stops polling entirely (zero transport calls) until an explicit reauthorize (including same-identity reauthorize) resumes it.
- Reconnect storms — exponential backoff (250 ms → 4 s cap) with a bounded attempt count and a connection cap (max 2 concurrent) so storms cannot open unbounded polls.
- Storage events — `onStorageEvent` never advances sync state and never touches the transport (cross-browser storage events are not cross-device sync; the server change feed is the only cross-device authority).
- Cross-layer closure: Frontend — the coordinator is the single shared layer every adapter registers with; private polling loops are structurally unnecessary. Backend — consumes the KAN-139 change-feed contract (bounded polling, opaque cursors, honest expiry). Two devices — the account-switch/revocation/offline-draft semantics are the prerequisites ROLE-08 verifies on real devices.

## Commands, exit codes, test counts and timestamps

- Coordinator suite: `node --test --test-concurrency=1 tests/sync-coordinator.test.mjs` → 9 tests, 9 pass, 0 fail (2026-10-29).
- Frontend typecheck: `npm run typecheck` (tsc jsconfig + tsconfig.domain) → exit 0; ESLint on the new files → clean.
- Full frontend suite: `npm test` → 632 pass / 1 fail — the single failure ("the checked inventory includes every current declaration…", the SCOPE-01 inventory audit) is PRE-EXISTING on the base `b9c5c1a9` (verified by stashing this candidate's files and re-running: identical 632/1) and is unrelated to this candidate; it belongs to the SCOPE-01 inventory-fixture drift.
- Backend lane regressions: unchanged by this candidate (frontend-only files); the 36-module backend sweep was green on the base commit.

## Remaining defects, limitations and linked open gates

- Adapter wiring for every released role screen + real two-device acceptance journeys are ROLE-08 (KAN-100) at cutover — this enabler proves the coordinator contract.
- The transport interface binds the real HTTP/SSE adapter at cutover; the suite proves semantics against the contract shape.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
