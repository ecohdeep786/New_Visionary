# Frontend production audit — 2026-10-21

Fresh pass over `frontend/src` on branch `gl/gl-kan-201-apple-type-scale` (type-scale work at
`f1a7573b` preserved). This audit is evidence for the task rebuild in
`FRONTEND_AGI_TASK_REBUILD_2026-10-21.md`; it supersedes no accepted doc except where
values have since been measured against live apple.com.

## Verdict

The public type scale (education/card tiers) is now measured and verified. What separates
the current build from a premium, production-ready surface is **system continuity**: colors,
CTA anatomy, containers, radii and shared primitives still have 2–3 voices. Any page you
land on looks 90% premium; moving between pages you lose the 10% that signals "one system".

## Findings (ranked by user-visible impact)

### F1 — Two color systems on one surface
`system/tokens.js` ships the Google palette (`ink #121317`, `slate #5f6368`, `blue #4285F4`,
`deepBlue #0b57d0`, `track #f1f3f4`, `mist #dadce0`) while the measured Apple roles live in
CSS (`--type-ink #1d1d1f`, `--type-link #0066cc` in `rhythm.css`) and 746 raw hex literals
across `pages/landing/*`. The same page can render #5f6368 body text next to #6e6e73,
#4285F4 accents next to #0066cc links. Premium loses to inconsistency here more than
anywhere else.

### F2 — CTA anatomy drift
Apple pill law (44px, 17px/-0.022em@400, 11×21, radius 980): our persona pills are
`text-[17px] font semibold` — over-weighted; editorial pages use `min-h-12 px-7 text-[15px]`;
Coaching mixes 16px variants; text links vary #0066cc vs #0b57d0 vs #4285F4. No single law exists
in code.

### F3 — Container law bypassed
`rhythm.css` law = 1240/1400/1756 + `--frame-x` gutters; `Landing.jsx` (04-return,
14-suite) runs `max-w-[1265px] px-6 lg:px-[80px]`, DownloadPage `max-[1080px]`, 42 ad-hoc
max-widths (220–1500px) across public pages.

### F4 — Retag debt as "two sources of truth"
`public-bridge.css` rewrites legacy utilities (`h1 48→40/56/64`, `text-[13px]→14px`,
radius collapse). Source stays stale; the truth lives in a rewrite table. New pages inherit
hairline overrides they never asked for (`public-bridge.css` per-page `data-section` seam law).

### F5 — Dead primitive layer
`system/ui.jsx` (16 shared primitives: `PillButton`, `GCard`, `TabBar`…) has **zero
importers**; every page re-implements pills/chips/tabs inline — the exact reason drift exists.

### F6 — Auth/Onboarding is a third system
AuthLayout = `bg-[#f0f2f5]` Material card, `#4285F4` primary pill, `#b3261e` errors,
28px radius; onboarding = `#f7f9fc` canvas, `#0b57d0` continue pill, `text-[10px]` step
labels. Dead flows at Login L265/L291 and Register L303/L329 ("coming soon" mobile stubs)
still render as if functional.

### F7 — Dashboard leaks 2020-era Material
`#4285F4` ×20 + `#dadce0` ×13 remain in Ask/Build/StudentClasses/Subscription/Settings vs
the accepted v-tokens (`--v-action #0b57d2`, ink `#1d1d1f`, `#e2e5eb` borders).
`Subscription.jsx` predates the whole v-system (pure 2024 Google look: `#4285F4`,
`rounded-2xl`).

### F8 — Honesty gaps on public forms (production blockers surface-level)
- PartnersPage enquiry + UpdatesPage signup: client-only forms, no delivery (also tracked
  in PRODUCT_SURFACE_AUDIT as `missing`).
- DownloadPage: five "coming soon" platform actions render as final CTAs.
- CareersPage: "No public roles listed right now." is fine — keep, matches Apple's honest
  empty states.

### F9 — Concrete delta bugs (fix in place)
1. `CoachingPage.jsx` `GreyTag` ≡ `BlueTag` — identical bodies (L95–108).
2. `tailwind.config.js` — two conflicting figma fontSize/fontWeight blocks (second wins silently).
3. `premium.css` — stray comment/indentation nests `.ease-apple` inside a block.
4. Landing 1265px container + 5 bespoke clamps off the measured ladder.
5. Tap targets: `AILearningPage`, `CoachingPage`, `ResearchNewsPage`, `SchoolPage`,
   `UpdatesPage` carry `h-9/h-10` controls (<44px). Onboarding step labels 10px.
6. `Onboarding` bottom nav on phone: Back/Skip/Continue fine, labels tiny.

### F10 — Monolith weight for QA-time confidence
`PremiumPersonaSections.jsx` 68.9KB + `PersonaSections.jsx` 49.1KB + `SpotIllustration.jsx`
61.5KB + `LandingNav.jsx` 33.7KB. Not a user-visible bug (lazy routes), but each refactor
totally changes line numbers; split before the next content-channel work, not after.

## What Apple does that we don't (opportunity list)

1. **No accent in headlines.** Apple ink-only headlines; one blue per page lives in links.
   Our heroes/blue spans (`for students`, promise section) dilute the premium voice.
2. **Weight discipline.** Apple: 600 display / 600 statements / 700 only in VP chapters;
   body 400; buttons 400. We use 600/700 generously in body copy and medium-emphasis titles.
3. **Sentence case eyebrows.** We uppercase several kickers (bridge forces lowercase later).
4. **Value pricing parity row** — Apple's compare tables: hairline-only, 17px, sticky
   columns; our pricing table is close but tiles still shadow on hover (Apple: no shadows on
   light tables).
5. **Radii continuity** — Apple media 12px `clip-path` cards (VP tiles); interactive pills
   980px; overlays 16px. We run 14/20/24/28/30/32 with bridge collapses.
6. **Motion**: one resolve curve (we added `--ease-out-apple`); Apple scroll-drives reveals
   tied to statement; ours still mostly time-based on subpages.
