# BILL-07 (KAN-108) — explicit live-mode separation

**Task:** BILL-07 (Jira KAN-108), P09 exit line of
[BACKEND_LAUNCH_CHECKLIST.md](../BACKEND_LAUNCH_CHECKLIST.md):
*"production-money capability is explicitly separated from current test mode."*

**Owner:** Senior Principal Backend & ML Engineer. **Branch:**
`zcode/kan-108-bill07-live-mode` off `dev` (`2e0b1fbb`). **Status:** implemented,
locally proven, reviewer pending per D-095. Not merged into `dev`.

## The law this implements

The checklist states the requirement verbatim:

> **BILL-07** — Implement explicit separately configured live mode/records/secrets/plan
> provisioning and acceptance. Retain UID but never convert test transactions into live
> history; startup/scaling cannot provision plans or charges.

Before this change the entire billing subsystem was a compile-time literal. The mode
was `mode: 'test'` written into stored documents, the collections were
`visionary_billing_test_*`, the per-account document was always
`visionary_accounts/{uid}/billing/test`, every invoice number began `VTEST-`, and the
catalog version was `2026-10-15-test-v1`. The single mode gate
(`razorpay.provider.ts:settings()`) rejected anything other than `BILLING_MODE=test`
and an `rzp_test_*` key. There was no abstraction by which live could be configured,
and therefore no way to tell a test transaction from a live one.

## Design

`backend/upstream/backend/src/billing/billing-mode.ts` is the new single source of
truth. Four laws are enforced there and nowhere else:

1. **Fail closed.** `resolveMode()` returns `live` only for the exact string `live`.
   Every absent, empty, mixed-case or unknown value resolves to `test`, which is
   byte-identically the previous behavior. Live is opt-in; nothing turns it on by
   accident.
2. **Separate records.** `modePaths(mode)` returns the complete set of collection
   names, the per-account document id, the invoice prefix and the catalog version for
   a mode. The two namespaces never alias (`visionary_billing_test_*` vs
   `visionary_billing_live_*`; doc id `test` vs `live`; prefix `VTEST` vs `V`), so the
   same retained UID holds two disjoint histories.
3. **Double opt-in for real money.** `isLiveOperable()` requires `BILLING_MODE=live`
   **and** `BILLING_LIVE_ENABLED=true`. Live without the second opt-in is refused with
   a typed 503 and performs no provider call, so a lone configuration change cannot
   begin collecting real money.
4. **Separate plans and secrets.** `RazorpayProvider.settings()` requires `rzp_test_*`
   in test and `rzp_live_*` in live, rejecting both mismatch directions.
   `planId()` appends `_LIVE` in live mode, so a live charge names a live-provisioned
   plan and can never reuse a test plan the same deployment happens to carry.

The mode is resolved once in `BillingRepository` and read from there by
`BillingService` (`this.repo.mode` / `this.repo.paths`) rather than re-derived, so the
mode a response reports is exactly the namespace its data was read from. Twelve inline
`collection('visionary_billing_test_*')` opens in `billing.service.ts` were replaced by
repository methods (`membership()`, `invitation()`, `payment()`, `receipt()`), leaving
no raw literal collection open anywhere in the service.

`invoice.ts` records the producing mode and keeps `legalTaxInvoice: false` with
`totals.tax: null` — no legal or tax field is invented (that remains BILL-06's gate on
reviewed merchant/tax policy).

### Startup law

`onModuleInit` only starts a read-only reconciliation timer (disabled when Cloud Run's
`K_SERVICE` is present, where authenticated scheduled HTTP work is used instead) and
never POSTs. The suite asserts this as an invariant, not a comment: bootstrap,
`catalog()` and an account read each perform **zero** provider calls and create
nothing, and a missing live plan id is a typed 503 rather than an invented or
alphabetically-guessed plan.

### Frontend truthfulness

The dashboard badge/notice and the invoice dialog previously hardcoded "Test mode · No
real charges" and "Razorpay · Test mode". Both now read the mode the server reports
(`ConnectedBilling.jsx`, `BillingInvoice.jsx`, `data-billing-mode`), so live mode does
not falsely claim to be a test document and test mode renders exactly as before.

