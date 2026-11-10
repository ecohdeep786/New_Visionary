# The Final Front Door — R&D synthesis + the return chapter

**Date:** 2026-10-19 · **Page:** `/` (`Landing.jsx`) · **Status:** built, awaiting founder review

## 1. The mandate

Founder directive (2026-10-19): the v3 structural fix carried ~10% of the way; matching the product's front door needs the remaining R&D, design and flow. Study how four front doors work — apple.com, khanacademy.org, the Google notebook product (NotebookLM), and Google for Education — then rebuild the landing so a first-time visitor's four questions are answered, in order:

1. **Why do I use this?** — a real-life problem they recognise.
2. **What benefit do I get if I invest time?** — the ₹1 → ₹10,000 return (service, solution, achievement).
3. **Why should I believe this product?**
4. **Why not another product?**

Apple sells premium and status; Google sells ease and fast answers; Visionary is education + AI and must read as the premium standard of learning with the effortless help — so users stay, the way Apple and Google users stay.

## 2. The four front doors, measured live (2026-10-19, 1440)

Evidence: `frontend/artifacts/research/landing-final-study-2026-10-19/` — per-site structure maps (`map.json`: headings with sizes, CTAs with hrefs, positions), hero + per-heading segment captures, full pages.

### 2.1 apple.com home — the premium stack (docH 13,471; 144 CTAs)

- **Flow:** hero — product name → one-word beat ("Hello.") → availability → the pill pair (Learn more / Pre-order) → the product in human hands. Then: dark product chapter (name → one-line tagline "Pro further." → the same pill pair → giant render) → alternating light/dark product chapters and 2-up tiles → "Endless entertainment." services shelf (statement + full-bleed card row) → mega footer.
- **Devices:** four elements per module, no more; lines of 2–8 words; whitespace as the luxury; every module ~one viewport; the CTA pair is always filled primary + outlined secondary; products shown in use by humans.
- **What we take:** the module discipline (one idea, one statement, at most one action), the light/dark rhythm, and uniform door language ("Learn more" everywhere).

### 2.2 khanacademy.org home — the mission + role fork (docH 9,414)

- **Flow:** utility band → nav → hero: outcome headline ("Khan Academy boosts scores!") + one-line how + a real learner photo with hand-drawn marks + the **role card fork in the fold** (Student / Family / Teacher) → course strip → "Why Khan Academy works" (three pillars, each an illustration + a name + three lines) → role-labelled testimonial carousel → mission line ("You can learn anything.") → "Every child deserves the chance to learn." → **closing role fork** (Learners / Teachers / Parents / Give today) → supporters → footer.
- **Devices:** the visitor self-identifies at the top and again at the close; outcome language; warmth (serif + doodles); proof of impact; free.
- **What we take:** a fork at both ends of the story; pillar blocks (mark + name + three lines) as the "why it works" anatomy; voices labelled by who is speaking.

### 2.3 Gemini Notebook (notebooklm.google.com → notebook.google) — magic + artefacts (docH 6,577)

