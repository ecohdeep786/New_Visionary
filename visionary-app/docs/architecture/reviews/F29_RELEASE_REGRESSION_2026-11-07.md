# F-29 — End-to-end release regression (2026-11-07)

Jira key / source ID: F-29 (Visionary Frontend Agent task — end-to-end release regression)
Acceptance scope: enabler (test automation + quality lead; regression execution plus two
test-harness corrections — see F-29-F1/F-29-F2; no product change)
Implementer: ZCode agent (Test Automation + Quality Lead; lane completed by principal engineer)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f29-release-regression` / beta `700a630a` (F-28 landing)
Owned files: `frontend/scripts/release-regression.mjs` (new regression runner),
`frontend/scripts/auth-ui-review.mjs` (stale-harness correction), evidence directory, this receipt.

## Objective and method

Execute all critical public and internal user journeys, automated tests, visual comparisons and
integration checks — the entire validation suite accumulated across F-15..F-28 — in one
coordinated regression run against one preview-mode server, and record one receipt. Method:

1. **Inventory** — thirteen browser/static harnesses exist in `frontend/scripts/`: the F-16
   auth/onboarding review, the six role/integration journey harnesses (F-18 student, F-19
   teacher, F-20 parent, F-21 professional, F-22 organization, F-23 cross-role), the F-24
   contract audit, the F-25 ML-experience review, the F-26 payments/consent review, the F-27 CWV
   audit, the F-28 a11y/security review, and the F-15 release gate. Each harness writes into its
   own committed baseline directory by default; the new `release-regression.mjs` runner redirects
   every harness into the F-29 evidence tree (`docs/visionary/baseline/f29-release-regression-2026-11-07/<harness>/`)
   so committed lane baselines stay untouched, executes them sequentially (one browser at a
   time), and writes `regression-receipt.json` with per-harness exit codes and output tails.
   CWV is deliberately measured against the production build (`vite preview`, `REG_PREVIEW_URL`,
   default :4199) — the dev server serves un-bundled modules and throttled numbers are
   meaningless against it.
2. **First run → diagnosis** — the initial execution returned 11/13 with two failures, both
   diagnosed as stale test automation, not product regressions (F-29-F1, F-29-F2 below).
3. **Corrections + full clean re-run** — after the two harness corrections, the full suite
   re-ran end-to-end: **13/13 PASS** in one sequential run.

## A. Regression results (final clean run)

| Harness (origin) | Result | Evidence |
| --- | --- | --- |
| auth-ui (F-16) | PASS — 19 records, 0 checks failed | `auth-ui/` |
| student (F-18) | PASS — 16 records, 0 defects | `student/` |
| teacher (F-19) | PASS — 21 records, 0 defects | `teacher/` |
| parent (F-20) | PASS — 16 records, 0 defects | `parent/` |
| professional (F-21) | PASS — 12 records, 0 defects | `professional/` |
| organization (F-22) | PASS — 39 records, 0 defects | `organization/` |
| cross-role (F-23) | PASS — 37 records, 0 defects | `cross-role/` |
| ml-experience (F-25) | PASS — 27/27 checks, 0 defects | `ml-experience/` |
| payments-consent (F-26) | PASS — 29/29 checks, 0 defects | `payments-consent/` |
| cwv (F-27, production build) | PASS — FCP 2.4–2.6 s, LCP 3.0–3.9 s, CLS ≤0.068, TBT ≤219 ms under the mobile throttle profile | `cwv/` |
| a11y-security (F-28) | PASS — 24/24 checks, 0 defects | `a11y-security/` |
| contract-audit (F-24) | PASS — 30 calls / 28 matched / 2 recorded deps / 0 unexpected | `contract-audit/` |
| release-gate (F-15) | **RELEASE GATE PASS 5/5** (route-sweep 27, skip-link, focus-visible, a11y-spot 0/0, critical-navigation) | `release-gate/` |

## B. Findings

**F-29-F1 (P3 fixed, stale harness):** `auth-ui-review.mjs` (the F-16 harness) failed against the
current register flow — its `registerAccount` helper predated the terms checkbox the flow now
requires, so the "Create account" submit stayed disabled (58 click retries, timeout). The newer
harnesses (F-25/26/28) already handle the checkbox. Corrected by adding the checkbox check to the
register helper; the harness then passed (19 records, 0 failed). A test-automation gap, not a
product regression — the register flow itself is exercised correctly by four other harnesses and
the release gate.

**F-29-F2 (P3 fixed, runner env mismatch):** the regression runner first passed the CWV audit the
wrong env name (`CWV_BASE_URL`; the script reads `CWV_URL`) and, with the default target
(:4199) absent, the audit failed on connection-refused. Corrected in the runner (both env names
set per harness) and by giving the cwv entry an explicit production-preview base
(`REG_PREVIEW_URL`, default :4199). Measured against the dev server the CWV numbers are
meaningless (un-bundled modules: FCP ~26 s) — the runner now measures the production build
exclusively, and the production numbers confirm the F-27 post-fix state (LCP 3.0–3.9 s).

**F-29-F3 (INFO, regression posture):** all six role journeys, the three-account cross-role
integration, the contract cross-reference, the ML honesty laws, the payments/consent trust laws,
the CWV receipts, the a11y/security validation and the release gate are green against one
checkout (`700a630a` + the two harness corrections). Total live records across the suite:
~250 records / 175+ individual checks / 0 product defects. The suite runs sequentially in ~13
minutes on a warm server (`release-regression.mjs`), giving future lanes a one-command full
regression pass.

**No product defects found. No product change.**

## C. Verification results (this run)

| Check | Result |
| --- | --- |
| Regression suite (`node scripts/release-regression.mjs`) | **13/13 harnesses PASS** in one sequential run (final clean run; first run 11/13 with both failures diagnosed as stale test automation and corrected within this lane) |
| Full battery | **PASS — all 10 stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0; qa:perf PASS (153 chunks, deterministic F-28 budget holds — no re-record needed); qa:taps PASS (243/126, 3 exceptions); qa:motion PASS (439); qa:continuity PASS; `npm run check` exit 0 |
| Release gate | **RELEASE GATE PASS 5/5** (ran inside the suite against the preview-mode dev server per F-24-F8; evidence in the F-29 tree) |
| CWV (production build) | FCP 2.4–2.6 s / LCP 3.0–3.9 s / CLS ≤0.068 / TBT ≤219 ms — consistent with the F-27 post-fix state |

## D. Backend / ML dependencies

None new. The suite's live verification remains bounded by the recorded environment dependencies
(firebase-mode billing/auth, connected ML adapters — hosted acceptance gates per CONTRACT_GAPS and
prior receipts).

## E. Remaining issues and risks

- **F-28-F3 / F-27-F3 (P2, open)**: the landing carousel pager target-size regression remains the
  one known red in the broader tooling (Lighthouse FAP-31 baseline on `/`); needs a UI-scoped
  `ProgressDots` fix lane. It does not affect the release gate or any journey harness.
- The regression runner assumes the dev server (:4198) and production preview (:4199) are up;
  a future nicety would let it spawn both. Documented in the script header.
- Harnesses register fresh accounts per run (preview store growth is bounded by the per-context
  browser profile; nothing accumulates in the repo).

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f29-release-regression` on `zcode/f29-release-regression` = beta
`700a630a` + `frontend/scripts/release-regression.mjs` + `frontend/scripts/auth-ui-review.mjs`
(terms-checkbox correction) + evidence + this receipt. No product source change. Junction-based
node_modules runtime arrangement (nothing committed). Worktree removed after the beta landing per
the operator's standing instruction; branch retained pushed for review.

