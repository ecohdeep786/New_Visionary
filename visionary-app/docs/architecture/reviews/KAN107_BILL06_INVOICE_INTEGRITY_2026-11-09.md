# KAN-107 / BILL-06 — invoice integrity review handoff

9 November 2026. Implementer: Senior Principal Backend & ML Engineer (ZCode lane).
Branch `zcode/kan-107-bill06-invoice-integrity` off `dev` (`2e0b1fbb`). Reviewer:
**pending per D-095**. Not merged into `dev`; worktree left for the reviewer.

## Acceptance scope

Engineering half of BILL-06: "Preserve immutable original invoices and accurate
refunds; do not invent legal fields." Full statement:
[BILL06_INVOICE_INTEGRITY.md](../delivery/BILL06_INVOICE_INTEGRITY.md). Evidence:
[delivery/bill06/evidence.json](../delivery/bill06/evidence.json) + captured TAP.

The owner half — **obtaining the reviewed seller/tax/invoice/refund/commercial policy
and recurring-method acceptance from the actual merchant** — is NOT claimed: it is a
human/merchant gate recorded in evidence as the external gate, per the BILL-01
local-maximum doctrine. This change only makes the invoice layer fail-closed ready for
that policy.

## What changed

- `invoice.ts` — `INVOICE_IMMUTABLE_FIELDS`, `chargeDocument` (strips derived
  status/amountRefunded), `assertNoInventedLegalFields` (refuses tax/GST/legal claims
  without a reviewed policy record).
- `billing.repository.ts` — `adjustment(uid, invoiceId, paymentId)` per-payment
  write-once ledger + `assertImmutableInvoice` (create accepted; rewrite requires
  byte-identical immutable charge facts, else typed 503).
- `billing.service.ts` `sync()` — reads-then-writes store transaction; writes the
  charge document once and the adjustment ledger for confirmed refunds; the account
  view keeps the projected status/amountRefunded (API byte-compatible).
- `billing-invoice-integrity.test.cjs` (9 tests) registered in
  `scripts/production-check.mjs` locked-compile list.

## Defects found and fixed

- **Transaction read-after-write** — the first per-invoice write path violated the
  transactional double's reads-before-writes contract (and Firestore best practice);
  restructured to read-all-then-write-all.
- **Async assertion bug in the new suite** — `assert.throws(() => asyncFn())` can't
  catch promise rejections; fixed with `assert.rejects` (the bad-bounds tests were
  actually passing silently otherwise).

### Pre-existing defect fixed (separate, test-fixture-only commit)
`backend/tests/contracts/data-04/invitations.test.mjs` hardcoded its injected clock to
`2026-11-02T00:00:00Z`; the 7-day default expiry became strictly past on 2026-11-09, so
22/37 invitation tests threw `expired` (reproduced identically on a pristine `dev`
worktree — not caused by this change). Rebased the clock to `Date.now() - 1 day`
(rolling per-run), preserving the suite's `at + 7d > now > at` invariant. No product
or assertion change. Committed separately so the reviewer can drop it if preferred.

## Verification at this branch head

Billing suites 71/71 · `scripts/production-check.mjs` **exit 0** (111/111 locked
compile incl. new 9; 11/11 provisioning; 37/37 data-04; 52/52 privacy) · `npm run
check` exit 0 (import baseline 3842, continuity/motion/taps, surface audit, lint,
typecheck, 672/672 unit, build) · authority inventory regenerated hash-only (counts
unchanged).

## Explicitly not accepted here

The reviewed merchant/tax/commercial policy, recurring-method acceptance, and any real
live-money invoice/refund are hosted/owner gates. No legal field is displayed or
invented anywhere; `assertNoInventedLegalFields` makes that a hard invariant until a
reviewed policy record is supplied.
