# FAP-59 phase 3 — Apple-privacy cinematic hero + local-nav bar (single-source)

**Status:** delivered on `opencode/fap59-hero-cinematic` (from beta `268f5262`).
**Founder directive (2026-11-01/02):** convert the hero sections of research, privacy,
terms, cookies, security **and accessibility** to Apple's /in/privacy hero design
(image → sub-nav bar → heading) in the same design language as the student/category
persona heroes; carry the Apple-privacy **local nav bar** on the five policy pages
(privacy/terms/cookies/security/accessibility) and deliberately **not** on research;
**use the hero-section image slot on these pages** (founder supplies the actual
photography; slots are built and documented below).

## Measured reference (apple.com/in/privacy, 2026-11-02)

| Apple element | Measured | Our law projection |
|---|---|---|
| Local nav bar | sticky ~52px under global nav; title-left **21px/600** ("Privacy"); items 12px/400 quiet + cross-page items; active = 600 ink-on-color | `LocalNav.jsx` — sticky `top:56` (LandingNav fixed 56px), white bar, title 21px/600 ink, items 12px/400 grey → hover ink → active ink+500 `aria-current="page"`, **h-11 (44px) tap targets**, hairline `rgba(18,19,23,0.12)` |
| Hero headline | "Privacy. That's Apple." two-part declarative, centered (80/84 at 1708w) | our display ladder **48 → 64 → 76**, font-normal, 1.06, −0.045em; part 2 = accent-gradient |
| Hero media | giant film strip between headline and dek | full-bleed band `clamp(280px, 42vw, 620px)` below the text column (student-hero composition: words top, image bottom) |
| Dek | 48px/600 centered statement | 17px/25px statement tier @ 760px cap (our converged sub-copy law) |
| CTA | quiet link | our CTA primitives (CtaPair / inkPill / QuietLink), passed as props |

## Single sources (pages compose props; they never re-declare hero/bar anatomy)

1. **`frontend/src/components/landing/CinematicHero.jsx`** — the hero:
   label · centered two-part display (`title` ink + `accent` gradient) · statement ·
   `cta` slot (margin-free wrapper; CtaPair carries its own `mt-10`; raw pills add
   their own margin — accessibility passes `mt-10` on the pill) · `trailing` slot
   (accessibility's on-page anchor chips) · `quietCta` slot · full-bleed image band.
   Placeholder stage (until founder image): brand-blue presence hint over
   `linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%)` — law hexes only.
2. **`frontend/src/components/landing/LocalNav.jsx`** — the Apple local-nav bar
   (described above). Default items = the four policy pages (the old PolicyTabs
   switcher set, relocated; **PolicyTabs.jsx is retired/removed** — receipts in git).

## Page wiring

| Page | LocalNav | Hero copy (verbatim, carried) | Extras kept |
|---|---|---|---|
| `/research` | **none** (founder directive) | "One intelligence," + "every learner." | CtaPair (Start learning free / See how it works) |
| `/privacy` | title "Privacy" | "Your learning is personal." + "Privacy should be clear." | promises/action row/effective date as body opening (`pb-12 pt-10`) |
| `/terms` | title "Terms" | "Clear rules, written" + "to be understood." | same body-opening pattern |
| `/cookies` | title "Cookies" | "How we use cookies. And how" + "you control them." | same body-opening pattern |
| `/security` | title "Security" | "Secure by design," + "protected end to end." | same body-opening pattern |
| `/accessibility` | title "Accessibility" | "Help every learner learn" + "how they learn best." | inkPill CTA + the 5 anchor chips (trailing slot) |

## Founder image drop-in protocol (per page, ~3 lines when the asset lands)

Add the two imports and set the one prop on that page's `<CinematicHero>`:

```jsx
import heroPrivacyWebp from "@/assets/brand/hero-privacy.webp";
import heroPrivacyAvif from "@/assets/brand/hero-privacy.avif";

<CinematicHero … image={{ src: heroPrivacyWebp, avif: heroPrivacyAvif, alt: "…" }} />
```

Naming: `hero-{research|privacy|terms|cookies|security|accessibility}.{webp,avif}` in
`frontend/src/assets/brand/`. The component renders **AVIF first** (`<source
type="image/avif">`), WebP raster fallback, `object-cover`, `lazy`, `draggable=false`,
optional `image.position` for the crop anchor. No other change is needed — the band,
fallback and laws are handled by the component. Until then the quiet placeholder
stage keeps every page composed (no dead slots).

## Gates (rendered on the production preview, 2026-11-02)

- **G1** `npm run check` ✓ (root; law-hex clean) · lint ✓ · typecheck ✓ · unit **653/653** ✓
- **Verify sweep** (`fap59-browser-verify.mjs` @ 4173): 24 routes × 5 widths,
  **0 page errors / 0 law failures / 0 document overflow**, CTA pill 44px · 17px ·
  500 · r9999 everywhere; 48 PNGs + `verification.json`.
- **Design audit** (`fap59-public-design-audit.mjs`, widths 1440+390): 24 routes, 0
  errors; width sweep shows `main`-level rails only on the five persona pages +
  partners (the pre-existing designed carousels; document-level overflow is false on
  all routes at all widths — reference set untouched, out of scope).
- **G4 fonts** PASS (Google Sans product tokens @390/1440) · **G5 taps** ✓ (245
  controls ≥44px) · **G6 continuity** ✓ · **G7 motion** ✓.
- Evidence: `frontend/artifacts/research/fap59-hero-cinematic/{verify,public-design-audit,fonts}`.
- HOD visual review: six `@1440` + `@390` captures inspected — bar, two-part display,
  statement, band cadence and spacing consistent; no fixes required.

## Review + receipts

Implementer self-check only — separate reviewer approval still required (D-095).
SCOPE-01 inventory refreshed via `npm run scope:audit:write` (LocalNav registered in
`integration/contracts/product-surface-review.json`; PolicyTabs entry retired).
Journal receipt appended in `docs/architecture/tracking/jira-sync-journal.jsonl`.
