# F-27 — Performance optimization (2026-11-06)

Jira key / source ID: F-27 (Visionary Frontend Agent task — performance optimization)
Acceptance scope: implementation lane (Web Performance Engineer) — two verified, task-scoped
bottleneck fixes plus the first real Core Web Vitals receipts for the product
Implementer: ZCode agent (Web Performance Engineer; lane completed by principal engineer)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f27-performance` / beta `b59c8a8e` (F-26 landing)
Owned files: `frontend/vite.config.js` (chunk pin), `frontend/public/fonts/*` (WOFF2 conversion),
`frontend/src/styles/tokens.css`, `frontend/index.html`,
`frontend/scripts/auth-font-handoff-review.mjs` (pinned font contract updated),
`frontend/scripts/cwv-audit.mjs` (new CWV measurement tool), `frontend/scripts/perf-budget.json`
(deterministic re-record), evidence directory, this receipt.

## Objective and method

Measure Core Web Vitals, bundles, rendering, fonts, images and route loading; fix verified
bottlenecks. Method:

1. **Bundle measurement** — `qa-perf.mjs` against the committed budget; the documented F-16-F4
   chunk flip was reproduced first-hand: three back-to-back builds of the identical source
   alternated 138 → 137 → 138 chunks (`organizationAuthorCopy` split vs merged into
   `OrganizationContent`), with matching budget re-records on every unrelated lane since F-16.
2. **CWV measurement** — Lighthouse 13's trace processor fails in this environment
   (`NO_NAVSTART` on the Edge channel — pre-existing: the FAP-31 receipts carry the same
   null-performance shape, which is why that gate records performance without metrics). New
   dependency-free `frontend/scripts/cwv-audit.mjs` measures the same lab conditions directly via
   Playwright CDP: Lighthouse's mobile throttle profile (1.6 Mbps down / 150 ms RTT / 4× CPU) with
   PerformanceObserver collection of FCP/LCP/CLS and long-task TBT per route.
3. **Fonts/images/route loading** — browser-level inspection of font transfers and preloads, the
   landing asset waterfall, and image loading attributes; the FAP-31 lighthouse gate re-run for
   the recorded a11y/SEO/baseline categories.

## A. Verified findings (this run)

| # | Finding | Severity | Evidence |
| --- | --- | --- | --- |
| F-27-F1 | **Chunk-assignment nondeterminism (F-16-F4) reproduced and root-caused**: identical source alternated 138/137 chunks across builds; `vite.config.js` carried a non-Vite option (`maxWorkersIncrease: 'max-memory'` — zero occurrences in the installed Vite 6.4.3 dist, silently ignored) next to the ambiguity. `organizationAuthorCopy` is statically imported by three dashboard editors, so Rollup's shared-module resolution flipped between a standalone chunk and a merge into `OrganizationContent` | P2 (fixed) | `/tmp` build logs ×5; qa-perf failure lines on both shapes across F-16..F-26 receipts |
| F-27-F2 | **Fonts shipped as uncompressed TTF — 6.2 MB total, and the login page fetched 2×1.9 MB faces** (`GoogleSans-Regular.ttf` 1,903,204 B + `GoogleSans-Medium.ttf` 1,906,032 B; the static family is the internal product stack per `tokens.css`, and the login page resolves to it). At the mobile throttle profile that is ~19 s of font transfer | P1 (fixed) | browser response capture (pre-fix), `public/fonts/` sizes, `dist/fonts/` listing |
| F-27-F3 | **Pre-existing lighthouse FAP-31 baseline regression on `/`**: `target-size` scores 0 on the landing carousel pager (`ProgressDots`) — its `::after` hit-areas extend ±18px onto `gap-2` (8px) dot spacing, so the invisible hit boxes **overlap**; Lighthouse (and real pointer input) cannot attribute those taps cleanly. Recorded, **not fixed here**: the compliant fix requires redesigning the approved shared pager component (literal ≥24px boxes with layout compensation) — a UI-scoped change outside this lane's preserve-approved-UI boundary | P2 (recorded) | `lighthouse-root.json` (score 0, two `button.relative` selectors), `ui.jsx:298-322` |
| F-27-F4 | LCP under the mobile throttle profile is 5.1–6.1 s pre-fix (3.3–5.3 s post-fix) — dominated by the initial SPA entry bundle (vendor 167 KB gz + index 57 KB gz) plus the LCP image; CLS (≤0.068) and TBT (<150 ms) are healthy. The landing waterfall is well split (13 JS files; hero images already eager + `fetchpriority=high`) | INFO (measured) | `cwv-receipt.json` pre/post, asset waterfall capture |
| F-27-F5 | `qa:fonts` (font-surface-review) is environment-broken on this host (legacy UI login against port 4197 fails in the built preview); font delivery was verified directly in the browser instead (all four Flex faces preloaded; product faces load on demand) | P3 (recorded) | script output; direct browser font inspection |

## B. Fixes implemented (task-scoped, evidence-backed)

1. **Deterministic chunk assignment** (`vite.config.js`): `organizationAuthorCopy` pinned to its
   own named chunk inside the existing `manualChunks` function (standalone is also the better
   shape: three editors import it, and a merged chunk would drag `OrganizationContent` along);
   the dead `maxWorkersIncrease` option removed. Verified: **five consecutive builds now produce
   a byte-identical chunk set** (135 chunks; identical hashes across builds). The
   deterministic graph is also leaner: totals 3,085,438 B raw / 877,487 B gzip vs the flip-era
   3,087,588/882,094 (−4,607 B gzip) — the ambiguity had been duplicating resolution. The
   fail-closed chunk budget no longer needs a per-lane re-record; `perf-budget.json` carries the
   deterministic record (F-27 note).
2. **WOFF2 font conversion** (`public/fonts/`): all seven faces converted from the recorded TTF
   sources with FontTools `ttLib.woff2 compress` (Brotli) — a lossless recompression (identical
   glyph outlines, name records and licensing metadata; rendering verified unchanged in the
   browser and by screenshot). Static Google Sans faces 1.90 MB → 450–509 KB each (−73–76%);
   Flex faces 118–129 KB → 31–35 KB (−73–74%). Shipped font weight **6.2 MB → 1.6 MB (−74%)**;
   the login page's font transfer **3.8 MB → 959 KB**. `tokens.css` (11 @font-face srcs),
   `index.html` (4 preloads) and the pinned `auth-font-handoff-review.mjs` contract updated to
   `.woff2`; the TTF sources removed from the deployed `public/fonts/` (they were copied verbatim
   into every dist); `public/fonts/README.md` records the conversion, the source pin and the
   regeneration recipe.
3. **CWV measurement tooling** (`scripts/cwv-audit.mjs`): records real throttled FCP/LCP/CLS/TBT
   per route into the evidence directory — the product's first working perf-metric receipts
   (FAP-31's perf column has been null since its 2026-10-30 recording).

## C. Verification results (this run)

| Check | Result |
| --- | --- |
| Chunk determinism | **5 consecutive builds byte-identical** (135 chunks, same hashes); qa:perf verify PASS without re-record churn |
| CWV improvement (same throttle profile, before → after) | `/` FCP 4896→3216 ms, **LCP 6104→5264 ms**; `/pricing` FCP 4344→2828, **LCP 5684→4208**; `/student` FCP 4552→2868, **LCP 5800→3800**; `/login` FCP 4620→2788, **LCP 5080→3320** — FCP **−35%**, LCP **−14…34%**; CLS unchanged (≤0.068); TBT ≤142 ms |
| Font rendering | Google Sans glyphs load from WOFF2 (`document.fonts.check` true; computed family unchanged); landing/login screenshots recorded (`perf-landing-woff2.png`, `perf-login-woff2.png`) |
| Full battery | **PASS — all 10 stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (deterministic); qa:perf PASS (135 chunks, F-27 record); qa:taps PASS (243/126, 3 exceptions); qa:motion PASS (439); qa:continuity PASS; `npm run check` exit 0 |
| Release gate | **RELEASE GATE PASS 5/5** on the F27 preview-mode dev server (F-24-F8 law) |
| Lighthouse FAP-31 categories | a11y 0.96–1.0, best-practices 1, SEO 1 across the five recorded routes; the target-size baseline assertion fails on `/` (F-27-F3, recorded) |

## D. Backend / ML dependencies

None. Both fixes are frontend build/asset scope. The remaining LCP lever (initial-entry-bundle
reduction — vendor splitting, route-level prerendering) is a larger program to be scoped with the
product lanes; no backend contract is required for it.

## E. Remaining issues and risks

- **F-27-F3 (P2)**: the landing carousel pager fails Lighthouse target-size (overlapping hit
  boxes); needs a UI-scoped fix lane with pixel-verified redesign of `ProgressDots`.
- LCP under throttled mobile remains >2.5 s (3.3–5.3 s) — the initial entry bundle is the named
  next lever (F-27-F4); the D3 ledger's fast-LCP wave stays open.
- `qa:fonts` needs repair against the current environment (F-27-F5); font delivery is verified by
  `cwv-audit.mjs` + browser inspection meanwhile.
- The static `Google Sans` WOFF2 faces are still ~0.9–0.5 MB each; if the product surface
  migrates to the Flex stack later, that transfer disappears — recorded as a design decision for
  the design lane, not taken here (approved rendering preserved).

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f27-performance` on `zcode/f27-performance` = beta `b59c8a8e` +
`vite.config.js` (chunk pin + dead option removal) + WOFF2 font conversion (7 new `.woff2`, 7
deleted `.ttf`, `tokens.css`, `index.html`, `auth-font-handoff-review.mjs`, fonts README) +
`scripts/cwv-audit.mjs` + `perf-budget.json` (deterministic F-27 record) + evidence + this
receipt. Junction-based node_modules runtime arrangement (nothing committed). Worktree removed
after the beta landing per the operator's standing instruction; branch retained pushed for
review.

## G. Review handoff

```
Jira key / source ID: F-27
Acceptance scope: implementation (performance optimization — two verified fixes + CWV receipts)
Implementer: ZCode agent (Web Performance Engineer; lane completed by principal engineer)
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f27-performance / b59c8a8e / <receipt commit>
Owned files: frontend/vite.config.js; frontend/public/fonts/ (WOFF2 conversion; TTFs removed; README provenance); frontend/src/styles/tokens.css; frontend/index.html; frontend/scripts/auth-font-handoff-review.mjs; frontend/scripts/cwv-audit.mjs; frontend/scripts/perf-budget.json; evidence dir; this receipt
Verification: 5 builds byte-identical (flip ended); CWV FCP -35% / LCP -14-34% under the mobile throttle profile; fonts -74% with identical rendering; battery all 10 stages exit 0 (653/653); RELEASE GATE PASS 5/5
Findings: F-27-F1 P2 fixed chunk nondeterminism (F-16-F4); F-27-F2 P1 fixed uncompressed TTF fonts (login 3.8MB -> 959KB); F-27-F3 P2 recorded lighthouse target-size regression on the landing pager (UI-scoped fix needed); F-27-F4 INFO LCP lever = entry bundle (next wave); F-27-F5 P3 qa:fonts environment-broken
Reviewer decision: pending
Dev integration commit: pending
```
