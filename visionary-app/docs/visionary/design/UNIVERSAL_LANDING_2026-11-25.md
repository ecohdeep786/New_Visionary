# Universal landing — questions with faces, paths without subcopy

Date: 2026-11-25
Base: `c96fcc71` (`origin/dev`)
Branch: `deepseek/universal-landing-final`
Status: implemented, verified and held in the dedicated worktree for founder design acceptance. Not merged into `dev`. `main` untouched.

## Scope

The universal landing page (`/`) only. The five category pages (`/student`, `/teacher`, `/parent`, `/professional`, `/organization`) were read-only sources and are unchanged.

This pass gives the five audience questions their own image-led chapter, then strips **Find your path** back to a pure directory. The questions carry the recognition; the paths carry only the person, the role name and the door. The solution stays on the category page.

## Why this structure

The earlier candidate put the questions and the solution hints inside the path cards. That made a door carry an explanation. A visitor could read the card as the complete solution before opening the category page. It also repeated the role name, question and hint in one small card, which is heavier than Apple's audience chapters.

Apple solves the same problem with two different chapters:

- **Education** gives each audience an image, an audience label, one line and a door. The audience chapter introduces; it does not teach.
- **iPhone** gives each product an image, a name, one description and an action. The line-up is a directory.

The final page follows that separation:

1. **Every path starts with a question.** Five portraits, five real questions. Image-led, read-only, no doors.
2. **Find your path.** Five portraits, role names and arrows. No question, no hint, no explanatory subcopy.

Same person, two jobs. The questions chapter lets the visitor recognize themselves; the path chapter lets them choose. The category page explains what happens next.

## What changed

- **Restored the image-led question chapter.** A 1264px row of five square audience portraits, each with a small role label and the audience's real question. No links, no buttons in the cards, no solution copy.
- **Simplified Find your path to pure doors.** The cards now contain only the approved portrait, the role name and the arrow. Every question and solution hint was removed from the card. The section no longer has a lead line.
- **Removed the older detailed "Know what to do next" chapter**: five scenarios, five prescribed next steps and the doubling-a-cube exercise. The two cube images were deleted because their only consumer was removed.
- **Kept unchanged** the founder-approved Hero, One Intelligence, trust values and final CTA. The hero audience rail, cast, rotation, reduced-motion behaviour and pause control are untouched.
- **Kept honest** the availability truth. The One Intelligence note remains; the short "Guided experiences are in development" note under the path doors is also the accessible description of the audience navigation.

## Image analysis

The whole asset library was reviewed before choosing.

| Asset family | Decision |
| --- | --- |
| `audience-portraits/*` | **Selected for both chapters.** The only family that gives all five audiences the same crop, studio ground, quality and tone. Faces stay readable at the actual 225–240px card widths, and the files are already approved for the path doors. |
| `hero-cutouts/*` | Reserved for the hero. Full-body cutouts would repeat the hero's opening composition and make the question cards less intimate. |
| Category hero portraits | Used on the category pages. The tight portraits are the correct crop for a five-up front-door row; the full-body versions put the face too far away at card scale. |
| Problem images | Rejected. Four are visibly stressed, the parent page reuses student faces, and five problem photographs would make the front door heavier and less welcoming. |
| `hero-research` | Rejected: three young learners only, so the page would skew toward students. |
| `hero-stage` | Rejected: a single learner. |
| Visionary guide | The product guide, not an audience. It stays in One Intelligence. |

The question chapter uses **square** portraits, closer to iPhone's first-screen product icons and the Education audience cards. The path chapter uses the **4:5** portraits and removes every line except the role and door. The repetition is deliberate and inexpensive: the five portrait files are cached and reused; no new image asset was added.

## Apple study

Each reference was opened live at desktop and mobile and read from hero to footer. The two chapters are matched to the two Apple patterns named in the brief.

