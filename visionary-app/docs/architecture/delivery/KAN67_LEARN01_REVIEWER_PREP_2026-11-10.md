# KAN-67 / LEARN-01 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-67-learning-sessions` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections + stack integration (merge of dev `2e0b1fbb`; scripts unioned; data-04 rolling-clock fix present, byte-identical).

## Corrections

1. **Checkpoint double-advance closed**: the service committed via read-check-insert — two concurrent checkpoints with the same `expectedRevision` could both pass the fence and double-advance the revision, breaking the revision-fence law on concurrent devices. The store gains `commitCheckpoint` (atomic: unseen commandId + current revision == expectedRevision, applied together; the loser receives the current revision for a preserved-local retry). SQL adapter law: one conditional `UPDATE … WHERE revision = expectedRevision` inside the checkpoint-insert transaction.
2. **Session ids use `randomUUID`** (the instance counter `ls_1, ls_2…` collided across service instances sharing a store).
3. Narrowing-style fix (`committed.ok === false`) — the truthiness form did not narrow under this TS config.

## Review finding (verified, no further defect)

The lifecycle reviewed clean otherwise: released-revision pinning at start (unknown/unreleased refused), owner+workspace scoping, command-id idempotency (retries converge to the committed row), preserved-local refusals (a revision conflict returns the current revision so the learner's draft is never silently dropped), committed-cursor resume (pin + latest checkpoint + revision + committing device), and idempotent complete/cancel whose cancelled sessions refuse checkpoints but stay resumable.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Learning-session suite (LEARN-01's own acceptance) | `node --test backend/tests/contracts/learningsession/learning-session.test.mjs` (after `npx tsc -p tsconfig.learningsession.json`, exit 0) | **8/8 pass** |
| Registered gate | `npm run learningsession:check` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Notes for the reviewer

- The store is the in-memory reference; the SQL adapter must implement `commitCheckpoint` atomically (see the interface comment) — the fence law depends on it.
- Real second-device journeys over hosted sessions stay founder-gated as originally recorded (ACCEPT-01's chain covers the released-slice journey).
