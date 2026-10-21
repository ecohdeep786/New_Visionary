# FAP — Frontend QA Jira Backlog (2026-10-20)

Project: **FAP** (board 2): https://visionary-team.atlassian.net/jira/software/projects/FAP/boards/2
Source review: `docs/architecture/reviews/FRONTEND_QA_REVIEW_2026-10-20.md`
Import file (Jira "Import issues from CSV"): `FAP_FRONTEND_QA_JIRA_IMPORT_2026-10-20.csv` (same folder — Issue Type, Summary, Description, Priority, Labels; Epics first, then stories grouped in order).

## Live issues created in FAP (2026-10-20)

All 33 issues created live (5 Epics + 28 Stories, parent-linked, prioritized, labeled). Keys in order:

| Epic | Issues |
| --- | --- |
| FAP-1 Epic A — Launch blockers | FAP-6 A1 AdSense removal · FAP-7 A2 Fonts · FAP-8 A3 Plan parity · FAP-9 A4 Preload/fetchPriority |
| FAP-2 Epic B — Accessibility pass | FAP-10 B1 Blue ≥4.5:1 · FAP-11 B2 #9AA0A6 · FAP-12 B3 44px targets · FAP-13 B4 Headings · FAP-14 B5 Text floor · FAP-15 B6 Link text · FAP-16 B7 Auth hygiene |
| FAP-3 Epic C — Design density | FAP-17 C1 Persona chapters · FAP-18 C2 Reveal policy · FAP-19 C3 Company pages · FAP-20 C4 Mobile compression · FAP-21 C5 Chip rail · FAP-22 C6 Pricing completeness · FAP-23 C7 Nav/breadcrumb · FAP-24 C8 Domain |
| FAP-4 Epic D — Internal polish | FAP-25 D1 h1 semantics · FAP-26 D2 Error states in shell · FAP-27 D3 Workspace IA · FAP-28 D4 Settings polish · FAP-29 D5 Role fixtures + Phase-2 |
| FAP-5 Epic E — QA gates | FAP-30 E1 Harness assertions · FAP-31 E2 Lighthouse CI · FAP-32 E3 Baselines · FAP-33 E4 i18n audit |

## Ordering

Fix order follows risk: **EPIC A (blockers) → EPIC B (a11y system pass) → EPIC C (premium density) → EPIC D (internal shell/IA) → EPIC E (QA gates)**. Within an epic, tasks are sized to a single worktree per task per AGENTS conventions (fresh `<agent>-kan-<n>-<purpose>` branch from `origin/dev`).

---

## EPIC A — Production blockers (FAP-… "Frontend QA: launch blockers")

**FAP-A1 [P0] Remove Google AdSense from all public pages**
- Where: `frontend/index.html:5-7` (meta `google-adsense-account` + `adsbygoogle.js`).
- Why: ads render on `/student`, `/parent`, `/safety` — contradicts `/cookies` claim of no advertising cookies, COPPA/GDPR consent exposure, ~10 third-party requests before paint, not Apple-premium.
- Acceptance: no `googlesyndication`/`doubleclick` request on any public route; `/cookies` copy remains true; network evidence attached to review `FRONTEND_QA_REVIEW_2026-10-20.md`.

**FAP-A2 [P0] Font delivery overhaul (~6.1 MB → ≤ ~300 KB)**
- Where: `frontend/public/fonts/` (3 × 1.86 MB static TTF + 4 × ~120 KB flex TTF), `index.html` preloads (7 preloads).
- Why: every page preloads ~6.1 MB TTF; "preloaded but not used" warnings; perceived performance far below Apple (~60–130 KB per weight).
- Acceptance: WOFF2 subsets (latin + per-script unicode-range for Devanagari/Bengali), ≤ 3 preload entries, font budget on first load ≤ ~300 KB, no unused-preload warnings, visual regression pass on type.

