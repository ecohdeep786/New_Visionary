# Landing redesign — story-structure handoff (2026-10-18)

**Status: approved and built (2026-10-18).** This is the redo of the reverted
post-hero restructure. It is grounded in two live studies run today
(Playwright/msedge, measured at 1440; the teacher page also at 390):

- **our five category pages** — the product's own story grammar;
- **Apple / Google front-door pages** — the landing genre.

Built on founder approval the same day; gate green and verified live — §3
records what landed. Raw evidence: §4.

## 0. The mandate

`/` is the company front door. Every kind of visitor arrives there first. It
must (1) tell the product's **overall** story, (2) convince, and (3) hand each
visitor to their category page (`/student` … `/organization`) to learn more.
It is neither a clone of one persona page nor an editorial long-read.

## 1. What the studies found

### 1.1 Our category pages — one story skeleton, five voices

All five pages carry the same ten chapters (verified live; five maps):

| # | data-section | Chapter role | Teacher-page voice (example) |
|---|--------------|--------------|------------------------------|
| 1 | `01-hero` | persona voice + promise + CTAs + figure | "Teaching. Teaching, to grow, to reach." |
| 2 | `02-struggle` | "Every {persona} wonders about {x}" + challenge cards | "Every teacher wonders about understanding." |
| 3 | `04-journey` | stages that meet you (six "Open details" beats) | Lesson planning → Growing |
| 4 | `05-intelligence` | **dark mechanism chapter**: "One intelligence." + 4-step loop + sticky stage | Understand → show another way → know who's with you → what teaching demands next |
| 5 | `07-language` | every language, one understanding | "Teach your way. Explain your way." |
| 6 | `09-achievement` | three achievement cards + image | "See what your class can achieve." |
| 7 | `10-journey-flow` | stage-continuity gallery (pause / prev / next) | "New stage. Same teaching." |
| 8 | `11-trust` | Privacy / Safety / Responsibility + links | "Your teaching stays yours." |
| 9 | `12-cta` | grey sheet CTA (+ Talk to us) | "Your teaching starts with where your class is." |
| 10 | `13-explore` | the other four journeys (paddle row) | "Explore Visionary." |

Read-outs:

- The skeleton is the product story grammar. The landing should tell its
  **umbrella version once** — not borrow a single persona's lens.
- `05-intelligence` ("One intelligence.", scene-dark, ~2,850 px tall, the
  tallest chapter) is the product's centerpiece — and it is **absent from the
  landing**.
- The struggle chapter ("every {persona} wonders about understanding") is
  already the umbrella problem, solved per-persona.
- The category page closes with `13-explore` (the other four journeys) — a
  **tail module**. On the landing the five journeys are the front door's fork,
  so they cannot wear tail-module weight.
- Every chapter is heading + support + media/tiles. No orphan one-line chapters.

### 1.2 Apple / Google front doors — the genre

| Page | Measured chapter sequence | Pattern read |
|------|---------------------------|--------------|
| apple.com/in | hero promo (56px) → product tile grid (40px h3 tiles, ~590px tall) → services gallery → footer | the front door is a **tile catalog**: every module routes elsewhere |
| apple.com/in/ipad | 80px sign-board h1 → "Explore the line-up" (28px ×4) → "Why Apple is the best place to buy" (17px ×8) → "Get to know iPad" (17px ×8) → essentials (32px ×2) → "Significant others" (28px ×3) → explore/shop/more | product family = stacked tile rows under 48px section titles |
| apple.com/in/education | 64px thesis "Designed for every kind of learner." → film banner (25.5px) → pillars (80/48px 2×2) → **dark audience path** (K–12 / Higher Ed / College Students) → real stories (×4) → how to buy → values (privacy…) | **audience routing mid-page**; dark pivot chapter; values near the end |
| edu.google.com | cinematic hero with product cards (36px: Workspace / Chromebooks / Classroom / Gemini) → suite (64px) → audiences (48px) → "Start today" band (272px) → FAQ | "what it is" rides in the hero band; compact start band closes |

Genre laws worth obeying:

- Front-door order: **hook → what it is (tiles/pillars) → who it's for
  (mid-page audience tiles) → proof/stories → values → start**. Audience
  routing is never buried at the tail.
