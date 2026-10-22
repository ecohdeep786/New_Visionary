# Landing — the designed experience (v14 spec)

Status: **built and verified (2026-10-20) — awaiting the founder's review of the rendered page.** v5's return refit stands (§4); v6 reworked the flow (§9); §10 rebuilt the close; §11 the problem chapter; §12 put every persona's door on the first screen; §13 the section-by-section Apple pass; §14 rebuilt the problem as Apple's story chapter, the return as a 2×2 values chapter, and bound the landing's card rows to the measured 48px card-chapter tier; §15 mirrored Apple's measured layout — its chapter breathing (140/122/120), its 1264px card-row measure, its statement tiers, its accessory-row grid and its global-nav proportions; §16 measured Apple's **band anatomy** and rebuilt our bands on it — the media is now the band's floor and the trust chapter is Apple's values row. Every word of copy is preserved (the five-journey route line moved from the return to the CTA).

Date: 2026-10-19. Fifth R&D pass (section anatomy: apple.com/apple-vision-pro, apple.com/in/education, apple.com/in/education-initiative at 1440 — section maps + filmstrips). Evidence: `frontend/artifacts/research/landing-v10-apple-reread-2026-10-19/` (`apple-reread.json`, filmstrips, `V10_REWORK.md`, verify crops). Fourth pass (close structure: apple.com/watch, beatsbydre.com, apple.com/airpods at 1440). Evidence: `frontend/artifacts/research/landing-apple-close-study-2026-10-19/` (`close-study.json`, filmstrips), plus `landing-v7-close-2026-10-19/`, `landing-v8-story-split-2026-10-19/` and `landing-v9-universal-entry-2026-10-19/` (persona walkthrough + audience-rail record). Third pass (formatting + flow): `landing-flow-study-2026-10-19/` (`FLOW_STUDY.md`). Second pass (interaction): `landing-final-study-2026-10-19/interaction/` — per-site filmstrips, sticky/media/motion probes, CTA hover deltas (`interaction-probe.json`).

---

## 0. Why this round

Founder's review of v4:

1. The quote is right. Keep it.
2. The four columns under it are missing their icon and their relation to the site's categories — they read as plain text, unlike every other cell system on the site.
3. The page must read as one designed experience — story, flow, per-section design, interaction, and the feeling of premium from hero to footer. More R&D; no piecemeal edits.

This round is the answer: a live study of how the four fronts **behave** (not just how they look), the whole page judged against what the study proves, and exactly one flagged refit (`04-return`) where the page fails — nothing else touched unless proven.

---

## 1. R&D pass 2 — how the four fronts behave (measured at 1440)

| | Apple | Khan Academy | Gemini Notebook | Google for Education |
| --- | --- | --- | --- | --- |
| Chrome | fixed 44px nav + dismissible ribbon | **no sticky at all** (nav scrolls away) | sticky 80px header | fixed header + floating "Contact sales" pill |
| Sections | complete worlds: art + one promise + one blue pill | statement + subject + one voice | panel + caption below + progress rail | card + real product UI + caption |
| Media | 2 videos, rails with in-tile CTAs, dots + pause | none — content is the interface | 1 looping product video; living diagram | **10 autoplay videos; 13 scroll-snap rails** |
| Motion | **one duration: 0.32s on 232 elements** | 0.10–0.15s utility fades only | 0.3s; animation burst inside the product demo | 0.2s on 196 elements; segmented progress bars |
| Hover | a whisper — background shifts a few RGB points, no transform, no shadow | text color holds | — | — |
| Close | legal fine print → link-directory footer | "Join Khan Academy today" + stacked role buttons over illustration | FAQ answering privacy/access/retention, then rainbow glow, then near-empty footer | sign-up row → dense 4+ column directory footer |

Feel, in one line each:
- **Apple** — composed, expensive, nothing shouts.
- **Khan** — human, crafted, generous (serif display, marker highlights, doodles over real photos, subject chips in accordions).
- **Gemini Notebook** — airy, AI-native, confident (the product drawn as a living diagram).
- **Edu** — colorful, institutional, tool-forward (real UI floating over gradients).

### The seven laws (what this page is measured against)

- **L1 Quiet fixed chrome.** One thin persistent header; nothing else fights the story for the viewport.
- **L2 One motion vocabulary.** Every front runs a single duration family. Motion is a system, not per-component taste.
- **L3 Every section is a complete world.** A statement, a subject, a device — never bare text on white.
- **L4 Show the product alive.** The strongest moments are the product itself moving.
- **L5 Progress is visible in paced content.** Dots, segments, rails — the reader always knows where they are.
- **L6 Answer fear before the close.** Notebook answers privacy, access, retention, safety in plain words before the footer.
- **L7 The close is ceremonial, the footer is air.** A big invitation, then a quiet directory.

---

## 2. The page, as one story (hero → footer)

