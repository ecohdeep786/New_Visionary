# Capacity, GCP operations and release gates

15 October 2026 · D-075 · companion to [system design](system-design.md).

These are sizing assumptions and acceptance targets for the founder's **100,000 MAU** launch, not measured production capacity, a provider SLA or a spending quotation. Replace assumptions with beta telemetry before production sizing. No resource is provisioned by this document.

## Workload model

| Input | Planning assumption | Derived demand |
| --- | --- | --- |
| Active population | 100,000 MAU; 20% daily active | 20,000 DAU |
| Core API traffic | 60 non-AI calls/DAU/day; 12-hour active window | 1.2M/day; 27.8 requests/s active-window average |
| Core peak | About 5.4 times active-window average | 150 requests/s planned sustained; 300 requests/s five-minute burst |
| Foreground AI | 4 turns/DAU/day, 30-day month | 80,000/day; 2.4M/month; 1.85/s active-window average |
| AI peak | Nine times active-window average | 16.7 new runs/s sustained; 33.4/s short burst |
| AI residence | 12-second mean at peak, not latency percentile | About 200 simultaneous runs; about 400 during the burst |
| Model tokens | Mean 3,000 total input + 700 output tokens/run | 7.2B input and 1.68B output tokens/month, before retries or savings |
| Peak model quota | 16.7 runs/s at those sizes | About 3.01M input and 701,400 output tokens/minute; burst doubles this |
| Billing stress scenario | 10% paid assumption; 10,000 renewals/webhooks concentrated into one hour | 2.78 accounts/s; 100,000 duplicate deliveries/hour = 27.8 events/s |
| Learning history | 10 evidence events/DAU/day | 6M events/month; payload/index retention affects cost |

At the same MAU, a classroom starting at a fixed time can exceed these peaks. Explicitly test a 1,000-user synchronized class event. Limit polling and batch dashboard data; the 60-call estimate must include foreground change polling, not add unlimited polling afterward. Static CDN traffic is separate from API traffic. Concurrency is arrival rate multiplied by mean service time; MAU alone does not size compute.

The billing scenario is a test vector, not an assertion that every user pays or Razorpay permits that request rate. Obtain merchant/provider limits and respect global and per-account budgets before choosing dispatch throughput.

## Initial tuning candidates

| Runtime | Candidate resources | Min / max instances | Request concurrency | Database pool ceiling/instance |
| --- | --- | --- | --- | --- |
| Product API | 2 vCPU / 1 GiB | 2 / 30 | 40 | 4 SQL connections |
| Private AI | 2 vCPU / 2 GiB | 2 / 60 | 8 admitted runs | 2 SQL connections; no connection held during model streaming |
| Short workers | 1 vCPU / 1 GiB | 0 / 5 total across queues initially | 2 | 2 SQL connections |
| Heavy parsing/embedding | Cloud Run Job, measured resource class | Queue/parallelism bounded separately | One bounded document partition/task | Account explicitly in pool budget |

