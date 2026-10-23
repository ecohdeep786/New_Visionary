# KAN-34 phone authentication extension

22 October 2026. Implementer: Codex. Acceptance scope: connected phone sign-in/sign-up plus release verification. Reviewer decision: pending; previous source approval does not cover this extension.

Worker: `codex/codex-kan-34-signin-matrix`, matching task checkout. Accepted dev base: `54fe8e9d6b29af9a84c5cec8a9e130a771e7fb23`. Previous email/Google/global-session implementation `445267487faef036a1b07fa7cb5abd85255f889d` is deployed through main `1ae078dc469846246bb5571717e39a6afe7a402e`; its [sanitized native hosted receipt](evidence/KAN34_HOSTED_AUTH_2026-10-22.json) and [independent base review](../reviews/KAN34_GLOBAL_SESSION_REVIEW_44526748.md) remain bounded to that release.

## Behavior and ownership

Shared login/register phone form supports Indian numbers, Firebase reCAPTCHA/SMS, six-digit confirmation, wrong-code recovery, resend cooldown, number correction and cancellation. The browser retains neither password nor SMS code as durable auth state. Backend verifies the native token, recent auth time, phone provider and matching verified number before creating or restoring the UID-owned account and device session. Existing epoch/cutoff, expiry, CSRF/Origin, mutation binding and rate limits apply. New identities enter onboarding; completed identities resume the same saved setup. The account menu and account-switch recovery identify phone-only accounts by number.

Passwords and password hashes remain exclusively in Firebase Authentication. Firestore stores the canonical UID, identity/profile/onboarding and product session authority. SMS codes and ID/refresh tokens are not account fields. Phone and email/Google accounts are not automatically merged; explicit provider linking is outside this release and the form explains separate-account behavior.

The methods endpoint exposes server availability without user data. The phone option appears only when the server enables it and the origin supports the SDK flow. Real-project localhost is excluded; explicit development demo emulator configuration is supported. Unsupported Apple, Microsoft and organization buttons are absent. Production enables phone admission, permits only the required reCAPTCHA resource paths in CSP and checks actual canonical method availability after promotion.

Owned source: auth frontend/SDK adapter, Firebase product controller/service/profile/admission, production HTTP/CSP, release environment/checks, auth tests and source-surface registry. No database migration, password export, new email sender, ML behavior or landing-page changes.

## Verification

- Backend build and all106 backend tests passed, including disabled/malformed phone admission before account writes, UID reuse, saved setup and no credential fields.
- Root `npm run check` passed: layout/import integrity,18 script checks, source audit, lint, both TypeScript projects,619 frontend tests and production build. Later review-harness isolation/inventory comments and release-smoke method checks retain their own final verification record.
- `node frontend/scripts/phone-auth-review.mjs`:8 actual SDK/Auth Emulator/Nest/memory-store browser scenarios passed. Invalid number, resend cooldown, wrong code/no session, first onboarding, saved setup/introduction/reload, independent desktop peer, global logout denying both peers and fresh returning sign-in. Mobile390x844 and desktop1280x900. This proves no real SMS delivery or live Firestore write.
- `node --test --test-concurrency=2 backend/tests/firebase-product.test.cjs backend/tests/production-http.test.cjs infrastructure/gcp/tests/*.test.mjs`:62 focused tests passed, including27 GCP JavaScript cases. Session/cookie/CSRF and scoped reCAPTCHA CSP boundaries remain enforced.
- Frontend unit regressions cover cancellation before token exchange and duplicate confirmation. All11 email/reset SDK emulator browser scenarios passed after isolating every review tab from external resources; verification, onboarding, introduction, reset/used-link/old-password/new-password, duplicate registration and mobile recovery remain working.

## Release and remaining gates

