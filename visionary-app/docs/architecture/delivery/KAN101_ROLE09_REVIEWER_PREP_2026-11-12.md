# KAN-101 / ROLE-09 — reviewer-corrector pass (2026-11-12)

Reviewer-prep for `codex/principal-kan-101-entitlement-reconciliation` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections, stack integration (merge of dev `c260894e`; package.json scripts unioned — all thirty-nine family checks live incl. the domain's own registered gate), data-04 settled to dev's evolved version, settled review artifacts.

## Correction

Contract/request ids use `randomUUID` — the `Math.random` contract ids were guessable authorization artifacts and the instance counters collided across service instances.

## Review finding (verified, no defect)

The entitlement law reviewed clean and enforces ROLE-09 exactly:

- **Real approved commercial contracts only**: recording requires the company-side principal form AND a named approver; seats integer ≥ 1; validity ordered.
- **A seat request is a REQUEST, never a billing obligation**: 'entitled' status requires an ACTIVE unexpired contract with the seat bound enforced against the REAL contract; without a contract the request lands as `pending_approval` honestly.
- **The preview creates NOTHING**: `billingArtifactCreated: false` explicit, honest reasons (no contract / expired / within seats / over bound).
- **A seat request CANNOT carry administrative authority**: `attachAdministrativeAuthority` always refuses.
- **Deterministic reconciliation**: entitled = min(requested, contractSeats) only while unexpired; overBound reported.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Entitlement suite (ROLE-09's own acceptance) | `node --test backend/tests/contracts/entitlement/entitlement.test.mjs` (after `npx tsc -p tsconfig.entitlement.json`, exit 0) | **6/6 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` (after the coupled artifact chain) | **exit 0 — 866 ok lines, frontend build ok** |
| Data-04 fix | settled to dev's evolved version | **exact** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-12)

All four stages re-verified: pricing renders; register renders all three reviewed methods; the email-entry step renders on click; the protected-route guard renders in-place with the Create-account link preserving the full `returnTo` deep link. Credential step founder-gated as always.

## Notes for the reviewer

- The contract/seat/membership lookups are injected (the SQL adapter joins the commercial stores). Hosted entitlement flows at scale stay founder-gated as originally recorded — real commercial contracts are owner gates.
