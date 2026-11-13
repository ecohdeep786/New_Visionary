# FAP-70 / preview OTP honesty — reviewer-corrector pass (2026-11-13)

Branch `zcode/fap-70-preview-otp-honesty` (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — law DEFECT-FREE

The preview OTP truthfulness law reviewed clean (`fap70-preview-otp-honesty.test.mjs` 3/3):

1. **The preview step never claims an email was sent** — in local preview (auth source ≠ firebase, where no email transport exists) the verification step shows the established disclosure voice: "Local preview — verification is simulated; no email is sent. Any 6-digit code completes signup for <email>." — the fake "We sent a 6-digit code to …" claim is gone from the preview branch.
2. **The Resend control is connected-mode only** — its toast claims "Code sent", which would be another false claim in preview; the control (and the "Didn't receive the code?" line) render in the connected flow only.
3. **The connected Firebase flow is byte-identical** — "Verify your email" copy and Resend unchanged; only the preview branch differs (a minimal-diff truthfulness fix).
4. The step heading is honest in both modes: "Finish creating your account" (preview) vs "Verify your email" (connected).

## Re-integration

Merged `origin/dev`; the surface artifacts conflicted (both sides regenerated) — resolved with a UNION review registry (239 control files covering both sides' new controls: the branch's RoleAreaUnavailable.jsx review + dev's ApprovedPrivacyPolicy.jsx review), then regenerated fresh on the merged tree; authority inventory hash-only; contracts rebuilt.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| FAP-70 law test | `node --test frontend/tests/fap70-preview-otp-honesty.test.mjs` | **3/3 pass** |
| Frontend typecheck + lint | `npm run typecheck && npm run lint` | **exit 0** |
| Frontend battery | `node --test --test-concurrency=2 tests/*.test.mjs` | **783/783 pass** |
| Surface audit | `npm run scope:audit:write` (union registry) | **239 control files, exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live real-user journey (in-app browser, https://visionary.org.in/register, 2026-11-13)

Driven live: the register page renders → "Continue with Email" → the email step renders → continuing reaches the password step (production's current flow). The OTP step itself sits behind the password submit — a credential write, founder-gated as always; production still serves the pre-deploy build (the fake "sent" claim observed live is exactly what this branch removes). The branch's QA evidence carries before/after captures of the OTP step at 1440/390.

## Notes for the reviewer

- The branch carries a large QA-evidence payload (route-sweep screenshots) alongside the small source diff — review `frontend/src/pages/Register.jsx` + the law test for the product change.
- The union-registry resolution pattern applies to every stacked FAP branch merge (both sides add control files); the fresh `scope:audit:write` on the merged tree is the validator.
