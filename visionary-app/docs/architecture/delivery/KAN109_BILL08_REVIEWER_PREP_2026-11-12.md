# KAN-109 / BILL-08 proof — reviewer-corrector pass (2026-11-12)

Reviewer-prep for `codex/deepseek-kan-109-billing-proof` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: stack integration (merge of dev `c260894e` into the impl commit `b5b19ed5`, old base `2f8e3f74`; data-04 identical to dev) + receipt. **Test-only task — no product source change, no artifact regen (authority inventory unchanged, tree clean).**

## Review finding (verified, tests are sound — no correction)

The BILL-08 purchase-proof suite reviewed clean; every assertion earns its pass:

- **Auth-required purchase**: the anonymous checkout is refused 403 at the HTTP boundary and a stale-device session 401, with ZERO provider subscriptions created (`creates()` pinned at 0) — the refusal happens before any merchant call.
- **Expired-session recovery without a second charge**: another account verifying the owner's saved attempt is refused 409 (ownership re-checked against the stored attempt); the re-authenticated owner verifies the SAME saved attempt and `creates()` stays at 1 — no second subscription.
- **Idempotent retry after an ambiguous provider error**: the failed-creation attempt keeps the command identity; after the 30-second creation window a retry with the SAME commandId recovers exactly `sub_fixture1` (no second POST), and a further repeat is idempotent.
- **Exactly one Family payer**: the beneficiary holds no payer state (`subscription: null`), cannot start their own purchase (409), cannot confirm the payer's attempt (409), and cannot remove the owner; invoice access is payer-only (beneficiary 404, payer reads the record); revocation is payer-only and immediate (beneficiary reads Free, the membership row is gone, the payer is unaffected).
- **Billing-only benefit**: neither beneficiary nor payer view carries `learningAccess`/`guardianAccess`/`instructorAccess`, and the billing controller source contains no learning/guardian/instructor route surface (regex scan).

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Backend compile | `npm run build` (upstream backend, `nest build`) | **exit 0** |
| Billing battery incl. all BILL-08 proof tests | inside `npm run data:check` | **53/53 pass** |
| Data contracts (real-SQL DATA-02 suites + workspace/data/invitations tsconfigs) | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 114/114 + contracts 35/35 + sub-batteries, frontend build ok** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-12)

The live product exercises the same auth boundary the proof pins: `/dashboard/subscription?plan=personal&billing=annual` and `?plan=family&billing=annual` render the sign-in guard in-place (unauthenticated purchase intent never reaches a provider call — the HTTP 403/401 refusals proven in the suite are the same boundary), with the full `returnTo` deep link preserved. Credential + Razorpay checkout steps founder-gated as always; the payer/revocation/invoice-access laws are server-side and covered by the 53/53 battery.

## Notes for the reviewer

- **Merge-time interaction (sibling shape change)**: the revocation test asserts `deepEqual(ex.entitlement, { plan: 'start', validUntil: null, source: 'free' })` — the pre-BILL-04 three-field shape. KAN-105's branch (BILL-04) widens the entitlement object with `state`/`revision`/`reason`; when both merge into dev, update this deepEqual to the richer shape (or pin a subset) — on THIS branch's base the assertion is correct and the battery is green.
- Test-only delivery: the privacycore emulator gate remains environment-gated on untouched files (single unchanged baseline), exactly as the ticket's evidence records.
