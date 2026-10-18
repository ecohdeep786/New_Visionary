# UID-owned user data

D-072, 15 October 2026. The founder authorizes actual per-user storage, following the earlier account-design discussion. This supersedes its proposal to provide only a combined view over old billing paths.

Each Firebase Auth UID is the permanent product account ID across devices. Display names/emails are attributes, never identity keys or automatic merge rules. A browser session has its own random device-session identifier; another device retains the same user UID.

## Permanent account rule — KAN-161, 18 October 2026

One authenticated UID has one original account. Roles, devices, billing plans and subsequent activities are sections of that account, never another identity or an account named after the person's display name. A provider may be linked only after proof of both identities; this design does not identify a real-world person across independently created UIDs. Existing IDs and record paths remain stable.

The first **verified product sign-in** creates/reuses the root, its directory, Free base billing and the browser-session/event records in one transaction. Repeated sign-in preserves completed setup and paid history. An unverified Firebase registration remains pending in Firebase Authentication; it cannot open an active product account or bypass existing admission. This settles the creation boundary: account creation follows successful verified authentication, rather than merely submitting a registration form.

`visionary_accounts/{uid}/structure/account` is the readable, versioned directory of the entire account. Its `sections` map names each activity area, shows its store/location and distinguishes `connected` capability from `not-connected` domains. A directory entry is **not activity**, a membership, a subscription, a permission, or evidence that a future feature works. Actual history lives in bounded individual child records and is created only by successful authorized activity. No empty lessons, purchases, guardian links or placeholder results are created to make the database look complete.

`account-directory.ts` is the executable directory definition. Verified sign-in provisions/refreshes it transactionally; `GET /api/account/overview` returns the same UID-bound definition as `structure`. The response describes the schema; it does not claim every referenced document exists. `schemaVersion: 1` versions the directory independently of account `storageVersion: 2`. Unknown newer directory versions or foreign UIDs stop writes rather than being silently downgraded/overwritten.

### Complete activity map

| Account section | Ownership and eventual records | Current state |
| --- | --- | --- |
| Account | Verified identity, profile, onboarding and account preferences on the original UID root | Connected |
| Authentication | UID-owned browser sessions and retained sign-in/out history | Connected |
| Billing | Free base plan; mode-separated subscriptions, commands and owned invoices; confirmed Family benefit references | Connected in test mode |
| Feedback | Submitted feedback and replay/admission bookkeeping | Connected |
| Learning | Owned learning workspaces, lesson position, source/version references | Domain integration pending |
| Conversations | Permitted Ask/Guide runs, messages, citations and cancellation state | Domain integration pending |
| Practice | Private attempts, revisions, checks and due review | Domain integration pending |
| Projects | Private Build projects, artifact versions, runs and explicit share receipts | Domain integration pending |
| Progress | Recorded evidence, goals and reproducible summaries; no invented mastery | Domain integration pending |
| Connections | Membership/consent references with scope, expiry and revocation | Domain integration pending |
| Teaching | Owned teaching preparation and authorized class/assignment references | Domain integration pending |
| Family | Verified guardian/child relationship and explicitly permitted summaries | Domain integration pending |
| Career | Private career work and explicitly shared portfolio references | Domain integration pending |
| Organization | Verified organization memberships and permitted organization activity | Domain integration pending |
| Privacy | Owner export/retention/deletion requests and receipts under accepted policy | Domain integration pending |
| Support | Support requests and notification preferences/delivery receipts | Domain integration pending |

For a future domain, the reserved account entry point is `domainLinks/{domain}` (for example `domainLinks/learning`). No such document is written by the directory. The owning service must first implement its accepted API, permissions, store, provisioning/recovery and tests. A later link may identify an actual provisioned domain account/workspace using this same UID and its owning-store revision; it cannot contain a service secret, signed download URL or authorization grant. Domain links are locators, not permission checks. The backend must recheck current membership/consent/source authority when following them.

One account is the ownership/navigation model; it does not require copying every shared object into Firestore. Preserve D-075's accepted SQL ownership for future workspace/content/learning/Build data and object storage for file bytes. Personal domain rows use the same `owner_uid`; the account section locates that data. Shared classrooms, organizations, sources and Family relationships have one owning record and permitted account links. A teacher, parent, employer or organization does not receive a copy of the person's private account/history. This prevents a second competing account while retaining transactional and permission boundaries.

Each future record must have a versioned schema, immutable owner UID (and workspace/object identity where relevant), server timestamps, bounded payload, relevant expected revision/idempotent command identity, and a defined current authority check. Create section data lazily on its first committed activity. Lists are paginated; large history never becomes an unbounded array on the account root. A pending/failed cross-store provision keeps its recovery state and cannot be presented as active. Provider callbacks and model output never become trusted committed activity by themselves.