## G. Review handoff

```
Jira key / source ID: F-29
Acceptance scope: enabler (end-to-end release regression) + two test-harness corrections
Implementer: ZCode agent (Test Automation + Quality Lead; lane completed by principal engineer)
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f29-release-regression / 700a630a / <receipt commit>
Owned files: frontend/scripts/release-regression.mjs; frontend/scripts/auth-ui-review.mjs (checkbox correction); docs/visionary/baseline/f29-release-regression-2026-11-07/ (13 harness evidence dirs + regression-receipt.json); this receipt
Verification: 13/13 harnesses PASS in one sequential run (auth-ui 19 records, student 16, teacher 21, parent 16, professional 12, organization 39, cross-role 37, ml 27/27, payments 29/29, cwv production FCP 2.4-2.6s LCP 3.0-3.9s, a11y 24/24, contract audit 30/28/2/0, RELEASE GATE PASS 5/5); battery all 10 stages exit 0 (653/653)
Findings: F-29-F1 P3 fixed stale auth-ui harness (terms checkbox); F-29-F2 P3 fixed runner env mapping + cwv production target; F-29-F3 INFO full regression posture green (0 product defects); carried open item: F-27/F-28-F3 landing pager target-size (UI lane)
Reviewer decision: pending
Dev integration commit: pending
```
