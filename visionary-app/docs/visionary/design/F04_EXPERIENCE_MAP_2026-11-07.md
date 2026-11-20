# F-04 Experience Map — route-by-route purpose architecture and downstream contracts

F-04 (Chief Experience Architecture & Page Journey Engineer) · 2026-11-07 · source beta `0f31094e`
Verified basis: `CTA_TRACE.csv` (118 destination-bearing controls across 37 page-family files, zero dead ends) · live click journeys at 1440/390 (Edge 156.0.4314.58, preview server) · `tests/cta-trace.test.mjs` (5 contract assertions) · persona-review 18/18 · company-review 30/30.

## 1. The journey law (system-level, downstream engineers apply without copying Apple visuals)

1. **One promise per page.** Every public page states its audience-specific promise in the first viewport, in its own voice — no shared hero copy across personas (verified: six distinct rotating-hero headlines) and no cloned company-page voice (research/about/community/careers each distinct).
2. **Primary CTA = the role-correct next step.** Learner-family personas promise "Start … free" and deliver `/register`; the organization persona promises "Talk to us" and delivers `/contact` (B2B path); every persona pairs a secondary "See how it works" → `/how-it-works`. The pair is the shared `CtaPair` (ctaTo default `/register`, secondaryTo default `/how-it-works` in `NewPersona.jsx`) — downstream engineers must not fork this pairing.
3. **No dead ends.** Every `to`/`href` on a public family resolves to a declared route, alias, external link, or contact scheme (machine-verified; regression test keeps it true).
4. **Truthful availability.** Pricing/download distinguish available (web, "Open Visionary") from planned ("Coming soon — not available yet"); language claims stay "English, Hindi & Bengali"; contact schemes use the live `visionary.org.in` identity.
5. **Trust pages disclose, not assure.** Privacy/safety/security/accessibility/cookies expose real choices (rights, requests, controls) and a real contact — never ungrounded guarantees.

## 2. Purpose matrix (audience · problem · promise · proof · primary CTA · follow-through)

| Route | Audience | Problem | Promise (first-screen voice) | Proof pattern | Primary CTA | Follow-through |
|---|---|---|---|---|---|---|
| `/` | every visitor | which Visionary is for me | one intelligence, every learner | persona doors, how-it-works door | Start (persona default) / persona cards | persona → register; how-it-works |
| `/student` | learners | study that adapts | "Learning, to master, to build." | pace/language/depth evidence | Start learning free → `/register` | register → onboarding → student workspace |
| `/teacher` | teachers | prepare + teach in control | "Teaching, to grow, to reach." | assists-not-replaces evidence | Start teaching free → `/register` | same, teacher workspace |
| `/parent` | parents/guardians | see and help | "Parenting, to see, to help." | plain-language progress | Start free → `/register` | family workspace |
| `/professional` | professionals | apply skills | "Building, to apply, to grow." | portfolio evidence | Start building free → `/register` | professional workspace |
| `/organization` | institutions | scale teaching | "Leading, to scale, to last." | institution controls | Talk to us → `/contact` | contact (human follow-up), not self-serve |
| `/how-it-works` | evaluators | how does it actually work | staged explanation | demonstration structure | explore → register/pricing doors | pricing, personas |
| `/pricing` | decision makers | what does it cost | simple plans, free start | plan cards, FAQ schema | Start → `/register` | register → onboarding → subscription |
| `/download` | multi-device users | where do I get it | web now, native planned | "Open Visionary" + "Coming soon" | Open Visionary (web) | app usage; native waitlist honesty |
| `/about` | evaluators | who builds this | "Understanding. Built in." | founder, one-flow story | how-it-works door | research, contact |
| `/research` | researchers | what is the actual work | "Building the mentor intelligence." | published studies register | Read the latest → how-it-works | no shipped-model overclaim |
| `/community` | learners | learning together | communities and programs | program catalog | Join → register | community features |
| `/careers` | candidates | work here | "Build the future of learning." | no public roles honesty | introduce → contact | contact |
| `/help` | stuck users | get help | Help Center | answers + contact | contact door | contact |
| `/contact` | everyone | reach a human | talk to us | real form/schemes | contact schemes (live identity) | human reply |
| `/partners` | organizations | partner | partnership enquiry | enquiry door | contact | contact |
| `/updates` | returning users | what changed | product news | release register | explore doors | product surfaces |
| `/referral` | advocates | share Visionary | standard sign-up share | untracked honesty | sign-up door | register |
| `/privacy` `/terms` `/cookies` `/safety` `/security` `/accessibility` | everyone | trust + rights | plain-language policy | real controls, contact | contact schemes | rights requests |
| `/login` `/register` `/forgot-*` `/reset-password` `/auth/action` | returning/new users | account access | sign-in / account creation | — | continue flows | dashboard/onboarding |
| redirects | typed aliases | legacy bookmarks | — | — | `/signin→/login`, `/career→/careers` | target page |

## 3. Defects verified this wave — and their state

- **CTA dead ends: none.** 118 controls traced; classes: 80 internal-route, 21 internal-anchor, 17 contact-scheme.
- **Persona journey: verified live** (S01/S02): four learner personas → `/register`; organization → `/contact`; secondary → `/how-it-works` from every persona.
- **Honesty surfaces: verified live** (S03/S04/S05): research carries no shipped-capability overclaim; pricing states "English, Hindi & Bengali" (no "20+ languages"); download keeps the native "Coming soon" disclosure beside the live web door; trust pages expose rights/choices + live-identity contacts.
- No in-scope IA defect required a source change in this wave — the recorded corrections stand (F-01 deep-link recovery, F-31 truthful claims), and the new regression suite (`tests/cta-trace.test.mjs`) makes the architecture a contract instead of an audit.

## 4. Downstream contracts (F-05+ apply these without re-litigating)

- **CTA pairing:** `CtaPair` via `NewPersona` props (`ctaTo`, `ctaLabel`, `secondaryTo`, `secondaryLabel`) — never hardcode doors in page markup; new persona pages pass the role-specific label and rely on (or explicitly set) the destination.
- **New public page checklist:** add the route in `App.jsx`, an entry in `ROUTE_META` + `SITEMAP_ROUTES` (the route-graph cross-checks enforce meta/sitemap equality), an nav/home door whose destination resolves (CTA trace enforces), and a purpose row in this map.
- **Anchor semantics:** in-page anchors are `route#section` with real section ids (21 verified anchors) — keep `ScrollToTop`'s hash behaviour intact.
- **Language claims:** only the recorded three-language law; changes need product-owner facts (anything else stays BLOCKED_COPY).
- **Contact identity:** `visionary.org.in` schemes only.
- **Design tokens/typography/assets:** unchanged owners (F-05/F-06/F-07); this map fixes structure and truth, not styling.

## 5. Verification receipts

- `CTA_TRACE.csv` + persona/company review evidence: `docs/visionary/baseline/f04-experience-map-2026-11-07/`
- Contract regressions: `tests/cta-trace.test.mjs` (5 assertions, all pass)
- Live journey click-traces (1440 + 390, Edge 156.0.4314.58): persona CTA destinations, pricing/download honesty copy, trust contacts — recorded in the F-04 receipt.
