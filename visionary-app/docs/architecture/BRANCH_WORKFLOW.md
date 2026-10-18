# Task worktrees, QA and integration

18 October 2026 · D-098 founder instruction supersedes permanent agent-lane reuse. Keep `dev` for integration and `main` for accepted production history. Task checkouts are temporary; removing a worktree does not delete a branch or its pushed commits.

## Start a task from current dev

1. Check live Jira and [execution receipts](tracking/task-executions.json), the preceding task's accepted integration, all prerequisites and current file/contract ownership. Dated calendars are forecasts, not execution truth.
2. Fetch `origin` and verify the current accepted `origin/dev`. Create a fresh worktree under `<repository-root>/New_Visionary-worktrees/` named `<agent>-kan-<number>-<purpose>`, with branch `codex/<agent>-kan-<number>-<purpose>`. Each implementing or reviewing agent has its own task instance. Never start the next task by recycling a completed folder.
3. Record the agent, Jira key, purpose, branch, base SHA, exact absolute path, owned files/contracts and acceptance scope in Jira. Resume interrupted work only in the matching task instance; do not create conflicting owners.
4. Push the branch immediately and verify its remote ref. Install independent component dependencies from locks. Ignored local settings and credentials are not copied automatically. Run layout/import integrity checks before accepting the baseline.

```text
git fetch origin
git worktree add -b codex/deepseek-kan-30-api-contracts <verified-worker-root>/deepseek-kan-30-api-contracts origin/dev
git -C <task-worktree> push -u origin codex/deepseek-kan-30-api-contracts
```

The primary checkout remains on `dev`. Create a release checkout only when a release needs one. Do not merge over unrelated edits, reset away another worker's changes or force-push shared branches. Schema changes have one owner and reviewed compatibility with other tasks.

## Checkpoints and GitHub recovery

Inspect and stage intended paths, commit coherent work and push before handoff or stopping. Record the current commit, checks, findings and next step in Jira. Compare actual remote refs with HEAD; a local commit is not a successful GitHub backup.

GitHub stores pushed source commits/refs and appropriate evidence, not local worktree folders, uncommitted edits, dependencies or ignored settings. If connectivity breaks, keep local commits, record backup pending and verify the push after reconnection. Unpushed work blocks cleanup. Do not upload passwords, keys, sessions or protected user records. Preserve necessary local-only records/configuration outside a task folder before removal.

## The qa-review loop

| State | Required action |
| --- | --- |
| To Do | Verify prerequisites, ownership and the latest accepted dev before creating the task instance. |
| In Progress | Worker implements one owned scope and runs relevant developer checks. |
| Testing | Worker submits an exact SHA and [review handoff](delivery/TASK_REVIEW_TEMPLATE.md). qa-review independently checks code, criteria, commands/results, environment, recovery and remaining gates. |
| Changes requested | Return to In Progress; the worker fixes findings, commits a new candidate and submits it to qa-review again. Earlier approval does not cover later commits. |
| Done | Separate reviewer approval of the exact implementation, relevant verification, accepted/published dev integration and actual Jira transition are recorded. |

The implementer cannot approve their own implementation. QA evidence-only commits keep the implementation SHA explicit. A raw report saying “Done” is not proof of a native Jira transition. Founder/product decisions and hosted acceptance require their specified reviewers and evidence.

The integrator compares the approved candidate with current `dev`, resolves conflicts and runs relevant integration checks before publication. Integrate only approved scope; never include a later unreviewed head because an earlier SHA passed. Record actual integration and returned Jira status. Only then may the worker take its next task; dependent work still checks every prerequisite. Independent ready tasks can proceed in separately owned instances.

A scoped metric/source enabler may complete without completing model, domain, provider, privacy, commercial or hosted release gates. Local tests, dates, an opened PR or a merge alone do not establish production readiness. No automatic Jira transition validator, scheduler, continuous-backup service or branch protection is installed by this runbook.

## Remove a completed task instance

Verify actual Jira Done, exact-SHA QA acceptance, passed relevant checks, accepted commits in published `origin/dev`, and verified remote backup of intended source/review evidence. Inspect staged, unstaged, untracked and ignored files. Preserve needed local configuration and non-reproducible evidence outside the instance; dependencies can be recreated. An unpushed or unrelated unfinished change blocks ordinary cleanup.

From the primary checkout, resolve and verify the exact registered absolute task path beneath its intended worker root; refuse the primary checkout, unexpected junctions or another task. Use `git worktree remove <verified-absolute-task-path>`, inspect the result and `git worktree list --porcelain`. Do not force-delete unknown work or follow a cache junction outside the checkout. Retain published task refs by default. The next task gets a fresh instance from the latest verified dev.

D-098 additionally authorizes retiring existing extra checkouts. Two older desktop checkouts contained unsaved work: unreviewed GitHub archive snapshots plus byte-verified local ZIPs preserve it before removal. They are recovery evidence, not changes to merge into the product. The old `codex/codex-tasks` branch's unmerged commit is retained by GitHub tag `archive/codex-tasks-2026-10-18`; the obsolete branch is removed. Historical [D-093 bundle](../../artifacts/README.md) and append-only logs retain earlier checkpoints.

Only accepted scope moves from `dev` to `main` after the applicable release journeys, configuration, migrations, operational checks and rollback review. Git history changes do not deploy the product.
