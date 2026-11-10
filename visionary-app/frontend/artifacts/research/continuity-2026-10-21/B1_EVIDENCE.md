# B1 EVIDENCE — FAP-46 · the voice→type ladder on the landing surface (2026-10-21)

Worktree `gl-kan-201-b1-headline` seeded from `origin/beta` @ `b4cb8490`. Dev server `:5186`.
Scope: the six landing voices' sources (Landing + 5 persona routes + NewPersona + PersonaSections + PremiumPersonaSections) adopt the FAP-34 public type-role layer; every h1/h2/h3 declares its voice with `data-type`; every authored fluid `text-[clamp(...)]` and bridge-retag trigger leaves these sources; the landing cast hero's rotating audience line renders at ONE size per width (the user-reported size bug).

## 1. The hero one-voice law (bug fix)

**Diagnosis (measured live before the patch):** `NewPersona`'s fit effect scaled each rotating audience word individually — "for students." rendered 140px @1440 while "for professionals."/"for organizations." rendered ~127px @1440 and "for students." 64px vs ~44px @390. Words re-ranked by length inside one stage: the reported bug.

**Fix (`NewPersona.jsx`, one effect):** the rotating line's size is computed ONCE per width from the **widest** fragment (canvas `measureText` at the line's true computed font — `ctx.font` from `getComputedStyle`, `ctx.letterSpacing` when exposed) against `Math.min(980, copy.clientWidth)`; the result is held in `fittedPx` state so the per-word `key` remounts inherit one size; refit on `document.fonts.ready` + `ResizeObserver(copyRef)`. The line box stays `var(--fs-hero-headline) × 1.05`, so the stage never moves. Doc: `docs/visionary/design/VOICE_TYPE_LADDER_2026-10-21.md` hero row carries the law.

**Machine receipt (`b1-hero-voice-verify.mjs`, full cycle sampling, 49–50 samples/width):**

| width | before (per-word scale) | after (one voice) | words visible |
|---|---|---|---|
| 1440 | 140 / ~127 mixed | **117px** | all five (students…organizations) |
| 1024 | 96 (already fit) | **96px** | all five |
| 390 | 64 vs ~44 mixed | **41.5px** | all five |

All samples per width land on one font-size → PASS at all three widths. The h1 fingerprint itself is unchanged (fitted size lives on the span; the h1 keeps `var(--fs-hero-headline)`), and the eyebrow stays `var(--fs-hero-eyebrow)` — the h1:dt additions in §2 are marker-only.

## 2. BEFORE/AFTER fingerprint (`b1-typography-probe.mjs`, 18 route×width banks, diff via `b1-typography-diff.mjs`)

Changed-slot summary (fields dt/fs/fw/lh/ls/h across h1/h2/h3/p/pill):

