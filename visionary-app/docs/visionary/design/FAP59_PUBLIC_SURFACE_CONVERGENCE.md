# FAP-59 public-surface convergence — review handoff (phase 2)

Internal design handoff (D-095). Reviewer: **not yet assigned** — an implementer
cannot approve their own work; a separate reviewer must record the decision on
the exact commit.

```text
Jira key / source ID:            FAP-59
Acceptance scope:                enabler (public-surface design convergence), not a release gate
Implementer:                     Senior Staff Frontend Product Engineer pass (opencode lane)
Reviewer:                        PENDING — must be a different person/agent
Worker branch:                   opencode/fap59-frontend-design
Base commit:                     beta @ 7bad81e1
Candidate head:                  2add5f1b (local; branch not pushed)
Owned files:                     frontend/src/pages/landing/*, frontend/src/components/landing/system/tokens.js,
                                 frontend/scripts/fap59-*.mjs, frontend/artifacts/research/fap59-frontend-design/*,
                                 docs/architecture/tracking/product-surface.json
Prerequisites:                   FAP-59 phase-1 receipt (ef39a74e, merged into beta)

Acceptance criteria -> evidence:
- CTA law defined once, imported everywhere    -> system/tokens.js CTA_LAW; re-declaration count 6 -> 0; tokens.js diff
- Off-law hero pills removed                    -> /help, /updates, /community now A2 law; verification.json CTA 44/17/21
- Sub-copy tier single tier                     -> /research, /about now 17px; verification.json subTier
- No regression to overflow / page errors       -> verification.json: 24 routes x 5 widths, 0 failures, 0 overflow, 0 page errors
- Laws + unit suites still green                 -> npm run check exit 0 (continuity/motion/taps, 54/54 script, 656/656 frontend)
- Rendered product runs and is captured          -> verification/*.png (48), before/*.png (22), EVIDENCE.md

Commands, exit codes, timestamps:
  node scripts/surface-audit.mjs --write            -> exit 0
  npm run check                                     -> exit 0 (54 script / 656 frontend tests)
  node scripts/fap59-browser-verify.mjs             -> exit 0, law failures 0, page errors 0

Remaining defects, limitations and linked open gates:
  - Imagery generation per the FAP-59 prompts is a FOUNDER action (unchanged from phase 1).
    Hero structures already accept generated AVIF/WebP.
  - Not drift, recorded: /how-it-works 47px pill = phone-mock sign-in inside MockShell (device illustration);
    /pricing 14px pill = plan segmented control; policy 12px "pills" = in-page contents rows.
  - No hosted verification; this is a local rendered evidence pass. Not release acceptance.

Reviewer decision:               pending
Verification result:             pending
Jira transition/comment receipt: none (Jira connector unconfigured in this session)
Next dependent task:             founder imagery generation, then review of the exact candidate
```

## Reviewer checklist

1. `git show 2add5f1b --stat` — confirm the change set is the owned files only.
2. `npm run check` from the repo root — expect exit 0.
3. Start the dev server (`npm run dev`), run
   `VERIFY_URL=http://127.0.0.1:5173 VERIFY_OUT=<dir> node frontend/scripts/fap59-browser-verify.mjs`
   — expect `law failures: 0` and `page errors: 0`.
4. Spot-check `frontend/artifacts/research/fap59-frontend-design/verification/*.png`
   against the reference set.

## What phase 2 did not touch

Landing (`/`), the five persona pages, `/how-it-works`, `/pricing`, `/download`,
the nav, the footer and the shared premium modules were left as the phase-1
law. The reference set is byte-identical to `7bad81e1`.
