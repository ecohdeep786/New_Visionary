# KAN-48 / PLAT-04 — canonical HTTPS origin, routing boundaries and closed bypass evidence

Implementer: deepseek lane (senior product engineer agent). This document supplies implementation evidence and requests separate review (D-095); the implementer cannot approve its own work.

## Scope

- Jira key / source ID: KAN-48 / PLAT-04, parent KAN-4 (P02 — product-owned staging and delivery).
- Requirement: configure canonical HTTPS origin, TLS, edge/WAF/rate controls and API/static routing. Prove no API-to-SPA fallback, private-response CDN caching or direct-origin bypass.
- Deliverable: a repeatable, **read-only external origin audit** (`infrastructure/gcp/origin-audit.mjs`) that proves the boundaries from an ordinary client without credentials, plus structural tests and a full live run against production. No cloud resource was changed; no deployment was made; the WAF/rate configuration itself is reviewed PLAT-01/Cloud Armor configuration whose live verification by gcloud is founder-gated (same owner-session gate as KAN-47).
- Worker branch: `codex/deepseek-kan-48-origin-routing`, base `2f8e3f7448efd8b644522a0b82272b22f9aa1dc6` (verified `origin/dev` tip). Candidate: this file's commit (exact SHA in the Jira review comment).
- Live audit executed 2026-11-04 against `https://visionary.org.in`.

## What the audit proves (7 external checks, all read-only)

1. **canonical-origin** — the SPA is served over HTTPS with the product's hardened header set (nosniff, DENY framing, HSTS, CSP, referrer policy) and a 40-hex `x-visionary-revision` attestation.
2. **api-cache-policy** — `/api/health`, `/api/auth/me`, `/api/account/overview` respond `Cache-Control: no-store`: private API responses never rest in shared CDN caches.
3. **no-api-fallback** — an unknown API path (`/api/__unknown-release-probe`) returns a JSON 404 with `no-store`; a 200 HTML answer here would be the API-to-SPA fallback, and the audit refuses it.
4. **anonymous-boundaries** — anonymous calls to auth/account surfaces are refused `401` JSON with no identity fields leaked.
5. **csrf-posture** — `/api/auth/csrf` issues a `__Host-`-prefixed Secure/HttpOnly/SameSite=Strict cookie with a 64-hex token, and a forged cross-origin command (`Origin: https://invalid.example`) is refused `403` through the edge.
6. **direct-origin-bypass** — the service's direct `*.run.app` URL serves **no product response** (Google frontend refusal; no revision attestation, no product SPA, no product health): the `internal-and-cloud-load-balancing` ingress cutover holds and the origin cannot be bypassed.
7. **static-asset-caching** — hashed `/assets/*` files declare explicit `public, max-age=31536000, immutable` caching; heuristics-only or private caching refuses.

## Live evidence (2026-11-04, verbatim runner output in the session transcript)

```
PASS canonical-origin: revision 592d47527d2f… with the hardened header set
PASS api-cache-policy: health/auth/account API responses are no-store
PASS no-api-fallback: unknown API paths are JSON 404, no-store, never the SPA
PASS anonymous-boundaries: anonymous callers are refused 401 JSON with no identity fields
PASS csrf-posture: __Host Secure/HttpOnly/Strict cookie; forged cross-origin command refused 403
PASS direct-origin-bypass: direct run.app origin refuses or serves no product response
PASS static-asset-caching: hashed asset caches explicitly (public, max-age=31536000, immutable)
ORIGIN AUDIT PASSED: canonical boundaries, cache policy and closed bypass verified.
TLS: subject=CN=visionary.org.in | issued by issuer=C=US, O=Google Trust Services, CN=WR3
```

- Serving revision at audit time: `592d47527d2fd8d414041aace2393b7c0d7b7898` (current production main head).
- TLS: Google-managed certificate for `visionary.org.in` (Google Trust Services WR3), HTTP/3 advertised by the Google Frontend.
- Repeat command: `node infrastructure/gcp/origin-audit.mjs` (read-only; exit code is the verdict; `VISIONARY_DIRECT_ORIGIN_URL` overrides the bypass target).

## Structural tests

`node --test infrastructure/gcp/tests/origin-audit.test.mjs` — **8/8 pass**: positive + refusal cases per check (missing/short revision, missing hardened header, non-HTML root, cacheable API, SPA fallback on unknown API, identity leakage on 401, weak CSRF cookie, forged origin accepted, open direct-origin bypass with product HTML/JSON, heuristics-only and private asset caching, and the full-audit fail-closed case). Full infrastructure suite counts recorded in the Jira review comment.

## Honest scoping

- The audit proves the boundaries **from outside**; the WAF/Cloud Armor throttle rules and edge configuration are reviewed PLAT-01 configuration whose gcloud-side verification is founder-gated (owner session re-auth), consistent with KAN-47's remainder.
- The boundary contract matches release.mjs `publicChecks` (the production workflow's post-promotion canonical checks); this tool makes the same contract verifiable on demand and adds the direct-origin bypass and asset-cache checks.
- PLAT-05 (hosted cookies with real provider delivery), PLAT-06 (CI release), PLAT-07 (observability), PLAT-08 (backups) remain separate gates.
