# Delivery tracking: current versus dated

Read live [Jira](https://visionary-team.atlassian.net/jira/software/projects/KAN/list) before assigning work. No JSON file alone proves the current board state.

| Record | Meaning | Update rule |
| --- | --- | --- |
| [task-executions.json](task-executions.json) | Current scoped execution, test and review receipts | Update after actual evidence/status changes. Preserve earlier closure history; never invent approval. |
| [JIRA_SYNC.md](JIRA_SYNC.md) | Jira synchronization checkpoints | Read newest scope/date first; older board counts remain dated. |
| [product-surface.json](product-surface.json) | Generated current source inventory | `npm run scope:audit:write` after explicit source review; `scope:audit` checks drift. [Readable report](../PRODUCT_SURFACE_AUDIT.md). |
| [jira-backlog.json](jira-backlog.json), [jira-issue-map.json](jira-issue-map.json) | Requirements, issue mapping and dated full-board verification | Use source generators/verified Jira reconciliation; do not rewrite old counts as a new global read. |
| [feature-delivery.json](feature-delivery.json), [vats-delivery.json](vats-delivery.json), [education-launch.json](education-launch.json) | Planned cross-layer, VATS and feature acceptance | Generator-owned; a mapped feature or layer remains implementation work until verified. |
| [delivery-schedule.json](delivery-schedule.json) | D-091 capacity/date forecast | Generator-owned; reforecast when ownership/capacity/observed progress changes. Dates do not trigger Done. |
| [founder-spec-review.json](founder-spec-review.json) | Historical source hashes and per-file reconciliation | Preserve source provenance and dated scope. |
| [document-moves-2026-10-17.json](document-moves-2026-10-17.json) | D-095 documentation relocation ledger | Historical move verification, canonical destinations and compatibility pointers. |

D-096: KAN-28 is **Done** after qa-review approval of ec7bab9, verified/published dev integration and actual Jira transition51. KAN-29 is **In Progress** coverage-contract preparation. The D-095 Testing and earlier D-094 closure remain historical events. KAN-137 is still Testing in the current Jira read; an uncommitted report alone does not establish its closing transition. Other historical Done items and dated calendar records are unchanged.

Use [branch workflow](../BRANCH_WORKFLOW.md) and the [review template](../delivery/TASK_REVIEW_TEMPLATE.md) for closure. A task may be Done for an explicitly scoped enabler while linked domain/model/hosted gates remain open, but only after that enabler has been reviewed and verified. Dependent work waits for accepted prerequisites.
