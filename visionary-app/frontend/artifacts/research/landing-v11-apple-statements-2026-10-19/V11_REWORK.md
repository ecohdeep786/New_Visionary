# Landing v11 — the story chapter, the values chapter, and the card-chapter tier

Date: 2026-10-19. Founder's review of v10 (verbatim):

> "the 'Why visionary exists' section is not match with apple premium design because
> if you see the heading and sub heading and then see the image and then text that
> all overall section is looking a text heavy and apple never design like this and
> also 'What you get' section and also you can check 'Who it's for' sections's
> heading size. think as apple engineer and designer and make this page to fi these
> to make this page to apple premium match."

Three targets: the problem chapter's text-heavy heading→sub→image→text stack, the
"What you get" chapter, and the "Who it's for" heading size.

## 1. R&D — Apple's tiers measured at four widths

New probe: `artifacts/research/landing-v11-apple-statements-2026-10-19/apple-statements.json`
(1440) + `apple-heading-breakpoints.json` (1024/834/390), plus the v10 filmstrips.

| Apple chapter | 1440 | 1024 | 834 | 390 | structure |
| --- | --- | --- | --- | --- | --- |
| education "Real stories. Real impact." | 48/52 | 40/44 | 40/44 | 32/36 | statement, no sub, story cards |
| education "Our values lead the way." | 48/52 | 40/44 | 40/44 | 32/36 | statement, no sub, white cards |
| education "How to Buy." | 48/52 | 40/44 | 40/44 | 32/36 | statement + 21/400 intro |
| education-initiative "Our work in education doesn't end here." | 64/68 | 56/60 | — | 40/44 | statement + 24/600 lead + white card |
| vision-pro "Take a closer look." | 56/60 | 48/52 | — | 32/36 | statement + media cards |
| vision-pro "Explore Apple Vision Pro accessories." | 56/60 | 48/52 | 32/36 | 32/36 | statement + 24/400 intro + cards |

Laws taken:

1. **Story chapters open at 64** with a 24/600 lead, left-aligned on the editorial
   spine, and the story itself is **one object** (Apple: one white card with media
   left / text right on the grey ground — the initiative's "Our work in education
   doesn't end here." anatomy). A centered heading above a split image/quote reads
   as a blog intro, not Apple.
2. **Card chapters open at 48**, not 64 (Education's values/stories/How to Buy all
   land on the same tier). An intro, when present, is a 19–21/400 body line, not a
   24/600 lead.
3. **Accessory rows** (Vision Pro) sit at 56; our suite reads with the values row,
   so it takes the same 48 card-chapter tier as the journeys line-up.

Current landing as v10 built it: problem h2 **72** (the adapter promoted the clamp
to the display token), explore h2 **64**, suite h2 **64** (the adapter default
overrode the 44px clamp), return quote **53.3**, return cards **264px wide, 4-up**
(5-line copy columns).

## 2. Built (landing-only; copy preserved)

### 2.1 Problem (02) — the story chapter

- Ground becomes the measured **#f5f5f7 story band**; the chapter opens left on
  the 980 editorial spine: 17px eyebrow ("Why Visionary exists"), statement at the
  **64/56/56/40** story tier (`data-type="section"`), 24/600 lead, one line.
- The story is now **one white 28px card**: portrait left (bleeds on the card's
  white field; the studio-white mask dissolves into the card), quote + persona on
  the right panel; the pager moves to **Apple's control row below the card**,
  left-aligned. The section keeps the shared chapter rhythm — the v8 compact-band
  override is retired.
- Result @1440: section 1,033 → **1,065**; card 980×440; statement two lines; sub
  one line; no stacked image-over-text block.

### 2.2 "What you get" (04) — the values chapter

- Founder quote: **53.3 → 48 / 41 / 33.4 / 32** (Education's 48 statement tier,
  natural wrap), attribution unchanged.
- Four returns become **two broad cards per row** (545px each @1440) instead of
  four 264px columns; **28px feature titles** (`data-type="feature"`, Apple's
  values h3 tier) over 19/23 copy; cards stay `#f5f5f7` / 28px / doors pinned.
- The five-journey route line **moves to the closing CTA** (the tail mini-router)
  so the return chapter ends on its cards; the copy is unchanged, one line lower
  on the page (flagged below).
- Result @1440: section 990 → **1,238**; cards 2×2, each title one line, copy two.

### 2.3 "Who it's for" (13) + suite (14) — the card-chapter tier

- New measured public role **`card-chapter`**: 48/52 · 40/44 · 32/36
  (`--fs-card-chapter` / `--lh-card-chapter`, tokens in `rhythm.css`; role in
  `apple-typography.css` inside the explicit-role layer so the gallery adapter
  cannot re-promote it).
- Explore heading: **64/56/56/40 → 48/40/40/32**; its intro drops from 24/600 to
  **21/400** (`editorial-body`), the measured card-chapter intro tier.
- Suite heading: **64/56/56/40 → 48/40/40/32** — the sibling card chapter now
  matches the journeys row instead of towering over it.
- The shared explore module gains the optional `headingRole` / `subRole` props;
  the five persona pages pass neither, so their line-ups keep the accepted
  64/56/40 gallery tier (verified).

## 3. Verification

- Landing (Playwright/msedge): docH **9,668 @1440** (v10 9,496), 8,855 @1024,
  9,481 @834, 10,365 @390, 10,348 @375; **zero horizontal overflow 375–1920**.
- Computed tiers: problem 64/56/56/40; explore 48/40/40/32; suite 48/40/40/32;
  return quote 48/41/33.4/32; return cards 545 @1440 (2×2) / 424 / 385 / 342;
  h3 28/24/24/21.
- Structure @1440: hero white → intelligence dark → problem **#f5f5f7** → promise
  dark → return white → explore+suite #f5f5f7 → trust white → CTA dark.
- Persona pages unchanged: `/student`, `/teacher`, `/parent`, `/professional`,
  `/organization` explore h2 = **64 @1440 / 40 @390**, no overflow.
- Gate: `scope:audit:write` (68 routes / 26 endpoints / **1,645** declarations) →
  eslint clean → both typechecks clean → vite build clean → **532/532 tests**.

Evidence: this folder (`apple-statements.json`, `apple-heading-breakpoints.json`,
`verify/v11-verify.json`, `verify/v11-persona-edge*.json`, verify crops).

## 4. Flags for the founder

1. **Route line moved** — "See how it works for Students · Teachers · Parents ·
   Professionals · Organizations" now sits under the CTA's actions (same words,
   same links). It left the return chapter so the values cards end that chapter;
   the five journeys are also the next section's cards and the hero rail.
2. **Problem band is grey** — the white story card needs the measured Apple
   ground; the section also takes the shared chapter rhythm (its old compact band
   is retired), so the page grows ~170px at 1440.
3. **Suite heading is smaller** — it was effectively 64 on desktop (adapter
   default), now the measured 48 card-chapter tier, matching "Who it's for".
4. **Persona line-ups stay at 64** — only the landing opts into the card-chapter
   role; if he wants the five persona pages to match, it is one prop each.

No fake stats or screenshots were introduced; every word of existing copy is
preserved (the route line moved). No commits — the founder holds version commits.