**FAP-A3 [P0] Single source of truth for plan catalog (public pricing vs in-app plans)**
- Where: `/pricing` (Start free ₹0 / Personal ₹249 / Family ₹415 / Institution) vs `/dashboard/subscription` (Free / Premium ₹299 / Family ₹499, different features).
- Why: payer-facing inconsistency; Razorpay checkout inherits it.
- Acceptance: shared plan catalog module; both surfaces render identical names/prices/features; demo mode shows production catalog.

**FAP-A4 [P1] Fix PageMeta preload invalid-`href` warnings + `fetchPriority` warning**
- Where: `frontend/src/lib/PageMeta.jsx` `upsertPreload` (sets `imagesrcset`/`imagesizes` without `href` → Chromium "invalid href value" ×2 per page); `NewPersona.jsx` `fetchPriority` (React 18 unsupported prop).
- Acceptance: zero preload warnings in console on all 25 public routes; no React unknown-prop warning; upgrade to React 19 tracked separately.

## EPIC B — Accessibility system pass (WCAG AA, Apple 44px)

**FAP-B1 [P1] Interaction-blue token ≥ 4.5:1**
- `#4285F4` on white = 3.59:1; used for text links/breadcrumbs/legal on white across all pages.
- Fix: introduce `--link-on-light: #0B57D2` (6.4:1) for on-white text; keep `#4285F4` for fills/on-dark. Update `LandingNav`, `LandingFooter`, breadcrumb, auth buttons.

**FAP-B2 [P1] Kill `#9AA0A6` for informative text (2.68:1)**
- Breadcrumb chevron `›` and muted labels → use slate `#5f6368` (6.0:1) for informative text; `#9AA0A6` only for dividers/disabled/decorative.

**FAP-B3 [P1] 44px minimum touch-target program**
- Evidence: nav items 40px (25/25 marketing pages across all 7 widths), logo 28px, footer links 28px (5-column nav), persona chips 20–22px, carousel dots 8×8 (CSS pseudo hit-area patchwork), careers side rail icons <44.
- Fix: one utility/pattern for hit areas (padding-based ≥44px), applied in `LandingNav`, `LandingFooter`, `NewPersona` chips, dots, side rails.

**FAP-B4 [P1] Heading hierarchy repair + clean H1s**
- Fixes: footer column labels derived headings (h2→h4 chains on `/`, `/community`, `/contact`, `/partners`, `/privacy`, `/terms`), `/how-it-works` h1→h3; home rotating H1 concatenates persona variants; `/student` H1 concatenates two headlines (aria-hidden alternate).

**FAP-B5 [P1] Text-size floor (no 12px meaning-carrying text)**
- Smallest text = 12px (chips like "Primary" in dark chapters, auth legal rows). Floor at 14px for informative text; 12px only for true legal lines meeting contrast.

**FAP-B6 [P2] Descriptive link text**
- "Learn more" ×N → `/how-it-works` repeated on multiple cards; svg-only links. Descriptive text or `aria-label` per instance.

**FAP-B7 [P1] Auth forms hygiene**
- Per-route titles ("Sign in | Visionary", …), `autoComplete` on all inputs, soften unavailability state (no red banner before interaction; info tone + retry), 12px legal links contrast verified from B1/B5.

## EPIC C — Premium design density (Apple-bar marketing pages)

**FAP-C1 [P1] Persona chapter density program (5 pages)**
- The centerpiece dark chapter on `/student` is 3,550px holding ~1,060 chars (4 text blocks + constellation). Same pattern on `/teacher`, `/parent`, `/professional`, `/organization`.
- Do: 2–3 large product visuals (real UI mockups of Learn/Ask/Practice/Build states) per chapter, capability rows beside copy, compress chapter to ~1,800–2,200px. This is the headline gap vs Apple.

**FAP-C2 [P1] Reveal policy: content in first-paint DOM**
- Scroll-reveal leaves mid-page bands invisible in full-page captures/print/no-JS and fast-scroll; `/safety`/`/partners`/`/referral`/`/updates`/`/about` show 40–90% void bands in captures.
- Do: content always visible in DOM at first paint; reveal only animates (wrapper transform/opacity, sub-second); respects `prefers-reduced-motion`.

