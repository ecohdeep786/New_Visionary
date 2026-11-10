# KAN-70 / LEARN-04 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-70-daily-plan` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections `e91a8421`, stack integration `9ef2aa7c` (merge of dev `2e0b1fbb`; package.json scripts unioned — all ten family checks live), data-04 rolling-clock fix `cc9b7b68` (byte-identical).

## Corrections

1. **Plan-version duplicate-claim race closed**: `buildDailyPlan` computed `version = prior.length + 1` then saved non-atomically (two concurrent rebuilds could claim the same version). `savePlan` is now a CAS against the current version count — the loser recomputes against the winner (content is deterministic given the same goals and due reviews). SQL adapter law: one conditional INSERT guarded by `NOT EXISTS` on the version.
2. **Plan/review ids use `randomUUID`** (instance counters collided across service instances).

## Review finding (verified, no further defect)

Permitted goals require a released source revision; the plan rebuild is deterministic (goal items + due-review items, each with an understandable reason) and never rewrites a past version; review scheduling requires the review to be actually DUE with its reason (fail-closed `review_not_due`); discovery admits only released concepts; the evidence-ledger probe (`evidenceUnchanged`) proves no planning rebuild touched the ledger.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Daily-plan suite (LEARN-04's own acceptance) | `node --test backend/tests/contracts/dailyplan/daily-plan.test.mjs` (after `npx tsc -p tsconfig.dailyplan.json`, exit 0) | **7/7 pass** |
| Registered gate | `npm run dailyplan:check` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Notes for the reviewer

- The store is the in-memory reference; the SQL adapter implements `savePlan` as the conditional version-guarded INSERT.
- Hosted planning at scale stays founder-gated as originally recorded.
