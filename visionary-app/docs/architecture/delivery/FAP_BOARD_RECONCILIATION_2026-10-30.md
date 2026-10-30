# FAP board reconciliation — 2026-10-30

Scope: the pre-rebuild QA backlog (FAP-1..33) and the implementation epics (FAP-36..40),
reconciled against what is verifiably delivered in the current product at `origin/beta`
`a76c9c41`. Rule: **close only what is verifiably shipped, with a per-ticket mapping
receipt; leave everything else open with an honest note.** No approval was invented:
FAP-35's receipt is implementer-side only (its D-095 separate reviewer is still required),
and FAP-52..56 remain in Testing for the same reason.

## Closed Done (26) — mapping receipts posted per ticket

- **Delivered via the rebuilt chain (verified in product/greps/battery):** FAP-7 (fonts:
  4×128KB GoogleSansFlex subsets preloaded for public; 1.9MB static family deliberately
  isolated to the authed surface — decision recorded in tokens.css), FAP-8 (pricingConfig
  single source), FAP-9 (PageMeta/routeMeta rewrite + LazyImage fetchPriority),
  FAP-10 (#0066cc 4.56:1), FAP-11 (#9AA0A6 retired — grep zero), FAP-12 (D2 44px law),
  FAP-13 (B1 type roles), FAP-14 (B2 floors), FAP-15 (zero generic "Learn more"), FAP-16
  (C1 auth), FAP-17 (A5/B persona modules), FAP-18 (first-paint DOM reveal), FAP-19 (A3
  editorial set), FAP-20 (D2 responsive sweeps), FAP-22 (B3 pricing completeness), FAP-23
  (A2 CTA policy + breadcrumbs), FAP-25 (dashboard h1), FAP-26 (honest empty/unavailable
  states), FAP-32 (A0 baseline freeze).
- **Superseded by the rebuilt chain:** FAP-1..5 (old program epics → FAP-36..40).
- **Epic rollups with all children Done:** FAP-36 (Epic A), FAP-37 (Epic B).

## Left open with notes (13)

- **Founder decisions required:** FAP-6 (AdSense: audit says remove from public pages;
  product copy says "supported by ads at launch"; script still sitewide in index.html —
  monetization call), FAP-24 (domain consolidation visionary.app vs @visionary.org.in),
  FAP-31 (Lighthouse CI — pipeline scope), FAP-33 (i18n program — deliberate
  non-rebuild scope).
- **Genuinely not delivered as written:** FAP-21 (persona chip rail), FAP-27 (workspace
  tools IA), FAP-28 (settings polish specifics), FAP-29 (5 real-user journeys — needs a
  signed-in founder session), FAP-30 (explicit contrast-ratio assertions inside
  design-quality-review.mjs).
- **Open pending acceptance:** FAP-38/39/40 (chain epics C/D/E — children in
  Testing/In Progress), FAP-35 (F1 — implementer-side verification posted; separate
  reviewer required).

## Remaining acceptance path to a clean board

1. D-095 separate reviewer accepts FAP-35, 52, 53, 54, 55, 56 (evidence: review index
   10378, verification receipt 10391, walkthrough evidence in-tree).
2. Founder decisions on FAP-6/24/31/33 (re-scope, delegate, or close).
3. FAP-57 (E2) closes when the chain is accepted; then the production-ready flip.
