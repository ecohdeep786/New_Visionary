# A1 · Token convergence — evidence record (FAP-58)

**Task:** FAP-58 (Epic A / FAP-36) · **Branch:** `gl-kan-201-a1-tokens` from verified `origin/dev` `84a432ec`, forward-synced past A0 (`a1cc4040`) at `632a1dab`.
**Accepted by:** standing founder authorization.

## Scope executed

1. **Reference reconciliation (no duplication):** merged `gl/gl-kan-201-apple-type-scale` (FAP-34 accepted series `1cdea2dd…f1a7573b` + KAN-201 continuity pass `5ba7ce80`) onto dev at `deb198c3`. `product-surface.json` auto-merged clean.
2. **One law reconciliation:** hero fill weight `font-normal` (400) → `font-medium` (500, the CTA law's sanctioned fill weight recorded in `tokens.js` BUTTONS). Links remain 400 per law. Files: `src/components/landing/NewPersona.jsx` (hero primary pill).
3. **Source-hash manifest regenerated** (`npm run scope:audit:write`) after source edits.

## Verification (all self-run, all green)

| Check | Result |
| --- | --- |
| `eslint . --quiet` | ✅ clean |
| `tsc -p jsconfig.json && tsc -p tsconfig.domain.json` | ✅ both configs |
| `vite build` | ✅ 2271 modules, 35.8s |
| `npm test` (node --test) | ✅ **550/550** (×2 runs: post-merge, post-weight-fix) |
| scope:audit manifest | ✅ regenerated twice (post-merge, post-weight-fix) |

## Browser evidence (served at :5181 from this worktree, headless Edge)

- **After-captures:** 24/24 route@width (/converged surfaces: `/`, 5 persona pages, `/pricing`, `/download` × 1440/1024/390) in `a1-tokens-after/`, receipted in `a1-captures-receipt.json`.
- **CSSOM law probes** (`a1-probe.json` + in-session pill probe):
  - Ink fills (hero + nav pills): `44px` height, `17px` font, **weight 500** after fix, radius `9999px`, bg `rgb(29,29,31)`, padding `21px` — law-compliant.
  - **Google-blue elements on `/`: 0** (was 38 pre-KAN-201 on `66,133,244`).
  - Quiet links: 9 anchors at `rgb(0,102,204)`.
  - `data-type` roles on landing: 22.
- Probe `navCta` slot shows a 1px anchor — over-broad selector artifact, superseded by the targeted two-pill probe above (44/17/500/9999 on both ink fills).
- Self-feedback loop caught: the weight fix initially landed on the preserved KAN-201 worktree (session-relative edit path); restored that worktree pristine (`git status` clean, 0 dirty), re-applied in this worktree with absolute path, re-captured all 24 shots against the corrected state.

## Diff character (AC: value changes only, zero behavior change on nav/footer)

- tokens.js rewritten as single source + legacy alias keys retained; Landing/NewPersona/PremiumPersonaSections/LandingNav/LandingFooter/Coaching/DashboardCards/index.css/premium.css/tailwind.config converged; all hexes map into the measured Apple palette; containers/headline ladders via `data-type` roles; CTA law parametrized in tokens BUTTONS.
- Nav/footer behavior unchanged (glass bar, mega-sheet, drawer interaction code untouched).

## Baseline diff anchors for A2+

- `continuity-2026-10-21/baseline/` (A0) ↔ `a1-tokens-after/` for the 8 converged surfaces; remaining pages still show legacy blue/gray values — theirs is A3 (`FAP-43`).
- CTA weight now uniform 500 on every ink fill; A2 (`FAP-42`) hardens the law into DownloadPage/Pricing CTAs.
