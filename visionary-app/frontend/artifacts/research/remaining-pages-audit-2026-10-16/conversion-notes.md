# Public premium conversion — change log & findings (2026-10-16)

Method: per-page deep audit (dom probes + before-captures) → convert → verify (live probes,
after-captures 1440 + 390, eslint / typecheck / build / tests). Bar reference: approved
landing + six category pages. Evidence folders:

- `dom/*.json` — pre-change DOM audit probes (all 17 pages)
- `dom/_summary.txt`, `dom/_type.txt` — cross-page summaries
- `captures/before/**` — pre-change viewport segments
- `captures/after/**`, `captures/after-mobile/**` — post-change segments

## Cross-cutting fix — statement-tier selector (applies site-wide, proven scoped)

`apple-typography.css` statement rule matched `:is(h3,p)[class*="clamp(28px,2.78vw,40px)"]`.
The substring also matches HAT gap calcs living in margin utilities
(`mt-[calc(clamp(28px,2.78vw,40px)*0.857)]`), silently promoting body copy to the 40px
statement tier. Pre-existing — visible in `captures/before/how-it-works-before-seg02.jpg`.
Fix: scope the match to the text-size utility `[class*="text-[clamp(28px,2.78vw,40px)]"]`.

Scope proof:
- `grep calc(clamp(` → only `DownloadPage.jsx` (clamps `20px,2vw,26px` / `36px,5vw,72px`;
  no statement rule targets those on p) and `CoachingPage.jsx` (the false matches).
