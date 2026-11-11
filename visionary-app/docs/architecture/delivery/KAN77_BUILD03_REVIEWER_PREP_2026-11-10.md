# KAN-77 / BUILD-03 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-77-guided-briefs` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections, stack integration (merge of dev `2e0b1fbb`; package.json scripts unioned — all seventeen family checks live), data-04 rolling-clock fix (byte-identical).

## Corrections

1. **Amend version race closed**: `amendBrief` computed `version = latest + 1` then saved non-atomically — two concurrent amends could claim the same version. `saveBriefCas` guards the version (the loser recomputes; deterministic content converges). SQL adapter law: one conditional INSERT guarded by `NOT EXISTS` on the version.
2. **Brief ids use `randomUUID`** (instance counters collided across service instances).

## Review finding (verified, no further defect)

The verified-brief law reviewed clean: every pin verifies against server-side evidence BEFORE the brief commits (released revision, rubric existence, check existence, and each practice-evidence id owned by the requester); ownership is verified before brief lookup (a stranger is denied as `not_owner`, not misled by unknown-project); amends append immutable versions (previous stays byte-stable); a blank project needs no brief.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Guided-briefs suite (BUILD-03's own acceptance) | `node --test backend/tests/contracts/guidedbriefs/guided-brief.test.mjs` (after `npx tsc -p tsconfig.guidedbriefs.json`, exit 0) | **4/4 pass** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| Data-04 fix | blob diff vs canonical | **identical** |

## Notes for the reviewer

- The evidence lookup is injected; the SQL adapter maps onto the CONTENT/LEARN stores. Hosted guided-brief persistence at scale stays founder-gated as originally recorded.
