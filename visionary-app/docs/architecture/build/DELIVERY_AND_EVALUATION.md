# Build delivery, capacity, cost and acceptance

Target release gates · D-078 · [design](SYSTEM_DESIGN.md) · no cloud resources are created here.

## Delivery stages

| Stage | Deliverable | Gate before enabling |
| --- | --- | --- |
| 1. Durable document Build | Server-owned projects/revisions, conditional saves, local recovery, authorized export, cross-device refetch | UID/workspace policy, conflict/idempotency, restore/deletion tests and reviewed migration mapping; preserve current product rules |
| 2. Bounded AI assistance | Guided creation/critique, selected edits, source citations, immutable proposal diff and acceptance | Educational/source/privacy/language evaluations, measured provider costs, quota reservations, cancellation/recovery and no hidden sharing |
| 3. Declarative interactive artifacts | Validated activity schema, reviewed trusted renderer and accessibility | Schema/fuzz/security validation, keyboard/mobile behavior, no arbitrary code or app-data access |
| 4. Optional code and HTML | Qualified isolated execution, quarantined output, separate browser-preview origin | Real containment/egress/metadata/kill/cleanup tests, browser threat model, reviewed dependency/image supply chain and spend caps |
| 5. Optional publication/app data | Immutable releases, recipient/public policy, capability-scoped storage/API proxy | Age/organization/source rights, abuse response, revocation, public data projection, rollback/deletion and per-deployment limits |

Stages 4–5 are separate capability investments, not prerequisites for a high-quality document Build. No automatic migration of browser drafts, user-visible plan change, public hosting or arbitrary code enablement follows from this design.

## Capacity assumptions, not a benchmark

100k monthly active users does not determine Build demand. Keep the earlier Learn/Teach workload baseline and add explicit Build scenarios. Example planning assumptions for a 30-day month:

| Scenario | Build-active users / MAU | Runs per Build user/month | Runs/month | Mean runner seconds if execution enabled | Execution seconds/month |
| --- | --- | --- | --- | --- | --- |
| Documents pilot | 5% | 10 | 50,000 | 0 | 0 |
| Growth creation | 20% | 20 | 400,000 | 30 | 12,000,000 |
| High adoption | 40% | 30 | 1,200,000 | 60 | 72,000,000 |

These illustrative rates are not plan promises, forecasts or reserved cloud capacity. Growth averages about 4.63 concurrently executing runs across a full month (`12,000,000 / 2,592,000`); a 10× peak would need about 47 active execution slots before headroom, retries and cold-start effects. If only 25% of generation runs execute code, execution demand is one quarter of that example. Generation, export, preview and execution are distinct queues; measure duration distributions and school-hour bursts, not just means. A 60-second model stage has its own concurrency/provider-token requirement independent of runner seconds.

Start with measured single-region service/DB/provider capacity. Limit API instance count and SQL pool size so autoscaling cannot exceed the connection budget. Set independent queue dispatch/concurrency caps, per-UID/workspace active-run limits and fleet ceilings. Saturated or unavailable generation returns a useful queued/unavailable state while saving remains available. Admission control occurs before model calls/runtime allocation. Load tests must cover 150 core +16.7 AI requests/sec sustained and 300+33.4 burst from the shared blueprint **plus explicitly selected Build traffic**, or revise the baseline to include Build without double-counting the same turns. School/organization load concentration and reconnect storms need separate profiles.

## Incremental cost model

The [whole-product calculator](../../../scripts/cost-model.mjs) and [dated rates](../../../infrastructure/cost/rates-2026-10-15.json) remain the previous planning model. Its text-AI assumptions do not silently include Build execution, long context, exports or generated-app hosting. Before launch add measured Build scenarios and current region/SKU/provider prices; this document deliberately does not invent a new vendor quote.

```text
Build incremental monthly cost =
  sum(actual input/cached-input/output tokens × selected provider rates)
  + execution vCPU-seconds and GiB-seconds × qualified runtime rates
  + execution node/control-plane floor if GKE is selected
  + trusted coordinator/validation/export compute and queue operations
  + retained project versions/assets/exports/backups × GiB-month rate
  + database storage/index/IO/connection capacity attributable to Build
  + preview/release delivery, cache misses and external egress
  + scanning/observability/support/abuse-response allocation
  + retries, failed runs, idle capacity and contingency
```

