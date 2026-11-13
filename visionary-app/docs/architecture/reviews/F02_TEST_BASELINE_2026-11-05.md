# F-02 — Automated test baseline (2026-11-05)

Jira key / source ID: F-02 (Visionary Frontend Agent task — automated test baseline)
Acceptance scope: enabler (test baseline evidence; no product change)
Implementer: OpenCode agent (Test Automation Engineer specialist)
Reviewer: pending — independent Codex review required (D-095; implementer cannot approve own work)
Worker branch / base commit / candidate head commit: `opencode/f02-test-baseline` / beta `8900511e` / candidate head = this receipt commit
Current beta commit at baseline time: `8900511e` (KAN-35 parser hotfix + F-01 frontend audit receipt)
Owned files, contracts and migrations: this receipt only. No source, test, config, contract or migration file changed in this lane.
Prerequisites: local Firebase auth service on `127.0.0.1:3001` (backend `.env` with production project credentials), Vite dev server on `127.0.0.1:4197`, Firebase emulator on `:8080`.

## Objective and scope

Run the existing build, lint, typecheck, tests and QA scripts on the reference content and record the
results without hiding failures (task instruction: audit-only; no broad implementation).

## Environment

- Windows, Node `v24.19.0`, npm project `visionary-app/frontend` (748 packages, `npm ci` from the committed lockfile).
- App served by Vite dev on `http://127.0.0.1:4197` (the QA scripts' default base, `DESIGN_REVIEW_URL` override honored).
- Local auth-session API on `127.0.0.1:3001` (`npm run backend:auth:dev`; requires the ignored backend `.env`), Firebase emulator on `:8080`.
- Browser drivers: `playwright-core`/`puppeteer` from the frontend package; puppeteer Chromium cache present on the host.

## Verified results (this run)

| # | Command (frontend package) | Result | Evidence |
|---|---|---|---|
| 1 | `npm test` (`node --test --test-concurrency=2 tests/*.test.mjs`) | **PASS — 653 tests, 653 pass, 0 fail** (77.7 s) | run log, exit 0 |
| 2 | `npm run lint` (`eslint . --quiet`) | **PASS** (exit 0, no output) | run log |
| 3 | `npm run typecheck` (`tsc -p jsconfig.json && tsc -p tsconfig.domain.json`) | **PASS** (exit 0) | run log |
| 4 | `npm run build` (`vite build`) | **PASS — exit 0, built in 38.51 s**, 145 assets / 937 kB gzip (vendor 587.19 kB / 166.90 kB gzip) | build log |
| 5 | `npm run check` (layout + import provenance + frontend checks) | **PASS** (exit 0; frontend suite re-ran 653/653) | run log |
| 6 | `npm run qa:taps` | **PASS — tap law holds** (243 interactive controls in 126 files; 5 pseudo hit-unions ≥44px; 3 recorded exceptions) | `docs/visionary/baseline/…` + log |
| 7 | `npm run qa:motion` | **PASS — motion law holds** (440 motion-bearing source files scanned) | log |
| 8 | `npm run qa:continuity` | **PASS — all recorded public-surface laws pass** | log |
| 9 | `npm run qa:design` | **BLOCKED — QA UI login could not complete** (`The QA login could not complete in two attempts`, `design-quality-review.mjs:49`) | log, see finding F-02-F1 |
| 10 | `npm run qa:navigation` | **NOT RUN** — same login-dependent harness as #9; stopped behind the failed chain stage | — |
| 11 | `npm run qa:fonts` | **NOT RUN** — same login-dependent harness as #9 | — |

Green stages were gated by process exit codes (a stage only advanced the chain on `exit 0`); failures are
recorded exactly as observed, not suppressed.

## Findings

**F-02-F1 (P1, baseline completeness / environment): the login-dependent QA batteries cannot complete in this run environment.**
`qa:design` (and the `qa:navigation`/`qa:fonts` stages chained behind it) signs in through the real login UI
with the QA account (`qa.designer@example.test`) before auditing authenticated surfaces. In this run:
- the dev server on `127.0.0.1:4197` was up and served the app shell, and the login route rendered after a
  warm reload;
- the auth-session API on `127.0.0.1:3001` was up **with** the ignored backend `.env` (production Firebase
  project + admin credentials), Firebase emulator on `:8080` was up;
- the automation still ended on `/login` with an empty `visionary_workspace_v2.active` after two attempts,
  and a console `401 Unauthorized` was observed at the session boundary;
- the in-app browser also intermittently received a hung `Loading…` shell from the fresh dev server
  (Vite first-load dependency optimizer), which is consistent with a harness timing/environment cause
  rather than a product regression.
This content is identical to beta `2cbc89eb` plus docs/merged infrastructure files; the same content's
login-dependent batteries were recorded green at F-01 (`29fa3f8e`, all seven QA batteries PASS) and at
FAP-67 (`a40a2e10`, design/navigation/fonts PASS). **Action:** re-run `qa:design`, `qa:navigation`,
`qa:fonts` in a pre-warmed session (dev server + auth API + emulator ready, login route pre-loaded) or in
CI with the same service bring-up; do not treat this as a passing baseline for authenticated surfaces.

**F-02-F2 (P2, runbook gap): QA battery service preconditions are undocumented in one place.**
The scripts assume three local services (`:4197` app, `:3001` auth-session API with backend `.env`,
`:8080` emulator) and a warm Vite dependency cache. Cold starts fail the login step. **Action:** record a
single documented bring-up sequence (services → warm login route → batteries) in the QA runbook.

**F-02-F3 (P3, observed, pre-existing): React `fetchPriority` prop warning on the landing hero.**
`NewPersona.jsx` passes `fetchPriority` to a DOM `<img>`; React logs an error-level warning in dev builds.
Not introduced by this lane; record for a future hygiene fix.

## Backend / ML dependencies

The baseline used the local auth-session service only as a runtime dependency of the UI sign-in harness
(no backend/ML source changed, no endpoint invented). Dashboard fixtures remain the product's existing
`not_connected` fixtures — no ML outputs were assumed.

## Remaining issues and risks

- Authenticated-surface QA (`qa:design`, `qa:navigation`, `qa:fonts`) is BLOCKED this run (F-02-F1); the
  baseline is verified for tests, lint, both type checks, production build, `check`, taps, motion and
  continuity only.
- The workspace artifact churn left by the prior partial run (regenerated fixture UUIDs/timestamps and
  re-encoded baseline screenshots) was reverted rather than committed, because the current run did not
  regenerate them itself; the committed baseline evidence from the last verified full run remains authoritative.

## Worktree and change summary

`opencode/f02-test-baseline` = beta `8900511e` + this receipt. No source diff. Worktree removed after the
beta landing per the operator's instruction; branch retained for review.

## Codex review handoff

```
Jira key / source ID: F-02
Acceptance scope: enabler (test baseline)
Implementer: OpenCode agent
Reviewer: pending (Codex)
Worker branch / base commit / candidate head commit: opencode/f02-test-baseline / 8900511e / <receipt commit>
Owned files: docs/architecture/reviews/F02_TEST_BASELINE_2026-11-05.md
Commands, exit codes, test counts: see table above (653/653 tests; lint/typecheck/build/check exit 0;
qa:taps, qa:motion, qa:continuity PASS; qa:design blocked — F-02-F1)
Remaining defects: F-02-F1 (login-dependent batteries blocked this run), F-02-F2 (runbook), F-02-F3 (fetchPriority warning)
Reviewer decision: pending
Verification result: pending
Dev integration commit: pending
Jira transition/comment receipt: pending
Next dependent task: F-03 visual/device baseline — requires the resolved sign-in bring-up from F-02-F1
```
