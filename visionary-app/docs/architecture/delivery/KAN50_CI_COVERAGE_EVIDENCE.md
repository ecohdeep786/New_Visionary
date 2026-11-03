# KAN-50 / PLAT-06 — product CI coverage audit evidence

Implementer: deepseek lane (senior product engineer agent). This document supplies implementation evidence and requests separate review (D-095); the implementer cannot approve its own work.

## Scope

- Jira key / source ID: KAN-50 / PLAT-06, parent KAN-4 (P02 — product-owned staging and delivery).
- Requirement: add product CI — component tests/builds, provenance/secrets/dependency checks, API/schema compatibility, immutable image release, staging smoke, canary and rollback.
- Deliverable: a repeatable, read-only **CI coverage audit** (`infrastructure/gcp/ci-audit.mjs`) that structurally verifies the committed workflow (`.github/workflows/production.yml`) provides every PLAT-06 element with least-privilege triggers/credentials, plus structural tests and a live run at the candidate. No workflow was modified; no CI run was triggered by this lane.
- Worker branch: `codex/deepseek-kan-50-ci-audit`, base `2f8e3f7448efd8b644522a0b82272b22f9aa1dc6` (verified `origin/dev` tip). Candidate: this file's commit (exact SHA in the Jira review comment).

## What the audit verifies (9 checks, read-only over the committed YAML + release.mjs)

1. **triggers** — `push` + `pull_request` cover `[dev, main]`; `workflow_dispatch` remains for controlled owner runs.
2. **least-privilege-permissions** — top-level `contents: read`; the production job requests only `contents: read` + `id-token: write` (no write-all anywhere).
3. **pinned-actions** — all 7 `uses:` steps are pinned to full 40-hex commit SHAs (provenance; no floating tags).
4. **component-tests-builds** — the checks job runs the whole product battery (`npm run check`), the data suite against a pinned `postgres:16` service, and the infrastructure node + python suites.
5. **dependency-secret-checks** — three `npm audit --omit=dev --audit-level=high` runs (frontend, infra runtime, contracts); zero secret literals in the workflow (private keys, AWS/Google/GitHub token patterns, password literals); cloud auth is Workload Identity Federation only (no static keys).
6. **api-schema-compatibility** — the integration contracts package is installed and its suite runs inside the check battery.
7. **immutable-release-smoke** — production job order is build-image → container-smoke → publish; `release.mjs publish` releases the digest-pinned immutable image built from the exact `GITHUB_SHA`.
8. **canary-rollback** — deployment stays behind the reviewed repository switch (`PRODUCTION_DEPLOY_ENABLED`), goes through `release.mjs deploy`: no-traffic candidate with the `ci-candidate` tag, candidate/canonical probes, promotion only while the candidate SHA remains remote main head, and automatic rollback to the previous verified revision (`moveTraffic(previous)` with explicit rollback verification); deploys serialize through a concurrency group with `cancel-in-progress: false`.
9. **job-bounds** — every job declares a bounded `timeout-minutes` (15 checks / 25 production).

## Evidence

| # | Check | Command | Result |
| --- | --- | --- | --- |
| 1 | Offline structural suite | `node --test infrastructure/gcp/tests/ci-audit.test.mjs` | **11/11 pass** — the committed workflow passes all 9 checks, plus refusal cases: unpinned action, missing smoke-before-publish, hardcoded AWS key literal, zeroed dependency audits, weakened permissions, removed rollback verification, missing timeouts, narrowed triggers, dropped component battery |
| 2 | Live audit at the candidate | `node infrastructure/gcp/ci-audit.mjs` | **9/9 PASS, exit 0**: "every PLAT-06 element is structurally provided by the committed workflow" |
| 3 | Full infrastructure suite | `node --test infrastructure/gcp/tests/*.test.mjs` + python bootstrap | counts recorded in the Jira review comment |

Runtime corroboration already on record (not re-produced by this lane): the recorded main-push run **39405370084** passed checks, Linux build/container smoke, keyless immutable publish, no-traffic candidate/proxy verification, promotion, canonical checks **and an actual rollback restoration** (see `infrastructure/gcp/README.md` § First-time owner setup, 2026-10-20 state); CI runs on every push/PR to dev and main per the verified triggers.

## Honest scoping

- This is a structural audit of the pipeline definition plus its recorded runtime evidence; it does not itself execute a deployment. Owner-gated remainders: setting the repository switches, cutting over hosted environments (PLAT-03/05 remainders), and any future change to the workflow re-runs this audit automatically in the checks job (the suite ships with the repo).
- The workflow file is read with CRLF tolerance normalized in tests; the audit content checks are line-ending agnostic.
- PLAT-07 (observability, principal lane, Testing) and PLAT-08 (backups, founder-gated gcloud) are separate gates.

## Review handoff

Exact candidate SHA and suite counts are in the Jira review comment. Reviewer must be separate from this lane. Repeat command: `node infrastructure/gcp/ci-audit.mjs` (read-only; exit code is the verdict).
