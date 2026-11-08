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

## Addendum (2026-11-08): advisory-database review executed + non-breaking fixes

The `npm audit --omit=dev` review — originally recorded as an external gate —
was executed on this host. Findings and action:

- **backend runtime: 2 critical → 1.** `proxy-addr` 2.0.7 (IP spoofing via
  IPv4-mapped IPv6 trust subnet, GHSA-jqcg-44mw-7w3h — it implements the
  Express IP-trust evaluation behind the product's `trustedProxyHops`
  device-attribution surface) fixed to 2.0.8 by non-breaking `npm audit fix`,
  alongside `nodemailer` 8.0.5→8.0.11, `ws` 8.20.0→8.22.1, `qs`
  6.14.2→6.14.3, `semver` 7.7.4→7.8.5. Lockfile-only change (295 lines, 30
  versions, no `package.json` range change) — auditable.
- **Remaining critical:** `tar` ≤7.5.20 (path traversal) arrives through the
  DEPRECATED `bull` queue dependency; the fix requires a breaking migration
  to `bullmq` — recorded as an owner decision, out of this review's
  non-breaking slice.
- **frontend: 11 (1 moderate, 10 high)** and **infra runtime: 10 moderate**
  — no non-breaking fix available; owner decision at release time.
- A frontend `npm audit fix` run rewrote that lockfile cosmetically only
  (identical versions, ~25k lines of reordering) — REVERTED, so this commit
  carries only auditable dependency changes.

Full re-verification after the lockfile bump: `backend:build` 0,
`release:security:review` 0 (5/5), `billing:webhook:acceptance` 0,
`release:restore:drill` 0 (5/5), `data:check` 0 (incl. the ACCEPT-07
rehearsal), `npm test` 672/672, `npm run check` 0.

Also verified standalone: the amended RELEASE-05 lane `033eadfb` passes its
own drill suite on its own worktree (so the reviewer can merge the stack in
order with no cross-branch dependency).

## External gates / boundaries

- Container image review (no container runtime on this host — no nested
  virtualization), controlled access/IAM review, and NAMED responders —
  owner actions, procedures in the runbook.
- Advisory follow-ups recorded above (bullmq migration; frontend/infra
  breaking upgrades) — owner decisions.
- No production data, credential or cloud resource touched; Jira transition
  NOT performed (no connector); reviewer pending per D-095.
