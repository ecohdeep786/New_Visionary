# Landing v14 — one grammar: the front-door alignment (landing only)

Date: 2026-10-20. Founder's question: *what if the "who it's for" heading and sub
heading show in centre with a large heading size, and the second (problem)
section does — and how would the card section be improved to match Apple's
premium section, and all other sections, to make a full-page premium vibe?*

## 1 · R&D: Apple's alignment grammar, measured live

`v14` probe: every h1/h2/h3 on apple.com, /watch/, /in/education/,
/in/education-initiative/, /apple-vision-pro/ at 1440 — size, alignment, line count.

| page | statements | alignment |
| --- | --- | --- |
| **apple.com** (front door) | "iPhone Duo" 56 · "iPhone 18 Pro" 56 · **"Endless entertainment." 56** (the card gallery) · grid card titles 40 | **center — every one** |
| apple.com/watch | "Apple Watch" 80 · "Explore the lineup." 48 | start |
| apple.com/in/education (page-level) | "Designed for every kind of learner." 64 · "Education that's a grade ahead." 80 | **center** |
| apple.com/in/education (chapters) | "From grade school to grad school." 48 · "Real stories. Real impact." 48 · "How to Buy." 48 · "Our values lead the way." 48 | start |
| education-initiative | the story chapters 64 | left |
| vision-pro | "Take a closer look." 56 · "Explore Apple Vision Pro accessories." 56 | left |

**Law:** alignment on Apple is a *grammar*, not a mix. A **front door** (apple.com,
the education page's page-level bands) centres every statement; an **editorial
page** (education-initiative, vision-pro's gallery) left-aligns every statement.
Our landing is a front door, and it was mixing the two — the band and the promise
centred, the story, return, journeys, suite and trust left-aligned. That mix is
what stopped the page reading as one system.

**Apple's premium card law** (measured on apple.com/in/education): white cards,
**radius 28**, **40px padding**, **title 28**, **body 17 on a 25px line**, a 17px
**"Learn more" in #0066cc** with a chevron, the media full-bleed on the card's
top, and the **icon bare on the card** (no circle well).

## 2 · Built (landing only; copy preserved)

**The founder's call, applied exactly:** centre the "Who it's for" section and the
problem section — the rest of the page stays as the previous version was.

1. **"Who it's for" → centred, 56px** (apple.com's card-gallery tier, 48 → 56),
   with its 17px eyebrow and its 21px intro centred with it. The rail of five
   journey cards is untouched.
2. **The problem chapter centres** its eyebrow, its 64px statement and its 24/600
   lead — Apple's front-door statements are centred 64–80 — while the story card
   below stays the object.
3. **Every other chapter keeps the previous version's alignment and size**: the
   band (56, centred), the promise (48, centred), the return's quote (48,
   left, 500 — the founder's own line, unaltered), the suite (48, left) and the
   trust statement (64, left).
4. **The card sections still take Apple's premium card law** (the founder's
   second ask — "how the card section would design improvement to match with
   apple premium section"): the trust's values cards take **radius 28, 40px
   padding and bare 32px icons** (Apple's values icons sit bare on the card —
   the circle wells are retired) with 28px titles, 17px bodies and the blue
   "Learn more"; the suite's tiles take radius 28 and a 20px media well.
   (The bridge hijacks the literal `rounded-[28px]` utility to 12px — the site's
   escape is `rounded-[1.75rem]`, which the return cards already use; the trust
   and suite cards now use it too, so all our value cards read 28px.)

## 3 · As built (measured)

| | v13 | v14 |
| --- | --- | --- |
| chapter alignment | band + promise centred, five chapters left | the journeys + the problem centred; the rest as before |
| journeys heading | 48 left | **56 centred** (Apple's gallery tier) |
| suite heading | 48 left | unchanged (48 left) |
| return quote | 48 as a paragraph | unchanged (48, left, 500) |
| trust cards | radius 20, p-24/28, circled icons | **radius 28, p-40, bare 32px icons** |
| docH @1440 | 9,148 | **9,204** |

Landing: docH **9,204** @1440 / 8,833 @1024 / 9,998 @834 / 11,133 @390 — **zero
horizontal overflow 375–1920**; console only the two pre-existing entries; a full
scroll walkthrough at 1440 and 390 in `walk/`.

**Other pages untouched**: `/student` 12,970 · `/teacher` 13,090 · `/parent`
13,118 · `/professional` 13,113 · `/organization` 13,381 — identical (explore 64,
band 80, trust 72, CTA 72, hero 79.9, nav 14px). The centring is opt-in
through the landing's own props; the persona line-ups keep their accepted header.

Gate: `scope:audit:write` (68 / 26 / **1,649**) → eslint clean → both
typechecks clean → vite build clean → **532/532 tests**.

**Final statement ladder (measured live in the review tab):** 64 hero · 56 band ·
64 problem · 48 promise · 48 return quote · 56 journeys · 48 suite · 64 trust ·
56 closer — the journeys and the problem centred, every other chapter exactly as
the previous version was. 38 doors in `main`; no overflow.
