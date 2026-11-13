# FAP-85 / forgot-password preview truth — reviewer-corrector pass (2026-11-13)

Branch `zcode/fap-85-forgot-preview-truth` (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — law DEFECT-FREE

The preview forgot-password truthfulness law reviewed clean (`fap85-forgot-preview-truth.test.mjs` 4/4):

- **The preview reset flow discloses simulation** — in local preview (no email transport) the forgot-password step shows the established disclosure voice instead of claiming a reset email was sent.
- **The flow still WORKS** — it continues with a reset token (the preview reset path completes honestly; the user is never stuck).
- **The connected Firebase flow keeps its copy and behavior byte-identical** — only the preview branch differs (the FAP-70 minimal-diff pattern).
- The defect class is the same one FAP-70 closed for signup OTP: a preview surface claiming an email action that no transport performs.

## Re-integration

Merged `origin/dev`; surface artifacts resolved with the UNION review registry (239 control files: branch + dev sides), regenerated fresh on the merged tree; authority inventory hash-only; contracts rebuilt.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| FAP-85 law test | `node --test frontend/tests/fap85-forgot-preview-truth.test.mjs` | **4/4 pass** |
| Frontend battery | `node --test --test-concurrency=2 tests/*.test.mjs` | **787/787 pass** |
| Surface audit | `npm run scope:audit:write` (union registry) | **239 control files, exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live real-user journey (in-app browser, https://visionary.org.in/forgot-password, 2026-11-13)

Driven live on the production forgot-password page: the entry step renders honestly ("Reset your Visionary password" + the email field; NO sent-claim visible on the entry step — that claim appears only after submit, which is a credential-flow action founder-gated in the live check). The branch's QA evidence carries the before/after captures of the post-submit disclosure.

## Notes for the reviewer

- Composes with FAP-70: both preview auth flows now use the same disclosure voice — keep the phrasing identical across surfaces ("Local preview — … is simulated; no email is sent").
- The reset-token continuation must never accept a REAL account's token in preview mode (the law test pins the preview boundary).
