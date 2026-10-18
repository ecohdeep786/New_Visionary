# Architecture and engineering delivery

Use this index by question rather than decision date. [Product requirements](../visionary/README.md) define the journeys; [current status](../visionary/CURRENT_PRODUCT_STATUS.md), live Jira and [execution receipts](tracking/task-executions.json) describe implementation progress. Target diagrams, layer labels and forecasts do not establish runtime or AGI capability.

## Understand the system

| Question | Read |
| --- | --- |
| What does each component own? | [Product domains](PRODUCT_DOMAINS.md), [repository layout](../../README.md), [integration contracts](../../integration/README.md) |
| How do requests and data travel? | [Platform diagrams](diagrams/README.md), [numbered request paths](diagrams/REQUEST_PATHS.md), [communication contracts](blueprint/COMMUNICATION.md) |
| Where are HLD, LLD, object design, cloud and cost decisions? | [Engineering blueprint](blueprint/README.md), [consolidated recommendation](reviews/FINAL_ARCHITECTURE_RECOMMENDATION.md) |
| How does Build differ from Learn/Teach? | [Build architecture](build/README.md) |
| How do the seven VATS layers connect? | [Implementation and ownership](VATS_IMPLEMENTATION.md), [backend↔ML contract](../../integration/VATS_CONTRACT.md), [layer exits](../../ml/vats/layers.json) |
| What did the code and founder-document audits find? | [Review index](reviews/README.md) |
| What supports the 100,000-MAU target? | [System design](discussions/system-design.md), [resilience/scale](diagrams/RESILIENCE_AND_SCALE.md), [launch operations](discussions/launch-operations.md). Measured load/hosted acceptance remains required. |

## Deliver a task

1. Read [branch ownership and mandatory review](BRANCH_WORKFLOW.md).
   Create a [named task worktree](delivery/TASK_WORKTREES.md), push its checkpoints, and remove the instance after verified completion; the next task gets a fresh instance.
2. Check [current execution versus dated plans](tracking/README.md), live prerequisites and the [implementation handoff](IMPLEMENTATION_HANDOFF.md).
3. Implement one owned scope, collect evidence and submit the [review template](delivery/TASK_REVIEW_TEMPLATE.md).
4. Keep the issue in **Testing** while review/verification is pending. Reviewer approval and relevant integration verification precede **Done** and the next dependent task. [Current review handoff](delivery/D095_DOCUMENTATION_REVIEW.md).

Planning entry points: [launch checklist](BACKEND_LAUNCH_CHECKLIST.md), [source evidence](BACKEND_LAUNCH_EVIDENCE.md), [feature delivery matrix](FEATURE_DELIVERY_MATRIX.md), [education launch plan](EDUCATION_LAUNCH_PLAN.md) and [calendar](DELIVERY_CALENDAR.md). The calendar is the D-091 one-founder/one-agent forecast; additional worker branches do not automatically shorten it. Current account/auth/test-billing/feedback foundations and pending domain/model/hosted work retain their separate acceptance boundaries.

## Files and history

`blueprint/`, `build/`, `diagrams/` and `discussions/` hold system design; `reviews/` holds dated assessments; `delivery/` holds review handoffs; `tracking/` holds structured plans and execution receipts. Generated root reports remain at stable paths. Old review filenames are compatibility pointers to their new canonical locations.

Pinned backend/ML/REA imports keep independent dependencies and reviewed provenance. Use [backend](../../backend/README.md), [ML](../../ml/README.md), [frontend](../../frontend/README.md), [infrastructure](../../infrastructure/README.md) and [research](../../research/README.md) for component setup. Current ML/VATS integration is required for released AI journeys; the imported legacy model gateway is isolated until qualified, as explained by the implementation contracts.

[D-057 relocation evidence](reviews/RESTRUCTURE_VERIFICATION.md) and [original layout manifest](restructure-2026-10-13.json) retain the historical snapshot. Normal `product:verify-layout` allows intentional source evolution; `--preserved-source` checks that older relocation snapshot. Historical root `src/`, `public/` and `tests/` now mean `frontend/`; old `tmp/` captures moved to `artifacts/tmp/`. Do not rerun the one-time relocation script. [D-095 documentation moves](tracking/document-moves-2026-10-17.json) retain hashes and old-path compatibility; append-only logs remain unchanged except new entries.
