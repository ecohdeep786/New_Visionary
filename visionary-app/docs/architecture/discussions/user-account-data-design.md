# One user account: identity, onboarding and billing

15 October 2026. Historical initial design review. The founder subsequently authorized physical UID-owned storage. **D-072 implements the nested structure, protected overview/paginated records and additive migration described in [the current storage contract](../../../integration/USER_ACCOUNT_STORAGE.md).** The initial proposal below is retained as discussion history and does not describe the active billing path.

## Recommendation

Use one permanent Firebase Auth UID to identify a person throughout the product. Display the person's name beside that UID. Present identity, onboarding and billing together in an ordered account overview, while retaining their authoritative records and permissions. The current implementation already joins these domains by UID; reorganizing them into a single large document is unnecessary to provide that view.

`Rahul` is a display name, not a database key. Two people can have that name, and either can rename their account. Never merge users by name, email, IP or device. Explicitly verified provider linking is separate work.

## Current physical records, checked against source

| Authority / location | What it owns | Link to the user |
| --- | --- | --- |
| Firebase Authentication user | Sign-in identity, provider links, verification/disabled status and credential management | Firebase UID |
| `visionary_accounts/{uid}` | Email/name, creation/latest sign-in, validated role preferences in `profile`, onboarding status/version/completion and introduction, account accent | Document ID is the same UID |
| `visionary_billing_test_accounts/{uid}` | Free base plan, current subscription/checkout attempt, reconciliation/revision state, recent invoice cache and Family billing information | Document ID and stored `uid` match Auth UID |
| `visionary_billing_test_accounts/{uid}/invoices/{invoiceId}` | Versioned owned invoice, original billed-to snapshot, charge/period/refund data and provider references | Parent UID plus stored `uid` and `billingAccountId` |
| `visionary_billing_test_accounts/{uid}/commands/{commandId}` | Reserved payment commands and recovery outcome | Parent UID |
| `visionary_auth_sessions/{deviceHash}` | Bound/revocable device session and access expiry | Stored UID; backend security access |
| `visionary_auth_events/{eventId}` | Observed sign-in/out audit metadata | Stored UID; backend security access |
| `visionary_billing_test_subscriptions/{subscriptionId}` and `visionary_billing_test_payments/{paymentId}` | Provider-to-owner lookup for reconciliation and webhooks | Stored UID; backend billing access |
| `visionary_billing_test_events/{eventId}` | Authenticated webhook intake/deduplication | UID only when ownership is resolved; an unknown event grants no access |
| `visionary_billing_test_memberships/{uid}` | Family beneficiary-to-owner relation | Beneficiary UID and owner UID remain distinct |

Auth limits and invitation-token records are operational records, not a second user identity. Shared organizations/classrooms/Family relationships need references and their own permissions; they must not become private data copied into each person's account.

The current billing account retains at most 50 recent invoices in its convenience cache; individual invoice documents are separate. That cache is not the complete historical ledger. A future full-history screen needs paginated invoice reads. Current subscription/attempt fields describe current state; a full subscription lifecycle ledger would be additional work, not something this review claims exists.

## The founder's requested format: one readable account view

This is a logical view assembled by the backend, not a new stored duplicate of every record:

```text
Rahul  [permanent UID: uid_example_rahul]
├── Identity
│   ├── Name and email
│   ├── Verification / account status
│   └── Account creation and latest product sign-in
├── Onboarding
│   ├── Pending / complete
│   ├── Validated role and relevant preferences
│   └── Completion / introduction state
├── Billing
│   ├── Mode: test
│   ├── Base plan: Free
│   ├── Effective plan and verified validity period
│   ├── Current subscription / saved checkout / renewal state
│   └── Invoices → individually identified documents, paginated
└── Security history  [separate staff permission]
    └── Sessions and audit events, paginated and redacted
```

All of these resolve to the same UID. The stored display name may be Rahul today and another name tomorrow without changing invoice ownership or account links. Invoice billed-to identity remains the original checkout snapshot when the display name changes.

Do not label a pending or authorized payment as paid. Effective access comes from server-verified captured payment/service periods or accepted Family benefit membership. Free remains the base plan and cannot overwrite paid state. A Family member can see their own benefit status without receiving the owner's private invoices or other members' activity.

## Lifecycle

