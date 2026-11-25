# Universal landing — the five-path front door

Date: 2026-11-25
Base: `c96fcc71` (`origin/dev`)
Branch: `deepseek/universal-landing-final`
Status: implemented, verified and held in the dedicated worktree for founder design acceptance. Not merged into `dev`. `main` untouched.

## Scope

The universal landing page (`/`) only. The five category pages (`/student`, `/teacher`, `/parent`, `/professional`, `/organization`) were read-only sources and are unchanged. This pass replaces the detailed "Know what to do next" chapter — and its student-only cube exercise — with a recognition chapter built from five equal audience questions, then moves each audience's solution hint into its own path door.

## The problem this pass fixes

The previous homepage explained five solutions in a table, then added a detailed mathematics exercise for one audience. That made the universal page behave like a category page: it told a visitor what each experience would do, in detail, before they had chosen a path. It also made the page feel student-led even though the five doors were equal.

The front door now does four jobs only:

1. Introduce the promise and the five audiences.
2. Explain the one intelligence.
3. Let each visitor recognise their own real question.
4. Show one concise possibility per path and open the dedicated page.

The category pages retain the detailed problems, workflows, capabilities and product experiences.

## What changed

- **Removed** the "Know what to do next" chapter: five scenarios, five prescribed next steps and the doubling-a-cube exercise. This removed 148 words of solution detail (865 characters) and the two cube images that existed only for that demonstration.
- **Added** "Every path starts with a question." A 980px editorial split with one statement and five equal audience questions. It is recognition only: no solutions, no features, no demonstration. 46 words total.
- **Find your path** now carries the shared lead "One intelligence, shaped to what you do." and one solution hint per card:
  - Students — Understand. Ask. Practise. Build.
  - Teachers — Plan. Explain. Know who's with you.
  - Parents — See what they understood. Know how to help.
  - Professionals — Turn your work into skills you can reuse.
  - Organizations — See capability across teams. Find gaps early.
- **Kept unchanged** the founder-approved Hero, One Intelligence, trust values and final CTA. The hero audience rail, cast, rotation, reduced-motion behaviour and pause control are untouched.
- **Kept honest** the existing "Guided experiences are in development" truth. The note now sits under the path doors and is the accessible description of the audience navigation; the One Intelligence chapter keeps its fuller availability note.
- **No new imagery.** The page uses the existing hero cast, the existing Visionary guide and the five existing audience portraits. The two cube images were deleted because their only consumer was removed.

## Apple study

Each reference was opened live at desktop and mobile and read from hero to footer. The point was not to copy measurements; it was to separate what an introductory page does from what a product page does.

