# KAN-29 / SCOPE-02 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/codex-kan-29-coverage-matrix` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: dev integration + resolutions (`9018552d`), decorator repair, data-04 fix (`8a065399`), coverage reconciliation (`66d1611a`), inventory settlement, and the battery commit. NOTE: KAN-30/KAN-32/KAN-36 branches were verified **fully contained in dev** (0 commits ahead) — their Testing status is stale-but-reviewer-owned; no worktree work exists for them.

## Integration work (the heaviest of the lane)

The branch (21 commits over an old base) carried its coverage slice forward into current dev:

- `check.mjs` battery union: dev's evolved battery + the branch's `launch-coverage`/`release-package` script tests + the coverage-matrix step (duplicate `scriptTests` declaration and a union fragment repaired).
- `production-check.mjs`: coverage source/test pairing unioned with dev's knowledge-projection/learning-loop pairings.
- `account.controller.ts`: both import sets + the coverage endpoints unioned; the `@Controller` decorator damaged by resolution was repaired.
- Docs/tracking files: dev's current generations retained (the branch's era notes are superseded; its own KAN-29 receipts live in separate files).
- data-04 rolling-clock fix applied (byte-identical).

## The launch-coverage reconciliation (the law)

The coverage law pins REVIEWED sources by normalized hash in TWO places (matrix anchors + the validator's `reviewedSources` registry) precisely so a matrix-only rehash cannot bless a refactor. Dev legitimately evolved three pinned sources (F-30 product-classification review file; frontend F-series onboarding components; auth profile.ts). Reconciled per the design: BOTH layers updated in one visible commit, hashes normalized (CRLF→LF), and the reviewed `LAUNCH_COVERAGE_MATRIX.md` regenerated via the sanctioned `coverage-matrix.mjs --write`. The drift-refusal tests still pass — the mechanism works; the reconciliation is the visible, reviewable path.

## The coupled-artifact order (law for any future source change)

`surface-audit:write` → `authority-audit --write` → launch-coverage anchor/registry reconcile → `coverage-matrix --write`. Each artifact pins the previous layer's output; running the chain out of order re-drifts the earlier layer. Full `check` gate passes only after the complete chain (verified: exit 0, stable on regeneration rerun).

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Coverage suite | `node --test scripts/tests/launch-coverage.test.mjs` | **12/12 pass** (candidate status retained: 5 roles, 9 categories, 3 locales, 7 source anchors, 0 released slices — no syllabus promise) |
| Authority + limits + release-package | serialized battery | **73/73 pass** (57 registered routes incl. the two coverage operations mapped to ownerRead/ownerWrite; KAN-35 inventory snapshot updated 55→57 in the same visible commit) |
| Script suites at check | motion/tap/continuity/authority/limits/launch-coverage/release-package | **all green — check exit 0, 862 ok lines** |
| Data contracts | `npm run data:check` | **exit 0** (incl. data-04 37/37) |
| Live product | in-app browser journey (pricing → register → email step → auth guards with `returnTo`) | **verified against the live origin, 2026-11-10** |

## Notes for the reviewer

- The coverage endpoints (`GET /api/account/coverage`, `POST /api/account/coverage/check`) are mapped to `ownerRead`/`ownerWrite` in the authority registry — review those mappings against the controller's `commandAccount(req, …)` usage.
- `LAUNCH_COVERAGE_MATRIX.md` still reads `status: candidate` with 0 released slices — KAN-29's own honest scope (coverage scope defined; release comes with released content).
