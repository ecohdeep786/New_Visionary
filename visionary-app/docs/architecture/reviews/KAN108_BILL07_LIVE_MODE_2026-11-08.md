# KAN-108 / BILL-07 — live-mode separation review handoff

8 November 2026. Implementer: Senior Principal Backend & ML Engineer (ZCode lane).
Branch `zcode/kan-108-bill07-live-mode` off `dev` (`2e0b1fbb`). Reviewer: **pending per
D-095**. Not merged into `dev`; worktree left for the reviewer.

## Acceptance scope

Backend + minimal frontend truthfulness change implementing the P09 exit line
*"production-money capability is explicitly separated from current test mode"*
([BACKEND_LAUNCH_CHECKLIST.md](../BACKEND_LAUNCH_CHECKLIST.md)) and the BILL-07
requirement *"Implement explicit separately configured live mode/records/secrets/plan
provisioning and acceptance. Retain UID but never convert test transactions into live
history; startup/scaling cannot provision plans or charges."*

Full statement: [BILL07_LIVE_MODE_SEPARATION.md](../delivery/BILL07_LIVE_MODE_SEPARATION.md).
Evidence: [delivery/bill07/evidence.json](../delivery/bill07/evidence.json) and the
captured TAP at [delivery/bill07/billing-live-mode.tap](../delivery/bill07/billing-live-mode.tap).

## What changed

`backend/upstream/backend/src/billing/billing-mode.ts` is the new single source of
truth: `resolveMode` (fail-closed to `test`), `isLiveOperable` (double opt-in),
`modePaths` (per-mode collections, doc id, invoice prefix, catalog version) and
`assertChargeable`. `BillingRepository` resolves the mode once and binds every record
path; `BillingService` reads it from the repository instead of re-deriving it. Twelve
inline `visionary_billing_test_*` collection opens were replaced by repository methods.
`RazorpayProvider.settings()` is mode-typed for keys and `planId()` appends `_LIVE` in
live mode. `invoice.ts` records the producing mode and keeps `legalTaxInvoice: false`
with `totals.tax: null`. The dashboard badge/notice and the invoice dialog now read the
server-reported mode instead of hardcoding "Test mode".

## Findings corrected

- **`planId()` was not mode-typed.** A first implementation left it reading the same
  variable in both modes, so a live deployment would have charged a test plan. It now
  reads `RAZORPAY_PLAN_*_LIVE` in live mode; a missing live plan is a typed 503. Test
  keeps the historical variable, so test behavior is unchanged.
- **Three test-only defects** (recorded, no product change): a fixture live plan id
  that violated the product's own `plan_` contract (product correct, fixture wrong);
  `ConfigService.set()` writing through to `process.env` and an empty value falling
  back to it, leaking a blank into later fixtures (teardown now deletes the variable);
  and `firebase-product.test.cjs` stubbing only the pre-split literal surface, now
  bound to a real `BillingRepository` so it exercises the product path.

## Verification at this branch head

`npm run billing:live:mode` 11/11 · legacy billing/account-storage/firebase-product
regressions 62/62 · `scripts/production-check.mjs` locked compile 113/113 + provisioning
11/11 + 37/37 + privacy 52/52, exit 0 · `npm run check` exit 0 (3842-file import
baseline, continuity/motion/taps laws, surface audit, build) · lint 0 · typecheck 0 ·
`npm test` 672/672 · authority inventory regenerated (hash-only, counts unchanged) ·
surface audit regenerated (line-coordinates only, counts unchanged).

No live key is used or accepted by any test, and no provider is contacted: the suite
runs a fictional in-memory provider over the real service and repository, with **both
modes over one shared store** so a namespace leak would be visible.

## Explicitly not accepted here

- **Real live-merchant money acceptance** — actual `rzp_live_*` keys, an approved live
  merchant, seller/tax invoice data and provider live-plan provisioning. No live
  credentials exist on this host and live keys are prohibited in the harness.
- **Hosted ingress and registered webhooks** (BILL-01/02) — unchanged P09 hosted gates.
- **Reviewed tax/commercial policy** (BILL-06) — this change invents no legal field.

Enabling live billing remains a separate, fully gated act; this change makes it
configurable, isolated and fail-closed, and proves the isolation locally. Capacity for
real money is a hosted acceptance, not something this branch can demonstrate.
