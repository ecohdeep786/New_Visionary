# Universal landing — image questions, pure path doors

Date: 2026-11-25
Base: `c96fcc71` (`origin/dev`)
Branch: `deepseek/universal-landing-final`
Status: implemented, verified and held in the dedicated worktree for founder design acceptance. Not merged into `dev`. `main` untouched.

## Scope

The universal landing page (`/`) only. The five category pages (`/student`, `/teacher`, `/parent`, `/professional`, `/organization`) were read-only sources and are unchanged.

This pass makes **Every path starts with a question** a large Apple-style story carousel using each category's own problem image with its background removed, then keeps **Find your path** as a separate, small portrait directory with no explanatory subcopy. The two chapters no longer share a visual layout.

## Why this structure

The earlier question chapter was a five-up portrait row, almost identical to the five-up path directory below it. It repeated the same faces and the same composition. Apple solves these two jobs with different components:

- **Education** gives the audience story a large image-card chapter.
- **iPhone** gives the product family a large hero carousel with one dominant card, the next card peeking and controls.
- **iPhone** gives the directory a separate line-up row of image, name, description and action.

The universal page follows that separation:

1. **Every path starts with a question.** A grey chapter with a large horizontal story carousel. Each card is a white 28px-radius surface with the audience name and real question at the top-left, and the background-removed problem portrait large at the bottom-right. Two cards are visible at desktop; one card plus a peek on tablet and phone. A centered progress pill and circular previous/next controls scroll the set. The cards are read-only — no arrows, no links, no solution hint.
2. **Find your path.** A white chapter with five small portrait doors. Each card is only the approved portrait, the role name and the arrow. No question, no hint, no lead line.

The questions make the visitor feel seen. The paths are the doors. The solution lives on the category page.

## Image selection

The whole asset library was reviewed before choosing.

| Asset family | Decision |
| --- | --- |
| Category problem images | **Selected for the question carousel, with backgrounds removed.** The subjects keep the poses and props from each category problem chapter: Student `problem-understanding.webp`, Teacher `teacher-problem-1.webp`, Parent `parent-hero-main-1600w.webp`, Professional `professional-problem-1-1600w.webp`, Organization `organization-problem-1-1600w.webp`. Transparent cutouts are stored in `src/assets/problem-cutouts/`. The original images remain untouched on the category pages. |
| `audience-portraits/*` | **Selected for the path doors.** The only family that gives all five roles the same tight crop, studio ground, quality and face-readable scale at 225–240px. Already approved for the doors. |
| `hero-cutouts/*` | Reserved for the hero. Full-body cutouts would repeat the opening composition and shrink the faces at card scale. |
| Category hero portraits | Used on the category pages. The tight portraits are the correct crop for the five-up directory. |
| `hero-research` | Rejected: three young learners only, so the page skews student. |
| `hero-stage` | Rejected: a single learner. |
| Visionary guide | The product guide, not an audience. It stays in One Intelligence. |

The five question cutouts were derived locally by removing the studio background from the existing problem images. No new subject, stock photo or generated person was introduced. The cutouts are displayed on a white card so the professional and organization images no longer show their grey photographic background as a rectangle.

## Apple study

Each reference was opened live at desktop and mobile and read from hero to footer.

