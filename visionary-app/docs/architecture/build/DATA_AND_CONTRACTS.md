# Build low-level data, contracts and object design

D-088 implementation scope: [BUILD-09/KAN-154 and voice-guided revision controls](../EDUCATION_LAUNCH_PLAN.md) make trusted activity schemas, bounded renderer/asset manifests and explicit exact-revision approval work-ready. Arbitrary generated code/HTML and public release retain their separate gates. The contract below is still a target, not a connected API.

Target specification, not a migration or connected API · [system design](SYSTEM_DESIGN.md).

## Ownership and keys

Canonical `personUid` is the verified Firebase UID used by accounts and billing. Do not key records by name/email or create a second independent Build login. A project also has one workspace owner/context; actor UID, workspace membership, author attribution and billable payer are separate fields. A teacher or organization does not become owner of a learner's personal draft by assigning a task. Transfer between personal/organization workspaces is an explicit policy workflow, never changing `workspaceId` in an ordinary save.

Use opaque server-generated UUIDs for domain resources, UTC server timestamps, monotonically increasing project revision numbers and non-guessable command IDs. IDs locate resources; permission checks authorize them. SQL uses a UID reference to the identity directory; a foreign key cannot span Firestore and PostgreSQL. Deletion/revocation is reconciled with tombstones and a durable saga. An admin user overview joins authorized projections by UID rather than flattening all history into one growing document.

| Target table / key | Important fields and invariants |
| --- | --- |
| `build_projects(project_id)` | `workspace_id`, `owner_uid`, `kind`, `title`, `head_revision_id`, `revision_number`, lifecycle, timestamps, deletion state; index workspace/owner/update time; no implicit public visibility |
| `build_project_briefs(brief_id)` | Immutable objective/source-provider/version/rubric snapshot, eligibility evidence IDs, class/assignment if any, locale, source-policy version; authorization rechecked on use |
| `build_revisions(revision_id)` | Unique `(project_id, revision_number)`, parent, canonical manifest hash/object generation, author UID, origin/manual-or-AI-proposal, optional brief ID; immutable |
| `build_assets(asset_id)` | Project/workspace owner, object generation/hash, declared/detected type, bytes, quarantine/scan/ready/revoked state, retention; only ready assets attach |
| `build_conversations(conversation_id)` | Project/workspace/UID scope; message sequence, retention, model-visible permissions; conversation history is not authoritative file content |
| `build_runs(run_id)` | Project/base revision, requester UID, operation, pinned policy/prompt/model/tool/runtime versions, reservation ID, status, attempt fence, lease/deadline, cancel request, terminal reason |
| `build_run_attempts(run_id, attempt_no)` | Provider operation reference, fencing token, input/output digests, measured usage, transient error and cleanup state; no secrets in diagnostics |
| `build_proposals(proposal_id)` | Run/base revision, immutable candidate manifest/patch digest, citations, check results, proposed/accepted/rejected/stale state, accepted revision; no trusted executable action list |
| `build_events(run_id, sequence)` | Monotonic durable sequence, type, sanitized bounded payload, server time; retention and cursor-expiry semantics |
| `build_usage_reservations(reservation_id)` | Unique run/usage scope, payer/UID/workspace, entitlement revision, estimate/ceiling, reserved/settling/settled/released; immutable usage ledger entries unique per attempt/cost category |
| `build_preview_sessions(preview_id)` | Requester, project/revision, capability policy, expiry/revocation and origin; not a general product API token |
| `build_share_grants(grant_id)` | Exact revision, sender/recipient relationship or approved scope, action, consent/policy version, expiry/revocation; access rechecked on read |
| `build_releases(release_id)` | Later capability: approved immutable revision, publication policy, deployment ID and status; stable URL pointer changes through compare-and-swap with audit/rollback |
| `build_command_results(actor_uid, workspace_id, operation, mutation_id)` | Request hash, result/resource IDs, status, retry window; same key/different payload rejected |
| `build_outbox(event_id)` | Aggregate/version, event kind, minimal payload, dispatch status/attempt and next retry; committed with authoritative mutation |

Classroom submission records stay in the classroom domain; Build supplies the selected fixed copy and provenance. Parent summary and professional review records retain their separate consent/self-review domains. Do not duplicate grades or infer them from project lifecycle.

