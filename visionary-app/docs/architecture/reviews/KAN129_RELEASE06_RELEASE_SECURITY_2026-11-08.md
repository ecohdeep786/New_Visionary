# KAN-129 / RELEASE-06 — Release-Path Security Review Receipt

**Date:** 2026-11-08
**Lane:** zcode backend/ML specialist lane (founder-assigned)
**Branch:** `zcode/kan-129-release06-release-security` (worktree `nv-worktrees/kan-129-release06`; lane stack kan-102 → kan-103 → kan-123 → kan-128 (amended @ `033eadfb`, merged here) → this branch; base `origin/dev` @ `4bb3c22d`)
**Reviewer:** pending per D-095 — this receipt is submitted evidence, not a merge approval.
**Status:** LOCAL SLICE COMPLETE — the container image review, controlled access/IAM review, advisory-database review and NAMED responders remain the owner's external gates.

## Task

Complete release-path security/dependency/image reviews, controlled access
review, secret rotation and incident/support/on-call runbooks with named
responders.

## Claim verification (before starting)

- KAN-129 had NO local or remote branch from any lane; `blockedBy: []`;
  unclaimed after the local-maximum set was exhausted.

## What was delivered

- `backend/tests/contracts/release-06/release-security.test.mjs` — 5 tests:
  patch provenance integrity, dependency lockfile pin law, secret-surface
  law, and the LIVE two-epoch secret-rotation drill.
- `scripts/release06-security-review.mjs` + `npm run release:security:review`
  — env-guarded registered command (typed `BLOCKED_ENVIRONMENT` + guidance).
- Additive harness change: fixture-mode webhook-secret/job-token overrides in
  `bill-01/stack.cjs` (the rotation drill restarts the stack with rotated
  credentials; the fixture previously hardwired its secrets).
- `docs/architecture/delivery/RELEASE06_RELEASE_SECURITY.md` — the security
  runbook: review results, the operator rotation procedure, and the
  incident/on-call runbook skeleton with responder GATES.
- `backend/README.md` — D-113 registration paragraph.

## Evidence (green run, 2026-11-08)

| Review / drill | Proof |
| --- | --- |
| Patch provenance integrity | all 9 recorded patches: decision present, diff exists, diff bytes match the recorded sha256, touched files listed — a silently edited patch fails the release path |
| Dependency pins | all 5 dependency-carrying workspaces: v3+ lockfile, every declared dependency resolves to an exact locked version with integrity hash |
| Secret-surface law | zero fixture-secret occurrences in product source; webhook secret read only from configuration with no hardcoded default |
| Rotation (pre) | registered-secret webhook accepted 201; identical bytes signed with an unregistered secret refused 403 |
| Rotation (live) | after a FULL product restart with rotated webhook secret + job token: stale secret 403, rotated secret 201, stale job token 403, rotated job token 201 |

## Honest findings recorded during the review

1. **The provenance registry records import-BASELINE-relative paths**
   (visionaryorg/visionary-dev @ `81e861be`): several recorded paths
   (`services/api-gateway`, `shared/go`, `eval/`) are legacy references that
   resolve nowhere in the current tree. The hard law (diff byte-integrity)
   holds for every patch; the stale-path count is recorded in the report as a
   finding with the documented resolution root — not silently ignored.
2. **Rotation is a full-restart procedure**: credentials are read at
   composition time, so the drill rotates by stopping and restarting the
   product exactly as the operator runbook prescribes — there is no
   hot-reload path to prove.
3. **An unregistered-but-perfectly-formed signature fails closed** — the
   webhook secret is not just an integrity tag but the admission key.

## Gates (this branch)

- `npm run release:security:review` — exit 0 (5/5).
- `npm run billing:webhook:acceptance` — exit 0 (BILL-02 regression).
- `npm run release:restore:drill` — green after merging the amended kan-128
  lane (the drill's damage-billing fixture route had been left uncommitted on
  kan-128; amended to `033eadfb` with `--force-with-lease` and merged here —
  recorded for the reviewer's stack review).
- `npm run backend:build` — exit 0.
- `npm test` — 672/672 (dev-base suite); `npm run check` — exit 0.

## External gates / boundaries

- Container image review (no container runtime on this host — no nested
  virtualization), controlled access/IAM review, advisory-database review
  (network-dependent) and NAMED responders — owner actions, procedures in the
  runbook.
- No production data, credential or cloud resource touched; Jira transition
  NOT performed (no connector); reviewer pending per D-095.
