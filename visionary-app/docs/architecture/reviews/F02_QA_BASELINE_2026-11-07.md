# F-02 Engineering Receipt — QA baseline, harness reliability and truthful evidence law

Task: F-02 — Staff Frontend Test Infrastructure & Reliability Engineer (V5 specialist pack)
Date: 2026-11-07
Baseline beta SHA: 7657d1ed (fresh origin/beta; includes F-01)
Worktree/branch: `C:/Users/Administrator/nv-worktrees/f02-qa-baseline` · branch `zcode/f02-qa-baseline`
Governance: founder-authorized beta-only workflow; D-095 independent review remains PENDING (recorded, not self-approved).

## Inspected (active, read only)

`package.json`, `vite.config.js`, `eslint.config.js`, `jsconfig.json`, `tsconfig.domain.json`, all 41 `scripts/*.mjs` headers (launch/evidence patterns), `scripts/product-surface.mjs`, `qa-motion.mjs`, `qa-taps.mjs`, `release-gate.mjs`, `release-regression.mjs`, `device-visual-baseline.mjs`, `qa-session.mjs`, `lighthouse-audit.mjs` (chrome-launcher CHROME_PATH consumer), all 41 `tests/*.test.mjs` inventory, `../AGENTS.md`, `../docs/architecture/BRANCH_WORKFLOW.md`.

## Clean baseline reproduction (work package 1)

`npm ci` 0 · `npm run lint` 0 · `npm run typecheck` 0 · `npm test` 663/663 · `npm run build` 0 — on Node v22.23.3 / npm 10.9.9 / Windows 10.0.26100 x64 / Edge 156.0.4314.58. Recorded in `docs/visionary/baseline/f02-qa-baseline-2026-11-07/QA_BASELINE.md`.

## Defects found and fixed (each reproduced, then re-verified)

1. **F-02-D1 (P2) browser strategy:** 25 harnesses carried a Windows-only `CHROME_PATH` default that playwright ignores (launches use channel msedge); a missing browser produced cryptic playwright errors instead of a clear block. Fixed in the wired harnesses via `scripts/qa-env.mjs`: `QA_BROWSER_CHANNEL` (default msedge) / `QA_BROWSER_EXECUTABLE` (validated; missing → typed `BLOCKED_ENVIRONMENT` before any run, per-OS guidance). `lighthouse-audit.mjs` keeps its functional `CHROME_PATH` (chrome-launcher consumes it). Wired: release-gate, device-visual-baseline, route-direct-url-review.
2. **F-02-D2 (P2) evidence law (S05):** all 41 scripts `mkdir -p`'d their evidence dirs — silent overwrite and stale-artifact mixing. `openEvidenceDir` refuses non-empty dirs unless `ALLOW_EVIDENCE_OVERWRITE=1`, and an allowed overwrite is a clean slate. The battery runner (`release-regression.mjs`) sets the override for its own date-derived child dirs; hand-runs get the refusal (live-proven: exit 1 against the committed f15 dir, artifacts untouched).
3. **F-02-D3 (P2) receipt provenance (S04/package 6):** receipts lacked SHA/browser/auth-mode. `receiptMeta()` law: betaSha (+`QA_BETA_SHA`), timestamp, real browser build, viewport, route, role, locale, honest auth-mode label ("preview … NOT hosted acceptance"). Live receipt shows betaSha 7657d1ed…, Edge 156.0.4314.58, preview label.
4. **F-02-D4 (P2, infrastructure) nested-test false green (S02/package 5):** the controlled-failure proof itself caught that a nested `node --test` inheriting `NODE_TEST_CONTEXT=child` SKIPS all files and exits 0 — a reproduced false-green mechanism. The self-test sanitizes the env for nested runs; law documented in ENVIRONMENT.md.
5. **F-02-D5 (P3) credential override (package 8):** QA identities are documented `.test` fixtures; `QA_EMAIL`/`QA_PASSWORD`/`QA_ONBOARDING_EMAIL` env overrides added (no new secrets in Git).

## Self-tests and coverage

`tests/harness-reliability.test.mjs` — 10 assertions covering S02 (broken expectation fails nonzero + log kept; broken syntax fails `node --check`), S03 (missing binary BLOCKED_ENVIRONMENT; explicit binary resolves; default = channel), S04 (preview never labeled hosted), S05 (refusal + clean-slate + fresh-dir), receipt provenance, betaSha. Suite: **673/673 pass** (663 + 10).

## Live proofs (preview server 4197, Edge 156.0.4314.58)

- RELEASE GATE PASS 5/5 through the new wiring (route-sweep 27 routes/0 errors, keyboard skip-link + focus-visible, a11y spot 0/0, critical navigation).
- F-01 route review re-validated through the shared library: ROUTE REVIEW PASSED (S01–S06).
- S05 LIVE refusal exit 1 (committed dir untouched) · S03 LIVE BLOCKED_ENVIRONMENT exit 1 with zero artifacts.
- Controlled-failure log kept in the self-test evidence (temp) and the law recorded in QA_BASELINE.md.

## Boundary kept

No business feature changed to make tests green; no test disabled; no production data touched; no dev/main/deploy changes; no Jira actions.

## Integration

Candidate SHA: this commit. Merged non-force (fast-forward) into `beta` and pushed; post-merge smoke: harness-reliability suite + route contract rerun on the merged checkout. Reviewer: PENDING per D-095.

Final status: DONE_AND_VERIFIED_BETA
