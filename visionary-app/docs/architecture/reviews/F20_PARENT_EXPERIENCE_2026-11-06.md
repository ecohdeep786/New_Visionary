# F-20 — Parent experience (2026-11-06)

Jira key / source ID: F-20 (Visionary Frontend Agent task — parent experience)
Acceptance scope: enabler (product + trust UI review; findings only — no product changes required)
Implementer: ZCode agent (Product + Trust UI Engineers)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f20-parent-experience` / beta `8a7ab2a1` (F-19 landing)
Owned files: `frontend/scripts/parent-review.mjs` (new reusable harness), evidence directory, this
receipt. No product source file changed.

## Objective and method

Review child connections, permission flows, progress, reports, notifications and privacy. New
harness `frontend/scripts/parent-review.mjs` drives the **complete two-account consent pair**
through real UIs on Vite dev `127.0.0.1:4198` (preview repository): a learner account registers
first; the parent account registers (guardian onboarding), requests progress sharing with the
learner's email; the learner accepts through their Connections surface; the parent then sees
"Connected · Progress summaries only" and opens the shared report; plus notifications and the
parent privacy surface. Sign-out uses real pointer clicks through the account menu (Radix menus
close on synthetic outside events). Evidence + receipt:
`docs/visionary/baseline/f20-parent-2026-11-06/` (8 PNG + receipt.json).

## A. Verified-correct (protect)

| Step | Verified state (live, two accounts) |
| --- | --- |
| Learner registered | Adult learner journey reaches the dashboard |
| Parent registered | Guardian onboarding (relation/board/class) reaches the dashboard |
| Connection request | Honest notice renders: "The learner's local account must accept before summaries appear. **This preview does not verify guardianship. Do not enter real child information.**"; the request creates a **pending** connection with a **7-day expiry** shown |
| Learner side | The pending request is visible on the learner's Connections surface with an Accept control; accepted → active |
| Parent side | "Connected · Progress summaries only" renders with the **View report** door + Ask-about-report + Stop sharing controls |
| Shared report | View report lands on `/dashboard/reports?child=…` — the consent-scoped progress summary |
| Notifications | "Family updates" surface renders |
| Privacy | "Privacy & consent" surface renders for the parent workspace |
| Status lifecycle | Source-verified full lifecycle: pending → active/declined → revoked/expired → restricted ("Summary access unavailable — Review sharing permissions") → renew ("The learner must accept it before a report is available") |

## B. Findings

**F-20-F1 (INFO, review methodology):** the consent pair requires two accounts in one preview
repository with real UI sign-in/sign-out between them; Radix menus require real pointer clicks
(synthetic outside events close them). Recorded so future harnesses model the pair correctly.

**F-20-F2 (INFO, trust framing verified):** the connection UI states the preview does not verify
guardianship and warns against real child information — the trust boundary is stated exactly where
the risk exists. The status lifecycle (including "restricted — Summary access unavailable" for
unreadable expiry) matches the source law.

**No new product defects.** No changes were needed or made.

## C. Verification results (this run)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout |
| `node scripts/parent-review.mjs` | **PASS** — 16 records, 9/9 consent-pair checks: request → pending+expiry → learner accept → connected+view-report → progress report → notifications → privacy; 0 page errors |
| Full battery | **PASS — all 11 stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (16.96 s); qa:perf PASS; qa:taps PASS; qa:motion PASS; qa:continuity PASS; `npm run check` exit 0 (3842 imported files match baseline + 4 recorded patches) |
| Release gate | **RELEASE GATE PASS 5/5** |
| Visual evidence | 8 captures: request form, pending, learner request view, connected, report, notifications, privacy |

## D. Backend / ML dependencies

None. The consent pair runs on the recorded local relationship law (7-day expiry, consent-scoped
progress summaries); real guardian verification remains the backend/trust lane's open gate.

## E. Remaining issues and risks

- The preview pair does not verify guardianship (stated on the surface) — real guardian/consent
  authority remains the backend/trust lane's open gate (recorded, not invented).
- F-02-F1 still bounds firebase-mode verification of the same flows.

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f20-parent-experience` on `zcode/f20-parent-experience` = beta
`8a7ab2a1` + review harness + evidence + this receipt. No product source change. Junction-based
node_modules runtime arrangement (nothing committed). Worktree removed after the beta landing per
the operator's standing instruction; branch retained pushed for review.

## G. Review handoff

```
Jira key / source ID: F-20
Acceptance scope: enabler (parent experience review)
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f20-parent-experience / 8a7ab2a1 / <receipt commit>
Owned files: frontend/scripts/parent-review.mjs; docs/visionary/baseline/f20-parent-2026-11-06/ (8 PNG + receipt.json); this receipt
Verification: 9/9 consent-pair checks PASS (two accounts, full request→accept→report lifecycle); battery all 11 stages exit 0
  (653/653); RELEASE GATE PASS 5/5
Findings: F-20-F1/F2 (INFO methodology + verified trust framing); no product changes
Reviewer decision: pending
Dev integration commit: pending
```
