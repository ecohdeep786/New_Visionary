# Landing v12 — Apple's own layout, measured and mirrored (landing page only)

Date: 2026-10-20. Founder's ask: go to the given Apple pages in the browser, check
**each layout, design, margin, padding, breathing, section and device layout**,
then come back to our landing page and make its layout, position, spacing and
margins match — and its design match our product in Apple's premium language.
Student page used as a read-only idea source. **Landing only** — no other page
is touched.

## 1. The Apple study (live, measured)

`apple-layout-spec.json` — apple.com, apple.com/in/education-initiative/,
apple.com/apple-vision-pro at 1440 / 1024 / 834 / 390 (bands, padding, spine,
gutters, card anatomy, type).

| Apple law (measured) | Evidence |
| --- | --- |
| Chapter breathing **140/140** at 1440, **122/130** at 1024–834, **120/120** at 390 | education-initiative `section-router` (pt140/pb150 → 122/130 → 122/130), `section-values` (140/140 → 140/140 → 120/120) |
| **Editorial spine 980** (gut 230 at 1440) for statements + the story card | `section-router` spine 980 → 692 → 315 |
| **Card rows 1264** (gut 88 at 1440) | education values row x=88→1352; vision-pro "Take a closer look." = 2 columns of ~620 |
| Product band title **56** (48 / 32) | apple.com hero 56/48/48/32; vision-pro bands 56 |
| Story chapter **64/68** + 24/600 lead | education-initiative story sections (64, sub 24/600) |
| Card chapter **48/52** (40/44, 32/36) | education "Real stories.", "Our values lead the way.", "How to Buy." |
| Black statement band **48** | education "From grade school to grad school." (48, band 771px) |
| Closing band **56** | vision-pro final statement band |
| Global nav **48 tall, 12px labels, ~1024 container** | apple.com globalnav |
| Card row anatomy: title 24–28, body 17, radius 18–28, 40px padding | education values cards |

## 2. Our landing as v11 built it (measured)

`our-layout-spec.json` / `our-type-spec.json`.

| | ours @1440 | Apple | gap |
| --- | --- | --- | --- |
| chapter breathing | 158.4 | 140 | +18 |
| tablet / phone breathing | 112.6 / 96 | 122/130 · 120 | −10 / −24 |
| hero title | 80 | 56–64 | +16–24 |
| product band title | 80 | 56 | +24 |
| black band (promise) | 64 | 48 | +16 |
| trust / CTA titles | 72 / 72 | 64 / 56 | +8 / +16 |
| card row content | 1105 | 1264 | −159 |
| suite grid | 2×2 | 4-up row | wrong anatomy |
| nav | 56 tall, 14px labels, 1240 frame | 48, 12px, 1024 | +8 / +2px / +216 |
| audience rail | 14px | 12px | +2 |

## 3. Built (landing only)

1. **Breathing → Apple's rhythm** (landing-scoped in `public-bridge.css`):
   140/140 desktop, 122/130 tablet, 120/120 phone. The hero and the black
   promise screen keep their own stages.
2. **Type ladder → Apple's measured tiers** (new public role `product-band`
   56/60 · 48/52 · 32/36; `card-chapter` 48 · `section` 64):
   hero 80 → **64**; product band 80 → **56**; promise 64 → **48**;
   trust 72 → **64**; CTA 72 → **56**; story 64 · values 48 · line-up 48 stay.
   One 64 statement per page, the way Apple paces a page.
3. **Card rows → Apple's 1264 content** (gut 88 at 1440): the return, the
   journeys rail and the suite all ride `max-w-[1312px] px-6` (content 1264).
4. **Suite → Apple's accessory anatomy**: one row of four white tiles (like
   "Explore Apple Vision Pro accessories."), not a 2×2 block.
5. **Chrome**: Apple-sized nav labels (12px) and Apple's ~1024 nav frame,
   landing-scoped; the audience rail drops to Apple's measured 12px row.
6. **Return cards**: 2-up in the 1264 row = ~620 each, the same two-column
   large-card geometry as vision-pro's "Take a closer look.".

## 4. Untouched (by the founder's instruction)

Student, teacher, parent, professional, organization pages and every other
public route: no code path changes their output. The shared modules
(`PremiumIntelligenceSection` promo branch, `PremiumTrustSection`,
`PremiumCTASection`, `PremiumExploreSection`) gain **optional** props the
landing alone passes; the landing-only `promo` and `cast` branches are used by
the landing only. Verified after the build.

## 5. As built (measured after the change)

| | before | after | Apple |
| --- | --- | --- | --- |
| hero statement | 80 / 56.8 / 46.3 / 42 | **64 / 56.8 / 46.3 / 42** | 64 / 56 / 46 / 40 |
| product band | 80 / 64 / 64 / 40 | **56 / 48 / 48 / 32** | 56 / 48 / 48 / 32 |
| promise (black band) | 64 / 56 / 56 / 40 | **48 / 40 / 40 / 32** | 48 / 40 / 40 / 32 |
| trust chapter | 72 / 56 / 56 / 40 | **64 / 56 / 56 / 40** | 64 / 56 / 56 / 40 |
| closer (CTA) | 72 / 56 / 56 / 40 | **56 / 48 / 48 / 32** | 56 / 48 / 48 / 32 |
| story / values / line-up | 64 / 48 / 48 | unchanged | 64 / 48 / 48 |
| chapter breathing | 158.4 · 112.6 · 96 | **140 · 122/130 · 120** | 140 · 122/130 · 120 |
| card-row content | 1105 | **1264** (gut 88) | 1264 (gut 88) |
| suite grid | 2×2 | **4-up row** | 4-up accessory row |
| audience row | 14px | **12px** | 12px |
| nav | 56 / 14px / 1240 | 56 / **12px / 1024** | 48 / 12px / ~1024 |

Verification: docH **9,259 @1440** (9,668 before), 8,878 @1024, 10,043 @834,
11,009 @390; **zero horizontal overflow 375–1920**; console only the two
pre-existing entries (/api/auth/me 500 — no dev backend; the React
`fetchPriority` warning); a full scroll walkthrough at 1440 and 390 in
`walk/`.

Persona pages re-measured at 1440×844 against their pre-v12 numbers:
`/student` 12,970, `/teacher` 13,090, `/parent` 13,118, `/professional` 13,113,
`/organization` 13,381 — **identical**, with explore 64, band 80, trust 72,
CTA 72, hero 79.9 and 14px nav labels unchanged.

Gate: `scope:audit:write` (68 / 26 / **1,645**) → eslint clean → both
typechecks clean → vite build clean → **532/532 tests**.