- After fix: step bodies 18/25 ink (accepted body tier); step h3s still 40/44 via their
  `text-` utility. Re-measured `/student` chapter values byte-identical (17/500 eyebrow,
  72/72 h2, 24/600 sub, 17/400 #0066cc quiet links, black pill CTA).

## Cross-cutting law — sub-headings earn their place (user direction)

Apple doesn't always pair a headline with a sub; one is used only when it carries
information the statement can't (a deck line that orients, a fact, a trust line) —
otherwise the statement stands alone. Applied to the closers of both converted pages:
the stacked 24/600 "second headline" is gone — `/how-it-works` and `/pricing` CTAs now
run statement → one ink pill + one quiet path → small print. `/pricing`'s unique trust
line ("Upgrade only when Visionary has earned it.") moved into the closing fine print;
`/how-it-works` keeps "Free to start. Private by design." Heroes keep their light 18/25
deck lines (orientation, not a second headline). Rule carried forward: no section subs
added mechanically on the remaining pages — only where they add information.

## 01 · `/how-it-works` — `CoachingPage.jsx` — DONE (proof page, awaiting user review)

### Chapters (bridge rhythm)
- Added `data-section`: `01-hero`, `04-journey`, `05-loop`, `06-people`, `07-cta`.
  Desktop rhythm lands canonical 158.4/158.4 at 1440 (was inner `py-24/32`).
- Joins: `04-journey` transparent (white→white, base rule); `06-people` transparent via
  new page-scoped rule (`public-bridge.css`, `.page-how-it-works`); `05-loop` / `07-cta`
  keep the whisper hairline (surface change, same as accepted `12-cta`/`13-explore`).
- `rounded-t-[32px]` added for source parity; renders 0 under the bridge `border-radius:0
  !important` (verified same on accepted pages — the "tuck" is theoretical site-wide).

### Chrome → premium vocabulary
- Palette: `#F5F6F8` → `#f5f5f7` (surface/soft); mock hairlines `#dadce0` →
  `rgba(18,19,23,0.12)`.
- `MockShell`: browser dots + border removed → grey module field (`rounded-[30px]`, p-4/6/10)
  + borderless white card (`rounded-[20px]`) + quiet 14px label. Product UI inside keeps its
  own borders (Apple showing iOS screenshots).
- Step copy: grey micro panels → plain 14px grey text under body.
- Loop: chips borderless (active ink pill / white inactive), demo card borderless with grey
  icon disc, caption 14px light-grey.
- People: accent-gradient on closing phrase; segmented control = grey track + ink pill
  (narrow screens: scrollable strip — 342/468px at 390, page overflow 0); scenario column
  chrome-less; quiet links `17/400 #0066cc` + chevron.
- CTA: PremiumCTASection anatomy — no eyebrow, display h2 (72/72), black pill
  (`h-12 bg-[#121317]`), quiet blue link beside it, fine print beneath.

### Verified
- Chapters table: 158.4/158.4 ×4, joins as above, radius 0, overflowX 0 @1440 and @390.
- Type: h1 64/600 (matches `/pricing` family), h2 72/72 ×3, step h3 40/44, body 18/25,
  links 17/400 `rgb(0,102,204)`, pill 17px / 48px tall. No failed requests.
- `eslint --quiet` clean · `tsc` both configs clean · `vite build` clean · 524/524 tests.
- Evidence: `dom/how-it-works.json` (before), `dom/how-paras-after.txt` (after),
  `captures/after/how-after-seg00..09.jpg`, `captures/after-mobile/how-after-m-seg00..10.jpg`.

### Open items (not defects, noted)
- Pre-existing lint warnings in `CoachingPage.jsx`: unused `HERO_WORDS`, unused `visible`
  (both predate this change — left untouched).
- `500 /api/auth/me` in dev = dev-backend baseline, not page related.

## 02 · `/pricing` — `AILearningPage.jsx` — DONE (awaiting user review)

### Chapters (bridge rhythm)
- Added `data-section`: `01-hero` (hero + plans tray, exempt — keeps the approved
  64/600 hero family and the authored plan-card tiers, since the section holds the h1),
  `02-persona`, `03-compare`, `04-faq`, `05-cta`. Desktop rhythm lands canonical
  158.4/158.4 at 1440.
- Joins: `02-persona` / `03-compare` / `04-faq` transparent via new page-scoped rule
  (`public-bridge.css`, `.page-pricing`); `05-cta` keeps the whisper hairline (surface
  change). Trust band stays a non-chapter band (py-12) between compare and FAQ.
- `rounded-t-[32px]` added on CTA for source parity; renders 0 (same site-wide no-op).

### Chrome → premium vocabulary
- Palette: surface `#F5F6F8` → `#f5f5f7`; hairlines/mist `#dadce0` → `rgba(18,19,23,0.12)`.
- Billing toggle: bordered blue-tint control → white segmented track + ink active pill;
  the off-palette green "2 months free" badge → white/15 chip on ink, grey chip on white.
- Plans: `rounded-[28px]` empty wrapper → grey module field (`rounded-[30px]`, p-4/6/10);
  plan cards borderless white (`rounded-[20px]`, ring removed) with "Most popular" ink
  chip; primary plan CTA = black pill, others = quiet grey-fill pills (Apple secondary);
  "What's included" divider → neutral hairline. (Radius law: bridge remaps
  `.rounded-[24px]` → 12px `--radius-card`, so cards use `rounded-[20px]` — unmapped —
  to match the how-it-works field/card 30/20 nesting.)
- Persona strip: same grey tray + borderless white cards (google.com curve + blue arrow
  kept; `hover:border-[#4285F4]` dropped).
- Comparison: outer border + blue-tint thead (`#f8fafd`) → borderless container
  (`rounded-[20px]`, scroll-contained at 390), thead `#f5f5f7`; blue "Personal" column
  head and blue checks kept as the page's accents; row hairlines already neutral ink.
- CTA: PremiumCTASection anatomy — black pill (`h-12 bg-[#121317]`, 17px) + quiet blue
  "Talk to sales" link with chevron (ChevronIcon from `PersonaSections`); 72/72 statement
  stands alone (24/600 sub trimmed per the sub-heading law), its trust line kept as the
  closing fine print ("Upgrade only when Visionary has earned it.").

### Verified
- Sections table: `01-hero` 112/96 (exempt), A-3 158.4/158.4, joins as above, radius 0.
- Controls: toggle ink `rgb(18,19,23)`/white h-40; plan CTA h-48 (ink / `#f5f5f7` grey);
  persona card radius 20 borderless; plan card radius 20 borderless on 30 tray.
- Mobile 390: page overflowX 0; toggle 178px right-edge 326; CTA buttons stack
  full-width 320; compare table 760px scrolls inside its own container (by design
  with the "Scroll to compare" hint).
- No failed requests. `eslint --quiet` clean → `tsc` both configs clean → `vite build`
  clean → 524/524 tests.
- Evidence: `dom/pricing.json` (before), `captures/after/pricing-after-seg00..06.jpg`,
  `captures/after-mobile/pricing-after-m-seg00..12.jpg`.

### Open items (not defects, noted)
- Institution card: two-line "Contact Visionary" price pushes its block ~8px below the
  other cards' — pre-existing (wrap behavior of the contact price), copy/layout unchanged.
- Plan card CTA text computes 16px via the bridge retarget of the authored 15px utility
  (consistent with other pills at this tier).

## 03 · `/download` — `DownloadPage.jsx` — DONE (awaiting user review)

### Chapters (bridge rhythm)
- Added `data-section`: `01-hero` (hero + web/app choice tray, exempt — keeps the approved
  76/400 hero family and the hero's eyebrow/sub), `02-platforms`, `03-sync`,
  `04-requirements`, `05-cta`. Desktop rhythm lands canonical 158.4/158.4 at 1440
  (was inner `py-24/32`).
- Joins: `02-platforms` transparent via new page-scoped rule (`public-bridge.css`,
  `.page-download` — white→white after the exempt hero); `03-sync`, `04-requirements`,
  `05-cta` keep the whisper hairline (surface changes). Notify module and trust band
  stay non-chapter bands (notify keeps the authored `pb-24`; trust band `pb-24` → `py-12`
  matching the pricing trust band rhythm between chapters).
- `rounded-t-[32px]` on CTA for source parity; renders 0 (same site-wide no-op).

### Chrome → premium vocabulary
- Palette: surface `#ffffff` → `#f5f5f7` (this page authored surface as white — the token
  change gives it the grey bands: sync chapter, trust pill, CTA); mist `#dadce0` →
  `rgba(18,19,23,0.12)`.
- Choice cards (hero): grid → grey module field (`rounded-[30px]`, p-4/6/10) + borderless
  white cards (`rounded-[20px]`); icon chips bordered → grey-fill with blue glyph;
  "Open Visionary" blue pill → black pill; "See platforms" bordered → grey-fill quiet
  pill. (google.com notch kept — invisible on a white card, pure no-op.)
- Platforms: bordered `rounded-[24px]` cards (blue border on the recommended one) →
  grey tray + borderless white (`rounded-[20px]`); "Recommended" blue uppercase badge →
  ink chip (site chip family); Web CTA → black pill `h-12`; coming-soon pills (bordered,
  60% opacity) → grey-fill `#f5f5f7` with `#9AA0A6` text — honest disabled state kept
  (`aria-disabled`, title). `#platforms` anchor + scroll-mt preserved for the nav
  mega-menu.
- Notify module: bordered card → grey module field (`rounded-[30px]`, p-8/10); email
  input keeps its function (white pill + `rgba(18,19,23,0.12)` hairline, red error kept);
  submit → black pill; success status box → borderless white (`rounded-[14px]`).
- Requirements: same tray + borderless white card pattern as platforms.
- CTA: PremiumCTASection anatomy — black pill (`h-12 bg-[#121317]`, 17px, max-390
  full-width) + quiet blue "See how it works" link with chevron (`ChevronIcon`).
  64/600 statement stands alone: the 24/600 sub was trimmed per the sub-heading law
  ("Open Visionary in your browser" repeated the statement); the unique facts became the
  closing fine print — "No install, no waiting. Pick up the app whenever you're ready."

### Verified
- Chapters table: `01-hero` 112/96 (exempt), `02`–`05` 158.4/158.4, joins as above,
  radius 0, overflowX 0 @1440 and @390.
- Type re-probe: hero 76/400/-3.42 + 18/400/25 sub; eyebrows 17/500–17/600 (adapter law,
  authored uppercase 12 normalized); chapter h2s 28/600 (SchoolPage tier); platforms sub
  24/600 kept — it carries necessary state ("apps being prepared for your device,
  including Windows"); sync statement 31.68/400 + blue animated word; CTA h2 64/600;
  fine print 14px grey; quiet link 17/400 `rgb(0,102,204)` + chevron.
- Chrome: trays 30 grey / cards 20 borderless (choice, platforms, requirements); pills
  h-48 (ink / grey-fill); ink chips; input hairline; mobile 390: trays 342, CTA controls
  320, page overflowX 0.
- Mid-review fix: the notify box originally sat flush against the sync band's grey top
  (`pb-0` fused the two same-color surfaces); restored the authored `pb-24` (96px) —
  desktop 4666→4762px, mobile 6873→6969px; box now floats clear of the band hairline.
  Captures re-taken after the fix.
- No failed requests (500 `/api/auth/me` dev baseline). `eslint --quiet` clean → `tsc`
  both configs clean → `vite build` clean → 527/527 tests.
- Evidence: `dom/download.json` (before), `captures/before/download-before-seg00..05.jpg`,
  `captures/after/download-after-seg00..05.jpg`,
  `captures/after-mobile/download-after-mobile-seg00..09.jpg`.

### Open items (not defects, noted)
- Notify title computes 17/500 via the adapter (authored 22) — hierarchy holds by weight
  (title 500 / sub 400); left on the adapter tier.
- Card body copy computes 14px (authored dense-card tier, same as pricing plan taglines).

## 04 · `/about` — `AboutUsPage.jsx` (+ `AboutUsHero.jsx`, `HeroFanCards.jsx`) — DONE (awaiting user review)

### Chapters (bridge rhythm)
- Added `data-section`: `01-hero` (exempt — keeps the 76/400 hero family and the fan
  strip), `02-mission`, `03-journey`, `04-impact`, `05-roles`, `06-explore`, `07-cta`.
  Desktop rhythm lands canonical 158.4/158.4 at 1440 (was inner `py-24/32`).
- Joins: `02-mission`–`06-explore` transparent via new page-scoped rule
  (`public-bridge.css`, `.page-about` — the whole page rides the white ground); `07-cta`
  keeps the whisper hairline (white → grey surface change). Hero `border-b #e8eaed` seam
  removed.
- `rounded-t-[32px]` on CTA for source parity; renders 0 (site-wide no-op).

### Chrome → premium vocabulary
- Hero (`AboutUsHero`): sub normalized `24/400/37.2` → `17.5/25` (#5f6368) — the
  download 76-hero family; "Explore our approach" `15/500` + ArrowRight → the quiet link
  (`#0066cc`, chevron); pill gains `tracking-[0.24px]` + press states. Fan cards keep
  their category tints (hero identity): label `#202124` → `#121317`, hover shadow → ink
  `rgba(18,19,23,0.16)`, focus ring → `#4285F4`.
- Mission module: white `g-card` `rounded-[32px]` → grey field (`rounded-[30px]`,
  p-4/6/10) + two borderless white `rounded-[20px]` cards (quote panel `#e8f0fe` and
  illustration panel `#f8fbff` → white); blue pill → black `h-12`; google.com notch kept
  — now a visible white bite on the grey field; kicker `#174ea6` + quote mark `#0b57d0`
  kept.
- Pull-quote defect: authored `text-[30px]`/`sm:text-[40px]` collapsed to 17/400 (the
  adapter's explanation rule out-specifies authored sizes on chapter `p`s); re-authored
  as `text-[clamp(28px,2.78vw,40px)]` to ride the designed large-card tier → renders
  40/44/400.
- Life / impact / roles card groups: `g-card`/pastel cards (`#e8f0fe`, `#f8f9fa`,
  `rounded-[24px]`) → grey tray (`rounded-[30px]`) + borderless white cards
  (`rounded-[20px]`); role image tints + multiply dropped (white areas, pricing-persona
  precedent); "Explore" blue pill → black `h-12`; impact blue accent labels + spot
  tiles kept; strip divider `#dadce0` → `rgba(18,19,23,0.12)`.
- Explore: tray + white cards; right panels `#f8f9fa`/`#e8f0fe` → `#f5f5f7`; notch +
  blue ArrowRight kept (pricing-persona anatomy).
- Chapter headers: life / impact / roles restructured to the mission anatomy (eyebrow
  above, h2 + deck as adjacent siblings) — their decks already carried the info but the
  eyebrow wrapper broke `h2 + p` adjacency, leaving them accidental 17/400 support copy;
  all four decks now ride the lead law: 24/600/28.
- CTA: grey band `#f5f5f7`; black pill `h-12` + quiet chevron link (contact); 24/600 sub
  → fine print per the sub law ("Explore the view that fits your role…" now closes below
  the buttons, 17/400 grey at the site floor). Eyebrow kept.

### Verified
- Chapters table: `01-hero` 232/40 (exempt), `02`–`07` 158.4/158.4; joins: 02–06
  transparent, 07 whisper `rgba(18,19,23,0.043)`; radius 0; overflowX 0 @1440 and @390.
- Type re-probe: quote 40/400/44 (was the 17/400 collapse); four decks 24/600/28; hero
  sub 17.5/25; eyebrows 17/500–17/600 (adapter law); CTA h2 64/600; fine print 17/400
  grey; quiet links 17/400 `rgb(0,102,204)` + chevron.
- Chrome: mission field 30 grey (h 529) + cards 20 white; role/impact/life/explore cards
  20 white in 30 trays; explore panels `#f5f5f7`; pills h-48 ink (mission, roles, CTA);
  fan label ink; mobile 390: trays 342, CTA controls ≤320, overflowX 0.
- Page height 7522 → 8249 desktop (decks + rhythm), 12987 mobile; no failed requests
  (500 `/api/auth/me` dev baseline).
- Gate: `eslint --quiet` clean → `tsc` both configs clean → `vite build` clean →
  527/527 tests.
- Evidence: `dom/about.json` (before), `captures/before/about-before-seg00..08.jpg`,
  `captures/after/about-after-seg00..10.jpg`,
  `captures/after-mobile/about-after-mobile-seg00..17.jpg`.

### Open items (not defects, noted)
- Hero quiet link computes 18/400 (hero is exempt from the adapter; the hero anchor rule
  sits 1px above the site's 17 floor) — left as the hero family.
- Hero sub normalized to the download hero family (17.5/25) — flagged for review; easy to
  widen if the 76/400 hero wants more voice.
- CTA keeps its eyebrow although the approved closers show statement-alone; content
  preservation — easy to drop.
- Mission quote rides the large-card tier at 400 weight (editorial light statement, same
  family as the download sync statement) — flagged for review.

## 05 · `/partners` — `PartnersPage.jsx` — DONE (awaiting user review)

### Chapters (bridge rhythm)
- `data-section` set: `01-hero` (exempt — the 76/400 hero family), `02-what`, `03-who`,
  `04-includes`, `05-depth`, `06-journey`, `07-statement`, `08-support`, `09-faq`,
  `10-cta`. Authored `py-24 lg:py-32` removed — chapters land the canonical
  158.4/158.4 @1440.
- Joins: `02-what`, `03-who`, `06-journey`, `09-faq` transparent (`.page-partners`
  scoped rule — the enquiry story rides one white ground); authored
  `border-t border-[#dadce0]` seams removed (what / journey / faq). The grey bands
  (`04-includes`, `07-statement`, `10-cta`) change surface, so `04`, `05`, `07`, `08`,
  `10` keep the whisper `rgba(18,19,23,0.043)` hairline.

### Chrome → premium vocabulary
- Palette: band greys `#f8f9fa` → `#f5f5f7`; hairlines/chips `#dadce0` →
  `rgba(18,19,23,0.12)`; action blue `#4285F4`/`#0b57d2` → site blue `#0b57d0` + ink
  pills.
- Hero: blue pill → black ink pill (h-48, press states, `ArrowUpRight` mailto kept);
  bordered "See how it works" pill → quiet `#0066cc` chevron link; dek → the 76-hero
  family sub (authored 17.5/25; hero-exempt, computes 18/25 — same 1px band noted on
  /about); floating trust chip hairline → `rgba(18,19,23,0.12)` + whisper shadow;
  clock glyphs → `#0b57d0`.
- Carousel: slide titles were collapsing to the compact card-name tier (authored
  24/28 sits inside the adapter's 20/21/22/24 card-name class list → 17/600) —
  re-authored `text-[28px]` to ride the default h3 feature tier → 28/600/32, matching
  the journey card titles. Dots → site blue + neutral greys; arrows keep the adapter's
  36px 2px-neutral control (source hairline token updated — render unchanged).
- Who grid: radial `#e8f0fe` backdrop removed; tiles white `g-card`-shadowed 24 →
  grey-fill `rounded-[20px]`; label chips 6px hairline → `rounded-[12px]` +
  `rgba(18,19,23,0.12)`.
- Includes: shadowed white cards → borderless white `rounded-[20px]` on the grey band;
  tinted icon tiles (blue/green/amber) → grey-fill `rounded-[14px]` + site-blue glyph
  (download choice-card law); compact card names stay 17/600.
- Depth: tier table's shadowed card → bare Apple compare grid on white (grey header
  row, `rgba(18,19,23,0.12)` row hairlines, outlined chips `rounded-[12px]`); green
  `#188038` check discs + neutral dashes kept as the semantic accent; compass tile →
  grey fill; left-column `dl` hairline → 0.12.
- Journey: 2px ink top rules + blue step labels kept (editorial list, no cards); note
  block `rounded-2xl #f8f9fa` → `rounded-[20px] #f5f5f7`.
- Statement + support: pills → ink (h-48); secondaries → quiet chevron links; support
  card `#e8f0fe` 28 → grey field `rounded-[30px]` (white bite + blue arrow kept — the
  notch now reads on grey; white compass disc).
- Closing CTA: gradient join card + confetti dots + sparkle → the site closer — grey
  band, statement alone 64/600, ink mailto pill + quiet "contact routes" chevron link,
  response-time line as fine print below (same authoring as the /about closer).

### Verified
- Sections table: `01-hero` 64/96 exempt; `02`–`10` 158.4/158.4; joins 02/03/06/09
  transparent, 04/05/07/08/10 whisper `rgba(18,19,23,0.043)`; radius 0; overflowX 0
  @1440 and @390.
- Type re-probe: h1 76/400/-3.42; eyebrow 17/500; chapter h2s 64/600/68 (compact tier
  28/600 on depth/support); slide + step titles 28/600/32; leads 24/600/28 (decks +
  support copy); compact names 17/600; chips 14/600; quiet links 17/400
  `rgb(0,102,204)`; pills h-48 ink (`rgb(18,19,23)`); fine print 17/400 grey.
- Chrome re-probe: who tile / inc card radii 20 no shadow; icon tiles grey-fill +
  `rgb(11,87,208)`; table bare (radius 0, no shadow); support field 30; check
  `rgb(24,128,56)`; note block 20; CTA fine print below controls.
- Interactions (live): carousel next/prev/dot paging and FAQ expand-all both work; no
  page errors (a dev-backend 401 auth probe only).
- Page height 8220 → 8787 desktop @1440; 12531 mobile @390; overflowX 0.
- Gate: `eslint --quiet` clean → `tsc` both configs clean → `vite build` clean →
  527/527 tests.
- Evidence: `dom/partners.json` (before), `captures/before/partners-before-seg00..10.jpg`,
  `captures/after/partners-after-seg00..10.jpg`,
  `captures/after-mobile/partners-after-mobile-seg00..16.jpg`.

### Open items (not defects, noted)
- Hero keeps both response-time signals (the clock line under the controls and the
  floating illustration chip) — source content, kept for preservation; easy to drop
  one.
- Carousel slide titles moved 17/600 → 28/600 (the collapse fix above) — flagged as
  the largest in-card change; bullets beneath already read 17/400.
- Support module keeps the 28/600 title + 24/600 lead pair (download "platforms"
  precedent) — hierarchy holds by size; easy to rebalance if the pair reads heavy.
- Hero family stays exempt: pill computes 16/500 and quiet link 18/400 (1px band, same
  as /about).

## 06 · `/contact` — `ContactPage.jsx` — DONE (awaiting user review)

### Chapters (bridge rhythm)
- Seven sections: `01-hero` (centered statement, exempt, authored 64/64) → `02-resources`
  (audience tab control + resource cards) → `03-faq` → `04-help` (grey band) →
  `05-routes` → `06-grievance` (grey band) → `07-hygiene`; all six chapters 158.4/158.4.
- Joins: `02`/`03` transparent (one white ground from hero through FAQ); `04`–`07` keep
  the whisper hairline `rgba(18,19,23,0.043)` (surface changes alternate grey/white).
  Authored `border-t border-[#dadce0]` on faq + grievance and all authored
  `py-24/32` paddings removed — the bridge owns the rhythm now.
- Grey bands authored `#f5f5f7` (was `#f8f9fa`).

### Chrome → premium vocabulary
- Hero: outlined blue "Help center" pill → quiet `#0066cc` chevron link; sub → the
  76-hero family sub (authored 17.5/25; hero-exempt, computes 18/25 — same 1px band
  noted on /about and /partners).
- Tabs: segmented-control group `#f8f9fa` → `#f5f5f7`; active white pill shadow
  `rgba(60,64,67,0.2)` → `rgba(18,19,23,0.08)`; stays 14/500 (probed — buttons with
  `.text-[14px]` stay 14 via the adapter's meta normalization).
- Resource cards: shadowed white `rounded-2xl` (16) → white `rounded-[20px]` inside a
  new grey tray `rounded-[30px]` (about-explore law); outlined `border-2 #4285F4` 40px
  tiles → grey-fill `h-12 w-12 rounded-[14px]` + `#0b57d0` glyph (download choice-card
  law). Labels were `p.uppercase` computing 17/600 — louder than the 17/500 h4 title —
  converted to `span` (14/600 chip law) and the title to `h3 text-[17px]` (17/600/21
  compact-name tier). Corner curve + blue circle arrow → the about-explore gesture:
  plain `ArrowRight` bottom-right `#0b57d0` with hover translate. "More Visionary
  resources" pill → quiet chevron link.
- FAQ: seam removed, chapter rhythm; "Help center" pill → quiet chevron link (the
  shared `LandingFAQ` is untouched).
- Help band: `#f5f5f7`; shadowed white "Visit Help center" pill → ink pill (h-48, press
  states); `hello@` link → quiet chevron link (mailto + subject kept).
- Routes: kicker stays `p.uppercase` (17/600, journey-kicker law); six shadowed cards
  (16) → white `rounded-[20px]` inside a grey tray `30`; tiles → grey-fill `14` + blue
  glyph; category labels `p.uppercase` 17/600 → `span` 14/600; all six EmailLinks →
  quiet chevron links (mailto + subjects kept).
- Grievance: card shadowed → borderless white `rounded-[20px]`; role label → `span`
  14/600; officer name collapsed to the card-name tier (authored 22 sits in the
  20/21/22/24 list → 17/600) — re-authored `text-[28px]` to ride the feature tier →
  28/600/32 (same fix as the partners slide titles).
- Hygiene: inline privacy link `#0b57d0` persistent underline → `#0066cc` +
  hover underline.

### Verified
- Sections table: `01-hero` 64/64 exempt; `02`–`07` 158.4/158.4; joins 02/03
  transparent `rgba(0,0,0,0)`, 04/05/06/07 whisper `rgba(18,19,23,0.043)`; radius 0;
  overflowX 0 @1440 and @390.
- Type re-probe: h1 76/400/-3.42; hero sub 25/18; chapter h2s 64/600/68 (grievance +
  hygiene pair 28/600/32); leads 24/600/28; tabs 14/500; card labels 14/600; card
  titles 17/600/21; card copy 17/400; quiet links 17/400 `rgb(0,102,204)` h-44; ink
  pill h-48 `rgb(18,19,23)` / white.
- Chrome re-probe: resource + route cards white 20 no shadow inside tray 30 (281px /
  379px wide); icon tiles 48px grey-fill + `rgb(11,87,208)` glyph (radius 12 via the
  bridge remap); grievance card white 20, officer name 28/600/32; segmented control
  radius 9999 with white active pill.
- Interactions (live): tab switch swaps heading + cards (Students → Teachers probed);
  FAQ item toggles; 8 mailto links carry prefilled subjects; no page errors (a
  dev-backend 401 auth probe only).
- Page height 5388 → 6117 desktop @1440; 8454 mobile @390; overflowX 0.
- Gate: `eslint` clean → `tsc` both configs clean → `vite build` clean → 527/527 tests.
- Evidence: `dom/contact.json` (before), `captures/before/contact-before-seg00..06.jpg`,
  `captures/after/contact-after-seg00..07.jpg`,
  `captures/after-mobile/contact-after-mobile-seg00..11.jpg`.

### Open items (not defects, noted)
- The hero now keeps the standard chapter air before the tabs (resources gained its
  158.4 top) — the tab strip reads as the resources chapter's control. Tighten only if
  hero + tabs should read as one scene.
- Route/help/hygiene paragraphs authored 14px compute 17/400 (adapter body law) —
  consistent with partner-card copy site-wide.
- Leads after h2 (routes copy, grievance copy, still-need copy) ride the 24/600 law —
  same pairing as the partners support/decks precedents.
- All contact routes are mailto by design (content preserved); no phone/form fields
  existed to convert.

## 07 · `/careers` — `CareersPage.jsx` — DONE (awaiting user review)

### Chapters (bridge rhythm)
- Eight sections: `01-hero` (full-bleed photo + overlapping enquiry card, exempt,
  0/0) → unmarked photo strip (compact 64/64 band, stays authored — the hero's visual
  continuation) → `02-why` → `03-teams` → `04-hiring` (grey band) → `05-roles` →
  `06-contact` → `07-cta` (grey closer); all six chapters 158.4/158.4.
- Joins: `02`/`03`/`06` transparent (one white ground from the strip through teams and
  contact); `04`/`05`/`07` keep the whisper hairline `rgba(18,19,23,0.043)` (grey band
  surfaces). Authored `border-t border-[#dadce0]` on contact + CTA and all authored
  paddings removed — the bridge owns the rhythm now.
- Grey bands authored `#f5f5f7` (hiring was `#f8f9fa`; the closing CTA was a white
  bordered section → grey closer, matching the partners/contact closers).

### Chrome → premium vocabulary
- Page root gains `page-careers`; desktop rail + mobile rail hairline `#dadce0` →
  `rgba(18,19,23,0.12)` (single `C.line` token); active rail item `#e8f0fe` tint →
  grey-fill `#f5f5f7` + `#0b57d0` glyph+label (blue-tint flattening law); hover is a
  text shift now (a grey hover under a grey active would read as two selections).
- Hero card: shadowed `rounded-2xl` (16) + corner curve + floating submit → white
  `rounded-[30px]` with soft float shadow `0 20px 50px rgba(18,19,23,0.16)`; fields
  `#dadce0`-bordered white pills → borderless grey-fill `#f5f5f7` pills (white on
  focus + blue ring). The select had `appearance-none` with no replacement arrow — a
  custom down-chevron affordance was added (real usability gap). Submit → in-flow ink
  pill (h-48, ArrowUpRight; the `pb-24` dead space removed), authored `text-[16px]` so
  the hero tier computes 16/500/24 exactly like "Start learning" / "See how it works".
- Why cards: shadowed white 12 → white `rounded-[20px]` inside a grey tray `30`; 44px
  `#e8f0fe` circles → grey-fill `h-12 w-12 rounded-[14px]` + `#0b57d0` glyph.
- Teams cards: shadowed photo cards `rounded-[24px]` → white `rounded-[20px]` in the
  tray; titles had collapsed to 17/600 (authored 21 in the card-name list) →
  re-authored `text-[28px]` → 28/600/32 (partners slide-title fix); "Introduce
  yourself" link `#4285F4` 15/medium → quiet chevron link; corner curves removed, the
  plain `ArrowRight` /about gesture kept (content preserved).
- Hiring band: story photo given `rounded-[20px]` (was square full-width); step-list
  hairlines `#dadce0` → `rgba(18,19,23,0.12)`; step numerals `#4285F4` → `#0b57d0`
  (14/500 kept — probed).
- Roles card: shadowed white 12 → white `rounded-[20px]` inside a grey tray `30`;
  circle icon → grey-fill tile; statement had collapsed to 17/600 (authored 24) →
  re-authored `text-[28px]` → 28/600/32; both links → quiet chevron links (mailto +
  in-page `#hiring` scroll kept).
- Contact: h2 rides the 28/600 compact tier; inline links `#4285F4` persistent
  underline → `#0066cc` + hover underline.
- Closer: white bordered section → grey `#f5f5f7` band; blue pill → ink pill h-48
  (ArrowUpRight); outlined "About Visionary" pill → quiet chevron link.

### Verified
- Sections table: `01-hero` 0/0 exempt; strip 64/64 authored; `02`–`07` 158.4/158.4;
  joins 02/03/06 transparent `rgba(0,0,0,0)`, 04/05/07 whisper `rgba(18,19,23,0.043)`.
- Type re-probe: h1 76/400/-3.42; chapter h2s 64/600/68; leads 24/600/28; why/hiring
  h3s 28/600/32; teams + roles statements 28/600/32 (were collapsed 17/600); copy
  17/400; step numerals 14/500 `rgb(11,87,208)`; quiet links 17/400 `rgb(0,102,204)`
  h-44; hero submit 16/500/24 (approved hero tier, differential probe); CTA pill
  17/400/20 h-48 `rgb(18,19,23)` — computed-identical to the approved /contact pill.
- Chrome re-probe: hero card white 30; fields grey-fill pills h-48 border 0; select
  chevron present (2 — one per card instance); tiles 48px grey-fill + `rgb(11,87,208)`
  (radius 12 via the bridge remap); trays grey `#f5f5f7` 30 with white 20 cards; rail
  96px hairline `rgba(18,19,23,0.12)`, active grey-fill + `rgb(11,87,208)`.
- Interactions (live): rail anchor click scrolls `#teams` into view; roles "How our
  process works" scrolls `#hiring`; 9 mailto links carry subjects; no page errors
  (dev-backend 500 baseline only).
- Page height 6471 → 7535 desktop @1440; 10019 mobile @390; overflowX 0.
- Gate: `eslint` clean → `tsc` both configs clean → `vite build` clean → 527/527 tests.
- Evidence: `dom/careers.json` (before), `captures/before/careers-before-seg00..08.jpg`,
  `captures/after/careers-after-seg00..09.jpg`,
  `captures/after-mobile/careers-after-mobile-seg00..13.jpg`.

### Open items (not defects, noted)
- Why/teams statement h3s ride the 28/600 feature tier — same escape decision the
  user approved on partners slide titles and the contact officer name.
- The photo strip stays unmarked (no chapter air): it reads as the hero's visual
  continuation; mark it `data-section` if it should stand as its own chapter.
- Teams cards keep both affordances (mailto quiet link + /about arrow) — both existed
  in the source; the arrow is restyled plain.
- Rail labels stay 12px (the rail lives outside `#main`, so the adapter never touches
  it) — kept as the rail's own compact grammar.
- All careers routes are mailto by design (content preserved); the enquiry form opens
  a prefilled email draft rather than submitting to a backend.

## 08 · `/research` — `ResearchNewsPage.jsx` — DONE (awaiting user review)

### Chapters (bridge rhythm)
- Ten sections marked: `01-hero` (exempt), `02-mission`, `03-quote`, `04-latest`
  (#latest), `05-areas` (#areas), `06-projects` (#projects), `07-domains`,
  `08-origin` (#origin), `09-responsible`, `10-future` (#future); authored `py`
  stripped everywhere; the three authored `border-t border-[#dadce0]`
  (areas/projects/responsible) removed in favour of the bridge surface law.
- Joins (`page-research` block added to `public-bridge.css`): 02/03/04/07/08 join the
  white-ground chain transparent `rgba(0,0,0,0)`; `05-areas` + `09-responsible`
  change to grey `#f5f5f7` and keep the whisper hairline, and 06/10 keep it after them.
- Hero trimmed `pb-24/lg:pb-36` → `pb-16/lg:pb-20` so hero→mission air matches the
  converted-site hero rhythm (contact precedent).
- Page height 10718 → 12014 desktop @1440; overflowX 0.

### Chrome → premium vocabulary
- Hero chips: `border-4 border-white` + `rounded-2xl` + hard black shadow → borderless
  `rounded-[20px]` with the site float `shadow-[0_20px_50px_rgba(18,19,23,0.16)]`
  (photo chip + SpotIllustration chip; playful rotations kept).
- Mission: the 7-line 24/600 lead escaped the `h2 + p` promotion → body 17/400
  (wrapper div); dark panel `rounded-3xl` → `rounded-[30px]`; the "I am your
  Intelligence." statement was a `p` computing 17/400 → converted to `h3` → 28/600/32;
  chips unified to `border-white/15 bg-white/5`.
- Quote band: `rounded-3xl` → `rounded-[30px]`; quote `p` 17/400 → `h3` 28/600/32;
  avatar `bg-[#4285F4]` → `bg-white/15`.
- Latest: header pills → quiet chevron links; grid → grey tray 30 (`p-4/6/8`) with
  `gap-3`; cards `rounded-2xl g-card` + tinted illustration header → white
  `rounded-[20px]` borderless (illustration floats on white); meta "Learn more" →
  quiet chevron link h-44; date stays 14/400.
- Areas: band `#f8f9fa` → `#f5f5f7`; tinted photo mats (`#e8f0fe`/`#f8f9fa`) →
  white `rounded-[30px]` mats; role eyebrows `#4285F4` → grey `#5f6368`; CTAs → quiet
  chevron links; item icon tiles → white `rounded-[14px]` 56px on the grey band;
  inverted tags (`p.uppercase` 17/600 above 16/500 h4s) → `span` 14/600 (blue
  "In the product" / grey "Next") with h4s re-authored 17/600 — tag no longer shouts
  above its title.
- Projects: header pill → quiet link; grid → tray 30 + white 20 cards (`g-card`
  shadow dropped); titles stay the 17/600 compact tier; copy 17/400.
- Domains: panel 24 → 30; the 6-line lead escaped → body 17/400 white/70; white pill →
  white-tone quiet chevron link (first dark-surface quiet link; tone = `text-white/85`);
  chips `rounded-2xl` → `rounded-[12px]`.
- Origin: the three paragraphs under h2 wrapped → uniform 17/400 body; TextLinks →
  quiet chevron links (mailto kept); plaque card `rounded-2xl g-card` → grey `#f5f5f7`
  `rounded-[30px]`; eyebrow → grey `#5f6368`; "01" chip `#e8f0fe` → white; quote
  17/400 → `h3` 28/600/32; card hairline → `rgba(18,19,23,0.12)`.
- Responsible: band → `#f5f5f7`; bare photo `rounded-2xl` → `rounded-[20px]`;
  4-line lead escaped → body 17/400; pills → quiet chevron links.
- Future: two `g-card` link cards → tray 30 + white 20 cards; the google.com corner
  curve + floating blue "Explore" pill removed → plain blue `ArrowRight` bottom-right
  with `group-hover:translate-x-1`; contact-row hairline → `rgba(18,19,23,0.12)`;
  mailto TextLink → quiet chevron link. `Pill`/`TextLink` merged into one `QuietLink`
  (light + `dark` tone).
- Sub-heading law applied: four long copies (mission 7 lines, domains 6, responsible 4,
  origin 4) escaped the mechanical second-headline promotion to uniform body; the only
  lead left is the areas chapter's designed centered sub (24/600).

### Verified
- Sections table: `01-hero` 0/0 exempt; `02`–`10` all 158.4/158.4 @1440; joins
  02/03/04/07/08 transparent `rgba(0,0,0,0)`, 05/06/09/10 whisper
  `rgba(18,19,23,0.043)`; grey bands compute `rgb(245,245,247)`.
- Type re-probe: h1 76/400; chapter h2s 64/600/68 (latest/areas/projects/domains/
  origin/responsible/future); mission h2 28/600/32; statements h3 28/600/32 (mission
  panel, founder quote, origin plaque — all were 17/400 before); areas sub 24/600/28;
  body 17/400 everywhere (including all four escaped copies); quiet links 17/400
  `rgb(0,102,204)` h-44 (domains dark tone `rgba(255,255,255,0.85)`); item tags 14/600
  (`rgb(11,87,208)` / `rgb(95,99,104)`) under 17/600 h4s.
- Chrome re-probe: trays `rgb(245,245,247)` 30 with `gap-3`; latest/projects/future
  cards white 20, no shadow; area mats white 30; item tiles 56px white radius 12
  (bridge remap); origin plaque grey 30; domains chips radius 12 border
  `rgba(255,255,255,0.15)`; hairlines `rgba(18,19,23,0.12)`.
- Captures: 15 desktop segs + 22 mobile segs reviewed — hero, mission, quote, all five
  areas, projects, domains, origin, responsible, future, footer all clean.
- Gate: `eslint` clean → `tsc` both configs clean → `vite build` clean → 527/527 tests.
- Evidence: `dom/research.json` (before), `captures/before/research-before-seg00..13.jpg`,
  `captures/after/research-after-seg00..14.jpg`,
  `captures/after-mobile/research-after-mobile-seg00..21.jpg`.

### Open items (not defects, noted)
- The three statement escapes ride the 28/600 feature tier — the same decision the user
  approved on careers whysub/teams and the contact officer name.
- Area `tint` fields remain in the data arrays but are no longer used (one-line revert
  if the tinted mats are ever wanted back).
- "Next" tags keep grey while shipped items keep blue — status colouring kept from the
  source content.
- Breadcrumb "Home › About › Research" kept as-is (shared component).
- No closer statement added: the page's own ending (future cards + research-question
  row) serves as the closer, per content preservation.

## 09 · `/community` — `CommunityPage.jsx` — DONE (awaiting user review)

### Chapters (bridge rhythm)
- Five sections marked: `01-hero` (exempt), `02-find`, `03-more` (#more), `04-faq`
  (#faq), `05-closing`; authored `py` stripped everywhere; the two authored
  `border-t border-[#dadce0]` (more/closing) removed in favour of the bridge
  surface law.
- Joins (`page-community` block added to `public-bridge.css`): `02-find` joins the
  white ground under the sticky jump bar transparent `rgba(0,0,0,0)` — the jump
  bar's own hairline is the only seam; `03-more` changes to grey `#f5f5f7` and
  keeps the whisper hairline, and 04/05 keep it after it.
- Hero `border-b` removed (the jump bar carries the hairline); hero keeps its own
  centered-communities composition with the photo strip as its visual subject.
- Page height 5592 → 6120 desktop @1440; 8782 mobile @390; overflowX 0.

### Chrome → premium vocabulary
- Hero: dek 22px `#3c4043` → the approved About-hero dek tier (`text-[17.5px]
  leading-[25px] #5f6368`, `max-w-[760px]`, `mt-8`; computes 18/400/25); actions
  `mt-10 gap-4` (About-hero rhythm); blue pill → ink pill `min-h-12 px-7
  text-[15px] tracking-[0.24px]`; outlined "Community safety" pill → quiet chevron
  link; strip wrapper `mt-6` → `mt-14`.
- Photo marquee (the queued fix): `loading="lazy"` removed — the strip is wider
  than any viewport and transform-animated, so lazy tiles sat blank until the drift
  carried them in (probe before: 13/24 unloaded; after: 0/24 desktop and mobile).
  Tiles `rounded-2xl` → `rounded-[24px]` (computes 12: the approved fan-strip
  radius via the bridge remap) with `mr-6` column gaps and `mb-5` row gap (About
  fan-strip measures).
- Jump bar: pill chips (`#dadce0` border + white fill) → borderless quiet labels
  14/500 `#5f6368` hover ink; bar hairline `#dadce0` → `rgba(18,19,23,0.12)`;
  sticky `top-14` pattern kept.
- Find: tinted circle icon chips → grey-fill `rounded-[14px]` tiles with `#0b57d0`
  icons (careers/contact tile law); card grids → grey tray 30 (`p-4/6/8`) + inner
  `gap-3`; cards `rounded-2xl g-card` with tinted illustration heads → white
  `rounded-[20px]` borderless (illustration floats on white); card h4s
  `font-medium` (17/500) → `font-semibold` (17/600); google.com corner curve +
  32px arrow wrapper removed → plain `ArrowRight` `#0b57d0` `bottom-6 right-6`
  with `group-hover:translate-x-1`.
- More: band `#f8f9fa` → `#f5f5f7`; same card conversion (white 20, white heads,
  `pb-16`, plain arrow); grid `gap-5` → `gap-3`.
- Closer: white bordered section → grey `#f5f5f7` band; blue pill → ink pill h-48
  `text-[17px]` (careers closer anatomy); outlined pill → quiet chevron link.
- Scaffold: the vestigial `{/*__AREAS__*/}` marker removed (only occurrence in
  `src`; no tooling references).

### Sub-heading law applied
- Both subs ("Keep your journey moving…", "Communities grow around real learning…")
  are designed 1–2-line centered subs under their h2 → kept as 24/600 leads (no
  escapes needed on this page).
- Hero dek dropped from display scale (22px) to the approved hero tier — it no
  longer competes with the statement.
- The playful double-arc accent beside the "Find a community" h2 kept as-is (the
  page's only doodle; reads as a quiet blue/yellow stroke pair).

### Verified
- Sections table: `01-hero` 0/0 exempt; `02`–`05` all 158.4/158.4 @1440; join
  `02-find` transparent `rgba(0,0,0,0)`, 03/04/05 whisper `rgba(18,19,23,0.043)`;
  grey bands compute `rgb(245,245,247)`; closer bottom meets the footer exactly
  (same grey; the footer keeps its own `#d2d2d7` hairline — site-wide chrome).
- Type re-probe: h1 76/400; chapter h2s 64/600/68; leads 24/600/28 (more +
  closer); area h3s 28/600/32; card h4s 17/600 (were 17/500); body 17/400
  everywhere; hero dek 18/400/25 `#5f6368`; hero pill 16/500/24 h-48
  `rgb(18,19,23)`; hero quiet link 18/400 `rgb(0,102,204)` h-44 (hero tier —
  matches About/Partners hero links); chapter quiet links 17/400 `#0066cc` h-44.
- Chrome re-probe: jump bar h-62, chips 14/500 `#5f6368` borderless, hairline
  `rgba(18,19,23,0.12)`; trays `rgb(245,245,247)` 30 with white 20 cards, no
  shadow; tiles 48px grey-fill radius 12 `rgb(11,87,208)`; arrows `rgb(11,87,208)`
  (17px computed — identical to the approved research arrows).
- Marquee: 24 tiles, 0 unloaded (was 13/24); radius 12 computed; strip width 3888
  contained by `overflow-hidden` (doc overflowX 0 at 390 + 1440).
- Captures: 8 desktop segs + 12 mobile segs reviewed — hero, jump bar, three area
  blocks, more band, FAQ, closer, footer all clean; hero fills the fold with the
  strip peeking (About-hero behaviour).
- Gate: `eslint` clean → `tsc` both configs clean → `vite build` clean → 527/527
  tests.
- Evidence: `dom/community.json` (before),
  `captures/before/community-before-seg00..06.jpg`,
  `captures/after/community-after-seg00..07.jpg`,
  `captures/after-mobile/community-after-mobile-seg00..11.jpg`.

### Open items (not defects, noted)
- Area `tint`/`iconColor` and card/item `tint` fields remain in the data arrays but
  are no longer used (one-field revert if tinted heads are ever wanted back).
- The jump bar is borderless text with no active/scroll-spy state — the source
  never had one; hover-only transitions kept.
- The marquee loads all 24 tiles eagerly (12 unique images; duplicates from cache)
  by design — the band is the hero's visual subject. If LCP ever regresses,
  `fetchpriority` on the tiles is the next lever.
- Breadcrumb "Home › About › Community" kept as-is (shared component).

## 10 · `/updates` — `UpdatesPage.jsx` — DONE (awaiting user review)

### Chapters (bridge rhythm)
- Six sections marked: `01-hero` (exempt; authored paddings kept), `02-featured`,
  `03-latest` (#latest), `04-evidence`, `05-signup` (#signup), `06-contact`; authored
  `py` and the three `border-t border-[#dadce0]` removed in favour of the bridge
  surface law.
- Joins (`page-updates` block added to `public-bridge.css`): the editorial top — the
  featured lead story, the latest listing and the evidence band — rides one white
  ground, all transparent `rgba(0,0,0,0)`; the grey signup band and the white
  contact strip change surface and keep the whisper hairline.
- `06-contact` is a strip, not a chapter — compact band
  `clamp(3.5rem, min(7vw, 10svh), 6rem)` (same as the measured problem-band
  precedent); computes 90/90 @1440.
- Page height 4351 → 5035 desktop @1440; 7935 mobile @390; overflowX 0.

### Chrome → premium vocabulary
- Hero: dek → the approved hero tier (`text-[17.5px] leading-[25px] #5f6368`,
  `max-w-[760px]`, `mt-8`; computes 18/400/25); actions `mt-10 gap-4`; blue Bell
  pill → ink pill `min-h-12 px-7 text-[15px] tracking-[0.24px]` (Bell dropped);
  outlined pill → quiet chevron link "Browse the latest" (`#0066cc`, computes
  18/400 — hero tier). Eyebrow class already identical to partners (kept).
- Featured banner: `#e8f0fe` `rounded-[28px]` → grey `#f5f5f7` `rounded-[30px]`
  (tray tier — tray radius is not remapped); chips ("Featured"/"Languages &
  access") → plain 14/600 tags, blue + grey (the research tag grammar); illustration
  mat `bg-white/80` `rounded-[28px]` → solid white `rounded-[20px]`; google.com
  corner curve + ArrowUpRight wrapper removed → inline quiet chevron link "See how
  the loop works" under the date.
- Latest: filter chips (border + white fill) → borderless: active ink fill,
  inactive grey-fill `#f5f5f7` (computes 14/500); grid → grey tray 30
  (`p-4/6/8`) + inner `gap-3`; cards `rounded-2xl g-card` (r16 + shadow) → white
  `rounded-[20px]` borderless `p-6`; meta chips → plain tags 14/600 `#5f6368` +
  dates 14/400 `#9aa0a6` → `#86868b` (house tertiary); corner SpotIllustrations
  kept — the bleed clips inside the 20 radius.
- Evidence band: same banner conversion (grey 30 tray, solid white circle mat,
  corner curve → quiet chevron link "Read Research & News").
- Signup: band `#f8f9fa` → `#f5f5f7`; toggle rows: divider `#dadce0` →
  `rgba(18,19,23,0.12)`, hover `#f8f9fa` → `#f5f5f7`; tiles → uniform grey-fill
  `#f5f5f7` + `#0b57d0` icons (state carried by the dot, not the tile); dots
  checked → ink fill `#121317` + white check; row labels 17/500 → 17/600; form card
  `rounded-2xl g-card` → white `rounded-[20px]`; labels → 14/400 `#5f6368`;
  inputs → careers grey-fill `rounded-full` h-12 with `focus:bg-white`; "You will
  receive" → 14/400 grey; receive chips → borderless grey-fill (hover `#e8e8ed`);
  consent `accent-[#121317]`; submit blue pill → ink pill h-12 px-8 (careers submit
  anatomy); success tile tint → grey-fill r12; success h3 `text-[24px]` (collapsed
  to 17/600) → `text-[28px]` statement tier; "Change your preferences" → quiet
  chevron link; Privacy Policy link → `#0066cc` with hover underline.

### Sub-heading law applied
- Featured copy (4 lines) and evidence copy escaped the `h2 + p` lead promotion via
  wrapper divs → body 17/400 `#5f6368` (both banners read as cards, not second
  headlines); the two escaped runs were also the page's only 24/600 copies.
- Latest + signup leads stay designed 24/600/28 chapter subs (1–2 lines @1440,
  kept per the law). Hero dek dropped from display scale to the hero tier.
- Featured date (a `p`) computes 17/400 while card dates compute 14/400 (span law) —
  the lead story's meta reads one step above the list meta; noted below, not a
  defect.

### Verified
- Sections table: `01-hero` exempt; `02`–`05` 158.4/158.4, `06-contact` 90/90;
  joins `02/03/04` transparent `rgba(0,0,0,0)`; `05-signup` + `06-contact` whisper
  `rgba(18,19,23,0.043)`; signup computes `rgb(245,245,247)`.
- Type re-probe: h1 76/400; featured/evidence h2 28/600/32; latest/signup h2
  64/600/68; latest/signup leads 24/600/28; tag spans 14/600 (blue `rgb(11,87,208)`
  / grey); card dates 14/400 `#86868b`; card h3s 17/600; body 17/400 everywhere
  incl. both escaped copies; hero dek 18/400/25 `#5f6368`; hero quiet link 18/400
  `#0066cc` h-44; chapter quiet links 17/400 `#0066cc` h-44.
- Chrome re-probe: banners `rgb(245,245,247)` r30 with white r20 mat; latest tray
  r30 with white r20 cards, no shadow; chips 14/500 (ink fill / grey-fill); toggle
  tiles `rgb(245,245,247)` + `rgb(11,87,208)` icons; dots `rgb(18,19,23)`; inputs
  `rgb(245,245,247)` r9999 h-48; submit 17/500 h-48 `rgb(18,19,23)`.
- Success state exercised live (fill → submit): h3 28/600/32 (#1d1d1f), tile
  grey-fill r12, "Change your preferences" quiet link 17/400 `#0066cc` h-44,
  submit replaced.
- Captures: 7 desktop segs + 11 mobile segs reviewed — hero, featured, tray (8
  cards), band, signup, privacy line, compact contact strip, footer all clean.
- Gate: eslint clean → tsc both configs clean → vite build clean → 527/527 tests.
- Evidence: `probe-updates-before.json` / `probe-updates-after.json`,
  `captures/after/updates-after-seg00..06.jpg`,
  `captures/after-mobile/updates-after-mobile-seg00..10.jpg` (before segs
  `captures/before/updates-before-seg00..05.jpg`).

### Open items (not defects, noted)
- The featured "September 2026" date computes 17/400 (a `p` under the body law)
  while card dates compute 14/400 — the lead story's meta reads one step above the
  list meta, matching the original hierarchy.
- The hero is text-only (no strip): the featured banner sits as its own chapter
  after the hero, unlike About/Community where a strip fills the fold.
- Breadcrumb "Home › How it works › Updates" kept as-is (shared component).
