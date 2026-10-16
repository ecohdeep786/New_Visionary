# Implementation sequence and acceptance

Use the [D-081 execution checklist](../BACKEND_LAUNCH_CHECKLIST.md) as the task tracker and [current-state ledger](../BACKEND_LAUNCH_EVIDENCE.md) for evidence. This document retains the architectural sequence; the tracker adds stable IDs, owner responsibilities, dependencies and granular exit gates.

The architecture/design/research/cost artifacts are delivered by D-076. This table is the remaining product build sequence; it does not imply the listed services are already connected. Retain [D-075 audit classifications](../discussions/backend-ml-audit.md) and [current local auth/payment evidence](../../../integration/USER_ACCOUNT_STORAGE.md).

| Stage | Concrete implementation | Exit gate / rollback |
| --- | --- | --- |
| 0. Architecture and evidence | Public reference study; system tree/HLD/LLD/object/communication; cost calculator | Explicit facts/inferences/unknowns; source hashes; calculator/link/integrity checks |
| 1. Domain contracts | OpenAPI/JSON schemas, errors/revisions/command identity; policy matrix; reviewed SQL DDL | All five roles and ownership examples represented; current auth/billing routes unchanged |
| 2. UID/workspace foundation | SQL minimal UID linkage, idempotent workspace provisioning, membership/consent and outbox | Wrong UID/workspace/role/expired consent denied; pool isolation; interruption/resume; no trusted preview membership import |
| 3. One durable learning slice | Published concept -> Ask -> practice attempt -> private project -> save/resume | Independent device sees same records; conflict preserves both drafts; missing model/source/save has honest recovery |
| 4. Private AI | Service IAM/signed context, authorized retrieval, source/model/prompt versions, reservation and validators | No cross-session/workspace/cache leakage; cancellation/settlement; evaluated English/Hindi/Bengali released slice |
| 5. Hosted test billing/platform | Reviewed product container/IaC, private Tasks/outbox, actual merchant test webhooks | Auth-to-payment on separate devices; duplicate/reordered/refund/cancel events; invoice ownership; cold-instance/recovery tests |
| 6. Teacher/guardian/org/professional | Enrollment/submission/feedback; verified relationships; scoped summaries/shares/aggregates | Full deny matrix, revoked shares, immutable submissions, no employment/Family-to-private-data inheritance |
| 7. Media/privacy/operations | Private scanning/publication; export/delete; lifecycle; telemetry/cost admission | Restore/re-delete drill, source withdrawal, bounded abuse/parser/jobs, no raw student logs |
| 8. Capacity and release | Realistic data/indexes, staged load/soak, provider quota and measured cost | SLO/queue/concurrency/cost objectives met; security/accessibility; approved live commercial/privacy activation |

## Contract-first vertical slice

Choose one released curriculum/language/source and one learner workspace. Define request/response/event schemas, actor/source policy and recoverable errors before wiring screens. Add repositories/state transitions to the selected product app, not legacy AppModule. Implement the current frontend adapter seam; retain preview only behind an explicit development mode. Verify published-source read, one teaching run, one attempt, one project revision and second-device resume together. Model quality and authorization are separate gates.

## Safe migration and source retirement

Use expand -> bounded backfill -> owner/revision comparison -> canary -> switch -> contract. Shadow only side-effect-free reads. A payment, submission, email or publication command has one executor; never execute both implementations to compare. Preserve UID and immutable provider/invoice/source identifiers, browser originals and command identities. Old plan/user tables and old JWT credentials do not become the new identity store by email matching.

Record intentional imported-source modifications and dependency removals in the patch ledger. Only remove an old module/lock dependency after mapping imports, replacing its behavior, retaining required reference evidence and passing relevant gates. Do not run old Prisma migrate/seed or imported Terraform/Docker defaults to implement the new design. Current root backend dev/start commands already isolate the supported product app.

## Configuration and environments

Validate origin/cookie/proxy behavior, named Firestore database, SQL edition/location, worker/model audiences, provider mode/keys, queue targets, signing key and backup/cost settings. Use managed identity/Secret Manager and workload identity federation; never copy the desktop Razorpay CSV or service-account key into a container. Test/live records remain separate while the same person UID is retained. Hosting automation can apply reviewed configuration and run acceptance; it cannot infer merchant webhook registration, credentials, tax policy or missing identity grants.

## Operational readiness

Use the detailed [release matrix](../discussions/launch-operations.md#release-test-matrix). The current D-075 target remains 150 core requests/s +16.7 AI runs/s sustained, with 300/33.4 burst. Update workload and cost inputs together when sessions, polling, voice or video change. Model stubs validate infrastructure separately from real provider quotas, quality and cost.

Owners before launch: product policy/education review, backend/data, frontend/accessibility, model evaluation, security/privacy, billing/commercial and on-call/cost operations. One person may cover several roles initially, but each release gate needs an accountable reviewer. No deployment date or team-size promise is inferred from100,000 MAU.
