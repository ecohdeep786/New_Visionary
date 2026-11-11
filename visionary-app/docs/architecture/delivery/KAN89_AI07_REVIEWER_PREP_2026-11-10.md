# KAN-89 / AI-07 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-89-usage-reservation` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections, stack integration (merge of dev `2e0b1fbb`; package.json scripts unioned — all twenty-eight family checks live incl. the domain's own registered gate), data-04 rolling-clock fix (byte-identical).

## Correction — the settle double-credit race closed

`settle` read the reservation status then credited the remainder non-atomically: two concurrent settles of one reservation (the ambiguous-timeout retry) could **both credit the remainder** — quota inflation, the one debited reservation credited twice. The store gains `settleReservation` (atomic: conditional on the status being 'reserved', the remainder credit and the settle mark apply TOGETHER; the concurrent retry converges to duplicate WITHOUT a second debit). SQL adapter law: one `UPDATE … WHERE status = 'reserved'` inside the credit transaction. The service maps the lost race to the idempotent duplicate outcome.

Also: reservation/ledger-entry ids use `randomUUID` (instance counters collided across service instances).

## Review finding (verified, no further defect)

The usage law reviewed clean otherwise: `reserve` is an atomic check-and-deduct within the request bounds and the owner's quota (the store's own critical section); bounded tool loops/attempts refuse BEFORE any further spend; the ledger is append-only and MEASURED (never an estimate); settlement is terminal and idempotent.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Usage-reservation suite (AI-07's own acceptance) | `node --test backend/tests/contracts/usagereservation/usage-reservation.test.mjs` (after `npx tsc -p tsconfig.usagereservation.json`, exit 0) | **6/6 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| Data-04 fix | blob diff vs canonical | **identical** |

## Notes for the reviewer

- The store is the in-memory reference; the SQL adapter implements `settleReservation` in one transaction (the interface comment carries the law) and keeps `tryReserve`'s critical section atomic.
- Hosted usage metering at scale stays founder-gated as originally recorded.