- **Flow:** hero card on a soft rainbow wash — eyebrow ("Your AI-powered research partner") → **rotating promise headline** ("Understand anything" ↔ "Turn your files into Slide Decks", 76px, the promise word in blue) → one grounding sentence ("grounded in the information you trust") → **one** black pill → feature carousel (name + one-liner + big demo, dot controls) → **public notebooks gallery** (real artefacts with source counts and an open arrow) → press quotes ("Blew Our Minds." — WSJ, The Verge, Barron's) → "Want to learn more?" FAQ → footer.
- **Devices:** one promise, one button; rotation at headline scale; proof by real user work; trust words next to the action ("grounded", "the information you trust").
- **What we take:** proof must be real, never invented; the CTA keeps its trust line beside it; our hero already rotates the audience the way theirs rotates the promise.

### 2.4 Google for Education (edu.google.com) — institution-grade clarity (docH 9,589)

- **Flow:** announcement band → hero: institutional promise at 80px ("Elevating Educators. Empowering Learners.") + research-backed sub + a soft "Learn about" link + the real product in context (Chromebook + Classroom UI) → product trio (36px) → "In a secure and flexible suite" (a 64px trust statement) → "That meets your unique needs" — **role tabs** (K-12 / Higher Education / Education Leaders / IT Admins / Educators), each with photo + promise + "Explore solutions" → "Everything you need… now in one place" → dark "Start today" band → FAQ (exactly the objections: resources, tools, choosing, editions, **privacy/security of student data**) → footer.
- **Devices:** each role gets its own words; the trust chapter is explicit; objections are answered as content; the product is visible.
- **What we take:** role tabs ≈ our five-journey line-up; the explicit trust chapter; objection handling exists — but it lives on `/help`, because the landing is a door, not the manual.

## 3. The synthesis — the four questions, answered by chapter

| The buyer's question | Where the front door answers it |
| --- | --- |
| **Why do I use this?** | `02-problem` — "Effort isn't the gap. Knowing whether understanding landed is." + the four voices (teacher, parent, student, professional) |
| **What benefit if I invest time?** | `04-return` (**new**) — the founder's conviction + the four returns: hours stack, the place is kept, the language works, progress shows |
| **Why should I believe it?** | `05-intelligence` (the mechanism, door to `/how-it-works`) + `11-trust` (Privacy / Safety / Security / Accessibility) + the closer's "Free to start. Private by design." |
| **Why not another product?** | `03-promise` ("What if your intelligence never forgot where you were?") + `04-return` ("start over" — what every other tool still does) + `11-trust` (private by design) |

## 4. The final flow (v4)

| id | chapter | it is | its door |
| --- | --- | --- | --- |
| `01-hero` | One intelligence | the universal statement, the cycling audience line, the five cutouts, Start learning / See how it works | `/register`, `/how-it-works` |
| `02-problem` | Why Visionary exists | the four-voice carousel — statement, studio subject, quote | — (the turn) |
| `03-promise` | The thesis | one sentence: "What if your intelligence never forgot where you were?" | — (the turn) |
| `04-return` | **What you get** | **new** — the founder's conviction + the four returns | — (the promo beneath) |
| `05-intelligence` | One intelligence (promo) | the dark pivot: statement over the morphing stage | `/how-it-works` |
| `13-explore` | One intelligence, five journeys | the line-up — the five category cards | `/student` … `/organization` |
| `14-suite` | Explore further | Download / Pricing / Help / Updates — each line the destination's own | the four doors |
| `11-trust` | Your learning stays yours | the four values columns | `/privacy` `/safety` `/security` `/accessibility` |
| `12-cta` | Your next step starts here. | the closer — Get started + Talk to our team | `/register` `/contact` |

Laws kept from v3: one idea per chapter; every module a door; no stacked cards, no seams — white ground continues through related chapters and a surface change *is* the join; reveals ride the apple resolve curve; reduced motion shows everything.

## 5. The return chapter (04) — what was added and why

It answers question 2 (the benefit) and carries question 4 (life without it: starting over). It sits between the promise ("what if…") and the mechanism ("how"), so the story reads: the real problem → the shift → **what you get** → how it works → where you fit → the doors → why to trust it → start.

**Anatomy** — the trust values chapter's bookend: eyebrow (chapter-label tier, 17px medium graphite), a statement, then typographic columns on the Education editorial spine, hairline rules, no icons, no links (the promo beneath is the chapter's door).

**Statement** — the founder's conviction, verbatim from `/research`, attributed: *"A person should not have to start over every time life asks them to learn something new."* — Md Shahid Ali · Founder and CEO. Rendered at the display tier (40px @1440, ~32ch, two balanced lines).

**The four returns** — title + line, with sources:

| Return | Line | Source |
| --- | --- | --- |
| Your hours stack. | "Every lesson builds on the last. This year's work becomes next year's strength." | sentence 1 verbatim from `/teacher`; sentence 2 adapted from `/teacher`'s "Turn this year's teaching into next year's craft." |
| Your place is kept. | "Visionary remembers where you stopped, so every session continues." | derived from `/how-it-works` ("Your learning never resets… remembers your place") |
| Your language works. | "Ask, reason, and learn in the language you think in — English, Hindi, and Bengali today." | verbatim from `/professional`; the three languages factual from `/accessibility` |
| Your progress shows. | "Teachers and parents see progress while it still matters." | new line, consonant with `/teacher` and `/parent` |

Only the four titles, the fourth line, and the eyebrow label are new; everything else is the product's own words.

## 6. Build record

- `frontend/src/pages/Landing.jsx` — `LandingReturnSection` + `LX_RETURNS` + the composition (`03-promise → 04-return → 05-intelligence`).
- `frontend/src/styles/public-bridge.css` — landing-scoped `04-return` join: no seam into the promise's white field; compact opening breath (question → answer reads as one movement); the dark promo keeps its full breath as the next surface change.
- Product-surface inventory refreshed with the same counts: 68 routes / 26 endpoints / 1,640 declarations.
- Gate: eslint clean → tsc (both configs) clean → vite build clean → `npm test` 532/532.
- Live (Playwright/msedge, 1440/1024/834/390): section order exact at all four widths (including `04-return`); zero page errors; no horizontal overflow; docH 8,525 @1440 (v3: 7,803). The return chapter: four columns ≥1024, stacked below; statement 40/28.7/26/26px across the widths; joins — promise→return no seam (transparent border), return keeps the full breath into the dark promo. Doors re-click-tested: promo → `/how-it-works`, Pricing tile → `/pricing`.
- Evidence: `frontend/artifacts/research/landing-v4-2026-10-19/` — per-chapter captures at four widths, reduced-motion full pages, `landing-v4-verify.json`.

## 7. Open for review

