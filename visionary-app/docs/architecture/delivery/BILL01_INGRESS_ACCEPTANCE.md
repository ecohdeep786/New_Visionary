# BILL-01 — canonical HTTPS-ingress acceptance for the existing test runtime

KAN-102 / BILL-01 · 7 November 2026 · D-109 · local-maximum acceptance prepared by the backend/ML implementation lane; independent exact-SHA review per D-095 required before any status change.

BILL-01 requires: *deploy and accept the existing test runtime on canonical HTTPS ingress; verify real auth return, cookies and real test-merchant checkout with durable storage and a second device.* This document states precisely what is now proven locally, what remains an external gate, and the exact procedure for each remaining slice. No hosted deployment, webhook registration or provider credential is created or assumed by this work.

## What is proven locally (registered command: `npm run billing:ingress:check`)

The acceptance harness (`backend/tests/contracts/bill-01/`) composes the **real production HTTP composition** (`configureProductionHttp` — the exact ingress-facing code the hosted deployment uses: CSP, HSTS, `X-Frame-Options`, trusted-proxy hops, static SPA boundaries, `/api/health` and `/__deploy-check`) over the **real product controllers and services** (`FirebaseProductController`, `AccountController`, `BillingController`, `FirebaseProductService`, `BillingService`), behind a **real TLS terminator** bound to loopback:443 with the **canonical origin** `https://visionary.org.in` (pinned to loopback by the drivers; no system DNS or hosts-file change). The identity plane is the authorized local one: Firebase Auth Emulator (`demo-visionary-auth`, real token/session-cookie semantics) and the Firestore emulator (real Firestore semantics with export/import durability).

Proven, in order (protocol suite, `node --test`):

1. The production runtime **refuses emulator configuration in production mode** — the product's own guard throws for `NODE_ENV=production` + emulator, so this harness can never become the deployed runtime.
2. **Canonical-origin and CSRF enforcement before any session is created**: non-canonical Origin, HTTP-downgraded canonical origin, and missing CSRF pair are each rejected (403) before session creation.
3. **Secure cookie establishment over real TLS**: the session exchange sets exactly `__Host-visionary-session`, `__Host-visionary-device` (+ `__Host-visionary-csrf` from the CSRF endpoint), each HttpOnly, Secure, SameSite=Strict, Path=/, host-only — parsed from the wire, not assumed.
4. **Verified-identity admission**: an unverified email identity is refused (401) through the ingress.
5. **Auth return**: session exchange → profile → adult onboarding → `/me` reports completed setup; the durable Free billing record is backfilled.
6. **Test-merchant checkout journey (fixture provider)**: catalog → command-bound checkout → payment completion → HMAC-verified callback → provider reconciliation → Personal entitlement with provider-invoice boundaries → owner-scoped test invoice → revision-bound end-of-cycle cancellation retaining the paid period.
7. **Durable records via an independent read path**: billing, invoice and session documents read back from the Firestore emulator's REST API directly (not through the product's repository).
8. **Full-stack restart durability**: emulator export → stop → import → restart; the pre-restart session cookie is (correctly) reported revoked by the restarted identity provider and the product **fails closed**; a fresh verified sign-in recovers the same account with paid entitlement, revision, cancellation request and invoices intact.
9. **Two devices**: a second device of the same account (independent jar + edge IP) shares the durable paid state with its own distinct durable session record; device-scoped logout revokes only that device; logout-all revokes every device of the account only; a different account is unaffected; a fresh sign-in after the cutoff second recovers access.
10. **Ingress surface**: HSTS, CSP (`frame-ancestors 'none'`), `X-Frame-Options: DENY`, `X-Visionary-Revision`, no-store/no-cache boundaries, JSON 404s for unknown API paths, forged cookies rejected, health and deploy-check probes.

