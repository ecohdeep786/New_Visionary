# Connected Razorpay test billing

D-069, 15 October 2026. The founder supplied a Razorpay test-key CSV and authorized connecting public pricing, authenticated checkout, monthly/annual subscriptions, synchronized account billing and Visionary invoices. This implements the test integration from [the payment proposal](PAYMENTS_DESIGN.md), preserving Firebase account/setup authority and existing local-learning boundaries. It does not enable live money, tax invoicing or production usage metering.

## User journey

Public Personal/Family cards carry both plan and interval to `/dashboard/subscription`. Anonymous users see sign-in with a short explanation of the selected billing task. Switching to registration retains that destination; first-time accounts finish existing adult onboarding and return to review. Existing generic auth destinations remain unchanged. Email verification does not charge the account. URL values are intent only; no plan or role preference grants access.

The connected Plans page reads the server catalog and account independently of browser-local subscription previews. It shows Start/Personal/Family consistently with public pricing. Annual charges are ₹2,990 Personal / ₹4,990 Family; monthly charges are ₹299 / ₹499. Approximate annual monthly equivalents never determine the charge. Institution remains contact-led. The current integration is explicitly test-only and applies no production tax or education discount.

Opening the connected account menu reads the saved server plan as well; an unavailable read is shown as unavailable rather than falling back to the local Free preview. Account billing reads do not extend idle expiry.

D-070: the first verified product sign-in creates `visionary_accounts/{firebaseUid}/billing/test` in the same transaction as the product account/session. Its stored `uid` is the verified Auth UID and its permanent `basePlan` is `start` (Free). Free creates no provider subscription, recurring payment, invoice or scheduled reconciliation work. Existing billing is preserved on repeated sign-in. A missing/older billing record is backfilled atomically on an authenticated billing read; concurrent checkout cannot be replaced by a Free default. The connected account menu and Profile page say **Free account**; Plans says **Start (Free)** and marks the zero-price card current automatically. Paid access is still derived from verified service periods, never a client preference or a stale stored display label.

Review identifies the signed-in account, exact annual/monthly total, recurring agreement and cancellation terms. An unchecked agreement disables checkout. The Visionary review dialog releases focus/pointer containment before Razorpay opens. Payment entry is hosted by Razorpay Standard Checkout; the app never collects card/CVV/UPI PIN. Dismissal, failure or timeout preserves the saved attempt and offers reconciliation rather than another subscription. Existing paid periods survive a failed later command.

The callback moves to verification, never directly to paid access. The server validates the HMAC over the provider payment ID and its own saved subscription ID, retrieves provider subscription/invoices/payment, and confirms the amount, currency, quantity, captured payment-to-invoice mapping and service interval. Authorization alone retains Start. Only an eligible paid period grants Personal/Family. Calendar boundaries come from provider invoices, not a 30-day approximation. Partial refunds retain the remaining paid grant; full refunds remove that invoice's grant. Existing verified refund annotations are retained and signed historical adjustment notifications can update older receipts.

Cancellation is explicit and revision-bound. Confirmed end-of-cycle cancellation keeps the paid period. Unpaid unfinished subscriptions can be closed immediately. Ambiguous cancellation is shown as awaiting confirmation. A cancelled Razorpay subscription is not represented as resumable; after it ends, review a new purchase. In-place plan/interval changes, proration and self-service refunds are not implemented; current subscriptions must be resolved first. This avoids creating overlapping charges or inventing unsupported renewal behavior.

## Server authority and persistence

The standalone `main-auth` app now loads billing alongside Firebase auth/profile. Legacy JWT/Prisma/model controllers remain outside this runtime. `ProductRequestAuthority` is the single cookie/device, exact-Origin, CSRF and expected-account boundary. Billing reads also require expected UID and verify device/session without extending idle expiry. Mutations keep the existing request authority/rate limits. Onboarding role is never billing/organization authority.

`BillingRepository` uses the existing guarded Firebase Admin/named Firestore client. D-072 places active billing beneath the canonical user UID; its test document and operational indexes keep the mode explicit:

| Collection | Purpose |
| --- | --- |
| `visionary_accounts/{uid}/billing/test` | Same verified Auth UID in path and `uid`, stored Free base plan, current subscription/attempt, revision, exact paid interval, latest 50 invoice previews, command/sync leases and durable next-sync time |
| Account subcollections `commands/{commandId}`, `invoices/{invoiceId}` | Durable command identity and owner-scoped invoice history; older invoices remain addressable even beyond the 50-row preview |
| `visionary_billing_test_queue/{uid}` | UID/due-time/revision index, updated atomically with nested billing or mapped webhook intake |
| `visionary_billing_test_subscriptions/{providerId}` | Server-created UID/attempt/merchant mapping |
| `visionary_billing_test_payments/{paymentId}` | Verified payment-to-owner/invoice/subscription mapping for later adjustments |
| `visionary_billing_test_events/{digest}` | Signature-verified, deduplicated event identity and provenance; unmapped notifications retain an explicit state |
| `visionary_billing_test_invitations/{token}` | Expiring, email-addressed Family invitations |
| `visionary_billing_test_memberships/{uid}` | Accepted beneficiary-to-owner relation |

