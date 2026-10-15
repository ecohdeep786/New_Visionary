# Subscription payments: Google One, Workspace and Apple

Date: 15 October 2026. Scope: research and proposed Visionary design before provider integration. This document does not introduce live payments or certify checkout, renewals, tax or production entitlements.

## Investigation and evidence

Ran the existing project-local REA CLI from the product root (`npm run rea -- --help`, browser command help/schema and `doctor --format json`). REA is version 6.4.0, imported at `43738bec579fc69bab084bffa964916d43d43ed1`. The broad doctor reports missing optional native engines and agent registrations; it does not establish browser-provider failure. No setup, provider installation or global agent registration was needed for the browser captures.

Reproduce the anonymous public study:

```powershell
node reverse-engineering/research/payment-study.mjs
# Individual references can be selected explicitly after inspecting any failure:
node reverse-engineering/research/payment-study.mjs google-one-family google-one-cancellation
```

The runner uses existing frontend Puppeteer only to locate installed Chrome, then invokes REA `capture-browser-scenario` for each reference. REA launches an empty temporary profile; no owner browser/session, purchase, sign-in, consent button, payment credentials or private API is used. It retains input JSON, full Evidence envelopes, stderr and SHA-256 manifests under ignored `artifacts/research/payments/<UTC run>/`. The script reports incomplete capture/cleanup as failure, including an exit-zero envelope containing failed steps, and stops further launches on incomplete cleanup.

Initial evidence: `artifacts/research/payments/2026-10-15T06-14-14-072Z/manifest.json`. Browser: Chromium 154.0.8037.57; viewport 1280×720; locale en-US; UTC; anonymous session. Geographic prices observed on a public page are incidental, not Visionary prices.

| Initial capture | Result | Evidence SHA-256 |
| --- | --- | --- |
| Google One public plans | Complete DOM/accessibility; monthly/annual controls, plan benefits, sign-in and management links observed | `c1af78da631ae48466e3593a171898b1b8330547f2a4c582d44890ec84b9901a` |
| Google One family help | Partial retained DOM/accessibility; `cleanup_incomplete` after an observation failure | `b3298420d799916b69d47e59b1d4614fa6a3c16052c628a4904eb6e0929319dc` |
| Google One cancellation help | DOM/accessibility retained, but the body-visibility wait failed; overall capture incomplete despite CLI exit 0 | `7cf0be2828cb6d2b6c248440f616744c254616a6d9dae9fa6e03dd91a2045aa0` |
| Workspace payment-plan comparison | Complete DOM/accessibility | `382a5441ec724fb66751c8661b541c5fb9810d9b1d77cb65ab362330d4bab3e6` |
| Apple server-notification documentation | Complete DOM/accessibility with article content | `b060a26bb1714792eba1aed431d01a926049c442265ac8449702056ebe3caba4` |

After the initial run, process inspection found no remaining Chrome process with a REA temporary profile. The runner was refined to evaluate envelope/step/completeness/cleanup fields explicitly. The first run remains unchanged. Independent official-document browsing supports the documented behaviors even where the initial capture was partial.

Follow-up `2026-10-15T06-16-01-043Z` selected family/cancellation with an attached-main wait: both still timed out at the action boundary, returned retained page artifacts, and confirmed process termination. Final follow-up `2026-10-15T06-19-17-283Z` replaced the locator wait with a 250 ms settle: family still reported `cleanup_incomplete` / `unreadable_output`; the corrected runner stopped and did not launch cancellation. Further attempts were stopped. The current runner retains that short settle action. The underlying provider/document incompatibility is unresolved; no upstream REA patch or fabricated pass is introduced.

[Saved evidence index](PAYMENTS_EVIDENCE_2026_10_15.json) records all eight observations across three runs, their actual completeness/cleanup/failure status, paths and hashes. Three observations are complete; five are partial or failed. All eight retained JSON digests match their manifests. Final process inspection again found no Chrome process using a REA temporary profile; this does not independently certify deletion of every temporary profile reported by the provider. Complete Google One public-plan, Workspace and Apple documentation observations plus the independent official documents support this bounded study. There is no completed third-party payment workflow test.

## Documented behavior and design interpretation