Independent exact-SHA review, published dev integration and CI precede main promotion. Main alone auto-deploys through the existing GCP workflow. The current policy-aware main image is a valid epoch-enforcing rollback. It predates the methods endpoint and phone admission: rollback hides the phone option and temporarily prevents fresh phone sign-in; account data and already admitted sessions remain intact. Canonical fallback checks use that older contract instead of wrongly requiring the new endpoint. Never fall back to a pre-epoch image after global revocation activation.

Real Firebase configuration read: phone enabled; SMS region allowlist IN. This inventory is not delivery acceptance. A dedicated real Indian number, human CAPTCHA when challenged, SMS receipt/confirmation on the canonical HTTPS origin and same-UID return/cleanup are still required. No full Google/Apple security-equivalence or MFA claim is made.

Custom mail domain verification remains pending; the selected native Firebase email verification-link flow works independently. Previously rejected email-template writes are not claimed applied. KAN-34 stays open until its expanded hosted acceptance is met. KAN-29 remains open for the next founder discussion. Retire completed/unused worktrees only after accepted KAN-34 delivery, preserving required local configuration/evidence and pushed history; create each next task checkout when work starts.

## Independent review repairs (23 October)

Candidate24663e21 was not approved. The independent reviewer reproduced two blockers before any phone merge or deployment:

- A disposed CAPTCHA may never settle its SDK promise, keeping the shared sign-in lock held. Transitions now own their lock and a cancellation promise. Leaving a phone flow immediately settles its caller and releases that operation only; late work still fails generation checks and cannot unlock or sign out a newer identity. Regressions cover an SDK promise that never settles, a subsequent email sign-in, and late phone confirmation while a newer identity is pending.
- A phone-verified identity can carry an unverified linked email. Canonical account email is now populated only from a currently verified Firebase email claim and cleared otherwise, including returning sign-ins. Public profile projection independently enforces verified-email authority after preference fields. A compiled phone-auth-to-billing regression rejects invitation viewing and acceptance for unverified email, permits verified email, then rejects again after verification authority is removed. This preserves the existing email-addressed grant boundary without adding automatic provider linking.

The replacement candidate requires renewed exact-SHA review and CI. Prior619-test results are superseded by621 frontend tests after the cancellation regressions. Hosted SMS remains pending; the founder has supplied a dedicated test number privately, which is excluded from source, evidence and Jira.

Further independent review of4a3a5406 rejected a remaining SDK-current-user race: late cancelled phone confirmation could replace global Firebase currentUser while a new email registration awaited verification. Pending email verification is now bound to the intended SDK user object and captured UID for both registration and unverified-email login. Reload, resend and token exchange use that bound object; adapter consumers no longer consult global currentUser. Two adversarial regressions explicitly mutate simulated SDK currentUser to the cancelled phone identity and verify resend/session still belong to the intended email account. The final expected frontend count is623; renewed full/browser checks and exact-SHA approval remain required.

Final cancellation boundary: only the SDK/CAPTCHA phase is cancellable by leaving the phone form. Once a cookie-changing server exchange is queued, the operation retains ownership until its real result settles. An unmounted form cannot report cancellation while a submitted response still commits Set-Cookie, or admit another identity over that mutation. The held-response/cookie regression passes alongside the never-settling CAPTCHA and late-SDK-identity cases. Final expected frontend count is624; the frozen replacement, full checks, independent exact-SHA decision and live SMS acceptance supersede the earlier candidate checkpoints.


## Frozen candidate verification

Exact source 3bf8aa9862892567d2dbed44d6d838a2d33bf98b: all624 frontend,107 backend,18 script and27 GCP tests pass; full rootcheck, Firebase-mode build25.86s and all8 phone plus11 email/reset SDK/emulator browser cases pass. [Source CI](https://github.com/ecohdeep786/New_Visionary/actions/runs/39908224000) succeeds. [Separate source/rollout decision](../reviews/KAN34_PHONE_AUTH_REVIEW_3BF8AA98.md) is recorded by the reviewer; native hosted SMS is still pending. Review-only and factual evidence updates do not expand source approval to later runtime changes.
