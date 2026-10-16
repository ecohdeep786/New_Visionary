# Low-level design

Target domain/data/API mechanics. No DDL migration or controller is applied by this document. Read [communication](COMMUNICATION.md), [object responsibilities](OBJECT_DESIGN.md), current [account storage](../../../integration/USER_ACCOUNT_STORAGE.md) and [billing contract](../../../integration/PAYMENTS_CONTRACT.md).

## Identity, keys and consistency domains

Firebase UID is an opaque string, retained byte-for-byte as `persons.uid`; never parse it as UUID or generate a second person ID. Workspace/class/source/attempt/submission IDs are opaque generated identifiers. Display names, emails and provider customer IDs never join or merge people. Every protected record includes an explicit owner/workspace or a relationship that resolves to one; tenant scope is enforced in get/list/write/export paths.

Firestore owns account/profile/device/billing state. SQL owns memberships/consents/content/learning/classroom state. SQL identity linkage stores minimal UID/provisioning metadata rather than a second profile authority. A command invariant stays in one database; cross-store effects are an idempotent workflow. Private objects hold content bytes, with metadata and current grants in the domain authority.

## Relational model

```mermaid
erDiagram
    PERSON ||--o{ MEMBERSHIP : has
    WORKSPACE ||--o{ MEMBERSHIP : grants
    PERSON ||--o{ CONSENT_GRANT : subject
    WORKSPACE ||--o{ CLASS : contains
    CLASS ||--o{ ENROLLMENT : admits
    CLASS ||--o{ ASSIGNMENT_VERSION : publishes
    SOURCE ||--o{ SOURCE_VERSION : versions
    SOURCE_VERSION ||--o{ PUBLICATION : reviewed
    SOURCE_VERSION ||--o{ CONTENT_NODE : contains
    CONTENT_NODE ||--o{ ATTEMPT : assesses
    ATTEMPT ||--o{ EVIDENCE_EVENT : produces
    PERSON ||--o{ PROJECT : owns
    PROJECT ||--o{ PROJECT_REVISION : freezes
    PROJECT_REVISION ||--o{ SUBMISSION : submitted
    ASSIGNMENT_VERSION ||--o{ SUBMISSION : receives
    SUBMISSION ||--o{ FEEDBACK_REVISION : reviewed
    PERSON ||--o{ CONVERSATION : owns
    CONVERSATION ||--o{ AI_RUN : contains
    AI_RUN ||--o{ TURN : accepted
```

Cardinality in the diagram is conceptual. DDL must also enforce same-workspace cross-references and enrollment/actor constraints; two individually valid foreign keys are not sufficient tenant isolation. `PERSON` remains a UID linkage, not a duplicate password or billing table.

| Record | Required fields/constraints | Primary indexes/access pattern |
| --- | --- | --- |
| `persons` | UID PK, provisioning state/version, createdAt | UID exact |
| `memberships` | workspace, UID, role, status, policyRevision, optional expiry; unique workspace/UID/role as policy permits | UID/status/workspace; workspace/status/UID |
| `consent_grants` / `share_grants` | subject, recipient, scope/purpose, version, expiry, revokedAt, evidence reference | subject/recipient/status; expiry; grant ID with policy scope |
| `source_versions` / `publications` | sourceId, version/checksum, license/audience, languages; publication/review state and release ID | immutable version; eligible workspace/catalog/release |
| `content_nodes` | concept/sourceVersion, prerequisites, representations and authored criteria | sourceVersion/concept, curriculum/locale |
| `attempts` / `evidence_events` | UID/workspace, concept/criteria/source/policy version, revision/status; immutable event ID and result facts | owner/workspace/due; attempt/event sequence; concept/criteria |
| `projects` / `project_revisions` | owner/workspace, head revision; immutable body/object checksum and source/rubric references | owner/workspace/updatedAt/ID; project/revision unique |
| `assignment_versions` | class/workspace/author, fixed source/rubric/due-time/version, publication state | class/status/dueAt/ID; immutable published revision |
| `submissions` | learner/workspace, assignmentVersion/projectRevision, attemptNo, state/revision; unique assignment/learner/attemptNo | class/assignment/state/ID and learner/assignment |
| `feedback_revisions` | teacher/membership evidence, submission revision, criteria/comments, draft versus released grade | submission/revision; only permitted projected fields |
| `conversations` / `ai_runs` | owner/workspace, source manifest/context revision, run status, model/prompt route, reservation, final result reference | owner/workspace/updatedAt; unique reservation/run ID |
| `command_results` | actor/workspace/operation/key PK, canonical payload digest, durable outcome/revision | exact scoped command identity; approved retention index |
| `outbox` / `change_log` | eventId, owner/workspace, schema/version, resource/revision, scope, dispatch state/lease | due/partition/ID; scoped monotonic sequence |
| `report_snapshots` / `audit_events` | subject/scope/purpose, period, policy/source version, actor/reason | permitted subject/period; scoped audit cursor |