Browser journey (`bill01-browser-journey.mjs`, Microsoft Edge via playwright-core, 7/7): a real browser engine stores and applies the `__Host-` cookies (Secure/HttpOnly/Strict verified in the browser's cookie store), page script cannot see the HttpOnly session cookie, a **cross-site page provably sends none of the session cookies** (outgoing-request interception: same-origin request carries them, cross-site request carries none), two browser contexts behave as two devices sharing the durable paid account, and device-scoped logout is enforced inside the real browser.

Recorded environment facts: Node 22.23.3; firebase-tools 15.33.0 (npx-pinned); Temurin JRE 21.0.13+9 (contained under `nv-tools`, needed only for the Firestore emulator; the Auth Emulator is Node-only); openssl from Git for the local TLS certificate; Edge 156 channel for the browser journey. The harness's emulator configuration is generated fresh per run (demo project, loopback ports, fixture-only rules) — never the repository `firebase.json`/live `.firebaserc`.

## Recorded deviations (emulator-scoped, not product defects)

- **Database id**: the harness runs the product against the emulator's `(default)` database because the emulator's export/import covers only `(default)`; production uses the named `default` database (`getFirestore(app, databaseId)` is the same code path with the configured ID). Named-database routing is part of hosted acceptance.
- **Session continuity across restart**: the Auth Emulator re-stamps the user's token-revocation epoch on restart, so pre-restart session cookies are reported revoked. The product's fail-closed behavior is asserted as the correct outcome; uninterrupted session continuity across a hosted restart is a hosted gate (hosted Firebase does not have this emulator artifact).
- **Fictional payment provider**: the fixture provider implements Razorpay's request surface in-memory. The API/journey/HMAC/reconciliation mechanics are proven; the real test-merchant slice is the external gate below.

## External gate 1 — real test-merchant checkout (founder-supplied test credentials)

The Razorpay test-key CSV is credential data; this box holds no copy. When the founder supplies the test keys on this machine (ignored `backend/upstream/backend/.env` or environment), the acceptance completes with the real test merchant:

1. `node scripts/razorpay-configure-test.cjs` — creates/reuses the four exact test plans (writes only `RAZORPAY_PLAN_*` IDs).
2. Set `BILLING_MODE=test`, `RAZORPAY_KEY_ID` (`rzp_test_…`), `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` and the four `RAZORPAY_PLAN_*` values in the ignored backend config; the runtime rejects live keys by law.
3. Rerun `npm run billing:ingress:check` — the stack module accepts `BILL01_RAZORPAY_KEY_ID`/`BILL01_RAZORPAY_KEY_SECRET` (+ plan IDs) to run the same journey against `api.razorpay.com` **test mode** (no live money; runtime rejects live keys).
4. The hosted-checkout-page payment completion (Razorpay Standard Checkout inside a real browser against the real test merchant) is then exercised per [the payment contract](../../integration/PAYMENTS_CONTRACT.md) verification commands.

## External gate 2 — hosted canonical ingress deployment (owner-run)

The test runtime's hosted deployment follows the owner-run sequence in [the GCP handoff](../../../infrastructure/gcp/README.md) with the reviewed platform configuration from KAN-45 (in Testing): apply the product IaC, deploy the compiled product image (`dist/src/main-product.js` composition with `NODE_ENV=production`), point the canonical origin's edge at it, and verify with the same acceptance surface this harness pins: `/api/health`, `/__deploy-check` (the edge must overwrite caller-supplied `X-Forwarded-For`), HSTS/CSP headers, and the secure-cookie journey on the real origin. Per the standing governance, deployment is an owner action and is not performed or simulated by this lane.

## Status

`BILL-01` local-maximum implementation complete and registered (`npm run billing:ingress:check`, fail-fast proven via `BILL01_SELF_TEST_FAIL=1` exit 1). The task **does not move to Testing as satisfied**: gates 1 and 2 above remain external. The reviewing engineer inherits the branch, this runbook and the recorded gates; the task can move to Testing for the local-acceptance scope only if the founder explicitly accepts the hosted slices remaining open, otherwise it stays with the implementation lane until the gates can run.
