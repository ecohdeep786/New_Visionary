# UID-owned user data

D-072, 15 October 2026. The founder authorizes actual per-user storage, following the earlier account-design discussion. This supersedes its proposal to provide only a combined view over old billing paths.

Each Firebase Auth UID is the permanent product account ID across devices. Display names/emails are attributes, never identity keys or automatic merge rules. A browser session has its own random device-session identifier; another device retains the same user UID.

## Database structure

In the configured Firestore database (`default` for this workspace):

```text
visionary_accounts/{firebaseUid}                 user document
  uid, storageVersion: 2
  identity                                    verified identity metadata
  email, full_name, createdAt, lastSignInAt
  profile                                     validated role/setup answers
  onboarding                                  status/version/completion/introduction
  preferences                                 account accent
  storageMigration                            version/completion audit metadata
  |
  +-- billing/test                            billing document
  |     uid, basePlan, subscription, attempt, revision, reconciliation state
  |     invoices                              latest 50 previews only
  |     +-- invoices/{invoiceId}               individual owned invoice documents
  |     +-- commands/{commandId}               reserved/idempotent payment commands
  |
  +-- devices/{deviceSessionHash}              browser-session metadata/lifecycle
  +-- authEvents/{eventId}                     retained sign-in/out history
  +-- feedback/{commandId}                     D-082 immutable submitted rating/note
  +-- feedbackState/admission                  bounded server-only hourly counter
```

Identity metadata includes UID, email/verification, provider/provider IDs, last verification time and optional name/phone/photo claims received from Firebase. Firebase Authentication remains the credential authority. Unverified registration remains Auth-only until verified product sign-in; it creates no product session or payment access.

Invoices retain the original billed-to snapshot after profile renames. Payment verification, exact service periods, refunds, cancellation and Family boundaries are preserved. Free remains the base plan and cannot replace paid state. The full history is individual invoice documents; the50-item cache is only a convenience preview.

Device records include UID, session hash, first/last seen, expiry/revocation, provider, server-observed IP and bounded User-Agent. They represent browser sessions, not proven physical devices. Login rotation may create several historical records for one browser. Raw cookies/tokens, cookie hashes, passwords, precise location, MAC addresses and hardware fingerprints are excluded from this account view. Local observed IP is normally loopback. Future GCP ingress must establish narrowly trusted proxy handling before reporting public client IPs.

## Operational indexes

`visionary_auth_sessions/{deviceHash}` remains the server-only cookie-binding/revocation lookup. Activity, logout and rotation atomically update its UID-owned device record. Global security auth events and nested events are written in the same sign-in/out transaction.

`visionary_billing_test_queue/{uid}` contains only UID/due time/revision and replaces the old billing-account collection as the worker scan index. Billing updates and mapped webhook intake update it transactionally. Provider subscription/payment maps, webhook deduplication, invitations, Family membership and rate budgets retain their operational collections. These are indexes/relationships, not separate user identities. Unknown events can lack a resolved UID and grant no access.

Legacy `visionary_billing_test_accounts/{uid}` and its children remain retained migration sources. They are not the active billing writer or queue. Inspect/edit current billing only through `visionary_accounts/{uid}/billing/test` and authorized product services.

## Authenticated account access

| Endpoint | Response |
| --- | --- |
| `GET /api/account/overview` | UID, allowlisted identity/profile, onboarding state, effective billing and record links |
| `GET /api/account/devices?limit=20&after={id}` | Owned browser sessions, current-session flag and active/expired/revoked state |
| `GET /api/account/invoices?limit=20&after={id}` | Owned invoice history beyond the50-item cache |
| `GET /api/account/feedback?limit=20&after={id}` | D-082 owned feedback receipts/notes; internal counters and fingerprints excluded |

All require verified bound session/device cookies and matching `X-Visionary-Account`. Reads do not extend idle expiry. A supplied query UID/name cannot change ownership. Page sizes are1–50, ordered by document ID with a `nextCursor`; this is stable identity pagination rather than chronological ordering. Existing owner-only billing invoice detail/printing remains connected.

D-082: `POST /api/account/feedback` additionally requires Origin/CSRF and a bounded versioned command. It atomically saves a UID-owned immutable feedback record plus hourly admission, recovering the same receipt on exact retry. [Feedback v1](FEEDBACK_CONTRACT.md) specifies schema, privacy/recovery and remaining hosted/export/operator acceptance; it does not confer training consent or permission to inspect another account.

A Family beneficiary reads their own benefits and invoice documents, not the payer's invoices or other members' activity. No staff role, cross-user admin endpoint or expanded guardian/classroom permission is introduced. The founder can inspect the hierarchy through existing authorized Firestore Console/IAM access. Client Firestore rules remain deny-all; backend authorization/projections govern responses.

The overview assembles separate authoritative records; it is not an atomic cross-service snapshot. Failure reports unavailable rather than inventing a Free downgrade or another purchase. Learning/workspace/model data that remains frontend preview data is not silently migrated or advertised as synchronized by this change.

## Migration and verification

```powershell
npm run backend:build
node scripts/account-storage-migrate.cjs                  # Read-only plan
# Stop every account/billing writer, worker and remote job before applying.
node scripts/account-storage-migrate.cjs --apply --offline
node scripts/account-storage-verify.cjs                   # Independent read-only comparison
node scripts/account-storage-migrate.cjs                  # Idempotent follow-up inspection
npm run backend:auth:dev
```

Apply refuses a listening local auth port or Cloud Run runtime; `--offline` acknowledges that every other writer/job must also be stopped. There is currently no hosted deployment. This is an offline migration, not an online multi-instance cutover mechanism. It makes no Razorpay call. Account/child enumeration pages100 documents at a time. Copies are additive/resumable; foreign ownership or different destination content stops without overwriting. A copying marker blocks sign-in/authenticated access/payment updates until completion. Never revert to an old billing writer after canonical writes without a verified reverse migration.

Actual acceptance: one existing account/three child copies, zero deletions/provider calls. Repeat inspection finds one already-migrated account/zero copies. Independent verification checks the same UID, retained sign-in event/device, identical billing/history and reports zero differences/UID conflicts/writes/provider calls. This account had no invoices or commands. Unit fixtures separately cover135 invoices across page boundaries, commands, retained security history, interrupted-copy resume and conflict refusal.

Run the independent legacy comparison before restarting writers. Once current billing advances, retained legacy billing is intentionally historical; do not use its equality comparison as a continuous production health monitor. The runtime device writer preserves recovered metadata when an older session lacks provider/IP/browser fields.

## Checks

Backend tests include `account-storage.test.cjs`, `billing.test.cjs`, `firebase-product.test.cjs` and `firebase-admin.test.cjs`. `frontend/scripts/full-journey-review.mjs` covers the combined journey using real demo Auth/session cookies, real HTTP services, transactional memory and fictional payments. Its seventh scenario validates unified identity/profile/billing UID, completed setup, independent device history and owned invoices without credentials. The actual database migration verification is separate; neither proves hosted webhook delivery or live-money release.
