# KAN-162 first baseline — independent hosted verification

Jira/source: KAN-162. Implementer/operator: Codex root agent. Verifier: independent `kan162_review` QA subagent, accepting responsibility for the checks below.
Verified at approximately 2026-10-20 09:53 UTC.
Runtime source: exact main commit `f3cf316edb746ef85a8bfb04f71f29165c54944e`.
Operator helper: reviewed `4de8a33cb223a746c9738dc24554dd8ab812556e`; [exact helper review](KAN162_EXACT_SHA_REVIEW_4DE8A33C.md).
Project/service: `visionary-research` / `174851137514` / `asia-south1` / `visionary-product`.

## Verified outcome

**Passed: first product baseline and public anonymous/security boundaries at its Cloud Run service URL.** This is a scoped hosted receipt, not canonical apex/DNS/TLS, signed-in journey, load, operational rollback or complete launch acceptance.

Independent gcloud read-back shows 100% explicitly pinned traffic to `visionary-product-baseline-f3cf316edb74-mvgi7evq`. The imported production `currentRevision` accepts its exact pin, and `verifyRevision` accepts the full expected source/image/environment/identity/cost contract:

```text
Image: asia-south1-docker.pkg.dev/visionary-research/visionary-product/product@sha256:d7c679901eaa656dd8759291ff0b1d7f736b7006b4feccd154bc29bf9d28cfe2
Source: f3cf316edb746ef85a8bfb04f71f29165c54944e
Runtime: visionary-product-runtime@visionary-research.iam.gserviceaccount.com
Service URL: https://visionary-product-elwsfnkuga-el.a.run.app
Canonical application origin: https://visionary.org.in
Firebase project/auth domain: visionary-research / visionary-research.firebaseapp.com
Firestore database: default
Trusted proxy hops: 2
Secret reference: visionary-product-auth-rate-limit, version 1 (value never accessed)
Billing mode: test
Service/revision maximum: 1 / 1
CPU/memory/concurrency/timeout: 1 / 512 MiB / 20 / 30 seconds
CPU: request-throttled, no startup boost, gen2
Invoker IAM check disabled: true
Ingress at this baseline checkpoint: all
```

## Independent public checks

Executed the reviewed `publicChecks` function using a fetch adapter that maps the canonical request URL to the service URL above. Explicit canonical/forged Origin headers are preserved. Exit 0:

| Boundary | Observed/validated |
| --- | --- |
| `/api/health` | 200 JSON `status:ok`, exact source header and no-store |
| `/login` | 200 HTML and exact source header |
| Anonymous `/api/auth/me` | 401 JSON, exact source header and no-store |
| Anonymous `/api/account/overview` | 401 JSON, exact source header and no-store |
| Unknown `/api/__unknown-release-probe` | 404 JSON, exact source header and no-store |
| `/api/auth/csrf` | 200, bounded 64-hex token and `__Host-visionary-csrf` cookie with Secure/HttpOnly/SameSite=Strict |
| Anonymous onboarding POST, canonical Origin, matching CSRF cookie/token | 401, exact source header and no-store; no account write authorized |
| Same anonymous request with forged Origin | 403, exact source header and no-store |

No authenticated account token, account record, secret value or learner/provider record was read or written by this verifier. The anonymous rejection probes are explicit boundary checks and do not establish an authenticated journey. The source comparison already independently confirmed that runtime/workflow/configuration blobs in main `f3cf316e` equal approved `ad495a66`; only review documents differed.

## Remaining acceptance

DNS was still on former-project `136.110.244.48` at the preceding independent check; new edge address is `34.8.58.39` and its managed apex certificate was provisioning. No request in this report is represented as having reached the new service through actual `https://visionary.org.in`. Canonical DNS/TLS, load-balancer ingress cutover, forged-forwarding-header sanitization, a main-triggered automatic deployment and observed rollback remain pending. Direct service public ingress is the documented temporary baseline state and must be restricted for the canonical edge contract.

The root operator's forthcoming isolated synthetic two-session/account tests, any browser/provider tests and cleanup require their own actual receipts. This verifier has not approved authenticated behavior from anonymous checks. KAN-161/KAN-28 hosted acceptance, KAN-29 source/content work and KAN-145/KAN-146 team testing remain separate. No Jira transition, cloud mutation, merge or new implementation task was performed by the verifier.

Verifier decision: **accepted for the scoped first baseline and anonymous boundary checks above; KAN-162 hosted completion remains pending**. Integration/source evidence and final Jira status are the integrator's responsibility after the remaining gates.
