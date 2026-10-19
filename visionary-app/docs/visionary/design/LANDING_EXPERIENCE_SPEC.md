# Landing — the designed experience (v5 spec)

Status: **built and verified (2026-10-19) — awaiting the founder's review of the refit as it renders on the page.** The founder's "continue" released the build; §4 was implemented in `Landing.jsx` with three measured refinements recorded in §8. v4's approved parts stand; the founder quote is approved and stays.

Date: 2026-10-19. Second R&D pass (live interaction study). Evidence: `frontend/artifacts/research/landing-final-study-2026-10-19/interaction/` — per-site filmstrips (a frame every 675px through each page), sticky/media/motion probes, CTA hover deltas (`interaction-probe.json`).

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
| 02 problem | Is this about me? | "Why Visionary exists": statement + four real voices crossfading in studio photography, reader-paced | recognition | — (the story) |
| 03 promise | What if? | one sentence, fading with the scroll | lift | — |
| 04 return | What do I get back? | the founder's conviction + the four returns, each with its mark, its door, and the five-journey line | confidence | 4 cell doors + 5 journey links (**§4 refit**) |
| 05 intelligence | How does it work? | the dark pivot: one intelligence over one morphing stage | power | See how it works → /how-it-works |
| 13 explore | Who is this for? | five journeys as one line-up of portraits | belonging | 5 persona pages |
| 14 suite | Where do I go next? | four doors around the product in the same grey catalogue | orientation | Download · Pricing · Help · Updates |
| 11 trust | Can I trust it? | your learning stays yours: Privacy · Safety · Security · Accessibility | safety | 4 pages |
| 12 cta | What's my next step? | the invitation; "Free to start. Private by design." | invitation | Get started · Talk to our team |
| footer | Who are they? | directory, language, legal | air | the whole site |

**The light rhythm is already designed and stays:** white story run (01–04) → dark product pivot (05) → grey catalogue (13–14) → white trust (11) → grey close (12) → footer air (#F5F5F7). No new grounds.

**By the footer, the visitor has met** the promise (01–03), the return (04), the mechanism door (05), their journey (13), their next task (14), the trust (11), and the invitation (12). No chapter asks them to believe a number; every door opens a real page.

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
