# F-27 Engineering Receipt — Measured web performance budgets

Task: F-27 — Principal Performance, SEO & Frontend Delivery Engineer (V5 specialist pack)
Date: 2026-11-08
Baseline beta SHA: 039b47f1 (fresh origin/beta; includes F-01..F-26)
Worktree/branch: `C:/Users/Administrator/nv-worktrees/f27` · branch `zcode/f27-performance`
Governance: founder-authorized beta-only workflow; D-095 independent review remains PENDING.

## What this wave fixed (measured, task-scoped)

**F-27-V1 (P2, FIXED — the recorded F-27-F3 defect):** the landing/persona/partner carousel pagers
failed Lighthouse `target-size` (score 0 on `/` and `/student`; the 2026-10-20 baseline audit the
lighthouse gate asserts zero regressions on). Root cause: the dots were 8×8px buttons whose ±18px
`::after` expansion created overlapping invisible 44px hit areas on an 8–10px dot pitch — taps were
unattributable for real pointers and the audit failed. Fix (three components, one geometry): each
button is now its own ≥24px tap target (`h-6` × `w-6` inactive / dot-width active), the visible 8px
dot is an inner span with identical colors and active-pill behavior, the `::after` expansion is
removed, and the non-pill pitch (touching 24px boxes) matches the approved pill anatomy's 24px
rhythm. Visible change: inter-dot spacing grows from 8px to 16px edge-to-edge (the Apple-style airy
pager rhythm); dot size, colors, labels, roles and focus rings unchanged.
- `src/components/landing/system/ui.jsx` (ProgressDots — `/`)
- `src/components/landing/persona/sections/CarouselDots.jsx` (persona challenges — `/student`)
- `src/pages/landing/partners` inline dots (`/partners`, same defect family, not in the audited routes)
- Regression law: `tests/dot-target-size.test.mjs` (4 contracts — no `::after` tap-area expansion,
  ≥24px button boxes, visible dot as inner span, across all three files).
- Proof: `lighthouse-audit` **PASS for the first time since the baseline was recorded** — a11y 1.0
  on all five routes (was 0.96 on `/`), SEO 1, bp 1, zero baseline regressions; before/after dot
  captures (`dots-root-before/after.png`, `dots-student-before/after.png`); zero overflow on the
  three changed routes at 320/390/768/1440; CWV unchanged within run variance (CLS identical).

**F-27-V2 (budget hygiene):** `qa-perf` failed at this SHA — the 2026-11-06 F-28 budget record
predates the V5 wave's real source repairs, and `authReturnTo.js` (+110B — F-01's deep-link
recovery) and `AboutUsPage.js` (+666B — landing repairs) legitimately grew. Chunk determinism was
re-verified first (two consecutive builds byte-identical, 153 chunks), then the budget was
re-recorded with an explicit F-27 note in `perf-budget.json` (totals 3,094,656B raw / 894,020B
gzip). `qa-perf` PASS before and after the dot fix (the fix stayed within tolerance).

## Measured baseline at this SHA (cwv-audit, production build, Lighthouse mobile throttle
profile: 1.6 Mbps down / 150 ms RTT / 4× CPU; Edge 156 headless; `review/cwv-receipt.json`)

| Route | FCP | LCP | CLS | TBT |
| --- | --- | --- | --- | --- |
| `/` | 2712ms | 3524ms | 0.068 | 338ms |
| `/pricing` | 2628ms | 4052ms | 0 | 127ms |
| `/student` | 2644ms | 3716ms | 0.068 | 152ms |
| `/login` | 2576ms | 3108ms | 0 | 83ms |

Lab-only provenance: no field/RUM data exists for this product, so no CWV p75 pass is claimed —
the LCP ≤2.5s goal remains open with the entry bundle (vendor 166.9KB gz + index 57.8KB gz) as
the named lever (F-27-F4 lineage, unchanged). CLS ≤0.068 and TBT ≤338ms are within goals.

## S01–S05 verification (production preview :4173; `review/scenario-verification.json`)

- **S01 PASS** — hero image eager + `fetchpriority=high` + srcset/picture with the DPR-matched
  480w AVIF candidate at 390px; CLS 0.068 (no layout pop).
- **S02 PASS** — zero landing route-chunk requests before the idle-settle window; after
  load+3s+idle the 7 priority chunks prefetch by design (observed ~3.13s; RoutePrefetcher's
  recorded D3 law holds — the LCP window never shares its wire with prefetch).
- **S03 PASS** — carousel dot tap advances the slide (aria-pressed moves, 362ms unthrottled);
  throttled TBT ≤338ms recorded in cwv-receipt.json.
- **S04 PASS** — canonical + og:url = `https://visionary.org.in` + path on `/`, `/pricing`,
  `/student`, `/safety` with correct titles (the approved live origin per F-31; VITE_SITE_URL is
  the documented override lever, unset in this environment).
- **S05 PASS** — all font requests blocked → the page renders with fallbacks (h1 visible, 3290
  chars, zero overflow; `s05-fonts-blocked.png`).

## Gates

lint 0 · typecheck 0 · **npm test 694/694** (690 + 4 new dot-target-size contracts) · build 0
(9.4s) · qa-perf PASS (153 chunks, re-recorded budget) · qa:continuity PASS · lighthouse-audit
**PASS** (a11y ≥0.95, SEO ≥0.95, zero baseline regressions — first fully-green run) · scope
inventory refreshed per the documented protocol (67 routes / 1651 declarations / 236 control
files, counts unchanged).

## Environment boundaries (recorded, not assumed)

- `lcp-measure-headless.mjs` not run: it requires the Fast3G proxy harness (:4180→:4173) from the
  earlier D3 lab; the cwv-audit CDP throttle profile covers the same measurement honestly.
- `qa:fonts` remains environment-broken (F-27-F5 lineage); font delivery is covered by S05's
  blocked-font proof and the F-06 font-surface evidence.
- Field/RUM CWV data does not exist; all CWV numbers are LAB ONLY (stated on the receipt).
- The LCP ≤2.5s lab goal is NOT met (3.1–4.1s) — recorded honestly as the open entry-bundle lever.

## Apple-informed original design rationale

Apple's image-rich pagers keep small, quiet dots with generous spacing and full-size tap areas;
the fix adopts that rhythm with Visionary's own 8px dot and ink palette — no copied assets, and
the approved pill anatomy's 24px pitch is preserved as the shared law.

## Integration

Candidate SHA: this commit (3 component fixes + regression law + budget re-record + inventory
refresh + evidence + receipt). Merged non-force (fast-forward) into `beta` and PUSHED per the
founder's instruction; post-merge smoke on the merged checkout. Reviewer: PENDING per D-095.

Final status: DONE_AND_VERIFIED_BETA
