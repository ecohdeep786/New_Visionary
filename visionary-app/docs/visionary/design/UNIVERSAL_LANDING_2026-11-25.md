# Universal landing — image questions, pure path doors

Date: 2026-11-25
Base: `c96fcc71` (`origin/dev`)
Branch: `deepseek/universal-landing-final`
Status: implemented, verified and held in the dedicated worktree for founder design acceptance. Not merged into `dev`. `main` untouched.

## Scope

The universal landing page (`/`) only. The five category pages (`/student`, `/teacher`, `/parent`, `/professional`, `/organization`) were read-only sources and are unchanged.

This pass makes **Every path starts with a question** a large Apple-style story carousel using each category's own problem image, then keeps **Find your path** as a separate, small portrait directory with no explanatory subcopy. The two sections no longer look like copies of one another.

## Why this structure

The previous question chapter was a five-up portrait row, almost identical to the five-up path directory below it. It repeated the same faces and the same composition. Apple never solves two different jobs with the same component:

- **Education** gives the audience story a large image-card chapter.
- **iPhone** gives the product family a large hero carousel with one dominant card and the next card peeking, plus controls.
- **iPhone** gives the directory a separate line-up row of image, name, description and action.

The universal page now follows that separation:

1. **Every path starts with a question.** A grey chapter with a large horizontal story carousel. Each card is a white 28px-radius surface: a category problem image on the left, the audience name and real question on the right. Two cards are visible at desktop; one card plus a peek on tablet and phone; circular previous/next controls scroll the set. The cards are read-only — no arrows, no links, no solution hint.
2. **Find your path.** A white chapter with five small portrait doors. Each card is only the approved portrait, the role name and the arrow. No question, no hint, no lead line.

The questions make the visitor feel seen. The paths are the doors. The solution lives on the category page.

## Image selection

The whole asset library was reviewed before choosing.

| Asset family | Decision |
| --- | --- |
| Category problem images | **Selected for the question carousel.** Each card uses the problem image already used on that category's problem chapter: `problem-understanding.webp` (Student), `teacher-problem-1.webp` (Teacher), `parent-hero-main-1600w.webp` (Parent), `professional-problem-1-1600w.webp` (Professional), `organization-problem-2-1600w.webp` (Organization). They are expressive, category-specific and visually distinct from the portrait doors. |
| `audience-portraits/*` | **Selected for the path doors.** The only family that gives all five roles the same tight crop, studio ground, quality and face-readable scale at 225–240px. Already approved for the doors. |
| `hero-cutouts/*` | Reserved for the hero. Full-body cutouts would repeat the opening composition and shrink the faces at card scale. |
| Category hero portraits | Used on the category pages. The tight portraits are the correct crop for the five-up directory. |
| `hero-research` | Rejected: three young learners only, so the page skews student. |
| `hero-stage` | Rejected: a single learner. |
| Visionary guide | The product guide, not an audience. It stays in One Intelligence. |

The parent category's problem chapter ends on the parent hero image (a mother and child), so that is the parent question image. No new image asset was added.

## Apple study

Each reference was opened live at desktop and mobile and read from hero to footer.

