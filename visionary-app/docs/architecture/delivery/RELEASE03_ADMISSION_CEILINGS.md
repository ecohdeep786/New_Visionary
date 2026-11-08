# RELEASE-03 (KAN-126) — admission ceilings, tenant fairness and dependency-failure degradation

Requirement (`docs/architecture/tracking/education-launch.json`,
`implementationRequirement`):

> Obtain actual provider quotas; prove instance/pool/concurrency/admission
> ceilings, tenant fairness, queue drain and user-visible throttling under spikes
> and dependency failure.

The governing law is recorded in
`docs/architecture/discussions/launch-operations.md` § *Admission control*:

> Admission control enforces per-UID/device/workspace quotas, plan-authorized
> concurrent runs, output-token/context limits and global provider budgets. A
> shared coordinator must enforce the real global cap; per-instance counters
> cannot. … Return typed 429/503 with clear retry timing rather than allowing
> unbounded in-memory waiting. **Give billing its own queue and provider circuit
> breaker.**

This delivery proves locally what the law requires, and records exactly what
remains a hosted gate. It never contacts a real payment provider and never claims
hosted quota.

## What was implemented (product source)

Two admission gaps the recorded law named but the product did not yet satisfy:

1. **Clear retry timing on typed backpressure.**
   `backend/upstream/backend/src/platform/production-http.ts` gained an
   `admissionRetryAfter` composition step, installed after the security headers
   and body parsers in `configureProductionHttp` (the composition used by the
   real API entrypoint `main-product.ts`). It attaches `Retry-After` (429 → 30s,
   503 → 15s) to every typed 429/503 response exactly once, never overwrites a
   handler-supplied value, and never adds the header to a 2xx. This gives the
   frontend transport and any client a concrete back-off instead of an unbounded
   retry loop.

2. **A billing provider circuit breaker.**
   New first-party module
   `backend/upstream/backend/src/billing/provider-circuit-breaker.ts`, wired into
   `RazorpayProvider` (`.admit()` before each provider call, `.settle(ok)` on the
   outcome). It opens after 3 consecutive provider failures and refuses fast with
   a typed 503 instead of opening further calls the provider cannot serve; after
   a cooling window a single half-open probe is admitted, and its success closes
   the breaker while a failure re-opens it and counts the re-open. The cooling
   window is deployment-tunable (`BILLING_PROVIDER_BREAKER_COOLING_MS`); an
   absent, empty, non-numeric or negative value falls back to the documented 15s
   default, and `BILLING_PROVIDER_BREAKER=disabled` is an explicit opt-out for a
   controlled composition.

Neither change adds a second authority: the breaker bounds outbound calls to one
provider in-process (honest for the single-connection runtime), while the
cross-instance budget for *admitted work* remains the Firestore-transactional
rate limiter.

## What is proven locally

`npm run release:admission` runs two layers against the compiled product modules.

**Layer 1 — `backend/tests/contracts/release-03/breaker-law.test.mjs`** (9/9, no
emulator): the breaker state machine — closed below threshold, opens at the third
failure, refuses fast with a typed 503, resets on success, honours the cooling
window, admits exactly one half-open probe, re-opens on a failed probe, can be
disabled explicitly, and never lets an invalid cooling value defeat protection.

**Layer 2 — `backend/tests/contracts/release-03/admission-ceilings.test.mjs`**
(9/9, connected): the real production HTTP composition
(`configureProductionHttp`) over the Firebase Auth + Firestore emulators behind a
real TLS terminator on the canonical origin, with the real product controllers,
services and the Firestore-transactional rate limiter.

| Law | Evidence |
| --- | --- |
| Per-UID quota → typed 429 with `Retry-After` | `consent-revoke` 10/min: allowed 10, throttled 11, `Retry-After: 30` |
| Shared coordinator (not per-instance counters) | 21 concurrent requests on one uid → 11 throttled together |
| Tenant fairness | Billing 12/min: saturated tenant 201×12 then 429×13; a different uid on the same surface, same minute, is **served (201)** |
| Fail-closed dependency failure, no corrupt state | Provider failure → typed **503** with `Retry-After: 15`, `providerCreates` delta **0** |
| Queue drain after recovery | The scheduled reconciliation job drains the previously-failed work: `processed 3, failed 0` |
| Provider circuit breaker | Opens after 3 failures; a further call is refused with `providerReadsDelta: 0` (refused **without** calling the provider) |
| Breaker recovery | A successful half-open probe closes the breaker and drains (`processed 4`) |
| No false backpressure | A 2xx never carries `Retry-After` |

Evidence: `docs/architecture/delivery/release03/admission-report.json` — the
suite writes `report.laws[]` with the observed values on every run.

The scheduled reconciliation job (`POST /api/billing/jobs/reconcile`, guarded by
`BILLING_RECONCILE_TOKEN`) is the documented queue-drain path; the fixture marks
durable queue rows due to stand in for the passage of time, and all
reconciliation logic (leases, provider calls, fail-closed rescheduling) is
product code.

## What remains a hosted gate (honest boundary)

These are **not** proven here and are recorded as external gates for KAN-126:

1. **Actual provider quotas.** The real speech/model-service and Razorpay quota
   figures must be obtained from the provider consoles. The local suite proves the
   *mechanism* (typed backpressure, shared-counter enforcement, breaker, queue
   drain), never the hosted numbers.
2. **Global cap across instances.** The Firestore-transaction limiter is proven
   correct across independent concurrent requests against one emulator instance;
   a fleet-wide Cloud Run cap under production load is a staging capacity gate
   (RELEASE-01/RELEASE-02 lineage).
3. **SQL-backed surfaces.** Instance/pool ceilings for the SQL-backed projections
   (overview, submissions) belong to the hosted capacity gate; this stack
   deliberately does not fabricate a SQL authority.
4. **Real provider outage.** The provider-failure drill drives the fixture's
   fictional provider (throwing the shipped `PaymentProviderError`); a real
   Razorpay incident is not induced here.
5. **Real test-merchant mode.** `--razorpay-test` was not run: no test credentials
   exist in this environment and live keys are prohibited.

## Reproduce

```bash
npm run backend:build           # emit the compiled product modules
export JAVA_HOME=<temurin-21>   # Firestore emulator needs Java
npm run release:admission       # breaker law (9) + connected admission proof (9)
```

Both runs must report `# fail 0`. The connected layer binds loopback only and
never contacts a real provider.

The full product gate is `npm run check`. Adding a backend source module also
requires the KAN-31 authority inventory to be regenerated
(`node scripts/authority-audit.mjs --write`); for this delivery the only drift was
the `sha256Lf` of the two edited authority files, with all inventory counts
unchanged.
