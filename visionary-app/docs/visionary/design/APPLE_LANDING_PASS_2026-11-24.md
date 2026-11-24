# Universal landing — Apple-principal design and QA pass

Date: 2026-11-24
Base: `aae98fdc` (`origin/dev`, PR #66 — the accepted five-audience homepage)
Implementation candidate: `fcc5756644e79aedc022330f4b977e0bacaf5c7a`
Branch: `deepseek/frontend-work`
Merge target: `dev` only after explicit owner approval. **Not merged yet.** `main` was not promoted.

## Scope

The universal front door (`/`) was rebuilt as one focused product story for five audiences: hero → One Intelligence → shared challenge → learning loop → five paths → trust → close. The five category pages (`/student`, `/teacher`, `/parent`, `/professional`, `/organization`) were read-only references and were re-verified as destinations.

## Per-page Apple study (live at 1440 / 834 / 390)

| Page | Structural read |
| --- | --- |
| Education | Full-bleed photo hero (1,298px); a 608px “in action” carousel with 1,260px story cards at 28px radius; a 1,985px chapter at 80px statement with a 2×2 media grid; a 771px dark audience chapter (48px statement, 3 × 407px cards); stories (771); How to Buy (660); values (735px, 48px heading, 3 × 407px white cards, 28px radius). |
| Education Initiative | Three ~953px editorial story chapters: 64/68 statement, 24/28 lead, 980×516 media. The “Our work” chapter is 1,953px with 140/150px breath and 3 × 307px cards; the news chapter is a 738px 2-column grid. |
| K–12 | A 910px dark hero; an 827px highlights chapter; four 1,939–2,720px media chapters; 48px statements; 86px hero-to-body gap. |
| iPhone | 80/84 wordmark, then a five-up product lineup; 914–1,116px feature cards; 56px statements; a 762px closing band. |
| Vision Pro | 28/32 tagline; a 2,129px “Take a closer look” chapter; 80px section statements; 13,118px entertainment chapter; 820px cards and generous full-bleed media. |

The common laws: chapter breath **140–144px desktop / 120px phone**; editorial spine **980px**; wide card row **1264px**; card radius **28px**; statements **48–64px**; body **17/25**; lead **24/28–32**; one scene at a time; light/dark alternation; a hero that owns the first screen; and no paragraph allowed to become wider than its statement.

### App-browser re-read — 1000px Apple pages, 1440px Visionary

| Page | Document height | Section heights (px) |
| --- | --- | --- |
| Education | 6,375 | 604 · 620 · 1,762 · 678 · 678 · 524 · 661 |
| K–12 | 11,093 | 750 · 753 · 1,723 · 2,612 · 2,207 · 1,655 · 524 |
| iPhone | 8,581 | 896 · 946 · 831 · 854 · 848 · 916 · 1,087 |
| Vision Pro | 24,830 | 636 · 954 · 1,648 · 10,232 · 2,105 · 5,319 · 1,362 · 1,062 |
| **Visionary landing** | **5,983** | **844 · 832 · 608 · 816 · 742 · 799 · 590** |

At 1980px the landing hero is 1,218px tall; the copy block is 433px and the cast stage 388px. The path frame is 1,264px with five ~225px cards and 36px gutters; trust and close are also 1,264px. This is intentionally the **front-door scale**, not Apple's 8k–25k product-catalog length: deep media chapters, labels and product grids remain on the category pages.

## Product source study

The landing must describe the actual product, not only the reference pages.

- `/how-it-works` is 8,049px and carries the canonical eight-stage learning loop: Goal → Check → Teach → Ask → Check again → Practise → Build → Reflect. Its own copy says the guided journey is in development and that a visitor can create an account and view saved learning history today.
- `/student` condenses the same product into four intelligence steps: Understand → See/Hear/Ask → Practise → Build.
- The landing therefore uses a **four-stage public summary** — Ask → Understand → Practise → Build — not the eight-stage internal page. The **One Intelligence** chapter carries the truth note immediately under the promise (“The guided experience is in development. Today, you can create an account and view saved learning history.”), and the loop chapter keeps the four-stage diagram with its single `/how-it-works` door.

This is the “how” beat the landing was missing; it connects the product promise to the five role paths without duplicating the category pages.

### The five sides of the same loop

The five category stories were re-read at source before the second landing pass. They share the same four moves but enter from different sides:

| Path | What its page story says | One verb for the loop lead |
| --- | --- | --- |
| Student | Understand → see/hear/ask → practise → build | asks |
| Teacher | Understand the class → explain another way → know who is with you → learn what teaching demands next | explains |
| Parent | What the child understood → where they are stuck → which way learning is moving → one shared view | supports |
| Professional | Understand the work → turn projects into lessons → carry expertise → see what the work is building | builds |
| Organization | See what people understand → find gaps early → support every role from one system → improve the next decision | learns what to change |

The landing now states that bridge in one sentence under the loop heading: “A student asks. A teacher explains. A parent supports. A professional builds. An organization learns what to change. One loop, from every side.” The five names remain the only doors; the detail stays on each category page. The gate asserts that the loop lead names all five roles.

## Destination-page audit

The four remaining category pages were opened in the app browser at the final candidate and checked against the landing path promise:

| Route | Page height | Hero continuation | Detail |
| --- | --- | --- | --- |
| `/teacher` | 13,086px | Teaching. Teaching, to grow, to reach. | Ten sections from struggle → journey → intelligence → language → achievement → continuity → trust → CTA → explore |
| `/parent` | 13,313px | Parenting. Parenting, to see, to help. | Same ten-section grammar; child progress, language, trust |
| `/professional` | 13,339px | Building. Building, to apply, to grow. | Work/career journey, private portfolio, trust |
| `/organization` | 13,497px | Leading. Leading, to scale, to last. | Adoption, people/teams, language, governance, trust |

Each page carries the detailed story that the landing deliberately does not repeat. The Professional struggle copy defect is fixed in `e7864b49`: the slide word is now lower-case “application,” and the app browser verifies “Every professional wonders about application.” The landing link and destination hero were already correct.

## Public and auth route audit

- **24 public routes** were opened in the app browser: `/`, five categories, how-it-works, help, pricing, download, about, research, community, updates, partners, referral, privacy, terms, cookies, safety, security, accessibility, careers, contact. Every route rendered a main H1 and correct title; none returned the 404 page.
- **Claim consistency:** pricing states that Personal/Family prices are a billing preview and learning features are planned; how-it-works states the guided journey is in development and saved learning history is available today. The landing’s One Intelligence chapter carries the same truth note immediately under its promise. The trust card now uses conditional, universal sharing language (“When you choose to share, the people you authorize see only what you shared”) instead of claiming a live family view; `/parent` and `/safety` both describe that view as in development. Privacy, safety and accessibility links match the published policies.
- **Auth/recovery:** login, register, forgot-password, forgot-user-id and reset-password render their forms and controls. `/auth/action` previously inherited the 404 title; it is now added to the auth-surface boundary in `routeMeta.js`, and the browser verifies title “Visionary — Learn, Ask, Build” with H1 “Verify your email.”
- **Internal surfaces:** all **32 `/dashboard` route declarations plus `/onboarding`** were audited from `App.jsx`, the guard components and the route-contract test. `/onboarding` sits behind `ProtectedRoute`; every dashboard route sits behind `ProtectedRoute` + `OnboardingGate`. `ProtectedRoute` preserves the intended path as `returnTo` when it sends an unauthenticated visitor to `/login`. This is a source/fixture audit, not a live sign-in claim: the worktree has only `.env.firebase.example`, no Firebase credentials and no emulator realm, so the auth surface fails closed by design.
- **Production surface:** 9 declared paths mount a connected surface: `/dashboard`, `/dashboard/home`, `/dashboard/learn`, `/dashboard/learn/:topicId`, `/dashboard/subscription`, `/dashboard/profile`, `/dashboard/connections`, `/dashboard/privacy` and `/dashboard/settings`. The other 23 declared paths render the explicit “This workspace area is not available yet” room with a return-to-account-home link; the `production-graph` test pins that only `/dashboard/subscription` may mount through the Outlet. This is the same development truth the landing carries.
- **Documents:** 379 docs were inventoried and sampled across the operative contract, current status, gate/acceptance/traceability, AGI sequence, launch architecture, five role charters, the design index, dated landing/design handoffs, the review index and the three living logs. A repo-wide scan of all 379 docs for live/availability/production/scale assertions returned 28 matches in 19 files; every match is a dated delivery/audit record or an internal style example, not a current public product claim. The current-state documents consistently say AGI is the ambition, not a demonstrated capability; connected runtime covers account/auth/onboarding/device sessions, test billing and optional feedback, while durable learning/ML, verified role relationships, child admission, curriculum continuity and hosted/domain acceptance remain open. The older landing handoffs (v4–v14) are dated historical records with their original counts; the design index explicitly says a later continuation does not certify earlier journeys, and this pass supersedes them for `/`. One dated frontend audit (`FRONTEND_PRODUCTION_AUDIT_2026-10-21`, flipped 2026-10-31) calls the frontend surface production-ready; that verdict is scoped to the type/QA wall at its beta, not to hosted learning/model acceptance, and the current status keeps those gates open. It is not a public claim. No current document contradicts the landing’s truth note.

### Internal route source audit

| Production surface | Declared paths |
| --- | --- |
| Connected (9) | `/dashboard`, `/dashboard/home`, `/dashboard/learn`, `/dashboard/learn/:topicId`, `/dashboard/subscription`, `/dashboard/profile`, `/dashboard/connections`, `/dashboard/privacy`, `/dashboard/settings` |
| Honest unavailable room (23) | `classes`, `ask`, `practice`, `build`, `class/:classId`, `child`, `people`, `curriculum`, `analytics`, `insights`, `explore`, `support`, `prepare`, `library`, `career`, `growth`, `progress`, `reports`, `notifications`, `personalization`, `audit`, `cohorts`, `learners` |

The route-contract test is the executable receipt: 24 public routes, 6 auth surfaces, both redirect aliases, `/onboarding` behind `ProtectedRoute`, all 32 dashboard declarations behind both guards, and the 404 catch-all. The full suite passed 872/872 after the audit.

### Claim-to-source check

| Landing statement | Source of truth | Verdict |
| --- | --- | --- |
| The guided journey is in development; an account and saved learning history work today | `CoachingPage.jsx:370`, `AILearningPage.jsx:147`, `pricingConfig.js:117-119`, `CURRENT_PRODUCT_STATUS.md:30` | Supported; the landing uses the same words |
| English, Hindi or Bengali | `pricingConfig.js` language row; `/accessibility` | Supported |
| Free to start; private by design | Start plan is ₹0 with no card; `/privacy`, `/safety`, `/accessibility` | Supported as the current plan and published policies |
| Five role paths | `App.jsx` routes; five role charters; five destination pages | Supported |
| Sharing with a teacher or connected parent | `/parent` and `/safety` both say the family view/guardian summaries are in development; the landing says “when you choose to share” and limits the visible result to what was shared | Supported as a design principle, not a live feature |
| One Intelligence chapter | The body names the connected workspace, not a live AI guide; the 13px note immediately below says the guided experience is in development; `CURRENT_PRODUCT_STATUS.md:28` says AGI is the ambition, not a demonstrated capability; no guide surface is in the 9 connected production paths | Supported; promise and availability are in the same chapter |

**Apple same-turn re-check:** Education’s live values row shows the same three-card, 28px-radius, icon → title → copy → Learn more grammar used by trust. iPhone’s live line-up shows large product images with names only and a pagination control; the landing path row uses the same names-only discipline. The loop chapter is original Visionary product vocabulary, not an Apple copy; no further source change was justified.

## Apple's measured space applied

| Property | Apple measured | This pass |
| --- | --- | --- |
| Chapter breath | 140–144px desktop; 120px phone | 140px desktop; 112px phone |
| Editorial spine | 980px (692px tablet) | 980px |
| Wide card row / panel | 1264px, 28px radius | 1264px, 28px radius |
| Statement tiers | 80 / 64 / 48 / 24 px | 64 / 56 / 48 px (hero 88) |
| Body / lead | 17/25; 24/28–32 | 21/25; 24/600 |
| Card / row gaps | 20–24px | 20–24px |
| Section heights (desktop) | 608–1985px | 590–832px |
| Page height | 7,657px education; 7,945px initiative | 5,983px front door |

The landing deliberately does not reproduce Apple's 12,000px product catalog. It takes the measured **chapter grammar** — 980 spine, 1264 wide row, 140 breath, 48–64 statements, 28px card radius, 5-up line-up and 3-up values row — and applies it to a seven-beat front door. The only full-bleed surfaces are the hero and the dark Intelligence chapter, so media stays meaningful.

### Type-length discipline

Measured rendered line widths at 1440:

- Hero statement line: **603px**. Hero sub lines: **341 / 248 / 364px** — the sub never reaches the statement width.
- Shared-challenge statement lines: **447 / 301 / 319px**. Supporting copy lines: **358 / 407 / 349px** — the copy sits inside the statement's measure.
- Path line-up: 56px statement; 28/32 role names; no per-card copy.
- Trust card titles 28/32; copy 17/25; values links 17px.

## What changed

- **Hero owns the fold.** `min-height: calc(100dvh - 3.5rem)` and `margin-top: 3.5rem`; the next chapter never appears in the first screen at 390/768/834/1440/1920. The studio cast is alpha-masked into the page rather than hard-cropped. The sub is narrowed to 38ch so it reads as support, not a second headline. On a short landscape phone (`max-height: 520px`), the cast steps aside so the complete words, action and five doors still fit the first screen.
- **Five audience doors on arrival.** Quiet 12–13px local row; hover/focus previews the matching story; Enter opens the category page; active underline and a visible pause/play control. The gate now asserts the row's bottom is inside every tested viewport, including 844×390, and that the primary action and all five doors keep 44px targets. The short-landscape pause control stays visible and pauses the 6.5s rotation; on 320×568 it is lifted fully inside the fold, and the gate asserts the control's top/bottom rather than mere presence.
- **One Intelligence is a full product chapter.** 94svh dark stage capped at 52rem, 64px statement, 24/600 lead, complete guide on the band floor with a soft product glow. The body names the connected workspace, and the 13px availability note sits directly under it — not several chapters later.
- **Shared challenge is an Apple story split.** 64px statement left on a 980px spine, supporting copy and 24/600 answer right. No centered text corridor.
- **The learning loop is the missing “how”.** A 980px, four-stage product diagram - Ask → Understand → Practise → Build - with numbered nodes, a quiet connector, 28px stage names, 17px one-liners and a single `/how-it-works` door. A one-sentence lead above the diagram names all five sides: “A student asks. A teacher explains. A parent supports. A professional builds. An organization learns what to change. One loop, from every side.” The gate asserts that the lead names every role. The availability note lives in the One Intelligence chapter above it, where the promise is made.
- **Five paths are an iPhone-style five-up lineup.** 1264px row, 4:5 portraits at 28px radius, 28px names and arrows, with **35px gutters at 1440 and 36px at 1920** so the names and arrows do not crowd the next card. After the live user review, the abstract subhead and the five per-card descriptions were removed: the section now carries one heading, five faces, five clear role names and a single arrow per door. The Student card uses a normalized crop from the transparent hero cutout so all five portraits share the same white studio ground. Below 1280 it becomes a snap rail with 20px gaps and quiet previous/next controls; desktop keeps all five visible. The rail controls render only when the row can actually scroll. At 200% text the container queries turn the desktop five-up into three columns and the phone rail into a compact list; role names never split mid-word, the compact list hides its arrows, and its titles stay inside their cards.
- **Trust is an Education-style values row.** 1264px row, three white 28px-radius cards on #f5f5f7: Private by design / Safe to learn / Open to everyone, each with a 32px icon, 28px title, 17/25 copy and a real page link. The sharing card speaks to all five audiences (“Your private work stays private. When you choose to share, the people you authorize see only what you shared”) rather than claiming a live parent view. Below 900 it becomes an Apple-style card rail with controls.
- **Close is a 1264px, 28px-radius panel** with the trust line “Free to start. Private by design.”, the primary action and a quiet “See how it works” door.
- **The phone header stays quiet.** The scroll-only black “Get started” pill is hidden below 640px, leaving logo + menu; the hero and close carry the action instead.
- **Production accessibility fixes.** The mobile drawer's inert/scroll lock uses a layout effect; the gate waits for the settled a11y state after a resize. The destination category H1 now marks its rotating word `aria-hidden` so the complete spoken sentence is the accessible name once, not twice.
- **Quality gate updated** to assert the fold, the five hero doors inside the viewport, five path doors, the loop lead's five role names, at least 28px of path-card breathing room at desktop, all three trust links, the horizontal rails and their controls, visible-card text containment at 200%, role/stage word integrity at 200%, and a retry-safe image decode that waits for load instead of treating a transient decode as a broken image.

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
| 844×390 | 592px | no | 334px | no |

Final desktop chapters: **hero 844 · Intelligence 832 · shared challenge 608 · learning loop 816 · five paths 742 · trust 799 · close 590**. Page height **5,983px**. Mobile page height **5,444px**.

## Five real-user journeys (production build)

| Visitor | Hero promise | Destination | Destination hero |
| --- | --- | --- | --- |
| Student | to a project | `/student` | Learning, |
| Teacher | to a lesson | `/teacher` | Teaching. |
| Parent | to a conversation | `/parent` | Parenting. |
| Professional | to a new skill | `/professional` | Building. |
| Organization | to a team plan | `/organization` | Leading. |

The five portraits repeat as the path line-up; keyboard focus order is the five cards; Enter opens the focused page. The path and trust rails also expose previous/next controls below their desktop breakpoints. Reduced motion holds the first story; pause holds the active story for 7 seconds. At **844×390** the cast steps aside and the five doors sit at the fold (hero 334px, doors bottom 334px), so a short landscape phone still gets the same five-audience story.

The destination H1 accessible names are single complete sentences, verified with Playwright `ariaSnapshot`:

| Route | Accessible H1 |
| --- | --- |
| `/student` | Learning, to master, to build. |
| `/teacher` | Teaching, to grow, to reach. |
| `/parent` | Parenting, to see, to help. |
| `/professional` | Building, to apply, to grow. |
| `/organization` | Leading, to scale, to last. |

**App-browser final check (1980×1274):** each path card was focused and activated with Enter. The destinations read `/student → Learning,`, `/teacher → Teaching.`, `/parent → Parenting.`, `/professional → Building.`, `/organization → Leading.`, with matching supporting lines. Back returned to `/` with “Find your path.” intact and refresh restored `/` with all five paths. The path cards are deliberately image + role name; the shared loop lead above them carries the five-sided explanation.

**App-browser full-page audit:** header → hero → One Intelligence → shared challenge → learning loop → five paths → trust → close → footer. The hero is complete at the fold; all five faces are visible; the loop lead names all five sides; the path row breathes with 35px gutters at 1440; the trust cards are legible; the closing panel is singular. No section needed a second media scene: adding one would repeat the cast or invent product imagery and make the front door heavier than Apple’s own landing.

## Verification

- `eslint . --quiet`: clean.
- `tsc -p jsconfig.json` and `tsc -p tsconfig.domain.json`: clean.
- `vite build`: clean (2,166 modules).
- `node --test --test-concurrency=2 tests/*.test.mjs`: **872/872 passed**.
- `landing-v10-quality.mjs`: **PASS on three consecutive runs** — 9 viewports, 7 interaction groups, production build. Asserts fold ownership, the five hero doors inside the viewport, 44px primary/audience targets, a visible pause/play control, all five path doors, the loop lead naming all five roles, at least 28px of path-card breathing room at desktop (35px at 1440, 36px at 1920), all three trust links, rail controls, mobile menu, footer disclosures, returning-visitor fixtures, preload lifecycle, visible-card text containment at 200%, role/stage word integrity at 200%, path-control/no-op protection, and title containment at 200%.
- `qa-motion.mjs`, `qa-taps.mjs`, `qa-continuity.mjs`: all pass.
- `landing-apple-audit.mjs`: 9 viewports + 200% at 390/1280; zero horizontal overflow; **844×390 hero 334px with the five doors at the fold**; zero clipped visible text under the audit's definition; the only console entry is the audit fixture's intentional 401.
- `landing-five-audiences.mjs`: 10 destination screens plus keyboard, reduced motion and pause.
- `landing-scroll-audit.mjs`: 14 real-user screen captures for visual review; clipping and control behaviour are asserted by the landing gate and the 200% audit, not by this capture script.
- Lighthouse production `/` mobile (`lighthouse-loop-path`): performance **0.86**, accessibility **1.00**, best practices **0.96**, SEO **1.00**; FCP 0.91s, TBT **36ms**, CLS 0; LCP **4.30s** is recorded, not claimed as passed (the project does not gate performance; SPA boot remains the tracked LCP lever).
- Product-surface inventory refreshed: 67 routes, 55 endpoints, 1,534 control declarations.

## Evidence

Local (worktree) evidence set:

- `shots/apple-refs/` — Apple references, `spacing.json`, and the pre-change landing.
- `shots/apple-pass-2026-11-24/final6-real-user/` — 14 real-user scroll screens (desktop + phone).
- `shots/apple-pass-2026-11-24/final6-production-gate/` — production gate screenshots and `receipt.json`.
- `shots/apple-pass-2026-11-24/final6-production-audiences/` — five visitor journeys, desktop + mobile, `receipt.json`.
- `shots/apple-pass-2026-11-24/final6-production-audit/` — final nine-viewport audit and `receipt.json`.
- `shots/apple-pass-2026-11-24/lighthouse-final6b/` - valid Lighthouse receipt.
- `shots/apple-pass-2026-11-24/product-audit-gate/` - landing gate after the product/auth fixes.
- `shots/apple-pass-2026-11-24/product-audit-audiences/` - five-persona gate after the fixes.
- `shots/apple-pass-2026-11-24/lighthouse-product-audit-b/` - valid final Lighthouse receipt.
- `shots/apple-pass-2026-11-24/review-fix-1/`, `review-fix-gate-run1/`, `review-fix-gate-run2/` - three consecutive landing-gate passes after the first review fixes.
- `shots/apple-pass-2026-11-24/review-fix-audit/` - nine-viewport + 200% audit after the first fixes.
- `shots/apple-pass-2026-11-24/review-fix-audiences/` - five-persona journey gate after the first fixes.
- `shots/apple-pass-2026-11-24/review-fix-scroll/` - 14 real-user screens after the first fixes.
- `shots/apple-pass-2026-11-24/lighthouse-review-fix/` - Lighthouse receipt for `22facb62`.
- `shots/apple-pass-2026-11-24/review-fix2-gate/`, `review-fix2-gate-run1/`, `review-fix2-gate-run2/` - three consecutive landing-gate passes after the residual fixes.
- `shots/apple-pass-2026-11-24/review-fix2-audit/` - nine-viewport + 200% audit after the residual fixes.
- `shots/apple-pass-2026-11-24/review-fix2-audiences/` - five-persona journey gate after the residual fixes.
- `shots/apple-pass-2026-11-24/review-fix2-scroll/` - 14 real-user screens after the residual fixes.
- `shots/apple-pass-2026-11-24/lighthouse-review-fix2/` - Lighthouse receipt for `87e4c22d`.
- `shots/apple-pass-2026-11-24/review-fix3-gate/`, `review-fix3-gate-run1/`, `review-fix3-gate-run2/` - three consecutive landing-gate passes after the 320px playback fix.
- `shots/apple-pass-2026-11-24/review-fix3-audit/` - nine-viewport + 200% audit after the 320px playback fix.
- `shots/apple-pass-2026-11-24/review-fix3-audiences/` - five-persona journey gate after the 320px playback fix.
- `shots/apple-pass-2026-11-24/review-fix3-scroll/` - 14 real-user screens after the 320px playback fix.
- `shots/apple-pass-2026-11-24/lighthouse-review-fix3/` - Lighthouse receipt for `4500906f`.
- `shots/apple-pass-2026-11-24/loop-path-fix/`, `loop-path-gate-run1/`, `loop-path-gate-run2/` - three consecutive landing-gate passes for the five-sided loop and wider path gutters.
- `shots/apple-pass-2026-11-24/loop-path-audit/` - nine-viewport + 200% audit for the five-sided loop and path gutters.
- `shots/apple-pass-2026-11-24/loop-path-audiences/` - five-persona journey gate for the five-sided loop and path gutters.
- `shots/apple-pass-2026-11-24/loop-path-scroll/` - 14 real-user screens for the five-sided loop and path gutters.
- `shots/apple-pass-2026-11-24/lighthouse-loop-path/` - Lighthouse receipt for `fcc57566`.

## Acceptance decision

**ACTIVE IN THE CURRENT WORKTREE — owner-feedback revision; re-review pending.** The first independent review of `a4964970` (source `e7864b49`) returned **CHANGES REQUIRED** on four blockers: the live AI-guide claim, the parent-sharing claim, 200% mid-word breaks in the role/stage names, and the 844×390 hero fold. Those were fixed in `22facb62`.

The second review of `22facb62` verified those four as fixed and identified five residual defects introduced by the reflow: no-op path controls in the 200% compact list, a hidden pause control while the hero kept rotating in short landscape, 32/36px tap targets there, a 320px/200% title-row overflow, and a note that rendered at 17px while the receipt claimed 13px. All five were fixed in `87e4c22d`.

The third review of `87e4c22d` verified those five as fixed and found one narrow residual: at 320×568 the 44px pause/play control was partly below the fold, and the gate only checked presence rather than viewport containment. Fixed in `4500906f`: the control is lifted to 519–563px inside the 568px viewport, and the gate now asserts `top >= 0` and `bottom <= innerHeight` on every viewport.

The production build now passes lint, both type checks, **872 tests**, three consecutive landing-gate runs, the Apple nine-viewport/200% audit, the five-persona gate, the 14-screen capture pass, motion/taps/continuity, and Lighthouse accessibility/SEO gates.

**Independent review of `4500906f`: PASS.** The fourth review of source `4500906f` at docs/evidence head `125404f0` returned **PASS**. It measured the 320×568 playback control at **top 519.47 / bottom 563.47 / 44px** inside the 568px viewport, independently reproduced the short-landscape pause and 44px targets, the 200% control/title behaviour, the five destination headings, and the internal route graph. It also injected a clipped control and confirmed the gate's exact predicate fails. Its stated limits: live internal auth/service was not tested; Lighthouse was not independently rerun; physical notched devices and browser zoom were not tested; and the width-scoped 320px rule does not cover nonstandard 360×568 / 375×568 short-portrait heights outside the documented nine-viewport matrix.

**Owner feedback after that PASS:** the learning loop still read as if it belonged to one kind of user, and the path-card labels felt crowded. This revision is `fcc57566`: the loop now carries the five-sided lead (“A student asks. A teacher explains. A parent supports. A professional builds. An organization learns what to change. One loop, from every side.”), and the path row uses **35px gutters at 1440 / 36px at 1920 / 31px at 1280**. The gate asserts that the lead names all five roles and that desktop path gutters stay at least 28px. Page height is **5,983px desktop / 5,444px mobile**; the loop chapter is **816px** and the path chapter **742px** at 1440.

Per the master directive, merge authorization remains with the owner. Not merged into `dev`. Not promoted to `main`. No production deployment is claimed. A fresh independent review of `fcc57566` is required before any merge. Live internal dashboard acceptance remains blocked by the auth/service realm and belongs to the ordered internal phase.
