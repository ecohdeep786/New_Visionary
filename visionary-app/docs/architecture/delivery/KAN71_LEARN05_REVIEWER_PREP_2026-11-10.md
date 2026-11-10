# KAN-71 / LEARN-05 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-71-conversation-state` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections `7d27c7c8`, stack integration `a174db38` (merge of dev `2e0b1fbb`; package.json scripts unioned — all eleven family checks live), data-04 rolling-clock fix `c45d4b61` (byte-identical), settled review artifacts.

## Corrections

1. **Command-claim TOCTOU closed**: `createConversation`/`appendLearnerTurn`/`recordModelTurn` read the command ledger then acted — two concurrent creates with one commandKey could both claim "new" (orphaning a conversation) and concurrent turn replays could double-append. The store gains `claimCommand` (atomic: unseen key claims "new"; same-hash returns the result ref; different payload is the typed `command_changed`). SQL adapter law: `INSERT … ON CONFLICT DO NOTHING` then read, in one statement.
2. **Conversation/turn ids use `randomUUID`** (instance counters collided across service instances).

## Review finding (verified, no further defect)

The conversation law reviewed clean otherwise: private per-UID workspace-scoped conversations (wrong users see nothing); byte-stable cross-device resume with a digest; honest model-turn recording — until an evaluated adapter is ACCEPTED (P07), claiming final/partial output refuses (`adapter_not_accepted`); only honest `unavailable`/`error` states recordable before acceptance; revocation stops all turns; payload-hash binding means a retried command with different content refuses (`command_changed`) rather than silently forking.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Conversation suite (LEARN-05's own acceptance) | `node --test backend/tests/contracts/conversation/conversation.test.mjs` (after both `tsc` configs, exit 0) | **6/6 pass** |
| Registered gate | `npm run conversation:check` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` (after the coupled review-artifact chain) | **exit 0 — 866 ok lines, frontend build ok** |

## Notes for the reviewer

- The typed model-response adapter is injected; no provider is contacted (P07 qualification gates any accepted adapter — AI-lane scope).
- Hosted conversation persistence at scale stays founder-gated as originally recorded.