| Beat | The visitor's question | What they see | Felt quality | Doors |
| --- | --- | --- | --- | --- |
| 01 hero | What is this? | pinned stage: "One intelligence" + cycling audience line + five cutouts + CTA pair | arrival, scale | Start learning · See how it works |
| 05 intelligence | What is it, alive? | immediately after the hero: the dark pivot — one intelligence over one morphing stage (**v6**) | understanding | See how it works → /how-it-works |
| 02 problem | Is this about me? | "Why Visionary exists": statement + four real voices crossfading in studio photography, reader-paced | recognition | — (the story) |
| 03 promise | What if? | one black statement screen — the sentence owns the viewport (**v6**) | lift | — |
| 04 return | What do I get back? | the founder's conviction at statement scale + the four returns, each with its mark, its door, and the five-journey line (**v6 scale**) | confidence | 4 cell doors + 5 journey links (**§4 refit**) |
| 13 explore | Who is this for? | five journeys as one line-up of portraits | belonging | 5 persona pages |
| 14 suite | Where do I go next? | four doors around the product in the same grey catalogue | orientation | Download · Pricing · Help · Updates |
| 11 trust | Can I trust it? | your learning stays yours: Privacy · Safety · Security · Accessibility | safety | 4 pages |
| 12 cta | What's my next step? | the invitation; "Free to start. Private by design." | invitation | Get started · Talk to our team |
| footer | Who are they? | directory, language, legal | air | the whole site |