Large files/manifests go in private GCS, not SQL rows, chat history or Firestore account documents. Upload immutable objects first, validate their generations/digests, then commit SQL references and head/outbox atomically. A crash before SQL commit leaves an unattached object for a bounded orphan collector; a crash afterwards is recovered from outbox. Garbage collection checks all revision/export/submission retention references and tombstones. Source permission withdrawal is distinct from deleting lawful historical assessment evidence; retention and future access are policy-defined.

## API and browser communication

All paths below are proposed `/api/v1/workspaces/{workspaceId}/...` operations. Cookie-authenticated mutations require same-origin/CSRF protection; validate origin and session on event/read connections too. Every nested object must belong to the authorized project/workspace. No actor, role, billing plan, source right or grading field is trusted from the body.

| Proposed operation | Request / response behavior |
| --- | --- |
| `GET projects?cursor=...` / `POST projects` | Authorized keyset pagination; create private project, optional verified `briefId`, idempotency key; server-generated ID/head |
| `GET projects/{id}` | Authorized head, metadata, capability policy and ETag; sensitive responses private/no-store |
| `PUT projects/{id}/draft` | `If-Match` head ETag + mutation ID + validated manifest/content; 200 new head, 412 stale head with authorized current version; preserve local edits |
| `GET projects/{id}/revisions` / `POST .../restore` | Authorized immutable history; restore creates a new revision against expected current head, never rewrites history |
| `POST projects/{id}/runs` | Mutation ID, base revision, operation, bounded prompt/selection hash, brief/source IDs; 202 `runId`, status URL, event cursor and reservation ceiling; no long request deadline |
| `GET runs/{id}` / `POST runs/{id}/cancel` | Durable snapshot/cancel request; repeat cancellation idempotent; terminal outcome distinguishes cancelled from cleanup-pending |
| `GET runs/{id}/events?after={sequence}` | Authorized replay via SSE or polling; `sequence`, `runId`, type, bounded data; deduplicate/reconnect; expired cursor requires snapshot/refetch, not silent missing events |
| `POST proposals/{id}/accept` / `.../reject` | Mutation ID, expected head, exact proposal digest; reauthorize source/action; accept returns one saved revision; stale head returns conflict |
| `POST projects/{id}/assets/uploads` / `.../{assetId}/complete` | Bounded quarantine upload intent then digest/size/type/scan verification; attachment only after ready; downloads separately authorized |
| `POST projects/{id}/exports` | Explicit saved revision and supported format; 202 export job; authenticated download after ready; no hidden publish |
| `POST projects/{id}/shares` / `DELETE .../shares/{grantId}` | Exact revision, accepted recipient/scope and expected consent; explicit revocation; no share when confirmation is stale |
| Separate summary/submission commands | `parentSummaries.publish/revoke` and `classroomSubmissions.create/revise` require their existing scope and fixed-copy rules; not generic public shares |
| Later `POST projects/{id}/releases` | Explicit target/revision/approval/capabilities and release policy; generate/preview never implicitly deploy |

Return machine-readable error code, safe message, trace ID and retryability; 401 requires reauthentication while keeping the local draft, 403/404 denies unauthorized objects without disclosure, 409 denotes command/state mismatch, 412 stale revision, 413/415 oversized/unsupported input, 429 scoped quota with retry guidance, and 503 provider/service unavailable. Do not start a paid model run from a generic browser retry. An ambiguous timeout retries the same mutation ID or reads run status.

SSE/polling is an observation channel, not the command executor. Events never carry private source text, credentials or full uncontrolled stdout. Session expiry/revocation closes or denies the stream; policy checks occur on reconnect and before sensitive output. Resume uses authorized state, not a client-supplied terminal event. The existing 20-second teaching transport must remain separate; add a Build adapter with command deadlines plus durable asynchronous run observation.

## Save and acceptance transaction

```text
1. Resolve verified UID/session/workspace; authorize project, action and source rights.
2. Validate payload/manifest and ready immutable objects; compute canonical request hash.
3. Begin SQL transaction; check command key and lock project head.
4. If key already exists: identical hash returns saved result; different hash rejects.
5. Compare expected head; conflict keeps both client draft and authoritative head.
6. For AI accept: verify proposal belongs to same project/base and remains permitted.
7. Insert immutable revision; update head/revision_number; consume proposal once.
8. Insert command result + change/outbox row; commit.
9. Return acknowledged head; async dispatch can retry independently.
```

