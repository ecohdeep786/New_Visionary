# Public and product font separation

D-054 on 2026-10-12 follows the founder's clarified typography policy: public frontend Google Sans Flex, internal product Google Sans. [Stylesheet ownership](../../../../frontend/src/styles/README.md) explains the two independent tokens, compatibility alias, product entry/recovery markers and portal inheritance.

`results.json` records the isolated compiled font checks at390/1440: workspace/body/headings/controls, account menus and a body-mounted tooltip; independent public/product token changes; public restoration after single-page navigation; product-entry sign-in/registration/onboarding; and a standalone product recovery marker. FontFace loading metadata records both Google Sans Flex and Google Sans loaded in the test browser. Only an isolated fictional Alex account is used.

`subscription-{390,1440}.png` show the internal page relevant to the open browser context. The script does not inspect or modify the user's actual account. `quality/` contains the learning/Progress reflow and Indic verification rerun with Google Sans, preserving the previous D-053 artifacts. CSS-family checks alone do not certify glyph selection for every script or device.

Reproduce with `scripts/font-surface-review.mjs` against a running dev server, or set `FONT_REVIEW_URL` to a compiled preview. Build/lint/typecheck, nine workspace regressions and browser logs are retained alongside the result JSON. The first extended auth check selected a hidden desktop heading at phone width; the locator was corrected to use the visible heading and that diagnostic is excluded from accepted checks.

Public page layouts/content and domain services are unchanged. Actual font availability still follows the existing provider/fallback behavior; this pass establishes separate primary families and prevents surface inheritance from mixing them.
