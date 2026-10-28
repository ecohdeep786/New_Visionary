# KAN-139 — SYNC-01 — authorized durable change/run observation

## Task review and verification handoff

Jira key / source ID: KAN-139 (SYNC-01)
Acceptance scope: feature-enabler (backend-owned change/run observation domain; owning-domain controllers bind their outboxes to it at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-139-durable-change-feeds`; based on the latest lane head `cdbec54f` (KAN-142 AI-13 scorecard), per D-098 — the lane's most recent verified lane head on origin (lane lineage KAN-83 → 84 → 85 → 86 → 88 → 89 → 90 → 92 → 138 → 91 → 149 → 143 → 142 → 139).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-139-durable-change-feeds`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/changefeed/changefeed-types.ts` (FeedOwner, FeedSurface — seven released surfaces, DeliveryMode, FeedEvent, FeedCursor, FeedPage, StreamRegistration, ChangefeedError)
- `backend/upstream/backend/src/changefeed/changefeed-lookups.ts` (ChangefeedStore seam + InMemoryChangefeedStore contract-true state: per-owner/surface ordered event log, issued cursors, delivery revocations)
- `backend/upstream/backend/src/changefeed/changefeed-service.ts` (ChangefeedService — recordEvent, issueCursor, poll, subscribe, setDeliveryRevoked, executeThroughFeed (always refuses))
- `backend/upstream/backend/src/changefeed/index.ts`
- `backend/upstream/backend/tsconfig.changefeed.json`
- `backend/tests/contracts/changefeed/changefeed.test.mjs` (SYNC-01 suite, 10 tests)
- `scripts/changefeed-check.mjs`, `package.json` (`changefeed:check`)
Prerequisites: parent KAN-9; SCOPE-03 (KAN-30), DATA-06 (KAN-41) and JOB-01 (KAN-53) are implemented on the lane. Unblocks SYNC-02 (KAN-140) and AI-16 (KAN-150).

## Requirement

Implement authorized durable change/run observation across account, billing and every released workspace domain: owning-store event/outbox records, opaque scoped cursors, ordered revisions, replay/refetch and expiry semantics. Start with bounded polling and SSE where streaming is needed; WebSocket requires an explicit bidirectional need. Reauthorize connect/reconnect/delivery; a socket event never executes a command or proves commit (source: docs/architecture/BACKEND_LAUNCH_CHECKLIST.md SYNC-01; KAN-139 description).

## Acceptance criteria → evidence

- Criterion: owning-store event/outbox records — released surfaces only (`unknown_surface`); per-(owner, surface) strictly-increasing ordered revisions; records carry kinds + reference ids ONLY.
  - Evidence: test "owning-store records: per-surface strictly-increasing ordered revisions; pages return reference ids only, in order".
- Criterion: no raw private content in the feed — record keys indicating raw private content (learner_text/rawQuery/fullTranscript/transcript/audio-style) refuse at the record boundary (`private_content_refused`).
  - Evidence: test "raw private content refuses at the record boundary".
- Criterion: opaque scoped cursors — server-issued, nonce-padded tokens (the sequence is never exposed raw); unknown/tampered tokens refuse (`cursor_invalid`); a cursor presented by a DIFFERENT caller or on a foreign surface refuses — the cursor alone grants nothing, the authenticated caller is the authority.
  - Evidence: test "OPAQUE scoped cursors: nonce-padded tokens; tampered/unknown tokens refuse; a cursor bound to another caller or surface refuses".
- Criterion: ordered revisions + replay/refetch — refetch from any retained cursor replays the identical ordered suffix (byte-stable across repeated polls); bounded pages chain through server-issued next cursors.
  - Evidence: tests "ordered replay/refetch…" and "bounded polling: page limits are enforced".
- Criterion: expiry semantics — a cursor fallen out of the retention window refuses honestly (`cursor_expired`); a fresh cursor carries the resync point (latest revision).
  - Evidence: test "expiry: a cursor fallen out of the retention window refuses honestly with a resync point".
- Criterion: bounded polling + SSE; websocket gated — page limits enforce the bound (`limit_exceeded`); bounded_polling and sse subscribe; a websocket surface refuses without a recorded explicit bidirectional need (`websocket_requires_explicit_need`) and is admitted only when the need is recorded.
  - Evidence: tests "bounded polling…" and "delivery modes: bounded polling default; SSE allowed; websocket refuses without a recorded explicit bidirectional need".
- Criterion: reauthorized connect/reconnect/delivery — a revoked delivery refuses poll/subscribe/cursor issuance (`delivery_revoked`); re-grant restores on the next authorized connect.
  - Evidence: test "reauthorized connect/reconnect/delivery: revoked delivery refuses everything; re-grant restores; the caller is the authority".
- Criterion: a feed event never executes a command or proves commit — the observation channel has NO command path (`observation_only`) and every record is not a commit receipt (`isCommitProof: false` by construction); run-status observation rides the same authorized cursor path.
  - Evidence: tests "observation only: the feed never executes a command and never proves commit…" and "run observation rides the same authorized cursor path".
- Criterion: no cross-owner leak — one owner's events are invisible to another owner polling the same surface.
  - Evidence: test "observation only…" (stranger sees zero of OWNER's events).
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; SYNC-02 (KAN-140) connects the released frontend adapters to this feed at cutover.
  - API: N/A in the enabler; controller wiring binds validated schemas and maps bounded polling to HTTP and sse to SSE responses; the websocket surface stays closed until a need is recorded.
  - Backend: ChangefeedService is the observation layer over owning-store outbox records (JOB-01/KAN-53 outbox semantics); the owning APIs remain the only command path and commit authority.
  - Data: the store seam mirrors the ordered event log + cursors; the Cloud SQL adapter at integration resolves from feed_event (unique (owner, surface, seq)) and feed_cursor tables with the retention window enforced server-side.
  - Jobs/ML: run observation (BUILD-04 durable runs, AI-14 flow runs) surfaces as `run_status` records — observation, never execution.

## Commands, exit codes, test counts and timestamps

- Changefeed compile + suite: `node scripts/changefeed-check.mjs` → tsc `tsconfig.changefeed.json` exit 0; `node --test` → 10 tests, 10 pass, 0 fail (2026-10-29).
- Lane regressions (candidate does not regress the lane; all on this candidate): `scorecard:check` (KAN-142) → 14/0; `airaflow:check` (KAN-143) → 14/0; `modalities:check` (KAN-92) → 5/0; `deadline:check` (KAN-90) → 6/0; `usagereservation:check` (KAN-89) → 6/0; `mlgate:check` (KAN-88) → 7/0; `conversationauth:check` (KAN-86) → 6/0; `serviceidentity:check` (KAN-85) → 7/0; `providerscope:check` (KAN-84) → 4/0; `completion:check` (KAN-81) → 4/0; `sharing:check` (KAN-80) → 4/0; `runs:check` (KAN-78) → 6/0; `guidedbriefs:check` (KAN-77) → 4/0; `draftrecovery:check` (KAN-76) → 6/0; `projects:check` (KAN-75) → 5/0; `evaluation:check` (KAN-74) → 5/0; `journey:check` (KAN-73) → 8/0; `dailyplan:check` (KAN-70) → 7/0; `projections:check` (KAN-69) → 7/0; `attempts:check` (KAN-68) → 6/0; `learningsession:check` (KAN-67) → 8/0; `conceptgraph:check` (KAN-144) → 8/0; `catalogadapter:check` (KAN-63) → 7/0; `coverage:check` (KAN-65) → 7/0; `mediagate:check` (KAN-66) → 7/0; `retrievalgate:check` (KAN-64) → 6/0; `qualityscope:check` (KAN-138) → 6/0; `mlresilience:check` (KAN-91) → 4/0; `contextassembly:check` (KAN-149) → 8/0.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller/SSE endpoint wired yet; owning-domain outboxes bind to recordEvent and controllers map poll/subscribe at cutover.
- SSE streaming and two-device recovery behavior are proved end-to-end in SYNC-02 (KAN-140) with the released frontend adapters; this enabler proves the server contract.
- The websocket surface remains closed by default; opening it requires the recorded explicit bidirectional need (none is currently approved).
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
