# KAN-71 — LEARN-05 — owned Ask/Guide conversation state and typed model-response adapters

## Task review and verification handoff

Jira key / source ID: KAN-71 (LEARN-05)
Acceptance scope: feature-enabler (backend-owned conversation-state domain; controller wiring, the accepted P07 model adapter and real frontend adapter binding happen at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-71-conversation-state`; based on the latest lane head `146c05a2` (KAN-159 LEARN-14 stage), per D-098 (lane lineage …159 → 71).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-71-conversation-state`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/conversation/conversation-types.ts` (ConversationOwner, ConversationChannel, Conversation, LearnerTurn, ModelOutcome, ModelTurn, ConversationTurn, ConversationError)
- `backend/upstream/backend/src/conversation/conversation-lookups.ts` (ConversationStore seam + InMemoryConversationStore contract-true state; command-dedup ledger with result convergence; P07 adapter-acceptance seam)
- `backend/upstream/backend/src/conversation/conversation-service.ts` (ConversationService — createConversation, appendLearnerTurn, recordModelTurn, resumeConversation, revokeConversation)
- `backend/upstream/backend/src/conversation/index.ts`
- `backend/upstream/backend/tsconfig.conversation.json`
- `backend/tests/contracts/conversation/conversation.test.mjs` (LEARN-05 suite, 6 tests)
- `scripts/conversation-check.mjs`, `package.json` (`conversation:check`)
Prerequisites (native Blocks): AI-14 / KAN-143 (deterministic AIRA workflows — implemented, Testing). Unblocks feature/phase acceptance gates as mapped. Composes the lane stances: AI-04/KAN-86 conversation ownership, AI-15/KAN-149 scoped memory, KAN-139 record discipline.

## Requirement

Add owned Ask/Guide/conversation state and typed model-response adapters. Keep disconnected/blocked/partial states truthful until P07 is accepted. Exit: a committed learner journey resumes correctly on another device. (source: BACKEND_LAUNCH_CHECKLIST.md LEARN-05; KAN-71 description)

## Acceptance criteria → evidence (backend/tests/contracts/conversation/conversation.test.mjs, 6 tests)

- OWNED STATE — conversations are private per-UID, workspace-scoped; another uid or a different workspace is refused uniformly on read and append (`not_owner`/`workspace_mismatch`, no leak).
- TRUTHFUL UNTIL P07 — without an ACCEPTED connected adapter, claiming a `final` or `partial` model answer refuses (`adapter_not_accepted`); only honest `unavailable`/`error` states record, each with an understandable reason; no fabricated answer exists by construction.
- TYPED ADAPTERS — with an accepted adapter, a grounded `final` records content plus citations; a `partial` records truthfully with a reason and carries no full-content claim.
- COMMAND DEDUPLICATION — replayed learner-turn, model-turn, and conversation-create commands converge to the SAME result; the same commandKey with a CHANGED payload refuses (`command_changed`) — retry/reconnect never duplicates turns.
- CROSS-DEVICE RESUME — two controllers over the same store read the identical byte-stable journey (equal digest and turns).
- REVOCATION — a revoked conversation refuses further appends (`conversation_revoked`); history is retained.
- Cross-layer closure: Frontend — N/A in the enabler (teachingInterface/mentorModelService bind at cutover). API — controller wiring binds validated schemas at cutover. Backend — ConversationService composes the owner boundary, the P07 adapter-acceptance seam and typed turn outcomes. Data — owning-store adapter at integration resolves from conversations/turns (append-only) tables. ML — the accepted model adapter is the P07 gate; until then the only truthful states are unavailable/error.

## Commands, exit codes, test counts and timestamps

- Conversation compile + suite: `node scripts/conversation-check.mjs` → tsc `tsconfig.conversation.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-29).
- Lane regressions: all 43 contract modules on this candidate, 0 failures (conversation-new 6, stage 9, reviewschedule 11, coaching 11, reports 6, guardian 6, entitlement 6, organization 6, professional 6, submissions 7, assignment 7, classroom 6, sceneprotocol 12, changefeed 10, scorecard 14, airaflow 14, modalities 5, deadline 6, usagereservation 6, mlgate 7, conversationauth 6, serviceidentity 7, providerscope 4, completion 4, sharing 4, runs 6, guidedbriefs 4, draftrecovery 6, projects 5, evaluation 5, journey 8, dailyplan 7, projections 7, attempts 6, learningsession 8, conceptgraph 8, catalogadapter 7, coverage 7, mediagate 7, retrievalgate 6, qualityscope 6, mlresilience 4, contextassembly 8).
- `data:check` (DATA-01 DDL) requires `DATA_TEST_DATABASE_URL` loopback PostgreSQL and is a DDL check, not part of the contract-module regression list; unchanged by this task and still out of the module-lane scope.

## Remaining defects, limitations and linked open gates

- The P07 adapter-acceptance seam flips only after the separately reviewed private-AI acceptance; until then Ask/Guide record honest unavailable states only.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.
- No model training, new price, data purge, broad AGI claim or expanded Done scope is claimed by this enabler.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