| Reference and public evidence | Documented/observed behavior | Adaptation proposed for Visionary |
| --- | --- | --- |
| [Google One plans](https://one.google.com/about/plans) and [plan changes](https://support.google.com/googleone/answer/9003633?hl=en) | Public page presents monthly/annual choices. Help says downgrades retain the current plan until the billing cycle ends. | Review plan, exact amount charged, interval and effective date before checkout; show a scheduled downgrade separately from current access. |
| [Google One family sharing](https://support.google.com/googleone/answer/9004015?hl=en) and [family membership](https://support.google.com/googleone/answer/6317858?hl=en) | One manager can share with five others. Shared benefits do not expose private files. Google documents adult family-manager requirements and explicit invitations. | Six members including payer; explicit accepted billing membership; paying does not grant conversation, report, guardian or classroom permissions. Do not copy Google's country/switching restrictions without a Visionary policy. |
| [Google One cancellation](https://support.google.com/googleone/answer/9056360?hl=en) | Normal cancellation retains benefits until the cycle ends; help distinguishes App Store billing management. There are documented exceptions for some sponsored plans. | Record renewal cancellation independently of paid-through access; show the billing channel and correct management action. Preserve saved learning. |
| [Workspace payment plans](https://knowledge.workspace.google.com/admin/billing/compare-flexible-and-annual-fixed-term-payment-plans) | Flexible billing tracks changing account counts. Annual/fixed-term contracts commit to purchased licenses; monthly or yearly billing does not itself define commitment. Reductions and early cancellation depend on contract terms. | Separate institution contract, billable quantity, assigned seats, payment schedule and access. Keep Institution contact-led until its own active-learner definition and invoicing terms are agreed. |
| [Apple notifications](https://developer.apple.com/documentation/appstoreservernotifications/receiving-app-store-server-notifications) and [server API](https://developer.apple.com/documentation/appstoreserverapi) | Apple documents signed JWS notification/transaction data and server APIs for purchase information and notification history. V2 replaces deprecated V1 notifications. | Verify provider evidence server-side, retain processed-event identity, and reconcile missed updates. Store purchase channel and original provider identifiers. Apple-specific StoreKit integration is a future native-app concern. |

These sources expose product rules and supported interfaces. They do not reveal Google's or Apple's private databases, queues, service topology, ledger, fraud models or internal source code. The NestJS/Firestore design below is our proposal, not a recovered implementation. No authenticated purchase, cancellation, renewal, refund or failure flow was performed against those companies.

## Current Visionary integration findings

| Existing source | Finding / implementation consequence |
| --- | --- |
| `frontend/src/data/pricingConfig.js` | Start ₹0; Personal ₹299/month or ₹2,990/year; Family ₹499/month or ₹4,990/year; Institution contact-led. Annual display equivalents ₹249 and ₹415 are rounded, not amounts to multiply by twelve. Family remains provisional in existing internal metadata. |
| Same pricing source | Start advertises 20 questions/day, while the internal demo meters 10 guided turns/day. These are different units and values; settle the production quota/fair-use contract before enforcement. Education discounts are advertised without a verified eligibility/rate contract. |
| `frontend/src/App.jsx`, `pages/dashboard/Plans.jsx`, `services/workspaceService.ts` | `/dashboard/subscription` loads Plans.jsx. Local plans are Free/Premium/Family, monthly only, with simulated outcomes, invoices and 30-day periods. They are not provider records or proof of purchase. Map names deliberately at the live boundary; do not migrate demo invoices into financial history. |
| `frontend/src/pages/dashboard/Subscription.jsx` | Older preview component exists but is not the routed subscription page. Avoid building the integration against this unused component. |
| `frontend/src/pages/Register.jsx`, `pages/Onboarding.jsx`, `lib/AuthContext.jsx` | Pricing CTAs include `?plan=...`; these consumers do not currently implement a billing-intent handoff. Preserve an allowlisted plan/interval intent across auth/setup, then require explicit review. A query parameter never grants access or authorizes a charge. |
| `services/workspaceService.ts`, `components/dashboard/FamilyBilling.jsx`, `services/organizationBillingService.js` | Existing family and institution records are browser-local previews. Real payer, accepted membership and organization billing authority must come from server records; email or onboarding role is insufficient. |
| `backend/upstream/backend/src/main-auth.ts` | Connected app boots only FirebaseProductModule and parses all bodies as JSON with a 24 KB limit. Provider webhook verification needs a deliberately routed, bounded raw-body handler before this parser, or a supported equivalent. |
| `auth/firebase-product/firebase-product.controller.ts` | Device/session, exact Origin, CSRF and expected-UID checks currently live in controller-private helpers. Extract a shared tested request-authority boundary before adding billing controllers; do not copy the checks or expose legacy JWT routes. |
| Backend source/schema search | No current payment/subscription implementation was found. Installed Stripe frontend packages do not establish a merchant account, provider choice or integrated billing service. |

The detailed proposal and verification scenarios are in [PAYMENTS_DESIGN.md](../../integration/PAYMENTS_DESIGN.md), building on [PAYMENTS_AUTH_HANDOFF.md](../../integration/PAYMENTS_AUTH_HANDOFF.md).

## Adoption and remaining decisions

Adapt Google One's personal/family ownership and renewal clarity, Workspace's separate institution contract model, and Apple's verified server-event/reconciliation pattern. Preserve the existing frontend journeys and role/source/privacy behavior while replacing billing authority at the service boundary.

For an India-first web launch, evaluate Razorpay Subscriptions against the founder's approved merchant account and required recurring payment methods. [Razorpay's validation documentation](https://razorpay.com/docs/webhooks/validate-test/) explicitly covers raw-body signatures, duplicate event IDs and unordered delivery. [Stripe's India documentation](https://docs.stripe.com/india-accept-international-payments) currently describes invite-only availability. This is a provider shortlist, not account eligibility verification or a provider selection. Existing SDK dependencies are not a reason to choose a processor.

Before a provider-specific checkout can be implemented, confirm merchant country/account, intended launch countries and methods, catalog/tax-inclusive totals, Family release status, usage/fair-use policy and the public test-webhook topology. Refund, grace, proration and institution policies must be explicit rather than copied from a competitor. No policy is silently activated by this study.