- One-line statements exist only as chapter intros, not as standalone chapters.
- A **dark pivot chapter** marks the centerpiece (Apple's audience path;
  Google's suite band) — light → dark → light rhythm.
- Values (privacy/security) sit near the end as a short row; a compact band
  closes ("Start today" / "How to Buy").

### 1.3 Diagnosis of the current (restored) landing

Current order: hero → `02-problem` → `03-promise` → `13-explore` →
`06-journey` → `07-language` → `11-trust` → `12-cta`.

1. **No "what it is / how it works" moment.** The story jumps problem →
   promise → fork; the mechanism chapter that crowns every category page never
   appears on the front door.
2. `03-promise` is an **orphan one-liner**. The line is right; its form should
   be a chapter intro (genre law).
3. The five-journey router wears **tail-module weight** (the category pages'
   closing "explore the others" weight) instead of front-door fork weight.
4. `06-journey` before `07-language` **inverts the family order** — language is
   a capability of the intelligence; continuity is the long arc that hands off
   to trust.
5. The CTA ends without pointing back to the five category pages.

## 2. Proposed structure

```
hero → problem → promise → INTELLIGENCE (new) → router → language
     → journey → trust → CTA (+ last-moment router) → footer
```

Story arc in one line: the gap (problem) → the what-if (promise) → the machine
(intelligence) → your fork (router) → every language → it lasts with you
(continuity) → it stays yours (trust) → start.

| # | data-section | Chapter | Base | Change |
|---|--------------|---------|------|--------|
| 1 | `01-hero` | One intelligence · five figures · dual CTA | existing | **keep untouched** |
| 2 | `02-problem` | The gap: understanding is invisible | existing | keep (the persona band already carries all five voices) |
| 3 | `03-promise` | The what-if thesis | existing | keep — it now crowns the mechanism |
| 4 | `05-intelligence` | **The mechanism**: One intelligence, 4-step loop (dark) | the category pages' shared chapter | **new on the landing** |
| 5 | `13-explore` | **The fork**: One intelligence, five journeys. | existing module | keep; lands directly under the mechanism |
| 6 | `07-language` | Every language. One understanding. | existing | move above the journey (family order) |
| 7 | `06-journey` | Life changes. Visionary keeps pace. | existing | keep (its close hands off to trust) |
| 8 | `11-trust` | Your learning stays yours. | existing | keep |
| 9 | `12-cta` | Your next step starts here. | existing | add the five-journey last-moment router row |

Details:

- **`05-intelligence`** reuses `PremiumIntelligenceSection` (`steps`, `sub`)
  from `PremiumPersonaSections.jsx` exactly as the category pages render it.
  Copy: the student page's umbrella voice (`INTELLIGENCE_STEPS` in
  `StudentPage.jsx` — "Understand what you're learning." / "See it. Hear it.
  Ask it another way." / "Practice what you're learning." / "Build from what
  you know."; sub "From the first question to using what you know."). **No new
  copy invented.** The dark scene gives the landing its light→dark→light pivot
  and gives the promise line the chapter it deserves.
- **Router**: module unchanged; its position after the mechanism is what makes
  it the fork (Apple-education audience-path position). Its heading is already
  "One intelligence, five journeys."
- **Language before journey**: matches the family order (`07` before
  continuity); the journey's close ("Built for who you are. Ready for who you
  become.") then hands off to trust.
- **CTA row**: "See how it works for: Student · Teacher · Parent ·
  Professional · Organization." — the last-moment router (Apple's tail
  mini-router / Google's start band). Flagged optional; trivial to drop.
- **Not doing**: no achievement chapter (persona-aspirational — covered by
  mechanism + router), no FAQ (we have `/help`), no pricing block (nav owns
  it), no edits to the category pages, nav, or footer, no hero/glass changes,
  no new motion mechanics.

## 3. Build (landed 2026-10-18, as approved)

1. `src/pages/Landing.jsx`: `PremiumIntelligenceSection` rendered after the
   promise (`05-intelligence`; the student page's umbrella copy verbatim);
   `PremiumLanguageSection` moved before `LandingJourneySection`; CTA given
   `routeLinks`; section-index and page-anatomy comments refreshed.
2. `PremiumPersonaSections.jsx`: `PremiumCTASection` gained the optional
   `routeLinks` row (separators glued to the preceding label, so no dot ever
   leads a wrapped line). The category pages pass nothing: unchanged.
3. Chapter joins verified live, no fixes needed — promise → dark scene (the
   category pages' own join), dark → router's grey sheet (the same
   sheet-over-dark seal as `07-language` over `05-intelligence`), grey → white
   language sheet.
4. Gate: `scope:audit:write` → eslint clean → tsc both configs clean → vite
   build clean → 532/532 tests (final run after the wrap polish: 532/532).
5. Verified live and reloaded; evidence in §4; conversion-notes entry added.

Measured after build (Playwright/msedge, localhost:5173): the order holds at
every width — `01-hero → 02-problem → 03-promise → 05-intelligence →
13-explore → 07-language → 06-journey → 11-trust → 12-cta`; docH 11,393 @1440;
the mechanism chapter measures 2,849 / 2,534 / 2,681 / 2,411 px at
1440/1024/834/390 — the same scale as on the category pages. No page errors.

## 4. Evidence archive

- `artifacts/research/category-pages-study-2026-10-18/` — five persona maps
  (1440; teacher 390) + full-page captures.
- `artifacts/research/landing-genre-study-2026-10-18/` — apple.com/in,
  /in/education, /in/ipad, edu.google.com maps + full-page captures.
- `artifacts/research/apple-study-2026-10-18/` — education-initiative deep
  study + the reverted v1 patch (`landing-v1-restructure.patch`).
- `artifacts/research/landing-restore-2026-10-18/` — baseline restored shots.
- `artifacts/research/landing-v2-2026-10-18/` — post-build set: the new chapter
  joins at 1440 (promise→intelligence, intelligence top/mid, router seal,
  language seal, CTA), responsive shots at 1024/834/390, `measurements.json`.
