# KAN-105 / BILL-04 — reviewer-corrector pass (2026-11-12)

Reviewer-prep for `codex/deepseek-kan-105-entitlement` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: stack integration (merge of dev `c260894e` into the impl commit `937fcf08`, old base `2f8e3f74`; data-04 identical to dev, package.json identical — no union needed) + settled review artifacts.

## Review finding (verified, no defect)

The authoritative entitlement law reviewed clean and enforces BILL-04 exactly:

- **One server-owned derivation**: `entitlementOf(data)` feeds the display plan, checkout intent and the paid-action family gate, so every surface agrees by construction; the entitlement carries the account `revision` that devices agree on.
- **Active is strict**: provider-confirmed status (`active`/`authenticated`) AND `paidFrom <= now < paidThrough` — a confirmed-but-expired subscription is NOT active.
- **Unknown provider state stays pending**: an in-flight attempt (not ended/failed/succeeded) or a non-terminal unconfirmed status (halted/pending) is `pending` with the honest reason — neither granted nor denied; paid actions (family invitations) refuse with 403 on pending.
- **The display never advertises the plan it waits on**: `plan` is the granted plan only; pending shows `start`.
- **Terminal-to-free is honest**: a provider-confirmed terminal subscription falls to `free` WITHOUT deleting receipts.
- **Family membership inheritance is explicit**: a member's account view takes the owner's active family entitlement with `source: 'family-membership'`.

The four BILL-04 tests cover active-agreement+admission, halted-pending refusal, awaiting-customer pending, and terminal-to-free with retained receipts.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Backend compile | `npm run build` (upstream backend, `nest build`; `entitlementOf` present in dist — stale-dist lesson applied) | **exit 0** |
| Billing battery incl. the 4 new BILL-04 tests | inside `npm run data:check` | **53/53 pass** |
| Data contracts (real-SQL DATA-02 suites + workspace/data/invitations tsconfigs) | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` (after hash-only authority regen + contracts rebuild) | **exit 0 — 114/114 + contracts 35/35 + sub-batteries, frontend build ok** |
| Authority artifacts | regenerated | **hash-only delta** (`billing.service.ts` sha256; registered stays 55 — the backlog route lives on the KAN-104 branch and enters dev with that merge) |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-12)

`/dashboard/subscription?plan=family&billing=annual` renders the sign-in guard in-place with the Create-account link preserving the full `returnTo` deep link and truthful payment copy ("Sign in to review Family with annual billing. Payment starts only after you review the amount and confirm secure checkout."); pricing renders the full catalog. The signed-in entitlement display itself (active/pending/free plan) is founder-gated behind real credentials; its behavior is covered by the 53/53 battery.

## Notes for the reviewer

- **Registry interaction at merge time**: KAN-104's branch carries the authority corrections (inventory 55→56 for `POST /api/billing/jobs/backlog`); when both branches merge into dev, the registry union is 56 routes + this branch's new `billing.service.ts` sha256 — the KAN-104 corrections merge FIRST (merge-order law), then this branch's hash refresh.
- Paid-action admission covers family invitations; usage-pipeline connection stays with BILL-01/02 + AI-07 as the ticket states.
