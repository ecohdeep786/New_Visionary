# Internal responsive design evidence

Continuation on 2026-10-12, with the requested visual, interaction, UX, motion and sound roles. The design contract is [INTERNAL_DESIGN_HANDOFF.md](../../INTERNAL_DESIGN_HANDOFF.md). Only fictional isolated browser profiles were used; user-owned accounts and saved records were not changed.

The final build is identified in `scripts-tmp/internal-design-final-build.txt`. The two browser scripts support `DESIGN_REVIEW_URL` and use the compiled preview at `http://127.0.0.1:4198`. Commands and results are recorded in the current QA/STATUS entries.

| Evidence | What it covers |
| --- | --- |
| `../internal-design-2026-10-11/review-results.json` | 48 light/dark samples: Home, Learn, Build, Progress, Settings, Notifications at 320/390/768/1440 |
| `review-results.json` | Five-role dark Home plus Ask/Prepare/Reports/Career/People at 390/1440; browser errors |
| `<role>-home-large-text.png` | Five role Home views at 390 with root font size 200%; fewer adaptive destinations |
| `<role>-<section>-dark-<width>.png` | Current task/role hierarchy in phone and desktop windows |
| `scripts-tmp/internal-design-final-browser.txt` | Shared viewport matrix, large-text main reflow, keyboard search empty state and sheet dismissal |
| `scripts-tmp/internal-design-role-browser.txt` | Role matrix, skip/main focus, result arrows, Escape focus return, localized shell, offline status, synthetic voice/reduced-motion checks |

The 2026-10-11 directory name is retained from the interrupted first pass; its final captures/results are overwritten by the compiled continuation. Screenshots show the visible viewport; the product scrolls inside `#main`, so they do not represent entire page content.

Voice recognition is stubbed only inside the isolated test browser. The review checks silent panel opening, explicit start, final transcript stopping capture, editable words and live reduced-motion preference. It does not certify device microphones, provider recognition, native speech quality, permissions policy or sound level. Offline events are simulated browser state; this is not certification of an offline install or uncached route loading.

Root font size 200% is a useful reflow check, distinct from actual browser zoom or native Dynamic Type/font scaling. Real TalkBack/VoiceOver, landscape/foldable hardware, low-end-device performance/energy, native-speaker review and owner acceptance remain in the existing frontend worksheet/category ledger.

Earlier development runs found the missing `headShaded` helper in the shared illustration module and a duplicate global/internal skip control. Both defects were corrected. The role script was corrected to use the searchbox role, localized language labels, and no-animation-or-paused semantics under reduced motion. Those failed/incomplete diagnostic runs are not counted as acceptance evidence.

The shared illustration repair restores an undefined primitive; no public landing page source or layout is edited. This does not claim a zero-pixel public comparison, since the pre-repair module crashed while being imported. Concurrent changes in unrelated temporary files are outside this continuation.
