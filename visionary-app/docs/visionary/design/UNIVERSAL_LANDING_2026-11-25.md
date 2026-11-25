# Universal landing — inclusive questions, pure path doors

Date: 2026-11-25
Base: `c96fcc71` (`origin/dev`)
Branch: `deepseek/universal-landing-final`
Status: implemented, verified and held in the dedicated worktree for founder design acceptance. Not merged into `dev`. `main` untouched.

## Scope

The universal landing page (`/`) only. The five category pages (`/student`, `/teacher`, `/parent`, `/professional`, `/organization`) were read-only sources and are unchanged.

This pass makes **Every path starts with a question** a large Apple-style story carousel using each category's own problem image with its background removed and a label written for the whole category rather than one narrow situation. **Find your path** stays a separate, small portrait directory with no explanatory subcopy, now introduced by the solution hook **One intelligence. Five ways in.** The two chapters no longer share a visual layout.

## Why this structure

The earlier question chapter was a five-up portrait row, almost identical to the five-up path directory below it. It repeated the same faces and the same composition. Apple solves these two jobs with different components:

- **Education** gives the audience story a large image-card chapter.
- **iPhone** gives the product family a large hero carousel with one dominant card, the next card peeking and controls.
- **iPhone** gives the directory a separate line-up row of image, name, description and action.

The universal page follows that separation:

1. **Every path starts with a question.** A white chapter with a large horizontal story carousel. Each card is a light-grey 28px-radius surface with a category-wide label (“For every student, at every stage”) and one real, category-wide question at the top-left, and the background-removed problem portrait large at the bottom-right. The card is roughly 2:1, not a long strip. One large card is visible at desktop, with the next card peeking at the viewport edge; one card plus a peek on tablet and phone. The row carries trailing space so the last card also aligns with the chapter headline. A centered progress pill and circular previous/next controls scroll the set. The cards are read-only — no arrows, no links, no solution hint.
2. **Find your path.** A white chapter that opens with the shared solution hook “One intelligence. Five ways in.” then five small portrait doors. Each card is only the approved portrait, the role name and the arrow. No per-card question, hint or subheading.

The questions make the visitor feel seen. The solution hook gives the next section a reason to exist. The paths are the doors; the detailed solution lives on the category page.

### Copy for every kind of user

Each category contains many sub-audiences — school and college students, subject and grade teachers, parents of different ages, professionals in different fields, organizations of different sizes. The card therefore names the whole category before asking one shared question:

| Role card | Inclusive label | Shared question |
| --- | --- | --- |
| Student | For every student, at every stage | Why doesn’t this make sense yet? |
| Teacher | For every teacher, in every classroom | Did it land with everyone? |
| Parent | For every parent, at every age | What did they really understand? |
| Professional | For every professional, in every field | How do I use this in my work? |
| Organization | For every organization, across every team | Where are the gaps across our teams? |

The label is the inclusion; the question is the recognition. No card lists sub-categories or explains a solution.

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

The five question cutouts were derived locally by removing the studio background from the existing problem images. No new subject, stock photo or generated person was introduced. The cutouts are displayed on a light-grey card so the professional and organization images no longer show their grey photographic background as a rectangle.

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

Apple's audience pages use one broad hook before segmenting — “From grade school to grad school” on Education, “Explore the line-up” on iPhone. Visionary uses the same move: “For every …” labels inside the question cards, then “One intelligence. Five ways in.” before the path doors. The page stays a front door; the category page keeps the depth.

## Page anatomy