## Proof

`backend/tests/billing-live-mode.test.cjs` (11 tests, registered as
`npm run billing:live:mode` and added to the locked-compile list in
`scripts/production-check.mjs`). Emulator-free and provider-free: a fictional
in-memory provider over the real `BillingService`/`BillingRepository` and the shared
in-memory Firestore double. **Both modes run against one shared store**, which is what
makes the isolation laws meaningful — a namespace leak would be visible.

| # | Law proven |
| --- | --- |
| 1 | Absent/empty/`TEST`/`Live`/`production` all resolve to `test`; only `live` is live |
| 2 | The test namespace is exactly the historical collections, doc id and `VTEST` prefix |
| 3 | The live namespace is disjoint — no live path references a test collection |
| 4 | Test spending writes only test records; nothing live is created |
| 5 | A live account keeps the same UID but inherits no test subscription or invoice |
| 6 | Live without the second opt-in: typed 503, zero provider calls, nothing created |
| 7 | Both key directions refused (`rzp_test_` in live, `rzp_live_` in test); correct pairs accepted |
| 8 | Bootstrap/catalog/account read make zero provider calls; a missing live plan is typed |
| 9 | Mode reported truthfully in catalog, account, checkout and the invoice document (`V-` prefix, `legalTaxInvoice: false`, `totals.tax: null`) |
| 10 | Plan provisioning is mode-typed: a live charge names the `_LIVE` plan, never the test plan; test keeps its historical variable |
| 11 | A test webhook writes only the test event intake, never a live event |

### A real defect the split surfaced

While writing test 4 the product's own plan-id contract
(`/^plan_[A-Za-z0-9]+$/`) rejected an initial fixture value containing underscores.
That is the product being correct and the fixture being wrong; the fixture was
corrected to a contract-valid id. Separately, `ConfigService.set()` writes through to
`process.env` and an empty internal value falls back to it, so a test that blanked a
plan id leaked the blank into later fixtures — the suite now deletes the variable on
teardown and asserts no environment residue.

## Verification (all fresh at this branch head)

| Gate | Result |
| --- | --- |
| `npm run billing:live:mode` | 11/11 pass |
| Legacy billing regressions (`account-storage`, `billing`, `firebase-product`) | 62/62 pass |
| `node scripts/production-check.mjs` (locked compile + SQL/Firestore provisioning + privacy) | 113/113, 11/11, 37/37, 52/52 — exit 0 |
| `npm run check` (roots, 3842-file import baseline, continuity/motion/taps laws, surface audit, build) | exit 0 |
| `npm run lint` / `npm run typecheck` | exit 0 / exit 0 |
| `npm test` | 672/672 pass |
| `node scripts/authority-audit.mjs --write` | hash-only drift, counts unchanged (55/6/12/16/32) |
| `node scripts/surface-audit.mjs --write` | line-coordinate drift only, counts unchanged (67 routes / 55 endpoints / 1656 controls) |

`firebase-product.test.cjs` constructs `BillingService` for its invitation assertions.
Its stub repository implemented only the pre-split literal surface, so the mode-scoped
reads routed through the real `BillingRepository` over the fixture database instead —
a test-only change that exercises the product path rather than a hand-written stub.

## Recorded external gates (NOT claimed)

The isolation laws are proven against the fictional provider. The real money path is
not exercised here:

- **Real live-merchant acceptance** — actual `rzp_live_*` keys, an approved live
  merchant account, seller/tax invoice data and provider live-plan provisioning. No
  live credentials exist on this host and live keys are prohibited in the harness.
- **Hosted ingress / webhook registration** — unchanged from the existing P09 hosted
  gates (BILL-01/02): a canonical HTTPS origin, registered test webhooks and a second
  device.
- **Tax/commercial policy** — BILL-06's reviewed seller/tax/refund policy. This change
  deliberately invents no legal field.

Enabling live billing is therefore a separate, explicitly gated act requiring all of
the above; this change only makes that act configurable, isolated and fail-closed.
