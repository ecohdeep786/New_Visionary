# v10 — the Apple section-by-section pass (2026-10-19)

Status: **built and verified — awaiting the founder's review of the rendered page.**
Scope: landing only. `PremiumPersonaSections.jsx` promo branch (intelligence), `Landing.jsx`
(return, suite). Persona pages verified untouched.

## 1. The ask

Change the blue button to white; then work the next section to Apple's premium section
style; then "What you get"; then the next sections, "and so on" — checking the founder's
open Apple pages (education, education-initiative, Apple Vision Pro) from start to end.

## 2. Reference study — measured live at 1440 (2026-10-19)

`apple-reread.json` + filmstrips (`education-frame*.jpg`, `vision-pro-frame*.jpg`,
`education-initiative-frame*.jpg`). Section maps:

| Page | Anatomy that mattered |
| --- | --- |
| apple.com/in/education (7,405px, 9 sections) | "Our values lead the way." — **statement + white cards with 28px radius, icon top-left, title, copy, "Learn more >" link** (measured from `education-frame07.jpg`); black strip "From grade school to grad school." (771px); "Real stories. Real impact." + card row; "How to Buy." |
| apple.com/in/education-initiative (7,945px) | universal hero sentence; three ~950px story sections; "Our work in education doesn't end here." + card row on `#f5f5f7`; "Our values lead the way." again |
| apple.com/apple-vision-pro (32,700px) | hero, then "Take a closer look." — **statement + grey media cards with 28px radius on white** (from `vision-pro-frame03.jpg`); "Explore Apple Vision Pro accessories." — **statement over the card grid** (764px, `#f5f5f7`) |

Two laws taken: **a card section opens with a statement, never a small eyebrow**; and
**dark product bands carry a white pill, never a filled accent button**.

## 3. What changed

### 3.1 Intelligence band (05, promo mode — landing only)
- **Blue pill → white pill** (`#4285F4` → white, ink text, hover `#f5f5f7`, dark ring
  offset). Measured before/after at 1440: `rgb(66,133,244)` / white text →
  `rgb(255,255,255)` / `rgb(18,19,23)`.
- **The mark floats bare**: promo passes `plain` to `IntelligenceFrame`, dropping the
  card border (`borderColor transparent`, measured `rgba(0,0,0,0)`); the card field keeps
  its depth. Stage 520 → 560px. The default (persona pages) keeps its card border
  byte-identical.
- Section height 1,117 → 1,157 @1440.

### 3.2 "What you get" (04) — Apple values cards
- The four returns leave the cramped hairline columns (980px editorial spine, ~221px
  cells) and become **grey `#f5f5f7` cards, 28px radius** (the Watch/AirPods card
  language, `rounded-[1.75rem]` because `rounded-[28px]` is hijacked to 12px), icon →
  title → copy → **editorial door pinned to the card baseline** (`mt-auto`).
- Grid: **4-up ≥1069 · 2-up ≥640 · stacked on the phone**; frame widened from the 980
  editorial spine to the page's wide card frame (1265px, 80px gutters).
- Measured at 1440: 4 cards ×264px, radius 28px, bg `rgb(245,245,247)`, doors
  `#0066cc`, links aligned at one baseline; 1024/834 2-up (424/385px); 390 single column.
- Section height 990 → 1,051 @1440.

### 3.3 Suite "Explore further" (14) — the statement tier
- The 17px eyebrow promotes to the Apple section statement above the grid (Vision Pro
  "Explore Apple Vision Pro accessories."): same words, one statement period —
  `Explore further.` at clamp(28–44px), semibold, ink.
- Measured: 64px @1440 · 56px @1024/834 · 40px @390. Section 838 → 886 @1440.

### 3.4 Audited, unchanged (already at the reference)
- **Problem (02)** — the story split matches Apple's initiative story sections
  (statement, portrait, pull-quote, pager).
- **Promise (03)** — the black statement strip matches Apple's black chapter
  ("From grade school to grad school.", 771px).
- **Explore (13)** — shared module; landing uses it verbatim by design (family unity
  with the persona pages).
- **Trust (11) / CTA (12)** — v7-built on Apple Watch close-card + Beats close.

## 4. Measured totals

| @ | intelligence | return | suite | docH | overflow |
| --- | --- | --- | --- | --- | --- |
| 1440 | 1,157 | 1,051 | 886 | 9,496 | none |
| 1024 | 1,047 | 1,090 | 787 | 9,014 | none |
| 834 | 1,014 | 1,042 | 746 | 9,000 | none |
| 390 | 795 | 1,632 | 1,188 | 10,271 | none |

Persona check (`/student`): no promo pill, no return cards, no suite statement — the
persona heroes and modules render exactly as before.

## 5. Gate

`scope:audit:write` (68 routes / 26 endpoints / 1,646 declarations) → eslint clean →
both typechecks clean → vite build clean → **532/532 tests**.
Console hygiene: only the two pre-existing entries (`/api/auth/me` 500 absent dev
backend; `fetchPriority` warning at `NewPersona.jsx:127`).

## 6. Evidence

`landing-v10-apple-reread-2026-10-19/`: `apple-reread.json`, Apple filmstrips,
`current/*.jpg` (pre-rework section crops), `verify/*.jpg` (post-rework crops at
1440/1024/834/390), `verify/v10-verify.json`.

## 7. Founder calls

1. The statement period in "Explore further." — same words, punctuation only.
2. The return's quote stays the section statement (54px); Apple's values statement is
   plain text — swapping the founder quote for plain copy would be a copy change, held.