Amounts use integer minor currency units in existing billing. No floating-point money equality, invented tax fields or recalculation of old invoice identity from a current profile. SQL histories and invoices are append-only/immutable where their contract requires; deletions and retention are explicit workflows, not blind cascade cleanup of financial records.

## Request pipeline

```text
parse allowed schema/body size
 -> verify session/device and expected UID
 -> enforce Origin/CSRF on browser mutations
 -> derive ActorContext + current workspace membership
 -> action/object/consent/source policy
 -> admission and command idempotency
 -> short transaction / expected revision
 -> durable result + outbox + change record
 -> DTO projection / current policy recheck after external work
 -> account-epoch validation by client
```

`ActorContext` carries verified UID, device session ID, workspace/membership IDs, allowed action set, policy revision, purpose, request ID and deadline. Resolve workspace from the current authorized request/device context; another device's navigation must not change its role. Do not persist/copy raw cookies or Firebase tokens into records. Reject missing/unknown scope. SQL runtime roles are non-owner/non-bypass; transaction-local security context is reset by transaction boundaries, with explicit tenant predicates and RLS defense in depth. Use separate migration and ingestion identities.

## Atomic command algorithm

For a logical command scoped by `(uid, workspace, operation, idempotencyKey)`:

1. Validate input; canonicalize the allowed payload and calculate its digest. Require bounded keys and an expected resource revision where editing is involved.
2. Start a short SQL transaction. Establish actor/workspace context. Lock or insert the unique command identity. An existing completed command with the same digest returns its prior outcome after current read permission checks; a different digest returns conflict.
3. Recheck current policy inside the transaction for affected records. Load/lock the aggregate by scope. Conditional update requires expected revision. Unique constraints protect attempts/submission numbers even under concurrent requests.
4. Write aggregate changes, immutable evidence/revisions, durable command result, outbox and change-log record atomically. Commit before responding success.
5. Dispatch outside the transaction. Failure between commit and dispatch is repaired from the outbox. A lost HTTP response is repaired by replay/status with the same identity.

Never hold a database transaction/connection across a model call, checkout popup, provider HTTP request, upload, email or a user decision. External effects use a durable pending state, lease and idempotency/reconciliation workflow. Do not claim exactly-once network delivery; implement at-most-once domain effect per durable command/event identity.

### Optimistic save example (illustrative SQL, not an applied schema)

```sql
UPDATE product.project_drafts
SET body = :body, revision = revision + 1, updated_at = CURRENT_TIMESTAMP
WHERE project_id = :project_id AND workspace_id = :workspace_id
  AND owner_uid = :verified_uid AND revision = :expected_revision
RETURNING project_id, revision, updated_at;
```

Zero rows means missing/denied/stale state; resolve with scoped policy-aware reads, avoiding existence leaks. The enclosing transaction must also enforce membership/source eligibility and write the command/outbox result. The snippet alone is not the authorization implementation.

## Domain state machines

| Aggregate | States and permitted transitions | Invariants |
| --- | --- | --- |
| Workspace membership | invited -> active -> suspended/revoked; expired invitation terminal | Account role selection cannot activate an invitation; all privileged reads recheck active state |
| Source version | draft -> processing -> reviewed -> published -> withdrawn | Only evaluated/reviewed released content serves; publication pointer changes atomically |
| Practice attempt | created -> in_progress -> completed; abandoned/expired | Fixed question/criteria/source version; answers revision-bound; complete once; late replay returns prior outcome |
| Project | mutable draft head -> immutable revision; later draft/revision allowed | Sharing/submission references a fixed revision; private head is not automatically shared |
| Submission attempt | draft -> submitted -> returned; new revision/attempt -> resubmitted | Only enrolled learner submits; assigned teacher returns; old submitted snapshot retained |
| AI run | reserved -> running -> completed / failed / cancelled / denied | One settlement; authorized final output only; partial text is not completed evidence |
| Async job | queued -> leased -> succeeded / retry_due / failed / cancelled | Expiring lease, bounded attempts, durable failure reason and idempotent replay |

