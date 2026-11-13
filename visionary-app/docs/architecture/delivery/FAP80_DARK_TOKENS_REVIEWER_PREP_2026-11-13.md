# FAP-80 / dark token coverage — reviewer-corrector pass (2026-11-13)

Branch `zcode/fap-80-dark-token-coverage` @ 7f44f2a2 (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — law DEFECT-FREE

The dark-mode token contract law reviewed clean (`fap80-dark-token-coverage.test.mjs` 7/7):

- **Every hardcoded palette class in the dashboard joins the single dark remap block** in `workspace-design.css` — the test PARSES the remap segment and requires every token covered there (a token missing from the block would keep its light literal in dark mode).
- **The defect it closes**: a `#0b57d2` link at 2.69:1 contrast on the dark surface and a `#dadce0` border — invisible/illegal contrast in dark mode.
- **One allowed exception**, pinned by the test: the image scrim (`bg-[#121317]/40`).
- `CourseViewer.jsx` joins the contract (8-line change); the QA evidence carries light/dark captures of the Learn dialog and topic surfaces at both viewports.

## Re-integration

Merged `origin/dev`; the surface artifacts conflicted — resolved with the UNION review registry (239 control files: branch + dev sides) and regenerated fresh on the merged tree; authority inventory hash-only; contracts rebuilt.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| FAP-80 law test | `node --test frontend/tests/fap80-dark-token-coverage.test.mjs` | **7/7 pass** |
| Frontend typecheck + lint | `npm run typecheck && npm run lint` | **exit 0** |
| Frontend battery | `node --test --test-concurrency=2 tests/*.test.mjs` | **758/758 pass** |
| Surface audit | `npm run scope:audit:write` (union registry) | **239 control files, exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-13)

The dark theme is a signed-in workspace feature (founder-gated credentials); the law is proven by the parse-the-remap test plus the branch's light/dark QA captures (Learn dialog + topic at both viewports). The public marketing surfaces render the default light theme correctly.

## Notes for the reviewer

- The remap-parse test is the guard: a new hardcoded palette class in the dashboard FAILS the suite until it joins the dark block — keep it in the battery.
- The image-scrim exception is pinned; any second exception must be added to the test explicitly, never silently.
