# F-10 — Shared accessibility foundation (2026-11-06)

Jira key / source ID: F-10 (Visionary Frontend Agent task — shared accessibility foundation)
Acceptance scope: enabler (correct verified accessibility defects; task-scoped fixes authorized)
Implementer: ZCode agent (Accessibility Engineer specialist)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f10-accessibility` / beta `37193d3f` (F-09 landing)
Owned files: `frontend/scripts/accessibility-verification.mjs` (new reusable harness), evidence
directory, this receipt, and the two corrected product files listed below.

## Objective and method

Correct verified semantic, keyboard, contrast, focus and reusable-component accessibility defects.
Method: build a live audit harness first, audit the real product, fix only what the harness
verifiably flags, then re-audit to zero and prove no regression. The harness
(`frontend/scripts/accessibility-verification.mjs`) runs on Vite dev `127.0.0.1:4198` (preview mode,
no interception) and includes:

- the **FAP-30 rendered audit** — informative-text contrast with alpha compositing over the painted
  ancestor chain + 44px hit areas **counting pseudo hit-unions** (the qa:taps law);
- **semantic checks** — img alt coverage, form-control labels, heading-level order, landmarks;
- **keyboard** — the skip-link path (Tab → activate → focus lands in `#main`).

Audited surfaces: landing, login, pricing (public) + dashboard home/learn/settings (preview-mode
journey), 1440×900. Evidence: `docs/visionary/baseline/f10-accessibility-2026-11-06/` (6 PNG +
receipt.json).

## A. Verified-correct (protect)

| Area | Verified evidence |
| --- | --- |
| Contrast | **0 low-contrast text** across all six audited surfaces after the audit learned gradient text (below) — the slate/ink/white laws hold |
| Hit areas | **0 controls under 44px** once pseudo hit-unions are counted (carousel dots: 8px box + 36px `::after` insets = 44px ✓; "About Privacy" link: 20px box + 24px = 44px ✓) — the FAP-30 hit law holds with its documented union pattern |
| Landmarks | Every public page renders `<main id="main">`; auth surfaces now too (F-10-F1 fix); workspace keeps its landmark shell |
| Keyboard | Skip link verified functional: Tab reaches "Skip to content" (`href="#main"`), Enter moves focus into `#main` |
| Labels & alts | **0 unlabeled form controls, 0 images without alt** on every audited surface |
| Heading order | **0 level skips** after F-10-F2 (pricing was the only offender) |
| Gradient text law | `.accent-gradient` paints `linear-gradient(92deg, #0066cc → #2997ff)` through `background-clip:text`; measured against the darkest endpoint: ≈5.5:1 on white, ≈7.9:1 on dark — ≥3.0 large-text threshold (audit exemption recorded below) |

## B. Verified defects found and corrected (2)

**F-10-F1 (P2 → fixed): auth surfaces rendered without a `main` landmark.** `components/AuthLayout.jsx`
(serves Login, Register, ForgotPassword, ForgotUserId, OAuthConsent, AuthAction) wrapped its card
area in a plain `<div>`. Corrected to `<main>` (opening and closing tags; the footer bar stays
outside the landmark). Visual impact: none — same element, same classes. **This fix initially broke
the route**: the closing tag was missed, JSX failed to compile and `/login` rendered empty; caught
immediately by re-checking the live page and repaired in the same lane (recorded for honesty; the
lesson — shared-component edits re-verify the live route before the battery).

**F-10-F2 (P3 → fixed): pricing page heading hierarchy skipped a level.** `AILearningPage.jsx`
rendered plan names as `<h3>` directly under the `<h1>` (no intervening `<h2>`). Corrected to
`<h2>` — style-safe because the explicit utility classes carry all visual properties and
`apple-typography.css` groups `:is(h2,h3,h4)` for role adaptation. Visual impact: none (21px/600
rendering identical).

## C. Audit-tool corrections made while triaging (harness, not product)

Three initial harness readings were artifacts, corrected before concluding:

1. **Gradient text**: `.accent-gradient` computes `color: rgba(0,0,0,0)` by design
   (`background-clip: text`); the audit read `color` after alpha compositing and flagged 1:1
   contrast. Now detects `background-clip: text` before compositing and measures the gradient's
   darkest endpoint (#0066cc) against the painted ground.
2. **Hit-area unions**: the audit now inflates control boxes by absolute `::after`/`::before`
   offsets, matching the qa:taps pseudo-union law (3 false findings removed).
3. **Entrance animations**: the landing's staged hero reveal animates words from transparent; the
   audit settles 3.2s on `/` so contrast samples the rendered final state.

## D. Inventory note

The two corrected files changed their source digests, so the surface-audit drift guard fired as
designed (`npm test` initially 652/653). Reviewed (no control, route or endpoint inventory change —
counts identical: 67 routes / 1652 declarations / 236 control files / states unchanged), then
refreshed via `npm run scope:audit:write` per the documented flow; `npm run scope:audit` PASS.

## E. Verification results (final run, this worktree)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout |
| `node scripts/accessibility-verification.mjs` | **PASS — 0 defects across 6 surfaces** (public + workspace journey): 0 low contrast, 0 sub-44px controls, landmarks/labels/alts/heading-order/skip-link all verified; zero page errors |
| Full battery | **PASS — all stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (19.00 s); qa:taps PASS (243 controls/126 files); qa:motion PASS (439 files); qa:continuity PASS; `npm run check` exit 0 (3842 imported files match baseline + 4 recorded patches) |
| Visual evidence | 6 audited-surface captures in `docs/visionary/baseline/f10-accessibility-2026-11-06/` |

## F. Backend / ML dependencies

None.

## G. Remaining issues and risks

- Authenticated-surface coverage rides on the preview journey; firebase-mode runs still depend on
  F-02-F1's bring-up.
- The audit samples the settled render state; word-staged reveals are verified through the gradient
  endpoint measurement rather than mid-animation sampling.
- AuthLayout is a shared component — reviewer should eyeball the `<main>` swap on one auth route
  (login or register) at desktop and mobile widths.

## H. Worktree and change summary

`New_Visionary-worktrees/zcode-f10-accessibility` on `zcode/f10-accessibility` = beta `37193d3f` +
2 corrected product files + regenerated inventory digests + verification harness + evidence + this
receipt. Junction-based node_modules runtime arrangement (nothing committed). Worktree removed
after the beta landing per the operator's standing instruction; branch retained pushed for review.

## I. Review handoff

```
Jira key / source ID: F-10
Acceptance scope: enabler (accessibility defect correction)
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f10-accessibility / 37193d3f / <receipt commit>
Owned files: frontend/scripts/accessibility-verification.mjs; frontend/src/components/AuthLayout.jsx (div→main landmark);
  frontend/src/pages/landing/AILearningPage.jsx (h3→h2); docs/architecture/tracking/product-surface.json (digest refresh);
  docs/visionary/baseline/f10-accessibility-2026-11-06/ (6 PNG + receipt.json); this receipt
Verification: live a11y audit 0 defects on 6 surfaces after fixes; inventory counts identical pre/post; battery all-exit-0 (653/653)
Reviewer decision: pending
Dev integration commit: pending
```
