# F-06 — Typography precision (2026-11-06)

Jira key / source ID: F-06 (Visionary Frontend Agent task — typography precision)
Acceptance scope: enabler (audit/verification; findings only, no product style changes)
Implementer: ZCode agent (Typography Engineer specialist)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f06-typography` / beta `6f680da4` (F-05 landing)
Owned files: `frontend/scripts/typography-verification.mjs` (new reusable harness), evidence
directory, this receipt. No source style/product file changed.

## Objective and method

Verify font loading, weights, sizes, line heights, wrapping, visual hierarchy and language
fallbacks on the real product. Two evidence streams, both produced this run against beta
`6f680da4`:

1. **Static law audit** — `tokens.css` @font-face set, `index.html` preloads, weight availability
   per surface family, `:lang` rules, wrapping and numeric-figure laws.
2. **Live rendered verification** — new harness `frontend/scripts/typography-verification.mjs`
   drives the product on Vite dev `127.0.0.1:4198` (preview mode, no interception): public landing
   at 1440/390 and a real register → OTP → onboarding → workspace journey switched to हिंदी through
   the product's own `/dashboard/personalization` selects. Computed styles, `document.fonts` state
   and screenshots captured in `docs/visionary/baseline/f06-typography-2026-11-06/` (+ receipt.json).

## A. Verified-correct (protect — these laws render exactly as recorded)

| Law (styles/README.md / tokens.css) | Verified computed evidence |
| --- | --- |
| Surface families | Public body = `"Google Sans Flex", sans-serif`; workspace = `"Google Sans", sans-serif`; `document.fonts` on `/` shows Google Sans faces **unloaded** (no cross-surface leak) |
| Fixed hero independence | Hero visible span resolves `var(--fs-hero-headline)` = **80/80, weight 600, family Google Sans Flex, text-wrap balance** — root-token driven, exactly the "fixed heroes keep independent values" contract |
| Type roles | `[data-type="editorial-lead"]` = **24/28 @600**, tracking +0.216px (law 24/28 600); content-section `display` h2 = **64/68 @600**, tracking −0.576px (−0.009em, law exact) |
| Face loading | Flex 400/500/600 **loaded** on `/`; Flex 700 unloaded (nothing requests 700 on the landing — efficient); `font-display: swap` everywhere; 4 preloaded TTFs are the first-paint faces |
| Content-alias scope | `Google Sans Flex Content` (genuine 600) binds only inside non-hero public content sections (apple-typography.css:753), heroes excluded — as documented |
| Workspace hierarchy | Workspace h1 36px/500/wrap-balance; font families never leak from `--font-product` |
| Wrapping | `text-wrap: balance` computed on landing headings and workspace titles; `tabular-nums` on numeric tables |
| Language laws fire | `lang` propagation: workspace root + 39 dashboard components; after switching to हिंदी via the product UI, Devanagari nodes carry `lang="hi"` and compute **line-height 28.9px at 17px = the `:lang(hi)` 1.7 law** (workspace.css:26) |
| Indic rendering | Full hi interface renders correctly (होम/संसेश/पूछें nav, "फिर स्वागत है, Alex!" heading, Guide panel) — screenshot evidence |

## B. Verified findings

**F-06-F1 (P2, body-role leading is tighter than the recorded law).** The README type-role table
records `body` = **17/25**; `rhythm.css` implements `--lh-body: 1.19048` whose own comment says
"Apple display body: **25px/21px**" — the 25/21 *display-body* ratio — so 17px body text computes
**line-height 20.24px** (17 × 1.19048), not 25px. Verified live on `/` inside the scoped role rule
(`apple-typography.css:694` sets `line-height: var(--lh-body) !important`). Affects every public
content-section paragraph; body copy renders ~19% tighter than the approved Apple-measured spec.
Note: the same ratio is correct for a 21px display-body role — the defect is the value/source
pairing for the 17px `body` role. Evidence: receipt `bodyLaw {lhVar:"1.19048", computedLineHeight:"20.2382px", computedFontSize:"17px"}`.

**F-06-F2 (P3, workspace weight-600 intent renders via the 700 face).** Static `Google Sans`
declares **400/500/700 only** (tokens.css; `public/fonts` has no Semibold file for the static
family), but workspace JSX/CSS request 600 (`font-semibold` in 12 dashboard/onboarding files, 19
instances + 10 `font-weight:600` CSS rules). CSS font matching resolves desired-600 to the loaded
700 face, so the semibold-vs-bold hierarchy distinction collapses in the workspace (verified live:
"Guide" label computed 600, no 600 face in the family set). Public pages are unaffected (Flex has
genuine 600; the Content alias serves content sections). Fix path exists and is documented in
tokens.css comments: bind the workspace surface to a 600-capable face (the `Google Sans Flex
Content` alias already self-hosts genuine 600) or add a static-Sans Semibold file — both change
workspace glyphs subtly and need founder before/after acceptance.

**F-06-F3 (P3, Indic glyphs render via OS fallback).** The self-hosted set is Latin-only; the
hi/bn laws set `font-family: var(--font-product)` (no Devanagari/Bengali glyphs) so scripts fall
through to the OS (Nirmala UI on Windows, etc.). Line-height and layout laws hold (1.7 verified),
but glyph style/metrics vary by device. Cross-device Indic identity needs self-hosted Noto Sans
Devanagari/Bengali subsets — a dependency for the F-04 D-01 font lane, not a standalone change.

**F-06-F4 (INFO, interface-translation boundary honestly labeled).** The personalization panel
states "Interface translation is being completed; unsupported labels remain in English"; after
switching, mixed en/hi labels coexist by design. The `qa:i18n` battery itself currently drives
`en` only (hi/bn switcher = recorded follow-up in that script).

## C. Acceptance criteria

| ID | Done when (measurable) |
| --- | --- |
| F-06-F1 | The `body` role computes 25px line-height at 17px inside the scoped public content sections (README table honored), or the README table is re-recorded with founder approval for the tighter value; before/after landing captures reviewed; `qa:continuity` + battery green |
| F-06-F2 | The workspace either binds a genuine-600 face (computed 600 maps to a real 600 `@font-face`) or documents 700-only mapping with founder acceptance; before/after workspace captures reviewed |
| F-06-F3 | Self-hosted Devanagari/Bengali subsets serve hi/bn runs (documented in tokens.css + loaded on hi surfaces) — fold into the F-04 D-01 font lane |
| F-06-F4 | hi/bn interface passes driven by the battery (switcher follow-up lands in `i18n-audit.mjs`) |

## D. Implementation order (none authorized in this lane)

| Order | Task | Covers | Depends on |
| --- | --- | --- | --- |
| **T1** | Body leading correction: set the `body` role to 25px at 17px (or re-record the law with founder approval); re-capture landing baseline before/after | F-06-F1 | founder visual acceptance |
| **T2** | Workspace 600 resolution: bind `--font-product` surfaces to the genuine-600 alias or add the static Semibold file; before/after workspace captures | F-06-F2 | founder visual acceptance |
| **T3** | Indic webfont subsets in the font lane | F-06-F3 | F-04 D-01 lane |
| **T4** | i18n battery switcher follow-up | F-06-F4 | F-02-F1 bring-up |

## E. Verification results (this run)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout |
| `node scripts/typography-verification.mjs` | **PASS** — 5 evidence records (landing 1440 + 390, hi workspace journey + 2 finding notes), zero page errors; evidence + receipt in `docs/visionary/baseline/f06-typography-2026-11-06/` |
| Full battery | **PASS — all stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (17.98 s); qa:taps PASS (243 controls/126 files; 3 recorded exceptions); qa:motion PASS (439 files); qa:continuity PASS; `npm run check` exit 0 (3842 imported files match baseline + 4 recorded patches) |
| Visual evidence | Landing desktop/mobile + hi-workspace desktop captures; F-03 baseline remains the accepted reference |

## F. Backend / ML dependencies

None. The Indic webfont task (F-06-F3) is a frontend asset lane folded into F-04 D-01.

## G. Remaining issues and risks

- F-02-F1 login bring-up still bounds authenticated rendered verification (the hi journey here ran
  in preview mode through the product's own locale switching).
- F-06-F1/F-06-F2 fixes change **approved-looking pixels** (the F-03 baseline shows today's
  rendering) — founder before/after acceptance is mandatory, same rule as F-05.
- The harness records the 600-mapping note from the `@font-face` set; `document.fonts.check()`
  reflects font matching, not file existence — tokens.css is the authority for face availability.

## H. Worktree and change summary

`New_Visionary-worktrees/zcode-f06-typography` on `zcode/f06-typography` = beta `6f680da4` +
verification harness + evidence + this receipt. Junction-based node_modules runtime arrangement
(nothing committed). Worktree removed after the beta landing per the operator's standing
instruction; branch retained pushed for review.

## I. Review handoff

```
Jira key / source ID: F-06
Acceptance scope: enabler (typography precision verification)
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f06-typography / 6f680da4 / <receipt commit>
Owned files: frontend/scripts/typography-verification.mjs; docs/visionary/baseline/f06-typography-2026-11-06/ (4 PNG + receipt.json); this receipt
Verification: live computed-style checks against the recorded law; battery all-exit-0; product on 4198 throughout
Findings: F-06-F1 (P2 body leading 17/20.24 vs law 17/25), F-06-F2 (P3 workspace 600->700 mapping), F-06-F3 (P3 Indic OS fallback), F-06-F4 (INFO)
Reviewer decision: pending
Dev integration commit: pending
Next dependent task: T1/T2 after founder before/after acceptance; T3 in the font lane
```
