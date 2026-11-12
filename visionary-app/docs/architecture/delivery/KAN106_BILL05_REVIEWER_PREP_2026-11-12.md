# KAN-106 / BILL-05 — reviewer-corrector pass (2026-11-12)

Reviewer-prep for `codex/deepseek-kan-106-billing-lifecycle` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: correction, stack integration (merge of dev `c260894e` into the impl commit `8c3b0cf7`, old base `2f8e3f74`; data-04 identical to dev), settled review artifacts, receipt.

## Correction

**A cancel-at-period-end subscription never claims a renewal.** `lifecycleOf` derived `renewing` purely from the provider `chargeAt` landing inside the renewal window — but with `cancelAtPeriodEnd: true` that charge will never happen, so the account view simultaneously said `subscription.renewalAt: null` (correct) and `lifecycle: renewing, renewalAt: <date>` (a false advertisement of a renewal that will not occur — the exact class the ticket guards). Fixed: the renewal claim requires `!sub.cancelAtPeriodEnd`; the paid period stays `active` and `renewalAt` reads null, agreeing with the account view for the same condition. Test added: cancelled-at-period-end + charge in window reads `active` with `renewalAt: null`.

## Review finding (verified otherwise defect-free)

The lifecycle contract reviewed clean and enforces BILL-05 exactly:

- **One versioned place**: `BILLING_LIFECYCLE_VERSION=1` with the released states free/active/renewing/grace/suspended/pending_activation/ended.
- **Units discipline explicit**: provider seconds (`chargeAt × 1000`) vs persisted ms (`pastDueSince`/`graceUntil`) kept apart by dedicated formatters.
- **Grace → suspended edge is time-derived** (no transition write): a restart or a missed reconciliation cannot strand an account in the wrong state; expiry reads `suspended` with data retained and no paid entitlement advertised.
- **Recovery is strict**: only a provider-confirmed paid period (`active`/`authenticated` AND `paidThrough > now`) clears the persisted dunning fields; an unconfirmed status keeps the window open honestly.
- **Over-grant impossible**: dunning/pending states leave the display plan at `start` (the entitlement layer refuses), and a stale persisted `pastDueSince` keeps the account in grace/suspended until a CONFIRMED recovery — conservative, never over-advertising.
- **Unreleased surfaces absent**: plan-change / payment-method / in-app dispute escalation exist nowhere in the controller (source-scan test) and are not in the advertised capability set.
- **Merge semantics verified**: the dev merge brings neither ladder nor conflicts — the BILL-03 retry ladder lives on the KAN-104 branch and enters dev with that merge; this branch's service carries lifecycle wiring over dev's base cleanly.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Backend compile | `npm run build` (upstream backend, `nest build`; correction verified in dist) | **exit 0** |
| Billing battery incl. the 3 BILL-05 tests + the new cancelled-renewal assertion | inside `npm run data:check` | **53/53 pass** |
| Data contracts (real-SQL DATA-02 suites + workspace/data/invitations tsconfigs) | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` (after hash-only authority regen + contracts rebuild) | **exit 0 — 114/114 + contracts 35/35 + sub-batteries, frontend build ok** |
| Authority artifacts | regenerated | **hash-only delta** (`billing-lifecycle.ts` sha256 after the correction; registered stays 55) |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-12)

Pricing renders the full catalog including the "Cancel anytime" promise — the released cancel capability this lifecycle advertises. The signed-in lifecycle display itself (active/grace/suspended states, capability set) is founder-gated behind real credentials; its behavior is covered by the 53/53 battery including the grace→recovery→suspended journey test.

## Notes for the reviewer

- **Merge-order interaction**: KAN-105's branch reworks `view()` onto `entitlementOf` (BILL-04) while this branch adds `lifecycle`/`capabilities` fields to the pre-BILL-04 `view()` line — when both merge into dev, resolve the `view()` hunk to KAN-105's entitlement-based view PLUS this branch's `lifecycle: lifecycleOf(data), capabilities: releasedCapabilities()` additions.
- Hosted dunning behavior (real provider charge failures at scale) stays founder-gated per BILL-01 local-maximum.