These are test starting points. AI capacity at 60 instances * 8 slots is 480 in-flight runs; operating near 60% occupancy gives 288 slots, enough for the assumed 200-run sustained peak. A 400-run burst consumes most headroom. Slower models, large documents or cold scaling require queuing/rejection, higher provider quota or different sizing. Core capacity must be measured independently; concurrency 40 is not proof of 40 requests/s. Cloud Run concurrency is configurable and affects throughput/memory/scaling. [Concurrency guidance](https://docs.cloud.google.com/run/docs/configuring/concurrency)

API pool120 + AI pool120 + short-worker pool10 + maintenance allowance10 = **260 planned SQL connections** before heavy jobs. Reserve at least 400 usable server connections in the tested configuration, or reduce admission/pools to fit the actual instance. Do not assume a chosen CPU/memory class provides that limit or acceptable query performance. Budget rolling revisions, failover reconnects and transient scale overshoot as well as jobs. Add bounded pool acquisition, idle/lifetime limits, jittered reconnect and transaction timeouts; close connections at shutdown. The pool budget is a safety ceiling, not a database size recommendation. [Connection management](https://docs.cloud.google.com/sql/docs/postgres/manage-connections)

Load-test a regional HA SQL candidate starting at 4 vCPU/16 GiB with realistic vectors, indexes and write amplification. Increase or isolate retrieval if CPU/IO latency shows interference. Keep scans/re-embedding out of foreground transaction budgets. Set minimum instances and model quota from measured cold-start/latency and the agreed budget, not all maxima permanently running.

Admission control enforces per-UID/device/workspace quotas, plan-authorized concurrent runs, output-token/context limits and global provider budgets. A shared coordinator must enforce the real global cap; per-instance counters cannot. Retry only transient safe operations, with bounded jitter and a remaining deadline. Cap one interactive fallback/retry and account for both provider costs. Return typed 429/503 with clear retry timing rather than allowing unbounded in-memory waiting. Give billing its own queue and provider circuit breaker.

## Latency and reliability targets

| User outcome | Proposed launch target | Measurement |
| --- | --- | --- |
| Core authorized read/write | 99.9% successful eligible requests/month; p95 <=500ms, p99 <=1.5s | Edge-to-response, dependency errors included; validation/real permission denial separate |
| AI useful completed answer | 99% successful admitted eligible runs; p95 first useful content <=5s; p95 final <=18s for bounded lesson turns | Include retrieval/provider/schema failures; record rejected demand and deadline failures separately |
| Checkout/status journey | 99.5% technical completion for eligible user attempts excluding explicit user/provider declines | Track dependency failures and unresolved purchases; never hide failures as pending forever |
| Webhook durable acknowledgment | p95 <=2s | Acknowledge after durable acceptance; provider unavailability may defer reconciliation |
| Entitlement convergence | 99% <=60s after a valid event becomes available; pending older than5min alerts | Include worker/delivery lag; polling fallback covers missing delivery |
| Cross-device visibility | Own write returns committed revision; other foreground device p95 <=35s | 30-second jittered poll candidate; revoked reads denied independently |
| Important async jobs | Bounded published per-job processing window | Queue age plus execution age, not only HTTP success |

99.9% permits 43.2 minutes of error budget in a 30-day month; 99% permits 7.2 hours. These are application objectives, not guarantees from composing service SLAs. The architecture has one primary region and does not promise regional-outage continuity.

The existing frontend transport has a **20-second whole-operation deadline**. First connected teaching operations must fit inside it: proposed backend18s and provider<=14s after bounded policy/retrieval overhead. A future streaming transport needs its own reviewed protocol, cancellation and first-token/overall deadline; do not silently extend the current transport to120s. Longer tasks should return a durable job ID and explicit status. Cloud Run timeout limits do not substitute for application cancellation; configure aligned platform/application/client budgets and stop dependency work on abort. [Request timeout documentation](https://docs.cloud.google.com/run/docs/configuring/request-timeout)

## Durable work and observability

Use transactionally written outboxes and Cloud Tasks for directed retryable work. Each record includes ID, owner/scope, schema version, operation, due time, attempt/lease state, immutable command key and redacted error class. Task payloads carry IDs, not full documents or secrets. Workers authenticate the queue caller, load current records, verify revision/policy and record a durable outcome. Duplicates, reordering and a crash after commit-before-ack must be harmless.

On terminal retry/age exhaustion, mark the domain job failed/manual-review and place a minimal failure record in an application-owned failure collection/table. Cloud Tasks is not being assumed to provide a dead-letter workflow automatically. Recovery sweeps detect undelivered outboxes and expired leases with stable cursors. Replays preserve original event IDs. Ingestion supports checkpoints, source checksum deduplication and independently retriable partitions.

Structured telemetry: request/trace ID, operation, sanitized error class, dependency duration, authorization outcome, queue age, source/prompt/model release, token counts and estimated charge. No prompt, authorization header, cookie, email or invoice body in general logs. Restrict detailed diagnostic samples with purpose, access and retention; default to no raw student conversations. Hash/pseudonymize identifiers in operational analytics without treating pseudonymization as anonymization.

Dashboards/alerts:

- Core error/latency and auth failure spikes; fast and slow SLO burn windows.
- SQL CPU/IO, lock/query/pool latency, connection use, replication/backup health and storage growth.
- Firestore transaction aborts, permission errors, read/write/index usage and hot document rates.
- Billing unresolved-command age, webhook signature/dedup counts, invoice uniqueness and provider-state divergence.
- AI admission rejection, first-content/final latency, model quota/429s, grounded-answer/citation failure, tokens/cost per successful run.
- Oldest outbox/task/lease, failure collection backlog, ingestion publication failures, deletion/export age.
- CDN hit rate, app asset errors, direct-origin bypass attempts and WAF false positives.

## Recovery and backup policy

Use regional HA SQL with automatic backups and point-in-time recovery; explicitly configure and verify protection rather than relying on creation defaults. SQL zonal failover drops connections and needs application reconnect handling. HA is not a backup or regional DR strategy. [HA behavior](https://docs.cloud.google.com/sql/docs/postgres/high-availability)

Enable and verify available Firestore backup/PITR controls for the **named** database, object versioning/lifecycle where appropriate, and encrypted copies with restricted identities. Set final retention from approved product/privacy/financial policies. Preserve source artifacts needed to rebuild embeddings. Redis can be discarded and rebuilt. Terraform state is encrypted, access-controlled, versioned and locked; it is never a place for copied service-account JSON.

| Incident | Engineering recovery objective to prove | Acceptance |
| --- | --- | --- |
| App revision failure | Restore known-good revision <=15min | Committed commands/invoices preserved; schema compatible |
| SQL zonal failure | Restore usable requests <=5min | Reconnect/jitter/idempotent retries; no duplicate submissions |
| Logical SQL corruption | PITR RPO target<=5min, RTO target<=4h | Independent restore, sample record/revision checks and re-delete tombstoned data |
| Firestore logical damage | Explicitly selected backup/PITR recovery point, target RTO<=4h | Verify named database restore procedure and account/billing integrity; do not claim cross-store atomic restore |
| Full region outage | Initial manual DR target RTO<=24h / RPO<=24h for covered data | Encrypted cross-region backup/location policy and drill required; otherwise documented as unachieved |

Firebase Auth, Firestore, SQL, object storage and provider records have different recovery semantics. After restore, pause external writes/jobs, verify Auth UID ownership and deletion tombstones, reconcile payment history from durable event/provider facts, and rebuild projections/indexes. Restoring a database must never create a fresh Free record over uncertain subscription state. During primary-region failure, a static status/read-only surface may remain available; do not automatically route writes to an unprepared region.

## Delivery and infrastructure

Create reviewed Terraform under `infrastructure/` for project APIs/IAM, VPC, SQL, buckets, Secret Manager, Artifact Registry, Cloud Run, edge, Tasks, Scheduler, observability and backups. Pin versions; isolate state per environment; prevent accidental production data deletion. The imported ML Terraform is not the product deployment plan. Validate plan and policy before apply. No deployment is part of D-075.

CI stages: source/provenance/secret checks -> relevant component tests/build -> API/schema compatibility and policy tests -> immutable non-root container build -> dependency/image scan and SBOM -> staging deploy with workload identity federation -> contract/journey/model/load gates -> production canary -> SLO observation -> gradual traffic increase. Treat new secret findings and exploitable release-path vulnerabilities as blockers, with reviewed fixes/exceptions. Do not run import staging commands as part of deployment.

Container context must exclude `.env*`, private keys, local credentials, test CSVs, browser artifacts, research tools, old deployment code and unrelated package environments. Supply configuration through validated environment variables and Secret Manager references using dedicated service identities. Use ADC; no long-lived desktop credential in an image or CI. Current supported backend Node22/24 selection remains; retain independent locks and pinned language/container versions.

Product process: root `npm run backend:build`, then `npm run backend:start` selects `dist/src/main-auth.js`. Its runtime is currently auth/account/test billing only. Imported package `start`, `start:dev`, `src/main.ts`, Prisma migrate/seed and imported Docker defaults are **legacy references** and must not be copied into a deployment. Future product images use the connected entrypoint explicitly and a module-graph release check.

Migration uses expand/backfill/verify/switch/contract with a feature flag and per-domain rollback. Separate schema migration identity from application identity. Backups precede changes; backfills are bounded and resumable. Avoid dual writers; shadow reads compare owned revisions before cutover. Do not contract columns/events until old revisions/queued jobs no longer need them. Invoice/provider event history is immutable across rollback.

Hosted configuration must validate canonical origin, secure cookie/proxy behavior, project/database ID, approved service audiences, secret versions, queue targets, webhook path/raw body, provider mode and region. It should reject incomplete configuration. DNS/merchant webhook registration, quota grants and secret provisioning cannot happen automatically merely because files are hosted on GCP. Deployment automation applies reviewed configuration and runs acceptance; it does not guess accounts or live commercial settings.

## Cost envelope and growth triggers

Budget calculation before launch:

```text
monthly model charge = input_billable_tokens/1M * approved_input_rate
                     + output_billable_tokens/1M * approved_output_rate
                     + embedding/reranking/tool charges
monthly platform = measured Cloud Run CPU/memory/request time + SQL HA/storage/backups
                 + Firestore reads/writes/indexes + storage/egress/CDN/load balancer
                 + queues/logging/monitoring + auth/mail/provider fees
cost per successful learning turn = all attributable variable charges / successful turns
```

The token scenario alone is 7,200 million-input units and1,680 million-output units; evaluate with current contracted rates, not guessed pricing. Cache hit savings, context compression and retry/fallback amplification must come from measured eligible traffic. Set project/provider alerts, per-plan token/concurrency caps, maximum context/output, storage/job caps and a safe degradation switch. Alerts-only budgets are not spending caps; assess supported-service spend caps separately and retain runtime reservations/provider limits. Do not sell unlimited costly inference based only on an MAU estimate. D-076 adds a [dated, executable cost model](../blueprint/CLOUD_AND_COST.md) with scenario assumptions and current pricing evidence.

Scale or split when sustained API CPU/pool latency breaks SLO, retrieval consumes the transaction budget, queue age exceeds its objective, model quota approaches planned peaks or regional recovery needs exceed the documented design. Add SQL read replicas only for proven read-heavy eventually consistent queries; keep membership/billing-sensitive checks on their authority. Add regional serving only with replicated data, UID/session/policy and failover design. Consider AlloyDB/vector infrastructure or dedicated GPUs after benchmark/cost gates in [ML strategy](ml-strategy.md).

## Release test matrix

| Gate | Required evidence |
| --- | --- |
| Runtime/provenance | Product entrypoints isolated from legacy modules; pinned source verification; built production path exists |
| UID/auth/device | Register/verify/onboard/recover/expire/revoke/account switch; one UID on independent devices; no stale writes |
| Workspace policy | Five-role allow/deny matrix; guessed IDs; expired/revoked consent; personal/company separation; tenant-safe connection reuse |
| Persistence | Revisions, retries with same/different payload, duplicate submission, offline draft, second-device change visibility |
| Payment | Auth-required checkout; real test provider/webhooks; duplicate/reordered/cancel/refund/renewal; immutable private invoice; crash recovery |
| AI/source | Wrong UID/session/source/version rejected; published-source citations; prompt injection/tool denial; language/safety and graceful model outage |
| Queues | Commit-before-dispatch crash, commit-before-ack crash, duplicate task, expired lease, starvation, terminal failure and replay |
| Load | Realistic records/indexes and cache-cold tests:150 core requests/s +16.7 AI runs/s for60min;300/33.4 burst5min; isolated payment storm;24h soak |
| Model-load substitute | Deterministic model stub validates infrastructure separately; sampled actual provider load validates quotas/latency with a bounded token budget; never call stub output production AI capacity |
| Recovery/security | SQL failover/restore, Firestore restore procedure, lost worker, rotated secret, direct-origin bypass, log redaction and deletion after restore |
| Experience | Mobile/keyboard/screen reader, English/Hindi/Bengali, slow network, partial/error/retry, source withdrawal and preserved work |

Record achieved percentiles, error rate, queue age, database/pool and model quota/cost at each stage. A passing build or UI route review does not satisfy these gates. Existing local auth/payment tests remain valuable regression evidence; hosted and learning/ML gates are still open.
