# Frontend AGI — rebuilt task chain (start → end)

Rebuilt 2026-10-21 after a fresh live audit (`FRONTEND_PRODUCTION_AUDIT_2026-10-21.md`) and
live Apple measurement (`APPLE_MEASURED_REFERENCE_2026-10-21.md`). This replaces the stale
"retag until it looks right" sequencing with one dependency-ordered chain that lands every
public page on one system and then converges the product surfaces. Each task = one Jira
ticket, one worktree, one reviewable commit set. Branch prefix stays `gl-kan-*`.

Rules already binding per AGENTS.md still apply: fresh worktree from `origin/dev`, own
review before Done, no self-approval, evidence (screenshots/tests) recorded per task.

## Epic A — One public system (the "premium convergence" core)

### A0 · Baseline freeze (gate, no code)
- Audit docs recorded; measured reference recorded; screenshots of current state per page
  at 1440/1024/390 saved under `frontend/artifacts/research/continuity-<date>/`.
- **AC**: audit + reference docs merged; 60 baseline shots exist; no CSS/JSX changed.

### A1 · Token convergence: system/tokens.js becomes the only public palette (F1)
- Rewrite `color` to the measured system: `ink #1d1d1f`, `slate #6e6e73`, `muted #86868b`,
  `line #d2d2d7`, `ground #f5f5f7`, `surface #ffffff`, `link #0066cc`, `commerce #0071e3`
  (+hover/active), keep `deepBlue #0b57d0` only as chip/interactive legacy alias scheduled
  for deletion in A3. Move `radius` to media 12 / overlay 16 / pill 980. Add BUTTONS const
  (the five measured tones + geometry). Alias old keys so no importer breaks.
- **AC**: zero behavior change on navigation/footer; tokens diff shows only value changes;
  type roles untouched; lint/type/build green.

### A2 · CTA anatomy law (F2)
- Single `pills.scss`-equivalent: `Pill` (neutral fill), `PillAlpha`, `PillCommerce`
  (billing only), `TextLink` (+chevron). 44px min-height (44 mobile), 17px/1.176/-0.022em,
  500 on fills (sanctioned divergence), 400 on links, padding 11×21, radius 980.
- Apply to: NewPersona `HeroCtas`, PremiumPersona CTA section, LandingNav pills,
  DownloadPage, Pricing CTA column. Delete bespoke utility strings at those sites.
- **AC**: every public page primary CTA identical at 1440/768/390; screenshots row in
  artifacts; hover states = measured values.

### A3 · Hex sweep: retag 23 public pages to tokens.js (F1+F3+F9.1)
- Order: Landing.jsx → 5 persona pages → pricing/about/download → trust set (safety,
  privacy, terms, security, accessibility, cookies) → editorial set (careers, community,
  contact, partners, referral, research, updates) → help pair (school, coaching).
- Kill per-page `COLORS` objects; kill `max-w-[1265px]` and 41 other stray widths to
  container law (`--frame-x` + 1240/1400); kill off-law radii.
- Delete deprecated aliases from A1 at the end (single commit).
- **AC**: `grep -c '#[0-9a-fA-F]'` per page ≤ 5 (allowed: none besides tokens import);
  containers only from the law; page-by-page shots before/after.

### A4 · Retag debt burn-down (F4)
- Remove `public-bridge.css` entries for pages retaged in A3 (they no longer need
  rewriting); keep only entries still needed by unretagged surface (auth/onboarding until C1).
- **AC**: bridge.css shrinks per removed page; qa:fonts still green; no visual diff on
  retaged pages (screenshot diff = null).

### A5 · Activate `system/ui.jsx` (F5)
- Update primitives to A1/A2 law and make Landing + 5 persona pages consume them
  (SectionShell/Eyebrow/SectionHeading/SectionSub/PillButton/TextLink/TabBar).
- **AC**: ui.jsx imported by ≥6 pages; duplicate inline implementations deleted at those
  sites; visual diff limited to hairline radii corrections.

## Epic B — Copy + typographic voice to Apple standard (contentcontinuity)

### B1 · Voice-to-type mapping doc + enforcement
- One page maps each content role to `<h2 data-type="statement">` etc. Add ESLint rule /
  review checklist: every section uses `data-type` roles, not raw sizes.
- **AC**: roles exist on all landing sections; bridge fallbacks no longer triggered there.