1. Registration creates the Firebase Auth identity. Unverified registration currently creates no product profile/session. A future staff overview can show this as an Auth-only registration pending verification; do not fabricate an onboarding or payment record.
2. First verified product sign-in transactionally creates/retains `visionary_accounts/{uid}`, the same-UID Free billing account, the bound session and the sign-in event. No Razorpay purchase is needed for Free.
3. Onboarding updates `profile` and `onboarding` in that existing account document. It preserves identity and billing. Repeated completion cannot reset the first completed profile.
4. Checkout reserves the UID-owned command/attempt before contacting Razorpay. A cross-service transaction spanning Firebase Auth, Firestore and Razorpay does not exist; each stage must retain recoverable progress.
5. Verified payment updates the owner's billing state and owned invoice documents. Duplicate/out-of-order callbacks reconcile the saved attempt rather than creating a second subscription.
6. Any device authenticates first, resolves the same UID and reads server-owned state. Device session IDs are not user IDs.

## Proposed overview access contract

A future authenticated `GET /api/account/overview` can return bounded `identity`, `onboarding` and `billing` sections. It is a proposed endpoint and does not exist in this change. The person-facing route derives UID from the verified session, never from a supplied name. A staff search/detail route would require explicit staff authorization, audited access and disambiguation by UID; no staff role or admin endpoint is currently introduced.

Reuse the existing public-profile projection and effective billing calculation rather than deriving entitlement from raw storage or copying the billing account into the profile. Load invoice lists/details separately with pagination. Include section freshness/status; this multi-service view is not an atomic snapshot. If billing cannot be read, show billing unavailable and preserve known authoritative state rather than declaring Free or allowing another purchase.

Credential material, cookie hashes, raw device identifiers, internal leases/commands and unfiltered webhook payloads never belong in a customer overview. Firebase manages passwords/provider credentials. Security metadata needs a separate staff permission; a single overview page does not imply one permission for all sections. Existing Firestore access remains backend-only with IAM and allowlisted API responses.

## Why separate documents remain appropriate

Small bounded profile/onboarding maps can share an account document. Growing invoices, sessions, events and later learning records need separate documents/subcollections and bounded/paginated queries. Firestore documents have a 1 MiB limit, and Google recommends subcollections for growing lists. Field order in a Firestore document is not the user's journey order; the overview determines the presentation order.

Keeping payment/security ownership separate also prevents a profile update from becoming a billing update. Firestore client rules cannot hide selected fields inside an otherwise readable document. The Admin SDK bypasses those rules, so server authorization/IAM and projections remain necessary even with well-organized paths.

## Implementation sequence and acceptance

Keep the current canonical storage paths and UID links. First implement the bounded overview service/projection, then the authorized customer/staff surfaces separately as product scope allows. Add pagination for full invoice history before presenting a complete ledger. No duplicate canonical customer record or collection rename is needed for readability.

If physical collection reparenting is requested later, treat it as a separate versioned migration: inventory/export, dry-run UID/ownership conflicts, transactionally coordinated writer cutover with reconciliation workers, validation of mappings/commands/invoices, rollback and old-reader retirement. Moving an account document alone does not relocate its subcollections. Preserve all retained history; this proposal performs no live reads of personal records, writes, moves or deletions.

Acceptance for the overview implementation: duplicate names remain separate; renaming preserves invoice ownership; unverified registration is distinct from a product account; onboarding and payment retain the same UID; second-device reads agree; a Family beneficiary cannot read the payer's invoices; unauthenticated/cross-user/staff-unauthorized access fails; outages do not fabricate plan changes; invoice pagination has stable order/cursors without duplication; overview responses contain no security credentials.

## Evidence and references

Current code: `backend/upstream/backend/src/auth/firebase-product/firebase-product.service.ts`, `profile.ts`, `backend/upstream/backend/src/billing/billing-account.ts`, `billing.repository.ts`, `billing.service.ts` and `invoice.ts`. Current integration contracts remain authoritative for implemented behavior.

- [Firebase user identity and additional profile storage](https://firebase.google.com/docs/auth/users)
- [Firestore nested maps, subcollections and root collections](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [Firestore document limits](https://firebase.google.com/docs/firestore/quotas)
- [Document-level field access and server IAM boundaries](https://firebase.google.com/docs/firestore/security/rules-fields)
