# FAP-28 settings polish — evidence (2026-10-30)

- `fap28-settings-before-crop.png` — full settings viewport before the final select fix (Guide appearance still native).
- `fap28-settings-selects.png` — after: all three selects (Teaching language, Interface language, Guide appearance) render the `.v-select` chrome (custom chevron, hover/focus per the system, native combobox role retained); the translation disclaimer renders as a `.v-info-panel` block (Info icon, bordered, canvas bg) instead of a stray muted line.
- Guide chip clipping (2026-10-20 review: "touches viewport bottom at 900px heights"): NOT reproducible in the rebuilt shell — probe at 1280x900 found zero fixed/sticky elements crossing the viewport bottom on /dashboard/guide and /dashboard/settings; the floating Guide chip holds clear bottom clearance (visible in both captures). No code change made for this item; receipt only.