### B2 · Copy refresh under type law (copy owner pairs with frontend)
- Sentence case eyebrows; kill `UPPERCASE` kickers in source; headline spans drop blue
  (`problem`, persona heroes) → ink/gradient only in the one dark intelligence moment;
  quote/caption pattern per measured ladder; every module ends with a door.
- **AC**: no `uppercase` kickers on public pages; blue in headlines = 0; copy reviewed by
  product owner; screenshots.

### B3 · Pricing page to store-grade table
- 3-column plan table, hairline-only, sticky column headers, 28px price, 12px fine,
  commerce-blue "Start free" per column, truth-correct entitlement copy, comparison rows in
  17px; FAQ accordion to Apple resolve curve.
- **AC**: qa at 1440/768/390 shows no overflow; entitlement copy matches
  pricingConfig; billing path untouched.

## Epic C — Product-surface convergence (auth → onboarding → app shell)

### C1 · Auth to the one system (F6)
- AuthLayout: `#f5f5f7` canvas, white 28px card, product font stays, ink pill primary,
  link `#0066cc`, error system red `#e30000`, remove dead "coming soon" submits (hide mobile
  sign-in options entirely until real).
- **AC**: Login/Register/Forgot flow screenshots; dead flows render as NULL choices;
  auth-emulator-review passes; fonts review green.

### C2 · Onboarding pass
- Same canvas/card; step labels ≥12px; controls 44px; continue pill = ink;
  product-onboarding css folded into one sheet.
- **AC**: full onboarding sweep at 3 widths; 10px labels gone; tests green.

### C3 · Dashboard v-token completion (F7)
- Retire leaked Material: `#4285F4`→`--v-action`, `#dadce0`→`--v-border` in Ask, Build,
  StudentClasses, Subscription, Settings, RoleWorkspace, Guide. Subscription.jsx to v-cards.
  Decide action blue `#0071e3` vs `#0b57d2` once — recording the decision in DECISIONS.
- **AC**: grep shows 0 raw hex for those two values in those files; qa:design +
  qa:navigation green dark+light ×320/390/768/1440.

### C4 · Forms delivery honesty (F8) — pairs with backend intake task
- Partners enquiry + Updates signup either ship real delivery or render as "Plan released
  later" state per PRODUCT_SURFACE_AUDIT semantics; Download "coming soon" buttons become
  disabled-with-reason or removed.
- **AC**: surface audit flags flip to `connected` or `intentionally-unreleased` with
  receipts; no lying affordances.

## Epic D — Premium motion + responsive hardening

### D1 · One motion law
- `--ease-out-apple` resolve curve + duration scale only; scroll-driven statement reveals
  on hero/proof modules; reduced-motion = static-and-visible; no bounce.
- **AC**: motion audit script (new) fails on non-curve transitions; reduced-motion sweep ok.

### D2 · Responsive + tap targets
- Kill h9/h10 (<44px) controls on all public pages; onboarding labels ≥12px; hero stacks
  at 390 verified; 200% font sweep re-run.
- **AC**: full public sweep ×320/390/768/1024/1440 no overflow; tap-target audit 100% ≥44px.

### D3 · Performance + image law
- Hero art AVIF/WebP with measured density; `LazyImage` everywhere; bundle split of
  monoliths (F10) into per-section modules; LCP <2.5s on Fast3G landing.
- **AC**: vite build budget recorded; LCP pass recorded.

## Epic E — Verification + closeout

### E1 · Cross-page continuity QA (new script)
- Automated: same-page roles loaded, no dual-ink values, link color single-source, CTA
  geometry equality across pages at 1440; runs in `npm run qa:continuity`.
- **AC**: script exists, is in check pipeline, failing cases fixed.

### E2 · Review + release evidence
- Reviewer (not author) records reviewed SHAs; integration evidence into
  docs/architecture/delivery per template; Jira per-task receipts; Founder walkthrough of
  landing → pricing → download → trust → auth → dashboard path.
- **AC**: every task Done with acceptance evidence; audit doc updated to "production-ready".

## Dependency graph (start → end)

A0 → A1 → A2 → {A3 → A4*, A5} → B1 → {B2, B3} → C1 → C2 → C3 → C4 → D1 → D2 → D3 → E1 → E2
(A4 can run per-page while A3 continues; B tasks may start after A1 and track A3 pages.)

## What is deliberately NOT in this rebuild

- Backend/ML implementation of Ask/Guide adapters (separate board — surface honesty only).
- Localization content (22-language expansion is its own program; this chain only
  constrains type roles to support the Indic floor that already exists).
- New marketing pages or features — zero net-new scope.
