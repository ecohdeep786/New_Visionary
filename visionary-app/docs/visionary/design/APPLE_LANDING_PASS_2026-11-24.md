# Universal landing — Apple-principal design and QA pass

Date: 2026-11-24
Base: `aae98fdc` (`origin/dev`, PR #66 — the accepted five-audience homepage)
Implementation candidate: `f8ef025417a47902a0fd32dac45dd3d2c1fd5e17`
Branch: `deepseek/frontend-work`
Merge target: `dev` only after explicit owner approval. **Not merged yet.** `main` was not promoted.

## Scope

The universal front door (`/`) was rebuilt as one focused product story for five audiences: hero → One Intelligence → shared challenge → five paths → trust → close. The five category pages (`/student`, `/teacher`, `/parent`, `/professional`, `/organization`) were read-only references and were re-verified as destinations.

## Per-page Apple study (live at 1440 / 834 / 390)

| Page | Structural read |
| --- | --- |
| Education | Full-bleed photo hero (1,298px); a 608px “in action” carousel with 1,260px story cards at 28px radius; a 1,985px chapter at 80px statement with a 2×2 media grid; a 771px dark audience chapter (48px statement, 3 × 407px cards); stories (771); How to Buy (660); values (735px, 48px heading, 3 × 407px white cards, 28px radius). |
| Education Initiative | Three ~953px editorial story chapters: 64/68 statement, 24/28 lead, 980×516 media. The “Our work” chapter is 1,953px with 140/150px breath and 3 × 307px cards; the news chapter is a 738px 2-column grid. |
| K–12 | A 910px dark hero; an 827px highlights chapter; four 1,939–2,720px media chapters; 48px statements; 86px hero-to-body gap. |
| iPhone | 80/84 wordmark, then a five-up product lineup; 914–1,116px feature cards; 56px statements; a 762px closing band. |
| Vision Pro | 28/32 tagline; a 2,129px “Take a closer look” chapter; 80px section statements; 13,118px entertainment chapter; 820px cards and generous full-bleed media. |

The common laws: chapter breath **140–144px desktop / 120px phone**; editorial spine **980px**; wide card row **1264px**; card radius **28px**; statements **48–64px**; body **17/25**; lead **24/28–32**; one scene at a time; light/dark alternation; a hero that owns the first screen; and no paragraph allowed to become wider than its statement.

## Apple's measured space applied

| Property | Apple measured | This pass |
| --- | --- | --- |
| Chapter breath | 140–144px desktop; 120px phone | 140px desktop; 112px phone |
| Editorial spine | 980px (692px tablet) | 980px |
| Wide card row / panel | 1264px, 28px radius | 1264px, 28px radius |
| Statement tiers | 80 / 64 / 48 / 24 px | 64 / 56 / 48 px (hero 88) |
| Body / lead | 17/25; 24/28–32 | 21/25; 24/600 |
| Card / row gaps | 20–24px | 20–24px |
| Section heights (desktop) | 608–1985px | 590–858px |
| Page height | 7,657px education; 7,945px initiative | 5,284px front door |

The landing deliberately does not reproduce Apple's 12,000px product catalog. It takes the measured **chapter grammar** — 980 spine, 1264 wide row, 140 breath, 48–64 statements, 28px card radius, 5-up line-up and 3-up values row — and applies it to a six-beat front door. The only full-bleed surfaces are the hero and the dark Intelligence chapter, so media stays meaningful.

### Type-length discipline

Measured rendered line widths at 1440:

- Hero statement line: **603px**. Hero sub lines: **341 / 248 / 364px** — the sub never reaches the statement width.
- Shared-challenge statement lines: **447 / 301 / 319px**. Supporting copy lines: **358 / 407 / 349px** — the copy sits inside the statement's measure.
- Audience intro: 21/25 under a 56px statement; card titles 28/32; card copy 17/25.
- Trust card titles 28/32; copy 17/25; values links 17px.

## What changed

- **Hero owns the fold.** `min-height: calc(100dvh - 3.5rem)` and `margin-top: 3.5rem`; the next chapter never appears in the first screen at 390/768/834/1440/1920. The studio cast is alpha-masked into the page rather than hard-cropped. The sub is narrowed to 38ch so it reads as support, not a second headline.
- **Five audience doors on arrival.** Quiet 12–13px local row; hover/focus previews the matching story; Enter opens the category page; active underline and a visible pause/play control.
- **One Intelligence is a full product chapter.** 94svh dark stage capped at 52rem, 64px statement, 24/600 lead, complete guide on the band floor with a soft product glow.
- **Shared challenge is an Apple story split.** 64px statement left on a 980px spine, supporting copy and 24/600 answer right. No centered text corridor.
- **Five paths are an iPhone-style five-up lineup.** 1264px row, 4:5 portraits at 28px radius, 28px names, 17/25 copy and arrows. The Student card uses a normalized crop from the transparent hero cutout so all five portraits share the same white studio ground. Below 1280 it becomes a snap rail with quiet previous/next controls; desktop keeps all five visible.
- **Trust is an Education-style values row.** 1264px row, three white 28px-radius cards on #f5f5f7: Private by design / Safe to learn / Open to everyone, each with a 32px icon, 28px title, 17/25 copy and a real page link. Below 900 it becomes an Apple-style card rail with controls.
- **Close is a 1264px, 28px-radius panel** with the trust line “Free to start. Private by design.”, the primary action and a quiet “See how it works” door.
- **The phone header stays quiet.** The scroll-only black “Get started” pill is hidden below 640px, leaving logo + menu; the hero and close carry the action instead.
- **Production accessibility fix.** The mobile drawer's inert/scroll lock uses a layout effect; the gate waits for the settled a11y state after a resize.
- **Quality gate updated** to assert the fold, five hero paths, five path doors, all three trust links, the horizontal rails and their controls, plus 200% text with intentional off-screen rail cards excluded.

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
| 844×390 | 592px | no | 633px | no |

Final desktop chapters: **hero 844 · Intelligence 832 · shared challenge 608 · five paths 858 · trust 799 · close 590**. Page height **5,284px**. Mobile page height **4,537px**.

## Five real-user journeys (production build)

| Visitor | Hero promise | Destination | Destination hero |
| --- | --- | --- | --- |
| Student | to a project | `/student` | Learning, |
| Teacher | to a lesson | `/teacher` | Teaching. |
| Parent | to a conversation | `/parent` | Parenting. |
| Professional | to a new skill | `/professional` | Building. |
| Organization | to a team plan | `/organization` | Leading. |

The five portraits repeat as the path line-up; keyboard focus order is the five cards; Enter opens the focused page. The path and trust rails also expose previous/next controls below their desktop breakpoints. Reduced motion holds the first story; pause holds the active story for 7 seconds.

## Verification

- `eslint . --quiet`: clean.
- `tsc -p jsconfig.json` and `tsc -p tsconfig.domain.json`: clean.
- `vite build`: clean (2,166 modules; 10.68s).
- `node --test --test-concurrency=2 tests/*.test.mjs`: **871/871 passed**.
- `landing-v10-quality.mjs`: **PASS** — 9 viewports, 7 interaction groups, on dev and production builds. Asserts fold ownership, all five hero doors, all five path doors, all three trust links, rail controls, mobile menu, footer disclosures, returning-visitor fixtures, preload lifecycle, 200% text and zero overflow.
- `qa-motion.mjs`, `qa-taps.mjs`, `qa-continuity.mjs`: all pass.
- `landing-apple-audit.mjs`: 9 viewports + 200% at 390/1280; zero horizontal overflow, zero clipped visible text; the only console entry is the audit fixture's intentional 401.
- `landing-five-audiences.mjs`: 10 destination screens plus keyboard, reduced motion and pause.
- `landing-scroll-audit.mjs`: 12 real-user screen captures (six desktop, six phone); no clipped interactive content, the phone header stays quiet, and each screen keeps one dominant focus.
- Lighthouse production `/` mobile: performance **0.86**, accessibility **1.00**, best practices **0.96**, SEO **1.00**; FCP 0.91s, TBT 32ms, CLS 0; LCP **4.22s** is recorded, not claimed as passed (the project does not gate performance; SPA boot remains the tracked LCP lever).
- Product-surface inventory refreshed: 67 routes, 55 endpoints, 1,533 control declarations.

## Evidence

Local (worktree) evidence set:

- `shots/apple-refs/` — Apple references, `spacing.json`, and the pre-change landing.
- `shots/apple-pass-2026-11-24/iteration-13/` — final section and viewport captures at nine sizes plus 200% text.
- `shots/apple-pass-2026-11-24/final4-real-user/` — 12 real-user scroll screens (desktop + phone).
- `shots/apple-pass-2026-11-24/final4-production-gate/` — production gate screenshots and `receipt.json`.
- `shots/apple-pass-2026-11-24/final4-production-audiences/` — five visitor journeys, desktop + mobile, `receipt.json`.
- `shots/apple-pass-2026-11-24/final4-production-audit/` — final nine-viewport audit and `receipt.json`.
- `shots/apple-pass-2026-11-24/lighthouse-final4/` — Lighthouse receipt.

## Acceptance decision

**PASS; awaiting the owner's explicit dev merge instruction.** The landing now follows the studied Apple chapter grammar from hero to footer, all five audience journeys reach a page that continues the story, the production build passes lint, both type checks, 871 tests, the landing quality gate and Lighthouse accessibility/SEO gates, and no design, navigation or accessibility regression was observed.

Not merged into `dev`. Not promoted to `main`. No production deployment is claimed.
