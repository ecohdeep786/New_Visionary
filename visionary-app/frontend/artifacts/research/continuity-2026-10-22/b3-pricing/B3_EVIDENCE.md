# B3 EVIDENCE — FAP-48 · the pricing page to a store-grade table (2026-10-22)

Worktree `gl-kan-201-b3-pricing` (harness worktree) seeded from `origin/beta` @ `5339f1e5d84126661b4b933cae0ddc22eb0f0474` (the B2 tip). Dev server `:5190`. Route file: `src/pages/landing/AILearningPage.jsx` (renders `/pricing`).

## 1. Consulted and approved (founder, this session)

- **3 priced columns** — Start · Personal · Family as the store columns; Institution becomes a quiet full-width contact band under the table (matches its no-number nature).
- **Absorbed compare module** — the old separate 14px comparison table is deleted; the store table IS the comparison.
- Everything else surfaced in the proposal was spec-locked (28px price, 12px fine print, commerce-blue action per column, hairline-only, sticky headers, truth-correct copy, FAQ resolve curve, no overflow at the three AC widths, billing path untouched).

## 2. What shipped (one file + one accessory edit)

`AILearningPage.jsx` rewrite, sections kept elsewhere byte-identical:

- **Plan cards / compare section deleted** — the four white cards and the separate `03-compare` table leave the page; `PlanCard` and `PricingComparisonSection` sources are gone. The persona band, trust band, FAQ, and final CTA remain (trust band gains `data-section="03-trust"`; FAQ curve upgraded).
- **Store table** (single `<table data-b3="plan">`, hairline rows `rgba(18,19,23,0.12)`, no fills):
  - Sticky plan-header band (`sticky top-14`, bg-white, under the fixed h-14 nav): 21px/600/−0.009em name, ink chip *Most popular* on Personal, 14px tagline, the **28px/500/−0.022em** price (`formatPrice(plan, billing)` verbatim), the **12px fine print** composed from config fields only (`Billed yearly (₹2990) · 2 months free` / `Free forever · no card required` / `Per person` · `Per household`), and the **commerce-blue pill** (h-11, 17px/500/−0.011em, `#0066cc` → hover `#0071e3`, press-scale retained).
  - **Entitlement rows at 17px** — the 11 `COMPARISON` rows verbatim (fair-use vocabulary intact, no invented claims); booleans stay the ✓/– icons; feature label column `sticky left-0` when the table swipes.
  - **Institution band** — quiet, hairline-topped: 21px name, 14px tagline, the five config entitlements joined with ` · ` (17px), config fine print `Pricing shaped with you · pilots available`, and the blue `Contact Visionary` pill → `/contact`.
  - Foot fine print unchanged: `Prices in INR · Taxes may apply · Education discounts available` (12px).
- **Billing untouched** — the toggle is the same component and default (`annual`); CTAs route exactly as before: `/register?plan=start`, `billingPath(plan.id, billing)` for Personal/Family, `/contact` for Institution. Proven by the probe (annual/monthly switch changes prices, `billingHref` = `/dashboard/subscription?plan=personal&billing=annual` → `...&billing=monthly`).
- **FAQ** — same six `PRICING_FAQ` questions; the resolve curve aligned to the shared LandingFAQ law (`grid-rows` + `ease-google` `duration-500` + `visible/invisible` so the collapsed row leaves the a11y tree).

## 3. Render receipts (`b3-probes.mjs` after → `b3-probe-after.json`)

| probe | w1440 | w768 | w390 |
|---|---|---|---|
| page overflow (AC) | 0 | 0 | 0 |
| table columns / rows | 4 / 11 | 4 / 11 | 4 / 11 |
| price voice | 28px/500/−0.616px | ✓ | ✓ |
| fine print | 12px/18px, exact config strings | ✓ | ✓ |
| CTA pills | rgb(0,102,204), h44, 17px, 4× | ✓ | ✓ |
| sticky header at scroll | top = 56px (top-14 ✓) | wrapper-swipe mode | wrapper-swipe mode |
| pinned feature column | n/a (no scroll) | pinned ✓ (24→24 after 200px swipe) | ✓ |
| truth match vs `COMPARISON` | **match: true, 11/11** | ✓ | ✓ |
| billing switch | ₹0/₹249/₹415 ↔ ₹0/₹299/₹499 ✓ | | |

Before-state (`b3-probe-before.json`): overflow 0 at all widths (kept), entitlement rows at 14px (→ 17px), no sticky (`1782px` off), FAQ 300ms (→ 500ms resolve).

## 4. Gates

| gate | result |
|---|---|
| `npm run lint` | 0 errors |
| `npm run typecheck` | both projects pass |
| `npm test` | **609/609 pass** (after `npm run scope:audit:write` refreshed the inventory for the rewritten page: controlDeclarations 1668→1669, controlFiles 220, no new files) |
| `npm run build` | ✓ built in ~21s |
| uppercase lock | AILearningPage is inside the walkPublic `uppercase` scan — clean |

## 5. AC summary (FAP-48)

- **No overflow at 1440/768/390** — 0 overflow at every width; at 768/390 the table swipes inside its wrapper (page-level overflow 0).
- **Entitlement copy matches pricingConfig** — 11/11 row truth-match; fine prints and the Institution band are config-field compositions; nothing invented.
- **Billing path untouched** — toggle default, `billingPath()` routing and query strings identical (probe receipts both intervals).

## 6. Screenshots

- `b3-pricing-before-{1440,768,390}.png` — the card-era page (before).
- `b3-pricing-after-{1440,768,390}.png` — the store-grade table (after); the 1440 + 390 after captures were presented to the founder in the Review pane.

## 7. Hand-forwards

C1 persona-router card radius → token · C4 billing knob + email-input geometry · rgba channel-form leaks (~397) + box-shadow scans + premium dark-scene anatomy (D2) · LandingFAQ hero-variant clamp re-voice (parked: variant unadopted — verdict recorded in the ladder doc).
