# Public-page design audit — 2026-10-31 (Senior Staff Engineer pass)

Founder directive: analyze all public pages against the product rhythm and the Apple
premium bar; the reference set (landing + 5 personas + how-it-works + pricing + download)
reads right, "the rest" reads different. Measured: 24 pages, computed type/spacing/CTA
geometry at 1440 + overflow sweep at 320/390/768/1024/1440.

## Measured findings (full data: design-audit-results.json)

1. **h1 display ladder: uniform 64px/600 everywhere** (landing's 16px read is the
   cycling-hero label element, not the display heading). No convergence needed.
2. **CTA anatomy drift — CONFIRMED**: A2 law = 44px / 17px / 500 / px-21 (reference set
   complies exactly). Drift: about/partners/updates/referral/community/accessibility =
   48px/16px/px-28; how-it-works = 47px/16px; safety = 44px/16px/px-24.
3. **Space rhythm outliers — CONFIRMED**: reference holds median 158px section padding
   (90-158); the rest set ranges 40-232px (balloons and collapses both present).
4. **Fonts: single source everywhere** (Google Sans Flex public tier). No drift.
5. **Device integrity: zero horizontal overflow on 24 pages x 5 widths.** Already at the
   Apple no-compromise bar.
6. Sub-copy tier: 17px uniform (research 18px — normalize).

## Apple reference (apple.com/in/privacy hero)

No kicker; two-part declarative display headline; values-first three-sentence dek in
short center-set lines; cinematic full-bleed imagery (motion-led) rather than decorative
illustration; generous vertical rhythm; understated text-link CTA. Followed by
proof-through-specificity sections.

## Disposition

All findings + per-page hero specs + image prompts (persona-hero art direction) + AC are
filed in **FAP-59** (assigned to the agent). Fix work happens in that ticket's lane; the
gates (continuity/motion/taps/design/lighthouse/journeys/i18n + CI on beta) police it.
