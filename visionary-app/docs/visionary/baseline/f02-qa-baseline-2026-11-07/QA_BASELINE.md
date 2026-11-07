# F-02 QA baseline — command transcript (2026-11-07)

Environment: Node v22.23.3 · npm 10.9.9 · Windows 10.0.26100 x64 · Microsoft Edge 156.0.4314.58 (playwright channel msedge) · source beta 7657d1ed (f02 worktree from fresh origin/beta; F-01 merged at this SHA).

## Static battery (frontend root, after npm ci) — real exit codes

| Command | Result |
|---|---|
| npm ci | exit 0 (clean lockfile install) |
| npm run lint | exit 0 |
| npm run typecheck | exit 0 (jsconfig + tsconfig.domain) |
| npm test | exit 0 — 673/673 pass (663 on F-01 beta + 10 new harness self-tests) |
| npm run build | exit 0 (23.9s; dist emitted) |

## Harness self-tests (tests/harness-reliability.test.mjs) — 10/10

1. S03 missing QA_BROWSER_EXECUTABLE → BlockedEnvironmentError before any run.
2. S03 installed QA_BROWSER_EXECUTABLE → executablePath, no channel mix.
3. Default strategy = channel msedge (no Windows-only path default).
4. S05 non-empty evidence dir refused; artifacts untouched on refusal.
5. S05 allowed overwrite = clean slate (stale artifact removed).
6. S05 fresh dir created.
7. S04 preview never labeled hosted acceptance; firebase label still scoped.
8. Receipt provenance law: sha/timestamp/browser/viewport/route/role/locale/authMode.
9. S02 controlled failure: broken expectation → node --test exit nonzero, log kept; nested-run NODE_TEST_CONTEXT false-green sanitized (see below); broken syntax → node --check nonzero.
10. betaSha override + checkout SHA.

## Live browser proofs (preview-mode server http://127.0.0.1:4197, Edge 156.0.4314.58)

- S05 LIVE: `node scripts/release-gate.mjs` against the COMMITTED default dir without override → exit 1, "Evidence directory already holds … artifacts", committed artifacts untouched.
- S03 LIVE: `QA_BROWSER_EXECUTABLE=C:/definitely/missing/msedge.exe node scripts/release-gate.mjs` → exit 1, `code: 'BLOCKED_ENVIRONMENT'`, zero artifacts written.
- Release gate through the new launch/evidence wiring: `GATE_BASE_URL=http://127.0.0.1:4197 GATE_EVIDENCE_DIR=…/release-gate node scripts/release-gate.mjs` → RELEASE GATE PASS (5/5): route-sweep 27 routes/0 errors, keyboard skip-link, keyboard focus-visible, accessibility-spot 0/0, critical-navigation reached-dashboard.
- F-01 route review re-validated through the shared library: `ROUTE_REVIEW_EVIDENCE_DIR=…/route-review node scripts/route-direct-url-review.mjs` → ROUTE REVIEW PASSED (S01–S06), receipt header: betaSha 7657d1ed…, browser "Microsoft Edge via playwright-core (156.0.4314.58)", authMode "preview (local preview repository — NOT hosted acceptance)".

## Test coverage inventory (673 unit tests) and known-uncovered paths

- Covered: route contract (F-01), auth-return security laws, billing intents, workspace bootstrap/isolation, classroom/classwork services, curriculum, daily plan, ML presentation gates, payments/consent units, navigation presentation, continuity laws, scope inventory, harness reliability (new).
- Not covered by unit tests (documented boundary, covered by recorded browser harnesses when run): real Firebase round-trips (require the QA identities + live project; harnesses label this boundary), OS-level browser installation checks beyond the resolver (S03 is proven at the resolver + one live launch), performance budgets (separate cwv/lighthouse lanes).

## Nonexecuted / skipped register

- npm test: 0 skipped, 0 todo, 0 cancelled (663+10 all executed).
- No harness was skipped; release-gate and route-review were executed live in this baseline; device-visual-baseline/release-regression keep their recorded invocation paths (regression runner now sets ALLOW_EVIDENCE_OVERWRITE=1 for its child harnesses).

## Defects found & fixed in this task

- F-02-D1 (P2): 25 scripts carried a Windows-only CHROME_PATH default that playwright ignores; replaced in the wired harnesses with the documented QA_BROWSER_CHANNEL/QA_BROWSER_EXECUTABLE strategy (qa-env.mjs), keeping chrome-launcher's CHROME_PATH for lighthouse.
- F-02-D2 (P2): evidence directories were silently overwritten/mixed on rerun; openEvidenceDir guard + clean-slate override; battery runner passes the override as directory owner; hand-runs refuse.
- F-02-D3 (P2): receipts lacked provenance (SHA/browser/auth-mode); receiptMeta law added and wired.
- F-02-D4 (P2, infrastructure): inherited NODE_TEST_CONTEXT makes a nested `node --test` skip all files and exit 0 — a false green reproduced and documented; controlled-failure test sanitizes it.
- F-02-D5 (P3): QA credentials were non-overridable constants; now documented env overrides (no new secrets in Git).
