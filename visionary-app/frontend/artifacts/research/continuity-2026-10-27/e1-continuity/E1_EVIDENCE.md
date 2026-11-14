# E1 — Cross-page continuity evidence (FAP-E1)

Task: **FAP-E1 — E1 cross-page continuity QA: automated audit that same-page font/type roles resolve (no bridge fallback), no dual-ink values, link color single-source, CTA geometry equality across public pages at 1440; extends `npm run qa:continuity` and keeps it wired into `scripts/check.mjs`; failing cases fixed.**
Status: implementation + verification complete; **pending independent review per D-095** (the implementer cannot self-approve; the reviewer records the reviewed commit before Done). Board auth still 401 — the FAP-E1 jira key is created/backfilled on first re-login; nothing here depends on board writes.

## Acceptance gates + status

| Gate | Result |
| --- | --- |
| Same-page font/type roles resolve (no bridge fallback) | ✅ static law + rendered law both enforce product-family containment (`Google Sans Flex`; body roles legally use the `Google Sans Flex Content` member). Rendered: 0 unresolved stacks on 24/24 routes |
| No dual-ink values per role | ✅ roles keyed `(route, data-type, ground)`; ground = nearest painted ancestor bucketed dark/light, **gradient-aware** (reads `background-image` stops when `background-color` is transparent). Dark-ground frost staging is law-legal; no (route,type,ground) key carries two inks anywhere in the sweep |
| Link color single-source | ✅ static Law 7 (role map: base/hover `#0066cc,#0071e3`, active `#006edb`, focus-visible adds `#2997ff` dark-stage) passes full tree; rendered histogram recorded per route as census |
| CTA geometry equality across public pages at 1440 | ✅ recorded CTA class = `fs 17px · px 21px · h 44 · fw 500` (the `BUTTONS.geo` pill law): **52/52 rendered CTA-class pills across 24/24 routes carry the identical signature lh 19.992px (1.176) / ls −0.187px (−0.011em)** |
| Extends `qa:continuity`, wired into `check.mjs` | ✅ `frontend/scripts/qa-continuity.mjs` extended 4 → 7 laws; `scripts/check.mjs` L11–13 gates on it and L20 runs `continuity-law.test.mjs` (unchanged wiring, upgraded script) |
| Failing cases fixed | ✅ the ten-pill sweep (below) — every rendered drift cluster traced to source and fixed |

## Static law layer (7 laws, full-tree)

`qa:continuity` / `frontend/scripts/qa-continuity.mjs` — full tree pass (77 files, 0 violations); law tests `scripts/tests/continuity-law.test.mjs` **7/7**:

