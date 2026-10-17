# Build system tree and high-level design

Target design · D-078 · [entry point](README.md) · [diagram](../diagrams/BUILD_SYSTEM.md).

## End-to-end tree

```text
Visionary — one verified Firebase UID
├── Shared foundation (same as Learn/Teach)
│   ├── HTTPS load balancer / Cloud Armor / public asset CDN [target GCP]
│   ├── Authenticated same-origin product API / device-bound sessions
│   ├── Account/onboarding/devices: Firestore [connected locally]
│   ├── Billing/entitlements/invoices: Firestore + Razorpay TEST [connected locally]
│   └── Workspace membership / consent / source policy / audit [target server authority]
├── Learn / Teach [separate domain]
│   ├── Approved source/version → lesson → check/practice → evidence
│   └── Assignment/objective/rubric → explicit project brief or submission contract
└── Build [existing local document editor → staged server design]
    ├── Frontend Artifact Studio
    │   ├── Project list / editor / selected-text request / criteria
    │   ├── Visible save state / local recovery / conflict comparison
    │   ├── Guidance conversation (not the artifact database)
    │   ├── Run status / bounded diagnostics / proposal diff / accept or discard
    │   └── Preview / export / explicit share / fixed classroom copy
    ├── Product API: trusted Build modules [Cloud Run target]
    │   ├── Project service: authorized head + optimistic draft saves
    │   ├── Run service: authorization + usage reservation + durable enqueue
    │   ├── Proposal service: source policy + base revision + explicit acceptance
    │   ├── Asset service: quarantine / scan / immutable manifest / authorized reads
    │   ├── Distribution service: grants / summary / submission / release [separate commands]
    │   └── Change/event queries: authorized sequence cursor / reconnect / refetch
    ├── Domain persistence [target]
    │   ├── Regional HA PostgreSQL: projects, revisions, runs, grants, usage, outbox
    │   └── Private GCS: versioned manifests/files, quarantined output, exports
    ├── Durable async control [target]
    │   ├── Transactional outbox → Cloud Tasks → idempotent coordinator
    │   ├── Lease/attempt fencing → cancel/deadline → cleanup/recovery sweeper
    │   ├── Private AI adapter: permitted sources + bounded prompt/tool budget
    │   └── Validate proposal/output → store immutable candidate → notify/refetch
    ├── Optional untrusted execution plane [later target, separate GCP project]
    │   ├── Clean pinned images / reviewed dependencies / one isolated run
    │   ├── GKE Sandbox gVisor candidate; Cloud Run Sandboxes Preview pilot option
    │   ├── No account/payment keys, application cookies, cloud metadata or database access
    │   └── Egress deny / resource caps / bounded output / termination + verified cleanup
    └── Delivery surfaces [target]
        ├── Trusted document renderer / reviewed declarative activity renderer
        ├── Separate cookieless preview origin for optional generated HTML
        ├── Private download / accepted-recipient fixed share / class submission
        └── Later reviewed immutable release; separate app-data capability proxy
```

## Boundaries and data flow

**Request path:** The browser sends the authenticated same-origin API a workspace ID, object ID and mutation ID; it never supplies trusted actor/role/price fields. The API derives UID from the current device session, checks membership/age/consent/source/action and resolves entitlements through the existing billing authority. Plan ownership does not create teacher, employer or guardian permission. Model tools do not receive session cookies or billing credentials.

**Save:** The editor sends its base revision and changed content. A transaction checks the current head and writes a new immutable revision plus outbox/change record. Concurrent edits receive a conflict and retain both versions for comparison; no silent last-write-wins. The UI labels browser recovery separately from server-saved work. A second device fetches server head; it cannot see another device's unsaved local draft. Workspace choice stays device/request-scoped. Real-time collaborative merging is deferred; do not promise CRDT collaboration from this optimistic-save protocol.

**Generation:** The user selects an objective, revision or text range and requests help. The API validates the selection hash/source rights and atomically reserves a bounded usage amount with a durable run/outbox record in SQL. The coordinator receives the run ID, reauthorizes context and calls an approved model adapter. It gives the model only authorized files/chunks, a pinned prompt/tool/schema version and bounded instructions. Uploaded documents and generated files are untrusted input, never instructions granting extra tools. Whole-project regeneration is not the default for a small selection edit.

**Proposal:** Output is a bounded patch/candidate manifest, not a command to overwrite the project. Validators reject path traversal, absolute paths, symlinks, hidden executable attachments, oversized/decompression-bomb output, unsupported formats and undeclared capabilities. Text is rendered as text or through a reviewed sanitizer/AST renderer. A proposal records its base revision, citations/source versions, model/prompt/runtime versions, checks and authorship. The user previews a diff and accepts; the server repeats authorization and compare-and-swap. Newer edits cause a conflict. Retrying accept returns the same revision, not a duplicate.

**Jobs:** Task delivery is at least once. The SQL run state, unique command IDs, lease token and attempt fence determine the one accepted outcome. Transactional outbox enqueue plus a recovery sweeper covers crashes between commit, dispatch and acknowledgement. Event delivery can duplicate or reconnect; event sequence and authorized snapshot refetch recover it. Cancellation is a durable request followed by process termination and cleanup, not an optimistic UI claim. Stale worker output cannot complete a cancelled, expired or superseded attempt. Failed cleanup quarantines the runtime and prevents reuse.

**Assets/exports:** Upload into quarantine with declared size/type/digest; scanning and complete-upload verification precede attachment. The same authorization gates exported files and private object reads. The artifact record points to immutable object generations/checksums; a missing object never becomes a valid head. Export uses a selected saved revision and reviewed renderer, not arbitrary code in the API. Office/PDF conversions are isolated workers. Short-lived signed links have a documented residual validity window; for immediately revocable classroom/learner content, use an authenticated download gateway instead of handing out raw signed URLs. Public CDN caches contain only approved public projections.

