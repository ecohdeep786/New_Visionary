# Frontend, backend, AI and device communication

All proposed endpoints below are **target contracts**, not existing routes. Current controllers and transports remain the source of truth for connected auth/account/test billing. The [tree](SYSTEM_TREE.md) uses the same E0–E9 path IDs.

## Communication inventory

| Path | Caller -> receiver | Protocol/identity | Data and behavior |
| --- | --- | --- | --- |
| E0 | Browser -> edge/CDN | HTTPS, public app assets | HTML revalidates; content-hashed files immutable; CSP/security headers applied at hosting layer |
| E1 | Browser Firebase SDK -> Firebase; browser -> product session | Firebase ID token exchange then secure server/device cookies | Token is transient; UID verified server-side; credentials never in local domain records or logs |
| E2 | Profile/setup/devices -> API -> Firestore | Same-origin HTTPS, verified session/device; existing expected-UID/CSRF boundary | UID-owned account, validated onboarding, private paginated devices/invoices |
| E3 | Role screen -> facade/HTTP adapter -> product module -> SQL | Same-origin HTTPS; server-derived actor/membership/consent | Validated DTO, expected revision, cursor, idempotency; no browser role is authoritative |
| E4 | Ask/Guide -> API -> private AI -> approved model | Browser cookie boundary; service IAM and signed bounded context internally | Permitted source versions, languages, deadline/token budget; validated reply/actions/citations |
| E5 | Plans -> API -> Razorpay; provider -> webhook -> worker | Authenticated browser command; secret server credentials; signed raw-body webhook | Durable checkout/verification/event/reconcile; verified entitlement and private invoice |
| E6 | Browser -> authorized storage; API/outbox -> content/privacy jobs | Short-lived scoped object capability; OIDC queue calls | Private quarantine/scan/review/export; file bytes bypass API body limits |
| E7 | Device -> changes/summary endpoint; future server invalidation -> device | Verified session + current workspace policy | Cursor/revisions/tombstones; refetch authorized data; reconnect/resume; no permission from an event |
| E8 | Dispatcher/Scheduler -> Tasks -> private worker | Dedicated service identity, exact audience, least privilege | Record ID/revision/lease; retries and duplicate-safe completion; failure/recovery records |
| E9 | CI -> registry/staging/production; runtime -> telemetry | Workload identity, deployment permissions, redacted diagnostics | Immutable release, test gates/canary/rollback and cost/SLO evidence |

## Existing frontend layers

```text
Screen / component
  -> AuthContext (identity epoch) + workspace selection
  -> domain facade (contentRepository / teachingInterface / mentorModelService / billingClient)
  -> adapter (current Firebase HTTP or target validated domain HTTP)
  -> HTTPS same-origin /api/**
  -> controller -> request authority -> policy -> command/query handler
  -> repository / transaction -> DTO projection
  -> adapter validates DTO and current account/workspace epoch
  -> UID/workspace/policy-scoped query cache -> render honest task state
```

Keep rendering separate from networking and product authority. Current `AuthContext` cancels/clears query state on account/workspace change; preserve it when adding server-backed domain adapters. Existing `backendTransport.ts` supports `content.syllabus`, `content.concept`, `teaching.request`, `mentor.turn` but has no complete matching connected server endpoint. Implement an adapter translating those existing operations to reviewed routes, rather than rewriting every screen or pretending a proxy is sufficient.

Workspace selection is scoped to the current request/device session. Device A may teach while Device B learns under the same UID; activating one context must not silently switch every other device. A synchronized last-used preference is only a navigation suggestion. Every requested workspace is still authorized independently.

Use cache keys including authenticated UID, workspace, policy revision, resource ID/version and relevant locale. Distinguish local draft state from committed query data. A late response for a previous identity/workspace is discarded even if transport abort was ignored. Persist sensitive drafts only under the current account/workspace namespace and make sign-out handling explicit.

## Connected route inventory

Source: current FirebaseProductController, AccountController and BillingController. This table intentionally does not redefine their DTOs; use [auth](../../../integration/FIREBASE_AUTH_CONTRACT.md), [account storage](../../../integration/USER_ACCOUNT_STORAGE.md) and [payment](../../../integration/PAYMENTS_CONTRACT.md) contracts.

| Route family | Connected behavior |
| --- | --- |
| `/api/auth/csrf`, `/session`, `/me`, profile/onboarding/logout/device operations | Verified identity/session/setup and device management; check actual controller methods for each verb |
| `/api/account/overview`, `/devices`, `/invoices` | Owner-bound overview and record pages; `after`/`limit`1–50, opaque document-ID order |
| `/api/billing/catalog`, `/account`, `/checkouts`, `/verify`, `/sync`, `/cancel` | Server catalog and authenticated test purchase lifecycle |
| `/api/billing/invoices/:id`, `/family/**` | Payer-only invoice and accepted Family benefit workflow |
| `/api/billing/webhooks/razorpay` | Raw JSON body <=256KiB, verified provider signature, event deduplication |
| `/api/billing/jobs/reconcile` | Existing low-volume independently authenticated test sweep; target private Tasks replaces growth scheduling |

Existing mutation transport sends exact `Origin`, `X-CSRF-Token` and `X-Visionary-Account` through the current authority rules. Session/device cookies are HttpOnly; the CSRF token comes from its endpoint. Expected UID detects an account switch; it does not authenticate an account. Normal current JSON limit is24KiB. Do not send base64 files or whole conversations to bypass it. Existing billing transport has a60s budget for provider reconciliation; existing learning transport is20s for the entire operation. These are different contracts.

