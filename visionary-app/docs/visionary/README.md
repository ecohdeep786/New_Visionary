# Visionary product requirements and evidence

Start with [MASTER_SPEC](MASTER_SPEC.md), then read **all** of [VISIONARY_MASTER_v2.2](VISIONARY_MASTER_v2.2.md), [agent protocol](agents/README.md), your Part V charter, and the latest [STATUS](STATUS.md), [DECISIONS](DECISIONS.md) and [QA](QA.md) entries. v2.2 is the operative contract, read with subsequent decisions. `archive/legacy-pack/` preserves superseded sources and never overrides it.

## Find the right document

| Need | Read |
| --- | --- |
| Current implementation and remaining gates | [Current product status](CURRENT_PRODUCT_STATUS.md), latest three log entries, live [Jira](https://visionary-team.atlassian.net/jira/software/projects/KAN/list) and [execution receipts](../architecture/tracking/task-executions.json) |
| Product scope and acceptance | [Launch sequence](AGI_LAUNCH_SEQUENCE.md), [product gate](PRODUCT_GATE.md), [shared acceptance](SHARED_ACCEPTANCE.md), [frontend review worksheet](FRONTEND_REVIEW_WORKSHEET.md), [traceability](TRACEABILITY.md) |
| Runtime data/API boundaries | [Backend contract](BACKEND_CONTRACT.md), [local store inventory](LOCAL_STORE_INVENTORY.md), [current integration contracts](../../integration/README.md) |
| Internal design and UI handoffs | [Design index](design/README.md), [writing](../written-style.md), [motion](../motion-style.md), [stylesheet ownership](../../frontend/src/styles/README.md) |
| System design, VATS and Build | [Architecture index](../architecture/README.md) |
| Task ownership, review and Jira completion | [Branch workflow](../architecture/BRANCH_WORKFLOW.md), [review handoff template](../architecture/delivery/TASK_REVIEW_TEMPLATE.md) |
| Dated UI and browser evidence | `baseline/`, [category flow acceptance](CATEGORY_FLOW_ACCEPTANCE_2026_10_09.md), [principal design review](PRINCIPAL_DESIGN_REVIEW_2026_10_10.md) |

Only **STATUS, DECISIONS and QA** are living logs. Specifications, inventories, review handoffs and receipts are deliverables, not competing status logs. Preserve original log bytes and append new evidence with its decision/date/scope.

## Read historical work in context

D-056 and later decisions authorize backend/authentication/ML development. Older frontend-only or “before backend work” statements are dated context, not current restrictions. Existing frontend acceptance remains required; backend authorization does not certify earlier waves.

Design handoffs now live in `design/`. Short files at their former paths preserve existing references and generated consumers. The design index identifies the dated continuations; no old handoff alone is final product acceptance. Browser fixtures and local previews do not establish hosted readiness, model quality, device qualification or content rights.

The separate `docs/Frontend(Head Of Product Agent)/` remains excluded from internal work. Preserve current journeys, role/source/privacy boundaries and unrelated public-team changes.
