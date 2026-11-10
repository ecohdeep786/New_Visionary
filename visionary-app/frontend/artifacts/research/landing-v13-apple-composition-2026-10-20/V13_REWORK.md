# Landing v13 — Apple's band anatomy: the media IS the band's floor (landing only)

Date: 2026-10-20. Founder's ask: the product still did not match Apple's breathing
and layout; the landing must look very premium, match our product, and make the
user excited to know more and explore every page — because Apple and Google are
obsessive about the landing page, and that is why they play a role in every
user's life. "Think and do R&D as an Apple engineer in our product."

v12 matched Apple's *numbers*. v13 measured Apple's **band anatomy** — how a band
composes type, media and doors — and rebuilt our bands on it.

## 1 · R&D: Apple's band anatomy, measured live

`apple-band-anatomy.json` (apple.com, /in/education-initiative/, /apple-vision-pro/
at 1440 and 390) — per band: the type block's offsets, the media's insets and
bleeds, the door anatomy, the surface sequence.

| Apple band (1440) | height | type | media | doors |
| --- | --- | --- | --- | --- |
| apple.com hero | 2,100 | H56 @56, sub 28 @122 (gap 6) | **3,008 wide — bleeds L/R, overflows the viewport** | 2 (Learn more + Buy, 44px pills) |
| apple.com gallery | 957 | H56 @53 | 930×523 | 1 |
| education-initiative story | 953 | H64 @0, sub 24 @155 (gap 19) | 980×516 on the spine, **181px of air below** | 0 |
| education-initiative router (grey) | 1,953 | H64 @140, sub 21 | 475×300 white card | 5 "Learn more" |
| education-initiative values | 598 | H64 @140, sub 19 @306 | none | 4 "Learn more" (20px) |
| vision-pro "Take a closer look." | 2,129 | **H56 @1092** (the statement sits BELOW the media) | 1,440×848 **full-bleed L/R** | 0 |
| vision-pro closing | 1,727 | H56 @263, sub 24 | 637×440 | 1 (Shop) |

Laws taken:

1. **A band is a scene, not a container.** In the big media bands Apple's media
   bleeds to the band's edges and the band ENDS on the media (apple.com's product
   stages end on the product; vision-pro's gallery media is 1,440 wide — the full
   viewport). Our mark floated as an inset 560px card with 140px of dead air
   below it: the band's biggest object was a card, not the product.
2. **The media is the band's floor.** The mark now floats on the band's own
   ground (its canvas tone dissolved into the band — no card, no seam) at 820px,
   and the band ends on it.
3. **Values anatomy, measured on apple.com/in/education**: white cards,
   **radius 28, title 28, body 17 on a 25px line, a 17px "Learn more" in
   #0066cc** — our cards carried a 19px body and the trust chapter wore a grey
   panel (the Watch close-card) instead of a values row.
4. **The statement can sit below the media** (vision-pro: H56 at 1,092 of a
   2,129 band) — Apple's band is a composition, not a fixed template.

## 2 · Built (landing only; copy preserved)

1. **The product band is now a scene**: the mark floats on the band's own ground
   (`surface="var(--scene-ink)"` — no card, no seam), grows 560 → **820**, and
   the band ends on it (padding 140/**0**). Band 1,340 → **1,200** tall.
2. **The trust chapter is now Apple's values row** (new landing-only
   `variant="cards"`): a 64px statement + 19px lead, then four **white cards on
   the grey floor** — mark well, **28px title, 17px body, 17px blue "Learn
   more"** each. The grey close-card panel is gone; the persona pages keep
   their own anatomy.
3. **New measured type role `card-body`** (17/25) — Apple's values-card body
   tier. The landing's value cards read it; the persona values columns keep
   19/23.
4. **The story card matches Apple's story media**: 980×**516** (education's
   story media is 980×516).
5. The journeys rail keeps 372px cards — that width *is* Apple's measured
   Watch line-up card (the v10 study's 372px), so it stays.

## 3 · As built (measured)

| | v12 | v13 | Apple |
| --- | --- | --- | --- |
| product band | 1,340, inset 560 card, 140 air below | **1,200, mark 820 on the ground, band ends on it** | media bleeds, band ends on the media |
| trust chapter | grey panel, 4 icon values | **values row: 4 white cards, 28/17, Learn more** | 407×351 white cards, 28/17, Learn more |
| value-card body | 19px | **17px / 25** | 17px |
| story card media | 440 | **516** | 516 |
| docH @1440 | 9,259 | **9,148** | — |

Landing: docH **9,148** @1440 / 8,793 @1024 / 9,934 @834 / 11,044 @390 — **zero
horizontal overflow 375–1920**; console only the two pre-existing entries; a full
scroll walkthrough at 1440 and 390 in `walk/`.

**Other pages untouched**: `/student` 12,970 · `/teacher` 13,090 · `/parent`
13,118 · `/professional` 13,113 · `/organization` 13,381 — identical to their
pre-v12 numbers (explore 64, band 80, trust 72, CTA 72, hero 79.9, nav 14px).

Gate: `scope:audit:write` (68 / 26 / **1,649**) → eslint clean → both
typechecks clean → vite build clean → **532/532 tests**.