Whether a student can reclaim a submission is a **Visionary policy decision** to implement explicitly; do not copy Google's transition names into product permission automatically. Teacher AI feedback remains draft/proposed until an authorized teacher publishes it. Progress policy distinguishes exposure, check, practice, application and delayed retrieval; version calculations and curriculum denominator so historical results are explainable.

## Cross-store workflows

### Account -> workspace provisioning

Firestore transaction persists verified UID account + versioned provisioning intent. SQL transaction upserts minimal `persons`, creates exactly one personal workspace using a deterministic provision key and records outcome. An acknowledgment updates Firestore. Retries preserve the same UID/workspace; a crash at either boundary repairs from durable intent. Missing SQL state returns setup-pending, not a browser-generated authorized workspace. Existing accounts require an allowlisted backfill; old browser memberships are not trusted imports.

### Paid AI -> usage -> result

Firestore transaction checks current server entitlement and reserves a bounded token/cost allowance. SQL creates an owned run keyed to that reservation; failures release or expire unused reservations. Private AI receives only signed scope, permitted source manifest and budget. After provider work, the product rechecks membership/source/consent, commits accepted final state and settles usage once. A lost settlement acknowledgment is reconciled by run/reservation IDs. Cap unresolved reservations and prohibit indefinite overspend through retries. Cancellation cannot guarantee a provider refunds tokens already generated; record actual charge separately from user-visible successful usage.

### Billing reconciliation

Preserve existing command/provider/event/invoice implementation. Growth worker uses a revision-bound UID lease and authoritative provider facts; late callbacks/out-of-order events cannot overwrite a newer reconciled result merely by delivery timestamp. Persist event acceptance before acknowledging. Worker retries use original event IDs and never repeat an uncertain provider creation blindly. Test/live namespaces and lookup keys remain separate; no test purchase becomes live through configuration.

## Change feed and cross-device conflicts

Use a server-generated monotonic sequence in the SQL change log scoped to the subject/workspace or a bounded partition; do not use client clocks for ordering. Cursor is an opaque signed/versioned encoding of scope, position and policy epoch. Feed queries recheck current permission and return minimal changed IDs/revisions/tombstones, not raw private content. A policy change, expired retention cursor or changed membership can return `reset_required`; the client clears inaccessible cache and obtains fresh summaries. Firestore account/billing is refreshed from its own revisioned endpoints, not falsely ordered inside the SQL sequence.

Poll only while foreground/online, jitter requests and coalesce local writes/refetches. Future SSE sends invalidations with reconnect/heartbeat and an authenticated durable cursor; it is not the only record of change. A two-device draft conflict preserves the losing local draft for review; high-stakes submission/payment commands require online acknowledgment.

## Jobs, media and data lifecycle

Task records include scoped ID, operation/schema version, due time, lease owner/expiry, attempts, payload reference, revision and redacted last error. A worker claims conditionally, rechecks policy, runs a bounded step/checkpoint and persists outcome before acknowledgment. Stable task naming reduces duplicate enqueue, but database idempotency remains required. Terminal failures enter an application-owned failure table/collection; do not assume Cloud Tasks supplies a complete dead-letter workflow. Sweep due pages fairly with stable cursors/partitions; alert on oldest age, not just count.

Uploads use generated object IDs and short grants, validated MIME/size/checksum, private quarantine, scan/parser limits and reviewer publication. Authorize downloads separately from submission metadata. Protect against parser resource exhaustion and URL-import SSRF; arbitrary remote URL ingestion is disabled until an allowlisted fetch boundary exists. Object keys never contain unsanitized user filenames as authority. Source/index/model version changes invalidate corresponding retrieval/cache scope.

Retention is per purpose/domain and approved policy. Delete workflows enumerate UID-owned records and explicit shared snapshots, revoke grants, remove objects/index/cache and verify completion. Financial exceptions are handled by policy; no invented legal retention duration. Keep tombstones so restore/replay does not resurrect deleted access. Exports are paginated jobs with scoped object expiry and no other person's private data. Session/IP/security metadata remains bounded and excluded from model context.

## Query and resource limits

Require bounded pages (target default20/max50 for ordinary lists), canonical cursors and purpose-specific DTOs. Batch related authorized queries; no per-row service/model calls. Enforce input/output/context/file/job limits at the owning boundary and actual database connection budget. Avoid updating the account root on every learning action. Keep SQL writes short; use statement/lock/pool acquisition deadlines and jittered failover reconnect. Performance acceptance uses realistic indexes/filtered vector recall and distinguishes cold from warm results.