| Section | Visitor question | Composition | Door |
| --- | --- | --- | --- |
| 01 Hero | What is this, and is it for me? | Centred statement, one support line, one action, five quiet audience links, the five-person studio cast. First screen only. | Find your path → `#audiences`; five audience links |
| 05 One Intelligence | What is the product? | Dark product chapter; guide on the band floor; one promise; availability note. | How it works |
| 06 Questions | Does it understand my situation? | White chapter; large light-grey story carousel. “For every …” label + real category-wide question top-left, background-removed problem portrait bottom-right. 1,064×547 card at 1440, one card + meaningful next peek; one + peek on tablet/phone; centered progress pill and previous/next controls. Read-only. | None in the cards |
| 13 Find your path | Where do I begin? | White chapter; solution hook “One intelligence. Five ways in.” then a 1264px five-up of 4:5 portraits, role names and arrows. No per-card subcopy. | Five category pages |
| 11 Trust | Can I trust it? | Three values on the measured grey ground. | Sharing, safety, accessibility |
| 12 Close | What do I do now? | Quiet grey panel, one statement, primary account action and a secondary how-it-works link. | Register, how it works |

## Five audience questions

| Audience | Inclusive label | Background-removed problem image | Question | Destination |
| --- | --- | --- | --- | --- |
| Student | For every student, at every stage | `problem-cutouts/student-question.webp` | Why doesn't this make sense yet? | `/student` |
| Teacher | For every teacher, in every classroom | `problem-cutouts/teacher-question.webp` | Did it land with everyone? | `/teacher` |
| Parent | For every parent, at every age | `problem-cutouts/parent-question.webp` | What did they really understand? | `/parent` |
| Professional | For every professional, in every field | `problem-cutouts/professional-question.webp` | How do I use this in my work? | `/professional` |
| Organization | For every organization, across every team | `problem-cutouts/organization-question.webp` | Where are the gaps across our teams? | `/organization` |

The path cards carry only the role name and arrow. No solution hint is placed on a door; the section-level hook carries the solution idea.

## Before → after

| Measure | Before (accepted dev) | After (this delivery) |
| --- | --- | --- |
| Detailed solution chapter | 148 words, five scenarios, five next steps and a cube exercise | Removed |
| Image-led question chapter | None | 5 transparent problem-image story cards with 5 questions |
| Path-card subcopy | 5 role outcomes | 0; role name + arrow only |
| Question progress | None | Centered progress pill + previous/next controls |
| Main sections | 6 | 6 (questions replace the solution chapter; paths simplify) |
| Unique images | 13 | 16 (five problem cutouts added; two cube images removed) |
| Question chapter height (1440) | 913px (solution chapter) | 1,131px |
| Path chapter height (1440) | 825px | 825px |
| Desktop page height (1440) | 5,580px | 5,799px |
| Mobile page height (390) | 5,532px | 4,935px |
| Question card (1440) | None | 1,064×547 (1.95:1) |
| Question card (390) | None | 312×399 |
| First screen | Hero only | Hero only |

The desktop page is 219px taller because the question chapter is taller than the solution chapter it replaces. The mobile page is 597px shorter because the detailed solution copy and cube are gone and the path directory no longer repeats explanatory lines.

Card scale is consistent across desktop: 1,064×547 at 1440, 1,292×640 at 1920, 795×389 at 1024. The next card is a real preview, and trailing space lets the last card align with the chapter headline instead of drifting right.

## Verification

Production build, `dist` served on `127.0.0.1:4310`:

- `eslint . --quiet`: clean.
- `tsc -p jsconfig.json` and `tsc -p tsconfig.domain.json`: clean.
- `vite build`: clean, 2,166 modules.
- `node --test --test-concurrency=2 tests/*.test.mjs`: **872/872 pass**.
- `landing-v10-quality.mjs`: **PASS** on Chromium, Firefox and WebKit; 13 viewports each, 8 interaction groups each. Asserts hero fold ownership, five hero doors, 44px targets, five question cards with images, inclusive “For every …” labels and 40px card headlines, five progress marks with one active, question rail controls, last-card alignment, five pure path doors, the absence of path subcopy, the solution hook and availability note, menu/footer, 200% text reflow and the five destination journeys.
- `landing-five-audiences.mjs`: **PASS**; 20 role/viewport journeys, keyboard order, reduced motion, pause and all five destinations. Each audience is checked on its question card (image, role, question, no door) and its path door (image, role, name-only, no subcopy).
- `landing-apple-audit.mjs`: 9 viewports + 200% at 390/1280; **0 horizontal overflow, 0 clipped visible text**. The only console entry is the audit's intentional 401 auth fixture.
- `landing-scroll-audit.mjs`: real-user screen captures.
- Lighthouse mobile production `/`: performance **0.86**, accessibility **1.00**, best practices **0.96**, SEO **1.00**; accessibility and SEO gates pass.
- `qa-motion.mjs`, `qa-taps.mjs`, `qa-continuity.mjs`: pass.

