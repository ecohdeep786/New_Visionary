# KAN-104 / BILL-03 — reviewer-corrector pass (2026-11-12)

Reviewer-prep for `codex/deepseek-kan-104-billing-jobs` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections + regenerated artifacts, stack integration (merge of dev `c260894e` into the impl commit `5ec9cc2f`, old base `f61292ef`; data-04 settled automatically to dev's evolved version).

## Corrections

1. **Stale compiled dist, not a code defect.** The five BILL-03 retry-ladder tests (23–27) failed on the branch with `row.attempts` `undefined !== 1` because `dist/src/billing/billing.service.js` had been compiled BEFORE the dev merge landed the ladder source (dist mtime 22:17:50 vs source 22:22:38; zero `attempts` references in the stale dist). Instrumented fixture traces proved the source logic writes the ladder correctly. `nest build` resolved every failure with NO product change.
2. **Unmapped registered operation: `POST /api/billing/jobs/backlog`.** The dev merge registered the backlog job endpoint in the billing controller, but the authority registry's `assignments.billingJob` and the KAN-35 route inventory (`request-limits.v1.json` `currentRoutes`) carried only `/jobs/reconcile` — `authority-audit --write` refused with "Unmapped registered operation". Fixed honestly in one visible change: the backlog route mapped into the `billingJob` private-job profile, inventory 55→56 routes, the pinned snapshots in `authority-audit.test.mjs` and `contracts.test.mjs` updated to 56, and the coupled artifacts regenerated (`operation-authority.v1.json`, `request-limits.v1.json`, contracts `manifest.json`, `product-surface.json`, `PRODUCT_SURFACE_AUDIT.md`) + contracts rebuilt.

## Review finding (verified, no defect)

The BILL-03 dispatch law reviewed clean and enforces the ticket exactly:

- **Exact retry ladder**: 60s/120s/300s/900s/1800s; jitter 0.9–1.1× sits inside the tested 0.85–1.25 window; `backoffFor` clamps attempts onto the ladder.
- **Quarantine ceiling**: at attempts ≥ 5 the account quarantines with 2× ceiling backoff; dispatch skips quarantined accounts (`quarantinedSkipped`) and the redacted backlog surfaces them (counts only, no UIDs, bounded sampling).
- **No double-laddering**: the catch path marks the error `dispatchHandled` and the dispatcher ladders pre-claim failures exactly once — no hot loop, no double count.
- **Atomic-write law holds**: the catch path reads `attempts` and writes the ladder inside ONE transaction (read-before-write enforced by the store); the claim moves the queue document inside the lease transaction so concurrent passes cannot re-pick; the webhook/interactive-sync reset REPLACES the row (`attempts: 0, quarantinedAt: null`); the claim-path merge preserves the existing ladder state.
- **Ordered dispatcher**: cursor-paged (20/page, `orderBy nextSyncAt` + `startAfter`, 45s budget) — the 25-account two-page test proves resumability past one page.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Backend compile | `npm run build` (upstream backend, `nest build`) | **exit 0** |
| Billing battery incl. all BILL-03 tests | inside `npm run data:check` | **53/53 pass** |
| Data contracts (real-SQL DATA-02 suites + workspace/data/invitations tsconfigs) | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` (after the coupled artifact chain + contracts rebuild) | **exit 0 — 114/114 + contracts 35/35 + sub-batteries, frontend build ok** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-12)

Pricing renders the full catalog the dispatch serves (Start ₹0 / Personal ₹249 yearly ₹2990 / Family ₹415 yearly ₹4990, feature matrix, checkout deep-links); `/dashboard/subscription?plan=personal&billing=annual` renders the sign-in guard in-place with the Create-account link preserving the full `returnTo` deep link and truthful payment copy ("Payment starts only after you review the amount and confirm secure checkout"). Credential + Razorpay checkout steps founder-gated as always; the retry/quarantine behavior itself is private-job identity-guarded and covered by the 53/53 battery.

## Notes for the reviewer

- The registry +1 (56 registered operations) is the ONLY honest surface change — the controller already registered the route; without the mapping the authority audit refuses to run at all.
- Production dispatch behavior (real provider outages, hosted queue scale) stays founder-gated per BILL-01 local-maximum.
