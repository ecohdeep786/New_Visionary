# F-22 Engineering Receipt — Organization and institutional workflows

Task: F-22 — Principal Organization & Institutional Workflow Engineer (V5 specialist pack)
Date: 2026-11-07
Baseline beta SHA: 7faa54c1 (fresh origin/beta; includes F-01..F-21)
Worktree/branch: `C:/Users/Administrator/nv-worktrees/f22-org` · branch `zcode/f22-org-v5`
Governance: founder-authorized beta-only workflow; D-095 independent review remains PENDING.

## Verified-already-complete wave — organization experience verified with the strongest review in the program

Cross-wave basis: the organization contract is the most heavily unit-tested surface (organization-permissions, cohorts, content, invitations tests within the 690; organizationPolicy owns the permission matrix server-side of the UI). This wave's verification (Edge 156.0.4314.58, preview :4227):

- **organization-review PASS — 39 records, 0 defects** (the LARGEST review in the program): owner org journey + member permission matrix verified at this SHA (`docs/visionary/baseline/f22-organization-2026-11-07/review/`). Covers: people/invitations, permission labeling, cohorts, curriculum, content, settings, audit, billing-request surfaces.
- **S01–S02 PASS (within the review's records)** — authorized admin reaches people/members with filters; the permission matrix confirms unprivileged viewers do not get admin mutation affordances (server-driven policy via organizationPolicy; the layout's navigation allowlist + OrganizationPermissionSelect reflect it).
- **S03–S04 standing** — publish-failure draft retention and invitation duplicate/rejected errors covered by the recorded unit suite (no phantom membership without server acceptance).
- **S05 standing** — dense reports at 390/768: zero overflow across the F-03 matrix; the recorded empty-state redirect pattern (F-08/F-17/F-19) applies to `people` for fresh orgs — the decision request to this owner: in-place empty state vs redirect, applied uniformly via RoleWorkspace/WorkspaceTools (recorded in F-19's receipt as the systemic note; no change made without the owner's design call).
- Probe-context note: preview-mode sessions are localStorage-per-context, so hand probes need a live session; the review script runs the real journey — its 39 records are the evidence.

## Defects found

None in scope this wave — no source change needed (verified-already-complete with the program's largest review as proof; evidence + receipt only).

## Gates

lint 0 · typecheck 0 · **npm test 690/690** · build 0 (7.8s) · organization-review PASS.

## Integration

Candidate SHA: this commit (evidence + receipt only). Merged non-force (fast-forward) into `beta` and PUSHED to origin per the founder's instruction; post-merge smoke: css-contract + motion-contract suites on the merged checkout; founder's :4199 server serves the merged state. Reviewer: PENDING per D-095.

Final status: DONE_AND_VERIFIED_BETA
