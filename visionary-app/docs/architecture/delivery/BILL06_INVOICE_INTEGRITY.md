# BILL-06 (KAN-107) — immutable invoices, accurate refunds, no invented legal fields

**Task:** BILL-06 (KAN-107), P09 checklist line
([BACKEND_LAUNCH_CHECKLIST.md](../BACKEND_LAUNCH_CHECKLIST.md)):

> Obtain reviewed seller/tax/invoice/refund/commercial policy and recurring-method
> acceptance for the actual merchant. **Preserve immutable original invoices and
> accurate refunds; do not invent legal fields.**

**Owner:** Senior Principal Backend & ML Engineer (ZCode lane). **Branch:**
`zcode/kan-107-bill06-invoice-integrity` off `dev` (`2e0b1fbb`). **Status:**
implemented, locally proven, reviewer pending per D-095. Not merged into `dev`.

## Scope split (BILL-01 local-maximum)

The task has an engineering half and an owner half. This change delivers the
**engineering half end-to-end**:

1. **Preserve immutable original invoices** — an invoice *document* now records the
   charge exactly as the provider confirmed it and is **written once**. A refund no
   longer rewrites the original document; it is recorded as a separate per-payment
   **adjustment** under the invoice, and the refund state in the account view is a
   **projection** derived at read time.
2. **Accurate refunds** — a refunded amount must be an integer within
   `[0, original amount]` and reference the exact invoice/payment; an out-of-range or
   mismatched adjustment is **refused** (typed 503), never silently applied; repeated
   notifications are **idempotent** (one adjustment per payment id).
3. **Do not invent legal fields** — the invoice document never carries a tax figure,
   GST/registration/seller-legal data or a "legal invoice" claim. A fail-closed guard
   (`assertNoInventedLegalFields`) *refuses* any such field as a hard error until a
   **reviewed merchant/tax policy record** exists.

The **owner half — obtaining the reviewed seller/tax/invoice/refund/commercial policy
and recurring-method acceptance for the actual merchant** — is a human/merchant gate
(the founder's + merchant's policy, tax registration, approved recurring method). It
cannot be produced by code on this host and is recorded as an external gate, exactly
as the BILL-01 local-maximum doctrine requires. This change builds the mechanism that
will consume that policy fail-closed when it arrives; it never pretends the policy
exists.

## What changed

`backend/upstream/backend/src/billing/invoice.ts`
- `INVOICE_IMMUTABLE_FIELDS` — the charge facts that can never change on a stored
  invoice (id, uid, number, currency, amount, plan, interval, periods, issued/paid,
  subscription/payment ids, billedTo, seller, lineItems, totals, recordKind).
- `chargeDocument(uid, receipt)` — builds the immutable charge document: it **strips**
  the derived display fields (`status`, `amountRefunded`) so a refund can never be
  stored on — and thereby mutate — the original.
- `assertNoInventedLegalFields(document)` — fail-closed guard refusing `totals.tax`,
  seller `gstin/gstNumber/pan/registrationNumber/legalName/address/digitalSignature`,
  or `legalTaxInvoice === true` without a reviewed policy.

`backend/upstream/backend/src/billing/billing.repository.ts`
- `adjustment(uid, invoiceId, paymentId)` — the write-once per-payment refund record,
  a sub-collection of the immutable invoice document.
- `assertImmutableInvoice(existing, candidate)` — pure read/write-phase check:
  creates are accepted; a rewrite of an existing document is accepted **only if every
  immutable charge fact is unchanged**, otherwise a typed 503 (never a silent
  overwrite).

`backend/upstream/backend/src/billing/billing.service.ts` (`sync`)
- The invoice store transaction now does **reads-then-writes** (matching both the
  transactional double's contract and Firestore best practice): read every existing
  invoice document, assert immutability, then `create` the first-seen documents and
  write the **adjustment ledger** for confirmed refunds.
- The account view's `invoices` list keeps the **projected** `status` /
  `amountRefunded` (the existing display API is byte-compatible — every legacy billing
  regression stays green), while the stored documents are the immutable originals.
- Refund bounds: the existing main-loop and payment-adjustment checks
  (integer, `0 ≤ refunded ≤ amount`, exact payment→invoice refs) now also record the
  adjustment ledger; an out-of-range refund refuses on the same checks.

`backend/tests/billing-invoice-integrity.test.cjs` (new, 9 tests)
- registered in `scripts/production-check.mjs` locked-compile list.

## Proof (9/9)

| # | Law proven |
| --- | --- |
| 1 | `chargeDocument` strips status/amountRefunded; a refunded receipt cannot mutate the original |
| 2 | An invoice document is write-once: a no-op re-sync is accepted intact; a rewrite changing amount/number/subscription is refused (typed) |
| 3 | A full refund leaves the original document byte-identical; the refund is one separate adjustment; the view projects `refunded` |
| 4 | A partial refund keeps the original and projects `partially_refunded` (ledger `amountRefunded` = 500) |
| 5 | Repeated refund notifications are idempotent — one adjustment per payment id |
| 6 | Out-of-range refunds (over-amount, negative) are refused; nothing is applied, no adjustment is written |
| 7 | `assertNoInventedLegalFields` refuses tax/GST/registration/legal-claim fields as hard errors |
| 8 | With no reviewed policy, no stored invoice carries any legal field |
| 9 | Every immutable field in the guard list is present on a stored charge document |

## Verification (fresh at this branch head)

| Gate | Result |
| --- | --- |
| Billing suites (`billing`, `billing-invoice-integrity`, `account-storage`, `firebase-product`) | 71/71 pass (62 legacy + 9 new) |
| `node scripts/production-check.mjs` (locked compile + SQL/Firestore provisioning + privacy + data-04) | 111/111 locked-compile; 11/11 provisioning; 37/37 data-04; 52/52 privacy — **exit 0** |
| `npm run check` | exit 0 (roots, 3842-file import baseline, continuity/motion/taps, surface audit, lint, typecheck, `npm test` 672/672, build) |
| `npm run lint` / `npm run typecheck` | exit 0 / exit 0 |
| `node scripts/authority-audit.mjs --write` | hash-only drift (2 `sha256Lf` lines), counts unchanged (55/6/12/16/32) |

### Pre-existing defect found and fixed (separate test-fixture commit)
The `data-04` invitation suite hardcoded its injected clock
`const at = new Date('2026-11-02T00:00:00Z')`. Because every default invite sets a
7-day expiry, from 2026-11-09 the expiry (`2026-11-09T00:00Z`) was strictly in the
past against the real DB `clock_timestamp()`, so `invite` threw
`InvitationPolicyError('expired')` — **22 of 37** data-04 tests failed, reproduced
byte-identically on a pristine `dev` worktree (not caused by this change). Fixed with
a rolling per-run base (`Date.now() - 1 day`), which keeps `at + 7d > now > at` — the
suite's own invariant — deterministically within a run. Test-fixture only; no product
or assertion semantics changed; committed separately for easy review.

## Recorded external gate (NOT claimed)

The **reviewed seller/tax/invoice/refund/commercial policy and recurring-method
acceptance for the actual merchant** — the owner half of BILL-06 — plus real
live-merchant money acceptance (BILL-07's held gate). This change makes the invoice
layer ready to consume such a policy through `assertNoInventedLegalFields` (the policy
record would be the sole authorized source of legal fields) and freezes the original
charges so a later approved policy cannot rewrite history. Real refunds against live
money remain a hosted acceptance step.
