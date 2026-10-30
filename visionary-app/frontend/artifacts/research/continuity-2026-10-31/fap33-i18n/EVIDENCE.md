# FAP-E4 i18n completeness audit — evidence (2026-10-31)

## v1 translated surface list (decision)

The **signed-in workspace shell** is the v1 translated surface set (en/hi/bn): Home, Learn,
Ask, Progress, Personalization, Privacy & consent, Notifications, Family (parent), Classes
(teacher), People (organization). **Public landing pages are English by design**
(PRODUCT_SURFACE_AUDIT: "Public pages contain English copy") — a public language switcher
is out of v1 scope and stays footer-only.

## The audit tool

`scripts/i18n-audit.mjs` (`qa:i18n`): renders each v1 surface under en/hi/bn interface
locales (fresh context per locale, session seeded inline) and compares visible leaf text;
a node identical to the en render carrying ≥80% English words across ≥3 words is an
untranslated remnant. Per-locale node counts + a Hindi sample are recorded per surface so
a false zero (collection failure) is detectable.

## Harness finding first, product finding second

The first audit run reported 183 untranslated nodes — **that was my harness bug**: the
hi/bn contexts' seeding never applied the locale, so English renders were compared to
English. After rewriting the seeding to the proven inline pattern, per-locale counts are
equal (en=hi=bn per surface) and the hi samples are real Hindi renders — the flagged
total is a **verified true zero**: the rebuilt product's workspace copy is fully
translated in en/hi/bn across the v1 surfaces (the 2026-10-20 "privacyCopy partial"
finding does not manifest in the rendered product; privacyCopy falls back through the
settings chain which carries complete hi/bn).

## QA exit per locale

- en: native.
- hi: qa:i18n zero flagged + qa:design's Hindi portal typography assertions (leading,
  fonts, portals) PASS.
- bn: qa:i18n zero flagged.
Receipt: i18n-audit-receipt.json (this dir + docs/visionary/baseline/i18n-audit-2026-10-30/).
