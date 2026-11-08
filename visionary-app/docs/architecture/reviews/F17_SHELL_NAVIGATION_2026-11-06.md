# F-17 — Internal shell and navigation (2026-11-06)

Jira key / source ID: F-17 (Visionary Frontend Agent task — internal shell and navigation)
Acceptance scope: enabler (architect + UX review; findings only — no product changes required)
Implementer: ZCode agent (Architect + UX Engineer)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f17-shell-nav` / beta `35398beb` (F-16 landing)
Owned files: `frontend/scripts/shell-review.mjs` (new reusable harness), evidence directory, this
receipt. No product source file changed.

## Objective and method

Review dashboard layout, sidebar, topbar, workspace switching, role navigation and mobile
behavior. New harness `frontend/scripts/shell-review.mjs` drives the REAL journey on Vite dev
`127.0.0.1:4198` (preview repository): register → onboarding (student) → then **role-add through
the WorkspaceSwitcher's own dialog** for each of the four additional roles (teacher, organization,
professional, parent), verifying per role the rendered sidebar against
`lib/dashboardNavigation.js`'s recorded per-role allowlist, then switching back to the student
workspace, exercising the navigation allowlist guard, and opening the mobile More sheet at 390px on
the same authenticated session. Evidence + receipt:
`docs/visionary/baseline/f17-shell-2026-11-06/` (4 role-shell captures + More-sheet capture +
receipt.json).

## A. Verified-correct (protect)

| Area | Verified evidence |
| --- | --- |
| Role-add flow | The WorkspaceSwitcher's "Add a role" dialog adds each role through the product UI (no fixture seeding); the shell re-scopes immediately and lands on the new role's home |
| Role-scoped sidebars | Teacher: Home/Prepare/Classes/Learners/Insights + Ask/Teacher Growth/Library/Build secondary — all rendered as recorded; Organization: People/Cohorts/Curriculum/Insights; Professional: Learn/Ask/Practice/Build/Career; Parent: Children/Reports/Connections; Student: Learn/Ask/Practice/Build — every role's rendered sidebar matched `dashboardNavigation.js` |
| Role-scoped topbar | Teacher shell: "Personal · Teacher" switcher label, "Create a class" CTA, role-scoped search placeholder (capture `shell-teacher-desktop.png`); parent/professional/org CTAs per the connect law (probe artifact noted below) |
| Workspace switching | Switching back to the student workspace restores the student sidebar set; lastPath restoration is wired (`switchWorkspace` → navigate `lastPath || '/dashboard/home'`) |
| Navigation allowlist | `/dashboard/prepare` as a student **redirects to home** (`canAccessDashboardPath` guard live — role navigation law enforced) |
| Org policy | The topbar search filters destinations through `organizationPathAllowed` for organization workspaces (source verified; policy law unchanged) |
| Mobile behavior | The More sheet at 390px opens with the role-scoped link set (12 student links: primary + Classes/Connections + Progress/Notifications/Personalization/Privacy/Plans & usage); bottom nav carried from F-08 |

## B. Findings

**F-17-F1 (INFO, probe artifact):** the harness's topbar-CTA probe read the logo link
("isionary") instead of the role CTA — the CTAs themselves are verified in the F-03 captures
("Create a class"/"Add people"/"Set a career goal"/"Connect your child") and in this lane's role
shell screenshots. Not a product defect.

**F-17-F2 (INFO):** the desktop sidebar is hidden below the md breakpoint in favor of the bottom
nav + More sheet (F-08's verified law) — the same authenticated session resized to 390 switches
correctly.

**No new product defects.** No changes were needed or made — the shell scopes, switches and guards
exactly per the recorded laws.

## C. Verification results (this run)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout |
| `node scripts/shell-review.mjs` | **PASS** — 16 records: role-add ×4 through the real dialog, 5 role sidebars verified, switching verified, allowlist guard verified, More sheet verified; 0 page errors |
| Full battery | **PASS — all stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (18.24 s); qa:taps PASS; qa:motion PASS; qa:continuity PASS; `npm run check` exit 0 (3842 imported files match baseline + 4 recorded patches) |
| qa:perf + release gate | qa:perf re-recorded after the known F-16-F4 chunk flip (totals constant at 861 KB gzip — recorded for the law owner); **RELEASE GATE PASS 5/5** |
| Visual evidence | Teacher/organization/professional/parent shell captures + More-sheet capture |

## D. Backend / ML dependencies

None.

## E. Remaining issues and risks

- F-16-F4 (chunk nondeterminism) re-surfaced once this lane (same flip); the interim protocol
  (verify totals → re-record → verify) works and is documented in both receipts.
- Org-policy filtering is source-verified here; its full behavior rides on the organization
  permission law (backend authority unchanged).

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f17-shell-nav` on `zcode/f17-shell-nav` = beta `35398beb` + review
harness + evidence + this receipt + the F-16-F4 re-recorded perf budget (interim protocol). No
product source change. Junction-based node_modules runtime arrangement (nothing committed).
Worktree removed after the beta landing per the operator's standing instruction; branch retained
pushed for review.

## G. Review handoff

```
Jira key / source ID: F-17
Acceptance scope: enabler (internal shell & navigation review)
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f17-shell-nav / 35398beb / <receipt commit>
Owned files: frontend/scripts/shell-review.mjs; frontend/scripts/perf-budget.json (F-16-F4 interim re-record);
  docs/visionary/baseline/f17-shell-2026-11-06/ (5 PNG + receipt.json); this receipt
Verification: role-add ×4 + 5 role sidebars + switching + allowlist guard + More sheet verified live;
  battery all stages exit 0 (653/653); RELEASE GATE PASS 5/5
Findings: F-17-F1/F2 (INFO probe/methodology notes); no product changes
Reviewer decision: pending
Dev integration commit: pending
```