**The light rhythm (v6):** white hero → **black product pivot (05)** → white human story (02) → **black promise turn (03)** → white return (04) → grey catalogue (13–14) → white trust (11) → grey close (12) → footer air (#F5F5F7). No new grounds — the promise uses the existing `scene-dark` surface.

**By the footer, the visitor has met** the product alive (05), the problem and the promise (02–03), the return (04), their journey (13), their next task (14), the trust (11), and the invitation (12). No chapter asks them to believe a number; every door opens a real page.

---

## 3. Interaction & material laws on this page

- **Reveals:** every chapter fades up in the scroll band (the existing 40–90% reveal system); reduced motion shows everything.
- **Crossfades:** the problem voices cross at 700ms on the Apple ease; dots pace the reader (L5 satisfied today).
- **Hovers:** the site's 200ms color/shift family; blue doors resolve to #0b57d0; glyphs render per `public-icons.css` (24px / stroke 1.75 / tokenized sizes).
- **Doors — the audit:** hero (2) · return (4 + 5 journey links) · promo (1) · explore (5) · suite (4) · trust (4) · cta (2) · nav and footer (everywhere). Every module is a doorway.
- **Materials:** cutouts (hero), studio photography (02, 13), spot illustrations (14), type tiers for statements (03, 11, 12), and the site's block system — `glyph / title / line / door` — which `04-return` is currently outside of. The refit brings it back in.

---

## 4. 04-return v2 — the refit (the founder's note, designed)

**What stays:** the eyebrow "What you get", the founder quote (verbatim, approved), the attribution, the four lines, the hairline columns, the editorial tiers. Nothing is rewritten.

**What is added — three moves, each from a system the site already owns:**

**1 · The mark.** Each return gains its glyph, the site's benefit-block anatomy (`PersonaSections.jsx`, the journey blocks): 24px, stroke 1.75 — set **above** the line rather than inline; measured at build, the inline placement starved the 4-up middle cells and wrapped the doors (§8.1).

| Return | Glyph | Precedent on the site |
| --- | --- | --- |
| Your hours stack. | `Layers3` | "Programs that carry forward." / "Skills that grow." — the compounding mark |
| Your place is kept. | `BookOpen` | "Remember it later." / "Remember every project." — the memory mark |
| Your language works. | `Globe2` | "In your language." — the language mark |
| Your progress shows. | `Eye` | "See it first." / "Know where they are stuck." — the visibility mark |

**2 · The door.** Each return gains its quiet door with the site's chevron (14px, 1em token), labelled in the site's own words — colour and hover belong to the editorial link law (#0066cc, underline on hover; §8.3):

| Return | Door label | Opens |
| --- | --- | --- |
| Your hours stack. | For students | /student |
| Your place is kept. | Your continuity *(CollegePage's exact label)* | /how-it-works |
| Your language works. | Language support *(exact label)* | /how-it-works |
| Your progress shows. | For parents *(exact label)* | /parent |

**3 · The category relation.** The chapter closes on one quiet line — the site's standard route-links pattern (the CTA chapter's own connector): **"See how it works for Students · Teachers · Parents · Professionals · Organizations."** Every journey relates itself right where the returns are stated; the five links open the five doors. (New copy: only the connector phrase, reused verbatim from the existing pattern. Fallback if the founder prefers none: the five links without the connector.)

*Note:* this supersedes the "doorless" comment in `Landing.jsx`. The return now stands in the benefit family (mark + line + door); the trust values below keep their editorial spine untouched.

---

## 5. The build list — as built

1. `Landing.jsx`: `LX_RETURNS` gained `Icon`, `l`, `to`; `LandingReturnSection` renders mark + line + door per cell and the closing journey row; the section comment is updated.
2. **Nothing else on the page.** No section added or removed. No copy rewritten — the quote and the four lines stand; the single new line is flagged in §4.

### Not added, deliberately

No FAQ chapter (L6 is already carried by the trust values and "Private by design"; a front door must not become a manual) · no new video or screenshot · no invented numbers · no floating pill · no carousel retooling · no new surface colors. Each would be volume, not design.

### Not changing, and why

Every other chapter already satisfies the laws — the audit in §1–3 is the evidence. Hero and glass: untouched. Problem, promise, promo, explore, suite, trust, cta, footer: as shipped. (Suite heading, 19px cell tier: open items from v4 remain open.)

---

## 6. Verification — planned and run (results in §8.4)

- Gate: `scope:audit:write` → lint → typecheck (both) → build → full test run. — **run: all clean, 532/532.**
- Live at 1440 / 1024 / 834 / 390: chapter order; glyphs and doors render; every new door resolves (student / how-it-works / parent + the five journeys); reduced-motion pass; no overflow; hover pass on the new doors and the closing row. — **run and green.**

---

## 7. The founder's calls (built as recommended — one-line swaps if he prefers otherwise)

1. The closing line: **built** — "See how it works for Students · Teachers · Parents · Professionals · Organizations." Links-only is one line removed.
2. Glyph color: **built ink** (the site's block anatomy). A one-word swap makes them blue.
3. Footer: quiet stands (unchanged — Apple's air).
4. Suite heading (from v4): eyebrow-only stands (unchanged).
5. 19px cell tier (from v4): the tier stands (unchanged).

Flagged, not touched: the trust chapter's "Learn more" doors wrap within 1024–1068 on the 692px spine — pre-existing in the approved v4 (captured in `landing-v4-2026-10-19/1024-11-trust.jpg`), not this refit. One class (`lg:` → `min-[1069px]` on the values grid) would align it with §8.2; left for the founder's word.

---

## 8. Build record — as measured (2026-10-19)

**8.1 The mark sits above the line, not inline.** Measured at 1440: each cell's content column is 165px; the inline mark + 16px gap left 124px in the middle cells, while the editorial door (link role: 17px, ~127px with its chevron) needs more — it wrapped to two lines with a detached chevron. The mark now opens the cell (Khan's pillar anatomy); the site's block order is unchanged: mark / title / line / door. Doors now render single-line at every width (measured height 20px = one 17px line).

**8.2 Four columns turn on with the desktop spine (1069px), not `lg`.** `--container-editorial` is 692px until 1068 and 980px from 1069 (`rhythm.css`); at `lg:` (1024) four columns sat on the 692 tablet spine (~173px cells) and wrapped. The grid now uses `min-[1069px]:grid-cols-4` — the same boundary the site already uses (`min-[1069px]:max-w-[980px]` in `PremiumPersonaSections`) — and stacks on the tablet spine below it, exactly as the sibling chapters stack.

**8.3 The doors wear the editorial link law.** Computed colour `#0066cc`, none → underline on hover, governed by `apple-typography.css` (measured before/after). Custom colour classes were removed; the chevron inherits the 1em inline token. The chapter's links are now invisible until hover, exactly like every other editorial link on the spine.

**8.4 Verified.** Gate: `scope:audit:write` (68 routes / 26 endpoints / **1,642** declarations — +2) → eslint clean → both typechecks clean → vite build clean → **532/532 tests**. Live: 1440 / 1024 / 834 / 390 — exact chapter order, four marks, doors single-line with correct hrefs (`/student`, `/how-it-works`, `/how-it-works`, `/parent`), the five journey links, click-throughs land (`/student`, `/parent`), hover underline measured, reduced-motion pass captured, zero page errors, no horizontal overflow. docH 8,661 @1440 (v4: 8,525) · 8,284 @1024 · 9,062 @834 · 9,741 @390. Evidence: `frontend/artifacts/research/landing-v5-2026-10-19/` (`return-{1440,1024,834,390}.png`, `full-reduced-1440.png`, `landing-v5-verify.json`).

**8.5 No commits** — the founder holds version commits.

---

## 9. v6 — the flow rework (2026-10-19, on the founder's flow review)

### 9.0 The ask

"we need to rework more hard … when they will scroll the page they will not get any about the page because first lot of text is there, not a flow is worked, not a fully apple design premium way to format as if you see in apple all page."

The v5 page passed the content laws and still failed the **order and format**: the product arrived at 4.0 viewports behind 167 words and one image; the promise was a 325px strip.

### 9.1 R&D pass 3 — formatting/flow (measured at 1440)

Evidence: `frontend/artifacts/research/landing-flow-study-2026-10-19/` (`flow-study.json`, filmstrips, `FLOW_STUDY.md`). Per section: viewport height, words, largest type, media, sticky, ground.

| | Apple home | Apple /iphone/ | Google home | About Google | `/` v5 |
| --- | --- | --- | --- | --- | --- |
| First story screen | 2,100px · 37 words · 7 media | 367px · 22 words · 8 media · 80px | one action | 158-word lead module | 844px · 19 words · 5 media |
| Product start | hero (cards) | 1,317px · 1.46 vh | — | — | **3,601px · 4.0 vh** |
| Story words / viewport | 16 | 29 | — | ~40 | **62 (02–04 corridor)** |
| Promise beat | — | — | — | — | **325px · 0.36 vh · 9 words · 0 media** |
| Ground rhythm | white cards / black features | white → black → alternating | white | white / warm cards | white ×3 → black |

Laws added: **F1** show before explain (product within ~1.5 viewports) · **F2** a story viewport carries ~16–40 words · **F3** one idea per screen (~0.85–1.24 vh) · **F4** a statement owns a screen · **F5** ground changes pace the story.

### 9.2 Built (`Landing.jsx` + `public-bridge.css`)

1. **Product first.** `05-intelligence` moved from position 5 to position 2, directly after the hero's frosted seam. The first chapter after the hero carries 15 words + the product stage (was 49 words + one portrait, product still 1.3 vh away).
2. **The promise is a black statement screen.** `scene-dark`, 702px at 1440 (78svh, min 460 / max 780), the nine words at chapter scale, the product's radial glow, `accent-gradient-on-dark`. The bridge gives the promise `padding-block: 0` (it owns its stage) and drops the obsolete promise→return same-field rule, so the return takes the shared full breath after the surface change.
3. **The founder quote at statement scale.** `clamp(30px,3.7vw,54px)`, 1.18 leading, 30ch — the chapter 859 → 1,013px. The four returns, marks, doors and journey line untouched.
4. Nothing else: no copy edits, no new assets, no new section, hero/glass untouched, no new ground colour.

### 9.3 Measured result

| | v5 | v6 |
| --- | --- | --- |
| Product starts at | 3,601px · 4.0 vh | **1,170px · 1.30 vh** |
| First chapter after hero | 49 words · 1 media | **15 words · product stage** |
| Promise | 325px · 0.36 vh · white strip | **702px · 0.78 vh · black statement** |
| Return quote | 40px | **54px** |
| docH @1440 | 8,661 | 9,193 |
| Promise @1024 / 834 / 390 | — | 599 / 780 / 658px; type 56 / 56 / 40px |

Gate: `scope:audit:write` (68 routes / 26 endpoints / **1,642** declarations) → eslint clean → both typechecks clean → vite build clean → **532/532 tests**. Live: exact order at 1440/1024/834/390, promise bg `rgb(10,13,20)`, no overflow, no page errors (the dev `/api/auth/me` 500 is the absent backend, app-wide), reduced-motion pass. Evidence: `landing-v6-flow-2026-10-19/` (`full-warm-1440.jpg`, `full-reduced-1440.jpg`, `promise-*.jpg`, `intelligence-*.jpg`, `seam-*.jpg`, `04-return.jpg`).

### 9.4 Founder calls (built as recommended — small swaps)

1. Product-first order — one component move restores the v5 narrative order.
2. Black promise — one class swap returns it to the white band.
3. Quote at 54px — one clamp change.
4. Still open from v5: the trust doors wrap in the 1024–1068 window (pre-existing); `lg:` → `min-[1069px]` on the values grid is the one-class fix.

### 9.5 No commits — the founder holds version commits.

---

## 10. v7 — the close pass (2026-10-19, on the founder's Apple layout review)

### 10.0 The ask

The founder's close complaint: "see the cta section and before section of cta that all looking a text heavy clutter and user will get boring from page and they will left with overall page." Direction: visit apple.com / Apple Watch / Beats and match their premium structure and layout.

### 10.1 R&D pass 4 — measured closes (1440)

| | apple.com/watch | beatsbydre.com | apple.com/airpods |
| --- | --- | --- | --- |
| docH | 7,252 | 7,219 | 9,359 |
| close anatomy | grey split feature card → 3-up family cards (28px) → utilities | compare split → legal → black "Join Our List" band → light footer | full-bleed rounded tiles on `#f5f5f7` → ask → footer |

Extracted laws: (1) a close is one grey `#f5f5f7` panel, 28px radius, split header — statement left, quiet support line right; (2) the black ceremonial band: radial glow, white statement, quiet blue link, small print; (3) a utility row is one card per door, media inset, no detached ornaments. Evidence: `frontend/artifacts/research/landing-apple-close-study-2026-10-19/` (`close-study.json`, filmstrips).

### 10.2 Built (landing-only variants; shared defaults byte-identical)

1. **Trust → feature panel.** `PremiumTrustSection variant="feature"`: one grey `#f5f5f7` panel (28px), split header (statement left; support line right at ≥1069), 2×2 icon value grid (white 48px circles; Lock / HeartHandshake / ShieldCheck / Accessibility), divider hairline. Panel radius uses `rounded-[1.75rem]` because `public-bridge.css` hijacks `rounded-[28px]` to 12px `!important`.
2. **CTA → the black band.** `PremiumCTASection variant="closing"`: `scene-dark` rgb(10,13,20), product-glow + two faint orbit rings, 72px white statement, 17px/400 `white/70` sub, white pill + `#2997ff` quiet link, small print. Square top: the seam law forces section radius 0.
3. **Suite tiles unified.** One white card per door (inset grey media well + in-card arrow), removing the detached strip / floating notch; section height unchanged.

### 10.3 Measured (v6 → v7)

| | v6 | v7 |
| --- | --- | --- |
| Trust | three columns, no panel | **feature panel — 1,069px @1440** |
| Suite | tiles + detached strip | **cohesive cards — 838px @1440** |
| CTA | grey `#f5f5f7` band — 657px | **black band — 642px @1440** |
| docH @1440 | 9,193 | 9,584 |

Trust 1,069 / 1,048 / 959 / 1,102; suite 838 / 746 / 705 / 1,164; CTA 642 / 550 / 517 / 534 across 1440 / 1024 / 834 / 390. Persona pages verified untouched (`/student`: trust three columns 724px, no panel; CTA stays grey 657px). Gate: `scope:audit:write` (68 / 26 / **1,645**) → eslint clean → both typechecks clean → vite build clean (2,270 modules) → **532/532 tests**. Evidence: `landing-v7-close-2026-10-19/` (`final.json`, `trust-*`, `suite-*`, `cta-*` crops, `full-1440-final.jpg`, persona check shots).

### 10.4 Founder calls

1. Trust panel — one prop swaps back to the three-column tier for the persona pages.
2. CTA band — the `variant` swap restores the grey close.
3. Suite cards — the About page's tile treatment remains the shared default.

### 10.5 No commits — the founder holds version commits.

---

## 11. v8 — the page-wide structure pass (2026-10-19, repeat ask)

### 11.0 The ask

"visit the apple.com, apple watch, apple beat … improve the every section and layout to match apple premium design and structure … again." Every chapter audited against the pass-4 references and the page's own laws; only the chapters the audit failed were changed.

### 11.1 Audit — every chapter at 1440 (v8)

| Chapter | Structure | Verdict | Action |
| --- | --- | --- | --- |
| 01-hero 844px | rotating persona + glass + portrait row | Apple hero grammar; untouched by direction | none |
| 05-intelligence 1,117px | product-first dark stage, four beats, sticky | Apple product chapter (v6) | none |
| 02-problem 1,033px | story split: face ↔ voice | **was statement + lone portrait; rebuilt** | story split |
| 03-promise 702px | black statement screen | Apple's one-beat black screen (v6) | none |
| 04-return 990px | founder quote + four returns + journey line | v5 refit; cells were 165px ribbons | gutters opened |
| 13-explore 1,251px | 3.5-visible journey line-up | accepted module (portrait cards on grey) | none |
| 14-suite 838px | four white cards, inset wells | v7 | none |
| 11-trust 1,069px | grey feature panel, 2×2 values | v7 | none |
| 12-cta 642px | black ceremonial close | v7 | none |
| footer | approved directory | — | none |

### 11.2 Built (`Landing.jsx`)

1. **Problem → Apple's story split.** The chapter statement stays centered; below it, `public-editorial-frame` runs two columns at ≥1069 (476 / 440): the studio portrait left (480px stage; the mask now fades the top edge too — `transparent 0%, black 7%, black 78%, transparent 97%`), the pull-quote right at `clamp(24px,2.3vw,34px)` / 22ch, the persona under it, the pager under the quote (centered below 1069). Below 1069 the story stacks portrait → quote. Every word, image, persona and the 4.2s carousel untouched; a dot click swaps statement, quote, persona and image alt (probe-verified).
2. **Return → readable cells.** Gutters `min-[1069px]:px-10 → px-6`: body text 165 → 196–221px, most titles back to one line. Marks, four columns, hairlines, editorial links and the journey line exactly as approved (v5).

### 11.3 Measured (v7 → v8)

| | v7 | v8 |
| --- | --- | --- |
| 02-problem | 1,247px | **1,033px — story split** |
| 04-return | 1,013px | **990px — readable cells** |
| docH @1440 | 9,584 | **9,347** |
| docH @1024 / 834 / 390 | 9,357 / 9,261 / 10,060 | **9,306 / 9,133 / 10,099** |

No horizontal overflow at any width. Console: the two pre-existing entries only (`/api/auth/me` 500 — absent dev backend; the `fetchPriority` prop warning at `NewPersona.jsx:127`). Persona pages untouched (no shared-module defaults changed). Gate: `scope:audit:write` (68 / 26 / **1,645**) → eslint clean → both typechecks clean → vite build clean (2,270 modules) → **532/532 tests**. Evidence: `landing-v8-story-split-2026-10-19/` (`full-1440-final.jpg`, `full-390-final.jpg`, `problem-*`, `viewport-04-return-*`, `problem-check.json`, `return-check.json`, `final.json`).

### 11.4 Founder calls

1. Problem split — one class swap mirrors the columns; a block revert restores the centered stage.
2. Return gutters — `px-6 → px-10` restores the v5 gutters.

### 11.5 No commits — the founder holds version commits.

---

## 12. v9 — the universal entry (2026-10-19, on the founder's persona review)

### 12.0 The ask

Walk the page as a first-time student, teacher, parent, professional, and organization; then make the universal front door fit every one of them in Apple's premium structure.

### 12.1 The walkthrough (full text: `landing-v9-universal-entry-2026-10-19/UNIVERSAL_FIT.md`)

The page's content answers all five personas — after they wait. The entry does not: one audience line cycles every 2.6s (10.4s to the organization), the cast is decoration, and no persona door sits on the first screen. Measured wait until "your" line: student 0s · teacher 2.6s · parent 5.2s · professional 7.8s · organization 10.4s.

### 12.2 R&D — Apple's audience anatomy (measured live at 1440)

- apple.com/in/education local nav: audience row `K–12 · Higher Education · College Students · Success Stories` — 12px/400 quiet links under a 21px/600 brand, visible before the hero.
- apple.com/in/education-initiative hero: everyone named in one sentence, no cycling.

Law: a universal page never makes an audience wait for a carousel; the row is quiet, visible, and always there.

### 12.3 Built (landing-only)

1. **The hero audience rail**: five quiet 14px links under the CTA pair — Students · Teachers · Parents · Professionals · Organizations — order locked to `HERO_CATEGORY_WORDS` (a preview always matches the label touched). Hover or focus previews that line and holds the cycle; leaving resumes; the click opens the persona page; the active label follows the cycle.
2. **Reduced motion**: the audience line's auto-advance never starts under `prefers-reduced-motion`; the rail still chooses a line.
3. **`NewPersona` gains an inert `audienceLinks` prop** — persona heroes never pass it and stay exactly as before (`/student` verified: rail count 0).
4. Zero copy changes; labels are the footer's existing audience names. No new assets.

### 12.4 Measured

| | before | after |
| --- | --- | --- |
| Persona doors on the first screen | 0 | **5** |
| Wait for the non-student lines | 2.6–10.4s | **hover / focus / tap — 0s** |

No horizontal overflow at 375 / 390 / 834 / 1024 / 1440 / 1920; the rail clears the family by 85–231px. Behaviors verified live: hover "Teachers" → "for teachers."; leave → resumes; click "Organizations" → `/organization`; keyboard focus previews; reduced motion static with a working rail. Gate: `scope:audit:write` (68 / 26 / **1,646**) → eslint clean → both typechecks clean → vite build clean → **532/532 tests**. Evidence: `landing-v9-universal-entry-2026-10-19/`.

### 12.5 Founder calls

1. Hero primary pill "Start learning" — one label swap if the hero should speak universally like the close.
2. Organization story slide — new copy; held.
3. Rail placement — under the CTA pair (built); Apple's local-nav bar position is a small move.

### 12.6 No commits — the founder holds version commits.

---

## 13. v10 — the section-by-section Apple pass (2026-10-19)

### 13.0 The ask

Change the blue button to white; rework the next section to Apple's premium section style; then "What you get"; then the next sections, "and so on" — checking Apple's pages start to end.

### 13.1 R&D — section maps measured live (`landing-v10-apple-reread-2026-10-19/`)

- apple.com/in/education (9 sections / 7,405px): "Our values lead the way." = **statement + white cards, 28px radius, icon top-left, title, copy, Learn-more link**; black strip "From grade school to grad school." (771px).
- apple.com/apple-vision-pro (12 sections / 32,700px): "Take a closer look." = statement + grey media cards on white; "Explore Apple Vision Pro accessories." = **statement over the card grid** on `#f5f5f7`.
- Laws taken: a card section opens with a **statement**, never a small eyebrow; dark product bands carry a **white pill**, never a filled accent button.

### 13.2 Built (landing-only)

1. **Intelligence band (promo)**: the `#4285F4` pill becomes the dark-band **white pill** (ink text, hover `#f5f5f7`); the mark **floats bare** (`plain` prop drops the card border on the promo instance only) and the stage grows 520 → 560px. Measured: `rgb(66,133,244)` → `rgb(255,255,255)`, border `rgba(0,0,0,0)`.
2. **"What you get" (04)**: the four returns become **Apple values cards** — grey `#f5f5f7`, 28px radius (`rounded-[1.75rem]`; the `rounded-[28px]` hijack), icon → title → copy → editorial door pinned to the card baseline; **4-up ≥1069 · 2-up ≥640 · stacked on the phone**; frame moves from the 980 editorial spine to the wide card frame (1265px / 80px gutters). Sections 990 → 1,051 @1440.
3. **Suite "Explore further" (14)**: the 17px eyebrow promotes to the **Apple statement tier** above the grid — same words, one statement period; 64px @1440 · 56px @1024/834 · 40px @390. Section 838 → 886 @1440.

### 13.3 Audited, unchanged

Problem (02) matches the initiative story sections; promise (03) matches Apple's black strip; explore (13) is the shared module used verbatim by design; trust (11) / CTA (12) are the v7 Apple Watch / Beats anatomy.

### 13.4 Measured

docH 9,496 @1440 / 9,014 @1024 / 9,000 @834 / 10,271 @390 — no horizontal overflow anywhere; return doors align on one baseline; persona `/student` verified: no promo pill, no return cards, no suite statement.

Gate: `scope:audit:write` (68 / 26 / **1,646**) → eslint clean → both typechecks clean → vite build clean → **532/532 tests**. Evidence: `landing-v10-apple-reread-2026-10-19/`.

### 13.5 No commits — the founder holds version commits.

---

## 14. v11 — the story chapter, the values chapter, the card-chapter tier (2026-10-19)

### 14.0 The ask

The "Why Visionary exists" chapter reads text-heavy — heading, sub, image, text as four stacked blocks, "apple never design like this"; "What you get" still not Apple; and check the "Who it's for" section's heading size. Full record: `frontend/artifacts/research/landing-v11-apple-statements-2026-10-19/V11_REWORK.md`.

### 14.1 R&D — the heading tiers measured at four widths

Probe: `apple-statements.json` (1440) + `apple-heading-breakpoints.json` (1024/834/390).

- Education **card chapters** ("Real stories. Real impact.", "Our values lead the way.", "How to Buy."): **48/52 · 40/44 · 40/44 · 32/36**, no subheading.
- Education-initiative **story chapters** ("Our work in education doesn't end here."): **64/68 · 56/60 · — · 40/44** with a **24/600** lead, then one white media card on the grey ground.
- Vision Pro accessory row: 56/60 @1440 · 48/52 @1024.
- The v10 landing was problem **72** (adapter display token), explore **64**, suite **64** (the adapter default overrode the 44 clamp), return quote **53.3**, cards **264px 4-up**.

### 14.2 Built (landing-only; copy preserved)

1. **Problem (02) — Apple's story chapter.** `#f5f5f7` ground; left 980 spine: 17px eyebrow, statement at **64/56/56/40** (`data-type="section"`), 24/600 one-line lead; then **one white 28px story card** — portrait on the card's white left field, quote/persona right — with the pager in a control row **below the card**. The v8 compact-band override is retired; the chapter takes the shared rhythm. 1,033 → **1,065** @1440, card 980×440.
2. **Return (04) — the values chapter.** Quote **53.3 → 48** (natural wrap); four returns become **two broad cards per row** (545px each @1440) with **28px feature titles** over 19/23 copy; cards stay `#f5f5f7` / 28px / doors pinned. The five-journey route line moves **verbatim to the CTA** tail mini-router. 990 → **1,238** @1440.
3. **Router (13) + suite (14) — the card-chapter tier.** New measured public role **`card-chapter`** (48/52 · 40/44 · 32/36; `--fs-card-chapter` / `--lh-card-chapter` tokens, role in the explicit-role layer). Explore heading **64 → 48**, intro **24/600 → 21/400** (`editorial-body`); suite statement **64 → 48**. The shared explore module gains optional `headingRole` / `subRole`; persona pages pass neither and keep 64/56/40 (verified).

### 14.3 Measured

docH **9,668** @1440 / 8,855 @1024 / 9,481 @834 / 10,365 @390 / 10,348 @375 — no horizontal overflow 375–1920. Structure: hero white → intelligence dark → problem grey → promise dark → return white → explore+suite grey → trust white → CTA dark. Persona pages: `/student`, `/teacher`, `/parent`, `/professional`, `/organization` explore h2 64 @1440 / 40 @390, no overflow.

Gate: `scope:audit:write` (68 / 26 / **1,645**) → eslint clean → both typechecks clean → vite build clean → **532/532 tests**. Evidence: `landing-v11-apple-statements-2026-10-19/`.

### 14.4 Flags for the founder

The route line moved to the CTA (same words/links); the problem band is grey and takes the shared rhythm (+~170px at 1440); the suite heading is now the measured 48 tier; persona line-ups stay at 64 unless he wants the role applied there too.

### 14.5 No commits — the founder holds version commits.

---

## 15. v12 — Apple's own layout, measured and mirrored (2026-10-20)

### 15.0 The ask

Go to the given Apple pages in the browser, check **each layout, design, margin, padding, breathing, section and device layout**, then work on our landing page so its layout, position, spacing and margins match — and its design match our product in Apple's premium language. Student page used as a read-only idea source. **Landing page only** until the founder's command.

### 15.1 R&D — the Apple layout law, measured live

`artifacts/research/landing-v12-apple-layout-2026-10-20/apple-layout-spec.json` (apple.com, /in/education-initiative/, /apple-vision-pro/ at 1440/1024/834/390).

- **Chapter breathing 140/140** at 1440, **122/130** at 1024–834, **120/120** at 390 (education-initiative `section-router` / `section-values`).
- **Editorial spine 980** (gut 230 @1440) for statements and the story card; **card rows 1264** (gut 88 @1440) for values/accessory/product grids.
- **Product band 56** (48/32) — apple.com "iPhone Duo", the vision-pro dark chapters; **story chapter 64/68** with a 24/600 lead; **card chapter 48/52** (40/44, 32/36); **black statement band 48**; **closing band 56**.
- **Global nav 48 tall, 12px labels, ~1024 container**; the education audience row 12px/400.
- Apple's accessory anatomy: **one row of four** white cards, media well on top, name + copy below.

### 15.2 Built (landing only; copy preserved)

1. **Breathing** → 140/140 · 122/130 · 120/120 (landing-scoped rule; the shared token still serves every other page). Hero and the black promise keep their own stages.
2. **Statement tiers** → new measured public role `product-band` (56/60 · 48/52 · 32/36): hero 80 → **64**, product band 80 → **56**, promise 64 → **48**, trust 72 → **64**, closer 72 → **56**. Story 64, values 48, line-up 48 unchanged. One 64px statement per page, the way Apple paces a page.
3. **Card rows → 1264** (gut 88 @1440) on the return, the journeys rail and the suite; the return's two broad cards are the same two-column geometry as vision-pro's "Take a closer look."
4. **Suite → Apple's accessory anatomy**: one row of four white tiles (media well on top, name + copy, arrow in the card).
5. **Chrome**: 12px nav labels and Apple's ~1024 nav frame (landing-scoped); the audience row drops to Apple's 12px.

### 15.3 Measured

docH **9,259** @1440 (v11 9,668) / 8,878 @1024 / 10,043 @834 / 11,009 @390 — **zero horizontal overflow 375–1920**; console only the two pre-existing entries; a full scroll walkthrough at 1440 and 390 captured in `walk/`.

**Other pages untouched** (re-measured at 1440×844 against their pre-v12 numbers): `/student` 12,970, `/teacher` 13,090, `/parent` 13,118, `/professional` 13,113, `/organization` 13,381 — identical; explore 64, band 80, trust 72, CTA 72, hero 79.9, nav 14px unchanged.

Gate: `scope:audit:write` (68 / 26 / **1,645**) → eslint clean → both typechecks clean → vite build clean → **532/532 tests**. Evidence: `landing-v12-apple-layout-2026-10-20/` (`V12_PLAN.md`, `apple-layout-spec.json`, `our-layout-spec.json`, `our-type-spec.json`, `ours/`, `walk/`).

### 15.4 Flags for the founder

The hero statement dropped 80 → 64 (Apple's landing-statement tier) — the one change that alters the first impression; the persona heroes keep their 80. The nav keeps our 56px height (our mega sheets are anchored to it) with Apple's 12px labels. The landing's chapter breathing is now Apple's; other pages still ride the shared 96–158 token until he says so.

### 15.5 No commits — the founder holds version commits.

---

## 16. v13 — Apple's band anatomy: the media is the band's floor (2026-10-20)

### 16.0 The ask

The product still did not match Apple's breathing and layout; the landing must look very premium, match our product, and make the user excited to know more and explore every page. "Think and do R&D as an Apple engineer in our product." Landing page only.

### 16.1 R&D — band anatomy, measured live

`artifacts/research/landing-v13-apple-composition-2026-10-20/apple-band-anatomy.json` (apple.com, /in/education-initiative/, /apple-vision-pro/ at 1440 + 390: per band — the type block's offsets, the media's insets/bleeds, the doors, the surfaces).

- A band is a **scene**: apple.com's hero media is 3,008 wide (it bleeds and overflows the viewport) and the band **ends on the media**; vision-pro's gallery media is 1,440 wide (full-bleed) with its statement at 1,092 of a 2,129 band.
- Apple's **values cards** (apple.com/in/education): white, radius 28, **title 28, body 17 on a 25px line, a 17px "Learn more" in #0066cc**.
- Apple's story media: **980×516** on the editorial spine with 181px of air below.

### 16.2 Built (landing only; copy preserved)

1. **The product band is a scene now**: the mark floats on the band's own ground (its canvas tone dissolved into the band — no card, no seam), grows 560 → **820**, and the band **ends on it** (padding 140/**0**). Band 1,340 → 1,200.
2. **The trust chapter is Apple's values row** (new landing-only `variant="cards"`): 64px statement + 19px lead, then four **white cards on the grey floor** — mark well, 28px title, 17px body, a blue "Learn more" each. The grey close-card panel retires; the persona pages keep their anatomy.
3. **New measured role `card-body`** (17/25) for the landing's value cards; the persona values columns keep 19/23.
4. **The story card matches Apple's story media**: 980×**516**.

### 16.3 Measured

docH **9,148** @1440 (v12 9,259) / 8,793 @1024 / 9,934 @834 / 11,044 @390 — **zero horizontal overflow 375–1920**; console only the two pre-existing entries; a full scroll walkthrough at 1440 and 390 in `walk/`.

**Other pages untouched**: `/student` 12,970 · `/teacher` 13,090 · `/parent` 13,118 · `/professional` 13,113 · `/organization` 13,381 — identical.

Gate: `scope:audit:write` (68 / 26 / **1,649**) → eslint clean → both typechecks clean → vite build clean → **532/532 tests**. Evidence: `landing-v13-apple-composition-2026-10-20/`.

### 16.4 No commits — the founder holds version commits.

---

## 17. v14 — one grammar: the front-door alignment (2026-10-20)

### 17.0 The ask

What if "Who it's for" and its sub-head show in centre with a large heading size, and the problem section does the same; and how would the card section be improved to match Apple's premium section, and all the other sections, to make a full-page premium vibe?

### 17.1 R&D — Apple's alignment grammar (measured live, 1440)

| page | statements | alignment |
| --- | --- | --- |
| apple.com (front door) | "iPhone Duo" 56 · "iPhone 18 Pro" 56 · "Endless entertainment." 56 (card gallery) · grid card titles 40 | **center — every one** |
| apple.com/in/education (page-level) | "Designed for every kind of learner." 64 · "Education that's a grade ahead." 80 | **center** |
| apple.com/in/education (chapters) · education-initiative · vision-pro gallery | 48–64 | start / left |
| apple.com/watch | "Explore the lineup." 48 | start |

**Law:** alignment on Apple is a grammar, not a mix — a front door centres every statement, an editorial page left-aligns every statement. Our landing is a front door and was mixing the two (the band + promise centred, the story / return / journeys / suite / trust left) — that mix is what stopped the page reading as one system.

**Apple's premium card law** (apple.com/in/education): white, radius 28, 40px padding, title 28, body 17/25, a 17px "Learn more" in #0066cc with a chevron, media full-bleed on the card's top, the icon **bare** on the card.

### 17.2 Built (landing only; copy preserved)

**The founder's call, applied exactly:** centre the "Who it's for" section and the problem section — the rest of the page stays as the previous version was.

1. **"Who it's for" → centred, 56px** (apple.com's card-gallery tier, 48 → 56), with its 17px eyebrow and its 21px intro centred with it. The rail of five journey cards is untouched.
2. **The problem chapter centres** its eyebrow, its 64px statement and its 24/600 lead; the story card below stays the object.
3. **Every other chapter keeps the previous version's alignment and size**: the band (56, centred), the promise (48, centred), the return's founder quote (48, left, 500 — unaltered), the suite (48, left) and the trust statement (64, left).
4. **The card sections take Apple's premium card law** (the founder's second ask): the trust's values cards take radius 28, 40px padding and bare 32px icons (the circle wells retire), 28px titles, 17px bodies and the blue "Learn more"; the suite's tiles take radius 28 and a 20px media well. (The bridge hijacks the literal `rounded-[28px]` utility to 12px — the site's escape is `rounded-[1.75rem]`, which the return cards already use.)

### 17.3 Measured

docH **9,204** @1440 / 8,833 @1024 / 9,998 @834 / 11,133 @390 — **zero horizontal overflow 375–1920**; console only the two pre-existing entries; a full scroll walkthrough at 1440 and 390 in `walk/`.

**Other pages untouched**: `/student` 12,970 · `/teacher` 13,090 · `/parent` 13,118 · `/professional` 13,113 · `/organization` 13,381 — identical; the centring is opt-in through the landing's own props.

Gate: `scope:audit:write` (68 / 26 / **1,649**) → eslint clean → both typechecks clean → vite build clean → **532/532 tests**. Evidence: `landing-v13-apple-composition-2026-10-20/V14_GRAMMAR.md`.

### 17.4 No commits — the founder holds version commits.
