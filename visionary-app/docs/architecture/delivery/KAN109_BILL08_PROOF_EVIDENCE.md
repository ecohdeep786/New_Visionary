# KAN-109 / BILL-08 — auth-required purchase, recovery, idempotency, Free defaults, one Family payer, revocation and payer-only invoice access — evidence

Implementer: deepseek lane (senior product engineer agent). This document supplies implementation evidence and requests separate review (D-095); the implementer cannot approve its own work.

## Scope

- Jira key / source ID: KAN-109 / BILL-08, parent KAN-11 (P09 — hosted billing), responsibility billing/backend/platform/commercial.
- Requirement: prove auth-required purchase, expired-session recovery, idempotent retry, Free defaults, one Family payer, beneficiary revocation and payer-only invoice access. Family benefits never grant learning/guardian access.
- Deliverable: the behaviors already exist in the test-mode billing module on `origin/dev`; this lane is a **proof** task — it asserts each BILL-08 property with meaningful positive/failure/deny tests at the service and native-HTTP boundary, including the missing family/learning-grant boundary and the anonymous/stale-session purchase refusal. No service source changed; **test mode only**, no live-money activation, no merchant account or payment record touched.
- Worker branch: `codex/deepseek-kan-109-billing-proof`, base `2f8e3f7448efd8b644522a0b82272b22f9aa1dc6` (verified `origin/dev` tip). Candidate: this file's commit (exact SHA in the Jira review comment).

## What changed

A single file: `backend/tests/billing.test.cjs` (+69 lines). Existing behavior was proven to already hold; the new tests pin the released property so a regression is caught:

1. **Auth-required purchase** (native-HTTP boundary, inside the pre-existing HTTP test): an anonymous checkout POST is refused **403 by the CSRF/session guard** and a **stale-device session refused 401 by authentication** — both with **0 provider subscriptions created**. (The unresolved session-identity boundary is the server's own `ProductRequestAuthority`: a missing cookie fails `csrf()` → 403; a wrong device fails `authenticate` → 401.)
2. **Expired-session recovery**: after the owner's checkout is created, the saved attempt remains `recoverable`; another user cannot replay the owner's attempt (`verify` → 409); the owner re-verifies the **same saved attempt** after re-authentication and is charged exactly once — `creates() === 1` across the whole journey, no second subscription.
3. **Idempotent retry**: after an ambiguous provider failure, retrying the **same commandId** (the same saved command identity) recovers the single provider-created subscription — `creates() === 1` through two retries, both returning the same `subscriptionId`.
4. **Free defaults**: already proven by the pre-existing suite (fresh account persists `uid`/`basePlan: 'start'`/`revision: 0`/no subscription/invoice and reads Free on every surface) — unchanged, referenced in evidence.
5. **One Family payer**: an accepted beneficiary has no subscription/payer state, cannot start their own purchase (409) and cannot confirm the payer's attempt (409); the payer is the only account holding a subscription.
6. **Beneficiary revocation**: revocation is payer-only (a beneficiary cannot remove the payer); immediately after `removeFamily`, the ex-beneficiary reads **Free** (`{ plan: 'start', validUntil: null, source: 'free' }`), its membership document is gone, and it still cannot read the payer's invoice.
7. **Payer-only invoice access**: an active beneficiary cannot read the payer's invoice (`invoice` → 404) while the payer reads it — enforced by UID-scoped invoice document ownership; holds during membership and after revocation.
8. **Family benefits never grant learning/guardian access**: a beneficiary (and even the payer) carries **no learning/guardian/instructor capability** on the billing account surface, and the billing controller source exposes **no learning/guardian/instructor route** (asserted by a source-surface absence test in the spirit of the BILL-05 unadvertised-surface rule).

## Evidence

| # | Check | Command | Result |
| --- | --- | --- | --- |
| 1 | Billing suite with the new BILL-08 cases (2 consecutive runs for stability) | `node --test tests/billing.test.cjs` | **26/26 pass both runs** — 22 pre-existing + 4 new (expired-session recovery; same-command idempotent retry; one-payer/payer-only-invoice/revocation journey; billing-only family never learning/guardian) + the native-HTTP auth-required-purchase extension |
| 2 | Full backend battery | `node --test tests/*.test.cjs` | **111/112 pass**; the single failure is `privacycore.test.cjs` requiring a Firestore loopback emulator (`Explicit loopback emulator required; live fallback prohibited.`) — environment gate on untouched files, identical to the KAN-104/105/106 baseline; emulator not installed on this workstation |
| 3 | Builds | product `tsc -p tsconfig.product.json`, full graph `tsc -p tsconfig.json` (+ emit so every test module's `dist` target exists) | **exit 0** after fresh-worktree `npm ci` + `prisma generate` |

No service implementation was changed; the only committed difference is the test file.

## Honest scoping

- Testing is against the in-memory transactional fixture and unit/HTTP boundary stubs only. The hosted merchant (BILL-01/02), reviewed commercial policy (BILL-06) and separately configured live mode (BILL-07) remain open — none are closed here, and purchase/session/token mechanics are proven at the documented server boundary (no live Firebase or Razorpay touched).
- The grace/entitlement semantics of BILL-04/05 live in their own Testing lanes (KAN-105/106) off the same base; BILL-08 does not import or conflict with them — it proves the released purchase boundary against the same `origin/dev` module.
- "Family benefits never grant learning/guardian access" is proven at the billing module's own surface (no capability, no route). End-to-end denial across the Learning/Guardian modules is their own responsibility and is exercised by their lanes.

## Review handoff

Exact candidate SHA and suite counts are in the Jira review comment. Reviewer must be separate from this lane. Key file: `backend/tests/billing.test.cjs` (4 new tests + HTTP boundary extension).