- `h1:dt×18` — every hero h1 now declares `display` (cast/landing) or `product-section` (persona category statements). Marker-only; no size drift (the fit law above is span-level).
- `h2:dt×129, lh×108, ls×82, h×108` — all landing h2s adopt `section` (64/56/40 · lh 1.0625 · −0.009em · 600). The retag-covered `40px,5.55vw,80px` Premium h2s lose their class triggers with **zero rendered drift** (the bridge already computed them to `--fs-h2`); the uncovered gallery h2s (lh 1.0/1.08 authored) unify to 1.0625.
- `h3:dt×222 (+ fs×192/lh/ls)` — three voices adopted: `feature-heading` (drawer/intelligence beats → the 32px flat token), `feature` (accordion achievement h3s, intelligence-stage statement, persona category chips, suite tile labels — 28/24/21), `card-name` (journey tile stage label, exact 17px anatomy). Static-authored sizes (17/22/24/26px) leave the ladder's fixed values where they conflicted.
- `p:dt×51 (+fs×61/lh/ls)` — journey subs and Premium chapter subs (18px) → `body` (17px family); the landing problem quote (34→24px) → `editorial-lead`; PersonaSections quote lines (17–21px) → `body`.
- `card-name` swatch rows: fs stays 17, lh 1.2→1.1667, track −0.022em→+0.009em (the role's authored anatomy).

**Notable single receipts:**
- **Suite tile labels** (Landing `SUITE_TILES`, nine h3s: personas + Download/Pricing/Help/Updates) were rendered 17px by a bridge h3 retag masking their authored 22/24px; they now carry `feature` and render the ladder's card-statement tier (28/24/21) as intended.
- **`h2 + p` chapter-lead law (pre-existing)**: persona journey leads authored `text-[17.5px]` now render the pre-existing adjacent-sibling lead law (`--fs-lead` 24 flat · 1.1667 · +0.011em) as the *only* applicable rule; the before-state showed retag-class soup (17→21→24 across widths). B2's body census re-titrates this lead line to an explicit role; the after-state is the lawful chapter-intro composition ("statement → line → shot").
- **One wrap-count change**: teacher@1024 journey h2 "Your teaching stays yours." flips 1→2 balanced lines when tracking unifies (±0.28px pushes the 24ch line past the box). Composition-legal, receipted; text-balance keeps it even.
- `p[0]`/`p[4]` etc. drift detail: see `b1-typography-before.json` / `b1-typography-after.json` + `b1-typography-diff.mjs` output archived in the loop transcript.

## 3. Rendered role gate (`b1-type-roles.mjs`, 6 routes × 3 widths)

| route | before | after |
|---|---|---|
| home | unroled 13 · roles section×1 emphasis×1 feature×4 card-chapter×2 value-title×4 | **unroled 0** · display×1 section×4 emphasis×1 feature×13 card-chapter×2 value-title×4 |
| each persona | unroled 24 · retagHits 17 | **unroled 0** · product-section×1 section×9 feature-heading×8 card-name×2 value-title×3 feature×4 |

- The one non-obvious unroled heading ("Explore Visionary." on persona routes) was the `PremiumExploreSection` call-sites omitting `headingRole` — all five pinned to `section` (Landing pins its own at its call-site).
- Remaining `retagHits=8` on every route: `text-[13px]` carriers authored in **LandingNav/LandingFooter/breadcrumb sources — outside the 9-file B1 lock** (the gate counts rendered classes app-wide). Every retag trigger authored *inside* the locked sources is killed: both 13px in-scope sites (drawer numeral `L215`, media-well chip `L503`) are authored to their resting 14px; all clamp families and the 17.5px trigger classes left the locked sources. The 8 external floor sites are standing B2 census (numbers identical to the app-wide baseline, no regression).
- `residue=42/34` = the informational BODY_RESIDUE census (15/16.5/14.5/17/17.5px singles), explicitly B2 scope.
- The parent@1440 empty-sample probe flake from the before-bank did not recur (no gate retries exist; the fresh after run is the receipt).

## 4. Enforcement

- `eslint.config.js` scoped `no-restricted-syntax` over exactly the 9 locked sources — full `npm run lint` green.
- `tests/landing-type-roles.test.mjs` — 9/9 (regex now verifies quoted literals and passes `data-type={<expr>}` bindings through to the rendered gate).
- `text-[clamp(` census in the locked sources: **0** (Landing + 5 persona pages + NewPersona + PersonaSections + PremiumPersonaSections; grep-verified).

## 5. Gates

- `npm run lint` ✓ · `npm run typecheck` ✓ (both configs) · `npm run build` ✓ (2272 modules)
- `npm test` — first run 558/559: the only failure was the checked product-surface inventory (line-number drift from these very edits, no new/removed declarations — reviewed). `npm run scope:audit:write --prefix ..` refreshed it: **68 routes, connected 506 / preview 931 / missing 52 / intentionally-unreleased 154** (identical totals to A5) → rerun **559/559** ✓

## 6. Capture chain

18 AFTER jpegs (`captures/`) + 18 BEFORE preserved (`captures-before/`), same scripts/ports/settles. Human-eye passes: home@390 (hero one voice ~41.5px, eyebrow pair flat and composed, no clip), home@1440 (fitted 117px hero keeps 117≫56≫17 hierarchy; statement tiers unified), student@1440 (category 64 / journey 64 / drawer beats 32 tier-clean). Wide quiet bands in fullPage caps = the known reveal scroll-mount artifact, identical in the before bank.

## 7. Files touched

- `src/components/landing/NewPersona.jsx` — hero one-voice effect + two h1 markers
- `src/components/landing/persona/PersonaSections.jsx` — 8 sites (section/story/feature/display/body + chip 14px)
- `src/components/landing/persona/PremiumPersonaSections.jsx` — 13 sites (section/feature-heading/feature/body/card-name)
- `src/pages/Landing.jsx` — quote → editorial-lead; suite h3 → feature
- 5 persona route pages ×3 edits — journey h2 → section, sub → body, explore `headingRole="section"`
- `src/styles/*` — untouched (role layer/tokens/bridge already banked in FAP-34 + A5)
- `tests/landing-type-roles.test.mjs` — literal/dynamic data-type handling
- `docs/visionary/design/VOICE_TYPE_LADDER_2026-10-21.md` — hero one-voice law row
- artifacts: probe/diff/gate/capture scripts + before/after banks + this file

## 8. Hand-forwards

- B2 (FAP-47): uppercase kicker census; body residue (15/16.5/14.5/17/17.5px) + the `h2 + p` lead law titration; nav/footer/breadcrumb 13px floor sites (LandingNav ×5, LandingFooter, breadcrumb) — the retag hits the rendered gate still counts.
- B3 (FAP-48): Premium dark-scene anatomy pass (the `text-frost`/`accent-gradient-on-dark` family), LanguagePanel statement pitch (L551 now `feature` at 28 — verify against the final voice map with the founder).
- rgba channel-form leak (~397 hits) and box-shadow channel scans remain D-chain material.
