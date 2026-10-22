# Voice → type ladder (B1, FAP-46 · extended by B2, FAP-47 · B3, FAP-48) — 2026-10-21

**Law:** assign a `data-type` role, never a new page-specific font size. Every landing
section carries roles from this page. Raw fluid sizes (`text-[clamp(…)]`) are retired
from the landing sources; the bridge's clamp-retag fallbacks no longer trigger there.

**Tier source:** `src/styles/rhythm.css` (FAP-34 measured ladder,
`APPLE_TYPE_SCALE_SPEC_2026-10-20` evidence `artifacts/qa-2026-10-20/type-matrix.json`).
**Rule layer:** `src/styles/apple-typography.css`, `@layer public-type-roles`, scoped to
`#main :where(section:not([data-section="01-hero"]):not(:has(h1)) …)` — heroes and
sections containing an h1 are deliberately outside the layer.

## Voice → role map (landing surface)

| Voice (what the text is) | `data-type` role | Measured tier (1440 / 1068 / 734) | Landing home |
| --- | --- | --- | --- |
| Hero headline (the one statement on the stage) | `display` | 64 / 56 / 40 · lh 1.0 · track −0.009em | NewPersona h1 (marker only — the hero keeps its cast/speech anatomy; the layer excludes `01-hero` and any section containing an h1 by design). **One-voice law for the rotating line:** the landing's audience size is fitted ONCE per width from the widest fragment (canvas measure vs the 980px copy column) and held in state — every word renders at the same size (117 / 96 / 41.5 measured); the earlier per-word fit that re-ranked words by length ("for students." larger than "for organizations.") is fixed as a B1 size bug |
| Persona page statement (64px rotating-accent statements) | `section` | 64 / 56 / 40 · lh 1.0625 · track −0.009em · 600 | persona `04-journey` h2s; Premium persona/CTA/closing statements (the `40px,5vw,64px` family) |
| Chapter head (education section head) | `section` | same ladder as above | Landing section h2s; Problem/Promise h2s (were bridge-retagged `40px,5.55vw,80px` → `--fs-h2` — roles now carry the same computed values, the bridge entry goes dormant) |
| Dark-intelligence statement (promo scene) | `section` (dark-scene ink/link flip automatically) | same | Premium `05-intelligence` h2s |
| Story-panel statement (journey modal title) | `story` | 48 / 40 / 28 · lh 1.083/1.1/1.143 · track −0.009em | PersonaSections `JourneyModal` h3 |
| Card/tab statement (accordion + mode card statements) | `feature` | 28 / 24 / 21 · lh 1.143 · track +0.007em | PersonaSections achievement accordion h3s |
| Featured question (language chapter live line) | `feature` | 28 / 24 / 21 | Premium language question span (keeps its `lang` attribute — Indic floor still applies through `[lang]`) |
| Intelligence drawer beat title | `feature-heading` | 32 flat · lh 1.125 · track +0.004em · 600 (token measured in FAP-34; role rule added by B1) | Premium `IntelligenceDrawer` h3s |
| Pull-quote (problem slides, quote cards) | `editorial-lead` | 24 / 21 / 19 · lh 1.167 · track +0.009em · 600 | Landing problem slide quote; PersonaSections spoken lines use `body` (they are read-aloud lines, not pull-quotes) |
| Body voice (chapter subs, spoken lines) | `body` | 17px · lh 1.19048 · track −0.022em · 400 | persona journey subs (18px), Premium chapter subs (18px), PersonaSections quote lines (17→21px) |
| Value cards (name + line) | `value-title` / `value-body` | 19px · lh 1.210526 · track +0.012em | Landing value rows; Premium value grids (already adopted in A5) |
| Promise/quote chapter statement | `card-chapter` | 48 / 40 / 32 · lh 1.0834 · track −0.009em · 600 | Landing promise quote (already adopted) |
| Hero-adjacent kicker + page-title lead-in | `label` (opt-in `data-type="label"`) | 21px flat · lh 1.19 · track 0.011em · 600 · **sentence-case** (measured from the education-initiative label tier the retired mask echoed) | **B2/FAP-47:** the eleven lead-ins (AboutUsHero + download/community/partners/updates/referral/accessibility strheroes, the four policy header p's) declare the role. The law legitimately lives *outside* the plain-section scope, so rhythm now carries root-level mirrors of the section-scoped voice tokens (`--fs-caption/--lh-caption/--track-meta/--weight-heading/--fs-meta`) — chrome asides/nav resolve the same values as in-section sites |
| Quiet eyebrow (module tags, chips, aside/`th` headers, nav micro-labels) | `.apple-eyebrow` base class (a class, not a `data-type` role) | 12px · lh 1.333333 · track −0.016em · 600 · **sentence-case** | **B2/FAP-47:** every remaining public uppercase site converted (≈52 sites across the 20+ public files). Plain-section sites voice through the section law; aside/`th`/values-strip/nav chrome voice through the base class + the root token mirrors; blue "Our mission" eyebrow → grey (blue in headlines stays confined to the sanctioned moment). Career/tool chips keep their grey |
| Numbered kicker, eyebrows, attribute captions | — | out of B1 | resolved in B2 — the two rows above are the law |
| Scene word statements (meet/language overlay words) | `display` | 64 / 56 / 40 · lh 1.0 · track −0.009em · 600 | PersonaSections scene-overlay spans (the `40px,4.5vw,72px` rotating words) |
| Footer wordmark (decorative, aria-hidden) | — | bespoke scene anatomy | LandingFooter's wordmark stays measured; roles return chapter-by-chapter in D-tasks if ever needed |

## Review checklist (what a reviewer checks on a landing-diff)

1. Every `h1`/`h2`/`h3` inside the landing sources carries `data-type` from this page.
2. No `text-[clamp(…)]`, and no scale-bearing `text-[Npx]`/`tracking-[…]`/`leading-[…]`
   utilities on role-carrying headings — the role layer owns size/tracking/leading/weight.
3. Layout utilities (margins, max-width, balance, color) stay on the element.
4. Bridge clamp-retag selectors (`h2.text-[clamp(…)]` blocks in `public-bridge.css`)
   match **zero** elements on the landing routes (rendered probe receipt).
5. Typography fingerprint diffs are explained line-by-line by this map's drift column.

## Enforcement

- `eslint.config.js` — scoped `no-restricted-syntax` on the six landing sources:
  headings without `data-type` and any authored `text-[clamp(…)]` class fail lint.
- `tests/landing-type-roles.test.mjs` — source-scanned regression lock (the same two
  conditions, plus role-vocabulary membership).
- `scripts`-level rendered probe `b1-type-roles.mjs` — per route/width: zero headings
  without `data-type`, zero bridge-retag class matches, results in
  `artifacts/research/continuity-2026-10-21/b1-type-ladder/`.

## B2 (FAP-47) — kicker codification receipts (2026-10-22)

- **Retired laws.** The public `p.uppercase` section mask (was the 21px bridge voice)
  and its caption-law arm are deleted; the public body-size law
  (`.text-[15px]/[16.5px] → 16`, `.text-[14.5px] → 14`, `.text-[17px]/[17.5px] → 17`,
  all `!important` over any authored responsive tier) is retired from
  `public-bridge.css` — every public site that rode it was re-authored onto the
  ladder first. Workspace voice is untouched as a law: its own rem key
  (`workspace-typography.css`) becomes live for its last two `text-[15px]`
  consumers (AchievementsCard, SubjectHeroBanner) that the bridge had flattened
  to 16px — they now render 15px and scale, per that file's declared intent.
- **Probe chain.** 24 routes banked before/after (1,101 tracked sites; every route
  1:1-paired, 0 unresolved): the only deltas are the intended unifications
  (≈25 span kickers 14→12 caption dial, aside/`th`/chips dialing, "Our mission"
  blue→grey, tt flips) plus **one authored restoration**: the research hero
  `sm:text-[18px]` line the bridge had pinned to 17 — visible 17→18 at desktop,
  the page's own responsive intent. b3 dump after the law retirements = 2,413
  sites, **0 regressions** against the b2 dump.
- **Hand-forwards.** C1 persona-router card radius → token; C4 billing knob +
  email-input geometry; rgba channel-form leaks (~397 hits) + box-shadow scans +
  premium dark-scene anatomy (B3/D2); LandingFAQ's `clamp(22, 2.2vw, 32)` span
  (tier-swept once already) pitched to B3.

## B3 (FAP-48) — store-grade pricing table voices (2026-10-22)

- **Store price** — `/pricing` plan columns (`data-b3="price"`):
  28px · 500 · track −0.022em · lh 1.15 · ink. Fine print line (12px/18px grey,
  the caption dial) carries the annual billed-yearly string, the free line, or
  the per-person note — every string composed from `pricingConfig` fields only.
- **Store entitlement rows** — 17px · lh 1.47 · track −0.022em · 400; the
  feature label column speaks the same voice. Values are the `COMPARISON`
  fixture verbatim (no word invented; booleans stay the quiet ✓/–). The
  rendered truth-match probe compares all 11 rows against the fixture.
- **Commerce-blue action** — the store pill: h-11 (44px), 17px · 500 ·
  −0.011em, `#0066cc` base, `#0071e3` hover, pressed-scale grammar retained;
  routing unchanged (`billingPath` for personal/family, config `to` otherwise).
- **Sticky header band** — the plan-header row (`top-14`, under the fixed
  `h-14` nav) carries the 21px/600 name, the 14px tagline, the price and the
  action; below lg the table swipes in its `overflow-x-auto` wrapper with the
  feature column pinned (`sticky left-0`), and at ≥lg the wrapper is
  `overflow-visible` so the page scroll drives the sticky band.
- **Hand-forward verdict.** LandingFAQ's pitched `clamp(22, 2.2vw, 32)` span
  sits in its `variant="hero"` arm, which no routed page consumes (grep: zero
  `variant="hero"` call sites) — left untouched; re-voice when a task adopts
  the hero variant.
