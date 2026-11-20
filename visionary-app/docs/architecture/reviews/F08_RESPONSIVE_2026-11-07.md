# F-08 Engineering Receipt — Responsive layout & adaptive device verification

Task: F-08 — Principal Responsive Layout & Adaptive Device Engineer (V5 specialist pack)
Date: 2026-11-07
Baseline beta SHA: d57477bf (fresh origin/beta; includes F-01..F-07)
Worktree/branch: `C:/Users/Administrator/nv-worktrees/f08-responsive` · branch `zcode/f08-responsive-v5`
Governance: founder-authorized beta-only workflow; D-095 independent review remains PENDING.

## Verification basis (no-change wave — the responsive layer verifies complete)

The strongest responsive evidence base already exists in this program: the F-03 device matrix measured **24 public routes × 9 widths (320/360/390/430/768/1024/1280/1440/1920) = 216 cells with zero horizontal overflow, zero broken images, zero blank mains, zero page errors**, plus landscape checks and the 5 interaction checks (mobile drawer with Escape/focus-return/scroll-lock, half-size-viewport zoom, reduced motion) — all PASS at F-03, re-runnable at any SHA. This wave verified the remaining F-08-specific scenarios live (Edge 156.0.4314.58, preview :4196, 390×844):

- **S01 PASS** — 320px primary CTA: zero global horizontal scroll on `/` at 320 (F-03 matrix cell + this wave's sweep); the "Start learning free" door renders in-view.
- **S02 PASS** — mobile drawer: opens in-viewport (`max-h[calc(100dvh-7rem)]` scrollable panel), Escape closes, focus returns to the trigger, body scroll locks/unlocks (F-03 interaction check, re-verified in responsive-verification's 9-record run).
- **S03 PASS** — dashboard at 390: mobile bottom-nav visible with safe-area padding (responsive-verification record: `bottomNav` facts), landscape 844×390 re-check keeps it in viewport; the five role journeys were captured at mobile in F-03.
- **S04 PASS** — tablet/landscape composition: landscape re-check in responsive-verification (9 records PASS) + F-03's landscape cells.
- **S05 PASS** — validation error path at 390: the login "Couldn't find your Visionary Account" error renders fully in-bounds (top 389 / right 332 of 390) with no body scroll trap; native HTML5 constraint bubbles handle invalid input formats (no DOM error = native UX, not a defect).
- **S06 recorded honestly** — a fresh organization account at 390 has NO member table: `/dashboard/people` redirects to `/dashboard/home` (empty-state product behavior, zero overflow, nothing clipped). The dense-data table case (populated members) cannot be populated without the product's invitation flow — recorded for F-22 (organization workflows owner) together with the empty-state-vs-empty-page design question.
- **400% zoom** = 1280/4 = 320 CSS px — the 320px matrix cells are the recorded evidence (zero overflow).
- **Safe-area**: `.safe-b` (env(safe-area-inset-bottom)) present on the drawer/bottom-nav (recorded in responsive-verification's bottomNav facts).

## Deliverables

- `docs/visionary/baseline/f08-responsive-2026-11-07/responsive/` — 9-record run: reflow facts, bottom-nav facts, dialog capture, landscape re-check (all PASS).
- This receipt's scenario table with the S06 boundary note for F-22.

## Gates

lint 0 · typecheck 0 · **npm test 686/686** · build 0 (14.3s) · responsive-verification PASS.

## Boundary kept

No controls hidden to satisfy overflow assertions; no i18n strings altered; no data-permission or product behavior change.

## Integration

Candidate SHA: this commit (evidence + receipt only; no product source change — verified-already-complete with live proof). Merged non-force (fast-forward) into `beta` and PUSHED to origin per the founder's instruction; post-merge smoke: css-contract + icon-a11y suites on the merged checkout; founder's :4199 server serves the merged state. Reviewer: PENDING per D-095.

Final status: DONE_AND_VERIFIED_BETA
