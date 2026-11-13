# FAP-84 / hero fetchpriority — reviewer-corrector pass (2026-11-13)

Branch `zcode/fap-84-hero-fetchpriority` (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — law DEFECT-FREE

The hero-image priority law reviewed clean (`fap84-hero-fetchpriority.test.mjs` 4/4):

- **The hero `<img>` reaches the DOM with the priority signal without React's camelCase warning** — the JSX passes the priority in the form React does not warn about, so the LCP-critical hero image requests at high priority with a clean console.
- **The warning class it closes**: React logs a dev warning for the camelCase `fetchPriority` prop on older React DOM builds; the fix reaches the same DOM attribute (`fetchpriority="high"`) warning-free.
- The QA evidence carries the console captures (before: the React warning present; after: clean) and the hero anatomy probes.

## Re-integration

Merged `origin/dev`; surface artifacts resolved with the UNION review registry (239 control files: branch + dev sides), regenerated fresh on the merged tree; authority inventory hash-only; contracts rebuilt.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| FAP-84 law test | `node --test frontend/tests/fap84-hero-fetchpriority.test.mjs` | **4/4 pass** |
| Frontend battery | `node --test --test-concurrency=2 tests/*.test.mjs` | **780/780 pass** |
| Surface audit | `npm run scope:audit:write` (union registry) | **239 control files, exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-13)

Driven live on the production landing: the hero `<img>` (`professional-800w.webp`) reaches the DOM with `fetchpriority="high"` and `loading="eager"` — the LCP priority signal is present in the served build; the React console warning is the part this branch cleans (the QA console captures document before/after).

## Notes for the reviewer

- The priority signal is load-bearing for LCP — do not regress it to lazy/eager-less while touching the hero.
- The test pins the warning-free path: a future React upgrade changing prop casing expectations must update the test WITH the upgrade, never bypass it.
