# Frontend QA Review — 2026-10-20

**Reviewer:** Senior QA agent (Apple-style audit)
**Scope:** Phase 1 — all 30 public frontend routes (25 marketing + 5 auth). Phase 2 first pass — internal dashboard (`/dashboard/*`) surfaces on a seeded fixture.
**Target bar:** Apple-premium marketing pages, Google-product quality (Material guidance, WCAG AA for all interactive text, 44px touch targets, per-device content strategy).
**Evidence:** `visionary-app/frontend/artifacts/qa-2026-10-20/` — technical evidence (screenshots, sweep report JSON, reusable sweeps).
**Jira backlog:** `docs/architecture/delivery/FAP_FRONTEND_QA_JIRA_BACKLOG_2026-10-20.md` (+ CSV import file in the same folder).

---

## 1. Method and evidence

| Instrument | What it covered | Result artifact |
| --- | --- | --- |
| Live Chromium (Edge) pass over every public route | Console errors, DOM structure, meta, fonts, iframes | conversation evidence |
| Lighthouse audit (home) | Accessibility 0.91, Best Practices 1.0, SEO 0.83 | lighthouse report (tab capture) |
| Runtime page auditor (per route) | Contrast math, heading order, tap-target sizes, alt text, overflow, unnamed controls | audit JSON in conversation |
| Playwright device-matrix sweep `qa-responsive-sweep.mjs` | 29 routes × 7 widths (320/360/390/768/1024/1440/1920): horizontal overflow, nav/footer target sizes, doc heights, errors | `evidence/sweep-report.json`, `summary.txt`, overflow-free |
| Playwright internal sweep `qa-dashboard-sweep.mjs` | 25 dashboard routes on seeded student/teacher fixture at 1440px | `evidence/internal/internal-report.json` + 25 screenshots |
| Static inspection | `index.html`, `vite.config.js`, `PageMeta.jsx`, `DashboardLayout.jsx`, font files, OG/sitemap assets | file reads |

Key numbers used below are reproducible with the two sweep scripts committed under `frontend/artifacts/qa-2026-10-20/`.

---

## 2. Verdict

**The foundation is genuinely better than a typical app at this stage.** Design tokens are Apple/Google-grade (ink `#121317`, slate `#5f6368` 6.0:1 on white, mist `#dadce0`, blue `#4285F4`), typography is Google Sans via self-hosted fonts, mobile drawer and hero typography are truly premium, **zero horizontal overflow across 203 device checks**, no broken images, no page errors, complete SEO plumbing (per-route canonical/OG images/`og-student.jpg` etc., sitemap.xml, robots.txt, manifest.json), strong CSP and security headers, and the dashboard shell is a coherent Material-3-style product.

**But it is not production-ready for the stated bar yet.** There are three product-level blockers, a systemic accessibility gap (touch targets, blue-on-white text, heading order), a design-density gap that is the single biggest thing holding persona pages below Apple (huge blank bands, icon-tile-only sections), and internal surfaces with inconsistent copy/plans and an error state that escapes the shell.

Overall: **marketing trust/legal pack ≈ production grade; persona marketing pages + auth polish + internal workspace = strong beta, needs one focused quality cycle.**

---

## 3. Release blockers (P0)

### P0-1 — Google AdSense loads on every public page, contradicting the cookies policy
- `frontend/index.html:5-7` loads `adsbygoogle.js?client=ca-pub-3029364061670569` on **every** route, including `/student`, `/parent`, `/safety`, `/privacy`.
- Network capture confirmed live ad iframes (`pagead2.googlesyndication.com`, doubleclick, "Advertisement" iframe) on `/student`.
- This directly contradicts the `/cookies` page claim of *no advertising cookies* and the premium product positioning, and creates COPPA/GDPR-consent exposure on pages aimed at minors and parents. It also costs ~10 external requests and layout risk before first paint.
- **Change:** remove the meta + script from `index.html`; if monetization is ever planned, gate it server-side behind a plan flag and a real consent flow — never on student/parent/surfaces.