Direct "Find your path" entry at 1280×720 lands with the path heading and all five role doors inside the viewport (the gate asserts every role-name bottom is within the 720px fold).

## First-time audience walkthrough

Five audience walks, each at 1440×900 and 390×844 (ten fresh sessions), started at the hero and followed the visitor's own story through the question card and the path door.

Each walk began with the card label. A school student, a returning adult learner and a self-taught learner all see **For every student, at every stage** before the shared question; the same inclusion is written for every role. The label names the whole category, the question names the shared problem.

| Visitor | What connects | What is still intentionally withheld |
| --- | --- | --- |
| Student | “From a question to a project.” **For every student, at every stage** and the book/thinking portrait make “Why doesn't this make sense yet?” speak to the student's own experience. | The four learning moves and the full lesson experience stay on `/student`. |
| Teacher | “From a question to a lesson.” **For every teacher, in every classroom** and the teacher's face make “Did it land with everyone?” match the classroom problem. | Planning, checking and adaptation detail stay on `/teacher`. |
| Parent | “From a question to a conversation.” **For every parent, at every age** and the mother-and-child image make “What did they really understand?” visible. | Reports, shared progress and home support detail stay on `/parent`. |
| Professional | “From a question to a new skill.” **For every professional, in every field** and the work/phone portrait connect “How do I use this in my work?” to the job. | Projects, portfolio and career continuity stay on `/professional`. |
| Organization | “From a question to a team plan.” **For every organization, across every team** and the leader portrait name the organizational problem. | Cohorts, analytics and governance detail stay on `/organization`. |

The walkthrough exposed four connection defects, all corrected in this delivery:

1. **The question cards showed a photographic background block** on the professional and organization images. The background is now removed; the people sit on the card surface.
2. **The card was a long, shallow strip and the copy named one narrow situation.** The card is now roughly 2:1 with a 40px Apple-scale headline, a larger right-anchored portrait, and an inclusive label that speaks to every sub-audience in the category.
3. **A first-time visitor could not tell that the question carousel held five audiences.** The progress is now a centered pill beside the circular controls, and the next card is a readable preview rather than a clipped fragment.
4. **The path chapter had no solution bridge.** It now opens with **One intelligence. Five ways in.** before the five pure doors.

The remaining restraint is deliberate: the question cards do not open a page, and the path cards do not explain the solution. The question chapter creates recognition; the path chapter is the click-through. This is the Apple front-door contract: interest first, depth on the dedicated page.

## Evidence

- `shots/apple-study-redesign/before-final/` — pre-change full pages, 1440 and 390.
- `shots/apple-study-redesign/inclusive-prod-final/` — production full pages and section crops, 1440 and 390.
- `shots/apple-study-redesign/compare/before-after-desktop.png` and `before-after-mobile.png`.
- `shots/apple-study-redesign/compare/apple-reference-comparison-inclusive.png`.
- `shots/apple-study-redesign/inclusive-prod-gate-{chromium,firefox,webkit}/` — per-browser gates and receipts.
- `shots/apple-study-redesign/inclusive-prod-audiences/` — five-audience journeys and receipt.
- `shots/apple-study-redesign/inclusive-prod-audit/` — nine-viewport and 200% audit.
- `shots/apple-study-redesign/inclusive-prod-lighthouse-c/` — valid Lighthouse receipt.
- `shots/cutouts/` — cutout inspection previews on white.

## Acceptance

The five category pages still carry the detailed product experiences. This page now introduces, recognises and routes. It is held in `deepseek/universal-landing-final` for founder design acceptance; merging into `dev` waits for that acceptance. No `main` promotion and no production deployment are claimed.
