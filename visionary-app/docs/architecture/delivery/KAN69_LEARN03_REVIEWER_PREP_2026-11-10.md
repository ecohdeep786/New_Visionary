# KAN-69 / LEARN-03 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-69-mastery-projections` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections `e5705a46`, stack integration `0fc6c945` (merge of dev `2e0b1fbb`; package.json scripts unioned — all nine family checks live), data-04 rolling-clock fix `861e4ce5` (byte-identical).

## Correction — projection-version duplicate-claim race closed

`project()` computed `version = previous + 1` then saved non-atomically: two concurrent projections with different evidence could both claim the same version, breaking the monotonic versioned-history law. `saveSnapshot` is now a CAS against the expected previous version — the loser recomputes against the winner, and identical evidence converges to the winner's snapshot (deterministic, bounded retry). SQL adapter law: one conditional INSERT guarded by `NOT EXISTS` on the version.

## Review finding (verified, no further defect)

The projection law reviewed clean: assessed events require rubric provenance (`assessed_without_rubric` refuses); mastery precedence is honest (assessed > attempt > self-review > consumption; consumption is explicitly `consumed_only`, never mastery; `masteryEligible` requires a passed assessment); review scheduling derives only from assessed outcomes and self-reviews with explicit reasons; determinism holds (identical evidence → identical fingerprint → no version churn); privacy is owner-scoped.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Projection suite (LEARN-03's own acceptance) | `node --test backend/tests/contracts/projections/projection.test.mjs` (after `npx tsc -p tsconfig.projections.json`, exit 0) | **7/7 pass** |
| Registered gate | `npm run projections:check` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Notes for the reviewer

- The stores are the in-memory reference; the SQL adapter implements `saveSnapshot` as the conditional version-guarded INSERT and appends evidence immutably.
- Hosted projection computation at scale stays founder-gated as originally recorded.
