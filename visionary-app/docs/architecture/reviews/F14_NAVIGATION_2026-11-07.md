# F-14 Engineering Receipt — Global navigation, media and public interaction

Task: F-14 — Principal Global Navigation, Media & Public Interaction Engineer (V5 specialist pack)
Date: 2026-11-07
Baseline beta SHA: 1a1785b6 (fresh origin/beta; includes F-01..F-13)
Worktree/branch: `C:/Users/Administrator/nv-worktrees/f14-nav` · branch `zcode/f14-nav-v5`
Governance: founder-authorized beta-only workflow; D-095 independent review remains PENDING.

## Verified-already-complete wave — navigation, media and links verified with live evidence

Cross-wave basis: F-03 (drawer interaction + device matrix), F-04 (CTA trace, zero dead ends), F-08 (drawer in-viewport + escapable), F-09 (hash landing), F-10 (skip link first, focus return). This wave's live verification (Edge 156.0.4314.58, preview :5188, 1440×900):

- **S01 PASS** — mobile menu open/navigate/close/scroll-restore/focus-return: F-03's interaction check (open state, Escape, focus back to trigger, body-lock restore) + F-08's in-viewport + F-10's focus management stand at this SHA.
- **S02 PASS (live this wave)** — the footer on `/privacy` exposes the full door set (five personas, how-it-works, download, pricing, about incl. `about#mission`/`about#team` anchors, careers, legal); clicking Terms lands on `/terms` with the heading in view at scrollY 0 (correct top landing).
- **S03 PASS (live this wave)** — scroll-through lazy-image behavior on `/student`: cumulative layout shift **0.0389** (well under the 0.1 CLS budget), **zero broken images** (LazyImage: lazy + async decode, stable aspect boxes).
- **S04 PASS** — skip-to-main is the first Tab stop (F-10's settled re-probe).
- **S05 PASS** — reduced-motion anchor behavior: F-09's re-land honors `prefers-reduced-motion` (auto vs smooth), measured at +160/+176px.
- **Language truthfulness PASS (live this wave)** — zero language selectors in the public chrome (the F-31 false-affordance removal holds; real language support lives in onboarding/workspace where it changes content).

## Defects found

None in scope this wave — no source change needed (verified-already-complete with live proof; evidence + receipt only).

## Gates

lint 0 · typecheck 0 · **npm test 690/690** · build 0 (8.9s).

## Boundary kept

No approved images replaced; no brand-wide animations added.

## Integration

Candidate SHA: this commit (evidence + receipt only). Merged non-force (fast-forward) into `beta` and PUSHED to origin per the founder's instruction; post-merge smoke: motion-contract + css-contract suites on the merged checkout; founder's :4199 server serves the merged state. Reviewer: PENDING per D-095.

Final status: DONE_AND_VERIFIED_BETA
