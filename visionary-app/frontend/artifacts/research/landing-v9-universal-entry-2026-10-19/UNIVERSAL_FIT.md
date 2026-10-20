# The universal front door — persona walkthrough and the v9 entry fix (2026-10-19)

Status: **built and verified — awaiting the founder's review of the rendered page.**
Scope: landing only (`NewPersona` gains an optional `audienceLinks` prop; `Landing.jsx`
passes the rail). Zero copy changes, zero new assets, no shared defaults touched.

## 1. The walkthrough — standing on the page as each visitor

Method: simulated first-time visits at 1440 and 390, no prior context. The notes are
what a person notices, thinks, and does — not what the code says.

### A student (16, exam prep)
The headline says "for students." I see myself in the family. I tap **Start learning**
within a few seconds — and if the register flow asks for my board/exam, I'm in. If I'm
cautious, I scroll first: the dark stage shows something turning a question into
practice; the teacher story confuses me ("is this for my teachers?"), then the parent
story, then finally the student story — *"I watched eight hours of videos and still
couldn't solve a single problem on my own."* That's me. The black line ("What if your
intelligence never forgot where you were?") and "Your hours stack" keep me. Privacy
matters because of exams. **What I do: tap Start learning early, or scroll until the
Student journey.** Nothing on the first screen tells me what I'd actually learn or
that it's free.

### A teacher
The first frame says "for students." — for 2.6 seconds I think this is a student tool.
Then it flips to "for teachers." and I relax. **Start learning** is not my verb; I want
**See how it works**, and I want someone to show me the classroom. The product stage is
good — it answers before it explains. The first human story is mine: *"I taught the
whole class. Half of them still left lost."* "Your hours stack. Every lesson builds on
the last…" is exactly my pain; "Teachers and parents see progress while it still
matters" is my win. Safety and privacy for minors is what I check before recommending
anything. **What I do: hover nothing (there is nothing to hover), wait for my frame,
tap See how it works, then find the Teacher journey.**

### A parent
I'm asking two questions: *is this safe for my child,* and *will I finally see what's
happening?* The first frame says "for students." — I'm not sure if this is for my kid or
for me. The story section wins me: *"The report card says fine. I still don't know how
to help at home."* "Your progress shows. Teachers and parents see progress while it
still matters." The trust panel answers safety ("age-appropriate guidance and family
controls"). But safety is my *first* question when an AI touches my child, and it lives
near the bottom of the page. **What I do: scroll looking for safety and progress;
Start learning reads like it's for me, not my child.**

### A professional
I read a lot and retain nothing — the black line "What if your intelligence never
forgot where you were?" is for me. But the page's vocabulary is classroom-first
(teacher, class, parent, report card), and my frame arrives ~7.8 seconds late. The
professional story (*"I read every article. I still can't turn them into the work."*)
and "Your hours stack" land. "Your language works" is not my problem; nothing on the
first screens speaks about skills, career, or work. **What I do: skim for evidence this
is not only a school tool; if I see the Professional journey, I go deeper.**

### An organization (school, coaching, workplace L&D)
My frame arrives last — up to 10.4 seconds — and by then I may have scrolled or left.
I buy on: governance, controls, deployment, outcomes, pricing, contact. The page gives
me the product stage, the mission stories (good context), "Security — protected end to
end," the Pricing and Help doors, and "Talk to our team" in the close. There is no
organization voice in the story chapter and nothing above the fold about deployment or
outcomes. **What I do: look for Pricing and Contact; if I wait for "for
organizations.", I take the Organization journey.**

### What the walkthrough proves
- Five personas arrive with five different first questions.
- The page's **content** answers all of them — if they keep reading.
- The page's **entry** does not: one audience line cycles (2.6s each, 10.4s full
  loop), the cast is decoration, and there is no persona door on the first screen.
- Measured wait until *your* line appears: student 0s · teacher 2.6s · parent 5.2s ·
  professional 7.8s · organization 10.4s.
