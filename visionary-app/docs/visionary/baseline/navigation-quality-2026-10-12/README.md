# Internal navigation and Home review

D-055 enhances the existing internal product following the founder's Google Skills reference request. Public page source, Google Sans Flex ownership, role policies and local services are preserved. Internal typography remains Google Sans.

## Reference and design choices

Reviewed the actual [Google Skills Paths page](https://www.skills.google/paths?locale=en) and [official navigation guide](https://support.google.com/qwiklabs/answer/11251308?hl=en). `google-skills-reference.png` captures the public, signed-out desktop page on 2026-10-12; it is reference evidence, not a Visionary asset. Its persistent rail, icon selection capsule, prominent search and clear content hierarchy informed this pass. Visionary retains its own learning destinations, illustrations and scope; Google Skills account settings/incentives are not copied.

Implemented:

- Restored the visible desktop search prompt and one-line keyboard shortcut. A more-specific 48px icon-control rule previously defeated the responsive search width.
- Grouped permitted secondary destinations into Workspace tools and Preferences & account, localized in English/Hindi/Bengali. Foundational learners retain Practice/Build in tools. All previous destinations remain reachable.
- Added selected More states in the compact rail and phone bar, including screen-reader current-state semantics. Segment-boundary matching preserves nested destination selection without matching similarly named sections.
- Used full-row selected pills in expanded navigation, icon capsules in phone navigation, and a rounded content surface against the neutral desktop canvas. Colors inherit the existing semantic light/dark palette.
- Moved stage disclosure into Home header context so the next task follows the greeting. Explanations, saved-device status, real recommendations and local-preview disclosure remain.
- Moved the single Guide instance into the topbar DOM: it remains fixed beside desktop navigation but participates in the phone app-bar layout, including large text. Opening still remains silent.

## Verification

`scripts/navigation-quality-review.mjs` runs against isolated fictional profiles. `results.json`, `browser.txt` and screenshots are the final compiled review, served at 4198. They cover all five role Homes at light/dark 320/390/768/1440, five 390px Homes at 200% root text, plus a previously recorded fictional learning fixture at phone/desktop. Checks include document/main reflow, Google Sans inheritance, desktop search label/shortcut width, account groups, selected secondary rail/phone destinations, More expansion/Escape focus, keyboard search and localized group labels. Root font scaling is a reflow approximation, not physical browser zoom certification. Screenshots capture the visible independently scrolling main viewport.

Build, lint, both type configurations, whitespace checks and 20 focused Home/navigation/workspace regressions pass. Command logs are adjacent. Production build: 2227 modules, index-BneJe_h0.js. A first diagnostic exposed the search specificity bug; the corrected production review is the accepted result. Historical reference/previous-pass evidence is preserved. User-owned records and the user's open 5173 browser were not operated on.

Screenshots were visually inspected for desktop hierarchy, phone controls, dark tablet layout and large-text reflow. Physical TalkBack/VoiceOver, actual zoom, representative learner/owner review, populated linked-role acceptance and device performance remain in the existing acceptance worksheet. This pass does not close overall frontend acceptance or certify native Apple/Google parity, backend readiness or measured motivation improvement.
