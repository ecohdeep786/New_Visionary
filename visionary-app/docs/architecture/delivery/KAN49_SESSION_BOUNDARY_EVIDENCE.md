# KAN-49 / PLAT-05 — hosted session/auth boundary evidence (external slice)

Implementer: deepseek lane (senior product engineer agent). This document supplies implementation evidence and requests separate review (D-095); the implementer cannot approve its own work.

## Scope

- Jira key / source ID: KAN-49 / PLAT-05, parent KAN-4 (P02 — product-owned staging and delivery).
- Requirement: prove hosted session cookies, proxy/origin/CSRF behavior, authorized auth domains and chosen real sign-in/verification/reset delivery. Emulator evidence is insufficient for provider acceptance.
- Deliverable: a repeatable read-only **session/auth-boundary audit** (`infrastructure/gcp/session-audit.mjs`) covering every part of the requirement an ordinary client can verify without credentials, plus a source-level check of the committed cookie contract, structural tests and a full live run. Real-account sign-in, email verification/reset delivery and the Firebase console provider settings are **founder-gated remainders** and are not closed by this evidence.
- Worker branch: `codex/deepseek-kan-49-session-boundary`, base `2f8e3f7448efd8b644522a0b82272b22f9aa1dc6` (verified `origin/dev` tip). Candidate: this file's commit (exact SHA in the Jira review comment).
- Live audit executed 2026-11-04 against `https://visionary.org.in`. No real account was created; no email was sent; no production record was written; one invalid-credential session probe (garbage token, refused 401, no cookie) was made.

## What the audit proves (6 checks)

1. **sign-in-methods** — `/api/auth/methods` serves exactly the reviewed live methods (email, google, phone), cache-exempt with revision attestation; extra unreviewed methods refuse.
2. **csrf-cookie-posture** — the CSRF cookie is `__Host-visionary-csrf` with Secure/HttpOnly/SameSite=Strict and a 64-hex token.
3. **invalid-session-refusal** — a session issuance attempt with invalid credentials is refused 401, cache-exempt, and issues **no** session/device cookie (the failure path cannot mint a session).
4. **anonymous-authority-boundaries** — `/api/auth/me` and `/api/account/overview` refuse anonymous callers 401 no-store.
5. **authorized-auth-domains** — the login page CSP connects/frames exactly the reviewed Firebase auth hosts (`identitytoolkit.googleapis.com`, `securetoken.googleapis.com`, `visionary-research.firebaseapp.com`) alongside the reviewed payment/reCAPTCHA hosts; a missing auth host refuses.
6. **session-cookie-contract** (source-level) — the committed `request-authority.ts` keeps the `__Host-visionary-` prefix, `httpOnly`, `Secure` bound to the HTTPS origin, `SameSite=Strict`, and the fail-closed production HTTPS refusal — the exact flags a live session carries.

## Live evidence (2026-11-04, verbatim runner output)

```
PASS sign-in-methods: exactly the reviewed methods live: email, google, phone
PASS csrf-cookie-posture: __Host- prefixed Secure/HttpOnly/SameSite=Strict CSRF cookie
PASS invalid-session-refusal: invalid credentials refused 401 with no session/device cookie issued
PASS anonymous-authority-boundaries: anonymous authority boundaries refuse 401, no-store
PASS authorized-auth-domains: CSP connects/frames exactly the reviewed Firebase auth domains plus the reviewed payment/recaptcha hosts
PASS session-cookie-contract: __Host- prefix, httpOnly, Secure, SameSite=Strict and the production HTTPS refusal are all committed
SESSION AUDIT PASSED: reviewed session/auth boundaries verified externally; real-account delivery acceptance stays founder-gated.
```

Repeat command: `node infrastructure/gcp/session-audit.mjs` (read-only; exit code is the verdict).

## Structural tests

`node --test infrastructure/gcp/tests/session-audit.test.mjs` — **7/7 pass**: positive + refusal cases per check (disabled/extra sign-in method, weak/loose CSRF cookie, session issuance on a refused attempt, accepted invalid credentials, leaking anonymous boundary, missing CSP auth host, broken cookie contract, and the full-audit fail-closed case). Full infrastructure suite counts in the Jira review comment.

## Founder-gated remainders (explicit, not closed by this evidence)

- **Real sign-in with a real account** — observes the actual `__Host-visionary-session`/`-device` issuance on the live origin (test identities are disabled on production; the founder owns account creation).
- **Real email verification / password-reset delivery** — provider-side delivery through the Firebase console/identity platform; the product backend exposes no reset endpoint (verified from source), so delivery acceptance is a provider console action.
- **Firebase console authorized domains** — console setting (`visionary.org.in` authorized; the origin side of that contract is what this audit proves).
- Proxy hop verification against the real edge is the production workflow's forged-forwarding-header deployment probe (`/__deploy-check`), structurally audited in KAN-50 and executed on every main release.

PLAT-06 (Testing, KAN-50), PLAT-07 (Testing, principal lane) and PLAT-08 (founder-gated gcloud) remain separate gates.