## Learn/Teach integration

A guided `ProjectBriefSnapshot` contains a verified objective/source/rubric version, eligible check/practice evidence IDs, locale and permitted capabilities. Current local behavior requires both check and practice pass; blank personal projects remain available. The server must validate the evidence and rights; raw route parameters and an onboarding role do not establish eligibility. Source withdrawal or revoked membership blocks new generation and new distribution, including queued work and authorized caches.

Build returns an explicitly selected immutable submission copy for the assignment. A teacher receives that copy and allowed review fields, not the learner's private conversation/draft/history. Changed work follows the requested-revision lifecycle, retaining the previous submission/review. A completed artifact or professional self-review remains self-reported application evidence until assessed; model confidence and model checks cannot award mastery or release grades.

Parent summaries remain a separate fixed, consent-bound personal-learning publication, excluding body/rubric/private drafts. Family payment is irrelevant to that authorization. Professional personal and employer-sponsored workspaces remain distinct; organization administration does not reveal personal projects. Preserve adult-only accepted-recipient sharing where currently required. Expired/revoked/reconsented relationships must not revive old grants.

Compatibility limits remain explicit: the existing classroom project-copy flow supports written-response assignments, not question-type assignments. Keep its 50,000-character bound and the parent-summary 500-character bound until a separately reviewed contract changes them. Professional self-review remains adult, private and distinct from teacher assessment or a credential.

## Execution, preview and generated-app data

Initial Build uses document/Markdown and schema-validated declarative activities with reviewed renderers. It needs no arbitrary server code execution. Add HTML/JavaScript only after its own browser threat-model review: a renderer can freeze the browser or abuse network/navigation even when no backend runner is involved.

For later compile/test/Python/JavaScript execution, use a dedicated execution project/network/IAM boundary, clean signed images and a supported sandbox runtime qualified against [GKE documentation](https://docs.cloud.google.com/kubernetes-engine/docs/concepts/sandbox-pods). Do not mount the product source, credentials, Docker socket, host filesystem or Kubernetes service-account token. Block metadata, default-deny ingress/egress, and limit CPU, memory, process count, scratch space, execution time and output. A trusted supervisor provides only an authorized immutable input bundle and collects bounded output to quarantine; user code cannot list the storage bucket or query SQL/Firestore. Pinned dependencies come from reviewed images or a controlled mirror, not arbitrary install scripts in the API.

[Cloud Run Sandboxes](https://docs.cloud.google.com/run/docs/code-execution) are a current Preview alternative, not an ordinary Cloud Run container setting to assume enabled. The documented host-root-filesystem visibility requires a clean dedicated launcher image even though environment inheritance/egress are blocked by default. Pilot acceptance must qualify region, Preview support, containment, cancellation, orphan cleanup, compatibility and cost. Do not cohost account/payment/AI secrets inside the execution image. GKE operational overhead is only justified when server execution launches; it is not a launch dependency for document Build.

Serve optional generated previews from a separate cookieless registrable domain with no product credentials. A restrictive iframe sandbox omits `allow-same-origin`, popups, top navigation, downloads and forms unless a separately reviewed capability requires them. CSP starts with network denied and only reviewed local resources. Generated output is never injected into the trusted app DOM. A narrow `postMessage` bridge validates the actual iframe window, per-preview nonce, revision/run ID, schema, message size and rate; sandboxed opaque origins can report `null`, so origin text alone is not authorization. The bridge supports bounded display/status messages, never payment, sharing, secrets or arbitrary API calls. Killing/replacing an iframe is recovery, not a guaranteed CPU-security boundary.

Generated apps with persistence or external APIs require a later declared-capability data proxy. Every request resolves authenticated actor + project + deployment revision + granted operation, schema and quota. No embedded provider key, direct admin Firebase config, raw SQL or generic URL fetch. Public apps expose only a reviewed public projection and explicitly scoped anonymous data if approved; they never inherit student/classroom/account records. Maintain distinct personal and genuinely shared namespaces. Connector tokens are per-user, encrypted and revocable; no connectors enabled in the initial phase.

## Cloud, reliability and operational authority

Keep GCP as primary cloud: shared load balancer/CDN, modular NestJS API and coordinator on Cloud Run, PostgreSQL/GCS/outbox/Tasks, private AI and observability. No service per screen. Build modules initially share a deployment but own tables and contracts. A dedicated execution plane scales and fails independently; neither its saturation nor a model outage should block saving, account access or payments. No active second-cloud database is required for 100k MAU.

Apply the blueprint's regional backup/restore and deployment gates. Version manifests and referenced objects need a consistent restore watermark; immutable object retention must cover retained SQL revisions. Restore tests check missing objects and grants before serving restored projects. A stale restore must not revive revoked consent: reconcile current policy/tombstones or fail closed. SQL outbox and idempotency recover work; there is no Firestore/SQL distributed transaction. Account deletion uses a durable UID-scoped saga covering revisions/assets/providers, audit retention and derived caches; stop pending runs and new downloads immediately, then verify removal within the published policy.

Use least-privilege service identities, private database connectivity, Secret Manager only for trusted adapters, encrypted storage, trace IDs, redacted telemetry and no body/prompt/token logging by default. Audit actor/action/object/revision/policy outcome separately from diagnostic output. Support staff require explicit audited access; no implicit owner impersonation. Metrics: successful saves/conflicts, event lag, queue age, orphan runtimes, cleanup failures, denied downloads, proposal rejection/acceptance, provider spend and cost per useful accepted artifact. See [delivery gates](DELIVERY_AND_EVALUATION.md).
