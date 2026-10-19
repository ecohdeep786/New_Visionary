# D-095 documentation and review workflow handoff

17 October 2026. Implementer: Codex. Branch: `codex/codex-tasks`. Base: `b829922d2d9250719ea71d70ed6f710e175cf27d`. Candidate: the committed branch head submitted with the Jira review comment; review that exact SHA before accepting. **Reviewer: unassigned. Decision: pending.** This handoff is a review deliverable, not a fourth status log or evidence of its own acceptance.

## Scope to inspect

- [Documentation entry](../../README.md), [architecture index](../README.md) and [product index](../../visionary/README.md) now separate contract, implementation, target design, planning and dated evidence.
- Six architecture reviews moved into [reviews](../reviews/README.md); thirteen internal design documents moved into [design](../../visionary/design/README.md). [Move hashes](../tracking/document-moves-2026-10-17.json) record byte-preserving moves followed by relative-link adjustments. Old paths contain compatibility pointers for existing Jira/generator/log references. Generated outputs and source scripts stay at stable paths.
- [Workflow](../BRANCH_WORKFLOW.md), [review template](TASK_REVIEW_TEMPLATE.md), root agent instructions and the agent protocol require a reviewer separate from the implementer, exact revisions, relevant verification and accepted integration before Done. Each worker waits for acceptance before their next implementation task; dependent work also checks all prerequisites.
- [Current execution receipt](../tracking/task-executions.json) records KAN-28 Testing, native transition41/comment10004, pending review and retained D-094 closure/test history. Current status/Jira pointers distinguish that history from the new state. Other tickets and full-board/calendar snapshots are unchanged.

Frontend/API/backend/data/ML/cache/socket runtime changes: **N/A**, documentation organization and delivery policy only. No credentials, cloud resource, model call, database migration or hosted release is part of this change. Operative contracts and protected public-team documents are excluded. Only new entries are appended to STATUS/DECISIONS/QA.

## Verification for the reviewer

Inspect the changed files against the base, then check the retained evidence in ignored `artifacts/qa/docs-organization-2026-10-17/`. The final QA entry records actual results. Re-run relevant checks for the exact submitted candidate, especially if another worker or integrator changes it.

```powershell
git diff b829922d2d9250719ea71d70ed6f710e175cf27d...codex/codex-tasks -- visionary-app/docs visionary-app/AGENTS.md visionary-app/README.md
node scripts/verify-layout.mjs
node scripts/verify-imports.mjs
npm run scope:audit
node --test scripts/tests/feature-delivery.test.mjs scripts/tests/vats-delivery.test.mjs scripts/tests/education-launch.test.mjs scripts/tests/delivery-schedule.test.mjs
```

Review the source-audit implementation separately for [KAN-28](https://visionary-team.atlassian.net/browse/KAN-28): commits `593f2a210fd51d08b9859803d9e1cdf1b3a70c7d` and `36933dfedb33822feeded5254bf78a988984e46d`, included in candidate base `b829922d2d9250719ea71d70ed6f710e175cf27d`. Its earlier recorded 532 frontend/18 script tests do not constitute independent reviewer approval or hosted acceptance. Documentation review alone cannot close the source-audit task.

Record actual reviewer identity, exact reviewed commit, findings and approval/changes requested using the template. The integrator then verifies current `dev` compatibility and relevant checks before integration, records its commit/evidence, and updates the appropriate Jira scope. New review findings require correction and re-review. This branch is not self-approved for `dev`/`main` promotion. Existing commits already in those branches are retained; the focused Testing transition does not rewind Git history.

Server-enforced Jira transition rules and GitHub branch protection are **not configured by this change**. Agents/integrator follow the policy; do not describe it as an automatic control over other Jira clients.