| Reference | What was taken | What stayed on the category pages |
| --- | --- | --- |
| [iPhone](https://www.apple.com/in/iphone/) | The first-screen hero carousel: a large card, the next card peeking, circular controls, and a separate line-up row for the directory. The overview shows the family; the product pages explain the products. | Camera, chip, battery and every model detail. |
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
| 06 Questions | Does it understand my situation? | Grey chapter; large white story carousel. Problem image left, role + real question right. Two cards visible at desktop; one + peek on tablet/phone; previous/next controls. Read-only. | None in the cards |
| 13 Find your path | Where do I begin? | White chapter; 1264px five-up of 4:5 portraits, role names and arrows. No subcopy. | Five category pages |
| 11 Trust | Can I trust it? | Three values on the measured grey ground. | Sharing, safety, accessibility |
| 12 Close | What do I do now? | Quiet grey panel, one statement, primary account action and a secondary how-it-works link. | Register, how it works |

## Five audience questions

| Audience | Problem image | Question | Destination |
| --- | --- | --- | --- |
| Student | `problem-understanding.webp` | Why doesn't this make sense yet? | `/student` |
| Teacher | `teacher-problem-1.webp` | Who needs another explanation? | `/teacher` |
| Parent | `parent-hero-main-1600w.webp` | What did they really understand? | `/parent` |
| Professional | `professional-problem-1-1600w.webp` | How do I use this in my work? | `/professional` |
| Organization | `organization-problem-2-1600w.webp` | Where are the gaps across our teams? | `/organization` |

The path cards carry only the role name and arrow. No solution hint is placed on a door.

## Before → after

| Measure | Before (accepted dev) | After (this delivery) |
| --- | --- | --- |
| Detailed solution chapter | 148 words, five scenarios, five next steps and a cube exercise | Removed |
| Image-led question chapter | None | 5 problem-image story cards with 5 questions |
| Path-card subcopy | 5 role outcomes | 0; role name + arrow only |
| Main sections | 6 | 6 (questions replace the solution chapter; paths simplify) |
| Unique images | 13 | 16 (five problem images added; two cube images removed) |
| Question chapter height (1440) | 913px (solution chapter) | 936px |
| Path chapter height (1440) | 825px | 781px |
| Desktop page height (1440) | 5,580px | 5,560px |
| Mobile page height (390) | 5,532px | 4,851px |
| First screen | Hero only | Hero only |

The desktop page is 20px shorter. The mobile page is 681px shorter because the detailed solution copy and cube are gone and the path directory no longer repeats explanatory lines.

## Verification

Production build, `dist` served on `127.0.0.1:4310`:

- `eslint . --quiet`: clean.
- `tsc -p jsconfig.json` and `tsc -p tsconfig.domain.json`: clean.
- `vite build`: clean, 2,166 modules.
- `node --test --test-concurrency=2 tests/*.test.mjs`: **872/872 pass**.
- `landing-v10-quality.mjs`: **PASS** on Chromium, Firefox and WebKit; 13 viewports each, 8 interaction groups each. Asserts hero fold ownership, five hero doors, 44px targets, five question cards with images and questions, carousel controls, five pure path doors, the absence of path subcopy, availability note, menu/footer, 200% text reflow and the five destination journeys.
- `landing-five-audiences.mjs`: **PASS**; 20 role/viewport journeys, keyboard order, reduced motion, pause and all five destinations. Each audience is checked on its question card (image, role, question, no door) and its path door (image, role, name-only, no subcopy).
- `landing-apple-audit.mjs`: 9 viewports + 200% at 390/1280; **0 horizontal overflow, 0 clipped visible text**. The only console entry is the audit's intentional 401 auth fixture.
- `landing-scroll-audit.mjs`: real-user screen captures.
- Lighthouse mobile production `/`: performance **0.85**, accessibility **1.00**, best practices **0.96**, SEO **1.00**; accessibility and SEO gates pass.
- `qa-motion.mjs`, `qa-taps.mjs`, `qa-continuity.mjs`: pass.

Direct "Find your path" entry at 1280×720 lands with the path heading and all five role doors inside the viewport (the gate asserts every role-name bottom is within the 720px fold).

## Evidence

- `shots/apple-study-redesign/before-final/` — pre-change full pages, 1440 and 390.
- `shots/apple-study-redesign/carousel-final/` — production full pages and section crops, 1440 and 390.
- `shots/apple-study-redesign/compare/before-after-desktop.png` and `before-after-mobile.png`.
- `shots/apple-study-redesign/compare/apple-reference-comparison-carousel.png`.
- `shots/apple-study-redesign/carousel-gate-{chromium,firefox,webkit}/` — per-browser gates and receipts.
- `shots/apple-study-redesign/carousel-audiences/` — five-audience journeys and receipt.
- `shots/apple-study-redesign/carousel-audit/` — nine-viewport and 200% audit.
- `shots/apple-study-redesign/carousel-lighthouse/` — Lighthouse receipt.

## Acceptance

The five category pages still carry the detailed product experiences. This page now introduces, recognises and routes. It is held in `deepseek/universal-landing-final` for founder design acceptance; merging into `dev` waits for that acceptance. No `main` promotion and no production deployment are claimed.