### P0-2 — Font preload ships ~6.1 MB of TTF on every page load
- `public/fonts/`: `GoogleSans-{Regular,Medium,Bold}.ttf` are **~1.86 MB each** (full multi-script statics), plus 4 × ~120 KB `GoogleSansFlex-*.ttf`; `index.html` preloads all 7.
- Chromium warned "*preloaded but not used*" on hero preloads; perceived-performance cost is severe vs Apple (Apple ships one ~60–130 KB WOFF2 subset per weight).
- **Change:** subset to WOFF2 (latin + per-script unicode-range files: Latin, Devanagari, Bengali), preload only the 2–3 files above the fold, drop weight-after-load for the rest. Target ≤ ~300 KB font budget on first load.

### P0-3 — Public pricing vs in-app plans disagree
- Public `/pricing`: Start free ₹0 / Personal ₹249/mo / Family ₹415/mo / Institution.
- Internal `/dashboard/subscription` (demo): Free ₹0 / **Premium ₹299** / **Family ₹499**, different feature lists.
- Same brand showing different plan names/prices in-marketing vs in-product rips trust at the exact moment of paying (and Razorpay checkout inherits it).
- **Change:** single source of truth for plan catalog (names, price, features) consumed by both surfaces; demo mode must render the production catalog.

---

## 4. Accessibility findings (estimated WCAG AA failures with exact values)

| # | Finding | Exact evidence | Fix |
| --- | --- | --- | --- |
| A1 | Link/text blue fails AA on white | `#4285F4` on white ≈ **3.59:1** (needs 4.5). Appears as primary text link "See how it works", "Create account", "Continue with …", breadcrumbs, footer legal | Introduce interaction text token `--link` = `#0B57D2` (6.4:1) for on-white text links; keep `#4285F4` for fills/on-dark; mirrors Google's clickable-text blue |
| A2 | Secondary grey fails badly | `#9AA0A6` on white ≈ **2.68:1** (breadcrumb chevrons and muted text) | Fold into `slate` `#5f6368` (6.0:1); `#9AA0A6` allowed only for dividers/disabled |
| A3 | Touch targets below 44px system-wide | nav items **40px**, logo link **28px**, footer links **28px**, persona chips **20–22px**, carousel dots **8×8** (visual), several 16/22px buttons | Minimum 44×44 hit area (padding + pseudo-inset is currently relied on for dots; make it uniform). Apple nav = 44px; Google = 48dp |
| A4 | Heading order breaks on most pages | Lighthouse `heading-order` fails; runtime found **h2→h4** skips on `/` (footer columns h4), `/community`, `/contact`, `/partners`, `/privacy`, `/terms`, plus **h1→h3** on `/how-it-works` | Footer/section labels → real structure (h3 or non-heading labels); one H1 per page |
| A5 | Rotating H1 concatenates variants | Home H1 reads *"One intelligencefor parents.One intelligence, for students, teachers…"* — persona variants are all inside the H1 | Visible variant only in H1; alternate renders via `aria-hidden` |
| A6 | Persona H1 concatenates two headlines | `/student` H1 = *"Learning,Learning, to master, to build."* | Same pattern fix |
| A7 | 12px labels | Smallest body text **12px** (chips, e.g. "Primary") on dark scenes and legal rows | Floor body/labels at 14px; 12px only for true legal, never for meaning |
| A8 | Ambiguous link text ×N | "Learn more" repeated to `/how-it-works` on multiple cards; svg-only links | Descriptive link text or `aria-label` per instance |
| A9 | Auth pages missing form affordances | No `autoComplete="email"` on forgot-password input; per-route titles missing (all read "Visionary — Learn, Ask, Build") | `autoComplete` on all inputs; per-route `<title>` like "Sign in | Visionary" (matches Google accounts pattern) |
| A10 | Dashboard pages have no H1 | Runtime: `/dashboard/home`, `classes`, `practice`, `build`, `notifications` return **no h1/h2**; "Welcome back, Ria." is a styled paragraph | Page-title elements must be real headings (h1) per dashboard route |
| A11 | Auth shows a red error banner before any user action | "Sign-in is temporarily unavailable" on first visit when backend is down | Distinguish *system unavailable* (softer info state; retry link) from *user error* (red banner after attempt) |

