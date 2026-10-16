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
