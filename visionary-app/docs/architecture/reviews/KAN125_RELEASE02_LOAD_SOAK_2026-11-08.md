# KAN-125 / RELEASE-02 — Realistic Load and Soak Receipt

**Date:** 2026-11-08
**Lane:** zcode backend/ML specialist lane (founder-assigned)
**Branch:** `zcode/kan-125-realistic-load-soak` (worktree `nv-worktrees/kan-125-load-soak`, base `origin/dev` @ `9b0102df`)
**Reviewer:** pending per D-095 — this receipt is submitted evidence, not a merge approval.
**Status:** LOCAL SLICE COMPLETE — hosted capacity, the 24h soak and real provider quotas remain the owner's external gates.

## Task

Run realistic data/index load and soak tests against the selected baseline:
150 core requests/s and 16.7 AI runs/s sustained, 300/33.4 burst, plus
explicitly selected Build traffic and school-start scenario.

## Claim verification (before starting)

- KAN-125 had NO local or remote branch from any lane; `blockedBy: []`;
  unclaimed after the local-maximum set was exhausted. `sourceId: RELEASE-02`,
  confirmed via `jira-issue-map.json` (RELEASE-02 → KAN-125).

## What was delivered

- `backend/tests/contracts/release-02/load-stack.cjs` — the load harness: the
  real product runtime (auth, account, billing, learning loop, knowledge
  projection, feedback, consent, privacy policy controllers) over the real
  identity plane, behind a real TLS terminator on the canonical origin.
- `profiles.cjs` — the workload model: the DOCUMENTED baseline loaded from
  `launch-operations.md`, the realistic core/learning mixes, and the honest
  scaled profiles.
- `metrics.cjs` — percentiles (nearest-rank), the error taxonomy and the
  degraded/ok/failed verdict.
- `driver.cjs` — the bounded arrival process, authenticated account pool,
  signed provider webhook delivery with exact raw bytes, and one shared
  keep-alive agent.
- `load-soak.test.mjs` — 10 tests (see evidence).
- `scripts/release02-load-soak.mjs` + `npm run release:load:soak` — env-guarded
  registered command (typed `BLOCKED_ENVIRONMENT` + guidance).
- `docs/architecture/delivery/RELEASE02_LOAD_SOAK.md` — the runbook.

## Evidence (green run, 2026-11-08, 10/10 tests)

| Profile | Issued | Success | p50 | p95 | 503 | 5xx | Transport |
| --- | --- | --- | --- | --- | --- | --- | --- |
| core sustained (25/s worker) | 250 | 100% | 28 ms | 73 ms | 0 | 0 | 0 |
| learning-run sustained | 30 | 100% | 66 ms | 100 ms | 0 | 0 | 0 |
| payment webhook storm (identical duplicates) | 60 | 100% | 20 ms | 36 ms | 0 | 0 | 0 |
| class-start burst | 200 | 100% | 19 ms | 49 ms | 0 | 0 | 0 |
| saturation burst (200/s) | 800 | 91.75% | 30 ms | 8,291 ms | 66 | **0** | **0** |
| bounded soak (20 s) | 400 | 100% | 50 ms | 81 ms | 0 | 0 | 0 |

**Degradation law proven:** at 8× the worker rate the runtime refused 66
requests — every one a typed `503`, with zero unhandled 5xx and zero dropped
connections. This is now a permanent regression test, not a one-off observation.

## Honest findings recorded during the work

1. **The AI-run substitute is the durable teaching loop, not a model call.**
   No provider is contacted, so this proves the runtime path (scheduling,
   admission, durable writes, authority), never provider quota or model latency.
2. **`nest build` omits the privacy-policy JSON asset** that the deployed
   `tsc -p tsconfig.product.json` build emits. The harness copies it to the
   compiled location so the policy route reflects production. Recorded in the
   runbook so it is never mistaken for a product defect.
3. **The local test terminator needed a larger accept backlog**; without it a
   burst produced `ECONNREFUSED` that was a property of the fixture, not the
   product.
4. **SQL-backed surfaces are deliberately not composed.** A full SQL pool
   budget belongs to the hosted/RELEASE-03 gate; the harness never fabricates a
   SQL authority.

## Gates (this branch)

- `npm run release:load:soak` — green (10/10).
- `npm run backend:build` — exit 0.
- Root `npm test`, `npm run check`, `npm run data:check` — see the receipt
  footer for the final numbers.

## External gates / boundaries

- Hosted baseline run, sized SQL pool, real provider quotas, beta workload
  distributions — owner actions, recorded in the runbook.
- No production data, credential or cloud resource touched; Jira transition
  NOT performed (no connector); reviewer pending per D-095.