**Not a problem (verified, common false alarms):** gradient headline text (`background-clip: text` with transparent color) triggered ratio-1.0 entries — false positives; `rgba(255,255,255,.6–.7)` on ink passes (7–9:1); blue on dark backgrounds passes (5.2:1) — blue failure is only on white. `#5f6368` slate is compliant.

---

## 5. Design density — the main gap vs Apple

This is the diagnosis to hold onto: **the spacing system is right, but content does not fill the space.** Sections reserve 96–128px vertical padding (correct for premium), yet many sections carry one sentence or one icon tile, so pages read as vacancy instead of confidence.

Measured on `/student` at desktop (`1718×` viewport):
- Total page height **14,388px ≈ 8.3 screens** (within Apple-range) — but the centerpiece dark section is **3,550px tall holding ~1,060 characters** (4 small text blocks + one constellation graphic).
- Sections 2–3: 1,421px / 1,156px tall holding 195 / 477 characters.
- Smallest text on the page: 12px.
- Full-page captures of `/safety`, `/partners`, `/referral`, `/updates`, `/about`, `/careers`, `/research`, `/pricing` show **40–90% blank bands** — partly the scroll-reveal system (content opacity-0 until IntersectionObserver fires; real users see it fine), partly genuinely empty sections.

What Apple/Google do in the same air: chrome-cut product screenshots, live product stills, comparison tables, motion demos, stacked capability rows, color panels, and *real depth per screen* — never an icon tile floating in 700px of white.

