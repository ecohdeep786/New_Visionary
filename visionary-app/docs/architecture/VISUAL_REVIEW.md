# Architecture review: clearer maps and implementation priorities

16 October 2026 · D-079 · [reference-review record](../../research/YOUTUBE_REFERENCE_REVIEW_2026_10_16.md).

The earlier deliverable had substantial system specifications, but its diagrams were too close to task flowcharts. A reviewer had to open several documents to discover where the API runs, which store owns a record, how bytes travel, and which failures are isolated. The improvement is a compact, grouped deployment map plus separate flow and scaling views, preserving the detailed product policies and honest implementation status.

Start with the [platform architecture](diagrams/PLATFORM_ARCHITECTURE.md) ([SVG](diagrams/rendered/platform_architecture.svg)); use [numbered request paths](diagrams/REQUEST_PATHS.md) and [resilience/scale](diagrams/RESILIENCE_AND_SCALE.md) next. **C** means connected product integration, **T** means target. GCP hosting and future domain/AI services remain targets. An API module box does not imply a separate microservice or cloud resource.

## Review coverage and our decisions

| Review question | Existing Visionary specification | Improvement or decision |
| --- | --- | --- |
| What product are we designing? | [Domain map](PRODUCT_DOMAINS.md), [system tree](blueprint/SYSTEM_TREE.md) | Education evidence, source rights, private projects and role-scoped workspaces define boundaries; video engagement does not define learning success |
| What must work, and how well? | [HLD](blueprint/HIGH_LEVEL_DESIGN.md), [operations](discussions/launch-operations.md) | Show core saving/account availability separately from optional model availability; targets need measured release evidence |
| What load are we sizing? | [Cost/workload model](blueprint/CLOUD_AND_COST.md), [Build scenarios](build/DELIVERY_AND_EVALUATION.md) | Keep 100k MAU, 20k assumed DAU, 36M core requests and 2.4M text-AI turns/month separate from additional Build runs; peak duration/concurrency and quotas determine capacity |
| Where does each component run? | [Container design](blueprint/HIGH_LEVEL_DESIGN.md) | Group API modules under one target Cloud Run deployment; show private AI/workers, data authorities, external providers and later execution explicitly |
| Which technologies are justified? | [Cloud/cost rationale](blueprint/CLOUD_AND_COST.md) | Retain React, NestJS, Firebase/Firestore and target PostgreSQL/GCS/Tasks. No automatic Kafka, Cassandra, sharding, Redis or second cloud |
| Who owns data? | [LLD](blueprint/LOW_LEVEL_DESIGN.md), [Build records](build/DATA_AND_CONTRACTS.md) | One UID, multiple workspace contexts; Firestore account/billing and SQL domain transactions remain separate; immutable blobs are not database rows |
| How do requests and files move? | [Communication contracts](blueprint/COMMUNICATION.md) | Number ordinary commands, protected byte delivery and durable generation separately; acknowledge saves only after commit |
| Which objects enforce rules? | [Object design](blueprint/OBJECT_DESIGN.md), [Build objects](build/DATA_AND_CONTRACTS.md) | Policy/aggregates/repositories/adapters own invariants; a model or UI role picker cannot authorize access |
| What scales independently? | [HLD triggers](blueprint/HIGH_LEVEL_DESIGN.md), [Build admission/cost](build/DELIVERY_AND_EVALUATION.md) | Bound API instances × DB pools, private AI budgets and queue concurrency independently. Extract services only after a measurable need |
| What fails and how do we recover? | [Release/restore gates](discussions/launch-operations.md) | Visualize outbox/retry/fencing, no-model editing, backup/PITR/restore, grant reconciliation and enforced spend limits |

## Concrete gaps that diagrams do not fix

1. Most learning/classroom/project records still use frontend previews rather than server-owned domain APIs. The schema/API/adapter and verified role/consent policies must be implemented before promising cross-device domain persistence.
2. Current auth/onboarding/Free/test-payment connections must remain authoritative. Live money, real hosted webhooks, cloud ingress and operational deployment acceptance are separate release work.
3. AI provider selection still needs education/language/rights/privacy/latency/cost evaluations. No model, retrieval integration or training becomes production-ready through an architectural box.
4. GCP infrastructure, database connection limits, restore/deletion drills, load tests and measured unit economics are targets. MAU alone cannot prove capacity.
5. Generated-code execution, browser preview and public app persistence remain gated. Ordinary application containers, client role selection and public links are insufficient authorization boundaries.

## Implementation order

First complete verified membership/consent/source publication and server-owned learning/project records behind the existing frontend facades. Connect durable document Build and conflict-safe cross-device saves while retaining local recovery. Then connect bounded AI through reviewed sources, usage reservations and output/proposal validation. Add durable processing, queues, telemetry, backup/restore and hosted auth/payment acceptance as required by each cutover. Qualify actual load/cost/recovery behavior before growth launch. Code execution/publication is a later independently reviewed capability, not a prerequisite for high-quality learning and document creation.

Use one primary GCP cloud and a modular API initially. Account handlers must avoid model/SQL startup dependencies, but a shared process still shares CPU/memory failure risk. Bound workloads now and split core serving when measured contention warrants it. Regional HA is availability within a region; cross-region disaster recovery requires actual replicas/backups, recovery procedures and tests. Private caches are permission/version scoped; they accelerate authorized data and never become the permission authority.

## Reading and reproduction

The [diagram index](diagrams/README.md) is the review entry point. Platform/resilience presentation layouts use original native SVG generated by [the layout script](../../scripts/architecture-review-layout.mjs); each Markdown document keeps its logical Mermaid companion. The common renderer parses the companion and exports the native layout when provided, with source/layout/output digests. Request-flow and earlier domain diagrams render directly from Mermaid. Both representations describe dependencies; detailed contracts remain authoritative where an overview omits a response or worker write.

This change improves architecture review and identifies staged implementation work. It does not provision GCP, migrate user records, change pricing, activate live payments or add new production APIs.
