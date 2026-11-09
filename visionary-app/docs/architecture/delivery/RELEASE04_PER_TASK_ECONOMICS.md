# RELEASE-04 (KAN-127) — per-completed-task economics and enforced spend admission

**Task:** RELEASE-04 (KAN-127), P12 checklist line
([BACKEND_LAUNCH_CHECKLIST.md](../BACKEND_LAUNCH_CHECKLIST.md)):

> Measure useful-answer/artifact quality, latency/error budgets and cost per
> completed task including failed attempts, storage/egress, support and
> operations. Apply enforced spend admission, not alerts alone.

**Refinements recorded on the board (D-088/D-090):** include total
per-completed-learning/Build task audio/provider/storage/failed-attempt cost and
independently assessed usefulness; include retained inactive learner/project/
history storage, reactivation and actual supported Free/paid/sponsored usage plus
voice/model costs in viable unit-economics scenarios; context compression/eviction
is not a deletion policy.

**Owner:** Senior Principal Backend & ML Engineer. **Branch:**
`zcode/kan-127-release04-per-task-economics` off `dev` (`2e0b1fbb`). **Status:**
implemented, locally proven, reviewer pending per D-095. Not merged into `dev`.

## The gap this closes

The D-075 cost model (`scripts/cost-model.mjs`) computes an **aggregate** model
charge and `aiCostPerTurn`, but nothing measures or gates the **unit cost per
completed task**:

- **failed attempts** are not separated: a retry that fails still charges provider
  cost, but it is not a completed task — if the accounting mixes them, unit cost is
  silently understated and failed attempts look like "more throughput";
- **storage/egress, support and operations** are not attributed per completed
  task, so a launch record cannot show the true all-in unit economics;
- **quality** (useful-answer/artifact rate) is not required to be pinned to a
  rubric/source/model — an unpinned "quality" number can be an invented claim
  (D-084: pin the provider/model/prompt/source/routing manifest, use independent
  held-out cases, repeated trials and calibrated human review);
- **latency/error budgets** are not measured against the documented envelopes
  (transport 20s / backend 18s / provider 14s; 99.9% permits 43.2 error-budget
  minutes/month);
- **there is no enforced spend cap**: launch-operations.md says "alerts-only
  budgets are not spending caps". Before this change a deployment could only
  alert; it could not make a cap actually refuse.

## What was built

### 1. Enforced spend admission (product source)

`backend/upstream/backend/src/billing/spend-admission.ts` — a first-party
`BillingSpendAdmission` gate, wired into `RazorpayProvider` (the compiled
product entrypoint `main-product.ts` reaches it through the billing service:

- **Enforcement is a deliberate opt-in.** `BILLING_SPEND_ADMISSION=enabled` turns
  the gate on; anything else keeps the existing runtime byte-identical (every
  legacy billing regression stays green, verified).
- **Fail-closed cap.** Once enabled, a missing/empty/non-numeric/non-positive
  `BILLING_SPEND_ADMISSION_CAP` is itself a refusal — the gate never interprets a
  misconfiguration as "no limit".
- **Typed 503, never an alert.** `admit(costUnits)` refuses with a typed 503 when
  admitting would exceed the enforced cap; `settle(costUnits)` releases reserved
  spend after an operation that did not complete. There is no "warn but allow"
  mode (alerts are not enforcement).
- **Committed spend is what is admitted.** The subscription create path now passes
  the committed value (plan amount × billing cycles) to the provider call, so with
  enforcement enabled a new committed subscription is refused once the enforced
  cap would be exceeded. The exact spend figure a live deployment admits against is
  a reviewed unit-cost input (hosted gate); here the mechanism is proven with the
  test plan's committed values.

### 2. Per-completed-task economics model

`scripts/per-task-economics.mjs` — pure functions over a task-economics profile,
by the same discipline as RELEASE-01's workload model (`kind`/`via` provenance on
every derived figure; a `capture.source === 'beta'` claim without
window/population is refused; synthetic demos are labeled as such):

- **Unit-economics law** — `costPerCompletedTask = attributableTotal / completed`;
  the denominator is **completed tasks only**; failed attempts are charged (they
  add provider cost) but never counted as completed.
- **Attribution** — provider, storage, retained-inactive storage (D-090 retention
  is not deletion), egress, support and operations each appear as a separate line.
