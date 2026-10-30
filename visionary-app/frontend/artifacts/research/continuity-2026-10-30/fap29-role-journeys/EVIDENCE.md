# FAP-D5 role fixtures + journey sweep — evidence (2026-10-30)

## What was delivered

`scripts/role-journey-sweep.mjs` (`qa:journeys`): relationship-bearing workspace
fixtures for all five roles + a rendered journey sweep over 20 role surfaces.

- **student**: home / learn / ask / progress
- **teacher** (Classroom entity `Physics 9A` seeded): home / classes / prepare / insights
- **parent** (child person + workspace + **active FamilyLink** seeded): home / **child** / reports / notifications
- **professional**: home / career / build / settings
- **organization** (two members seeded): home / **people** / **curriculum** / **analytics**

Per surface: h1 assertion, zero page errors, honest-state capture, and the FAP-30
rendered audit (contrast + 44px) recorded; per-role screenshots committed alongside.

## The 2026-10-20 finding — fixed

"Teacher/parent surfaces respond 'Workspace unavailable' with empty fixtures": with the
valid fixtures, every teacher/parent/org surface renders its real content (classes list
with the seeded classroom, family child view via the active FamilyLink, org people/
curriculum/analytics). Sweep PASS: 20/20 surfaces, h1 + zero page errors + zero contrast
or tap findings after the fixes below.

## Findings the sweep caught and fixed in this lane

1. `.v-home-secondary` doors on every role home rendered `--v-action` on canvas = 4.42:1
   → C1 link token #0066cc (5.24:1 on canvas) per the D-104 link law.
2. Guide preview "About this preview" link was 15px tall → 44px quiet-link geometry.
3. TeacherInsightCard "Open class" control was 20px tall → 44px.
4. `.v-role-class-link` insights-table links were 22px tall → 44px (tap law).

## Honest boundary

The "5 real-user journeys" (hosted, signed-in accounts) need a founder Firebase session —
the sweep proves the local-fixture journeys; the hosted part remains the founder
walkthrough (E2). The Phase-2 audit completion = these receipts + the per-surface
screenshots and journey-receipt.json.
