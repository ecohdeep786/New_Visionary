# Universal landing — the five-path front door

Date: 2026-11-25
Base: `c96fcc71` (`origin/dev`)
Branch: `deepseek/universal-landing-final`
Status: implemented, verified and held in the dedicated worktree for founder design acceptance. Not merged into `dev`. `main` untouched.

## Scope

The universal landing page (`/`) only. The five category pages (`/student`, `/teacher`, `/parent`, `/professional`, `/organization`) were read-only sources and are unchanged. This pass removes the separate text-only "Every path starts with a question" chapter and the earlier detailed "Know what to do next" chapter, and makes the five audience questions part of the image-led path chapter. Each question now belongs to a face, a concise solution hint and its own door.

## The problem this pass fixes

A free-floating list of five audience problems asks a first-time visitor to hold five abstractions with no visual anchor. It also repeats the five audiences immediately above the five path portraits. Apple's audience and line-up chapters never do this: the image, the name and the door are one object.

The path chapter now does the whole job:

1. It names the audience.
2. It gives that audience's real question.
3. It offers one concise indication of the experience.
4. It opens the dedicated category page.

Depth stays on the category pages.

## What changed

- **Removed** the separate "Every path starts with a question" text chapter and its 980px question list.
- **Removed** the older "Know what to do next" chapter: five scenarios, five prescribed next steps and the doubling-a-cube exercise. The two cube images were deleted because their only consumer was removed.
- **Rebuilt Find your path as an image-led audience chapter.** An intermediate candidate used a separate 46-word question chapter; the final build absorbs those questions into the path cards, so there is no free-floating list and no repeated five-role section. The shared lead is "Every path starts with a question. One intelligence meets you there." Each of the five existing audience portraits now carries:
  - the role name and arrow;
  - one real audience question;
  - one concise solution hint.
- **Kept unchanged** the founder-approved Hero, One Intelligence, trust values and final CTA. The hero audience rail, cast, rotation, reduced-motion behaviour and pause control are untouched.
- **Kept honest** the availability truth. The One Intelligence note remains; the short "Guided experiences are in development" note under the path doors is also the accessible description of the audience navigation.
- **No new imagery.** The page uses the five existing audience portraits, the existing hero cast and the existing Visionary guide. The five portraits are the only asset family that represents all five audiences equally with the same studio ground, quality and tone. The problem images were rejected: four are visibly stressed, the parent page reuses student faces, and they would make the front door heavier and less welcoming. The category hero images are full-body portraits already used at each category destination; the tight audience portraits are the correct crop for a five-up lineup.

## Apple study

Each reference was opened live at desktop and mobile and read from hero to footer. The goal was to find the Apple pattern that solves the same problem: introducing several audiences/products with equal visual weight without becoming a catalogue.