## Proposed domain API surface

Use `/api/v1` for new domain routes; do not silently break current auth/billing URLs. An OpenAPI definition and runtime validators must precede adapter cutover. Paths below specify ownership/action intent, not an implemented API claim.

| Screens/jobs | Proposed operation | Permission / persistence |
| --- | --- | --- |
| Workspace selector/Connections | `GET /workspaces`; `POST /workspaces/:id/activate`; invitation/consent commands | Active verified membership, explicit consent; SQL |
| Home/Explore/Learn | `GET /workspaces/:w/catalog`; `GET /workspaces/:w/concepts/:id?sourceVersion=...`; `/home` | Eligible published source, locale and audience; SQL + source manifest |
| Ask | `POST /workspaces/:w/teaching-runs` | Owned conversation, source scope, usage reservation; AI run/result |
| Guide | `POST /workspaces/:w/mentor-turns` | Allowed action IDs and current role context; no arbitrary tool execution |
| Practice/Progress | `POST /workspaces/:w/attempts`; `POST /attempts/:a/answers`; `POST /attempts/:a/complete`; `GET .../progress` | Owned attempt/version; immutable evidence and calculated projection |
| Build/portfolio | `POST .../projects`; `PUT .../projects/:p/draft`; `POST .../projects/:p/revisions` | Owner and expected revision; separate explicit share commands |
| Classes | `GET .../classes`; `GET .../assignments`; `POST .../assignments/:a/submissions` | Enrollment, fixed assignment/project revision; idempotent submit |
| Teacher preparation/library | Draft source/assignment create/update, review and publish commands | Teacher ownership + publication/review policy |
| Teacher review/learners | `POST .../submissions/:s/return`; scoped learner summaries | Assigned teacher; immutable feedback version and return transition |
| Parent Children/Reports | `GET .../guardian-links`; `GET .../children/:c/reports` | Verified grant, permitted summary fields/purpose/expiry |
| Career/company | Portfolio shares and authorized employer summary endpoints | Personal records never inherited merely from employment |
| Organization People/Cohorts | Invitation/member/role/cohort commands | Organization scope, least privilege and audited changes |
| Organization curriculum/analytics/audit | Publication commands, aggregate/audit queries | Reviewed release, suppression threshold, audit-access permission |
| Notifications/Settings | Notification cursor/read commands; preference updates | Current UID/workspace; preference revision and destination authorization |
| Uploads/Privacy/Support | Upload intent/finalize; export/delete job commands; scoped support ticket | Object grant/limits; durable jobs; no universal support data access |
| Second device | `GET /workspaces/:w/changes?cursor=...` | Current authorization and cursor scope; refetch or reset-required |

Organization billing remains contact/contract-led. Do not invent per-seat prices or grant membership from a consumer Family purchase. Product requirements determine exact verified institution admission and share/consent policy before those endpoints launch.

## Command example: save a private draft

```http
PUT /api/v1/workspaces/ws_example/projects/project_example/draft
Content-Type: application/json
X-CSRF-Token: <token from current CSRF endpoint>
X-Visionary-Account: <current Firebase UID>
Idempotency-Key: <opaque stable key for this logical save>
If-Match: "17"

{"body":"My explanation","sourceVersionId":"sv_example","schemaVersion":1}
```

Target success: resource/revision18, server timestamp, schemaVersion, requestId and committed=true. Target conflict409: typed `revision_conflict`, latest revision and a safe refetch link; preserve the local draft and do not overwrite. Replaying the same idempotency key/payload returns the original durable outcome; a different payload conflicts. Headers/cookies are transport authority inputs; do not accept `ownerUid`, `isTeacher` or `paid=true` in the body.

## Auth-to-learning and cross-device sequence

```mermaid
sequenceDiagram
    participant C as Device A
    participant F as Firebase
    participant A as Product API
    participant D as Owned stores
    participant B as Device B
    C->>F: Sign in / verify
    F-->>C: ID token
    C->>A: Session exchange + CSRF
    A->>F: Verify identity / session authority
    A->>D: UID account + device / Free state
    A-->>C: Bound secure session
    C->>A: Complete validated onboarding
    A->>D: Persist setup; idempotent workspace provision intent
    C->>A: Read eligible concept / source version
    A->>D: Current membership / publication check
    A-->>C: Learner-safe versioned DTO
    C->>A: Save attempt/project with expected revision and command key
    A->>D: Domain + command result + outbox transaction
    A-->>C: Committed revision
    B->>A: Independently authenticate; authorized changes cursor
    A-->>B: Changed revision / authorized refetch
```

Device B uses its own server/device session for the same UID. No copied cookie, hardware ID or name matching is required. Browser-tab storage events only coordinate that browser; they are not cross-device synchronization.

## Streaming, retries and partial results

First teaching slice uses bounded request/response that fits20s overall; backend18s/provider<=14s is a proposed budget. If streaming is introduced, use an authenticated POST fetch stream with explicit `start`, `delta`, `source`, `complete`, `error` events, sequence/run IDs and schema version. Define first-content/overall timeout, disconnect cancellation, terminal result fetch and partial-text handling before changing the client adapter. An unvalidated partial delta is not a completed answer, persisted grade or mastery evidence.

Retry safe reads with bounded jitter; never automatically replay a financial/submission mutation with a new command key. When the response is lost, query command/run status or replay the original idempotent command. Refresh401 through the auth path, preserve safe intent/drafts, then refetch current policy. Denial/revocation403 removes inaccessible content; stale state409 preserves recoverable work; capacity429/503 offers retry without pretending success.