### Reveals must never hide content from capture/SEO/print/no-JS
- The scroll-reveal system (opacity 0 → 1) left **entire mid-page bands invisible** in full-page screenshots and print — a real-user *fast-scroll* risk too (content absent if IO doesn't fire before scroll passes it).
- **Change:** content visible by default; reveal *only* animates (transform/opacity 0.001→1 quickly or animate a wrapper that is also the content), full content present in DOM at first paint for capture/print/SEO.

### Per-page design-density work program
1. **Persona pages (`/student` `/teacher` `/parent` `/professional` `/organization`)** — the flagship gap: replace void bands inside each dark "chapter" with 2–3 large product visuals (UI mockups of Learn/Ask/Practice/Build at multiple states) and a co-followed capability row; compress the 3,550px chapter to ~1,800–2,200px with denser content.
2. **`/about`, `/careers`, `/research`, `/partners`, `/community`** — mid-page blank bands; add stage visualization for About (the fan cards render only on reveal), product-shaped tables for research, and partner model comparison rows instead of one accordion.
3. **`/pricing`** — add a compare-plans table (currently plan cards then a blank band), a FAQ block, and a trust strip (refund/guardian/verification badges) — beyond the visible 4 cards.
4. **`/download`** — mostly good; tighten the breadcrumb parent (`Home › How it works › Download` is odd), add device previews so the platform grid feels tangible.
5. **`/help`, `/contact`, trust pages (`/privacy` `/terms` `/security` `/accessibility` `/cookies`)** — already dense and well designed; replicate this density on the marketing pages rather than rework.

---

## 6. Responsiveness and per-device content strategy

**Systemic result of the sweep: no horizontal overflow at any width on any route (203 checks).** Genuinely good. The issues are vertical rhythm and a few component behaviors.

| Route | h @390 | h @1920 | Note |
| --- | --- | --- | --- |
| `/pricing` | 9,178px | 5,579px | **+65% on mobile** — sections don't compress |
| `/updates` | 7,935px | 5,060px | +57% |
| `/about` | 12,987px | 8,268px | +57% |
| `/safety` | 9,784px | 6,904px | +42% |
| `/student` | 12,785px | 14,064px | OK (desktop-chapter long) |

### What to change per device class
1. **Small phones (320–390):** tighten section padding (`py-24/py-32` → `py-10–py-14`), hero min-height 640 → ~520, and set a max one-screen height for sticky scenes; target −35–45% mobile page height on the top offenders above. Keep the beautiful hero type; wrap persona chips in a horizontal scroll rail (currently the 5-chip row wraps "Organizations" onto a second line at 390px).
2. **Tablet (768–1024):** most grids already adapt; enforce 2-col plan grid and sticky sub-nav for the long legal pages; make the 3,550px persona chapter a 2-column layout at ≥768.
3. **Laptop/desktop (1440–1920):** the density program in §5 is *what fills the space*; also ensure the dark chapter gets a machine-styled interior split (copy column + product scene column) which desktop affords.
4. **Nav behavior:** "Get started" CTA appears in the header only in some scrolled states; define one policy — visible CTA on scroll after 50% hero, hidden at top (current behavior is inconsistent across pages; keep hidden on landing top where the hero CTA exists, visible elsewhere).
5. **Auth screens:** current `100svh` split card is right; add `autoComplete`, per-route titles, and small-screen verification (card margins at 320px).
6. **Errors must live in the layout:** internal "Workspace unavailable" renders bare (no shell) — fix covered in §8.

---

## 7. Performance and hygiene

| Item | Finding | Fix |
| --- | --- | --- |
| Fonts | ~6.1 MB preloaded (see P0-2) | Subset WOFF2 + unicode-range + selective preload |
| `<link rel=preload>` invalid href warnings | `PageMeta.jsx` `upsertPreload` sets `imagesrcset`/`imagesizes` without `href` fallback in React 18 → Chromium warns; fires twice per page | Always set `href` (base src) alongside srcset |
| React warning `fetchPriority` | React 18 doesn't support the prop (used in `NewPersona`) | Upgrade to React 19, or drop the prop (preload already marks priority) |
| OG/social assets | All route `og-*.jpg` files exist ✓; canonical per-route ✓ | Keep; ensure `og:image` 1200×630 exact aspect on the shared image |
| Console noise | Preload warnings + fetchPriority + `/api/auth/me` 500 (dev-only without auth server) | Clean warnings; auth degradation handled by "Connecting…" state (fine) |
| Cache/bundles | Dev-transfer numbers unreliable; not a prod verdict | Add Lighthouse CI in prod build (task in backlog) |

---

## 8. Internal dashboard (Phase 2 first pass)

Seeded student fixture on a local-mode server (VITE_AUTH_MODE=local), 1440×900, walked 25 routes.

**Working well:** coherent Material-3-style shell (sidebar IA, Guide button, Ctrl-K search), keyboard-accessible skip links, strong trust page copy in-app ("Sharing is always scoped", "Saved on this device"), plans page with usage framing. `settings` = deepest page (1,442px) with real preference controls.

Findings:
1. **No H1s on workspace pages** (A10) — page titles are styled paragraphs; SR navigation breaks.
2. **"Workspace unavailable" error state escapes the shell** — `DashboardLayout.jsx:96` renders raw `<main class="p-8"><h1>Workspace unavailable</h1>…` with no sidebar/header/brand; looks broken, not authored. Empty/error states need product-grade design (keep shell, centered panel, icon + explanation + retry + "data stays on device" reassurance).
3. **Workspace tools IA duplicates Home** — `/dashboard/prepare` and `/dashboard/library` render the same "Welcome back…" surface as `/dashboard/home`; `/career`, `/reports`, `/growth` need distinct reviewed surfaces or removal from nav/route map until they exist (route-of-truth mismatch).
4. **Plan catalog mismatch** (P0-3 above).
5. **Native `<select>`s on Settings** look non-premium next to the custom system; replace with the styled listbox control.
6. **Guide chip clipped at bottom** on 900px-tall viewports (sidebar chip touches viewport edge without breathing room).
7. **Role surfaces need real fixtures for QA** — teacher pages (`/people`, `/curriculum`, `/analytics`) respond with the unavailable error when relationships/fixtures are empty; the QA harness needs valid teacher/parent fixtures (already in the backlog) to do the full Phase-2 audit of 5-real-user journeys (student, teacher, parent, professional, organization).

---

## 9. Content and trust details worth fixing

- **Domain mismatch:** `canonical` = `visionary.app`, but contact emails are `@visionary.org.in` and the org details mention the `org.in`. Pick the production domain and align mail + policy text.
- **`/download` breadcrumbs** show `Home › How it works › Download` (Download framed under how-it-works in the breadcrumb trail only).
- **All auth page titles** identical; "reset-password" via URL params should not leak state in titles.
- **Safety page honesty is good** ("Tap any claim to see exactly how it works") — mirror that exact honesty level on persona pages using product visuals instead of empty scenes.
- **i18n:** interface copy has a tri-lingual copy layer (en/hi/bn `privacyCopy.js`) but coverage is sparse (a partial phrase list); the language switcher is limited to footer. Decide the v1 surface list for translation and checkmark the full inventory per page.

---

## 10. Route-by-route notes (public)

| Route | Verdict | Notable findings |
| --- | --- | --- |
| `/` home | Strong | h2→h4 skip; H1 concatenation (A5); carousel dots tiny; blue link contrast; nav 40px; preload warnings |
| `/student` `/teacher` `/parent` `/professional` `/organization` | Core gap | Density program §5; H1 concatenation (A6); 12px labels; icon-only sections |
| `/help` | Good | h1→h4 skip; breadcrumb chevron contrast; email link contrast on tinted card |
| `/how-it-works` | Good skeleton | h1→h3/h2→h4 skips; large blank bands between demo blocks |
| `/download` | Good | Breadcrumb framing; needs device previews; platform cards OK |
| `/about` | Sparse | Fan-cards + values sections invisible until reveal; +57% mobile height |
| `/pricing` | OK cards, thin below | no compare table/FAQ; **+65% mobile**; plan consistency |
| `/careers` `/research` | OK tops, void middles | floating side rail targets <44px |
| `/community` | Good | h2→h4 skip; dense card grid is a model to copy |
| `/contact` | Good | h2→h4 skip; domain mismatch; FAQ contrast rows |
| `/partners` `/referral` `/updates` | Thin | large unrendered bands; copy consistency |
| `/safety` | Good copy, sparse layout | **ticker risk:** giant void bands mid-page |
| `/privacy` `/terms` `/security` `/accessibility` `/cookies` | Production-grade | h2→h4 chain; breadcrumb chevrons (A2); **AdSense contradiction with /cookies** |
| `/login` `/register` `/forgot-*` `/reset-password` | Good Google-style | A9 items; error banner on visit; 12px legal links |

## 11. Internal routes (first pass)

`/dashboard/home` (strong shell, no h1), `/learn` (form-only hub), `/practice` `/build` (no h1s), `/subscription` (plan mismatch), `/explore` (topic-driven placeholder), `/support` (good), `/settings` (native selects, long disclaimer), `/profile` `/connections` `/progress` (clean), `/prepare` `/library` (duplicate home), `workspace tools` area (`notifications` no h1, `personalization`/`privacy`/`audit` consistent), teacher surfaces (`unavailable` state design gap).

---

## 12. Recommendation summary — the path to ship

1. **Do the 3 P0s now** (AdSense, fonts, plan parity). None are big builds; all unblock trust/perf/legal claims.
2. **One accessibility pass across the design system** (tokens + target sizes + headings + link text) — most fixes are in shared components (`LandingNav`, `LandingFooter`, breadcrumb, buttons), so the work is concentrated: ~10 component edits fix 11 findings.
3. **One density program on persona pages**: for each of the 5 persona routes, add product visuals to each "chapter" and compress empty bands. This is the difference between "clean beta" and "Apple page."
4. **Reveal policy**: content always in first-paint DOM; reveal only animates. Global change, one hook.
5. **Internal pass shell + semantics + IA**: h1s, error state inside shell, distinct prepare/library surfaces.
6. **QA gates**: extend `design-quality-review.mjs` with contrast and target-size checks; add Lighthouse CI to the prod build; keep the two sweeps in this evidence folder as regression baselines.

Full task breakdown with sizes and acceptance criteria lives in the Jira backlog (`FAP_FRONTEND_QA_JIRA_BACKLOG_2026-10-20.md`).
