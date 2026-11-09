# KAN-127 / RELEASE-04 — per-completed-task economics and enforced spend admission review handoff

9 November 2026. Implementer: Senior Principal Backend & ML Engineer (ZCode lane).
Branch `zcode/kan-127-release04-per-task-economics` off `dev` (`2e0b1fbb`). Reviewer:
**pending per D-095**. Not merged into `dev`; worktree left for the reviewer at
`C:/Users/Administrator/nv-worktrees/kan-127-release04`.

## Acceptance scope

Engineering half of RELEASE-04 delivered end-to-end. Full statement:
[RELEASE04_PER_TASK_ECONOMICS.md](../delivery/RELEASE04_PER_TASK_ECONOMICS.md).
Evidence: [release04/evidence.json](../delivery/release04/evidence.json) + captured
TAP.

The hosted/provider/merchant half — the **actual provider/model cost figures the
deployment admits against, the reviewed enforced live spend cap, calibrated human
quality review and real outage/latency telemetry** — is **NOT** claimed: recorded
as external gates, per the BILL-01 local-maximum doctrine. This change proves the
enforcement and accounting laws with the product gate and the model; a deployment
feeds reviewed numbers into both.

## What changed (product source)

- `billing/spend-admission.ts` (new) — `BillingSpendAdmission` enforced spend-cap
  gate: explicit opt-in (`BILLING_SPEND_ADMISSION=enabled`); fail-closed cap
  (a misconfigured cap while enabled is a refusal, never "no limit"); `admit`
  refuses with a typed 503 when a commit would exceed the cap; `settle` releases
  reserved spend; off by default (byte-identical).
- `billing/razorpay.provider.ts` — the gate is constructed here (compiled-graph
  reachable from `main-product.ts`) and consulted on every provider request;
  `spend()` exposes the snapshot.
- `billing/billing.service.ts` — the subscription create path passes the committed
  spend (plan amount × billing cycles) into the provider request, so with
  enforcement enabled a new committed subscription is the admitted spend.

## What changed (model, docs, tracking)

- `scripts/per-task-economics.mjs` (new) + fixture + 8-test law suite — the
  unit-economics model (completed-only denominator; failed attempts charged;
  storage/egress/support/ops attribution; latency/error budgets; pinned-quality
  provenance; fail-closed beta capture; enforced not alert-only decision).
- `scripts/release04-economics.mjs` runner + `release:economics` npm script;
  `per-task-economics.test.mjs` registered in `scripts/check.mjs` scriptTests.
- KAN-31 authority inventory regenerated (`--write`) — hash-only drift on the two
  edited billing sources; counts unchanged.
- Tracking appended additively (never parse+stringify), status **Testing**.

### Pre-existing defect fixed (separate, test-fixture-only commit)
`data-04/invitations.test.mjs` hardcoded its injected clock to
`2026-11-02T00:00:00Z`; the 7-day default expiry became strictly past on
2026-11-09, so 22/37 invitation tests threw `expired` (reproduced identically on
pristine `dev`; identical fix already recorded on the BILL-06 branch `61ecc15e`,
not yet in `dev`). Rebased the clock to a rolling per-run base
(`Date.now() - 1 day`). Test-fixture only; committed separately.

## Verification at this branch head

| Gate | Result |
| --- | --- |
| `npm run release:economics` | 6/6 spend-admission law + 8/8 unit-economics = **14/14** |
| `node scripts/authority-audit.mjs --write` | hash-only (2 `sha256Lf`), counts unchanged |
| `npm run check` | exit 0 (roots, 3842-file baseline, qa laws, 122 script tests incl. new 8, surface audit, lint, typecheck, unit, build) |
| Backend `tsc` | exit 0 |
| Legacy billing | 22/22 (gate off, byte-identical) |
| `node scripts/production-check.mjs` | **exit 0**: locked compile 102/102, provisioning 11/11, data-04 37/37, privacy 52/52 |

## Explicitly not accepted here

Actual provider/model prices and the reviewed enforced live cap, calibrated human
quality review, real outage/latency telemetry, and any merchant/GA/cohort release
are hosted/owner gates. The enforced gate and the unit-economics accounting are
first-party and proven; no real money, no live provider call, and no invented
"measured this deployment" number is claimed.
