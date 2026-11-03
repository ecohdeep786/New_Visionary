# KAN-105 / BILL-04 — authoritative entitlement and paid-action admission evidence

Implementer: deepseek lane (senior product engineer agent). This document supplies implementation evidence and requests separate review (D-095); the implementer cannot approve its own work.

## Scope

- Jira key / source ID: KAN-105 / BILL-04, parent KAN-9 (P09 — hosted billing), responsibility billing/backend/platform.
- Requirement: connect authoritative entitlement and actual AI/feature usage admission. Plan display, checkout intent and paid actions must agree across devices; unknown provider state stays pending.
- Deliverable: one server-owned entitlement derivation consumed by every surface, an admission gate on the paid-action family endpoint, and revision-stamped agreement across devices — all in test mode against the in-memory transactional fixture. No live-money activation (BILL-07 separate); no real merchant account or payment record touched.
- Worker branch: `codex/deepseek-kan-105-entitlement`, base `2f8e3f7448efd8b644522a0b82272b22f9aa1dc6` (verified `origin/dev` tip). Candidate: this file's commit (exact SHA in the Jira review comment).

## What changed

1. **`entitlementOf(data)` — the single authoritative derivation** (`billing.service.ts`): `active` only when the provider-confirmed subscription status (`active`/`authenticated`) covers the present moment (`paidFrom ≤ now < paidThrough`); `pending` while an in-flight attempt (`creating`/`awaiting_customer`/`reconciling`/`processing`) or an unconfirmed non-terminal subscription status (`halted`, `pending`, …) leaves the provider truth unknown — **neither granted nor denied**; `free` when no entitlement stands (terminal subscription, no attempt). A finished attempt (`succeeded`/`ended`/`failed`) never holds the entitlement pending — it falls through to the subscription truth. Every shape carries the account `revision`, so display, checkout intent and admission agree across devices on the same stamped fact.
2. **Display honesty**: `view().plan` shows the **granted** plan only (`active → plan`, otherwise `start`); the intended plan stays inside the explicitly labeled `entitlement: { state: 'pending', reason, plan }` object and the existing `pending` checkout view. An unconfirmed or halted subscription can no longer be advertised by the date-only display the old code used.
3. **Paid-action admission**: the family-invitation gate now reads the authoritative entitlement (`state === 'active' && plan === 'family'`) instead of the display projection — a pending or unknown provider state refuses 403 with the same user-facing message, a wrong-user request still refuses through the existing payer authority, and duplicate seats/revision conflicts keep their existing guards.
4. **Agreement across devices**: the checkout-intent view, the account display and the admission gate all derive from the same `entitlementOf` call on the same account document — agreement is by construction, stamped with the revision the client can conflict-check (the existing cancel revision bound is unchanged).

## Evidence

| # | Check | Command | Result |
| --- | --- | --- | --- |
| 1 | Billing suite with the new BILL-04 cases | `node --test tests/billing.test.cjs` | **26/26 pass** — 22 pre-existing + 4 new: display/intent/admission agreement with revision stamp (active Family admits), unknown provider state (`halted`) stays pending, never advertised and refuses paid actions, unfinished checkout attempt (`awaiting_customer`) stays pending, provider-confirmed terminal subscription returns to `free` while receipts are retained |
| 2 | Full backend battery | `node --test tests/*.test.cjs` | **111/112 pass**; the single failure is `privacycore.test.cjs` requiring a Firestore loopback emulator — environment gate on untouched files (emulator not installed on this workstation) |
| 3 | Builds | product typecheck + emit, full graph `tsc -p tsconfig.json` | **exit 0** after fresh-worktree `npm ci` + `prisma generate` |

## Honest scoping

- "Actual AI/feature usage admission" end-to-end requires the hosted usage pipeline (BILL-01/02 real webhooks + the usage-reservation integration AI-07/KAN-89, Testing); this lane delivers the server-owned entitlement semantics those connect to, proven at unit level in test mode.
- Grace/renewal/dispute behaviors are BILL-05 (separate); this lane only refuses honestly where the provider truth is unknown.
- Production-money capability is not claimed; paid-launch acceptance stays open.

## Review handoff

Exact candidate SHA and suite counts are in the Jira review comment. Reviewer must be separate from this lane. Key files: `backend/upstream/backend/src/billing/billing.service.ts` (entitlementOf, view, family admission), `backend/tests/billing.test.cjs` (4 new cases).
