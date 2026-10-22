# A5 — Activate `system/ui.jsx` + token retirement (FAP-45)

**Task:** Update the landing-system primitives to the A1/A2 law and make Landing + the five persona pages consume them; delete the duplicate inline implementations at those sites; retire the deprecated token keys.
**Branch:** `gl-kan-201-a5-ui` (base = `origin/beta` @ `63c68a3e`, the amended integration line carrying A0–A4).
**Loop note:** first task whose PRIMITIVE-LEVEL verification ran on the settled probe pipeline inherited from A4 (`waitForSelector` + content-wait + retry).

## Discovery (evidence-first)

- `system/ui.jsx` had **zero imports anywhere** — fully dormant; `tokens.js` was imported by 30 files, `system/hooks.js` by the persona pages.
- The measured CTA law already existed as constants: `BUTTONS.geo/neutral/alpha/commerce` in tokens.js — but the primitives hand-copied pre-law values (PillButton: `h-12` = 48px vs the 44px law, no 17px/−0.011em, `hover:bg-black`/`hover:bg-[#1765cc]` off-law ramps, an off-law `blue` fill tone).
- Duplicate anatomy inventory: the 27 hand-authored pill strings across 12 files (grep receipt), Landing's four local primitives (3 hooks + `FadeReveal` + `CarouselDots`), `usePrefersReducedMotion` duplicated in Landing + Premium, the page-local `COLORS` objects in the 5 persona pages + both persona section modules (with a corrupted `#rgba(0,102,204,0.10)` and off-law grounds `#F5F6F8`/`#EEF1F6`/`#E9EFFA` — dead keys whose objects were leftover from the pre-A3 pages).

## What the activation did

**tokens.js**
- Retired the deprecated channel keys `deepBlue`/`chipBg`/`surfaceBlue`; added the law-named `wash: rgba(0,102,204,0.10)`. Consumers now read `color.link` / `color.wash`.
- Kept the measured named surfaces (`graphite/lightGrey/mist/track/trackStrong/surfaceAlt`) — law-valued, live consumers (LandingNav ×12, footers).
- `BUTTONS.alpha` corrected to the A2's in-browser receipt: hover `rgba(0,0,0,0.13)` (was 0.07); added `BUTTONS.outline` (white + `#d2d2d7` hairline + ink + hover `#f5f5f7`); docstring fixed (17px/1.176/−0.011em — A2 verified, not the pre-A2 −0.022 note).

