# KAN-106 / BILL-05 — released billing lifecycle evidence

Implementer: deepseek lane (senior product engineer agent). This document supplies implementation evidence and requests separate review (D-095); the implementer cannot approve its own work.

## Scope

- Jira key / source ID: KAN-106 / BILL-05, parent KAN-11 (P09 — hosted billing), responsibility billing/backend/platform.
- Requirement: define and implement the released renewal/failure/grace/cancel/refund/dispute/plan-change/payment-method behavior and recovery. Unreleased changes must not be advertised as working.
- Deliverable: a versioned, declared released lifecycle (`billing-lifecycle.ts`) with renewal / charge-failure / grace / recovery transitions derived from provider truth, surfaced on the account view; a sync integration that opens the grace window on a dunning status and clears it on recovery; and an explicit, test-enforced boundary that unreleased capabilities (plan-change, payment-method update, in-app dispute escalation) are **not advertised**. Test mode only; no live-money activation (BILL-07 separate); no real merchant account, webhook or payment record touched.
- Worker branch: `codex/deepseek-kan-106-billing-lifecycle`, base `2f8e3f7448efd8b644522a0b82272b22f9aa1dc6` (verified `origin/dev` tip). Candidate: this file's commit (exact SHA in the Jira review comment).

## What changed

1. **`billing-lifecycle.ts` — one versioned released-lifecycle contract** (`BILLING_LIFECYCLE_VERSION = 1`): released states `free / active / renewing / grace / suspended / pending_activation / ended`. Provider `charge_at` (UNIX seconds) drives `active` vs `renewing` (renewal due within a declared window); a dunning status (`halted`/`paused`, a too-small charge) opens a declared `GRACE_MS = 3 days` window; after the window reads `suspended` — **data retained, no paid entitlement advertised**; the grace→suspended edge is time-derived so a restart or missed reconciliation cannot strand an account in the wrong state; `pending_activation` covers an unconfirmed non-dunning provider state so it is never advertised as active.
2. **Sync integration (recovery)**: on a provider charge-failure status the account persists `pastDueSince` + `graceUntil = pastDueSince + GRACE_MS`; a confirmed paid period clears both (recovery). Exact units kept separate (provider seconds vs persisted milliseconds).
3. **View surface**: `account()` now returns `lifecycle: lifecycleOf(data)` and `capabilities: releasedCapabilities()` — the advertised set — while the existing display still refuses to show a non-paid plan.
4. **Unadvertised-capability rule**: `releasedCapabilities()` returns released behaviors only `{renewal, failure, grace, recovery, cancel, refund, dispute}`; plan-change, payment-method update and in-app dispute escalation are **not** in the set and a test asserts no such surface exists in the billing controller.

## Evidence

| # | Check | Command | Result |
| --- | --- | --- | --- |
| 1 | Billing suite with the new BILL-05 cases | `node --test tests/billing.test.cjs` | **25/25 pass** — 22 pre-existing + 3 new: released lifecycle derivation (free/active/renewing/ended/pending_activation, capabilities set with plan-change/payment-method absent), the charge-failure → grace window → recovery → expiry-suspends-with-data-retained journey, and the unreleased-surface absence assert |
| 2 | Full backend battery | `node --test tests/*.test.cjs` | **110/111 pass**; the single failure is `privacycore.test.cjs` requiring a Firestore loopback emulator — environment gate on untouched files (emulator not installed on this workstation) |
| 3 | Builds | product typecheck + emit, full graph `tsc -p tsconfig.json` | **exit 0** after fresh-worktree `npm ci` + `prisma generate` |

## Honest scoping

- Renewal/failure/grace/recovery are implemented as released derivations + persistence, proven at unit level in test mode. Live confirmation of the transitions (real Razorpay charge failure, real renewal charge) requires the hosted merchant (BILL-01/02) — not closed here.
- Cancel and refund behaviors already existed and are covered by the pre-existing suite; dispute is routed through the existing payment-adjustment/webhook path (unchanged); plan-change and payment-method are intentionally **not released** and therefore not implemented/advertised.
- Production-money capability is not claimed; paid-launch acceptance and commercial policy (BILL-06) stay open.

## Review handoff

Exact candidate SHA and suite counts are in the Jira review comment. Reviewer must be separate from this lane. Key files: `backend/upstream/backend/src/billing/billing-lifecycle.ts`, `billing.service.ts` (sync grace persistence + view), `backend/tests/billing.test.cjs` (3 new cases).
