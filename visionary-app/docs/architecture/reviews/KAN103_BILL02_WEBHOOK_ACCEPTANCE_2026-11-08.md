# KAN-103 / BILL-02 — Payment Webhook Acceptance Receipt

**Date:** 2026-11-08 (work started 2026-11-07)
**Lane:** zcode backend/ML specialist lane (founder-assigned)
**Branch:** `zcode/kan-103-bill02-webhook-acceptance` (worktree `nv-worktrees/kan-103-bill02`, stacked on `zcode/kan-102-bill01-ingress-acceptance` @ `5373b268`, which is based on `origin/dev` @ `4bb3c22d`)
**Reviewer:** pending per D-095 — this receipt is submitted evidence, not a merge approval.
**Status:** WEBHOOK ACCEPTANCE COMPLETE — the Razorpay-registered webhook endpoint and provider-sent test events remain the operator's external gate.

## Task

Register actual test webhooks after an ingress exists, preserve raw signed
bytes/limits, and prove duplicate/reordered/late/refund/dispute notifications
and reconciliation after restart.

## Claim verification (before starting)

- KAN-119 (ACCEPT-03) and KAN-122 (ACCEPT-06) — the other zero-blocker local
  tasks — are CLAIMED by the principal lane (`codex/principal-kan-119-deny-matrix`,
  `codex/principal-kan-122-build-purity`); not touched.
- KAN-103 has NO local or remote branch from any lane; zero blockers
  (`blockedBy: []`); next-in-sequence unclaimed (planningOrder 99, after
  BILL-01 @ 98 and the deepseek-claimed BILL-03/04/05/08).
- The webhook HANDLER already existed on `dev` (`billing.service.ts` webhook +
  reconciliation queue); the missing piece was the acceptance evidence — built
  here without changing any product source.

## What was delivered

- `backend/tests/contracts/bill-02/bill02-webhook-acceptance.test.mjs` — 8
  tests + the deliberate-failure self-test law proof (green with
  `BILL02_SELF_TEST_FAIL=1` exiting nonzero).
- `scripts/billing-webhook-acceptance.mjs` + `npm run billing:webhook:acceptance`
  — env-guarded registered command (typed `BLOCKED_ENVIRONMENT` + guidance).
- Additive BILL-01 harness extensions (`backend/tests/contracts/bill-01/stack.cjs`):
  `BILLING_RECONCILE_TOKEN` in the fixture config, caller-supplied provider
  state (restart durability), raw-Buffer ingress support (exact signed bytes),
  fixture `/fixture/refund-payment` + `/fixture/billing` probes.
- `docs/architecture/delivery/BILL02_WEBHOOK_ACCEPTANCE.md` — the runbook
  (proven laws, how to run, the two external gates, boundaries).
- `backend/README.md` — D-111 registration paragraph.

## Evidence (green runs, 2026-11-08)

| Proof | Result |
| --- | --- |
| Provider-shaped webhook (no origin/cookies/CSRF) | 201, durably recorded |
| Tampered signature / missing event id / malformed / oversize | 403 / 400 / 400 / 413 |
| Duplicate delivery, identical signed bytes | acknowledged idempotently; adjustment queued exactly once |
| Same event id, different bytes | 409 conflict, zero state change |
| Reordered/late/unmapped notifications | recorded `unmapped`, no account touched, nothing invented |
| Mapped refund → scheduled reconciliation | invoice → `partially_refunded`, `amountRefunded` = provider-confirmed 10000 |
| Dispute notification | re-check queued; refund state NOT fabricated |
| Reconciliation job credential | missing/wrong token → 403 |
| FULL product restart with queued adjustment | adjustment survives (durable queue + provider-held state); reconciles to `refunded` 29900 after restart |
| Fail-fast law | `BILL02_SELF_TEST_FAIL=1` → command exit 1 |

## Gates (this branch)

- `npm run billing:webhook:acceptance` — exit 0 (8/8).
- `BILL02_SELF_TEST_FAIL=1 npm run billing:webhook:acceptance` — exit 1 (law proof).
- BILL-01 protocol suite regression — exit 0 (11/11) with the edited harness.
- `npm run backend:build` — exit 0.
- `npm run check` — exit 0 (lint + typecheck + frontend build + SCOPE-06 runtime).
- `npm test` — 672/672 (dev-base suite; the BILL-01/BILL-02 suites run via their
  registered commands, mirroring how `billing:ingress:check` is registered).

## Honest findings recorded during the acceptance

1. **The webhook/jobs routes intentionally bypass browser CSRF/session
   authority** (`ProductRequestAuthority.csrf` is not applied) — provider and
   job callers authenticate by HMAC signature and 64-hex job token instead.
   The acceptance proves the bypass is exactly scoped: everything else on the
   controller keeps the browser authority.
2. **The reconciliation read-back is provider-sourced by law**: a webhook
   never writes refund state; it only queues a re-check whose outcome comes
   from the provider's records (`amount_refunded`), so a forged event cannot
   fabricate a refund.
3. **The 30-second sync throttle** after a verify-time sync means
   webhook-triggered reconciliation can defer up to ~30s — the recorded
   product cadence; the suite waits rather than bypasses.
4. **Restart durability depends on provider-held state**: the fixture's
   provider state is caller-supplied so a full product restart mirrors the
   hosted topology (the provider's records live outside the app process).

## External gates / boundaries

- The Razorpay-registered webhook URL + dashboard test events, and real
  provider-sent refund/dispute events, are owner/operator actions on hosted
  infrastructure (procedures in the runbook).
- No live project, credential, provider network call or production record is
  touched by this suite.
- Jira transition to Testing is NOT performed in this session (no connector);
  reviewer pending per D-095.
