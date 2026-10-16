# Jira launch tracking

16 October 2026 · D-084 source review and readback; D-083 initial transfer retained below.

The founder supplied the existing **[Team AGI (KAN)](https://visionary-team.atlassian.net/jira/software/projects/KAN/list)** project URL. Project metadata and its initially empty issue list were verified through Atlassian. The prepared backlog is now created in that project. No duplicate project, board, permissions, people or calendar commitments were introduced.

## Verified result

| Scope | Work items | Jira status |
| --- | ---: | --- |
| Existing scoped local accomplishments | 12 tasks | Done |
| Open launch work | 106 tasks | To Do |
| Separate later capabilities | 5 tasks | Idea |
| Phase organization | 15 epics | Foundation Done; P00–P12 To Do; Later Idea |

Total: **138 work items**: 123 tasks and 15 epics, with **32 native Blocks dependencies** (30 phase and two task dependencies). Across tasks and epics there are 13 Done, 119 To Do and 6 Idea. All task parents, stable source-ID labels and expected statuses were checked across both API pages, along with dependency directions. Local Done items retain explicit local-only acceptance boundaries; hosted, commercial, model, privacy and growth gates stay open.

D-084 adds [AI-11 / KAN-137](https://visionary-team.atlassian.net/browse/KAN-137) for reproduced metric defects and [AI-12 / KAN-138](https://visionary-team.atlassian.net/browse/KAN-138) for unsafe legacy quality collection/export. They block AI-01 / KAN-83 and AI-09 / KAN-91 respectively. Nine existing descriptions retain their original text and gain source-backed closure criteria: AI-01/02/03/04/06/08/09, RELEASE-04 and LATER-04. No item is closed by the audit. See the [findings and evidence limits](../BACKEND_ML_JIRA_REVIEW.md).

## Working views

- [Now — seven first tasks](https://visionary-team.atlassian.net/jira/software/projects/KAN/list?jql=project%20%3D%20KAN%20AND%20labels%20%3D%20%22visionary-now%22%20AND%20issuetype%20!%3D%20Epic%20ORDER%20BY%20created%20ASC)
- [Next — remaining launch tasks](https://visionary-team.atlassian.net/jira/software/projects/KAN/list?jql=project%20%3D%20KAN%20AND%20labels%20%3D%20%22visionary-next%22%20AND%20issuetype%20!%3D%20Epic%20ORDER%20BY%20created%20ASC)
- [Later — five separate capabilities](https://visionary-team.atlassian.net/jira/software/projects/KAN/list?jql=project%20%3D%20KAN%20AND%20labels%20%3D%20%22visionary-later%22%20AND%20issuetype%20!%3D%20Epic%20ORDER%20BY%20created%20ASC)
- [Completed local tasks](https://visionary-team.atlassian.net/jira/software/projects/KAN/list?jql=project%20%3D%20KAN%20AND%20labels%20%3D%20%22visionary-local-complete%22%20AND%20issuetype%20!%3D%20Epic%20ORDER%20BY%20created%20ASC)
- [All 138 work items](https://visionary-team.atlassian.net/jira/software/projects/KAN/list?jql=project%20%3D%20KAN%20AND%20labels%20%3D%20%22visionary-launch%22%20ORDER%20BY%20key%20ASC)

Start with the contract/authority work, coordinate the schema and staging foundations, then complete the first durable learning-to-project journey. Keep one or two implementation items active. This is work-in-progress guidance in descriptions, not an enforced Jira column limit. No delivery dates, sprints or assignees have been invented.

| Source ID | Jira task | First queue requirement |
| --- | --- | --- |
| SCOPE-01 | [KAN-28](https://visionary-team.atlassian.net/browse/KAN-28) | Inventory every exposed route/control by learner category, five roles, language and operation; classify connected, preview, missing and intentionally unreleased behavior. |
| SCOPE-03 | [KAN-30](https://visionary-team.atlassian.net/browse/KAN-30) | Write versioned OpenAPI/runtime schemas, errors, pagination, mutation identity, expected revisions and event cursors; retain existing auth/account/billing route compatibility. |
| SCOPE-04 | [KAN-31](https://visionary-team.atlassian.net/browse/KAN-31) | Map each operation to actor/workspace/object/source/consent authority and owning datastore. |
| SCOPE-06 | [KAN-33](https://visionary-team.atlassian.net/browse/KAN-33) | Turn existing frontend invariants into backend contract/deny cases; select the first released curriculum/language/source and synthetic fixtures for a vertical slice. |
| DATA-01 | [KAN-36](https://visionary-team.atlassian.net/browse/KAN-36) | Review product SQL DDL and indexes for UID linkage, workspaces/memberships, consent, sources/releases, sessions/evidence, classrooms/projects and operational records; exclude legacy account/plan authority. |
| DATA-02 | [KAN-37](https://visionary-team.atlassian.net/browse/KAN-37) | Add versioned migrations, separate migration/runtime identities, bounded resumable backfills, compatibility checks and rollback. |
| PLAT-01 | [KAN-45](https://visionary-team.atlassian.net/browse/KAN-45) | Create reviewed product IaC/environment configuration for GCP identities/network, data, storage, compute, edge, queues and protection; do not apply imported legacy Terraform/Compose as product deployment. |

## Traceability and maintenance

- [Source checklist](../BACKEND_LAUNCH_CHECKLIST.md): the product requirements and acceptance boundaries.
- [Generated backlog](jira-backlog.json): 123 stable source IDs, work types, phase/task dependencies and Now/Next/Later classification.
- [Verified issue map](jira-issue-map.json): source IDs → actual issue keys/parents/status snapshots, views and dependency pairs.
- [Append-only sync journal](jira-sync-journal.jsonl): confirmed creation/status/link operations saved after every successful write.

```powershell
node scripts/launch-backlog.mjs --write
node --test scripts/tests/launch-backlog.test.mjs
```

The generator performs no Jira writes. Before any later synchronization, search stable labels and reconcile the saved map with current Jira state. Preserve work types, parents and unrelated user edits. Do not recreate issues when only a status/scheduling update fails. One status transition timed out during this transfer; the existing issue KAN-74 was read back, then only its status was retried. The final readback confirms complete coverage without duplicate source IDs.

Historical D-083 transfer: 121 tasks plus 15 epics (136 items), with 30 phase links, verified at 15:25 UTC. That original artifact snapshot is preserved. D-084 appends confirmed writes to the journal and records a fresh 138-item readback separately; it does not rewrite the old verification result.

Earlier D-082 checks encountered a site-unavailable error. The founder's direct KAN link allowed the current project to be resolved and accessed successfully; that earlier blocker is superseded. Historical D-082 evidence/log bytes remain retained. No learner feedback, credentials, private prompts, payment records, cloud deployment or production-data changes are part of this Jira transfer.