| Reference | What was taken | What stayed on the category pages |
| --- | --- | --- |
| [Apple Education](https://www.apple.com/in/education/) | The audience chapter "From grade school to grad school": a statement, then image cards with an audience label, one clear line and a circular arrow. The audience chapter introduces; it does not teach. | K–12 media chapters, feature depth and long-form proof. |
| [iPhone](https://www.apple.com/in/iphone/) | The first-screen family row and "Explore the line-up": image, name, one description, one action per model. The overview shows the family; the product pages explain the products. | Camera, chip, battery and every model detail. |
| [Apple Education Initiative](https://www.apple.com/in/education-initiative/) | The editorial breathing and calm chapter rhythm between the dark product chapter and the close. | Partner stories, news and programme detail. |
| [Apple Education K–12](https://www.apple.com/in/education/k12/) | A hero that owns the first screen and centred chapter statements; long product chapters belong on the deep page. | The four "Designed to…" chapters and every teaching workflow. |
| [Apple Vision Pro](https://www.apple.com/apple-vision-pro/) | One product scene at a time; a tiny category eyebrow; a two-line statement; media ends the band rather than decorating it. | The entertainment, technology and visionOS depth. |

The comparison image pairs Apple's audience chapter with Visionary's question chapter, and Apple's iPhone line-up with Visionary's pure path directory. The grammar is shared; the assets, type, colour and story are Visionary's.

## Page anatomy

| Section | Visitor question | Composition | Door |
| --- | --- | --- | --- |
| 01 Hero | What is this, and is it for me? | Centred statement, one support line, one primary action, five quiet audience links, the five-person studio cast. First screen only. | Find your path → `#audiences`; five audience links |
| 05 One Intelligence | What is the product? | Dark product chapter; guide on the band floor; one promise; availability note. | How it works |
| 06 Questions | Does it understand my situation? | Grey chapter; 1264px five-up of square portraits, role labels and five real questions. Read-only; no doors in the cards. | None: the next chapter is the choice |
| 13 Find your path | Where do I begin? | White chapter; 1264px five-up of 4:5 portraits, role names and arrows. No question, no hint, no lead line. | Five category pages |
| 11 Trust | Can I trust it? | Three values on the measured grey ground: private by design, safe to learn, open to everyone. | Sharing, safety, accessibility |
| 12 Close | What do I do now? | Quiet grey panel, one statement, primary account action and a secondary how-it-works link. | Register, how it works |

## Five audience questions

| Audience | Question on the image card | Destination |
| --- | --- | --- |
| Student | Why doesn't this make sense yet? | `/student` |
| Teacher | Who needs another explanation? | `/teacher` |
| Parent | What did they really understand? | `/parent` |
| Professional | How do I use this in my work? | `/professional` |
| Organization | Where are the gaps across our teams? | `/organization` |

The path cards carry only the role name and the arrow. No solution hint is placed on a door. The category pages carry the detailed experience.

## Before → after

| Measure | Before (accepted dev) | After (this delivery) |
| --- | --- | --- |
| Detailed solution chapter | 148 words, five scenarios, five next steps and a cube exercise | Removed |
| Image-led question chapter | None | 5 portraits + 5 questions |
| Path-card subcopy | 5 role outcomes | 0; role name + arrow only |
| Main sections | 6 | 6 (questions replace the solution chapter; paths simplify) |
| Unique images | 13 | 11 |
| DOM image elements | 13 | 16 (the five portraits are reused and cached) |
| Question chapter height (1440) | 913px (solution chapter) | 873px |
| Path chapter height (1440) | 825px | 781px |
| Desktop page height (1440) | 5,580px | 5,496px |
| Mobile page height (390) | 5,532px | 4,871px |
| First screen | Hero only | Hero only |

The desktop page is 84px shorter; the mobile page is 661px shorter because the detailed solution copy and cube are gone. The page now has a clear image question chapter and a clean directory instead of a text explanation followed by another explanation.

## Verification

Production build, `dist` served on `127.0.0.1:4310`:

- `eslint . --quiet`: clean.
- `tsc -p jsconfig.json` and `tsc -p tsconfig.domain.json`: clean.
- `vite build`: clean, 2,166 modules.
- `node --test --test-concurrency=2 tests/*.test.mjs`: **872/872 pass**.
- `landing-v10-quality.mjs`: **PASS** on Chromium, Firefox and WebKit; 13 viewports each, 8 interaction groups each. Asserts hero fold ownership, five hero doors, 44px targets, the five question portraits and questions, the five pure path doors, the absence of path subcopy, the availability note, rail controls, menu/footer, 200% text reflow and the five destination journeys.
- `landing-five-audiences.mjs`: **PASS**; 20 role/viewport journeys, keyboard order, reduced motion, pause and all five destinations. Each audience is checked on its question card (image, role, question, no door) and its path door (image, role, name-only, no subcopy).
- `landing-apple-audit.mjs`: 9 viewports + 200% at 390/1280; **0 horizontal overflow, 0 clipped visible text**. The only console entry is the audit's intentional 401 auth fixture.
- `landing-scroll-audit.mjs`: real-user screen captures.
- Lighthouse mobile production `/`: performance **0.85**, accessibility **1.00**, best practices **0.96**, SEO **1.00**; accessibility and SEO gates pass.
- `qa-motion.mjs`, `qa-taps.mjs`, `qa-continuity.mjs`: pass.

Direct "Find your path" entry at 1280×720 lands with the path heading and all five role doors inside the viewport (the gate asserts every role-name bottom is within the 720px fold).

## Evidence

- `shots/apple-study-redesign/before-final/` — pre-change full pages, 1440 and 390.
- `shots/apple-study-redesign/two-final/` — production full pages and section crops, 1440 and 390.
- `shots/apple-study-redesign/compare/before-after-desktop.png` and `before-after-mobile.png`.
- `shots/apple-study-redesign/compare/apple-reference-comparison-two-chapters.png`.
- `shots/apple-study-redesign/two-gate-{chromium,firefox,webkit}/` — per-browser gates and receipts.
- `shots/apple-study-redesign/two-audiences/` — five-audience journeys and receipt.
- `shots/apple-study-redesign/two-audit/` — nine-viewport and 200% audit.
- `shots/apple-study-redesign/two-lighthouse/` — Lighthouse receipt.

## Acceptance

The five category pages still carry the detailed product experiences. This page now introduces, recognises and routes. It is held in `deepseek/universal-landing-final` for founder design acceptance; merging into `dev` waits for that acceptance. No `main` promotion and no production deployment are claimed.
