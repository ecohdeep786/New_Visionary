# KAN-102 / BILL-01 — canonical HTTPS-ingress acceptance (local-maximum)

7 November 2026 · D-109 · implementer: backend/ML lane (`zcode/kan-102-bill01-ingress-acceptance`, based on verified dev `6cbf958b`) · runbook: [BILL01_INGRESS_ACCEPTANCE.md](../delivery/BILL01_INGRESS_ACCEPTANCE.md) · **reviewer: pending per D-095**

## Task

BILL-01 (KAN-102, phase P09): *deploy and accept the existing test runtime on canonical HTTPS ingress; verify real auth return, cookies and real test-merchant checkout with durable storage and a second device.*

## Board-state decision record

No live Jira connector was available in this session; the board was reconstructed from `docs/architecture/tracking/` snapshots, remote branch inventory and `origin/dev` merge history, and the task selection was confirmed with the founder (2026-11-07): every unclaimed To Do task (BILL-01/02/06/07, ACCEPT-01/02/04/05/07/08, RELEASE-01..08, KAN-163/164) is a hosted/commercial/acceptance gate; ~81 tasks sit in Testing with pushed branches awaiting the single reviewing engineer (KAN-42 merged 2026-11-07 15:30 UTC; KAN-43 reconciliation in flight; KAN-60 repaired by the principal lane 2026-11-04 after the 31-Oct rejection). The founder chose the BILL-01 local-maximum path: build everything implementable locally now, record the hosted slices as exact external gates.

## Implementation

New files (no product source changed — the runtime is accepted, not modified):

- `backend/tests/contracts/bill-01/stack.cjs` — acceptance stack: environment guards (typed `BLOCKED_ENVIRONMENT` with next-step guidance), isolated emulator configuration (generated per-run demo-project `firebase.json`/`.firebaserc`/rules — never the repository's live-project config), Firebase Auth + Firestore emulator lifecycle (npx-pinned firebase-tools 15.33.0; JRE discovered; whole-tree Windows teardown), the **real production composition** (`configureProductionHttp`) over the **real controllers/services** with the authorized emulator identity plane, a **real TLS terminator** (openssl-minted cert, loopback:443) on the canonical origin, fixture-only control plane on a separate loopback port (never under `/api`), fictional Razorpay provider (zero network) with real-test-key seam (`BILL01_RAZORPAY_*`), and the driver-side HTTPS client pinned to the canonical hostname.
- `backend/tests/contracts/bill-01/bill01-ingress-acceptance.test.mjs` — the registered protocol suite (11 tests + fail-fast self-test law).
- `backend/tests/contracts/bill-01/bill01-browser-journey.mjs` — the real-browser journey (Edge/playwright-core, 7 checks).
- `scripts/billing-ingress-check.mjs` + registered `npm run billing:ingress:check` — the fail-fast registered runner.
- `docs/architecture/delivery/BILL01_INGRESS_ACCEPTANCE.md` — runbook: proven surface, recorded deviations, the two external gates with exact procedures.

## Verification (exact commands and results)

- `npm run backend:build` — exit 0.
- `npm run billing:ingress:check` — exit 0: protocol suite 11/11 pass (+1 skipped self-test) and browser journey 7/7 checks.
- Fail-fast law: `BILL01_SELF_TEST_FAIL=1 npm run billing:ingress:check` — deliberate assertion failure → suite fails → command exits 1 (law proven, per the KAN-60 review lesson that unregistered/skippable suites are not evidence).
- What the suite proves is itemized in the runbook (canonical origin/CSRF enforcement, wire-parsed `__Host-` cookie attributes, verified-identity admission, auth return + onboarding, fixture-provider checkout/verify/invoice/cancel journey, independent Firestore REST durability reads, export/import restart with fail-closed revoked cookies + fresh-sign-in recovery of the paid state, two-device isolation with logout/logout-all, production security-header surface).
- Browser-enforced cookie law (Edge, host-resolver-rules pinning `visionary.org.in` → loopback): cookies stored/applied by the real engine, HttpOnly invisible to page script, cross-site request provably carries none of the session cookies (request interception), two contexts = two devices, device-scoped logout enforced in-browser.

## External gates (recorded, not simulated)

1. **Real test-merchant checkout** — needs the founder-supplied Razorpay test-key CSV on this machine; the exact procedure (configure-test script, ignored config, `BILL01_RAZORPAY_*` seam) is in the runbook. No keys exist here; none were invented.
2. **Hosted canonical ingress deployment** — owner-run per `infrastructure/gcp/README.md` with the reviewed KAN-45 platform config; deployment is outside this lane's authority and was not performed.

## Status language

`IMPLEMENTED_PENDING_REVIEW` for the local-acceptance scope. The task does **not** move to Testing as fully satisfied: the hosted slices remain external gates. Per the founder's chosen path, the task moves to Testing only when the founder explicitly accepts the local-acceptance scope with the hosted slices open, or when the gates can run. No dev/main/production change was made; no reviewer signoff is claimed.
