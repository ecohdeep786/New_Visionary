# Universal landing — Apple-principal design and QA pass

Date: 2026-11-24
Base: `aae98fdc` (`origin/dev`, PR #66 — the accepted five-audience homepage)
Implementation candidate: `6f7cc22ec7f172badb4a89e3f9375b245087e1ce`
Branch: `deepseek/frontend-work`
Merge target: `dev` only after explicit owner approval. **Not merged yet.** `main` was not promoted.

## Scope

The universal front door (`/`) was rebuilt as one focused product story for five audiences: hero → One Intelligence → shared challenge → five paths → trust → close. The five category pages (`/student`, `/teacher`, `/parent`, `/professional`, `/organization`) were read-only references and were re-verified as destinations.

## Apple references studied

- https://www.apple.com/in/education/
- https://www.apple.com/in/education-initiative/
- https://www.apple.com/in/education/k12/
- https://www.apple.com/in/iphone/
- https://www.apple.com/apple-vision-pro/

Desktop (1440×900), tablet (834×1112), and phone (390×844) captures and section maps were taken live with Playwright/Edge. The decisive read: Apple's hero is the complete first screen; chapters breathe at 140–144px on desktop and 120px on phones; statements are 48–64px; body is 17–21px; imagery is large and intentional; the close is quiet and singular.

## Apple's measured space applied

| Property | Apple measured (education / initiative / Vision Pro) | This pass |
| --- | --- | --- |
| Chapter breath | 140–144px desktop; 120px phone | 140px desktop; 112px phone |
| Editorial spine | 980px (692px tablet) | 980px |
| Wide card row / panel | 1264px, 28px radius | 1264px, 28px radius |
| Statement tiers | 80 / 64 / 48 / 24 px | 64 / 56 / 48 px (hero 88) |
| Body / lead | 17/25; 24/28–32 | 21/25; 24/600 |
| Card / row gaps | 20–24px | 20–24px |
| Section heights (desktop) | 608–1985px | 608–1100px |
| Page height | 7,657px education; 7,945px initiative | 5,302px front door |

The landing deliberately does not reproduce Apple's 12,000px product catalog. It takes the measured **chapter scale** (980 spine, 1264 wide panel, 140 breath, 48–64 statements, 28px panel radius) and applies it to the six-beat front door. The only full-bleed surfaces are the hero and the dark Intelligence chapter, so media stays meaningful rather than decorative.

## What changed

- **Hero owns the fold.** `min-height: calc(100dvh - 3.5rem)` replaces the 51rem cap. The next chapter no longer appears in the first screen at 390/768/834/1440/1920. Short viewports grow and scroll instead of clipping.
- **Five audience doors on arrival.** A quiet 12–13px local row (`Students · Teachers · Parents · Professionals · Organizations`) sits under the primary action. Hover/focus previews the matching story; Enter opens the category page. The active door is underlined; the rotation has a visible pause/play control.
- **Studio fade, not a hard crop.** The cast is masked into the page instead of ending on a horizontal line; the five portraits fade together and no white fog band sits across them.
- **One Intelligence is a full product chapter.** 94svh dark stage capped at 52rem, 64px statement, 24/600 lead, complete bot on the band floor with a soft product glow.
- **The shared challenge now lands its answer.** The problem stays at reading scale; the one-workspace answer is the 24/600 lead. The chapter takes Apple's 64px statement tier and a 608px stage.
- **The fork is editorial.** “Find your path.” moves above the five paths on the 980px spine, gains “One intelligence. Five ways to begin.”, larger portraits, and a quieter hover (portrait scale + blue label + arrow) without turning into five mini pages.
- **Trust and close.** Privacy takes Apple's 576px chapter breath at the 48px card-chapter tier. The close becomes a 1264px, 28px-radius grey panel with the trust line “Free to start. Private by design.”, the primary action and a quiet “See how it works” door.
- **Production accessibility fix.** The mobile drawer's inert/scroll lock now uses a layout effect, so `main` is never left `inert` for a frame after a resize closes it.
- **Quality gate updated** to assert the fold, five hero paths, and the new audience preview/rotation contract. Product-surface inventory refreshed.

## Measured before → after

| Viewport | Before hero | Next chapter in first screen | After hero | Next chapter in first screen |
| --- | --- | --- | --- | --- |
| 390×844 | 608px | yes (−180px) | 788px | no |
| 768×1024 | 752px | yes (−216px) | 968px | no |
| 834×1112 | 752px | yes (−304px) | 1056px | no |
| 1024×768 | 712px | no | 712px | no |
| 1280×800 | 744px | no | 744px | no |
| 1440×900 | 816px | yes (−28px) | 844px | no |
| 1920×1080 | 853px | yes (−171px) | 1024px | no |
| 320×568 | 512px | no | 540px (scrolls 28px past the fold) | no |
| 844×390 | 592px | no | 609px | no |

Document height at 1440: 4,239px → **5,302px**. At 390: 3,366px → **4,459px**. The increase is the fold ownership, the measured chapter breath, the full Intelligence stage and the Apple-scale closing panel, not new copy volume.

Final desktop chapters: hero 844 · Intelligence 832 · shared challenge 608 · five paths 1,100 · trust 576 · close 590. The five-path chapter is large because the statement now opens the row above all five doors on the 980px spine.

## Five real-user journeys (production build)

Each journey started on `/`, previewed the visitor's own line, followed the hero door, waited for the lazy destination, and read the destination hero.

| Visitor | Hero promise | Destination | Destination hero |
| --- | --- | --- | --- |
| Student | to a project | `/student` | Learning, |
| Teacher | to a lesson | `/teacher` | Teaching. |
| Parent | to a conversation | `/parent` | Parenting. |
| Professional | to a new skill | `/professional` | Building. |
| Organization | to a team plan | `/organization` | Leading. |

The directory repeats the same five doors with real portraits and role-specific copy. Keyboard focus order is the five doors in order; Enter opens the focused page. Reduced motion holds the first story without auto-advance; pause holds the active story for 7 seconds and resumes on Play.

## Verification

- `eslint . --quiet`: clean.
- `tsc -p jsconfig.json` and `tsc -p tsconfig.domain.json`: clean.
- `vite build`: clean (2,166 modules; 8.79s).
- `node --test --test-concurrency=2 tests/*.test.mjs`: **871/871 passed**.
- `landing-v10-quality.mjs`: **PASS** — 9 viewports, 7 interaction groups, on both the dev server and the production preview.
  The gate asserts the hero fills the first screen, the next chapter does not intrude, all five paths resolve, the mobile menu, footer disclosures, returning-visitor fixtures, preload lifecycle, 200% text and 0 horizontal overflow.
- `qa-motion.mjs`: motion law holds.
- `qa-taps.mjs`: tap law holds (44px controls).
- `qa-continuity.mjs`: all recorded public-surface laws pass.
- `landing-apple-audit.mjs`: 9 viewports + 200% text at 390 and 1280; zero horizontal overflow, zero clipped visible text, no page errors (the only console entry is the intentional 401 auth probe in the audit fixture).
- `landing-five-audiences.mjs`: 10 destination screens (desktop + mobile) plus keyboard, reduced-motion and pause checks.
- Lighthouse on the production build (`/`, mobile): performance **0.86**, accessibility **1.00**, best practices **0.96**, SEO **1.00**. FCP 0.91s, TBT 28ms, CLS 0. LCP 4.29s is recorded, not claimed as passed: the project's Lighthouse gate does not gate performance, and the SPA boot remains the tracked LCP lever. This pass added no layout shift and no blocking time regression.
- Shared pages: the five category heroes were re-verified at desktop and mobile; navigation, footer, auth/back, and the mobile drawer resize/close path were exercised. The `MobileNavigation` inert race found only in the production build was fixed and re-tested.

## Evidence

Local (worktree) evidence set:

- `shots/apple-refs/` — Apple references, `spacing.json`, and the pre-change landing at 1440/834/390.
- `shots/apple-pass-2026-11-24/iteration-8/` — final section and viewport captures at nine sizes plus 200% text.
- `shots/apple-pass-2026-11-24/space-production-gate/` — production gate screenshots and `receipt.json`.
- `shots/apple-pass-2026-11-24/space-five-audiences-prod/` — five visitor journeys, desktop + mobile, `receipt.json`.
- `shots/apple-pass-2026-11-24/space-production-audit/` — final nine-viewport audit and `receipt.json`.
- `shots/apple-pass-2026-11-24/lighthouse-space-final/` — Lighthouse receipt.

## Acceptance decision

**PASS; awaiting the owner's explicit dev merge instruction.** The landing holds one focused first-screen composition at every tested device size, all five audience journeys reach a page that continues the story, the production build passes lint, both type checks, 871 tests, the landing quality gate and Lighthouse accessibility/SEO gates, and no design, navigation or accessibility regression was observed.

Not merged into `dev`. Not promoted to `main`. No production deployment is claimed.
