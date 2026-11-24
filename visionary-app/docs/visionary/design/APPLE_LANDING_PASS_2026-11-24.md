# Universal landing — Apple-principal design and QA pass

Date: 2026-11-24
Base: `aae98fdc` (`origin/dev`, PR #66 — the accepted five-audience homepage)
Implementation candidate: `545db7240a438ec85a17c7068d25cf0cbce16723`
Branch: `deepseek/frontend-work`
Merge target: `dev` only. `main` was not promoted.

## Scope

The universal front door (`/`) was rebuilt as one focused product story for five audiences: hero → One Intelligence → shared challenge → five paths → trust → close. The five category pages (`/student`, `/teacher`, `/parent`, `/professional`, `/organization`) were read-only references and were re-verified as destinations.

## Apple references studied

- https://www.apple.com/in/education/
- https://www.apple.com/in/education-initiative/
- https://www.apple.com/in/education/k12/
- https://www.apple.com/in/iphone/
- https://www.apple.com/apple-vision-pro/

Desktop (1440×900), tablet (834×1112), and phone (390×844) captures and section maps were taken live with Playwright/Edge. The decisive read: Apple's hero is the complete first screen; chapters breathe at 100–144px; statements are 48–64px; body is 17–21px; imagery is large and intentional; the close is quiet and singular.

## What changed

- **Hero owns the fold.** `min-height: calc(100dvh - 3.5rem)` replaces the 51rem cap. The next chapter no longer appears in the first screen at 390/768/834/1440/1920. Short viewports grow and scroll instead of clipping.
- **Five audience doors on arrival.** A quiet 12–13px local row (`Students · Teachers · Parents · Professionals · Organizations`) sits under the primary action. Hover/focus previews the matching story; Enter opens the category page. The active door is underlined; the rotation has a visible pause/play control.
- **Studio fade, not a hard crop.** The cast is masked into the page instead of ending on a horizontal line; the five portraits fade together and no white fog band sits across them.
- **One Intelligence is a full product chapter.** 84svh dark stage, 64px statement, 24/600 lead, complete bot on the band floor with a soft product glow.
- **The shared challenge now lands its answer.** The problem stays at reading scale; the one-workspace answer is the 24/600 lead.
- **The fork is editorial.** “Find your path.” gains “One intelligence. Five ways to begin.”, larger portraits, and a quieter hover (portrait scale + blue label + arrow) without turning into five mini pages.
- **Trust and close.** Privacy settles at the 48px card-chapter tier; the close adds the approved trust line “Free to start. Private by design.”
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

Document height at 1440: 4,239px → 4,667px. At 390: 3,366px → 3,797px. The increase is the fold ownership, the full Intelligence stage, and the added trust line, not new copy volume.

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
- `vite build`: clean (2,166 modules; 8.15s).
- `node --test --test-concurrency=2 tests/*.test.mjs`: **871/871 passed**.
- `landing-v10-quality.mjs`: **PASS** — 9 viewports, 7 interaction groups, on both the dev server and the production preview.
  The gate asserts the hero fills the first screen, the next chapter does not intrude, all five paths resolve, the mobile menu, footer disclosures, returning-visitor fixtures, preload lifecycle, 200% text and 0 horizontal overflow.
- `qa-motion.mjs`: motion law holds.
- `qa-taps.mjs`: tap law holds (44px controls).
- `qa-continuity.mjs`: all recorded public-surface laws pass.
- `landing-apple-audit.mjs`: 9 viewports + 200% text at 390 and 1280; zero horizontal overflow, zero clipped visible text, no page errors (the only console entry is the intentional 401 auth probe in the audit fixture).
- `landing-five-audiences.mjs`: 10 destination screens (desktop + mobile) plus keyboard, reduced-motion and pause checks.
- Lighthouse on the production build (`/`, mobile): performance **0.86**, accessibility **1.00**, best practices **0.96**, SEO **1.00**. FCP 0.91s, TBT 31ms, CLS 0. LCP 4.23s is recorded, not claimed as passed: the project's Lighthouse gate does not gate performance, and the SPA boot remains the tracked LCP lever. This pass added no layout shift and no blocking time regression.
- Shared pages: the five category heroes were re-verified at desktop and mobile; navigation, footer, auth/back, and the mobile drawer resize/close path were exercised. The `MobileNavigation` inert race found only in the production build was fixed and re-tested.

## Evidence

Local (worktree) evidence set:

- `shots/apple-refs/` — Apple references and the pre-change landing at 1440/834/390.
- `shots/apple-pass-2026-11-24/final-audit/` — nine viewports, 200% text, section captures.
- `shots/apple-pass-2026-11-24/final-production-gate/` — production gate screenshots and `receipt.json`.
- `shots/apple-pass-2026-11-24/final-five-audiences/` — five visitor journeys, desktop + mobile, `receipt.json`.
- `shots/apple-pass-2026-11-24/lighthouse-final/` — Lighthouse receipt.

## Acceptance decision

**PASS for dev integration.** The landing holds one focused first-screen composition at every tested device size, all five audience journeys reach a page that continues the story, the production build passes lint, both type checks, 871 tests, the landing quality gate and Lighthouse accessibility/SEO gates, and no design, navigation or accessibility regression was observed.

Not promoted: `main`. No production deployment is claimed.
