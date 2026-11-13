# D2 — Responsive & tap-target evidence (FAP-54)

Task: **FAP-54 — public sweep responsive + tap targets ≥44px**. Board: In Progress.
Status: implementation + rendered verification complete; **pending independent review per D-095** (implementer cannot self-approve; reviewer must record the exact reviewed commit before Done).

## Acceptance gates → status

| Gate | Result |
| --- | --- |
| Full public sweep @320/390/768/1024/1440, no horizontal overflow | ✅ 24 routes × 5 widths = **120 rows, 0 overflow combos** (before AND after the fix batch) |
| Tap-target audit, all interactive controls ≥44×44 (union accounting) | ✅ after state: **0 violating rows** (before state: 98 unique sub-44 signatures across ~10 component classes) |
| h9/h10-class small controls on public pages | ✅ replaced raising chips/pills to ≥44 content height (see fix list) |
| Onboarding labels ≥12px | ✅ static law (onboarding JSX pass) green — `qa-taps` includes the label rule |
| Hero stacks verified at 390 | ✅ visible `h1` fits on every route at 320/390 (clipped:false); hidden overlay `h1` variant excluded |
| 200% font sweep re-run | ✅ 18 routes × 320/390 @32px root font — 0 root overflow combos |
| Rendered receipts in this directory | ✅ three JSON ledgers (below) |

## Rendered receipts (in `frontend/artifacts/research/continuity-2026-10-24/d2-responsive/`)

- `d2-sweep-rendered-2026-10-25.json` — **before** fix batch: 120 rows, 0 overflow, 0 dead boots, dpr 1.31, threshold 43.9, full `under44` detail per combo (98 unique signatures).
- `d2-sweep-rendered-2026-10-25-after.json` — **after** fix batch: 120 rows, **0 violations** (no `under44`, no overflow).
- `font-200-hero-390-2026-10-25.json` — 200% root-font pass + hero-stack verification results.

PNG visual captures were **not** obtainable this session: the connected desktop browser window was not visible, and `browser.screenshot` requires a visible desktop window. The JSON ledgers above were measured against real rendered DOM (iframe harness against the production build) and constitute the rendered evidence.

## Harness (important for reproducers)

1. Dev-server harness (vite 5173) proved flaky: cold module waterfall (~105 resources, `main.jsx` 1653ms) made boot settle nondeterministic, and single-file `document.write` boots raced the module map. **Decision: measure against the production build via `vite preview --port 4173`** — single-asset boots (~0.4–1.5s warm) are deterministic.
2. Router context: the iframe is created without `src`; its initially-empty history entry **inherits the parent URL's pathname**, so one top-level `browser.navigate` per route gives every in-page frame the correct SPA route with **no shim** and no `replaceState` (which is what produced the earlier `/organization` ghost-pathname mystery in the dev tab).
3. Ledger: `localStorage['d2sweep']` per origin (survives top-level navigation), rows purged per route before re-measure; flakes retried once per combo (late re-eval + re-boot).
4. Measurement: `dpr = 1.31` ⇒ a css-44px box raw-reads 43.9886 ⇒ **threshold 43.9 on both axes with raw 2-decimal values**; hit-union accounting includes resolved `::after` absolute negative insets; pseudo-union controls (Apple-small dots, bead rows, text links) are legal by union.

## Fix batch (git working tree of this worktree)

Static law `scripts/qa-taps.mjs` green before and after; fixes landed:

1. `components/landing/Breadcrumb.jsx` — crumb links get `relative after:absolute after:-inset-y-3 after:-inset-x-2` (13px ink rows → 44px unions).
2. `components/landing/PolicyTabs.jsx` — legal chips `py-2.5 → py-3` (41 → ≈45px).
3. `pages/landing/{Privacy,Terms,Security,Cookies}Page.jsx` — policy sidebar numbered links `py-2 → py-3` (36 → ≈44.3px); PrivacyPage also unions "Privacy settings"/"Grievance officer" links.
4. `pages/landing/SchoolPage.jsx` (route `/help`) — help chips `py-2 → py-3` (38.5 → ≈46.5px).
5. `pages/landing/CoachingPage.jsx` (route `/how-it-works`) — hero CTA `py-3 → py-3.5` (43 → 47px); story chips `py-2.5 → py-3` (40 → 44px); "See the student page" link unioned.
6. `components/landing/persona/PremiumPersonaSections.jsx` — persona "Learn more" anchor clusters (4 sites) + journey-link + home "See how it works for …" route links get `relative after:absolute after:-inset-y-3 after:-inset-x-2` unions (20.2 → ≈44.2px).
7. `pages/landing/AboutUsPage.jsx` — shared "See how it works" link component unioned.
8. `pages/landing/CommunityPage.jsx` — persona pills `py-2 → py-3` (37 → ≈45px).
9. `pages/landing/ContactPage.jsx` — role pills `py-2.5 → py-3` (40 → 44px); "Privacy policy" text link unioned.
10. `pages/landing/CareersPage.jsx` — section pills `py-2 → py-3` (37 → ≈45px); mailto + accessibility links unioned.
11. `pages/landing/UpdatesPage.jsx` — privacy link unioned.
12. `components/landing/LandingNav.jsx` — `iconBtn` factory gains `shrink-0` (hamburger stop flex-squeeze at 320/390); logo Link gets hit-union `after:-inset-y-2 after:-inset-x-7` (28 → 44px).
13. `pages/landing/CookiesPage.jsx` — pixel-cleaner: `duration-[var(--motion-duration-fast)]` → `[transition-duration:var(--motion-duration-fast)]` (removes Tailwind ambiguity warning).

Earlier in this task (already committed to this branch): Careers icon-Link 32→44px box; Cookies switch outer 44px hit wrapper with unchanged 28×48 visual pill; four dot rows (Persona CarouselDots, PremiumPersona L379, ProgressDots, Partners role-tab strip) upgraded to ≥44 unions.

## Static law

`npm run frontend:qa:taps` → `qa:taps — tap law holds (245 interactive controls in 90 files; 5 pseudo hit-unions ≥44; exceptions: 3)`.
Exceptions registered: unused primitives `ui/carousel.jsx` (2 sites) + `ui/sidebar.jsx` SidebarTrigger (0 imports anywhere on public pages).

## Known follow-ups (not D2 scope)

- `/` carries more than one `h1` (a visible hero one and a hidden overlay variant) — a11y cleanup candidate, not reachable as a D2 tap/overflow defect.
- The subtle static/rendered coverage gap: `qa-taps` did not independently flag the chip classes that the rendered sweep caught; rendered sweep remains the source of truth for D2 verification.

## Process notes (D-095 / founder tension)

- D1 (FAP-53) remains **Testing** awaiting a separate reviewer recording the exact reviewed commit; per the founder-ordered continuous progression, work continues toward D3 while reviews are pending — the implementer never records approval itself.
- Jira FAP-54 stays **In Progress** through the full `npm run check` + merge cycle; progress comments posted live; no Done without review.