The lifecycle is: pending Firebase identity → verified account/provisioned directory → optional onboarding → committed per-section activity. New devices and role preferences reuse the UID. Logout revokes only the relevant session and retains the account/history. No automatic purge/TTL or deletion is introduced. Test and future live billing cannot share a document or grant each other's benefits.

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
  +-- structure/account                       readable directory of all sections
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
  +-- domainLinks/{domain}                     reserved owning-service entry points;
                                              absent until real domain provisioning
```

Identity metadata includes UID, email/verification, provider/provider IDs, last verification time and optional name/phone/photo claims received from Firebase. Firebase Authentication remains the credential authority. Unverified registration remains Auth-only until verified product sign-in; it creates no product session or payment access.

Invoices retain the original billed-to snapshot after profile renames. Payment verification, exact service periods, refunds, cancellation and Family boundaries are preserved. Free remains the base plan and cannot replace paid state. The full history is individual invoice documents; the50-item cache is only a convenience preview.

Device records include UID, session hash, first/last seen, expiry/revocation, provider, server-observed IP and bounded User-Agent. They represent browser sessions, not proven physical devices. Login rotation may create several historical records for one browser. Raw cookies/tokens, cookie hashes, passwords, precise location, MAC addresses and hardware fingerprints are excluded from this account view. Local observed IP is normally loopback. Future GCP ingress must establish narrowly trusted proxy handling before reporting public client IPs.

## Operational indexes

`visionary_auth_sessions/{deviceHash}` remains the server-only cookie-binding/revocation lookup. Activity, logout and rotation atomically update its UID-owned device record. Global security auth events and nested events are written in the same sign-in/out transaction.

`visionary_billing_test_queue/{uid}` contains only UID/due time/revision and replaces the old billing-account collection as the worker scan index. Billing updates and mapped webhook intake update it transactionally. Provider subscription/payment maps, webhook deduplication, invitations, Family membership and rate budgets retain their operational collections. These are indexes/relationships, not separate user identities. Unknown events can lack a resolved UID and grant no access.

Legacy `visionary_billing_test_accounts/{uid}` and its children remain retained migration sources. They are not the active billing writer or queue. Inspect/edit current billing only through `visionary_accounts/{uid}/billing/test` and authorized product services.

These top-level operational collections do not constitute additional user accounts. Cookie binding/revocation, pre-account rate budgets, provider callback lookup/deduplication and shared relationships require service-owned indexes. They must carry the resolved UID/reference where available, contain only their operational fields, and cannot replace the canonical nested user records. Retained legacy snapshots are historical sources, never active writable account authorities. Do not delete/rewrite them merely to simplify the console.

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

### Directory rollout and current-data verification

```powershell
npm run backend:build
node scripts/account-directory.cjs              # Read-only directory plan
node scripts/account-directory.cjs --apply      # Only additive derived metadata
node scripts/account-directory.cjs --verify     # Read-only current-tree invariants
node scripts/account-directory.cjs              # Repeat must plan zero writes
```

Review the exact source revision before apply. This directory-only backfill can coexist with current writers: it transactionally reads the root/directory, refuses UID/version/copying conflicts, and changes only `structure/account`. It never alters profile, onboarding, billing, invoices, security history or shared domain data and never calls a payment provider. Auth identity existence is read through Admin; identifiers/private values are not printed. Reads/writes enumerate accounts in pages of 100. Replaying an unchanged directory writes nothing. Unknown future directory schema versions require their own compatible upgrade.

The current-tree verifier checks root/identity/billing UID consistency, directory equality, billing due-time/revision index, owner claims on invoice/command children and both directions of nested security/index ownership. It compares current mirrors, not historical billing snapshots. It reports counters and fails on actual missing/different/foreign records; it does not repair them. Run against a quiet snapshot or repeat after activity completes, because multiple read-only queries are not one cross-record transaction. It is a maintenance check, not proof of every provider or domain's release acceptance.

Rollback may stop consuming/provisioning this additive directory while preserving it. Existing paths and authority remain usable; no reverse data migration or automatic deletion is required. Future schema changes must keep the old version readable or provide their own reviewed migration.

## Checks

Backend tests include `account-storage.test.cjs`, `billing.test.cjs`, `firebase-product.test.cjs` and `firebase-admin.test.cjs`. `frontend/scripts/full-journey-review.mjs` covers the combined journey using real demo Auth/session cookies, real HTTP services, transactional memory and fictional payments. Its seventh scenario validates unified identity/profile/billing UID, completed setup, independent device history and owned invoices without credentials. The actual database migration verification is separate; neither proves hosted webhook delivery or live-money release.
