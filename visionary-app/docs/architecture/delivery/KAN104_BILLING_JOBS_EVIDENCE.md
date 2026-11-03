# KAN-104 / BILL-03 — growth-appropriate billing dispatch evidence

Implementer: deepseek lane (senior product engineer agent). This document supplies implementation evidence and requests separate review (D-095); the implementer cannot approve its own work.

## Scope

- Jira key / source ID: KAN-104 / BILL-03, parent KAN-9 (P09 — hosted billing), responsibility billing/backend/platform.
- Requirement: replace the bounded test-volume scanner with growth-appropriate per-account Tasks/outbox, private job identity, backlog monitoring, leases and merchant-rate-aware retry caps.
- Deliverable: the billing reconciliation dispatcher rebuilt in place — dispatch state unified on the per-account queue documents, an ordered cursor-paged dispatcher replacing the unordered `limit(20)` scan, a merchant-rate-aware retry ladder with a quarantine ceiling, redacted backlog monitoring, and the existing private job identity carried over. Test mode only; no live-money activation (BILL-07 stays separate); no real merchant account, webhook or payment record was touched.
- Worker branch: `codex/deepseek-kan-104-billing-jobs`, base `2f8e3f7448efd8b644522a0b82272b22f9aa1dc6` (verified `origin/dev` tip). Candidate: this file's commit (exact SHA in the Jira review comment).

## What changed (all in the billing module, self-contained on dev)

1. **Dispatch state unified on the queue document** (`visionary_billing_test_queue/<uid>`, the owning-store operational index): `attempts`, `quarantinedAt` and the due time now live only there. The account transactional helper mirrors `nextSyncAt` with a **merge** write so ladder fields written inside the claim/failure transactions survive; the webhook intake resets the ladder on every fresh merchant event.
2. **Leases**: the per-account `syncLease` claim (unchanged semantics) now moves the queue document forward **inside the same transaction** as the claim, so a concurrent dispatch pass cannot re-pick a leased account; completion keeps the existing lease-id fence (`current.syncLease?.id !== lease` refuses the write).
3. **Merchant-rate-aware retry caps**: a failed dispatch climbs `60s → 120s → 300s → 900s → 1800s` (±20% jitter so a recovered backlog never stamps a spike into Razorpay; `429/5xx/ambiguous` provider errors follow the same ladder). At **5 attempts** the account **quarantines** — a long backoff, skipped by dispatch, surfaced in the backlog; a fresh webhook event or an interactive sync resets the ladder. Pre-claim failures (storage/provider unavailable before the lease) ladder the queue document exactly once via an explicit `dispatchHandled` marker — no hot loop, no double count.
4. **Growth-appropriate dispatch**: `reconcileDue` reads **ordered, cursor-paged** pages (20 per page, `orderBy nextSyncAt` + `startAfter`) under the existing 45-second wall-clock budget instead of one unordered `limit(20)` scan; every pass resumes after its cursor, processes quarantined accounts never, and reports `{processed, failed, quarantinedSkipped}`.
5. **Backlog monitoring**: `POST /api/billing/jobs/backlog` with the same private job identity (`X-Visionary-Billing-Job`, timing-safe 64-hex `BILLING_RECONCILE_TOKEN`) returns **counts only** — `{dueAtLeast, dueBounded, quarantinedAtLeast, quarantinedBounded, sampledAt}` — bounded sampling with an explicit bound marker; no account identifiers, no PII.
6. **Private job identity**: both job entries (`jobs/reconcile`, `jobs/backlog`) require the reviewed reconciliation token; anonymous/garbage/length-mismatched tokens refuse 403 (existing timing-safe check, now covering both entries).

## Evidence: commands, results

| # | Check | Command | Result |
| --- | --- | --- | --- |
| 1 | Product + invitations typecheck, product/data/workspace/full-graph builds | `tsc -p tsconfig.product.json --noEmit` (clean) then emit builds | **all exit 0** (after fresh-worktree `npm ci` + `prisma generate`) |
| 2 | Billing suite with the new BILL-03 cases | `node --test tests/billing.test.cjs` | **27/27 pass** — 22 pre-existing (lease serialization, webhook atomicity, cancellation recovery, HTTP boundary) + 5 new: retry ladder with per-attempt backoff windows, quarantine at the ceiling, quarantine skip + webhook ladder reset, paged dispatch across 25 accounts (two pages), private-identity-only redacted backlog view, pre-claim failure ladder |
| 3 | Full backend battery | `node --test tests/*.test.cjs` | **112/113 pass**; the single failure is `privacycore.test.cjs` requiring a **Firestore loopback emulator** (`Explicit loopback emulator required; live fallback prohibited`) — an environment gate on untouched files, same class as the CI-side postgres service; the emulator is not installed on this workstation |

## Honest scoping

- This lane is **self-contained on dev**: it implements the JOB-01/02 dispatch semantics inside the billing module rather than importing the KAN-53/54/55 durable-job lanes (still in Testing, diverged base). When those lanes integrate, a follow-up can consolidate the primitives; until then the billing module owns its dispatch state exactly as it owns its leases today.
- The in-process 15s timer remains for local development only (`K_SERVICE` runs use the authenticated scheduled entry, unchanged); the paged dispatcher makes repeated invocations safe and resumable.
- Production-money capability is explicitly **not** claimed: BILL-01/02 (hosted deploy + real webhooks) and BILL-04..08, plus paid-launch acceptance, remain open. The dispatcher's behavior is proven against the in-memory transactional fixture and unit-level provider stubs only.

## Review handoff

Exact candidate SHA and suite counts are in the Jira review comment. Reviewer must be separate from this lane. Key files: `backend/upstream/backend/src/billing/billing.service.ts` (dispatch state, ladder, paged dispatcher, backlog), `billing.controller.ts` (jobs/backlog), `backend/tests/billing.test.cjs` (5 new cases), `backend/tests/fixtures/billing-memory.cjs` (Firestore-parity merge-set).
