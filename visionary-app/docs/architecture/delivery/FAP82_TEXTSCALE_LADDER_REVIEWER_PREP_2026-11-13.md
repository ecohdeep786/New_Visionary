# FAP-82 / text-scale phone ladder — reviewer-corrector pass (2026-11-13)

Branch `zcode/fap-82-textscale-phone-ladder` (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — law DEFECT-FREE

The display type-ladder law reviewed clean (`fap82-textscale-phone-ladder.test.mjs` 7/7):

- **The defect**: the phone (≤734px) and tablet (≤1068px) display-scale steps were fixed px values — at 200% root text those double while the viewport stays 320–430px, losing functionality (WCAG 1.4.4 Resize text; Apple HIG Layout).
- **The fix**: every display-scale token in the phone/tablet ladder carries a viewport cap `min(<rem step>, <vw>)` in `rhythm.css` + `apple-typography.css` — the type grows with the user's text setting but never exceeds the viewport.
- The QA evidence carries the 200%-text AB comparison, cross-role receipts, and direct-URL route results at the phone viewport.

## Re-integration

Merged `origin/dev`; surface artifacts resolved with the UNION review registry (239 control files: branch + dev sides) regenerated fresh on the merged tree; authority inventory hash-only; contracts rebuilt. (Process note: the union must be built from the MERGE COMMIT's two parents — an earlier attempt used the pre-merge tip and failed.)

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| FAP-82 law test | `node --test frontend/tests/fap82-textscale-phone-ladder.test.mjs` | **7/7 pass** |
| Frontend typecheck + lint | `npm run typecheck && npm run lint` | **exit 0** |
| Frontend battery | `node --test --test-concurrency=2 tests/*.test.mjs` | **770/770 pass** |
| Surface audit | `npm run scope:audit:write` (union registry) | **239 control files, exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-13)

Driven live at a 390px phone viewport with 200% root text on the production landing: **zero horizontal overflow** (scrollWidth = clientWidth = 385px) — the reachable public surface already holds at 200% text. The fixed dashboard display ladder (signed-in, founder-gated) is proven by the 7/7 law test plus the branch's 200%-text QA captures; production still serves the pre-deploy build.

## Notes for the reviewer

- The ladder-parse test is the guard: a new phone/tablet display step without the `min(rem, vw)` cap FAILS the suite.
- The fix is pure CSS tokens — no JS, no hydration risk.
