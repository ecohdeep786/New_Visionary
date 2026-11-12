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

## REVIEWER-PREP pass (2026-11-10, before D-095 review — corrections committed on this branch)

The reviewer-corrector lane reviewed the implementation, corrected two findings, integrated the current dev baseline and re-ran every gate INCLUDING a fresh live run. Commits on `codex/deepseek-kan-49-session-boundary`: corrections `32519817`, dev integration `7625bb1a` (merge of `2e0b1fbb`), data-04 rolling-clock fixup `8bb84374` (byte-identical to the fix carried on the prepared Testing branches).

### Corrections (all in `infrastructure/gcp/`)

1. **`__Host-` cookie contract completed** in `auditCsrfCookiePosture`: `Path=/` is now required and any `Domain=` attribute refuses, per the `__Host-` spec — browsers silently reject the cookie otherwise, which would break CSRF end to end while the old audit passed it (the same gap fixed on the PLAT-04 tool; here the live cookie already carries `Path=/` so the reviewed state passes). Two new refuse tests.
2. **The CSP auth-domain audit is now wildcard-proof**: the check required the reviewed hosts to be *present* but a `connect-src *`, scheme-wildcard (`https:`) or `'unsafe-…'` source would have voided the allowlist and still passed. Sources are now tokenized; a wildcard/scheme-wildcard/unsafe token refuses (the legitimate `'self'` source is tolerated). Three new refuse tests. Unlike the PLAT-04 SPA-leak case this is hardening rather than a dead assertion — the live CSP uses explicit hosts and passes unchanged.

### Gate evidence on this branch (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| Session-audit offline suite | `node --test infrastructure/gcp/tests/session-audit.test.mjs` | **7/7 pass** (incl. the new cookie-contract and CSP-wildcard cases) |
| Full infrastructure suite | `node --test infrastructure/gcp/tests/*.test.mjs` | **37/41 pass**; the 4 refusals are this host's missing Python (`bootstrap.test.mjs`, `product-env.test.mjs`), not code failures |
| Data contracts | `npm run data:check` (disposable loopback PostgreSQL 16 + Java 21 under `nv-tools/`) | **exit 0 — 315/315 across 11 suites**, incl. data-04 invitations 37/37 |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| **LIVE session audit (fresh, post-corrections)** | `node infrastructure/gcp/session-audit.mjs` | **6/6 PASS, exit 0 against https://visionary.org.in on 2026-11-10** — reviewed sign-in methods (email/google/phone) live and attested, `__Host-` cookie with the full posture incl. `Path=/`, invalid-credential session attempt refused 401 with no session/device cookie issued, anonymous boundaries 401 no-store, CSP pinned to the reviewed auth domains, committed cookie contract verified at source |

### Notes for the reviewer

- The real-account sign-in observation, email verification/reset delivery and console provider settings remain founder-gated exactly as the original evidence records; this pass adds no claims there.
- The live run re-executes the same read-only probe set (plus the one garbage-token session refusal probe recorded by the implementer) against the **corrected** tool on 2026-11-10.

## Production verification on 2026-11-12

All seven structural tests and all six external probes passed against production commit `0245176141978bebe1a69907dce9f5cfc0f9bc50`. The session audit now requires a matching, noncacheable CSRF credential, a specific 401 for invalid Firebase credentials, and explicit reviewed CSP sources.

A synthetic Firebase email and password sign-in through the live origin issued both `__Host-visionary-session` and `__Host-visionary-device` with Secure, HttpOnly, SameSite=Strict, and Path=/. Neither cookie had a Domain attribute. The authenticated request read the matching account from Firestore. The test identity and account records were removed. The canonical deployment probe verified proxy header sanitization and release provenance. The production Identity Platform configuration confirmed that `visionary.org.in` and `visionary-research.firebaseapp.com` are authorized and that email/password and phone sign-in are enabled.

Actual verification and password-reset email delivery still need a controlled inbox. The hosted sign-in smoke used an administratively verified synthetic account.
