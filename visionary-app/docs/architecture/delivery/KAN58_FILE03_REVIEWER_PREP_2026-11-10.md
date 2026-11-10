# KAN-58 / FILE-03 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/deepseek-kan-58-private-downloads` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections `1f61695a`, stack integration `faa3034b` (corrected kan-53 `dd520a57`; download files resolved OURS — this branch owns the FILE-03 slice and 53's incidental older lane generation of those files is superseded), union widening + SQL adapter `0755faa7`, Int32 budget fix `9c37bf38`.

## Corrections

1. **Read-budget double-spend fixed**: `read()` decremented from a stale `requireReadable` read then blind-patched, so two concurrent readers could both spend the same unit and exceed `maxReads`. New `DownloadStore.consumeRead` re-checks ACTIVE/unexpired/budget against the CURRENT row and decrements atomically; a lost race maps to typed `used`.
2. **Int32 gateway budget crash fixed** (found by the branch's own `download.sql.test.mjs` against real PostgreSQL): the gateway default budget was `Number.MAX_SAFE_INTEGER`, which the durable adapter persists into an Int32 column — **every gateway issuance crashed at insert**; the in-memory enabler suite could never catch it. Default is now `GATEWAY_UNLIMITED_READS = 2^31−1`; out-of-range caller budgets refuse at admission (`out_of_bounds`) before any durable write.
3. **The SQL adapter implements `consumeRead`** as the single conditional UPDATE (`WHERE state='ACTIVE' AND "expiresAt" > now AND "remainingReads" > 0`) — the no-double-spend law holds on the durable store, not just in memory.
4. Grant/export ids use `randomUUID`; grant/export write-result failure unions widened (`revoked`/`expired`/`used` — the adapter's `classifyGrant` already produced them) and mapped to typed `DownloadPolicyError` codes.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Download suite | `node --test backend/tests/contracts/data-files/download.test.mjs` | **10/10 pass** (gateway immediate revocation, expiry sweep, signed-link residual validity, export bounds, ownership) |
| **SQL store suite (real PostgreSQL 16)** | `node --test backend/tests/contracts/data-files/download.sql.test.mjs` (disposable loopback DB) | **13/13 pass** — was failing at delivered head (Int32 crash) |
| Full family suites | upload + manifest + outbox + jobs + admission | **45/45 pass** |
| Data contracts | `npm run data:check` (includes the SQL suites + data-04 37/37) | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |

## Live product check (2026-11-10)

The integrated product re-verified live in the browser (pricing renders with the free CTA; the standing real-user journey evidence — pricing → register → email step → auth guards with `returnTo` — applies). Private downloads/exports/revocation are backend delivery channels with no separate UI surface at this slice; their acceptance is the executed suite set over the real SQL store, and hosted signed-URL delivery at the edge stays founder-gated as originally recorded.

## Notes for the reviewer

- The download_grants Int32 budget law applies to ANY adapter: read budgets are Int32; the service validates before durable writes.
- Signed-link residual validity is documented and bounded by design (bytes already delivered are not recalled); the gateway channel is the immediate-revocation path.