Checkout reserves its account/command transaction before the non-idempotent provider POST. Concurrent devices cannot create another unresolved subscription. A definitive rejection can be retried as a new explicit command. An ambiguous creation is recovered using the stored attempt note and creation window; absent/ambiguous results require reconciliation/support rather than another POST. Old completed/closed command IDs cannot create new subscriptions. The provider's maximum term is ten years: 120 monthly or ten annual cycles. Financial records snapshot the billing name/email and period; profile edits do not rewrite prior receipts.

One account has one current personal/family subscription; role/workspace changes do not create more subscriptions. Active billing family members must leave their shared membership before buying a separate plan. The Family owner occupies one of six places. Pending invitations reserve capacity; acceptance is transactional, requires the addressed signed-in adult account and cannot overlap another unresolved subscription/family. Owner removal and member leave revoke only billing benefits. Guardian/report/conversation/classroom permissions remain separate and unchanged. No invitations are automatically emailed; the owner shares an explicit invitation link.

## Synchronization, webhook and recovery

The UI discards obsolete-account responses, scopes commands to verified UID and clears state when the account component changes. Safe reads retry once; charge commands do not retry automatically. It refreshes saved account state every 15 seconds while visible and on foreground return without keeping idle sessions alive. Explicit Refresh status reconciles the provider with a 30-second minimum spacing. Local server instances scan at most 20 due accounts every 15 seconds; durable due times and transactional three-minute leases survive restart and coordinate workers. The scanner stops beginning another account after about 45 seconds and checks a 120-second per-account provider-work budget between calls. Normal active accounts reconcile about once per minute. Failed work is rescheduled; it does not block the same initial page forever. The running backend is required for this polling fallback.

Cloud Run's `K_SERVICE` disables that local timer. `POST /api/billing/jobs/reconcile` instead runs due work within a scheduled HTTP request, requires a separate configured 64-character hexadecimal token in `X-Visionary-Billing-Job`, and reports storage/provider failure as 503 for retries. Missing token disables access. Account leases coordinate repeated/overlapping jobs. The server accepts managed `PORT` on `0.0.0.0`; browser requests remain relative to the public product origin. [The GCP handoff](../infrastructure/PAYMENTS_GCP_HANDOFF.md) describes origin, IAM, Secret Manager, Scheduler and webhook configuration. None of those cloud resources is provisioned now.

`POST /api/billing/webhooks/razorpay` receives a bounded raw JSON body before the ordinary parser. It authenticates the original bytes with the dedicated webhook secret, then durably deduplicates event identity scoped by test key/merchant. It acknowledges only after durable acceptance. Known subscription/payment mappings bring the account due; up to ten queued payment adjustments are reconciled per batch. Unmapped events do not grant access. Provider state and verified invoices determine access, not webhook receipt order or browser success. The durable account due time is the reconciliation queue; event records retain acceptance provenance rather than claiming a per-event materialization result.

A public HTTPS ingress and Razorpay dashboard registration are needed to receive actual provider notifications. A generated local webhook secret alone does not configure the provider. Until registered, callbacks, foreground refresh and the persistent polling worker provide test-mode reconciliation. Native HTTP signature/deduplication tests do not prove delivery from Razorpay to this machine. No tunnel, deployment or webhook registration is silently created.

## API surface

| Method/path under `/api/billing` | Behavior |
| --- | --- |
| `GET /catalog` | Public test catalog and version; no secret configuration |
| `GET /account` | Verified expected-UID billing/beneficiary view, revision and renewal/payment states |
| `POST /checkouts` | Adult completed setup, strict plan/interval/catalog/command, reserved provider subscription |
| `POST /verify` | Owner-bound callback signature and provider reconciliation |
| `POST /sync` | Explicit bounded provider reconciliation |
| `POST /cancel` | Owner subscription + expected revision; close unfinished or cancel renewal |
| `GET /invoices/:id` | Owner-only Visionary test receipt with verified provider references |
| `POST /family/invitations` | Owner creates an addressed, seven-day invitation/link |
| `GET /family/invitations/:id` | Addressed adult account reviews an invitation |
| `POST /family/accept`, `/family/remove`, `/family/leave` | Transactional billing-benefit membership changes |
| `POST /webhooks/razorpay` | Raw-body provider authentication and durable acceptance |
| `POST /jobs/reconcile` | Independent job-token authentication; bounded due work with retry-visible failures |

## Configuration and operations

