# T01 — Chief Frontend Product & Experience baseline (V6 wave)

Date: 2026-11-08 · Implementer: zcode (T01 hat) · Base: verified `origin/beta` `b0d1538c` (F-30 qualification head; contains `dev` and `main`) · Product server: `root npm run dev` → `localhost:5173` (production baseline verified `origin/main 23921342`)

## Scope actually inspected

Real product driven end to end this session: full public route sweep (24 routes), two fresh preview registrations (learner + teacher) through register → email-verification → onboarding → workspace, workspace route map with every landing/error/empty state, unknown-area 404, and source-level tracing of every verified defect.

## Public route sweep (browser DOM metrics at load, 0 console errors)

| Route | h1 | overflow(px) | forms | notes |
| --- | --- | --- | --- | --- |
| / | 1 | 0 | 0 | rotating persona h1 law from F-31 verified live |
| /student /teacher /parent /professional /how-it-works /organization | 1 each | 0 | 0 | persona chapter pages render per approved composition |
| /help /download /about /pricing /research /community /contact /partners /updates /referral /safety /privacy /terms /security /accessibility /cookies | 1 each | 0 | 1-2 where expected | all rightsized |
| /careers | **2 (pre-fix)** | 0 | 2 | FAP-71 — two identical h1s from the responsive HeroCard pair (CareersPage.jsx:259/265). Post-fix: exactly 1 |

Every public page carried exactly one h1 except careers (the only response-duplicated hero in the system). Zero document overflow on all 24 routes at the dev-test viewport.

## Internal journeys (fresh preview accounts, fictional fixture data only)

- `t01-chief-1794132939826@visionary.test` — Learner, "Independent learning" → workspace opens Professional modules ("Set a career goal / Career overview") with honest "No hiring assessment or live model is connected" and "Local learning preview" disclosures. Role-aware nav verified: Home Learn Ask Practice Build Career Classes Connections Progress Notifications Personalization Privacy Plans & usage.
- `t01-teacher-1794133213149@visionary.test` — Teacher, "School Teacher" → workspace shows "Welcome back, Teacher." with "Prepare your next lesson / Classroom overview" and role-scoped nav ("Find teaching pages and tools", "Create a class").
- Core surfaces (`/dashboard/learn|ask|practice|build|progress|career`) are lazy-chunk mounted: first direct navigation showed an unbranded "Opening this workspace…" placeholder for ~1–2s in dev, then full role-aware content (Your learning outline / Your learning evidence / Build something of your own / Your next capability). Recorded as FAP-73 (loading-path craft), no content defect.
- Truthful empty states verified live: Classes ("No classes yet — Join with a class code from your teacher"), Connections ("Nothing here yet… your own learning continues independently" + explicit preview boundaires), Plans & usage ("No invoices. This preview has no payment method", family billing honest), Notifications ("No email, push or scheduled delivery is connected").
- Unknown workspace area `/dashboard/unknown-area` → proper 404 route ("could not be found in this application").
- One unreproduced first-run failure: Notifications surfaced the "page needs the latest app files" error screen exactly once immediately after a fresh onboarding; all later attempts clean, zero console errors. Recorded as FAP-74 (deterministic harness task).

## Register/email-verification (preview) finding — FAP-70

The OTP step claims "We sent a 6-digit code to <email>" although preview sends no email (any 6 digits pass `appClient.verifyOtp({email})`, which ignores the code value — src/api/appClient.js:212-233; resend shows a "Code sent" toast with no transport, src/pages/Register.jsx `handleResend`). The preview disclosure exists on the onboarding review step but not on the OTP step. Worth a P1 honesty repair in T08; register→onboarding completion itself works.

## Language truth — FAP-72

Onboarding "Preferred learning language" select lists 14 options (English, Hindi, Bengali + 10 additional languages + "Others") while the served workspace i18n set is en/hi/bn (i18n-audit law) and the F-31 wave removed the footer's false language affordance for exactly this class of claim.

## Governance verified this session

- Live Jira (Frontend AGI Page, FAP): all 68 pre-wave tickets Done; this wave created Epic **FAP-69** + tickets **FAP-70..74** (To Do, parented to FAP-69; FAP-71 in In Progress as the first approved implementation).
- Local `task-executions.json` is stale vs live Jira for the FAP lane (its own header says "Read live Jira before assignment").
- 45 backend/ML KAN tickets remain in Testing (not the frontend wave's lane).
- Branch state: `dev` is a stale KAN-45 backend head; `main` is production release history (F-31 insurance contained); the frontend wave works on `beta` (F-30 qualification CONDITIONAL GO at 600a6170; head b0d1538c; reviewer pending program-wide per D-095). Worktrees for this wave therefore branch from verified `origin/beta`, which contains both dev and main; this is recorded as an explicit governance note in the FAP-69 epic and every ticket, per the V6 directive's "confirm from live repository governance" requirement.

## First approved implementation (this commit)

- FAP-71: /careers single-h1 heading law (code + `frontend/tests/careers-heading.test.mjs` + before/after browser evidence below) — implemented by the T01 chief; independent review outstanding per D-095 (reviewer requested: T04 design-systems/type lane).
- Before: `document.querySelectorAll('h1').length === 2` on /careers (identical "Build the future of learning." ×2; hero-desktop + hero-mobile HeroCard variants, CareersPage.jsx:259/265; per-viewport only one is display:block, so the duplication lives in the static DOM, not the per-viewport a11y tree — corrected from the initial ticket wording).
- After: one `<h1 class="sr-only">` at the section level; both card titles become `aria-hidden` presentation `<p>`s marked `data-hero-law="careers"`; the unified h1 role law (apple-typography.css) retags the marker to the identical hero profile, so the visible title computes the same 80px/84px/−1.2px/#1d1d1f as before (base pre-capture). Live evidence: `/careers` h1Count = 1, heading outline `H1[sr-only] → H2 → H3…`, 0 console errors, 0 overflow.
