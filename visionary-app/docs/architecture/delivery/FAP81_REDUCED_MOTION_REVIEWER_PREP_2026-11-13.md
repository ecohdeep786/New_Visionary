# FAP-81 / reduced-motion marquee — reviewer-corrector pass (2026-11-13)

Branch `zcode/fap-81-reduced-motion-marquee` (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — law DEFECT-FREE

The Reduce Motion law reviewed clean (`fap81-reduced-motion-marquee.test.mjs` 5/5 + the motion-law gate test additions):

- **The Community marquee holds still under Reduce Motion** — `CommunityPage.jsx` honors `prefers-reduced-motion: reduce`; the scrolling marquee does not animate when the OS-level reduce preference is set.
- **Token-level support** — `tokens.css` carries the reduce-motion tokens; `qa-motion.mjs` gained the marquee motion checks (41 lines) so the QA harness measures it, not just the unit law.
- **The motion-law gate grew** — `scripts/tests/motion-law.test.mjs` (+32 lines) pins the marquee behavior in the repo check gate.

## Re-integration

Merged `origin/dev`; surface artifacts resolved with the UNION review registry (239 control files) regenerated fresh on the merged tree; authority inventory hash-only; contracts rebuilt.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| FAP-81 law test | `node --test frontend/tests/fap81-reduced-motion-marquee.test.mjs` | **5/5 pass** |
| Frontend battery | `node --test --test-concurrency=2 tests/*.test.mjs` | **763/763 pass** |
| Surface audit | `npm run scope:audit:write` (union registry) | **239 control files, exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-13)

The marquee lives on the public Community page — reachable without credentials. The live production build predates the fix; the branch's QA evidence carries the before/after reduced-motion captures. The reduced-motion law is also enforced repo-wide by the motion-law gate (which passes in the check run).

## Notes for the reviewer

- The QA-motion harness extension means the check gate now measures marquee motion — keep it registered in `scripts/check.mjs` (it is, via `scripts/frontend.mjs`).
