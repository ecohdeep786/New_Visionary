# F-31 — Chief craft wave: source-confirmed review targets (2026-11-07)

Jira key / source ID: F-31 (Chief Frontend Product Engineer — execution-plan review targets)
Acceptance scope: implementation (five verified fixes) + three assessed/verified targets; no
visual redesign, no approved-asset change
Implementer: Chief Frontend Product Engineer (principal engineer)
Reviewer: pending — independent review required (D-095)
Worker branch / base commit: `zcode/f31-chief-craft` / beta `eed916a7` (F-30 landing)
Owned files: `src/styles/public-system.css`, `src/lib/PageMeta.jsx`, `src/lib/routeMeta.js`,
`src/components/landing/LandingFooter.jsx`, `src/data/pricingConfig.js`,
`src/components/landing/NewPersona.jsx`, regenerated surface inventory, evidence, this receipt.

## Objective and method

The F-01..F-30 program (this operating plan's full 30-task sequence) is executed; the plan's
"source-confirmed review targets" remained the Chief Engineer's open wave. This lane resolved each
target with source + live-browser evidence, fix-only-what-is-verified, preserving approved UI and
assets. Targets investigated against beta `eed916a7`; fixes verified live on the running product
(Vite preview-mode server) before the battery.

## A. Findings and fixes

| # | Target (plan §source-confirmed) | Verdict | Evidence |
| --- | --- | --- | --- |
| T1 | Invalid `background: #rgba(0,102,204,0.10);` in `::selection` (`public-system.css:11`) — the `#` makes the declaration invalid, so the whole rule was dropped by the browser and text selection lost the intended blue | **FIXED** — `rgba(0, 102, 204, 0.10)`; verified: the computed `::selection` rule now applies (`rgba(0, 102, 204, 0.1)`) | live CSSOM read |
| T2 | Canonical/OG origin — rendered `canonical`/`og:url` pointed at `https://visionary.app/`, which **does not resolve (DNS dead)** while the live site is `https://visionary.org.in/` (verified: visionary.app → ENOTFOUND; visionary.org.in serves the product). Canonical pointing at a dead hostname is a P1 SEO defect. D-105 (2026-10-31) recorded web=`visionary.app` but reserved the brand mapping to founder scope; the founder's operating plan directs live = `visionary.org.in` | **FIXED** — `SITE_URL` default and the one remaining hardcoded `routeMeta.js` Organization `url` → `https://visionary.org.in` (2 web-canonical uses remained; all other canonical URLs derive from `SITE_URL`; `@visionary.org.in` email identities untouched per D-105). Verified rendered: canonical + og:url now `https://visionary.org.in/` | DNS probe of both domains; rendered-head read |
| T3 | Footer language selector set `<html lang>` + a `visionary_lang` storage key with **exactly one consumer (the footer itself)** — six locales offered (en/hi/bn/ta/te/mr) while the product supports en/hi/bn; selecting ta/te/mr translated nothing and misdeclared the page language (screen-reader pronunciation hazard) | **FIXED (removed)** — the false-affordance selector, its dead state and the unused `Globe` import removed; `html lang` stays truthfully `en`; real language support (en/hi/bn) lives in onboarding + the workspace where the choice changes content. Verified: selector absent from the rendered footer | grep of `visionary_lang` consumers; live footer |
| T4 | Pricing claimed "All 20+ languages, voice & text" / "20+" per plan — untruthful vs the product's three-language law (teaching interface validates en/hi/bn) | **FIXED** — Premium feature line → "English, Hindi & Bengali — more on the roadmap"; comparison row → "English · Hindi · Bengali" across plans. Verified rendered on /pricing: "Languages · English · Hindi · Bengali", zero "20+" | live /pricing text |
| T5 | Persona `useCycle` (rotating words) had **no reduced-motion handling** while `useCycleStep` did — the auto-cycle kept running for visitors who asked for reduced motion | **FIXED** — `prefers-reduced-motion: reduce` guard in `useCycle` (same law as `useCycleStep`). Verified live: normal motion cycles (headline word order changes over 3 s), reduced motion holds stable | Playwright `reducedMotion: 'reduce'` vs default |
| T6 | Trust pages (privacy/security/terms/cookies/accessibility) share the `hero-stage` brand image; each carries a distinct headline | **ASSESSED — accepted** — differentiation is carried by the per-page message layer (verified five distinct CinematicHero titles); new per-page imagery requires the asset lane (approved assets preserved). No change | source + hero titles |
| T8 | Legacy `Ask.jsx`/`Build.jsx` | **VERIFIED inactive** — zero imports in `App.jsx`; `/dashboard/ask` routes via `DashboardHome`, `/dashboard/build` via `ArtifactStudio`. No action | import trace |
| T9 | `/download` web-now vs native-future explicitness | **VERIFIED already explicit** — "Continue on web" carries the dark primary CTA ("Open Visionary", "Live today · No install"); "Get the app" is the ghost secondary ("Native apps are being prepared… The web is live today"); the platform list marks every native option "Coming soon — not available yet" (intentional-unreleased states) | source + copy |

## B. Surface inventory refresh

The surface-law test failed closed on the first battery run ("Source changed: review the scope and
refresh the inventory") — the documented protocol: `npm run scope:audit:write` regenerated the
inventory from the changed source (controlDeclarations 1657→1651, controlFiles 238→236 — the
removed footer selector's controls). Tests then passed 653/653.

## C. Verification results (this run)

| Check | Result |
| --- | --- |
| lint / typecheck | exit 0 |
| `npm test` | **653/653** (after the documented inventory refresh) |
| build / qa:perf | exit 0; **153 chunks PASS** (deterministic budget, no re-record) |
| qa:taps / qa:motion / qa:continuity | PASS (243/126, 3 exceptions; 439 files; all recorded public-surface laws) |
| `npm run check` | exit 0 |
| Regression suite (`release-regression.mjs` → `f31-chief-craft-2026-11-07/`) | **13/13 harnesses PASS** + **RELEASE GATE PASS 5/5** |
| CWV (production preview) | FCP ~2.5 s, LCP ~3.1–3.5 s, CLS ≤0.068 — consistent with the F-27 post-fix state |

## D. Backend / ML dependencies

None. All changes are frontend copy/CSS/metadata scope.

## E. Remaining issues and risks

- **F-27/F-28-F3 (P2, open)**: landing carousel pager target-size — UI-scoped `ProgressDots` fix
  lane still pending.
- D-105's brand-mapping question is now settled by the founder's operating plan (live =
  `visionary.org.in`); if a future owner re-points the domain, `VITE_SITE_URL` overrides the
  default without a code change.
- The public site remains English-only by truth; the three-language support (en/hi/bn) is real in
  onboarding + the workspace. Any future public translation must arrive with actual content, not a
  selector.

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f31-chief-craft` on `zcode/f31-chief-craft` = beta `eed916a7` +
six verified fixes (public-system.css, PageMeta.jsx, routeMeta.js, LandingFooter.jsx,
pricingConfig.js, NewPersona.jsx) + regenerated surface inventory + evidence
(`docs/visionary/baseline/f31-chief-craft-2026-11-07/`) + this receipt. Junction-based
node_modules runtime arrangement (nothing committed). Worktree removed after the beta landing per
the operator's standing instruction; branch retained pushed for review.

## G. Review handoff

```
Jira key / source ID: F-31
Acceptance scope: implementation (chief craft wave — five verified fixes, three verified no-action targets)
Implementer: Chief Frontend Product Engineer (principal engineer)
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f31-chief-craft / eed916a7 / <receipt commit>
Owned files: src/styles/public-system.css; src/lib/PageMeta.jsx; src/lib/routeMeta.js; src/components/landing/LandingFooter.jsx; src/data/pricingConfig.js; src/components/landing/NewPersona.jsx; docs/architecture/tracking/product-surface.json (+ PRODUCT_SURFACE_AUDIT.md, contracts/product-surface-review.json regenerated); docs/visionary/baseline/f31-chief-craft-2026-11-07/; this receipt
Verification: five fixes verified live in the browser (selection rule, canonical/og, footer, pricing copy, reduced-motion cycle); battery all 10 stages exit 0 (653/653); regression 13/13 + RELEASE GATE PASS 5/5; CWV consistent with F-27
Findings: T1 invalid selection CSS fixed; T2 dead-domain canonical fixed (P1 SEO); T3 false-affordance language selector removed; T4 language claims made truthful; T5 reduced-motion cycle fixed; T6 trust-hero differentiation accepted-with-rationale; T8 legacy routes verified inactive; T9 download explicitness verified
Reviewer decision: pending
Dev integration commit: pending
```