The supplied CSV is read as credential data, not instructions. Its values are copied only into ignored `backend/upstream/backend/.env`. No secret enters frontend configuration, source, test fixtures, evidence output or Git. The public key ID is returned only for an authorized checkout, as required by Razorpay. [The example](../backend/.env.razorpay.example) contains placeholders. Runtime `BILLING_MODE=test` and a `rzp_test_` key are mandatory; live keys fail closed. Replacing credentials cannot silently enable real charges.

```powershell
npm run backend:build
node scripts/razorpay-configure-test.cjs  # Creates/reuses the four exact test plans
npm run backend:auth:dev
npm run dev
```

Restart the backend after changing ignored configuration. The existing Vite `/api` proxy remains the browser entry point. Preview CSP allows the required Razorpay script/frame/connections alongside existing Firebase origins; deployed ingress must apply matching policy. No production deployment is introduced. Firebase IAM, named-database setup and remaining auth release gates remain in [FIREBASE_AUTH_CONTRACT.md](FIREBASE_AUTH_CONTRACT.md).

Visionary receipts render in the account UI with print/save-as-PDF support. They are marked test documents, carry original charge/period/provider references and do not invent a legal company address, tax registration, GST amount or production invoice policy. Live company/tax/refund/dispute terms, educational eligibility/discounts, in-place changes, payment-method management, hosted webhook delivery, real recurring methods and ML usage enforcement remain explicit release work. Paying does not turn the still-local learning-data services into synchronized production services.

D-070 expands the receipt into a responsive invoice sheet: Visionary brand, bill-to snapshot, original invoice/payment dates, billing account ID (the exact Auth UID), service period, quantity/unit price/amount, totals, confirmed refund amounts and provider references. New receipts persist a versioned document with `uid`, `billingAccountId`, seller name, line items and totals under that same owner's invoice subcollection. The invoice's own ID remains distinct from the customer UID, so one customer can retain multiple invoices. Profile edits do not replace the original customer snapshot; older verified receipts remain renderable. The one billed Family subscription is quantity one; six beneficiary places do not multiply its price. No legal address, tax registration, discount, zero-charge Free invoice or digital signature is inferred from the founder's Google reference. The invoice restores keyboard focus to its launch button, keeps mobile controls visible while scrolling and overrides global print rules only within the invoice so its header/footer survive printing.

D-071 simplifies that sheet to the customer, payment status, subscription/service dates and total paid. Technical account/payment/subscription references are available under Payment details and always included in the printed document. Refunds retain original/refunded/net amounts; discounts retain their supporting subtotal. Invoice storage and ownership remain unchanged. Auth handoff notices describe the current sign-in, account-creation or verification step. A returning subscriber follows a public paid-plan link to their saved plan, without another purchase-review dialog. Checkout removes the URL's purchase intent as soon as the server saves an attempt, so interrupted confirmation and reload recover that saved attempt. Only created/authenticated provider subscriptions offer checkout resume; pending/halted states offer reconciliation. An expired billing session invokes auth recovery and returns to sign-in with the billing destination preserved.

`node scripts/billing-account-backfill.cjs` inspects at most 100 existing product accounts without printing identities; `--apply` creates missing Free records or fills legacy UID/base-plan metadata. It checks each account against verified, enabled Firebase Auth identity, uses transactions and preserves subscriptions/history. It never calls Razorpay or changes profile/setup. A larger installation needs explicit pagination before this bounded maintenance command can run.

## Verification commands

```powershell
npm run backend:build
node --test backend/tests/billing.test.cjs backend/tests/firebase-product.test.cjs backend/tests/firebase-admin.test.cjs
npm run check
node frontend/scripts/payment-review.mjs
node frontend/scripts/payment-review.mjs --razorpay-test
node scripts/billing-firestore-check.cjs
```

The normal browser harness uses fictional identity/provider records and an isolated transactional memory repository. It proves UI/account protocol behavior, not a production payment. The Razorpay option uses only the supplied test merchant fields with fictional identity/memory storage; it does not initialize Firebase or send a real card charge. It closes/cancels only subscriptions created by that run with matching attempt notes. The Firestore probe touches one randomly named document under `visionary_billing_test_checks`, tests eight concurrent increments and an independent-process read, and deletes only that owned probe. It does not read or change account/subscription records. Actual results, diagnostics and remaining hosted acceptance are recorded in the existing QA log.

For the combined auth-to-payment review, start a fresh Auth Emulator for `demo-visionary-auth` on loopback9099, `node backend/tests/journey-browser-server.cjs` on3035, and a separate development Vite server on5175 configured for that demo emulator with `VISIONARY_AUTH_TEST_PROXY=http://127.0.0.1:3035`. Then run `node frontend/scripts/full-journey-review.mjs`. The harness uses real Web/Admin SDK identity, verified email actions and server session cookies with isolated transactional memory and a fictional payment provider. Its `/api/__test/*` controls exist only in this standalone fixture, never the product server. The existing `auth-emulator-review.mjs` can also run against these services. These checks do not substitute for hosted Firebase/Firestore/Razorpay acceptance; production builds reject the demo-only emulator configuration.