At the growth example, a one-vCPU/two-GiB runner produces 12M vCPU-seconds and 24M GiB-seconds of requested resource time before packing/idle/billing effects; this is a planning conversion, not a GKE invoice. Measure actual utilization and node floor. For stored output, compute `new revisions × mean bytes × retention`, plus retained uploads and replicas/backups; do not assume every keystroke needs a full binary snapshot. Use bounded text deltas/checkpoints, content-addressed blobs and reference-aware retention. Never deduplicate private files across tenants in a way that leaks file existence or permission.

Reserve budgets before generation, cap prompt/context/file counts, bound model/tool loops and retries, reuse permitted cached context by UID/workspace/source revision, and stop on ceiling. Track provider attempts even when output is rejected. Set daily fleet spend alarms and enforced admission limits; an alert alone is not a cap. Expire preview sessions and scratch data; review release retention, logs and object lifecycle. Show users a concise limit/queued/retry state without exposing infrastructure jargon. Do not charge a new subscription or change plan pricing from a run retry.

## Proposed service objectives

Candidate release objectives, measured under the selected traffic profile: acknowledged document saves p95 under 1 second excluding client network; accepted run command p95 under 1 second without waiting for the model; new device sees an acknowledged head after refetch within 5 seconds in healthy operation. Generation completion depends on artifact type and provider; benchmark separate p50/p95 targets before promising them. Durable job state survives browser close and coordinator restart. Private saving and account access have independent availability/error budgets from generation and execution. No tested SLO/capacity is claimed by writing this document.

## Acceptance matrix

| Area | Required evidence before release |
| --- | --- |
| Identity and privacy | Same UID on two devices; wrong UID/workspace/project denied; role-picker cannot grant access; revoked class/organization/consent denied mid-run and at download; Family purchase does not grant guardian visibility |
| Save/recovery | Concurrent same-base saves conflict; same-clock content changes detected; crash/offline/quota/storage errors retain local draft; per-tab recovery does not rebase silently; restore makes a new revision; ambiguous timeout returns same command result |
| AI editing | Selection drift rejected; stale base cannot overwrite newer work; malformed paths/patches/citations rejected; prompt injection cannot grant tools; reject/undo preserves original; accepted changes record origin/provenance |
| Durable jobs | Crash before/after enqueue, duplicate task, expired lease, fenced late output, provider timeout, budget exhaustion, cancellation and cleanup failure; no duplicate accepted result or user debit; orphan runtime alarm/reaper verified |
| Learning boundaries | Guided project requires existing check/practice evidence; blank projects available; fixed source/rubric/assignment versions; completion/self-review stays unverified; AI cannot release teacher grades |
| Sharing | Exact confirmation revision; later drafts excluded; accepted adult recipient/active relationship; parent summary excludes body/rubric/history; revoke/reconsent does not revive old grants; requested class revisions retain review history |
| Execution | Real fork/output/resource bombs, metadata and database probes, traversal/symlink/archive bombs, dependency/install abuse, egress attempts, cancellation and orphan cleanup; no secrets/host mounts/tokens in execution image |
| Browser preview | Script/HTML escaping, DOM isolation, iframe navigation/network abuse, forged/replayed/oversized bridge messages, opaque-origin handling, CPU-hang recovery, mobile and keyboard accessibility |
| Assets/publication | Scan failure and quarantine, digest/generation mismatch, missing object restore, unauthorized download, revoked preview, public/private cache separation, reviewed release rollback and capability scope |
| Operations and cost | Selected peak-load benchmark, SQL connection bounds, per-tenant fairness, exact usage reconciliation, restore/deletion drills, incident runbooks, external-provider outage and enforced fleet spend cap |

Preserve the existing artifact conflict, parent-project sharing, portfolio review/recovery and classroom copy/submit/review regression tests when implementing the server adapter. Current local tests establish product invariants, not production containment, persistence or cloud capacity. Track Stage 1–5 evidence separately so a passing frontend test cannot qualify an untested execution plane.
