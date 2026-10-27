# KAN-86 — AI-04 — enforce conversation UID/workspace ownership on every get/append/delete/context request; a supplied session ID or UUID is never authority

## Task review and verification handoff

Jira key / source ID: KAN-86 (AI-04)
Acceptance scope: feature-enabler (backend-owned conversation authority domain; wired into the connected ML/runtime at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-86-conversation-ownership`; based on the latest lane head `f5a598d1` (KAN-85 AI-03 service identity), per D-098 — the next task creates its worktree from the latest working worktree.
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-86-conversation-ownership`, D-098; head branch `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/conversationauth/conversation-auth-types.ts` (ConversationCaller, Conversation, ConversationDenial, ConversationTurnView, ConversationError)
- `backend/upstream/backend/src/conversationauth/conversation-auth-lookups.ts` (ConversationStore seam + InMemoryConversationStore contract-true state)
- `backend/upstream/backend/src/conversationauth/conversation-auth.ts` (ConversationAuthService — getTurns, appendTurn with pinned-context enforcement, getContext, deleteConversation; uniform denial, no existence leak)
- `backend/upstream/backend/src/conversationauth/index.ts`
- `backend/upstream/backend/tsconfig.conversationauth.json`
- `backend/tests/contracts/conversationauth/conversation-auth.test.mjs` (AI-04 suite, 6 tests)
- `scripts/conversationauth-check.mjs`, `package.json` (`conversationauth:check`)
Prerequisites: parent KAN-9; the lane head (CONTENT+LEARN+BUILD+AI-02/03 lineage) is the base. The chat/ML runtime binds its conversation endpoints to this service at cutover.

## Requirement

Enforce conversation UID/workspace ownership on every get/append/delete/context request. A supplied session ID or UUID is never authority. D-085: server UID/workspace ownership on every request; contextual turns, hints, locale/prompt version and valid sources.

## Acceptance criteria → evidence

- Criterion: knowing a conversation UUID grants NOTHING — a stranger with the exact ID is denied on get/append/context/delete, identically to an unknown id (uniform `denied`, no existence leak).
  - Evidence: test "knowing the conversation UUID grants NOTHING: a stranger is denied exactly like an unknown id (no existence leak)".
- Criterion: workspace isolation — the same uid in a different workspace owns nothing there.
  - Evidence: test "workspace isolation: the same uid in a different workspace owns nothing there".
- Criterion: the owner can get/append/context/delete their own conversation.
  - Evidence: test "the owner can get/append/context/delete their own conversation".
- Criterion: append enforces pinned-context integrity — a turn citing a source revision different from the conversation's pinned revision is refused (no silent context drift).
  - Evidence: test "append enforces pinned-context integrity: a turn citing another source revision is refused".
- Criterion: delete is owner-only; deleting an already-deleted conversation denies uniformly (no existence leak).
  - Evidence: test "delete is owner-only; deleting an already-deleted conversation denies uniformly (no existence leak)".
- Criterion: authority comes from the authenticated caller context (uid + workspace), never from payload identifiers — a supplied session ID or UUID is never authority.
  - Evidence: test "authority comes from the authenticated caller context, never from payload identifiers".
- Cross-layer closure (UI/facade + schema + server authority + store + jobs + ML):
  - Frontend: N/A in the enabler; the teaching interface consumes conversation endpoints at cutover; denials render the uniform state.
  - API: N/A in the enabler; conversation controllers call the service at cutover with the authenticated caller context only.
  - Backend: ConversationAuthService implements UID/workspace ownership with uniform denials and pinned-context integrity.
  - Data: in-memory store mirrors conversations/turns/ownership; Cloud SQL adapter at integration resolves from conversation tables.
  - Jobs/ML: the ML lane binds context reads to the authorized context; prompt/locale versions ride the pinned revision (KAN-85 service identity composes on top).

## Commands, exit codes, test counts and timestamps

- Conversation authority compile + suite: `node scripts/conversationauth-check.mjs` → tsc `tsconfig.conversationauth.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-28).
- Lane regressions (unchanged base; candidate does not regress the lane): `serviceidentity:check` (KAN-85) → 7 pass/0 fail; `providerscope:check` (KAN-84) → 4 pass/0 fail; `completion:check` (KAN-81) → 4 pass/0 fail; `sharing:check` (KAN-80) → 4 pass/0 fail; `runs:check` (KAN-78) → 6 pass/0 fail; `guidedbriefs:check` (KAN-77) → 4 pass/0 fail; `draftrecovery:check` (KAN-76) → 6 pass/0 fail; `projects:check` (KAN-75) → 5 pass/0 fail; `evaluation:check` (KAN-74) → 5 pass/0 fail; `journey:check` (KAN-73) → 8 pass/0 fail; `dailyplan:check` (KAN-70) → 7 pass/0 fail; `projections:check` (KAN-69) → 7 pass/0 fail; `attempts:check` (KAN-68) → 6 pass/0 fail; `learningsession:check` (KAN-67) → 8 pass/0 fail; `conceptgraph:check` (KAN-144) → 8 pass/0 fail; `catalogadapter:check` (KAN-63) → 7 pass/0 fail; `coverage:check` (KAN-65) → 7 pass/0 fail; `mediagate:check` (KAN-66) → 7 pass/0 fail; `retrievalgate:check` (KAN-64) → 6 pass/0 fail.
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- No live Cloud SQL and no Nest controller wired yet; real adapter swap + controller wiring happen at cutover.
- Conversation persistence/turn storage here is the authority contract; production turn storage and retention bind through the privacy lane at integration.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

- Reviewer decision: pending
- Reviewer identity / exact reviewed commit / date / rationale: (separate reviewer required)
- Verification result: pending
- Dev integration commit and checks: (after review; reviewer merges into `dev`, then release acceptance gates)
- Jira transition/comment receipt: KAN-86 → In Progress at task start; → Testing with the exact candidate SHA (after push)
- Next dependent task in sequence: AI-05 (KAN-87) remains blocked by CACHE-01 (KAN-141); the next eligible AI task is AI-06 (KAN-88) permission-filtered retrieval with pinned context/prompt/tool versions.
