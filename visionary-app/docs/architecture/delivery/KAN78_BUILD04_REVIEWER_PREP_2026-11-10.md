# KAN-78 / BUILD-04 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-78-durable-runs` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections, stack integration (merge of dev `2e0b1fbb`; package.json scripts unioned — all eighteen family checks live), data-04 rolling-clock fix (byte-identical).

## Corrections

1. **Proposal-acceptance double-commit AND decision race closed**: `acceptProposal` checked the base then appended non-atomically — two concurrent accepts of different proposals on the same base both committed past the proposals' base (the base-moved law bypassed by racing), and concurrent same-decision replays double-recorded. The store gains `acceptProposalAtomic`: unseen decisionId + current revision == proposal base + payload append + decision record, all together; the loser maps to the idempotent `duplicate` or the typed `base_revision_moved`. SQL adapter law: one transaction with the conditional UPDATE + `INSERT … SELECT`.
2. **Run/proposal ids use `randomUUID`** (instance counters collided across service instances).
3. Narrowing-style fix (`ok === false`).

## Review finding (verified, no further defect)

The run contract reviewed clean otherwise: durable run records with immutable status events (event ids derive from the durable sequence); cancelled runs refuse proposals; ownership enforced on runs and proposals; rejection records the decision with history untouched; idempotent decision replays converge.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Run-contract suite (BUILD-04's own acceptance) | `node --test backend/tests/contracts/runs/run-contract.test.mjs` (after `npx tsc -p tsconfig.runs.json`, exit 0) | **6/6 pass** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| Data-04 fix | blob diff vs canonical | **identical** |

## Notes for the reviewer

- The store is the in-memory reference; the SQL adapter implements `acceptProposalAtomic` in one transaction (the interface comment carries the law).
- Hosted run execution at scale stays founder-gated as originally recorded.