- The CTAs are learner-worded ("Start learning"); the close is universal
  ("Get started" + "Talk to our team" + "Free to start. Private by design.").

## 2. The developer's read — what Apple does with one page, many audiences

Measured live at 1440 (2026-10-19), full probes in `apple-probe.json`:

| Reference | Anatomy |
| --- | --- |
| apple.com/in/education (local nav) | Audience row **K–12 · Higher Education · College Students · Success Stories** — 12px/400 quiet links, white on the dark local bar, with a 21px/600 brand. Visible *before* the hero. |
| apple.com/in/education-initiative (hero) | h1 names everyone in one sentence: *"Education moves learners, leaders, innovators, communities and everyone forward."* No cycling. |
| Apple Watch / Beats / AirPods (pass 4) | The fork is a card row (which-model selector) — never a carousel that makes an audience wait. |

**Law (Apple, twice measured):** a universal page never hides an audience behind a
carousel. The audience row is quiet, visible, and always there; the visitor opts in.

## 3. The fix — the hero audience rail (landing-only)

- **Where:** inside the cast hero's copy block, directly under the CTA pair.
- **What:** five quiet links — Students · Teachers · Parents · Professionals ·
  Organizations — order locked to the cycling line (`rail[i]` ↔ `HERO_CATEGORY_WORDS[i]`),
  so a preview always matches the label you touched.
- **Behavior:** hover or focus previews that line and holds it; leaving resumes the
  cycle from there; a click opens the persona page; the active label follows the
  cycle; auto-advance pauses entirely under `prefers-reduced-motion`, where the rail
  still lets the reader choose.
- **Copy:** zero new words. Labels are the footer's existing audience names.
- **Reversibility:** omit `audienceLinks` and every hero (including the landing's)
  renders exactly as before; persona pages never pass it and stay byte-identical.

## 4. Measured result

| | before | after |
| --- | --- | --- |
| Persona doors on the first screen | 0 | **5** |
| Wait for "for teachers / parents / professionals / organizations" | 2.6 / 5.2 / 7.8 / 10.4s | **one hover, focus, or tap — 0s** |
| Keyboard path to a persona from the hero | none | Tab → previews line → Enter → page |
| Reduced-motion users | line cycles regardless | **static line + working rail** |

Fits every width, no overflow; rail bottom clears the family by 85–231px
(375×667: 424 vs 509 · 390: 485 vs 680 · 834: 484 vs 711 · 1024: 510 vs 738 ·
1440: 499 vs 658 · 1920: 546 vs 777).

Behaviors verified live: hover "Teachers" → "for teachers." · leave → resumes
("for parents." after 3s) · click "Organizations" → `/organization` · keyboard focus
"Parents" → "for parents." · reduced motion: line stays "for students." after 6s, rail
still switches. Persona `/student`: rail count 0, hero unchanged.

Gate: `scope:audit:write` (68 / 26 / **1,646**) → eslint clean → both typechecks clean
→ vite build clean → **532/532 tests**.

## 5. Evidence

`landing-v9-universal-entry-2026-10-19/`: `apple-probe.json`,
`apple-education-in-top.jpg`, `apple-education-initiative-top.jpg`,
`hero-375.jpg`…`hero-1920.jpg`, `hero-hover-teachers-1440.jpg`,
`persona-student-hero.jpg`, `hero-rail-check.json`.

## 6. Open founder calls

1. **Hero primary pill** stays "Start learning" (learner-worded). The close already
   carries "Get started" + "Talk to our team"; one label swap in `LandingHeroSection`
   if you want the hero universal too.
2. **Organization proof** on the landing is security + pricing + contact (no org voice
   in the story chapter). A fifth story slide would be new copy — held for your call.
3. **Rail placement**: under the CTA pair (built). Apple's local-nav position — a row
   directly beneath the fixed nav — is a small move if you prefer it.