1. role-* fonts resolve to the product family (no bridge/system fallback stack on `[data-type]`)
2. role-* single ink per (page, type) class attribute
3. link-ink single-source (per-page-file; role map as above)
4. CTA pill geometry tokens (h‑44 / px‑21 / fs‑17 / `leading-[1.176]` / `tracking-[-0.011em]`) — pill class sites
5. CTA focus ring token (`#0066cc`)
6. icon-control-size-44px (single `2.75rem` definition point)
7. link-ink-single-source (Law 3's role-map formalization + page-file census)

## Rendered law harness (the new 1440 receipt)

`frontend/scripts/qa-continuity-render.mjs` — canonical 24-route D2 sweep universe at **1440×900@1** against the production build served on :4173. Protocol: progressive scroll to bottom in 0.9-viewport steps (mounts every lazy section, D2 parity), return to top, 700ms settle, then one probe pass.

Laws enforced on the rendered surface:
- **route-unreachable** — every canonical route serves and probes clean
- **cta-geometry-drift** — same-route, per-tone: all recorded-CTA-class pills identical in `h/br/fs/lh/ls/fw/px/pr/py`
- **cta-cross-page-drift** — cross-route, per-tone: the recorded class identical everywhere
- **role-font-unresolved** — every `[data-type]` computed family must contain the product family
- **role-dual-ink** — no two inks for one `(route, type, ground)` key
- linkInk histogram + pill census recorded per route (not policed; see honesty notes)

Final run receipt: `e1-continuity-render.json` (generatedAt 2026‑10‑28T03:23:54Z) — **violations: 0**; routes measured 24/24; pill census 1036 rows; grounds in use: light + dark.

## The pill sweep (failing cases → source fixes)

Pre-fix run decoded three competing leading regimes and two tracking regimes inside one recorded pill class. Root causes, per site:

| Site | Symptom (measured) | Cause | Fix |
| --- | --- | --- | --- |
| `system/ui.jsx` CtaPair primary pill ("Start learning free", hero CTAs on `/` + 5 personas) | lh 25.5px (font‑normal GSF) | A5 verbatim lift dropped `leading-[1.176]` | class added — `BUTTONS.geo` anatomy restored |
| `apple-typography.css` L511 text‑control clause `:is(button, input, textarea, select)` `!important` | button pills forced fs‑body / lh 1.294118 (22px) / ls `--track-body` (−0.022em → −0.374px) | clause captured pill **buttons** though its own doctrine (L426: *"Law-shaped CTAs (rounded-full pills) are exempt: the CTA tier owns their anatomy (A2 / FAP-42)"*) exempts pills everywhere else | `button:not([class*="rounded-full"])` — mirrors the link arm |
| `apple-typography.css` L792 `a[class*="bg-"]` clause `!important` | filled pill **anchors** forced `--lh-action` 1.176471 (20.0px) over their own `leading-[1.176]` | same doctrine gap, anchor arm | `:not([class*="rounded-full"])` added |
| `DownloadPage.jsx` ×6 ("Open Visionary", "See platforms", "Open in browser", ×5 coming‑soon, "Prepare email request", "Continue on web") | lh 25.5 / 20 / 22 + ls −0.374 mixes | pills without explicit leading, buttons additionally adapter‑captured | `leading-[1.176]` on all six pill classes (tracking already canonical) |
| `AILearningPage.jsx` (= the `/pricing` route, App.jsx) ×3 (plan CTAs "Start for free"/"Get Personal"/"Get Family", institution CTA, final "Get started") | lh 25.5 / 20 | same missing leading | `leading-[1.176]` ×3 |

Result: **one CTA (lh,ls) signature across the whole universe** — `19.992px / −0.187px` — 52/52.

## mysteryInk decoded (recorded, not excused)

Every route's rendered census carried a link ink `rgb(31,31,31)` (`#1f1f1f`) present in **no** source or build asset. Decoded live via stylesheet-rule enumeration + inheritance chain:

- source: `html, body { color: hsl(var(--foreground)) }` — the global shadcn‑style token reset (workspace design layer), `--foreground` resolving to `#1f1f1f`; the landing pages inherit it
- carriers: (a) the two **sr‑only skip links** (App.jsx + LandingNav) — invisible by design; their **focus palette is the law's own** (`focus:text-[#1d1d1f]` / `focus:bg-[#1d1d1f] focus:text-white`); the visible‑ink census now excludes sr‑only defaults; (b) the **logo anchor** — inert: `VisionaryLogo` paints explicit brand fills (`#1d1d1f`, `#9B9B9E`), never `currentColor`
- verdict: no visible surface lies; the inherited token is a platform‑boundary fact, recorded with `inkChain` evidence per route

## Honesty notes (scope + census)

- The E1 CTA geometry law governs the **recorded CTA pill class only** (`fs17/px21/h44`). All other pill‑shaped elements (chips/badges — the 1036‑row census includes 12px/14px/16px families) are **reported, not policed**; their per-route signature census lives in the receipt.
- `−0.022em` remains the recorded **text‑role** tracking (body copy spans in AILearningPage etc.) — the CTA pill law is `−0.011em` (`BUTTONS.geo`); the two tiers are distinct and both law‑true.
- `role-ladder-drift` (fs/fw per type across routes): **0 violations** — B1's type ladder holds everywhere.
- The rendered harness is an explicit run tool (`node scripts/qa-continuity-render.mjs`, needs a built dist + preview server), not part of `npm run check`; the check wiring gates on the static 7 laws.

## Verification receipts (this directory + runs)

| Receipt / check | Result |
| --- | --- |
| `e1-continuity-render.json` (final run) | 0 violations, 24/24 routes, 52/52 canonical CTA, grounds light+dark |
| `node scripts/qa-continuity.mjs` | "all recorded public-surface laws pass" |
| `node --test scripts/tests/continuity-law.test.mjs` | 7/7 pass |
| `eslint . --quiet` | exit 0 |
| `tsc -p ./jsconfig.json` | exit 0 |
| `tsc -p ./tsconfig.domain.json` | exit 0 |
| `vite build` | ✓ 2336 modules, green |

Process note: the working lane's toolchain hiccup (missing `.bin` shims after an interrupted `npm ci`) was bypassed via direct JS entrypoints (`node node_modules/vite/bin/vite.js`, `node node_modules/eslint/bin/eslint.js`, `node node_modules/typescript/bin/tsc`); `npm ci` later completed (661 packages) and shims are restored.
