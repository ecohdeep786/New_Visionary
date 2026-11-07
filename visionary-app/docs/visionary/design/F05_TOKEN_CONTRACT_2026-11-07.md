# F-05 Token Contract & CSS Ownership Map

F-05 (Principal Design Systems & Component Architecture Engineer) · 2026-11-07 · source beta `4bd9933a`
Companion to `frontend/src/styles/README.md` (font-surface law, unchanged). Verified with computed CSSOM evidence on the live preview (Edge 156.0.4314.58) and the new `tests/css-contract.test.mjs` (4 laws, all pass).

## 1. Authoritative homes (single-source law)

| Concern | Authoritative home | Law |
|---|---|---|
| Font families / surface pairing | `src/styles/tokens.css` | `--font-public` / `--font-product` / `--font-brand`; per `styles/README.md` — do not copy literal stacks |
| Public display scale & rhythm | `src/styles/rhythm.css` | `:root` base values + responsive `:root` steps inside `@media` (the recorded pattern: 5rem→4rem→2.75rem unified h1 law) |
| Public color/ink/controls | `src/styles/public-system.css` + `tokens.js` (law palette) | `qa:continuity` freezes the public palette (E1 law) + link-ink single source |
| Icons geometry | `src/styles/public-icons.css` | `--icon-control-size: 2.75rem` pinned (44px law) |
| Workspace type & outcomes | `workspace-typography.css`, `workspace-premium.css`, `workspace-outcomes.css` (imported via `workspace-design.css` → `DashboardLayout`) | internal only, scoped to `.visionary-workspace` |
| Product entry/error surfaces | `data-font-surface="product"` + `fontSurfaceForPath` | mapping in `src/lib/fontSurface.js` |
| Global reset/base | `src/index.css` | loads the shared/public styles in the recorded cascade order |

**Import order IS load order** (regression-enforced): `tokens → rhythm → public-system → public-bridge → premium → apple-typography → public-icons`. A reorder is a cascade change and needs explicit review.

## 2. Recorded intentional exceptions (do not "fix" these)

1. **Apple-measured content-section typography** (`rhythm.css` `#main:not(…):where(section:not([data-section="01-hero"])…)`) redefines display-tier tokens INCLUDING hero-named ones (`--fs-hero-headline: 8.75rem`) for editorial display heads inside non-hero content sections. This is scoped, measured and intentional (FAP-34 lineage); the hero itself computes the unified law (verified: 80px @1440, 44px @390). Renaming belongs to F-06 (typography owner), not this lane.
2. **Responsive `:root` steps**: the same token at different values inside different `@media` contexts is the pattern (not drift). The contract test enforces this distinction: same-media-context redefinition = defect; cross-media steps = law.
3. **`--v-*` workspace variables** (4 files) are per-surface theme scopes inside `.visionary-workspace` — not public token drift.

## 3. Defects fixed this wave

1. **F-05-D1 (P2):** `src/index.css` global `::selection` carried `background: #rgba(0,102,204,0.10)` — the invalid hex-prefixed functional value the A3 artifact law bans. F-31 fixed the `public-system.css` twin but missed this one because `qa:continuity` scans only the landing families; the global stylesheet had NO law, so the artifact survived two full battery runs. Fixed to the intended `rgba(0,102,204,0.10)`. **Computed-neutral** (the valid twin already won the cascade — CSSOM now shows both rules with the identical valid value), so this is a hygiene repair with zero visual change.
2. **F-05-D2 (P2, law gap):** new `tests/css-contract.test.mjs` closes the blind spot for EVERY stylesheet: no `#rgba(`-family artifacts; deterministic `index.css` import order; no same-media-context token redefinition; the unified-h1 responsive steps stay recorded.

## 4. Downstream ownership (F-06+)

- **F-06** owns type values/scales (may rename the Apple-section tokens); F-05 owns the token ARCHITECTURE and the cascade laws.
- **F-07** owns brand assets/icons (may adjust `public-icons.css` geometry within the 44px law).
- **F-08** owns responsive layout contracts (may add media steps following the recorded `:root` step pattern — cross-media only).
- **F-11+** own page content; they must NOT add raw hexes to public surfaces (E1 palette law) nor edit shared control primitives.
- Any new shared control primitive lands in `src/components/ui/` (workspace) or `src/components/landing/system/` (public) with hover/focus/disabled/loading states and passes the representative-surface runs below.

## 5. Verification receipts

- `tests/css-contract.test.mjs` — 4/4 (artifact law, cascade order, media-aware token conflicts, unified-h1 steps).
- Computed CSSOM: both `::selection` rules = `rgba(0, 102, 204, 0.1)` post-fix (before/after computed-neutral proof).
- Representative surfaces after the shared change: design-quality-review, typography-verification, responsive-verification (see F-04..F-05 receipt logs), plus the F-03 device matrix rerun capability for any future cascade change.
