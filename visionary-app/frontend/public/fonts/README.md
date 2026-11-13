# Local Google Sans Flex semibold

The original local Regular, Medium and Bold faces remain unchanged. The added `GoogleSansFlex-Semibold.ttf` supplies a true 600 weight for public content. Runtime font loading stays entirely on this application's origin.

Source: the official [Google Fonts repository](https://github.com/google/fonts/tree/a0e3dbcdc3a3ecfafff3f071159ae0221628922d/ofl/googlesansflex), pinned to commit `a0e3dbcdc3a3ecfafff3f071159ae0221628922d`, Google Sans Flex version 4.005 `[3fe7d0b9f]`. The existing local files report this same version. Default Regular outlines were compared to the bundled face before creating the new weight.

License: SIL Open Font License 1.1; the accompanying `GoogleSansFlex-OFL.txt` must ship with the font.

Generation used FontTools `varLib.instancer.instantiateVariableFont` with every axis pinned (weight 600; optical size 18; width 100; grade, roundness and slant 0), then `subset.Subsetter` restricted to the existing Regular face's Unicode coverage. Full name metadata was updated through `updateFontNames=True`; name records and licensing metadata were retained. The result is a static face with `OS/2.usWeightClass = 600`, not a synthetic bold or a variable font falsely declared static.

Instance metadata:

```json
{
  "version": "Version 4.005;[3fe7d0b9f]",
  "axes": {
    "opsz": 18.0,
    "wdth": 100.0,
    "wght": 600,
    "GRAD": 0.0,
    "ROND": 0.0,
    "slnt": 0.0
  },
  "sourceCommit": "a0e3dbcdc3a3ecfafff3f071159ae0221628922d",
  "sha256": "8b11adac519d26808d65064cc0f8533740bcc8377905dbd04741c90bb36d3b6c"
}
```

## F-27 WOFF2 deployment conversion (2026-11-06)

All seven faces are now deployed as WOFF2 (`GoogleSans*.woff2`), converted from the
recorded TTF sources with FontTools `ttLib.woff2 compress` (Brotli). Glyph outlines,
name records and licensing metadata are unchanged — the WOFF2 container is a lossless
recompression, so rendering is identical; only the transfer size changes. Measured:
static Google Sans faces 1,903,204/1,906,032/1,905,536 B → 450,188/508,972/480,728 B
(−73–76%); Flex faces 118–129 KB → 31–35 KB (−73–74%). Total shipped font weight
6.2 MB → 1.6 MB. The TTF sources were removed from the deployed `public/fonts/`
directory after conversion (they were copied verbatim into every `dist/`); this
README records the source pin and generation recipe above for regeneration.
`src/styles/tokens.css`, `index.html` preloads and
`scripts/auth-font-handoff-review.mjs` reference the `.woff2` files.