The UI marks Saved only after acknowledgement. Offline content remains Recoverable on this device. On conflict, compare versions and explicitly save a resolved revision. A recoverable editor backup retains its original base revision and per-tab identity; it does not silently adopt a newer base, publish evidence or share work. Local migration previews remain read-only until explicit ownership mapping/import acceptance is implemented; retain originals and verify counts/hashes on a real migration.

## State machines and side effects

Run: `accepted → queued → running → validating → proposal_ready | succeeded | failed | cancelled | expired`. `proposal_ready` is terminal for the generation job, not acceptance of its changes. Export/test jobs can end `succeeded` without a proposal. `cancel_requested` and `cleanup_pending` are durable operational flags; show Stopping until termination/cleanup is confirmed. A sweeper fences abandoned leases, requests cleanup and eventually finalizes failure/cancellation. No completed job is restarted by reading its status.

Proposal: `proposed → accepted | rejected | stale | revoked`. Project lifecycle `draft/in_progress/completed` remains independent of run status. A source/permission change can invalidate a proposed result without erasing history. Asset lifecycle is `quarantined → scanning → ready | rejected → revoked/deleted`.

Before expensive work, resolve current billing authority and reserve a maximum permitted amount in SQL. Store the entitlement revision and decision expiry; a stale cached entitlement is insufficient for a new run. If Firestore authorization is unavailable, deny new expensive work while allowing authorized ordinary saves where safe. No distributed transaction is claimed. Entitlement changes emit invalidation and are rechecked at queue start and external capability boundaries. SQL reservations enforce concurrent usage; they are not payment/invoice records.

Each actual provider/execution attempt records measured cost once; user-visible usage charging follows a separately reviewed failure/refund policy. Release unused reservation, settle consumed work and reconcile ambiguous provider timeouts before retry. Multiple legitimate vendor attempts can cost money even when a user action is idempotent; track those costs without duplicate user debits. A reservation ceiling bounds total attempts/tokens/time. Circuit breakers stop a retry storm; no provider failover replays publication, purchases, connector writes or deployment. Initial model runs have no such external side effects.

Settle generation usage and release unused reservation when the run becomes terminal, including `proposal_ready`; do not hold a model budget indefinitely while the user considers a proposal. Accept/reject is a separate ordinary command. A later requested test/export creates its own bounded run and reservation.

## Objects and dependency direction

| Object / port | Responsibility |
| --- | --- |
| `BuildAccessPolicy` | Derive authorized actor/workspace/object/source/capability decisions; no model decides permission |
| `ProjectAggregate` + `ProjectRepository` | Head/revision invariants, conditional save/restore, atomic command/outbox persistence |
| `ProjectBrief` / `RevisionManifest` | Immutable value objects with source/rubric/evidence and canonical content identity |
| `BuildRunService` + `UsageBudget` | Accept/cancel operations, entitlement verification, bounded reservations and terminal settlement |
| `BuildCoordinator` | Lease/fencing, bounded model/tool stages, deadlines, output validation and recovery |
| `ModelGateway` / `SourceContextPort` | Provider-independent generation and permission-filtered context; secret access stays in trusted adapters |
| `ProposalValidator` / `ProposalService` | Candidate schema/path/capability checks; explicit acceptance against base/head |
| `ExecutionPort` | Optional opaque input bundle → bounded output and cleanup receipt; implemented only by a qualified isolated runtime |
| `AssetRepository` / `ExportPort` | Immutable object lifecycle, scanning, authorized reads and isolated conversions |
| `DistributionPolicy` / `SubmissionBridge` | Exact immutable share/summary/submission scope; publish only by explicit authorized command |
| `RunEventRepository` / `OutboxDispatcher` | Durable resumable observation and at-least-once dispatch; no direct business mutations from client events |

Application objects depend on domain policies and ports; NestJS controllers, SQL/GCS/Tasks adapters, model SDKs and sandbox drivers implement those ports. They do not leak provider SDK types into editor/domain state. Keep Build domain tests independent of a provider account; separate real runtime containment tests from mocked contract tests. A class per screen or one universal agent with database credentials would violate these boundaries.