**system/ui.jsx** (the retrofit)
- **PillButton** = `BUTTONS.geo` + tone map (`dark`→neutral, `alpha`, `outline`, `commerce`); `as` supports Link (default)/button/a; composed, not hand-copied.
- **CtaPair** lifted verbatim from NewPersona's `HeroCtas` (the measured Apple Vision-Pro hero pair: 44px ink pill + 17px/400 text link, chevron geometry identical to lucide's) — one copy for the front door and every persona hero.
- **Reveal** → `ease-apple` (was `ease-google`; zero pre-existing consumers so no rendered diff) + memoized like the local it replaces.
- **ProgressDots** → pill tone + focus ring added; semantics unified to `role="group"` + `aria-pressed` (the landing local's cleaner pattern; the primitive was dormant so no rendered/semantic diff anywhere).
- **Chip** → law wash/link + the 14px floor (was 13px, already retagged to 14 by the bridge; now authored right). Chip height stays ~32px — the 14px floor is a font law, not a chip-height law.
- **TabBar** shadows → ink-18 channels (`rgba(29,29,31,…)` — was Google `rgba(60,64,67,…)`; box-shadows escaped A3's computed-color scan).
- **MediaFrame** fallback 8px→12px; **FigureCard** raw `rounded-[28px]`→`var(--radius-card)`.
- Removed the dead `SECTION_RHYTHM_DESKTOP` export (unused; contradicted the section-rhythm law).

**system/hooks.js**
- `useRevealContinuous` upgraded with the landing's two proven behaviors: the reduced-motion guard ("story stays present") and the latest-IO-entry win (what makes the exit wipe land after a fast scroll).
- `usePrefersReducedMotion` exported (was duplicated in Landing + Premium).
- Premium's `useCentredStep` is NOT a duplicate (centroid-tracking behavior) — stays local.

**Consumers (the AC sites, all ≥6 targets)**
- **Landing.jsx**: local hooks + `FadeReveal` + `CarouselDots` deleted → `Reveal`/`ProgressDots`/hooks imports; the `COLORS` alias object (incl. the dead `chipBg`/`track` entries) deleted → direct `color` tokens; `FadeReveal`/`CarouselDots` usages mapped (4 reveal pairs + 1 dots call; no `tone="pill"` call exists).
- **NewPersona.jsx**: `HeroCtas` deleted → `CtaPair` (2 render sites); the persona hero pair is now centrally measured).
- **PersonaSections.jsx**: journey-modal pill pair → `PillButton` (dark + outline; the modal's pre-law px-6 → the law's 21px pad and the 17px/1.176/−0.011em voice; the off-law `hover:bg-[#F5F6F8]` typo-greys absorbed by `BUTTONS.outline`'s `#f5f5f7`); `COLORS` kill → tokens (`chipBg`→`color.wash` in the language rail).
- **PremiumPersonaSections.jsx**: `COLORS` kill + shared `usePrefersReducedMotion`. Its dark-scene `PremiumCTASection`/closing pills and card-wide link labels are scene-conditional bespoke anatomy (not mechanical duplicates) — they stay until D2 formalizes scene primitives; forcing them through the light-scene tones would mis-render the `closing` variants.
- **Student/Teacher/Parent/College/Organization pages**: the `COLORS` objects deleted (with their corrupted `#rgba` string and off-law unused surfaces); journey-section colors → tokens; pages already consumed `system/hooks`.

**Product-surface review transition (governance receipt)**
- `integration/contracts/product-surface-review.json`: `ui.jsx` moved `intentionally-unreleased`/`not-route-reachable` → `connected`/`client` (`profile: client-presentation`), reason naming the actual consumption (client presentation only; no server authority), followUps SCOPE-06/PLAT-01. The audit then re-derived: 68 routes, **1643** controls (was 1645 — two duplicate inline declarations died with the local deletions), connected 506 (+4 = the activated ui.jsx controls), intentionally-unreleased 154 (−6).

## Sanctioned static corrections (all inside the "hairline corrections" tolerance)

- Journey-modal pill pair: padding 24px→21px + the 17px voice (law geometry; the pair kept its 44px height and site pill look).
- Persona language rail + modal: values unchanged (wash = the same rgba the old `chipBg` held).
- Everything else: value-identical substitutions over law-named tokens.

## Verification chain

1. **Typography fingerprint BEFORE/AFTER** (settled probe, 6 activation sites × 3 widths, five fields per element): **IDENTICAL — zero drift** across all 18 route@width fingerprints.
2. Captures: 18 before + 18 after (6 sites × 3 widths) — viewed in-session: `a5-home-1440.jpeg` (landing hero, problem carousel with the primitive dots, promise band, explore tiles) and `a5-professional-1440.jpeg` (persona hero with the unified `CtaPair`, story chapter, dark intelligence beats). Healthy, lawed, unchanged renders.
3. Checks: lint ✓ · typecheck (jsconfig + tsconfig.domain) ✓ · `scope:audit:write` ✓ (after the reviewed record transition) · build ✓ (51.6s) · tests **550/550** ✓ (the single failed `npm test` during the run was the same stale review record, fixed and re-verified green twice).
4. The dev server ran on :5185 through the whole loop (vite HMR picked every edit up; the settled probe re-read at each checkpoint).

## Hand-forwards

- NewPersona's audience rail pills (44px chrome doors, `text-[12px]` −0.010em) — a deliberate nav-chrome tier that predates the floor law; handing to B2/B3 to either law-bless or lift (a blind 14px bump would break the "diff ≈ nil" contract).
- Premium dark-scene CTA/closing pill anatomy + play-pause chrome → **D2 (dark)**.
- Language-rail chips (transparent bg + ink40 border + wash active) — custom anatomy using law values; candidate for a `SegmentedChip` primitive if B-chain titration wants one.
- `ui.jsx` leftovers unconsumed but law-clean and ready: SectionShell/Eyebrow/SectionHeading/SectionSub/GCard/MediaFrame/TextLink/Chip — the B-chain consumes them as it re-titrates sections.

## Merge

`gl-kan-201-a5-ui` → `origin/beta` (fast-forward). Ref-verified post-push.
