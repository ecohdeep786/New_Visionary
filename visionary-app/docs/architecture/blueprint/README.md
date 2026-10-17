# Visionary end-to-end engineering blueprint

Implementation: [complete backend launch checklist](../BACKEND_LAUNCH_CHECKLIST.md) and [source/verification ledger](../BACKEND_LAUNCH_EVIDENCE.md).

Decision baseline: [final architecture recommendation](../FINAL_ARCHITECTURE_RECOMMENDATION.md) consolidates the reference reviews, retained stack/ownership choices, operation-specific consistency and implementation exit gates.

D-079 review entry point: [platform architecture](../diagrams/PLATFORM_ARCHITECTURE.md), [request paths](../diagrams/REQUEST_PATHS.md) and [resilience/scale](../diagrams/RESILIENCE_AND_SCALE.md). [Review findings](../VISUAL_REVIEW.md) distinguish diagram improvements from remaining implementation.

Visual review: [overall, Learn/Teach and Build diagrams](../diagrams/README.md). D-078 adds a separate [Build system specification](../build/README.md) with its own contracts, lifecycle, execution gates and incremental cost scenarios while retaining this shared foundation.

Research: 15 October 2026 · finalized: 16 October 2026 · D-076 · 100,000 monthly active users · architecture and cost planning, not a deployment.

Start with the [system tree](SYSTEM_TREE.md). It connects product screens to requests, ownership, databases, workers and delivery. Then use the lower-level documents for implementation. This extends the [D-075 architecture](../discussions/system-design.md) after a public-evidence study of Google Classroom, Khan Academy and YouTube; it preserves the existing Firebase UID/account/test-payment implementation.

| Chunk / question | Deliverable |
| --- | --- |
| 1. What can we establish about the reference products? | [Research findings, actual REA runs, primary sources and uncertainties](../../../research/SYSTEM_DESIGN_STUDY_2026_10_15.md) |
| 2. How does every part fit together? | [Complete system tree](SYSTEM_TREE.md) and [high-level design](HIGH_LEVEL_DESIGN.md) |
| 3. What happens at request/data boundaries? | [Frontend/backend communication](COMMUNICATION.md) and [low-level design](LOW_LEVEL_DESIGN.md) |
| 4. Which objects own rules and dependencies? | [Object-oriented design](OBJECT_DESIGN.md) |
| 5. One cloud or two, and what will it cost? | [Cloud choice and cost controls](CLOUD_AND_COST.md), [versioned calculator inputs](../../../infrastructure/cost/launch-scenarios.json), and [generated scenarios](COST_SCENARIOS.md) |
| 6. How do we implement safely? | [Delivery sequence and acceptance](IMPLEMENTATION.md), plus existing [operational release gates](../discussions/launch-operations.md#release-test-matrix) |

## Read the status labels

**Connected** means locally implemented and covered by the existing account/payment evidence. **Existing preview/interface** means current frontend behavior or types without the complete production API. **Target** means a specified future component/contract; writing its design does not create it. **Reference** means imported old source or third-party published evidence.

Connected: Firebase identity exchange, server/device sessions, profile/onboarding, UID-owned account tree, Free default, Razorpay test subscriptions/reconciliation/Family benefits and private test invoices. Learning/workspace/teacher/guardian/company authorization, durable learning sync and AI serving remain target work. Native apps are future consumers of the same identity/API contracts, not shipped clients.

## Architecture decisions

- **One primary cloud: GCP.** Use the existing Firebase identity/data investment, regional managed compute/data, one security/observability system and one delivery pipeline. AWS is an evaluated alternative, not an additional launch dependency. Off-cloud backups or another model vendor do not imply active-active multi-cloud application hosting.
- **One person: verified Firebase UID.** Names and email are attributes. Workspace/class/organization memberships and consent grant permission. Buying Family benefits does not grant guardian/classroom access.
- **Modular product API + separate AI + durable workers.** Modules own domain invariants; deployment boundaries follow workload and privilege needs. No service per screen and no giant user object owning everything.
- **Firestore account/billing + reviewed PostgreSQL product domain.** Keep working records. Add explicit cross-store workflows; never promise a transaction spanning both databases.
- **API-first models, own educational system.** Visionary owns source rights/publication, retrieval permission, evidence, teaching contracts, allowed actions and evaluations. Specific models require benchmarks; training is a later measured decision.
- **Cost is a product rule.** Meter successful and failed expensive work, enforce reservations/concurrency/context limits, control retention/egress and compare contribution margin. Current public pricing and real payment policy are unchanged by this blueprint.

## Architecture completion versus product completion

The blueprint answers tree/HLD/LLD/object/communication/cloud/cost questions with concrete target contracts and an executable planning calculator. It cannot recover private third-party implementation details or establish an actual 100,000-user benchmark. Implementation follows staged migrations and acceptance; existing auth/payment authority and unrelated frontend work remain intact. No cloud resources, accounts, charges or model training are created by this study.
