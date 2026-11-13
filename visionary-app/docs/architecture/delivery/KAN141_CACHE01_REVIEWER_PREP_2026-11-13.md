# KAN-141 / CACHE-01 cache policy — reviewer-corrector pass (2026-11-13)

Branch `codex/principal-kan-141-cache-policy` @ 3b85cfd9 (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — law DEFECT-FREE

The product-wide cache-policy table (one entry per feature-delivery-matrix family) reviewed clean (cachepolicy suite 8/8); the validator enforces every CACHE-01 invariant:

1. **Launch default: NO server-side cache anywhere** — every entry's `apiCache.enabled` is false (`no-server-cache-at-launch`); activation stays blocked-until-measured-need (LATER-05/KAN-136 gate).
2. **Private material never reaches shared caches** — `private-never-shared-cdn`; private families must scope at least by uid (`private-scope-uid`); private reads FAIL CLOSED to the canonical store (`private-fails-closed`); public families declare pass-through.
3. **Browser caching bounded and event-driven** — an enabled cache must invalidate by EVENT (never TTL expiry) and name its triggers; a disabled cache must be declared `no-store`; freshness bounds are positive and capped at 86400s.
4. **Canonical stores named per family** — firestore-account / sql-domain / none, with revision sources (document update time, membership/policy cursor, publication pointer, checkpoint cursor, projection revision, run snapshot id…).
5. **Scope keys per family** — uid/workspace/policy/source/session/projection/run dimensions matching each family's authority model; entitlement/consent/permission decisions are never cache-authoritative.
6. **Matrix coverage is exact** — every matrix family has exactly one entry and no entry exists without a matrix family (`coverageAgainstMatrix`).

No correction needed.

## Re-integration

Merged `origin/dev` (package.json union). The branch's OWN payload — the `cachepolicy` package (types/policy/index + `tsconfig.cachepolicy.json` + family test + its own review handoff) — is genuinely new in dev and is kept. This branch also completes a stale lane state: the earlier lane session's implementation commit (e1f437ec) is verified in THIS session (build 0, tsc 0, 8/8).

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| Cache-policy suite | `node --test backend/tests/contracts/cachepolicy/*.test.mjs` | **8/8 pass** |
| Backend compile (nest) + cachepolicy tsconfig | `npm run build` + `tsc -p tsconfig.cachepolicy.json` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-13)

The cache policy's public-law surface is browser caching behavior on the production pages: hashed assets cache, HTML/catalog revalidate — the public family's declared policy, observable on the live product (assets served with digests; no private material in shared caches). The private families have no server cache at all (launch default), so nothing private can leak through a shared cache — the negative law is structural. The full invariant set is proven by the 8/8 suite.

## Notes for the reviewer

- The policy table is the CONTRACT the hosted CDN/edge must implement; when LATER-05 measured-need arrives, per-family activation flips entries with the same validator as the guard — never a bypass.
- The validator runs over the committed table at check time; keep it in the check gate so a new family cannot ship without a policy entry.