- **Latency budgets** — observed whole-operation/backend p95 against the documented
  20s/18s (provider ≤14s recorded) envelopes; outside-budget marked explicitly.
- **Error budget** — observed failure share vs the 99.9% objective (43.2
  minutes/month), reported as steering; hosted outage minutes remain a telemetry
  gate.
- **Quality only when pinned** — a useful-rate is refused without
  rubric/source/model versions (D-084), and marked assumption unless
  independently reviewed on held-out cases.
- **Enforced (not alert-only) decision** — `spendAdmissionDecision` mirrors the
  product gate: over-cap ⇒ refused, misconfigured-cap ⇒ refused, off ⇒ admitted.

## Proof (14/14)

`npm run release:economics` runs two layers.

**Layer 1 — `backend/tests/contracts/release-04/spend-admission-law.test.mjs`**
(6/6, compiled product module, emulator-free): off = byte-identical behavior;
within-cap reservations counted; over-cap refuse is a typed 503 and consumes no
reserve; misconfigured cap is fail-closed; non-finite/negative amounts refused
without consuming reserve; settle releases and clamps at zero.

**Layer 2 — `scripts/tests/per-task-economics.test.mjs`** (8/8, emulator-free):
histogram summary rejects malformed shapes; the unit-economics law (failed
attempts charged, never completed; denominator completed-only); failure share and
43.2-minute error budget; latency p95 vs the 20s/18s envelopes with
outside-budget detected; quality refused without pins; beta provenance fail-closed;
spend admission is enforced not alert-only; report provenance distinguishes
distribution vs assumption.

## What remains a hosted gate (honest boundary)

These are **not** proven here and are recorded as external gates for KAN-127:

1. **Actual provider/model cost figures and the reviewed per-completed-task
   spend value a deployment admits against.** Real token/audio/storage/egress
   prices and the enforced live cap are configuration + provider-console gates;
   live keys are prohibited in this environment.
2. **Calibrated human quality review.** The model requires pins and marks
   independent held-out review; a real calibrated human/labeled reassessment is a
   hosted evaluation gate.
3. **Hosted measurement of outage minutes and real latency under production
   traffic.** The model computes the budgets and steers against them; the observed
   numbers come from a hosted release/load gate (RELEASE-01/02 lineage).
4. **Real second-device/outage privacy-recovery evidence** for affected
   operations belongs to the hosted acceptance (ACCEPT) gates.
5. **D-095 reviewer approval and integration into `dev`.**

## Verification at this branch head

| Gate | Result |
| --- | --- |
| `npm run release:economics` | 6/6 spend-admission law + 8/8 unit-economics = 14/14 |
| `node scripts/authority-audit.mjs --write` | hash-only: 2 `sha256Lf` lines for the edited billing sources; counts unchanged (55/6/12/16/32) |
| `npm run check` | exit 0 (roots, 3842-file import baseline, continuity/motion/taps, 122 script tests incl. the new 8, surface audit, lint, typecheck, unit tests, build) |
| Backend typecheck / `tsc -p tsconfig.json` | exit 0 |
| Legacy billing suite | 22/22 (byte-identical with the gate off) |

### Pre-existing defect fixed (separate, test-fixture-only commit)
The `data-04` invitation suite hardcoded its injected clock
`const at = new Date('2026-11-02T00:00:00Z')`. Because every default invite sets a
7-day expiry, from 2026-11-09 the expiry (`2026-11-09T00:00Z`) was strictly in the
past against the real DB `clock_timestamp()`, so `invite` threw
`InvitationPolicyError('expired')` — **22 of 37** data-04 tests failed, reproduced
byte-identically on pristine `dev` (and identical to the fix already recorded on
the BILL-06 branch, `61ecc15e`; it is not yet in `dev`). Fixed with a rolling
per-run base (`Date.now() - 1 day`), keeping the suite's own
`at + 7d > now > at` invariant deterministically within a run. Test-fixture only;
no product or assertion semantics changed; committed separately for easy review.

## Reproduce

```bash
npm run release:economics   # spend-admission law (6) + unit-economics (8)
npm run check               # full product gate
export JAVA_HOME=<temurin-21>
export DATA_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5433/visionary_data_test_accept07
node scripts/production-check.mjs
```