| Reference | What was taken | What stayed on the category pages |
| --- | --- | --- |
| [Apple Education](https://www.apple.com/in/education/) | The audience chapter "From grade school to grad school": three image cards, each with an audience label, one clear line and a circular arrow. The audience chapter introduces; it does not teach. | K–12 media chapters, feature depth and long-form proof. |
| [iPhone](https://www.apple.com/in/iphone/) | "Explore the line-up": image, name, one description and one action per model. The overview shows the family; the product pages explain the products. This is the closest structural match to the rebuilt path chapter at 1440: Apple's line-up is 982px tall, Visionary's path chapter is 970px. | Camera, chip, battery and every model detail. |
| [Apple Education Initiative](https://www.apple.com/in/education-initiative/) | The editorial split and large chapter breathing that keep the page calm between the dark product chapter and the close. | Partner stories, news and programme detail. |
| [Apple Education K–12](https://www.apple.com/in/education/k12/) | A hero that owns the first screen and centred chapter statements; long product chapters belong on the deep page. | The four "Designed to…" chapters and every teaching workflow. |
| [Apple Vision Pro](https://www.apple.com/apple-vision-pro/) | One product scene at a time; a tiny category eyebrow; a two-line statement; media ends the band rather than decorating it. | The entertainment, technology and visionOS depth. |

The comparison image pairs Apple's audience chapter and iPhone line-up with the rebuilt Visionary path chapter. The grammar is shared; the assets, type, colour and story are Visionary's.

## Page anatomy

| Section | Visitor question | Composition | Door |
| --- | --- | --- | --- |
| 01 Hero | What is this, and is it for me? | Centred statement, one support line, one primary action, five quiet audience links, the five-person studio cast. First screen only. | Find your path → `#audiences`; five audience links |
| 05 One Intelligence | What is the product? | Dark product chapter; guide on the band floor; one promise; availability note. | How it works |
| 13 Find your path | Does it understand me, and what could my experience be? | 1264px five-up with the approved portrait, role name, real question, one solution hint and arrow. Shared lead above; honest availability note below. | Five category pages |
| 11 Trust | Can I trust it? | Three values on the measured grey ground: private by design, safe to learn, open to everyone. | Sharing, safety, accessibility |
| 12 Close | What do I do now? | Quiet grey panel, one statement, primary account action and a secondary how-it-works link. | Register, how it works |

## Five equal glimpses

| Audience | Question on the path card | Solution hint | Destination |
| --- | --- | --- | --- |
| Student | Why doesn't this make sense yet? | Understand. Ask. Practise. Build. | `/student` |
| Teacher | Who needs another explanation? | Plan. Explain. Know who's with you. | `/teacher` |
| Parent | What did they really understand? | See what they understood. Know how to help. | `/parent` |
| Professional | How do I use this in my work? | Turn your work into skills you can reuse. | `/professional` |
| Organization | Where are the gaps across our teams? | See capability across teams. Find gaps early. | `/organization` |

Every question and hint was checked against the source of its category page. None is invented, and none promises a live guided experience.

## Before → after

| Measure | Before (accepted dev) | After (this delivery) |
| --- | --- | --- |
| Detailed solution chapter | 148 words, five scenarios, five next steps and a cube exercise | Removed |
| Path chapter copy | 59 words, five outcomes | 87 words, five questions + five hints + shared lead |
| Main sections | 6 | 5 |
| Path doors with a question and a hint | 0 | 5 |
| Images on the page | 13 | 11 |
| Desktop page height (1440) | 5,580px | 4,812px |
| Mobile page height (390) | 5,532px | 4,229px |
| First screen | Hero only | Hero only |
| Path chapter height (1440) | 825px | 970px (Apple's iPhone line-up: 982px) |

The path chapter is the only chapter that grew: it absorbed the recognition job and the solution hints. The page is 768px shorter on desktop and 1,303px shorter on mobile.

## Verification

Production build, `dist` served on `127.0.0.1:4310`:

- `eslint . --quiet`: clean.
- `tsc -p jsconfig.json` and `tsc -p tsconfig.domain.json`: clean.
- `vite build`: clean, 2,166 modules.
- `node --test --test-concurrency=2 tests/*.test.mjs`: **872/872 pass**.
- `landing-v10-quality.mjs`: **PASS** on Chromium, Firefox and WebKit; 13 viewports each, 8 interaction groups each. Asserts hero fold ownership, five hero doors, 44px targets, path breathing, every path image + real question + solution hint, the availability note, rail controls, menu/footer, 200% text reflow and the five destination journeys.
- `landing-five-audiences.mjs`: **PASS**; 20 role/viewport screens, keyboard order, reduced motion, pause and all five destinations. Each audience is checked against the question and hint on its own path card.
- `landing-apple-audit.mjs`: 9 viewports + 200% at 390/1280; **0 horizontal overflow, 0 clipped visible text**. The only console entry is the audit's intentional 401 auth fixture.
- `landing-scroll-audit.mjs`: real-user screen captures.
- Lighthouse mobile production `/`: performance **0.86**, accessibility **1.00**, best practices **0.96**, SEO **1.00**; accessibility and SEO gates pass.
- `qa-motion.mjs`, `qa-taps.mjs`, `qa-continuity.mjs`: pass.

Direct "Find your path" entry at 1280×720 now lands with the heading, all five questions and all five solution hints inside the viewport (the gate asserts every hint bottom is within the 720px fold).

## Evidence

- `shots/apple-study-redesign/before-final/` — pre-change full pages, 1440 and 390.
- `shots/apple-study-redesign/merged-final/` — production full pages and section crops, 1440 and 390.
- `shots/apple-study-redesign/compare/before-after-desktop.png` and `before-after-mobile.png`.
- `shots/apple-study-redesign/compare/apple-reference-comparison-merged.png`.
- `shots/apple-study-redesign/merged-gate-{chromium,firefox,webkit}/` — per-browser gates and receipts.
- `shots/apple-study-redesign/merged-audiences/` — five-audience journeys and receipt.
- `shots/apple-study-redesign/merged-audit/` — nine-viewport and 200% audit.
- `shots/apple-study-redesign/merged-lighthouse/` — Lighthouse receipt.

## Acceptance

The five category pages still carry the detailed product experiences. This page now introduces, recognises and routes. It is held in `deepseek/universal-landing-final` for founder design acceptance; merging into `dev` waits for that acceptance. No `main` promotion and no production deployment are claimed.
