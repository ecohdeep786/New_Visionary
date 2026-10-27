# KAN-113 — PRIV-04 — durable in-app notification/read/preference state and approved email delivery, with idempotency, quiet/retry handling and no private data in public links/logs

## Task review and verification handoff

Jira key / source ID: KAN-113 (PRIV-04)
Acceptance scope: feature-enabler (backend-owned notification domain; wired into the connected runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-113-consent-policies`; based on the latest lane head `7d087c9e` (KAN-112 PRIV-03 restore tombstones), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-113-consent-policies`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/notifications/notification-types.ts` (NotificationOwner, Channel, DeliveryPreference, AppNotification, NotificationError)
- `backend/upstream/backend/src/notifications/notification-lookups.ts` (NotificationStore seam with server-derived verified email + InMemoryNotificationStore contract-true upsert state)
- `backend/upstream/backend/src/notifications/notification-service.ts` (NotificationService — deliver with idempotency/preferences/quiet, retry with bounds, markRead, publicLink (opaque token), emailRecipient (server-derived))
- `backend/upstream/backend/src/notifications/index.ts`
- `backend/upstream/backend/tsconfig.notifications.json`
- `backend/tests/contracts/notifications/notification.test.mjs` (PRIV-04 suite, 7 tests)
- `scripts/notifications-check.mjs`, `package.json` (`notifications:check`)
Prerequisites: parent KAN-10/PRIV family; PRIV-01's policy and KAN-91 redaction compose; the lane head is the base.

## Requirement

Implement durable in-app notification/read/preference state and approved email delivery, with idempotency, quiet/retry handling and no private data in public links/logs. Verify real selected delivery channels. Exit: real-user data has enforceable access, lifecycle and support procedures.

## Acceptance criteria → evidence

- Criterion: durable in-app state — notifications are server-owned per owner; read transitions persist and are idempotent.
  - Evidence: test "durable in-app state: notifications are server-owned per owner; read transitions persist (idempotent markRead)".
- Criterion: idempotency — a retried delivery (same notificationId) converges to ONE notification (no duplicates).
  - Evidence: test "idempotency: a retried delivery (same notificationId) converges to ONE notification".
- Criterion: preferences enforced — an opted-out channel is recorded `suppressed` honestly (never delivered, never silently dropped).
  - Evidence: test "preferences: an opted-out channel suppresses honestly (recorded, never delivered)".
- Criterion: quiet hours — an in-window delivery DEFERS (not dropped, not sent); the post-window retry delivers, attempts counted.
  - Evidence: test "quiet hours: in-window deliveries DEFER (not dropped); post-window retry delivers".
- Criterion: retry handling — bounded attempts with an honest `failed` state; beyond the bound refuses (`retry_bound_exceeded`); never silently lost.
  - Evidence: test "retry handling: bounded attempts; beyond the bound refuses honestly".
- Criterion: NO private data in public links — the link carries the opaque token only (no uid, no subject text).
  - Evidence: test "no private data in public links: the link carries the opaque token only".
- Criterion: the email recipient is the SERVER-DERIVED verified address (never from the payload); owner-only access on read/retry; unknown notifications fail closed.
  - Evidence: test "the email recipient is the SERVER-DERIVED verified address; owner-only access".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + device):
  - Frontend: N/A in the enabler; notification surfaces and preference settings consume the service at cutover.
  - API: N/A in the enabler; notification controllers call the service at cutover with the authenticated owner.
  - Backend: NotificationService implements idempotent delivery, preference/quiet handling, privacy-safe links.
  - Data: in-memory store mirrors notifications/preferences/verified addresses; Cloud SQL adapter at integration resolves from notification/preference tables; email delivery binds the approved provider at cutover (real channel verification there).
  - Jobs/ML: redaction composes (KAN-91) for any log records; delivery jobs honor the frozen state (PRIV-02).

## Commands, exit codes, test counts and timestamps

- Notification compile + suite: `node scripts/notifications-check.mjs` → tsc `tsconfig.notifications.json` exit 0; `node --test` → 7 tests, 7 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `restoretombstone:check` (KAN-112) → 6 pass/0 fail; `privacyjobs:check` (KAN-111) → 5 pass/0 fail; `privacycore:check` (KAN-110) → 6 pass/0 fail; `scopedcache:check` (KAN-87) → 5 pass/0 fail; `benchmark:check` (KAN-83) → 4 pass/0 fail; `contextassembly:check` (KAN-149) → 8 pass/0 fail; `mlresilience:check` (KAN-91) → 4 pass/0 fail; `qualityscope:check` (KAN-138) → 6 pass/0 fail; `modalities:check` (KAN-92) → 5 pass/0 fail; `deadline:check` (KAN-90) → 6 pass/0 fail; `usagereservation:check` (KAN-89) → 6 pass/0 fail; `mlgate:check` (KAN-88) → 7 pass/0 fail; `conversationauth:check` (KAN-86) → 6 pass/0 fail; `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live email provider wired yet; real selected-channel delivery (the approved email provider with a real send) verifies at cutover with hosted evidence.
- Timezone-aware quiet windows bind the owner's real locale at cutover; this enabler uses the owner's current local hour.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-113 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: PRIV-05..07 continue on this head.
