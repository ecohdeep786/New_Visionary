# Home / Ask design-system handoff

03 · Wave 0.5 · 2026-09-20. Co-sign of the bounded UX_HOME_FLOW enhancement under D-003/D-007; not a global token migration or gate pass.

## Keep / enhance / token equivalent

- **Keep:** DashboardLayout white workspace, current rail/topbar, blue contrast-safe `--v-brand`, existing `v-page`, `v-button`, notices, fields, Guide panels, mobile tabs and Radix dialog behavior. No replacement component library, icons, illustration grammar or global typography.
- **Enhance:** decision Home priority and quiet supporting rows; guided Ask context/intent choices. Existing messages, sessions and activity canvases are not restyled by this slice.
- **Token-equivalent, scoped:** new Home/Ask entry uses Part H ink, info tint, subtle surface and border; 24px priority radius, 4px spacing rhythm, zero tracking and script-aware line height. Blue #1967d2 is retained for readable interactive text and filled controls; the lighter brand swatch is not blindly substituted for contrast-critical usage. Source tokens outside this slice remain unchanged.

## Class API for 04

| Element | Classes / expected semantics |
|---|---|
| Home root | `v-page v-home` inside existing `.visionary-workspace` |
| Header | `v-home-header`, `v-home-eyebrow`, existing `v-title` h1 and `v-muted` description |
| Workspace boundary | `v-home-boundary`, text-labelled badge/row; no icon-only disclosure |
| Main next action | `v-home-priority` on labelled section, h2, paragraph, `v-home-actions` with existing `v-button primary` and optional secondary |
| Reason | `v-home-reason` on native details with summary “Why this?”; source/time text when actually available |
| Supporting modules | `v-home-modules` containing `v-home-module` sections; vertical hierarchy, not a destination-card grid |
| Supporting row | `v-home-row` with content div, `v-home-row-title`, existing `v-muted`, optional existing button/link; no nested whole-row interactive target |
| Honest empty copy | `v-home-empty` |
| Ask entry | `guide-entry`; `guide-entry-title` heading; `guide-entry-label`; `guide-entry-options` wrapping buttons |
| Choice chip | `guide-entry-option` button, `aria-pressed` for selection; visible labels, no selection on hover alone |
| Selected Ask context | `guide-entry-context`, explicit labelled Remove/change control using existing button |

CSS handles 44px targets, wrapping, local focus ring including native summaries, Hindi/Bengali line height and narrow stacked actions/rows. No animations were added. Existing reduced-motion suppression remains. Use semantic sections/headings and real links/buttons; CSS does not provide accessible names or state persistence. Keep all choice/context data service-owned as02 specified.

## Verification and limits

Inspected current stylesheet consumers and Guide/Home route source locations. Changes are additive; new selectors are not yet consumed until04 implementation. No existing selector changed, no public source modified, and no screenshot-equivalence or runtime accessibility claim. 04 supplies before/after captures;05/06 inspect motion/focus;07 performs width/language/state/public-regression checks. Stage adaptation and Part W remain separate tracked requirements.
