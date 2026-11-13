# F-21 — Professional experience (2026-11-06)

Jira key / source ID: F-21 (Visionary Frontend Agent task — professional experience)
Acceptance scope: enabler (product + education review; findings only — no product changes required)
Implementer: ZCode agent (Product + Education Engineers); lane completed by the principal engineer
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f21-professional-experience` / beta `d95ebcc4` (F-20 landing)
Owned files: `frontend/scripts/professional-review.mjs` (new reusable harness), evidence directory,
this receipt. No product source file changed.

## Objective and method

Review the professional workspace: career direction workflow, skill-evidence honesty,
artifact/project building, portfolio boundaries and the progress surface. Harness
`frontend/scripts/professional-review.mjs` drives the real journey on Vite dev `127.0.0.1:4198`
(preview repository): registers a professional account through the UI (email → password → OTP →
onboarding "I am a Professional"), sets a career direction on `/dashboard/career`, saves it,
verifies the honest evidence state, opens the Build surface and artifact editor, re-checks the
portfolio framing on Career, and verifies the Progress surface. Evidence + receipt:
`docs/visionary/baseline/f21-professional-2026-11-06/` (5 PNG + receipt.json).

## A. Verified-correct (protect)

| Step | Verified state (live, professional account) |
| --- | --- |
| Professional onboarding | "I am a Professional" path reaches the dashboard with the professional workspace shell (Home / Learn / Ask / Practice / Build / Career + Workspace tools), topbar "Personal · Professional" — matches the F-17 role-scoped law |
| Career entry | `/dashboard/career` renders h1 "Your next capability" with the three-step framing "1. Set your direction · 2. Build skill evidence · 3. Show your work" and honest boundary copy (not a credential / stays in this workspace until you explicitly share / not connected) |
| Save a direction | Saving a capability target shows "Latest saved direction" with the saved title; the direction persists on the surface |
| Evidence honesty | The evidence surface is honest-empty ("No recorded check yet" / no invented skill gaps) — the `.v` evidence law holds with 0 fabricated checks |
| Build | `/dashboard/build` renders "Build something of your own" with the **New project** door opening an in-place artifact editor (textarea) |
| Portfolio boundary | After creating an artifact, the Career/portfolio review copy honestly states it is not an employer endorsement / is self-review / application evidence — not automatic mastery |
| Progress | `/dashboard/progress` renders "Your learning evidence" with an honest state (no invented achievements or mastery) |

## B. Findings

**F-21-F1 (INFO, review methodology):** a single professional account drives the whole career
surface in one preview repository; the professional role shell and topbar context ("Personal ·
Professional") come from the F-17 role law. Recorded so future org reviews reuse the same
registration + role path (the org review harness F-22 builds on this).

**F-21-F2 (INFO, environment, lane-completion note):** an initial re-run of the harness appeared
to fail intermittently (career/build surfaces rendering an empty routed region). Root cause was
environmental, not product: a stray backend `node --watch -r ts-node/register src/main-auth.ts`
process (leftover from a backend/auth lane; no listening ports) was pegging the host at ~100% CPU
and ~91% memory while Vite transformed on demand. The frontend preview uses local preview
authentication and does not depend on that process. After terminating the runaway, the harness
passed deterministically (12 records, 0 defects) and the release gate re-passed.

**F-21-F3 (INFO, gate artifact):** the earlier gate re-run in this worktree captured a flaky
cookies-page render (accessibility-spot "2 small controls"; controls 68 → 3 — an incomplete page
load, not a product change, since this lane changed no product source). Re-run on the recovered
machine: **RELEASE GATE PASS 5/5 — accessibility-spot 0 low-contrast, 0 small controls**. The
committed F-15 baseline record was left untouched (restored after verification).

**No new product defects.** No changes were needed or made.

## C. Verification results (this run)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout (worktree-served) |
| `node scripts/professional-review.mjs` | **PASS** — 12 records, 7/7 checks: career-entry, career-direction-saved, career-evidence-honest, build-entry, build-editor, portfolio-honest-boundary, progress-honest; 0 defects, 0 page errors |
| Full battery | **PASS — all 11 stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (1 m 39 s); qa:perf PASS (137 chunks, 3,087,230 B raw / 881,241 B gzip ≈ 861 KB — F-16-F4 interim re-record, totals stable); qa:taps PASS (243/126, 3 exceptions); qa:motion PASS (439 files); qa:continuity PASS; `npm run check` exit 0 (3842 imported files match baseline) |
| Release gate | **RELEASE GATE PASS 5/5** |
| Visual evidence | 5 captures: career entry, saved direction, build entry, build editor, progress |

## D. Backend / ML dependencies

None. The professional journey runs on the recorded local law (career direction is workspace-local
until explicitly shared; evidence and portfolio surfaces are honest self-review, no connected
model). Real credential/employer verification remains an open backend/trust gate (recorded, not
invented).

## E. Remaining issues and risks

- Career/portfolio are framed as self-review and application evidence — real employer/credential
  verification is the backend lane's open gate (recorded, not invented).
- The preview professional role cannot surface connected teaching/evidence until the ML/model lane
  connects.

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f21-professional-experience` on `zcode/f21-professional-experience`
= beta `d95ebcc4` + review harness + evidence + this receipt + the F-16-F4 interim re-record of
`frontend/scripts/perf-budget.json` (chunk-assignment churn only; totals stable). No product source
change. Junction-based
node_modules runtime arrangement (nothing committed). Worktree removed after the beta landing per
the operator's standing instruction; branch retained pushed for review.

## G. Review handoff

```
Jira key / source ID: F-21
Acceptance scope: enabler (professional experience review)
Implementer: ZCode agent (lane completed by principal engineer)
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f21-professional-experience / d95ebcc4 / <receipt commit>
Owned files: frontend/scripts/professional-review.mjs; docs/visionary/baseline/f21-professional-2026-11-06/ (5 PNG + receipt.json); this receipt
Verification: 7/7 professional checks PASS (career direction + evidence honesty + build editor + portfolio boundary + progress); battery all 11 stages exit 0 (653/653)
Findings: F-21-F1/F2/F3 (INFO methodology, environment, gate artifact); no product changes
Reviewer decision: pending
Dev integration commit: pending
```
