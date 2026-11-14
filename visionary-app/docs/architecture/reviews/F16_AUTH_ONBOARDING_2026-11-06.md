# F-16 — Authentication and onboarding UI (2026-11-06)

Jira key / source ID: F-16 (Visionary Frontend Agent task — authentication and onboarding UI)
Acceptance scope: enabler (UI review with three verified fixes authorized; no auth weakening)
Implementer: ZCode agent (Product + Platform Engineers)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f16-auth-ui` / beta `03b60af8` (F-15 landing)
Owned files: `frontend/src/pages/Login.jsx`, `frontend/src/pages/Register.jsx`,
`frontend/src/api/appClient.js` (bounded, store-correct email pre-check + D-064 error codes),
`frontend/scripts/auth-ui-review.mjs` (new harness), evidence directory, inventory digests, this
receipt.

## Objective and method

Review sign-in, registration, recovery, verification, onboarding, role selection and failure
recovery without weakening authentication. New harness
`frontend/scripts/auth-ui-review.mjs` runs 12 live UI checks on Vite dev `127.0.0.1:4198`
(preview repository mode): unknown-email honesty, wrong-password recovery, duplicate-submit guard,
account-switch reset, forgot/reset/action page rendering, invalid-action-code handling, onboarding
draft persistence, and role-selection coverage (all five identities). No credential gate, session
boundary, or server law was touched — every fix is UI/mapping level.

## A. Verified-correct (protect)

| Area | Verified evidence |
| --- | --- |
| Unknown-email honesty | "Couldn't find your Visionary Account. Try a different email or create a new account." renders, staying on /login |
| Wrong-password recovery | Password view retained with the account chip, error banner, password masked, "Forgot password?" door (capture `auth-wrong-password.png`); after F-16-F2 the mapped D-064 message + password-clear apply |
| Duplicate submit | `submitting` ref guard + first-click disabled state; the email step advances exactly once |
| Account switch | "Use a different account" resets fields, signs out to /login; the registered users store persists (re-sign-in works) |
| Recovery pages | /forgot-password ("Reset your Visionary password"), /forgot-user-id ("Find your sign-in email"), /reset-password ("Request a new reset link" for an invalid code), /auth/action all render with h1 and handled states; invalid action code submit produces a handled error, no crash |
| Onboarding drafts | `visionary_onboarding_<id>` draft persists across reload; the wizard resumes; role selection offers all five identities (capture `auth-role-selection.png`) |
| Role selection | Learner/Teacher/Parent/Professional/Organization buttons all present on the identity step |
| Critical navigation | The F-15 release gate's register→OTP→wizard→dashboard journey PASSES with this lane's fixes applied |

## B. Verified defects found and corrected (3)

**F-16-F1 (P2 → fixed): sign-in and registration hung indefinitely offline on the email
pre-check.** Both `Login.jsx` and `Register.jsx` called an unbounded `base44.entities.User.filter`
lookup before showing the password step; in an offline/absent environment the call never settled
(verified live: >60 s hang, the view never advanced). Fixed by consulting the same store the
credential gate verifies against — a read-only `auth.emailRegistered(email)` on the preview
repository (instant, local) — and in firebase mode the flow is unchanged (`return true` → password
step immediately). **No auth weakening**: the password step remains the only credential decision;
the pre-check only routes which local view to show.

**F-16-F2 (P3 → fixed): preview wrong-password errors fell to the generic fallback.** The preview
`loginViaEmailPassword` threw a bare Error, so `isCredentialError` never matched: the UI showed
"Sign-in could not finish" instead of the D-064 mapped message and kept the wrong password in the
field. Fixed: the preview credential error now carries `auth/invalid-credential` — the same
anti-enumeration message and recovery view the firebase path maps ("The email or password is
incorrect. Try again or reset your password." + password cleared).

**F-16-F3 (P3 → fixed): the preview invalid reset-token error lacked its D-064 code.**
`resetPassword` with an unknown token now throws `auth/invalid-action-code` — the page maps it to
"This link is invalid or has already been used. Request a new email." instead of the generic
fallback.

## C. Findings recorded (no action)

**F-16-F4 (P2, law-engine limitation discovered): Vite chunk assignment is nondeterministic
between builds under the current parallel-worker config** — the same source produced
`organizationAuthorCopy.js` split (38.9 KB) in one build and merged into `OrganizationContent.js`
(70.3 KB) in the next, which makes the chunk-level D3 budget law fail-closed on unrelated lanes.
Total payload is stable (861 KB JS gzip, identical to F-15). Re-recorded per the law's protocol on
the final dist; the law owner should consider a totals-level rule or deterministic chunking.

## D. Verification results (final run, this worktree)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout |
| `node scripts/auth-ui-review.mjs` | **PASS — 19 records, 12/12 checks** (recovery, guards, drafts, role coverage), 0 page errors |
| Full battery | **PASS — all 9 stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (17.44 s); qa:perf PASS (137 chunks, 861 KB gzip); qa:taps PASS; qa:motion PASS; qa:continuity PASS |
| `node scripts/release-gate.mjs` | **RELEASE GATE PASS 5/5** — including critical navigation through the corrected flows |
| `npm run check` | exit 0 (layout/import + suite) |

## E. Backend / ML dependencies

None. The firebase-mode sign-in path is untouched (`source === 'firebase'` branches unchanged);
F-02-F1's bring-up dependency still bounds firebase-mode QA runs.

## F. Remaining issues and risks

- F-16-F4 (chunk nondeterminism) will re-surface on future lanes until the law owner picks the
  totals-level rule; re-recording per protocol remains the interim flow.
- The `emailRegistered` pre-check reads the same store as the credential gate in preview mode only;
  firebase mode keeps the real lookup free (server authority unchanged).

## G. Worktree and change summary

`New_Visionary-worktrees/zcode-f16-auth-ui` on `zcode/f16-auth-ui` = beta `03b60af8` + 3 corrected
auth-UI files + harness + evidence + inventory digests + re-recorded perf budget + this receipt.
Junction-based node_modules runtime arrangement (nothing committed). Worktree removed after the
beta landing per the operator's standing instruction; branch retained pushed for review.

## H. Review handoff

```
Jira key / source ID: F-16
Acceptance scope: enabler (auth & onboarding UI review + three fixes)
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f16-auth-ui / 03b60af8 / <receipt commit>
Owned files: frontend/src/pages/Login.jsx; frontend/src/pages/Register.jsx; frontend/src/api/appClient.js;
  frontend/scripts/auth-ui-review.mjs; docs/visionary/baseline/f16-auth-ui-2026-11-06/ (10 PNG + receipt.json);
  frontend/scripts/perf-budget.json (re-record); docs/architecture/tracking/product-surface.json (digest); this receipt
Verification: 12/12 live UI checks PASS; battery all 9 stages exit 0 (653/653); RELEASE GATE PASS 5/5
Findings: F-16-F1 (P2 fixed offline hang), F-16-F2/F3 (P3 fixed error mapping), F-16-F4 (P2 chunk nondeterminism recorded)
Reviewer decision: pending
Dev integration commit: pending
```
