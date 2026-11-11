# KAN-85 / AI-03 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-85-service-identity` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections, stack integration (merge of dev `2e0b1fbb`; package.json scripts unioned — all twenty-four family checks live incl. the domain's own registered gate), data-04 rolling-clock fix (byte-identical).

## Correction — the revocation check was structurally breakable

The service checked revocation by duck-typing an OPTIONAL `isRevoked` cast-off the store interface (`(this.store as {isRevoked?}).isRevoked?.(id)`) — and without awaiting it. Two silent failure directions:

- an adapter **omitting** the optional method → revocation silently skipped → **revoked grants keep working**;
- an adapter returning a **Promise** (async adapter) → the un-awaited Promise is always truthy → **EVERY grant refused**.

`isGrantRevoked(grantId): Promise<boolean>` is now a REQUIRED awaited method on the store interface — an adapter that cannot answer revocation fails compilation, not the security law. SQL adapter law: one SELECT on the revoked flag.

Also: grant ids use `randomUUID` (instance counters collided across service instances).

## Review finding (verified, no further defect)

The identity law reviewed clean otherwise: grants are minted SERVER-SIDE (no HMAC handed to any client; the grant lives in the owning store); authorization validates the three bindings (audience, expiry, run) plus the required scope; the AuthorizedContext carries NO secret material; browser-supplied claims are REJECTED explicitly (`browser_claim_rejected` — the imported HMAC/browser-claim trust is replaced, not wrapped); revocation is owner-only and immediate.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Service-identity suite (AI-03's own acceptance) | `node --test backend/tests/contracts/serviceidentity/service-identity.test.mjs` (after `npx tsc -p tsconfig.serviceidentity.json`, exit 0) | **7/7 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| Data-04 fix | blob diff vs canonical | **identical** |

## Notes for the reviewer

- The store is the in-memory reference; the SQL adapter implements `isGrantRevoked` (required) alongside `revokeGrant`.
- Hosted service-identity flows at scale stay founder-gated as originally recorded.
