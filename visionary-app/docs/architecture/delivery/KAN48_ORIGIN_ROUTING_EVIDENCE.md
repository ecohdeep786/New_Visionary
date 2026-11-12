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

## REVIEWER-PREP pass (2026-11-10, before D-095 review — corrections committed on this branch)

The reviewer-corrector lane reviewed the implementation, fixed three defects (one dead security assertion, one incomplete cookie contract, one shared-timeout hazard), integrated the current dev baseline and re-ran every gate INCLUDING a fresh live run. Commits on `codex/deepseek-kan-48-origin-routing`: corrections `ef0c9f07`, dev integration `44dccfcd` (merge of `2e0b1fbb`), data-04 rolling-clock fixup `6742209e` (byte-identical to the fix carried on the prepared Testing branches).

### Corrections (all in `infrastructure/gcp/`)

1. **Dead SPA-leak assertion fixed** in `auditDirectOriginBypass`: the html-leak test evaluated `(await response.arrayBuffer()).toString()` — always the string `[object ArrayBuffer]`, never containing the doctest — and the body had already been consumed by `read()`, so a genuine 200-HTML leak through the direct origin would have thrown `body already used` (misleading `probe failed`) instead of the bypass-open refusal. The check only ever appeared to work because the live direct origin answers 404 with an empty body. It now reuses the decoded body and **refuses any doctype-html document through the direct origin even when the revision header is stripped** (fail closed). A new test drives a revision-less SPA shell (refuses — failed on the old code) and the real Google-Frontend empty-404 shape (stays a closed bypass; verified against the live run.app URL before tightening).
2. **`__Host-` cookie contract completed** in `auditCsrfPosture`: `Path=/` is now required and any `Domain=` attribute refuses, per the `__Host-` spec — browsers silently reject the cookie otherwise, which would break CSRF end to end while the old audit passed it. Two new refuse tests.
3. **Per-probe abort budget**: `GET` carried a module-load-time `AbortSignal.timeout(15000)` shared by every probe, so all seven checks shared a single 15-second budget that began at *import*; slow or delayed invocations would fail with instant `AbortError`s. Each probe now creates a fresh signal.

### Gate evidence on this branch (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| Origin-audit offline suite | `node --test infrastructure/gcp/tests/origin-audit.test.mjs` | **8/8 pass** (incl. the new revision-less-leak and cookie-contract cases) |
| Full infrastructure suite | `node --test infrastructure/gcp/tests/*.test.mjs` | **38/42 pass**; the 4 refusals are this host's missing Python (`bootstrap.test.mjs`, `product-env.test.mjs`), not code failures |
| Data contracts | `npm run data:check` (disposable loopback PostgreSQL 16 `nv-tools/pgsql` on 127.0.0.1:5433 + Java 21 `nv-tools/jdk-21.0.13+9-jre`) | **exit 0 — 315/315 across 11 suites**, incl. data-04 invitations 37/37 |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| **LIVE origin audit (fresh, post-corrections)** | `node infrastructure/gcp/origin-audit.mjs` | **7/7 PASS, exit 0 against https://visionary.org.in on 2026-11-10** — revision `23921342fcab…`, hardened header set, API no-store, JSON-404 no-fallback, anonymous 401 without leakage, `__Host-` cookie + forged-origin 403, closed run.app bypass, explicit public asset caching; `TLS: CN=visionary.org.in, issued by Google Trust Services (WR3)` |

### Notes for the reviewer

- The live run is the same read-only ordinary-client probe set as the implementer's 2026-11-04 run, now executed against the **corrected** tool and the newer serving revision (`23921342` = the current release-promotion revision), upgrading the evidence from a pre-correction tool.
- The strict doctype rule was validated against the live direct origin before landing: the real bypass answers `404` with `Content-Length: 0` (no html), so the fail-closed tightening cannot false-refuse the reviewed state.

## Production verification on 2026-11-12

The updated audit passed all eight checks against production commit `0245176141978bebe1a69907dce9f5cfc0f9bc50`. It verifies the TLS certificate chain and hostname through Node, requires an explicit refusal from the direct Cloud Run endpoint, and checks the full public immutable cache policy for hashed assets. The CSRF probe validates the cookie scope without logging the credential. All eight structural tests passed.

Both production load balancer backends have Cloud CDN disabled. Neither backend has a Cloud Armor policy attached. The production protection plan proposes `visionary-product-edge` on `visionary-product-web` and `visionary-product-candidate`, with a per-IP throttle at 600 requests per 60 seconds and HTTP 429 above that limit. Owner review of plan digest `11b7f5870572ba5a8ddbc89903ef5599d7d27818435ee8c64fd179f659b0b6f2`, live attachment verification and separate source review remain pending.
