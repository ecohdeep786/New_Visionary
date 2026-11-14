# F-08 — Responsive layout foundations (2026-11-06)

Jira key / source ID: F-08 (Visionary Frontend Agent task — responsive layout foundations)
Acceptance scope: enabler (audit/verification; findings only, no product changes)
Implementer: ZCode agent (Responsive Engineer specialist)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f08-responsive` / beta `0c3aa552` (F-07 landing)
Owned files: `frontend/scripts/responsive-verification.mjs` (new reusable harness), evidence
directory, this receipt. No source style/product file changed.

## Objective and method

Validate shared grids, breakpoints, mobile navigation, safe areas, zoom, tables and dialogs. Two
evidence streams against beta `0c3aa552`, both produced this run:

1. **Static audit** — viewport meta, safe-area laws, media-query inventory, table wrappers, dialog
   and shell viewport handling, mobile navigation implementations.
2. **Live rendered verification** — new harness `frontend/scripts/responsive-verification.mjs`
   drives the product on Vite dev `127.0.0.1:4198` (preview mode): public landing/login/pricing at
   **320px (WCAG 1.4.10 reflow proxy)** and 390px, then a real register → onboarding → workspace
   journey at 390 (bottom-nav scan, D-066 dialog capture, reflow) and **landscape 844×390**.
   Evidence + receipt: `docs/visionary/baseline/f08-responsive-2026-11-06/` (9 PNG + receipt.json).

## A. Verified-correct (protect)

| Area | Verified evidence |
| --- | --- |
| Reflow / zoom proxy | **Zero horizontal overflow at 320px** on landing, login and pricing (`scrollWidth == clientWidth` exactly); same at 390px; the 320px landing capture shows clean reflow (hero scales, persona tabs truncate without overflow). Rem-based type (styles/README contract) keeps browser text scaling lawful |
| Mobile navigation | Workspace bottom nav: fixed, 79px computed height at 390 (64px law + safe-area), 4 links with **min-h-12/min-w-12 (48px) targets**, `aria-label` + `aria-haspopup/controls/expanded` on "More", `md:hidden` (DashboardLayout.jsx:128); landscape 844×390 correctly switches to the desktop compact nav (F-03-F4 law) — nav height 0 in landscape is the md-breakpoint working as designed |
| Safe areas | `viewport-fit=cover` (index.html:5); `env(safe-area-inset-*)` padding in index.css:345/349, bottom nav (workspace.css:25), workspace scroll offset (workspace-design.css:595) — the notch/home-indicator path is wired end-to-end |
| Breakpoints | Apple-measured thresholds live in CSS (`max-width:1068px` ×3, `max-width:734px` ×4 — the measured reference points) alongside the Tailwind scale (640/768/1024/1280); a11y media present: `prefers-reduced-motion` ×9, `prefers-color-scheme` ×2, **`forced-colors: active` ×2** (Windows High Contrast) |
| Dialogs | Workspace dialogs bounded for mobile: `width: calc(100% - 32px); max-height: calc(100dvh - 32px); overflow-y:auto` (workspace.css:85); account menu `max-height: min(720px, calc(100dvh - 80px))`; D-066 welcome dialog captured at 390 and renders correctly (F-03 baseline concurs) |
| Viewport units | `dvh` in dynamic shells (guide shell, workspace offsets, onboarding `min-h-dvh`) — mobile browser-chrome-safe |
| Landing mobile menu | Drawer with Escape-close + focus return + body scroll lock (LandingNav/index.jsx:91-115) + safe-area padding — a11y-conscious |
| Grids | Public frame system documented (`public-frame` 1265/80px gutters, 980px editorial spine, 24px phone gutters); landing card grids per spec (4-up ≥1069 · 2-up ≥640); workspace `v-curated-grid` collapses `lg:grid-cols-3` → stacked |

## B. Verified findings

**F-08-F1 (P3, latent: 8 of 9 product table files lack an overflow wrapper).**
`BillingInvoice.jsx`, `DataDiagramRepresentation.jsx`, `GuideActivity.jsx`, `RoleMentorPanel.jsx`,
`teacher/tabs/KnowledgeHeatmap.jsx`, `RoleWorkspace.jsx`, `AILearningPage.jsx` (+ the `ui/table.jsx`
primitive) contain `<table>` without `overflow-x-auto`. **No live overflow was observed** — the
tested surfaces' tables fit at 320px and the dashboard home carries no wide table — but the guard
is missing wherever a future data column widens a table inside a mobile card. Latent-risk class,
not an observed defect. (`ui/table.jsx` consumers should get the wrapper at the composition site.)

**F-08-F2 (INFO, safe-area resolution is device-dependent by design).** On desktop Chrome
`env(safe-area-inset-bottom)` computes 0 (recorded `paddingBottom: 0px`); the law chain
(viewport-fit=cover → env()) is code-verified but physical notch evidence needs a device run —
recorded as the honest boundary of this lane.

## C. Acceptance criteria

| ID | Done when (measurable) |
| --- | --- |
| F-08-F1 | Every product `<table>` renders inside an `overflow-x-auto` composition (or a per-surface 320px check proves fit); re-run the harness at 320 on each table-bearing surface with zero overflow |
| F-08-F2 | A physical-device pass (iOS safe area, Android browser chrome) supplements the code-verified env() chain — recorded in a hosted/device acceptance lane |

## D. Implementation order (none authorized in this lane)

| Order | Task | Covers | Depends on |
| --- | --- | --- | --- |
| **T1** | Add `overflow-x-auto` compositions to the 8 table sites (mechanical, zero visual change on desktop) | F-08-F1 | — |
| **T2** | Physical-device safe-area pass | F-08-F2 | device availability (hosted/device lane) |

## E. Verification results (this run)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout |
| `node scripts/responsive-verification.mjs` | **PASS** — 9 evidence records; zero horizontal overflow at 320/390 public + workspace, landscape clean; bottom nav verified at 390 (79px, 48px targets); D-066 dialog captured at 390; zero page errors |
| Full battery | **PASS — all stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (18.31 s); qa:taps PASS (243 controls/126 files); qa:motion PASS (439 files); qa:continuity PASS; `npm run check` exit 0 (3842 imported files match baseline + 4 recorded patches) |
| Visual evidence | Landing/login/pricing at 320 + 390, dashboard mobile + landscape, welcome dialog — `docs/visionary/baseline/f08-responsive-2026-11-06/` |

## F. Backend / ML dependencies

None.

## G. Remaining issues and risks

- Table-bearing surfaces beyond the student journey (billing invoices, org/teacher data views) were
  not all driven authenticated in this lane (F-02-F1 bring-up still bounds authenticated runs);
  T1's wrapper guard makes them safe regardless.
- Physical safe-area behavior remains a device-lane item (F-08-F2).

## H. Worktree and change summary

`New_Visionary-worktrees/zcode-f08-responsive` on `zcode/f08-responsive` = beta `0c3aa552` +
verification harness + evidence + this receipt. Junction-based node_modules runtime arrangement
(nothing committed). Worktree removed after the beta landing per the operator's standing
instruction; branch retained pushed for review.

## I. Review handoff

```
Jira key / source ID: F-08
Acceptance scope: enabler (responsive layout foundations audit)
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f08-responsive / 0c3aa552 / <receipt commit>
Owned files: frontend/scripts/responsive-verification.mjs; docs/visionary/baseline/f08-responsive-2026-11-06/ (9 PNG + receipt.json); this receipt
Verification: 320px reflow proxy + 390 + landscape live checks (zero overflow), static laws audited; battery all-exit-0; product on 4198 throughout
Findings: F-08-F1 (P3 latent table wrappers), F-08-F2 (INFO device safe-area); foundations verified PASS (protect)
Reviewer decision: pending
Dev integration commit: pending
Next dependent task: T1 mechanical wrapper lane
```
