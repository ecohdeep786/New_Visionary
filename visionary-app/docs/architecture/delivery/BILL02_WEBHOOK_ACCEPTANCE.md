# BILL-02 (KAN-103) — Payment Webhook Acceptance Runbook

**Task:** Register actual test webhooks after an ingress exists, preserve raw signed bytes/limits, and prove duplicate/reordered/late/refund/dispute notifications and reconciliation after restart.
**Status:** webhook acceptance complete on the canonical local ingress with locally-minted provider events; the Razorpay-registered webhook endpoint and provider-sent test events remain the operator's external gate.
**Registered command:** `npm run billing:webhook:acceptance`.
**Depends on:** the BILL-01 ingress acceptance harness (this branch stacks on `zcode/kan-102-bill01-ingress-acceptance`).

## What the acceptance proves

Executed by `backend/tests/contracts/bill-02/bill02-webhook-acceptance.test.mjs`
(8 tests) against the real product runtime — real TLS terminator on the
canonical origin, real controllers/services, the authorized local identity
plane (Firebase Auth + Firestore emulators), and a fictional provider whose
request surface matches Razorpay's exactly:

1. **Real provider shape accepted.** A webhook POST with NO Origin header, NO
   cookies and NO CSRF — exactly what a payment provider sends — is accepted
   (`201 {received: true}`) and durably recorded in
   `visionary_billing_test_events`.
2. **Raw signed bytes and limits.** The signature is HMAC-SHA256 over the
   EXACT raw bytes (`raw({type:'application/json', limit:'256kb'})` preserves
   them). Tampered signature → 403; missing event identity → 400; malformed
   body with a valid signature → 400; body over the raw limit → 413.
3. **Duplicate delivery idempotency.** The same signed bytes delivered twice
   are acknowledged idempotently; the account's payment adjustment is queued
   exactly once.
4. **Event-identity conflict.** The same event id with different bytes is a
   409 conflict and changes no state.
5. **Reordered / late / unmapped honesty.** A refund notification for a
   payment the store has never seen, and a subscription event for an unknown
   subscription, are recorded `unmapped` (uid null) without touching any
   account and without inventing refund state.
6. **Mapped refund → provider-sourced convergence.** A mapped refund event
   queues the payment adjustment; the scheduled reconciliation job
   (`POST /api/billing/jobs/reconcile`, 64-hex job credential) re-reads the
   PROVIDER's own records and converges the durable invoice to
   `partially_refunded` with the provider-confirmed `amountRefunded`. The
   webhook never itself writes a refund state.
7. **Dispute notifications.** A dispute event queues a re-check but never
   fabricates a refund state — only the provider read-back can.
8. **Job credential law.** Reconciliation without or with a wrong job token is
   refused 403.
9. **Reconciliation after a FULL product restart.** An adjustment queued
   before the restart survives it (durable Firestore queue + provider state
   held by the provider, not the app) and reconciles to the exact refund state
   after the app, TLS terminator and control plane all return.
10. **Fail-fast law proof.** `BILL02_SELF_TEST_FAIL=1 npm run
    billing:webhook:acceptance` exits nonzero on exactly one deliberate
    assertion failure (KAN-60 registered-suite law).

The 30-second reconciliation throttle after a verify-time sync is the product's
recorded cadence; the suite waits it out rather than bypassing it.

## How to run

```bash
npm run backend:build          # once
npm run billing:webhook:acceptance
```

Requirements: Java 21+ (Firestore emulator; set `BILL01_JAVA_HOME`/`JAVA_HOME`),
openssl (TLS certificate minting; Git for Windows ships it), the compiled
product runtime. Missing pieces fail fast with a typed `BLOCKED_ENVIRONMENT`
record and guidance. The suite runs the BILL-01 protocol suite unchanged
(regression) via its own registered command:
`npm run billing:ingress:check`.

## External gates (owner/operator)

1. **Razorpay-registered webhook endpoint:** register the hosted
   `https://<canonical-origin>/api/billing/webhooks/razorpay` URL on the
   Razorpay test dashboard with the test webhook secret
   (`RAZORPAY_WEBHOOK_SECRET`), then send the dashboard's test events and
   archive the deliveries against this acceptance. The local suite proves the
   identical surface with locally-minted HMAC-signed events; the hosted slice
   additionally proves the public edge routes the webhook and preserves the
   provider's TLS/SNI.
2. **Provider-sent refund/dispute events:** the dashboard's test
   refund/dispute flows replace the fixture mutation; the reconciliation
   laws asserted here apply unchanged.

## Scope boundaries

- No live project, credential file, payment provider network or production
  record is touched. `BILLING_MODE=test` rejects live keys fail-closed.
- No product source change: the webhook handler, raw-byte preservation,
  limits, idempotency, queue and reconciliation are consumed exactly as
  shipped on `dev`. The only harness changes are additive (reconcile job
  token in the fixture config, external provider-state for restart
  durability, raw-Buffer ingress support, fixture refund/state probes).
