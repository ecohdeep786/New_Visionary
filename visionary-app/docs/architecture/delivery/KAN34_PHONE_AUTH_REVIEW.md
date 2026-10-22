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
