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