| Reference | What was taken | What stayed on the category pages |
| --- | --- | --- |
| [Apple Education](https://www.apple.com/in/education/) | A broad promise, a small local audience row, one dark audience chapter with name + one line + one door, and a values row near the close. The audience chapter introduces, it does not teach. | K–12 media chapters, feature depth and long-form proof. |
| [Apple Education Initiative](https://www.apple.com/in/education-initiative/) | The editorial story split: one confident statement on the left, one piece of evidence on the right, huge chapter breathing at 980px. | Partner stories, news and programme detail. |
| [Apple Education K–12](https://www.apple.com/in/education/k12/) | A hero that owns the first screen and centred chapter statements; long product chapters belong on the deep page. | The four "Designed to…" chapters and every teaching workflow. |
| [iPhone](https://www.apple.com/in/iphone/) | The line-up grammar: one name, one concise line, one door. The overview shows the family; the product pages explain the products. | Camera, chip, battery and every model detail. |
| [Apple Vision Pro](https://www.apple.com/apple-vision-pro/) | One product scene at a time, a tiny category eyebrow, a two-line statement, and media that ends the band rather than decorating it. | The 14,000px entertainment chapter, technology and visionOS depth. |

The comparison image in the evidence set pairs Apple's audience chapter with Visionary's path chapter, and Apple's editorial story chapter with Visionary's question chapter. The grammar is shared; the assets, type, colour and story are Visionary's.

## Page anatomy

| Section | Visitor question | Composition | Door |
| --- | --- | --- | --- |
| 01 Hero | What is this, and is it for me? | Centred statement, one support line, one primary action, five quiet audience links, the five-person studio cast. First screen only. | Find your path → `#audiences`; five audience links |
| 05 One Intelligence | What is the product? | Dark product chapter; guide on the band floor; one promise; availability note. | How it works |
| 06 Questions | Does it understand my situation? | 980px split: "Every path starts with a question." + "One intelligence meets you there." against five equal questions. | None: the next chapter is the answer |
| 13 Find your path | What could my experience look like? | 1264px five-up: portrait, role name, one solution hint, arrow. Shared lead above; honest availability note below. | Five category pages |
| 11 Trust | Can I trust it? | Three values on the measured grey ground: private by design, safe to learn, open to everyone. | Sharing, safety, accessibility |
| 12 Close | What do I do now? | Quiet grey panel, one statement, primary account action and a secondary how-it-works link. | Register, how it works |

## Five equal glimpses

| Audience | Question on the homepage | Solution hint on the path door | Destination |
| --- | --- | --- | --- |
| Student | Why doesn't this make sense yet? | Understand. Ask. Practise. Build. | `/student` |
| Teacher | Who needs another explanation? | Plan. Explain. Know who's with you. | `/teacher` |
| Parent | What did they really understand? | See what they understood. Know how to help. | `/parent` |
| Professional | How do I use this in my work? | Turn your work into skills you can reuse. | `/professional` |
| Organization | Where are the gaps across our teams? | See capability across teams. Find gaps early. | `/organization` |

Every question and hint was checked against the source of its category page. None is invented, and none promises a live guided experience; the availability note remains in the One Intelligence chapter and under the path doors.

## Before → after

| Measure | Before | After |
| --- | --- | --- |
| Detailed solution copy (section) | 148 words / 865 characters | 46 words / 286 characters |
| Student-only demonstration | Doubling-a-cube exercise + 2 images | Removed |
| Universal page sections | 6 | 6 (one replaced) |
| Path-card copy | Five complete outcomes | Five one-line experience hints |
| Path doors | 5 | 5 |
| Images on the page | 13 | 11 |
| Desktop page height (1440) | 5,580px | 5,602px |
| Mobile page height (390) | 5,532px | 5,019px |
| First screen | Hero only | Hero only |
| Question copy | None | 5 equal questions |

The desktop page is effectively the same length; the mobile page is 513px shorter. The space removed from the solution table was returned as chapter breathing and larger type, not filled with more controls.

## Verification

Production build, `dist` served on `127.0.0.1:4310`:

- `eslint . --quiet`: clean.
- `tsc -p jsconfig.json` and `tsc -p tsconfig.domain.json`: clean.
- `vite build`: clean, 2,166 modules.
- `node --test --test-concurrency=2 tests/*.test.mjs`: **872/872 pass**.
- `landing-v10-quality.mjs`: **PASS** on Chromium, Firefox and WebKit; 13 viewports each, 8 interaction groups each. Asserts hero fold ownership, five hero doors, 44px targets, path breathing, the question list, the five path hints, the availability note, rail controls, menu/footer, 200% text reflow and the five destination journeys.
- `landing-five-audiences.mjs`: **PASS**; 20 role/viewport screens, keyboard order, reduced motion, pause and all five destinations.
- `landing-apple-audit.mjs`: 9 viewports + 200% at 390/1280; **0 horizontal overflow, 0 clipped visible text**. The only console entry is the audit's intentional 401 auth fixture.
- `landing-scroll-audit.mjs`: 13 real-user screen captures.
- Lighthouse mobile production `/`: performance **0.86**, accessibility **1.00**, best practices **0.96**, SEO **1.00**; accessibility and SEO gates pass.
- `qa-motion.mjs`, `qa-taps.mjs`, `qa-continuity.mjs`: pass.

## Evidence

- `shots/apple-study-redesign/before-final/` — pre-change full pages, 1440 and 390.
- `shots/apple-study-redesign/final/` — production full pages and section crops, 1440 and 390.
- `shots/apple-study-redesign/compare/before-after-desktop.png` and `before-after-mobile.png`.
- `shots/apple-study-redesign/compare/apple-reference-comparison.png`.
- `shots/apple-study-redesign/final-gate-{chromium,firefox,webkit}/` — per-browser gates and receipts.
- `shots/apple-study-redesign/final-audiences/` — five-audience journeys and receipt.
- `shots/apple-study-redesign/final-audit/` — nine-viewport and 200% audit.
- `shots/apple-study-redesign/lighthouse/` — Lighthouse receipt.

## Acceptance

The source and category pages are unchanged. The five category pages still carry the detailed product experiences. This page now introduces, recognises and routes. It is held in `deepseek/universal-landing-final` for founder design acceptance; merging into `dev` waits for that acceptance. No `main` promotion and no production deployment are claimed.
