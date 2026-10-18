# One task, one named worktree

18 October 2026 · D-097 · Applies to Codex, DeepSeek, the founder and qa-review. [Review/integration policy](../BRANCH_WORKFLOW.md) · [task handoff](TASK_REVIEW_TEMPLATE.md) · [checkpoint inventory](../tracking/agent-worktrees.json).

## Start or resume

1. Check live Jira, prior accepted integration, prerequisites and existing task ownership. Resume an interrupted task in its matching existing instance; do not create competing copies.
2. For a new task, fetch accepted `origin/dev` and create a **fresh** instance. Worktree folder: `<agent>-kan-<number>-<purpose>` under `<repository-root>/New_Visionary-worktrees/`. New branch: `codex/<agent>-kan-<number>-<purpose>`. Use lowercase names, for example `codex-kan-29-coverage-matrix`, `deepseek-kan-30-api-contracts`, `qa-review-kan-29-review`.
3. Record agent, Jira key, purpose, absolute worktree path, branch, base commit, owned files/contracts and acceptance in Jira. Install dependencies independently from component locks. Ignored local settings require explicit local setup.
4. Push the new branch immediately with upstream tracking. Verify the remote ref and record the GitHub branch link. One branch per task role; qa-review may use an isolated exact candidate checkout and an evidence branch, with the **implementation SHA** recorded separately from evidence-only commits.

Example commands run from the primary repository, substituting the recorded task names and verified paths:

```text
git fetch origin
git worktree add -b codex/deepseek-kan-30-api-contracts <worker-root>/deepseek-kan-30-api-contracts origin/dev
git -C <task-worktree> push -u origin codex/deepseek-kan-30-api-contracts
```

Existing KAN-29 retains its published `codex/kan-29-coverage-matrix` branch; its task folder supplies the owner/task identity. Old generic lanes are not templates to reuse. `dev` and the release checkout for `main` are persistent integration/release workspaces, not task instances.

## Checkpoint and recover

- Commit each coherent unit of intended source work and push it; do this before handoff, stopping or switching tasks. Inspect and stage explicit paths rather than blindly committing the whole checkout. Check secrets and protected learner records stay out of source and review artifacts.
- Check `git status --short --branch` and compare the actual remote task ref with the committed HEAD. A successful local commit is not a successful GitHub backup. Record unpushed commits/backup pending in the handoff when connectivity fails; push and verify after reconnection.
- GitHub stores **pushed commits and branch refs**, not local worktree folders, uncommitted edits, installed dependencies or ignored configuration. A fresh clone/worktree from the pushed task ref plus its component locks restores the source. A disconnection cannot upload new work; local commits retain it on the machine until a push succeeds.
- Keep restart notes in the Jira task: current commit, completed checks, next step and remaining findings. No passwords, API keys, session tokens or identifiable learner data in these notes. Required non-secret QA evidence must be committed/pushed on an evidence branch or attached to Jira before cleanup.

## Review, fix, integrate

Worker submits an exact candidate → qa-review tests/reviews → worker fixes findings on a new commit → qa-review rechecks → integrator verifies current `dev` compatibility and merges only approved scope → relevant integration checks → publish `dev` → confirm actual Jira Done.

A later unreviewed branch head is never included by an earlier approval. QA evidence-only commits do not change the recorded implementation candidate. Founder/product, hosted and operational acceptance remain required where the task scope calls for them. No automatic scheduler, remote transition validator or continuous backup service is configured by these commands.

## Remove the completed instance

Before removal, the integrator verifies all of the following:

1. Actual Jira Done, exact-SHA QA approval and passed relevant integration evidence.
2. Approved implementation is included in GitHub `dev`; intended task commits and required review evidence have verified remote refs or Jira attachments. An unpushed branch or failed push blocks cleanup.
3. No unrelated/unfinished task uses the folder. Inspect staged, unstaged, untracked **and ignored** files. Preserve required local configuration, secrets and non-reproducible evidence outside the task folder; dependencies can be recreated from locks. Do not upload secrets to satisfy backup.
4. Resolve the absolute task path and verify it is a registered task instance beneath the intended worker root. Refuse primary `dev`, `main`/release, another agent's task, unexpected symlinks/junctions or any path escaping the root. Run removal from the primary checkout, not from inside the target.
5. Use `git worktree remove <verified-absolute-task-path>`, then inspect `git worktree list --porcelain`. Do not use recursive shell deletion or force options to bypass unexpected changes or an open Windows handle. Preserve published task refs by default; branch deletion is separate from worktree cleanup.

KAN-28's approved `ec7bab9` is already in published `dev` and Jira Done. Its former generic worker/QA folders had been reused for unfinished KAN-29/KAN-137; those tasks were preserved in their own named instances. There is no active checkout assigned to KAN-28. This is a legacy migration, not permission to reuse a task folder next time.
