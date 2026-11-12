# Principal frontend review — 2026-11-05 (beta @ 257a8bd5, live dev 4197)

Reviewer: senior principal frontend product engineer pass (opencode session), full-product walkthrough.

## Scope walked live

- Public: 24 routes at 1440 + 390 (full-page captures), fap59 public-design audit at 1440/390 (0 doc overflow; the 6 `#main` hits are by-design carousel/bleed artifacts — verified visually on /student@390).
- Auth: /login + /register at 390 — store-grade cards, clean.
- Workspace (Personal · Learner): home, learn, ask, progress, personalization, privacy, subscription, classes, connections, practice, build, notifications — h1 present, zero #main overflow, zero page errors at 1440 AND 390.
- Workspace (Personal · Teacher, added through the real role-add flow): home, prepare, classes, learners, insights, growth, library — all render, zero overflow, zero page errors.

## Fixes delivered by this review

1. Workspace dates format India-first (`src/lib/datetime.js` dateLocale, 19 sites / 16 files) — 'en' resolved to en-US order before; verified live (Progress as-of now 5/11/2026, 12:28 am).
2. FAP-65 icon-weight consolidation (284c4176) and FAP-62 type-role verification receipt (committed earlier this session).
3. FAP-67 upstream patch ledger repair (8c91d610) — verify-imports green repo-wide again.

## Verified-closed follow-ups recorded by earlier receipts

- i18n hi/bn switcher passes: PASS (zero untranslated nodes; receipt ea817e60).
- Multi-role journeys: the app's own role-add flow (switcher → Add a role → Teacher → confirm) creates and activates the teacher workspace end-to-end; teacher surfaces verified above. (The earlier "role-add flow needed" note is resolved — the QA journeys can drive roles through the UI.)

## Not bugs (verified)

- /dashboard/classes and /dashboard/subscription render correctly on deep link and reload (earlier 404 captures were double-slash test artifacts).
- The role-add dialog's adult-confirmation gate behaves per law (ageBand !== adult requires the checkbox).

## Battery state at review close

qa:design, qa:navigation, qa:fonts, qa:taps, qa:motion, qa:continuity, qa:i18n — PASS. Node tests 653/653. Production build exit 0. lint/typecheck clean. npm run check PASS (layout + imports + build).