**FAP-C3 [P1] Company pages density pass (about, careers, research, partners, referral, updates, safety, community)**
- Replace blank bands with authored sections (stage visualization for About; comparison table for partners; model cards for referral; feed for updates; product-scene anchors for safety). Community card grid is the reference pattern.

**FAP-C4 [P1] Mobile vertical compression (−35–45% on worst routes)**
- Mobile growth vs desktop: `/pricing` +65%, `/updates` +57%, `/about` +57%, `/safety` +42%. Tighten `py` paddings below 768px, hero min-height 640→~520, cap sticky scenes to one screen; verify at 320/390.

**FAP-C5 [P2] Persona chip rail at small widths**
- 5-chip row wraps ("Organizations" onto line 2 at 390px) → horizontal scroll rail with snap + edge fade; 44px targets (B3).

**FAP-C6 [P1] Pricing completeness**
- Add compare-plans table (post-cards blank band), FAQ block, trust strip (guardian/verification/refund), currency presentation (INR-only today; decide USD/geo display), taxes/VAT note.

**FAP-C7 [P2] Nav CTA + breadcrumb UX policy**
- "Get started" shows/hides inconsistently across scrolled states; define one policy (hidden on landing top; visible on scroll ≥50% hero and on interior pages). Fix `/download` breadcrumb framing (`How it works › Download`).

**FAP-C8 [P2] Domain consolidation**
- Canonical = `visionary.app`; contact emails = `@visionary.org.in`; pick the production domain and align mail + policy text.

## EPIC D — Internal dashboard polish (post-customer surfaces)

**FAP-D1 [P1] Heading semantics per dashboard route (h1 everywhere)**
- Runtime: `home`, `classes`, `practice`, `build`, `notifications` render zero h1/h2; "Welcome back, Ria." is a styled paragraph.

**FAP-D2 [P1] Error/empty states inside the shell**
- `DashboardLayout.jsx:96` "Workspace unavailable" renders outside the shell (raw main, no sidebar/brand). Authored empty/error panel: keep shell, icon + explanation + retry + on-device-data reassurance.

**FAP-D3 [P1] Workspace tools IA: distinct surfaces or removal**
- `/dashboard/prepare` and `/library` render the same surface as Home; ensure distinct reviewed content for prepare/library/reports/growth/career or hide routes/nav until shipped (route-of-truth).

**FAP-D4 [P2] Settings polish**
- Native `<select>`s → styled listbox; trim long disclaimer lines into an info panel; Guide chip clipped at 900px heights (bottom padding).

**FAP-D5 [P1] Role fixtures for full Phase-2 QA (5 real-user journeys)**
- Student/teacher/parent/professional/organization fixtures with valid relationships so `/people`, `/curriculum`, `/analytics`, `/child`, org surfaces can be fully exercised; extend `qa-dashboard-sweep.mjs` to walk all role journeys; then complete the Phase-2 audit and attach evidence.

## EPIC E — QA gates and automation

**FAP-E1 [P1] Extend `design-quality-review.mjs`: contrast + target-size assertions**
- Fold the audited checks (4.5:1 informative text incl. alpha blending, ≥44px hit areas, heading chain) into the existing harness so regressions fail CI.

**FAP-E2 [P1] Lighthouse CI on production build**
- Budget gates: a11y ≥ 0.95, SEO ≥ 0.95, perf (fonts/scripts) budgets from A2; run in prod build, not dev.

**FAP-E3 [P2] Regression baseline set**
- Commit `artifacts/qa-2026-10-20/` sweeps as baseline; screenshot-diff persona/landing key screens on each release; keep device matrix (320/360/390/768/1024/1440/1920) in review evidence.

**FAP-E4 [P2] i18n completeness audit**
- `privacyCopy.js` tri-lingual coverage is partial; decide v1 translated surface list, audit interface strings per page, and define QA exit per locale (en/hi/bn).
