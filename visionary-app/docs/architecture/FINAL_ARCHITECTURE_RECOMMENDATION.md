# Final architecture recommendation

Execution: [backend launch checklist](BACKEND_LAUNCH_CHECKLIST.md) and [current-state evidence](BACKEND_LAUNCH_EVIDENCE.md) track completed local foundations, remaining implementation and release acceptance.

16 October 2026 · D-080 · baseline for implementation toward the 100,000-MAU growth target.

**Keep the revised Visionary architecture and proceed through staged implementation.** It is a defensible design proposal, not proven production capacity or a completed product. Further changes should answer an observed product, reliability, privacy, performance or cost requirement. Adding technologies or redrawing the topology alone will not close the current integration gaps.

The [YouTube guide](https://grokkingthesystemdesign.com/guides/youtube-system-design/) discusses different workloads for ingestion, processing and delivery. The [general guide](https://grokkingthesystemdesign.com/complete-guide-to-system-design/) emphasizes requirements, access patterns, tradeoffs, failure handling and validation. These are useful review prompts. Their named private-system implementations and illustrative performance figures are not independently established facts about current YouTube, and are not Visionary capacity evidence.

Start with the [platform map](diagrams/PLATFORM_ARCHITECTURE.md), [request paths](diagrams/REQUEST_PATHS.md) and [scale/recovery view](diagrams/RESILIENCE_AND_SCALE.md). The [shared blueprint](blueprint/README.md) and [Build specification](build/README.md) remain the detailed contracts. This recommendation consolidates D-075–D-079; it does not replace their ownership, source, consent or payment rules.

## Architecture baseline

| Area | Decision and reason |
| --- | --- |
| Primary cloud | One primary GCP application cloud. Keep current Firebase integration and one deployment/operations system. Cross-region recovery requires its own tested configuration; a second application cloud is not a launch requirement. |
| Serving | Modular NestJS product API on target Cloud Run hosting. Separate private AI and bounded workers because their latency, privileges, resource use and costs differ. Core handlers avoid learning-SQL/model startup dependencies; shared-process saturation still needs admission limits and a measured service-extraction trigger. |
| Person and workspace | One verified Firebase UID across devices. Names/emails are attributes. Each request/device selects a separately authorized workspace; onboarding category, payment plan or role picker cannot grant membership. |
| Data ownership | Preserve Firestore account/onboarding/device/test-billing authority. Add PostgreSQL for reviewed relational membership, source, learning, classroom and project contracts. This adds operational complexity, justified by those relationships and incremental preservation of working records, not by MAU alone. No cross-store ACID transaction is promised. |
| Files | Private GCS for bounded versioned files/manifests/exports. Public CDN only for reviewed public assets; private byte delivery retains object authorization and appropriate revocation semantics. |
| Background work | Owning-store transactional outboxes, Tasks, idempotent workers, leases/fences and recovery sweeps. At-least-once delivery requires duplicate-safe business outcomes; it does not promise identical AI output or make the whole product event-sourced. |
| Learn / Teach | Versioned authorized sources, durable attempts and evidence, fixed classroom submissions and reviewed assessment. Progress policy is reproducible; consumption, model certainty and project self-review cannot award mastery. |
| Build | Durable private documents and revisions first; AI creates bounded proposals applied explicitly against the current head. Sharing, summary publication, submission, export and deployment are separate commands. Optional generated-code execution gets a separately qualified runtime. |
| Models | Managed APIs behind Visionary-owned authorization, retrieval, usage and evaluations. Select a provider/model after educational, language, privacy, quota, latency and cost evidence. Own-model serving/training requires a later measured quality/economic case. |
| Search and recommendations | Permission-filtered keyword/vector retrieval and explainable educational eligibility/ranking first. Evaluate released languages/categories. Add specialized indexes, reranking or learned recommendations only when measured benefit warrants them. |
| Growth and cost | Bound API instances × DB pools, queue concurrency, tokens/attempts, retained bytes and media egress together. Optional caches, replicas, service splits and sharding require measured triggers. Use actual cost per useful completed task, not an attractive infrastructure-only estimate. |

## Consistency is chosen per operation

| Workflow | Required behavior |
| --- | --- |
| Membership, consent and private object access | Authoritative policy at the relevant mutation/delivery boundary; a stale cache or invalidation event does not grant access. Revocation blocks new protected work/output. |
| Payment and entitlement | Provider-verified durable command/event state, deduplication and reconciliation. Pending/ambiguous state stays pending; a client success callback cannot grant a paid plan. Provider synchronization is asynchronous, not a global atomic payment transaction. |
| Project save, source release and classroom submission | Atomic conditional commit within the owning store, immutable versions and explicit conflicts. UI acknowledges a save only after commit; local recovery remains visibly unsynced. |
| Device synchronization | Other devices refetch committed authorized revisions; reconnect/cursors recover missed events. Unsaved per-tab drafts are not automatically visible elsewhere, and navigation on one device does not switch every device's workspace. |
| Dashboard, search and recommendations | Derived results may lag, but current permissions/source eligibility still gate displayed or delivered content. A rebuilding projection cannot erase authoritative evidence. |
| AI/provider outage | Preserve ordinary editing and saved work while their own dependencies remain healthy. Report generation unavailable/partial honestly; do not fabricate success, citations, grades or paid access as a fallback. |

Avoid describing the entire product as either strongly or eventually consistent. Each store, operation and failure boundary has its own contract.

## Current implementation and release readiness

The current product backend module registers Firebase product, account and billing controllers. It does not register the future learning/classroom/project controllers. Auth, onboarding, the UID account tree, Free defaults and Razorpay test workflows are locally connected. Hosted webhook delivery, live commercial activation and production operations remain release work.

The active Build route uses ArtifactStudio. Its existing local document/recovery/privacy workflows must survive the server adapter cutover; design documents do not establish server persistence or cross-device learning/Build sync. Imported legacy backend/ML code stays isolated reference material until replaced, tested and intentionally retired with provenance retained.

The largest risks to measure first are permission correctness, record/revision integrity, provider token/quota/spend limits, SQL connection contention, synchronized classroom bursts, and recovery after dependency failures. The existing workload/cost inputs are planning assumptions and the specific production model is unselected.

## Implementation sequence and exit evidence

1. **Domain foundation:** reviewed schemas/APIs, UID linkage, verified workspaces/membership/consent, source ownership and command identity. Prove wrong-user/workspace/role, revoked relationships and stale commands are denied.
2. **One durable product slice:** one released curriculum/language/source with saved learning evidence and a private Build document. Prove two-device resume, conflict recovery, immutable submission boundaries and safe reviewed local-data import. Keep account/test billing intact.
3. **Private AI connection:** permission-filtered retrieval, pinned source/prompt/model versions, budget reservation, output validation and explicit proposal acceptance. Prove useful educational behavior, cancellation, no cross-user leakage and reconciled usage under provider failure.
4. **Hosted staging and role rollout:** reviewed infrastructure/configuration, real test webhooks, private jobs, teacher/guardian/organization/employer policies and scoped telemetry. Prove the actual auth-to-payment-to-domain journeys and revocation behavior, not only mocked contracts.
5. **Growth release:** representative data and school-hour load/soak, provider quota approval, measured unit economics, backup/PITR/restore/deletion drills, source withdrawal, deployment rollback and an accountable operational owner. Existing SLO/RPO/RTO objectives remain targets until demonstrated.

Observability, backups, job recovery and spend admission accompany each relevant stage; they are not deferred until after launch. Code execution, generated-app persistence and public deployment have later independent release gates. Do not enable every category/language before its content rights, quality and role journeys are accepted.

The architecture is sufficiently specified to start this sequence. The next product milestone is a verified durable vertical slice, followed by measured expansion. No new architecture diagram is required to begin that work, and no production-readiness or 100,000-user guarantee follows from this conclusion.
