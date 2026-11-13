# FAP-83 / public language truth — reviewer-corrector pass (2026-11-13)

Branch `zcode/fap-83-public-language-truth` (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — law DEFECT-FREE

The public-language-truth law reviewed clean (`fap83-public-language-truth.test.mjs` 6/6):

- **Every persona voice dial carries exactly the served set {en, hi, bn}** — the LANGUAGE_CHIPS arrays on all five persona pages (Student/Teacher/Parent/College/Organization) hold the three served codes; no ta/kn/pa entries.
- **Question rows are keyed by served codes only** — no native-script questions for unserved languages.
- **The small print names the three languages** and carries the roadmap line; **no "every language" claim** survives in the section copy or its callers (the scan strips comments so only real copy is judged).
- The defect closed: the deployed product serves exactly en/hi/bn (voice engine en-IN/hi-IN/bn-IN; mentor router en/hi/bn) while the dial advertised six languages and the pages claimed "In every language" — a broken promise at the conversion step.
- **The in-app onboarding list is FAP-72's separate surface** (correctly out of this ticket's scope).

## Re-integration

Merged `origin/dev`; surface artifacts resolved with the UNION review registry (239 control files: branch + dev sides), rebuilt cleanly after a malformed intermediate (the registry is now the clean union) and regenerated fresh on the merged tree; authority inventory hash-only; contracts rebuilt.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| FAP-83 law test | `node --test frontend/tests/fap83-public-language-truth.test.mjs` | **6/6 pass** |
| Frontend battery | `node --test --test-concurrency=2 tests/*.test.mjs` | **776/776 pass** |
| Surface audit | `npm run scope:audit:write` (union registry) | **239 control files, exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live real-user journey (in-app browser, https://visionary.org.in/student, 2026-11-13)

Driven live on the production persona page: the pre-deploy build still carries the false "every language" claim (`everyLanguageClaim: true`, no served-set naming) — exactly the defect this branch removes. Post-deploy the dial names English, Hindi and Bengali with the roadmap line. The branch's QA evidence carries the A/B before/after captures.

## Notes for the reviewer

- The law test strips comments before scanning copy — keep that behavior so the law comment itself never false-positives.
- Composes with FAP-72 (onboarding list) — both surfaces must stay aligned on the served set {en, hi, bn}.
