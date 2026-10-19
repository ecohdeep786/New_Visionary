# Landing v3 — the company front door (proposed 2026-10-19)

> **Historical proposal.** This v3 handoff records the original structural
> proposal. The current page and its v4–v6 build records are in
> `LANDING_FINAL_FRONT_DOOR.md` and `LANDING_EXPERIENCE_SPEC.md` (v6 spec).

**Status: proposed — awaiting founder review before build.** `/` currently ships
the v2 story-chapter structure (built 2026-10-18, gate green). This proposal
restructures the front door so it tells the **company's** story the way
apple.com's home does, because the v2 chapters retell feature stories that the
five category pages and `/how-it-works` already own.

## 0. The mandate

Founder direction (2026-10-19): the design language holds; the **structure** is
wrong. The landing currently shows features — but every feature already has its
full treatment on each category page ("we had show how our product is best for
each category in those pages"), and the mechanism is also told on
`/how-it-works`. The main page must instead tell **about the company**: what,
why and how Visionary exists — the way apple.com's front door lets any visitor
fully understand Apple — then hand each visitor to the page that owns their
depth.

The test for v3: after one scroll of `/`, a first-time visitor understands
**what Visionary is, why it exists, who it is for, what it includes, what it
stands for, and where to start** — without reading a feature chapter twice.

## 1. What the studies found

### 1.1 The site is already a complete company surface — 26 public pages audited

Playwright/msedge at 1440×900, zero page errors across all routes. Evidence:
`artifacts/research/landing-company-study-2026-10-19/site-audit/`
(`site-map.json` + full-page capture per route).

| Page | docH | What it owns (h1) |
|------|------|-------------------|
| `/` | 11,393 | the front door (v2 story chapters) |
| `/student` … `/organization` (5) | 13.3–13.7k | the five per-persona feature stories |
| `/how-it-works` | 7,137 | the product walkthrough + the loop — "How Visionary works." |
| `/help` | 2,477 | support — "Find your answer." |
| `/pricing` | 5,561 | plans — "Plans for every journey." |
| `/download` | 4,762 | devices + sync — "Get Visionary on every device." |
| `/about` | 8,249 | the company story — "Helping people turn questions into understanding." |
| `/research` | 12,014 | mission + R&D — "One intelligence, every learner." |
| `/updates` | 5,035 | the newsroom — "What's new at Visionary." |
| `/careers` | 7,535 | "Search for your place at Visionary." |
| `/community` | 6,120 | "Communities and programs for everyone learning together." |
| `/contact` | 6,117 | "Guidance to get you going on Visionary" |
| `/partners` | 8,787 | "Better learning, together." |
| `/referral` | 6,388 | "Share a better way to learn." |
| `/safety` · `/privacy` · `/security` · `/accessibility` | 6.8–9.2k | the four trust values, each a designed page |
| `/cookies` · `/terms` | 6.1–8.6k | legal |

The nav (`Who you are` · `How it works` · `For organizations` · `Pricing` ·
`Download` · `About`) and the footer directory (Product / Company / Resources /
Partners and support / Trust and legal) already carry the complete sitemap.

### 1.2 The duplication diagnostic — why v2 felt wrong

| Landing v2 chapter | Also lives on |
|--------------------|---------------|
| `05-intelligence` — "One intelligence." + 4-beat loop, 2,849 px | all five category pages (`05-intelligence`) + `/how-it-works` (`05-loop`) |
| `07-language` — "Every language. One understanding." | all five category pages (`07-language`) |
| `06-journey` — "Life changes. Visionary keeps pace." | all five category pages (`04-journey` / `10-journey-flow`) + `/about` (`03-journey`) |
| `11-trust` — values prose | all five category pages (`11-trust`) |
| `13-explore` — the five journeys | category pages close with it as a tail module (`13-explore`) |

Read-out: the landing retold the persona feature narrative at umbrella size.
The feature depth was said three times (landing · category · how-it-works), while
the company-level surfaces — About, Pricing, Download, Updates, the four trust
pages — had **no door** on the front door.

### 1.3 apple.com's home, measured (2026-10-19, US site, 1440×900)

docH 13,471 · 56 headings. Visible flow:

1. **Global nav** — the entire product catalog (Store · Mac · iPad · iPhone ·
   Watch · Vision · AirPods · Home · Entertainment · Accessories · Support).
2. **Promo stack** — iPhone Duo (56px name, tagline, filled + outlined pill
   pair, product imagery) → iPhone 18 Pro (dark promo) → Apple Card (banner).
3. **Product tile grid** — 2-up, 3 rows: Apple Upgrade / HomeView (light) ·
   Watch Series 12 / Watch Ultra 4 (dark) · iPad Air / carrier deals (light).
   Tile anatomy: 40px name + tagline + meta line + pills, centered stack,
   imagery below, small gutters, alternating light/dark fields.
4. **Services gallery** — "Endless entertainment." carousel of service cards
   (art, label, action pill), dots + pause.
5. **Legal notes** — long grey fine print.
6. **Directory footer** — Shop and Learn / … / Apple Values / About Apple.

Laws worth translating:

- **No narrative chapters at all.** Understanding comes from the catalog: every
  module is a doorway — a name, a one-line promise, an action.
- The product is shown as a **line-up** (a family of tiles), not explained.
- Values and the sitemap live as a quiet band + directory, not as prose.
- The page is short in content (≈5.5k visible) and ends in the footer
  directory.

### 1.4 The translation — what our front door must show

| Front-door job | v3 module | Doorway |
|----------------|-----------|---------|
| WHY Visionary exists | `02-problem` (umbrella why — unique to `/`) | — |
| the thesis | `03-promise` (one line — unique to `/`) | — |
| WHAT the product is | `05-intelligence` **as a compact dark promo** | → `/how-it-works` |
| WHO it is for | `13-explore` (kept; now the page's visible fork) | → five category pages |
| what the product includes | **new suite band** (Download · Pricing · Help · Updates) | → four product pages |
| what it stands for | `11-trust` **converted to four values cells** | → four trust pages |
| how to start | `12-cta` (existing) | → register / contact |

Feature depth stays where it already lives: category pages + `/how-it-works`.
`/about` keeps the company narrative; `/research` keeps the mission depth.

## 2. The v3 structure (proposed)

| # | data-section | Chapter | Change |
|---|--------------|---------|--------|
| 1 | `01-hero` | One intelligence — the family | unchanged |
| 2 | `02-problem` | Why Visionary exists — the four voices | unchanged |
| 3 | `03-promise` | "What if your intelligence never forgot where you were?" | unchanged |
| 4 | `05-intelligence` | One intelligence — **the product promo** | converted (2,849 px → ≈900 px) |
| 5 | `13-explore` | One intelligence, five journeys — the line-up | unchanged |
| 6 | `14-suite` | The reach band — Download · Pricing · Help · Updates | **new** |
| 7 | `11-trust` | Your learning stays yours — four values | converted to doorway cells |
| 8 | `12-cta` | Your next step starts here | unchanged module; route row dropped |
| — | footer | directory (already complete) | unchanged |

### 2.1 `05-intelligence` → the product promo

- Base: `PremiumIntelligenceSection`, new **optional** `mode="promo"` (default
  behavior untouched — the five category pages render byte-identical).
- Promo anatomy: existing dark scene + top glow; h2 "One intelligence."
  (existing); sub "From the first question to using what you know."
  (existing); one `IntelligenceFrame` visual (static or slow autoplay — no
  beats, no drawers, no dots); one action — **"See how it works"** → `/how-it-works`
  (label verbatim from the hero's secondary CTA).
- Why: the mechanism's depth is owned by `/how-it-works` (`05-loop`) and all five
  category pages (`05-intelligence`). The front door keeps the dark pivot and the
  product's visual signature without retelling the loop.

### 2.2 `14-suite` — the reach band (new)

- Position: after the line-up, before values.
- Anatomy: the About page's explore-card system, verbatim — a `#f5f5f7` ground,
  2×2 white cards, label + line, spot-illustration field right, bottom-right
  cutout arrow (`AboutUsPage.jsx` `ExploreSection`).
- Tiles — label + line from each destination page's own h1 (no new copy):

| Label | Line | Doorway |
|-------|------|---------|
| Download | "Get Visionary on every device." | `/download` |
| Pricing | "Plans for every journey." | `/pricing` |
| Help | "Find your answer." | `/help` |
| Updates | "What's new at Visionary." | `/updates` |

- Heading slot: see §4 — candidates are existing copy only.

### 2.3 `11-trust` → the four values band

- Keep the heading "Your learning stays yours." and the existing sub.
- Cells become the site's four trust pages (page-sourced lines):

| Value | Line | Doorway |
|-------|------|---------|
| Privacy | "You choose what Visionary remembers and how you use it." (current cell) | `/privacy` |
| Safety | "Age-aware guidance and human review help keep learning on track." (current cell) | `/safety` (re-pointed from `/security`) |
| Security | "Secure by design, protected end to end." | `/security` |
| Accessibility | "Help every learner learn how they learn best." | `/accessibility` |

- Grid 3 → 4 columns via optional support on `PremiumTrustSection`; the category
  pages' three-value rendering is unchanged. The "Responsibility" cell retires
  (its page is `/terms`, already in the footer; line retained in history).

### 2.4 `12-cta`

- Keep the existing heading/sub. Drop the v2 `routeLinks` row: the five journeys
  are now the page's core module; repeating them a third time at the CTA is
  noise. The shared CTA keeps its optional prop for other uses.

### 2.5 Dropped from the landing (and where the depth lives)

| Dropped | Depth already lives on |
|---------|------------------------|
| `07-language` chapter | five category pages (`07-language`) |
| `06-journey` life-stages chapter | `/about` (`03-journey`) + category pages (`04-journey` / `10-journey-flow`) |
| intelligence beats, drawers, dots | `/how-it-works` (`04-journey`, `05-loop`) + category pages (`05-intelligence`) |
| CTA five-journey route row | `13-explore` on this page |

### 2.6 Copy sources

Every rendered line already exists: hero/why/promise (current), promo title/sub
(current `05`), promo action (hero CTA label), line-up copy (current `13`), suite
lines (destination h1s), values lines (current cells + trust page h1s), CTA
(current). **The only new micro-copy slot is the suite band's heading** (§4).

## 3. Build plan (on approval)

1. `frontend/src/pages/Landing.jsx` — new order; promo usage; suite band;
   values payload; CTA without `routeLinks`; remove the dropped local
   component/constants/imports; refresh the chapter comments (the codebase
   documents design rationale inline).
2. `frontend/src/components/landing/persona/PremiumPersonaSections.jsx` —
   optional `mode` on `PremiumIntelligenceSection`; optional column support on
   `PremiumTrustSection` — both default-preserving so every other page renders
   unchanged.
3. Gate: `npm run scope:audit:write` (source changed) → frontend `npm run lint`
   → `npm run typecheck` → `npm run build` → `npm test` (532).
4. Live verification (Playwright/msedge, 1440/1024/834/390): chapter order and
   heights; promo height; every suite/values doorway resolves; joins (glass
   seam, grey sheets, rounded corners, dark pivot); no page errors; captures →
   `artifacts/research/landing-v3-2026-10-19/` + `measurements.json`.
5. Docs: build record appended here; conversion-notes entry; no commits
   (founder holds version commits).

## 4. Open questions for review

1. **Why chapter** — keep `02-problem` exactly as-is (recommended: it is the
   only emotional beat, and its four-voice carousel exists nowhere else in this
   form), or slim it to a static statement.
2. **Suite heading** — the only new-copy slot. Options: reuse `/about`'s explore
   heading verbatim ("The work around the product." with eyebrow "Explore
   further") — recommended; or no heading (four labelled cards on the ground).
3. **Suite tiles** — Download · Pricing · Help · Updates (recommended: the
   product-around-the-product). Alternative mix: About / Research / Community.
4. **CTA route row** — drop (recommended) or keep as a last-moment router.
5. **Language** — no trace on the front door (recommended: category pages and
   `/how-it-works` own it), or one line inside the promo.

## 5. Evidence archive

- `frontend/artifacts/research/landing-company-study-2026-10-19/site-audit/` —
  26 route captures + `site-map.json` (titles, docH, heading/typography
  inventory, page errors).
- `frontend/artifacts/research/landing-company-study-2026-10-19/apple-home/` —
  `apple-home-map.json` (nav catalog, 56 headings, section bounds, tile link
  inventory) + 12 viewport segments + full-page capture.

## 6. Build record — 2026-10-19 (approved and built)

Founder go-ahead: "okay start build as how apple and google main page is worked
and launch." The v3 structure was built as proposed, with the following
build-time decisions on the open questions (§4).

1. **Why chapter** — kept exactly as-is (`02-problem`, four-voice carousel).
2. **Suite heading** — built as eyebrow-only: "Explore further" over the four
   cards, no display heading. Reason: on the landing the About line ("The work
   around the product.") describes the company's work (research/careers), not
   the product doors, and the band reads as the line-up's quiet tail — the way
   Apple's tile grids carry no separate heading. No new copy is invented; the
   About heading pair remains a one-line add if the founder prefers it.
3. **Suite tiles** — Download / Pricing / Help / Updates, each line the
   destination page's own h1.
4. **CTA route row** — dropped; the CTA closes with the action pair only.
5. **Language** — no trace on the front door (category pages and
   `/how-it-works` own it).

### 6.1 What shipped

- `frontend/src/pages/Landing.jsx` — order `01-hero → 02-problem → 03-promise →
  05-intelligence (promo) → 13-explore → 14-suite → 11-trust → 12-cta`;
  new `LandingSuiteSection` (About explore-card anatomy, static 2×2 grid on the
  continued grey ground); trust values now Privacy `/privacy` · Safety
  `/safety` · Security `/security` · Accessibility `/accessibility`; CTA
  without `routeLinks`; `07-language`, `06-journey`, the route row and their
  models/imports removed (no dead code).
- `frontend/src/components/landing/persona/PremiumPersonaSections.jsx` —
  `PremiumIntelligenceSection` gains `promo` mode (statement over one
  auto-morphing stage; 4.2s beat cycle; reduced-motion respected; stage marked
  decorative) and `PremiumTrustSection` opens a fourth column when a page
  passes four values. Category pages pass neither option and render unchanged.
- `frontend/src/styles/public-bridge.css` — landing-scoped no-seam rule for
  `14-suite` (continues the `13-explore` grey; the surface change into
  `13-explore` remains the join).

### 6.2 Verified

- `npm run scope:audit:write` → 68 routes / 26 endpoints / 1,640 declarations.
- Gate: eslint clean → tsc (both configs) clean → vite build clean → `npm test`
  532/532.
- Live (Playwright/msedge; 1440/1024/834/390): section order exact at all four
  widths; zero page errors; no horizontal overflow; docH 7,803 @1440 (v2:
  11,393). Promo band 1,117px @1440 (compact), suite 838px, trust 734px, CTA
  585px. Doors: promo → `/how-it-works` (click-tested), suite →
  `/download` `/pricing` `/help` `/updates` (Pricing click-tested), values →
  `/privacy` `/safety` `/security` `/accessibility`, CTA → `/register` +
  `/contact` only. Trust grid renders four columns at ≥1024 and one below.
  Joins: suite top seam muted (grey→grey), trust keeps the whisper hairline
  (surface change). Promo stage morphs through its four beats (0→1→2 observed
  live).
- Evidence: `frontend/artifacts/research/landing-v3-2026-10-19/` — per-chapter
  captures at four widths, reduced-motion full pages, `landing-v3-verify.json`.

### 6.3 Held by the founder

- No commit/push — version commits are the founder's.
- `/security` and `/accessibility` restructures remain pending founder feedback.

## 7. v4 — the return chapter (2026-10-19)

The founder's follow-up mandate (the four-site R&D: apple.com home, Khan
Academy, Gemini Notebook, Google for Education; the four buyer questions; the
₹1 → ₹10,000 return) is built: the page now carries `04-return` between the
promise and the promo — the founder's conviction (verbatim from `/research`,
attributed) and the four returns (hours stack / place kept / language works /
progress shows). Full R&D synthesis, the final flow and the build record live
in `docs/visionary/design/LANDING_FINAL_FRONT_DOOR.md`. The suite heading stays
eyebrow-only until the founder weighs in; everything else from v3 holds.
