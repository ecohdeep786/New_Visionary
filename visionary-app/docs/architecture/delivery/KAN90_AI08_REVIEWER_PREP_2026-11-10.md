# KAN-90 / AI-08 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-90-deadline-reconciliation` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections, stack integration (merge of dev `2e0b1fbb`; package.json scripts unioned — all twenty-nine family checks live incl. the domain's own registered gate), data-04 rolling-clock fix (byte-identical).

## Corrections

1. **Terminal-transition race closed**: all five terminal paths (deadline checkpoint, cancel, complete, disconnect — and restore-from-partial variants) read-then-blind-saved the terminal status, so a cancel racing complete (or any two terminal paths racing) could overwrite the terminal outcome (last-writer-wins). The store gains `transitionTerminal` (atomic: conditional on the status still being 'running' — the FIRST terminal transition wins deterministically, the loser reports `already_terminated`). SQL adapter law: one `UPDATE … WHERE requestId = ? AND status = ?` inside the transaction. All five paths route through it; `recordPartial` remains non-terminal.
2. **Request ids use `randomUUID`** — and the fix exposed that the old counter ids ACCIDENTALLY collided across service instances: the not-owner test was silently calling service A with service B's `req_1` id (the collision made it exist). The test now uses its own service's request honestly — the assertion's law (wrong users denied) is unchanged and still proven.

## Review finding (verified, no further defect)

The reconciliation state machine reviewed clean otherwise: whole-request deadline tracking with partial-body preservation at provider checkpoints; the deadline honored honestly (a completion arriving after the deadline delivers as PARTIAL, not final); caller cancellation stops provider work with partial stays partial; long Build jobs refused the teaching protocol (they ride the durable run protocol); disconnected cleanup; owner-only scoping throughout.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Deadline suite (AI-08's own acceptance) | `node --test backend/tests/contracts/deadline/deadline.test.mjs` (after `npx tsc -p tsconfig.deadline.json`, exit 0) | **6/6 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| Data-04 fix | blob diff vs canonical | **identical** |

## Notes for the reviewer

- The store is the in-memory reference; the SQL adapter implements `transitionTerminal` in one conditional UPDATE (the interface comment carries the law).
- Hosted deadline/cancel reconciliation against real providers stays founder-gated as originally recorded.
