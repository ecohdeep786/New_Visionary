# Backend/ML launch-readiness map — 12 delivered engineering halves + open gates

9 November 2026. One-sitting view of the backend/ML lane's delivered evidence and
what remains owned elsewhere. Every branch below is pushed, receipt-recorded, and
awaiting the single D-095 reviewer (see BACKEND_ML_REVIEWER_MERGE_ORDER_2026-11-09.md
for the merge order and mechanical conflicts).

## Delivered engineering (all in Jira Testing, all gates green at their heads)

> **2026-11-09 reviewer-corrector pass COMPLETE:** every branch below has been
> independently reviewed, re-tested end-to-end at its head, corrected (the only
> change: the `[REVIEWER-PREP]` data-04 rolling-clock fix, committed on the ten
> later branches; kan-102/103 predate that test) and finalized — clean worktree,
> pushed, in sync. Tips below are the FINALIZED heads.

| Task | Branch tip | What the engineering half proves | Proof re-run at head (reviewer pass) |
|---|---|---|---|
| BILL-01 · kan-102 | `5373b268` | Canonical HTTPS-ingress local-maximum acceptance over the real production `configureProductionHttp` (TLS terminator, `__Host-` cookies, Origin/CSRF) | `billing:ingress:check` protocol 11/11 + browser journey 7/7; check 0 — no corrections |
| BILL-02 · kan-103 | `0eb757a9` | Webhook acceptance: raw-bytes HMAC, limits, duplicate/reordered/late/refund/dispute, reconciliation after full restart, self-test-fail exits 1 | `billing:webhook:acceptance` 8/8 + BILL-01 regression 11/11; check 0 — no corrections |
| BILL-06 · kan-107 | `23b2cce8` | Immutable write-once invoices, exact refunds (per-payment ledger), no invented legal fields | billing suites 71/71; production-check 111/11/37/52 exit 0; check 0 (data-04 fix pre-existing `61ecc15e`) |
| BILL-07 · kan-108 | `a85acd34` | Explicit separate live mode: fail-closed double opt-in, namespace isolation, no startup provisioning, mode-truthful views | `billing:live:mode` 11/11; production-check 113/11/37/52 exit 0; check 0; npm test 672/672 |
| ACCEPT-01 · kan-117 | `c92f9820` | Released journey chain rehearsal (pricing→auth→onboarding→Free→subscription→invoice→learning→project→second-device) incl. failure states; REAL SQL workspace | `accept:journey` 11/11; data:check 0; check exit 0 |
| ACCEPT-07 · kan-123 | `42b08be6` | Migration cutover rehearsal: originals retained, canary→full backfill owner-faithful, forward-only rollback, exactly one executor | rehearsal 10/10; data:check 0; check 0 |
| RELEASE-01 · kan-124 | `b5771920` | Workload distributions replace D-075 guesses; counting laws + fail-closed beta provenance; bridge into the cost engine | `workload:test` 10/10 + `cost:test` 10/10; data:check 0; check 0 |
| RELEASE-02 · kan-125 | `1f3343d3` | Realistic load/soak vs documented rates: core 150/s & 16.7 AI runs/s sustained, degradation = typed 503s only | `release:load:soak` PASS; data:check 0; check 0 |
| RELEASE-03 · kan-126 | `f9ef880e` | Enforced admission ceilings + tenant fairness + provider circuit breaker; typed 429/503 with Retry-After; fail-closed dependency degradation | `release:admission` 18/18 (9 + 9); data:check 0; check 0 |
| RELEASE-04 · kan-127 | `6d831a79` | Enforced spend admission (fail-closed cap, typed 503, not alert-only) + per-completed-task economics model | `release:economics` 14/14 (6 + 8); production-check 102/11/37/52; check 0 (data-04 fix pre-existing `20cf2bbf`) |
| RELEASE-05 · kan-128 | `f2a6e4ce` | Restore drills: SQL corruption restore (independent db), deletion replay, rollback, Firestore restore, reconnect+reconcile vs RPO/RTO | `release:restore:drill` 5/5; data:check 0; webhook PASS; check 0 |
| RELEASE-06 · kan-129 | `40824fe8` | Release-path security: upstream-patch hash law, lockfile pin law, secret-surface law, LIVE secret rotation, advisory DB executed | `release:security:review` 5/5; data:check 0; webhook PASS; restore 5/5; check 0 |

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
