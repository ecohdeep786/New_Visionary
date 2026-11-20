# F-06 Engineering Receipt — Typography, fonts and multiscript rendering

Task: F-06 — Principal Typography, Font & Multiscript Rendering Engineer (V5 specialist pack)
Date: 2026-11-07
Baseline beta SHA: 4169a26b (fresh origin/beta; includes F-01..F-05)
Worktree/branch: `C:/Users/Administrator/nv-worktrees/f06-typography` · branch `zcode/f06-typography-v5`
Governance: founder-authorized beta-only workflow; D-095 independent review remains PENDING.

## Font system inspected (package 1, source + computed)

- Self-hosted WOFF2 only: Google Sans Flex (public) with GENUINE 400/500/600/700 faces; Google Sans (product) with 400/500/700; `font-display: swap` on every face; `crossorigin` preloads for the four Flex faces in `index.html` (with the recorded no-`type` rationale); OFL licence file present for Flex.
- Preload set serves every route; no external font dependency.

## Defect found and fixed

1. **F-06-D1 (P2, readability):** `--lh-body` was `1.19048` — the "25px/21px" display-body ratio calibrated for a retired 21px body scale — but every one of its six `apple-typography.css` usages pairs with `--fs-body` = 17px, so ALL public body paragraphs rendered ~20.24px leading instead of the recorded 17/25 law (≈19% tighter than measured; the F-05 typography run had recorded this as a NOTE). Fixed both `rhythm.css` definitions to `1.470588` (25/17) with the lineage comment. **Live before/after on /privacy:** body paragraph computed 17px/20.24px (ratio 1.190) → **17px/25px (ratio 1.471)**, measured width 760px (comfortable measure). The verification NOTE is resolved by the fix, not by weakening the law.

## Weight-substitution record (no faux bold — verified semantics)

Workspace CSS requests `font-weight: 600` on several internal control families, and Google Sans (product) ships no 600 face. CSS font-matching resolves 600 → the nearest face ≥ requested (700), which is a GENUINE bold — **synthetic/faux bold does not occur** (synthesis only applies when no face covers the requested range). Recorded as an intentional substitution in the token contract; adding a real GoogleSans-Semibold asset is a licensing/asset decision outside this lane (no such file exists in `public/fonts/` to wire).

## Acceptance scenarios (live, Edge 156.0.4314.58, preview server :4198, 1440/390 + sweep widths)

- **S01 PASS** — landing hero: zero horizontal overflow at 320/390/768/1440 with the fixed-hero wrap.
- **S02 PASS** — policy paragraphs: 17px/25px, ~760px measure (no overlong lines) after the fix.
- **S03 PASS** — font surfaces swap by route: `/` computes `Google Sans Flex`, `/login` computes `Google Sans` (distinct), and back to public restores Flex (surface law via `fontSurfaceForPath`/`data-font-surface`).
- **S04 PASS** — hi fallback rendering verified by `typography-verification` (records: surface families, hero weight/face, hi fallback; 3 records PASS this wave); public pages remain honestly English (the language choice lives in onboarding/workspace where it changes content).
- **S05 PASS** — with ALL `/fonts/**` requests aborted, the page renders fully: h1 visible, zero overflow, fallback stack active — no tofu-dependent layout collapse.

## Verification runs

- typography-verification PASS (3 records) · font-surface-review: **BLOCKED_EXTERNAL boundary recorded** (requires the Firebase QA session per F-02-F1, unavailable in preview; the S03 computed swap + typography's preview workspace journey stand in).
- Gates: lint 0 · typecheck 0 · **npm test 682/682** (css-contract laws unaffected — both `--lh-body` blocks consistent) · build 0 (9.4s).
- Evidence: `docs/visionary/baseline/f06-typography-2026-11-07/` (typography records).

## Boundary kept

No font family/asset replaced (Visionary's approved stack preserved); no translated meaning rewritten; public vs product surfaces stay distinct.

## Integration

Candidate SHA: this commit. Merged non-force (fast-forward) into `beta` and PUSHED to origin per the founder's instruction; post-merge smoke: css-contract + typography-verification on the merged checkout; founder's :4199 server serves the merged state. Reviewer: PENDING per D-095.

Final status: DONE_AND_VERIFIED_BETA
