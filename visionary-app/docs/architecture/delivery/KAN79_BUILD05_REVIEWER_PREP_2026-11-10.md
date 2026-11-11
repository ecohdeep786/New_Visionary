# KAN-79 / BUILD-05 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-79-revision-export` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections `d4fd755e`, stack integration `544f7554` (merge of dev `2e0b1fbb`; package.json scripts unioned — all nineteen family checks live), data-04 rolling-clock fix `ce9af514` (byte-identical), settled review artifacts.

## Corrections

1. **Export command-claim TOCTOU closed** — with a corrected ORDER: the atomic `claimCommand` runs AFTER validation (a refusal records nothing and consumes no command key), then dedups concurrent same-command exports (same-hash replays return the committed artifact; a different payload under the same key refuses with the typed `command_changed`). SQL adapter law: `INSERT … ON CONFLICT DO NOTHING` then read, in one statement.
2. **Export ids use `randomUUID`** (instance counters collided across service instances).

## Review finding (verified, no further defect)

Saved-revisions-only (a generation/preview id refuses; unknown id refuses); supported formats only; byte-stable artifacts (identical inputs → identical body/hash; read-back verbatim; the source revision untouched); owner-gateway reads with workspace matching; revocation makes the artifact unreadable.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Export suite (BUILD-05's own acceptance) | `node --test backend/tests/contracts/export/export.test.mjs` (after `npx tsc -p tsconfig.export.json`, exit 0) | **6/6 pass** |
| Product check gate | `npm run check` (after the coupled artifact chain) | **exit 0 — 866 ok lines, frontend build ok** |
| Data-04 fix | blob diff vs canonical | **identical** |

## Notes for the reviewer

- The saved-revision lookup is injected (maps onto BUILD-01's immutable revisions). Hosted export delivery at scale stays founder-gated as originally recorded.