| Reference | What was taken | What stayed on the category pages |
| --- | --- | --- |
| [iPhone](https://www.apple.com/in/iphone/) | The first-screen hero carousel: a large rounded card, the next card peeking, progress dots, circular controls, and a separate line-up row for the directory. The overview shows the family; the product pages explain the products. | Camera, chip, battery and every model detail. |
| [AirPods Pro](https://www.apple.com/airpods-pro/) | The giant product cutout on a quiet full-bleed ground; the “Get the highlights” large-card gallery with its progress pill; the “Take a closer look” grey panel; one scene and one statement at a time. | Noise control, audio, fitness, hearing health and every technology chapter. |
| [Apple Education](https://www.apple.com/in/education/) | The audience chapter grammar: a statement, then image-led audience cards with a clear label and one human line. The audience chapter introduces; it does not teach. | K–12 media chapters, feature depth and long-form proof. |
| [Apple Education Initiative](https://www.apple.com/in/education-initiative/) | The calm chapter breathing between the dark product chapter and the close. | Partner stories, news and programme detail. |
| [Apple Education K–12](https://www.apple.com/in/education/k12/) | A hero that owns the first screen and centred statements; long chapters belong on the deep page. | The four "Designed to…" chapters and every teaching workflow. |
| [Apple Vision Pro](https://www.apple.com/apple-vision-pro/) | One scene at a time; a tiny category eyebrow; a two-line statement; media ends the band rather than decorating it. | The entertainment, technology and visionOS depth. |

The comparison image pairs Apple's Education audience chapter and iPhone line-up with Visionary's two chapters. The grammar is shared; the assets, type, colour and story are Visionary's.

## Page anatomy

| Section | Visitor question | Composition | Door |
| --- | --- | --- | --- |
| 01 Hero | What is this, and is it for me? | Centred statement, one support line, one action, five quiet audience links, the five-person studio cast. First screen only. | Find your path → `#audiences`; five audience links |
| 05 One Intelligence | What is the product? | Dark product chapter; guide on the band floor; one promise; availability note. | How it works |
| 06 Questions | Does it understand my situation? | Grey chapter; large white story carousel. Role + real question top-left, background-removed problem portrait bottom-right. Two cards visible at desktop; one + peek on tablet/phone; centered progress pill and previous/next controls. Read-only. | None in the cards |
| 13 Find your path | Where do I begin? | White chapter; 1264px five-up of 4:5 portraits, role names and arrows. No subcopy. | Five category pages |
| 11 Trust | Can I trust it? | Three values on the measured grey ground. | Sharing, safety, accessibility |
| 12 Close | What do I do now? | Quiet grey panel, one statement, primary account action and a secondary how-it-works link. | Register, how it works |

## Five audience questions

| Audience | Background-removed problem image | Question | Destination |
| --- | --- | --- | --- |
| Student | `problem-cutouts/student-question.webp` | Why doesn't this make sense yet? | `/student` |
| Teacher | `problem-cutouts/teacher-question.webp` | Who needs another explanation? | `/teacher` |
| Parent | `problem-cutouts/parent-question.webp` | What did they really understand? | `/parent` |
| Professional | `problem-cutouts/professional-question.webp` | How do I use this in my work? | `/professional` |
| Organization | `problem-cutouts/organization-question.webp` | Where are the gaps across our teams? | `/organization` |

The path cards carry only the role name and arrow. No solution hint is placed on a door.

## Before → after

| Measure | Before (accepted dev) | After (this delivery) |
| --- | --- | --- |
| Detailed solution chapter | 148 words, five scenarios, five next steps and a cube exercise | Removed |
| Image-led question chapter | None | 5 transparent problem-image story cards with 5 questions |
| Path-card subcopy | 5 role outcomes | 0; role name + arrow only |
| Question progress | None | Centered progress pill + previous/next controls |
| Main sections | 6 | 6 (questions replace the solution chapter; paths simplify) |
| Unique images | 13 | 16 (five problem cutouts added; two cube images removed) |
| Question chapter height (1440) | 913px (solution chapter) | 1,016px |
| Path chapter height (1440) | 825px | 781px |
| Desktop page height (1440) | 5,580px | 5,640px |
| Mobile page height (390) | 5,532px | 4,818px |
| First screen | Hero only | Hero only |

The desktop page is 60px taller because the question card grew into the iPhone-style large card. The mobile page is 714px shorter because the detailed solution copy and cube are gone and the path directory no longer repeats explanatory lines.

## Verification

Production build, `dist` served on `127.0.0.1:4310`:

- `eslint . --quiet`: clean.
- `tsc -p jsconfig.json` and `tsc -p tsconfig.domain.json`: clean.
- `vite build`: clean, 2,166 modules.
- `node --test --test-concurrency=2 tests/*.test.mjs`: **872/872 pass**.
- `landing-v10-quality.mjs`: **PASS** on Chromium, Firefox and WebKit; 13 viewports each, 8 interaction groups each. Asserts hero fold ownership, five hero doors, 44px targets, five question cards with images and questions, five progress marks with one active, question rail controls, five pure path doors, the absence of path subcopy, availability note, menu/footer, 200% text reflow and the five destination journeys.
- `landing-five-audiences.mjs`: **PASS**; 20 role/viewport journeys, keyboard order, reduced motion, pause and all five destinations. Each audience is checked on its question card (image, role, question, no door) and its path door (image, role, name-only, no subcopy).
- `landing-apple-audit.mjs`: 9 viewports + 200% at 390/1280; **0 horizontal overflow, 0 clipped visible text**. The only console entry is the audit's intentional 401 auth fixture.
- `landing-scroll-audit.mjs`: real-user screen captures.
- Lighthouse mobile production `/`: performance **0.85**, accessibility **1.00**, best practices **0.96**, SEO **1.00**; accessibility and SEO gates pass.
- `qa-motion.mjs`, `qa-taps.mjs`, `qa-continuity.mjs`: pass.

Direct "Find your path" entry at 1280×720 lands with the path heading and all five role doors inside the viewport (the gate asserts every role-name bottom is within the 720px fold).

## First-time audience walkthrough

Five audience walks, each at 1440×900 and 390×844 (ten fresh sessions), started at the hero and followed the visitor's own story through the question card and the path door.

| Visitor | What connects | What is still intentionally withheld |
| --- | --- | --- |
| Student | “From a question to a project.” The book/thinking portrait and “Why doesn't this make sense yet?” speak to the student's own experience. | The four learning moves and the full lesson experience stay on `/student`. |
| Teacher | “From a question to a lesson.” The teacher's face and “Who needs another explanation?” match the classroom problem. | Planning, checking and adaptation detail stay on `/teacher`. |
| Parent | “From a question to a conversation.” The mother-and-child image and “What did they really understand?” make the parent's role visible. | Reports, shared progress and home support detail stay on `/parent`. |
| Professional | “From a question to a new skill.” The work/phone portrait and “How do I use this in my work?” connect learning to the job. | Projects, portfolio and career continuity stay on `/professional`. |
| Organization | “From a question to a team plan.” The leader portrait and “Where are the gaps across our teams?” name the organizational problem. | Cohorts, analytics and governance detail stay on `/organization`. |

The walkthrough exposed two connection defects, both corrected in this delivery:

1. **The question cards showed a photographic background block** on the professional and organization images. The background is now removed; the people sit on the card surface.
2. **A first-time visitor could not tell that the question carousel held five audiences.** Five progress marks now sit at the lower left, with the arrow controls at the lower right.

The remaining restraint is deliberate: the question cards do not open a page, and the path cards do not explain the solution. The question chapter creates recognition; the path chapter is the click-through. This is the Apple front-door contract: interest first, depth on the dedicated page.

## Evidence

- `shots/apple-study-redesign/before-final/` — pre-change full pages, 1440 and 390.
- `shots/apple-study-redesign/largecard-final/` — production full pages and section crops, 1440 and 390.
- `shots/apple-study-redesign/compare/before-after-desktop.png` and `before-after-mobile.png`.
- `shots/apple-study-redesign/compare/apple-reference-comparison-largecard.png`.
- `shots/apple-study-redesign/largecard-prod-gate-{chromium,firefox,webkit}/` — per-browser gates and receipts.
- `shots/apple-study-redesign/largecard-prod-audiences/` — five-audience journeys and receipt.
- `shots/apple-study-redesign/largecard-prod-audit/` — nine-viewport and 200% audit.
- `shots/apple-study-redesign/largecard-prod-lighthouse-b/` — valid Lighthouse receipt.
- `shots/apple-study-redesign/walkthrough/` — five first-time audience walkthroughs at desktop and phone.
- `shots/cutouts/` — cutout inspection previews on white.
- `shots/apple-study-redesign/walkthrough/` — five first-time audience walkthroughs at desktop and phone.
- `shots/cutouts/` — cutout inspection previews on white.

## Acceptance

The five category pages still carry the detailed product experiences. This page now introduces, recognises and routes. It is held in `deepseek/universal-landing-final` for founder design acceptance; merging into `dev` waits for that acceptance. No `main` promotion and no production deployment are claimed.