- **The founder-quote reuse** (from `/research`) as the return chapter's statement — approve, or swap to the product-voice line "Then nothing you learn is lost." (a one-line change).
- **19px body cells**: the return cells use the same value tiers as the trust chapter (19/19, weight distinguishes title from body) — if the founder wants larger return copy, it is a tier change in one class.
- **Suite heading** remains eyebrow-only ("Explore further"); the About pair ("The work around the product.") stays a pending one-line add.
- Founder review (same day): **the quote is approved — it stays.** The four columns' missing icon and category relation, plus the full-page experience design, are addressed in `LANDING_EXPERIENCE_SPEC.md` (v5 spec, second R&D pass). The founder's "continue" released the build: the `04-return` refit is live in `Landing.jsx` — marks, doors, the five-journey close — gate-green (532/532) and verified at 1440/1024/834/390; §8 of the spec is the as-built record. Awaiting his look at the rendered page.
- Flow review (same day): the founder asked for a harder rework of the **flow and format** — the product must answer on the first scroll, and the page must read as Apple paces a page, not as a text corridor. Third R&D pass measured Apple/Google formatting at 1440 (`frontend/artifacts/research/landing-flow-study-2026-10-19/FLOW_STUDY.md`). The v6 rework is live: product-first order (`05-intelligence` after the hero), the promise as a black statement screen, and the founder quote at statement scale — gate-green (532/532), verified at 1440/1024/834/390; §9 of the spec is the record. Awaiting his look.
- Apple-layout review (same day, two rounds): the close pass (trust feature panel / CTA black band / cohesive suite tiles — v7) and the page-wide pass (problem story split, return gutters — v8) are live and gate-green (532/532), verified at 1440/1024/834/390; `LANDING_EXPERIENCE_SPEC.md` §10–§11 are the as-built record; evidence in `frontend/artifacts/research/landing-v7-close-2026-10-19/` and `landing-v8-story-split-2026-10-19/`. Awaiting his look at the rendered page.
- Persona review (same day): the universal-fit walkthrough (student → teacher → parent → professional → organization) and the v9 entry fix are live — a landing-only audience rail under the hero actions puts all five persona doors on the first screen (hover/focus previews the cycling line, click opens the page; reduced-motion safe, persona heroes untouched). `LANDING_EXPERIENCE_SPEC.md` §12 and `artifacts/research/landing-v9-universal-entry-2026-10-19/UNIVERSAL_FIT.md` are the record. Awaiting his look at the rendered page.
- Section-by-section pass (same day, v10): on his call, the intelligence band's blue pill became Apple's dark-band white pill (mark floats bare, promo-only); "What you get" rebuilt as Apple values cards (grey 28px cards, doors pinned, 4-up/2-up/stacked — measured from apple.com/in/education "Our values lead the way."); the suite's eyebrow promoted to the Apple statement tier ("Explore further." over the grid, as Vision Pro does). Problem/promise/explore/trust/CTA audited against Apple section maps and left as-built. `LANDING_EXPERIENCE_SPEC.md` §13 + `artifacts/research/landing-v10-apple-reread-2026-10-19/V10_REWORK.md`.
- Section-review pass (same day, v11): the problem chapter is rebuilt as Apple's education-initiative story anatomy — left 17px eyebrow, 64px statement with its 24/600 lead on the 980 spine, then one white story card (portrait left, quote right) with the pager below the card, on the measured #f5f5f7 band; "What you get" drops its quote to the measured 48px values tier and becomes a 2×2 grid of broad 28px-title cards, with the five-journey route line moved verbatim to the CTA; "Who it's for" and the suite now open at Apple's measured 48px card-chapter tier (was 64), and the explore intro reads at 21/400. Persona line-ups stay 64/40 (verified). `LANDING_EXPERIENCE_SPEC.md` §14 + `artifacts/research/landing-v11-apple-statements-2026-10-19/V11_REWORK.md`. Gate-green 532/532.
- Apple-layout pass (2026-10-20, v12): the three Apple pages were re-measured end to end (section maps at 1440/1024/834/390) and the landing now mirrors Apple's own layout — chapter breathing 140/140 · 122/130 · 120/120, the 1264px card-row measure (gut 88), the product-band (56), black-band (48) and closing-band (56) statement tiers, the hero statement at Apple's 64px landing tier, the suite as Apple's four-across accessory row, and Apple's 12px nav labels in a ~1024 frame. Every other page is untouched (student/teacher/parent/professional/organization re-measured identical). `LANDING_EXPERIENCE_SPEC.md` §15 + `artifacts/research/landing-v12-apple-layout-2026-10-20/V12_PLAN.md`. Gate-green 532/532.
- Apple-layout pass (2026-10-20, v13): Apple's band anatomy was measured live (per band: type offsets, media bleeds, door anatomy) and our bands rebuilt on it — the product band's mark now floats on the band's own ground and the band ENDS on it (Apple's product stages end on the product), the trust chapter became Apple's values row (four white cards on the grey floor, 28px titles, 17px bodies, a blue "Learn more" each), a new measured `card-body` role (17/25) carries the landing's value cards, and the story card matches Apple's 980×516 story media. Every other page is untouched. `LANDING_EXPERIENCE_SPEC.md` §16 + `artifacts/research/landing-v13-apple-composition-2026-10-20/V13_REWORK.md`. Gate-green 532/532.
- Apple-grammar pass (2026-10-20, v14): on the founder's call, **only two chapters were centred** — "Who it's for" (centred at Apple's card-gallery tier, 48 → 56, with its 17px eyebrow and 21px intro) and the problem chapter (centred eyebrow, 64px statement, 24/600 lead). Every other chapter keeps the previous version's alignment and size (the return's founder quote 48 left/500, the suite 48 left, the trust 64 left). The card sections took Apple's premium card law: radius 28, 40px padding, bare 32px icons, 28px titles, 17px bodies, blue "Learn more". Every other page is untouched. `LANDING_EXPERIENCE_SPEC.md` §17 + `artifacts/research/landing-v13-apple-composition-2026-10-20/V14_GRAMMAR.md`. Gate-green 532/532.
- No commits — version commits are the founder's.
