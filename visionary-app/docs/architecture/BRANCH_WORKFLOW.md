# Branches and agent delivery

17 October 2026 · D-093 · founder-authorized branch cleanup and parallel worker setup.

Visionary is a live-user product. Local implementation checks are one part of release evidence; they do not establish hosted readiness.

## Branch ownership

| Branch | Purpose | Working checkout |
| --- | --- | --- |
| `main` | Production release history; changes arrive through a reviewed release from `dev`. | No worker edits here. |
| `dev` | Shared integration branch; the current primary checkout stays here. | `C:/Users/Administrator/New_Visionary/visionary-app` |
| `codex/codex-tasks` | Codex's current task, reviewed before integration. | `C:/Users/Administrator/New_Visionary-worktrees/codex/visionary-app` |
| `codex/deepseek-tasks` | DeepSeek's current task, reviewed before integration. | `C:/Users/Administrator/New_Visionary-worktrees/deepseek/visionary-app` |
| `codex/founder-tasks` | The founder's current task, reviewed before integration. | `C:/Users/Administrator/New_Visionary-worktrees/founder/visionary-app` |

These are initial worker lanes, not task assignments or evidence that three tasks are ready. Use one active Jira task per lane. If more branches are needed, create a short-lived `codex/kan-<number>-<purpose>` branch from the current committed `dev`; record its worker and checkout in the issue. Do not share a checkout between active workers. Git worktrees share history but have independent files and indexes; uncommitted files in the primary checkout are not copied into worker checkouts. Ignored credentials and installed dependencies are not copied either.

After checkout, run `node scripts/verify-layout.mjs` and `node scripts/verify-imports.mjs` from the product directory. Byte-hashed import snapshots and patch evidence must retain their exact reviewed bytes across Windows/Linux checkouts; product `.gitattributes` disables normalization for those paths. The manifest-listed environment examples are placeholder templates, not live configuration. A check failure is investigated before accepting the baseline; never replace provenance hashes merely to make it pass.

```text
codex/codex-tasks   ─┐
codex/deepseek-tasks ├─ review + checks → dev → release acceptance → main
codex/founder-tasks ─┘
```

## Before starting a task

1. Confirm its current Jira prerequisites are accepted. An older calendar position is not authorization to ignore a blocker. Independent discovery may proceed only within an explicit boundary.
2. Record the Jira key, worker, branch, base commit, owned files/modules, shared contracts and acceptance criteria. A task can span frontend/API/database/ML when its scope requires it; worker ownership must still avoid concurrent edits to the same files.
3. Fetch `origin`. With a clean worker checkout and no unmerged task, fast-forward the worker branch to `origin/dev`. Stop on unexpected divergence; do not reset away work or force-push it.
4. Agree shared API, data and VATS interfaces before dependent implementations. Schema changes have one owner; review migration compatibility against other active work.

## Review and integration

D-095, 17 October 2026: the founder requires review and verification before any agent task is marked Done or the worker starts its next implementation task. Use the [review handoff template](delivery/TASK_REVIEW_TEMPLATE.md) and record the actual candidate commit, evidence and reviewer decision in Jira and [current execution receipts](tracking/task-executions.json). The implementer cannot approve their own implementation. A different agent or the founder must perform and record the review; do not manufacture approval or assign a reviewer without acceptance. Product/human acceptance gates still require their specified reviewer.

| Jira state | Entry/exit rule |
| --- | --- |
| To Do | Prerequisites, ownership and acceptance are checked before starting. |
| In Progress | Worker implements and checks one owned scope. Failed review returns here. |
| Testing | Candidate is committed and ready for separate review, relevant verification and integration checks. Pending review stays here even if local tests pass. |
| Done | Reviewer approves the exact candidate; relevant verification and accepted `dev` integration are recorded. Hosted evidence is required when the task's acceptance demands it. |

New code requires renewed approval/checks for the new candidate. Relevant `dev` changes, shared-contract changes or conflict resolutions require renewed integration review. The reviewer may also verify tests; author-run tests alone do not establish reviewer acceptance. An unresolved finding blocks Done.

The worker pushes committed changes to its own branch and supplies the Jira key, base/head commits, changed contracts/migrations, relevant test results, remaining gaps and environment evidence. Commit messages include the Jira key. Never commit credentials, production data or local environment files.

The integrator compares the branch against current `dev`, reviews changes, resolves overlapping contracts and runs the checks relevant to the affected components and integrated journey. Use a clean integration worktree or a clean primary checkout; do not merge into the primary checkout while its unrelated edits are unfinished. Merge accepted work into `dev` with a recorded task boundary, then push normally. Do not cherry-pick and merge the same task twice. A branch conflict is resolved and retested before integration.

After integration, the worker fetches and fast-forwards its clean branch to the accepted `origin/dev` before its next task. With ordinary merge commits, the reviewed worker head remains an ancestor of `dev`. If this fast-forward is impossible, inspect the history before proceeding. A separate per-ticket branch can instead be deleted after its integration is verified.

The integrator records the review decision, exact verified revision/environment, test evidence, integration commit and remaining linked gates, then transitions Jira to Done. Only then may that worker take its next implementation task. Check every prerequisite of dependent work; one accepted blocker does not clear all others. Independently owned tasks with accepted prerequisites may continue in parallel. This rule uses the existing Testing status; it does not install a Jira server transition validator, repository protection or CI enforcement. Calendar dates never move tasks automatically.

Mark implementation/review progress accurately in Jira. Mark the task Done only for its stated acceptance scope. A foundation enabler can complete with its defined evidence; a user-facing launch feature also needs its required hosted end-to-end evidence. Local tests, an opened pull request, a branch merge or a calendar date alone do not establish production readiness. Contract completion and actual model/educational acceptance remain distinct.

## Release and recovery

Only accepted scope moves from `dev` to `main` after the required hosted journeys, operational checks, migrations, rollback and production configuration are reviewed. Branch creation does not deploy the product. This setup does not configure server-enforced GitHub protection or CI; do not mistake these working rules for repository enforcement.

Before removing the five old remote branches, their exact references and all reachable history are retained in a verified local bundle at `artifacts/qa/branch-workflow-2026-10-17/before-cleanup.bundle`, with the original reference inventory in `before.json`. This ignored bundle stays local. Three old branches have commits outside both retained branches; none are silently merged into the product. Recovery uses the saved branch SHA from the inventory and `git fetch <absolute-bundle-path> <saved-SHA>`, followed by an explicitly chosen recovery branch. Keep this bundle until those histories have been reviewed or backed up elsewhere.

The existing delivery calendar assumed one founder and one coding agent. Two coding agents plus founder work require a dependency/ownership/capacity reforecast after tasks are assigned; creating worker branches does not shorten dates automatically.
