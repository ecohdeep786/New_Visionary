# Flow study — how Apple and Google format a page, and what `/` changed (2026-10-19)

Third R&D pass. The founder's brief: after a calm hero, the page turns into
text and the visitor never learns what the product is; "not a fully apple
design premium way to format". This pass measures **formatting and flow** —
not content, not interaction. Evidence captured live at 1440×900 with
Playwright/msedge. Raw data: `flow-study.json`; filmstrips: `*-seg*.jpg`.

## Method

Per section (top-level story blocks), measured at 1440:

- height in viewports (`vhShare`), word count (`innerText`), largest rendered
  type size, media area/count (img/video/svg/canvas), sticky descendants,
  computed ground colour, plus document height.

Sites: `apple.com`, `apple.com/iphone/`, `google.com`, `about.google`, and
`/` (before the rework). The filmstrip samples every 800px.

## The numbers

| | Apple home | Apple /iphone/ | Google home | About Google | `/` v5 (before) |
| --- | --- | --- | --- | --- | --- |
| Document height | 13,471px (15.0 vh) | 17,349px (19.3 vh) | 900px (1.0 vh) | 4,415px (4.9 vh) | 8,661px (9.6 vh) |
| First section | 2,100px · 37 words · 7 media · 56px type | 367px · 22 words · 8 media · 80px type | the search box — one action | 158 words over the lead module | 844px · 19 words · 5 media |
| Second section | 1,764px · 78 words · 13 media | 950px · 20 words · 4 media · 1 sticky | — | card list · 36 words | 1,247px · 49 words · 1 media |
| Story before commerce | the product cards are the hero | hero + priority router = **1,317px / 1.46 vh / 42 words / 12 media** | — | ~40 words per viewport | **3,601px / 4.0 vh / 167 words / 1 portrait** |
| Statement screen | 56px headings inside media worlds | 80px hero, 56px chapter | — | 36–56px display | the promise = **325px / 0.36 vh / 9 words / 0 media** |
| Words per story viewport | 16 (hero) | 29 (hero + router) | one action | ~40 | 62 across the 02–04 corridor |
| Ground changes | white product cards, dark feature chapters | white hero → black highlights → alternating | white | white/warm cards | white ×3 → black → grey |

### What the numbers prove

1. **Apple shows the product in the first scroll.** `/iphone/` opens with a
   0.41-vh hero and a 1.06-vh priority router — 42 words before any commerce.
   Apple home *is* product cards. Our page made the visitor cross 2.7
   viewports of philosophy (167 words, one portrait) before the first product
   world, at 4.0 viewports.
2. **Apple's story text is sparse and large; the media carries the page.**
   Apple home's hero section is 2.33 viewports with 37 words and 7 media
   objects; the entertainment gallery packs 30 media into 1.06 viewports.
   Our text corridor ran 62 words per viewport with one image.
3. **A statement is a screen, not a paragraph.** Apple's chapter beats sit
   around 0.85–1.24 viewports. Our promise — the page's turn, nine words —
   was a 0.36-viewport strip between two white chapters, so it read as a
   divider, not a beat.
4. **Ground changes are the chapter joints.** Apple alternates white and
   near-black to pace the story. Our first four chapters were all white — the
   dark product chapter arrived only as the fifth.
5. **Google's front door resolves intent, it doesn't explain.** `google.com`
   is one viewport with one action; `about.google` tells the company story in
   ~40 words per viewport with card media. A front door must not make the
   visitor read before it gives them the thing.

## The flow laws this pass added

- **F1 Show before explain.** The product appears within the first ~1.5
  viewports after the hero.
- **F2 A story viewport carries ~16–40 words.** Media and air carry the rest.
- **F3 One idea per screen** — section beats ~0.85–1.24 viewports; a
  0.3-viewport band is a divider, not a section.
- **F4 A statement owns a screen.** The fewest words get the most stage.
- **F5 Ground changes pace the story.** Alternate surfaces; never stack three
  white text chapters at the top.

## What changed on `/` (v6)

Built in `Landing.jsx` + `public-bridge.css`:

1. **Product first.** `05-intelligence` moved from position 5 to position 2 —
   directly after the hero's frosted seam and before the story. The first
   chapter after the hero now carries **15 words + the product stage**
   (before: 49 words + one portrait, with the product still 1.3 viewports
   away). The story order becomes: hero → product alive → problem (voices) →
   promise → return → explore → suite → trust → close.
2. **The promise became a black statement screen.** 325px → **702px**
   (0.36 → 0.78 vh; 599/658/780 at 1024/390/834), the nine words at the
   chapter scale on the existing `scene-dark` ground with the product's radial
   glow and the dark accent gradient. Padding now belongs to the stage
   (`public-bridge.css`), not the compact band.
3. **The founder quote rose to statement scale.** 40px → **54px** max
   (`clamp(30px,3.7vw,54px)`, 1.18 leading); the chapter grew 859 → 1,013px.
   The four returns, marks, doors and journey line are untouched.
4. **The return's seam restored.** It now follows a dark surface, so the
   white chapter takes the shared full breath again; the obsolete
   promise→return same-field rule was removed.

Deliberately unchanged: every word of copy, the hero and its glass, the
problem carousel, the promo module, explore, suite, trust, CTA, footer, all
assets, and every other public page. No new ground colour, no invented
number, no fake screenshot.

## Measured result (v6)

| | v5 | v6 |
| --- | --- | --- |
| Product starts at | 3,601px · **4.0 vh** | 1,170px · **1.30 vh** |
| First chapter after hero | 1,247px · 49 words · 1 media | 1,117px · **15 words** · product stage |
| Promise | 325px · 0.36 vh · white strip | **702px · 0.78 vh · black statement** |
| Return quote | 40px | **54px** |
| Document | 8,661px | 9,193px |
| Light rhythm | white ×3 → dark → grey | white → **black** → white → **black** → white → grey → white → grey |

Verification: `scope:audit:write` (68 routes / 26 endpoints / 1,642
declarations) → eslint clean → both typechecks clean → vite build clean →
**532/532 tests**. Live at 1440/1024/834/390: exact order, no horizontal
overflow, no page errors (the dev `/api/auth/me` 500 is the backend being
absent in this shell, app-wide and unrelated), reduced-motion pass captured.
Evidence: `full-warm-1440.jpg`, `full-reduced-1440.jpg`,
`promise-{1440,1024,390}.jpg`, `intelligence-{1440,1024,390}.jpg`,
`seam-*.jpg`, `04-return.jpg`.

## Open for the founder

- The product-first order and the black promise are design calls built as
  recommended; each is a small swap if he prefers otherwise (restore the
  component order; return the promise to the white band).
- The quote at 54px is one clamp change.
- The v5 flag still stands: the trust chapter's "Learn more" doors wrap in
  the 1024–1068 window (pre-existing, captured in v4).
