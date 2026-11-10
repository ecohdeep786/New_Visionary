# Backend/ML launch-readiness map — 12 delivered engineering halves + open gates

9 November 2026. One-sitting view of the backend/ML lane's delivered evidence and
what remains owned elsewhere. Every branch below is pushed, receipt-recorded, and
awaiting the single D-095 reviewer (see BACKEND_ML_REVIEWER_MERGE_ORDER_2026-11-09.md
for the merge order and mechanical conflicts).

## Delivered engineering (all in Jira Testing, all gates green at their heads)

| Task | Branch tip | What the engineering half proves | Proof at head |
|---|---|---|---|
| BILL-01 · kan-102 | `5373b268` | Canonical HTTPS-ingress local-maximum acceptance over the real production `configureProductionHttp` (TLS terminator, `__Host-` cookies, Origin/CSRF) | `billing:ingress:check` protocol 11/11 + browser journey 7/7 |
| BILL-02 · kan-103 | `0eb757a9` | Webhook acceptance: raw-bytes HMAC, limits, duplicate/reordered/late/refund/dispute, reconciliation after full restart, self-test-fail exits 1 | `billing:webhook:acceptance` 8/8 + BILL-01 regression 11/11 |
| BILL-06 · kan-107 | `23b2cce8` | Immutable write-once invoices, exact refunds (per-payment ledger), no invented legal fields | billing suites 71/71; production-check 111/11/37/52 exit 0 |
| BILL-07 · kan-108 | `7e09ac54` | Explicit separate live mode: fail-closed double opt-in, namespace isolation, no startup provisioning, mode-truthful views | `billing:live:mode` 11/11 + legacy 62/62; production-check 113/11/37/52 exit 0 |
| ACCEPT-01 · kan-117 | `20a3652e` | Released journey chain rehearsal (pricing→auth→onboarding→Free→subscription→invoice→learning→project→second-device) incl. failure states; REAL SQL workspace | `accept:journey` 11/11; check exit 0 |
| ACCEPT-07 · kan-123 | `3b61b4dd` | Migration cutover rehearsal: originals retained, canary→full backfill owner-faithful, forward-only rollback, exactly one executor | cutover 24/24; npm test 672/672 |
| RELEASE-01 · kan-124 | `38a7030b` | Workload distributions replace D-075 guesses; counting laws + fail-closed beta provenance; bridge into the cost engine | `workload:test` 10/10 + `cost:test` 10/10 |
| RELEASE-02 · kan-125 | `b9e35982` | Realistic load/soak vs documented rates: core 150/s & 16.7 AI runs/s sustained, degradation = typed 503s only | `release:load:soak` 10/10 |
| RELEASE-03 · kan-126 | `311171e2` | Enforced admission ceilings + tenant fairness + provider circuit breaker; typed 429/503 with Retry-After; fail-closed dependency degradation | `release:admission` 18/18 (9 + 9) |
| RELEASE-04 · kan-127 | `6d831a79` | Enforced spend admission (fail-closed cap, typed 503, not alert-only) + per-completed-task economics model | `release:economics` 14/14 (6 + 8); production-check 102/11/37/52 |
| RELEASE-05 · kan-128 | `033eadfb` | Restore drills: SQL corruption restore (independent db), deletion replay, rollback, Firestore restore, reconnect+reconcile vs RPO/RTO | `release:restore:drill` 5/5 |
| RELEASE-06 · kan-129 | `53cc0298` | Release-path security: upstream-patch hash law, lockfile pin law, secret-surface law, LIVE secret rotation, advisory DB executed | `release:security:review` 5/5; advisories 2 critical → 1 (residual = deprecated bull/tar chain) |

## Remaining gates — owned elsewhere (each verified against its ticket)

**Unlocked by the D-095 merge (surfaces appear in `dev`):**
- **ACCEPT-02 (kan-118)** — classroom/assignment/submission/guardian/professional
  command routes DO NOT exist in dev today (they live on the unmerged classroom
  Testing branches kan-93…99). When those merge, the teacher→learner→review→share
  journey rehearsal becomes the lane's next build.
- **ACCEPT-04 (kan-120)** — degraded states. Provider/duplicate/reordered/interrupted-
  worker/cancel pieces are already connected-proven (RELEASE-03/BILL-02/RELEASE-05/
  ACCEPT-01); object-storage outage + invalid uploads need the upload/Build surfaces
  (unmerged kan-56/57/58).

**Owner/decision/human/frontend gates (not backend-lane implementable):**
- **ACCEPT-05 (kan-121)** — real device/keyboard/screen-reader/mobile QA (hardware).
- **RELEASE-07 (kan-130)** — production config acceptance + controlled cohort
  (owner decision; "dates cannot authorize deployment or live money").
- **RELEASE-08 (kan-131)** — growth expansion after measured gates (owner decision).
- **ACCEPT-08 (kan-157)** — controlled human educational pilot.
- **LEARN-09/10 (kan-163/164)** — hosted feature gates whose dependencies (concept
  graph KAN-144, UI→API→store read-back, main-only visionary-research production)
  are unmet/unmerged. Note: the AI dispatch (agents/orchestrator/content-agent) is
  in the source tree but NOT composed into `FirebaseProductModule`; wiring it is a
  new-surface feature decision, not a release-gate rehearsal.

## Standing truthfulness note

Every delivered evidence record states its boundary: local proofs never close a
hosted/provider/load/privacy/commercial/merchant gate. The BILL-01 local-maximum
doctrine is applied throughout; no real money, live provider call, or invented
"measured this deployment" number is claimed anywhere.
