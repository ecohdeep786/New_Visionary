# Frontend QA environment — prerequisites and command law (F-02)

How to run the frontend checks and browser harnesses reproducibly, and what
each result honestly means. Recorded environment for the 2026-11-07 baseline:
Node v22.23.3, npm 10.9.9, Windows 10.0.26100 x64, Microsoft Edge
156.0.4314.58 (playwright channel `msedge`), source `beta` 7657d1ed.

## One-command static battery (no secrets, no browser needed)

From `visionary-app/frontend/` after `npm ci`:

```bash
npm ci            # clean install from the lockfile
npm run lint      # eslint . --quiet
npm run typecheck # tsc -p ./jsconfig.json && tsc -p ./tsconfig.domain.json
npm test          # node --test tests/*.test.mjs (deterministic, ~30s)
npm run build     # vite build
```

All five must exit 0. `npm test` includes the F-02 harness self-tests
(`tests/harness-reliability.test.mjs`), which prove the S02/S03/S04/S05 laws:
a deliberately broken expectation fails the runner nonzero (with its failure
log kept), a missing browser binary is `BLOCKED_ENVIRONMENT` instead of a
false PASS, preview-mode receipts are never labeled hosted acceptance, and a
run refuses to overwrite existing evidence artifacts.

**Nested-test law:** a process inside `node --test` inherits
`NODE_TEST_CONTEXT=child`; a nested `node --test` spawned with that variable
silently skips every file and exits 0 — a false green (found by the F-02
controlled-failure proof). Any harness that spawns a nested test run must
`delete env.NODE_TEST_CONTEXT` first, as `tests/harness-reliability.test.mjs`
does.

## Browser harnesses

Shared environment strategy lives in `scripts/qa-env.mjs`:

- `QA_BROWSER_CHANNEL` — playwright channel (default `msedge`; install
  Microsoft Edge). Per-OS guidance is printed if it is missing.
- `QA_BROWSER_EXECUTABLE` — explicit Chromium-compatible binary path; wins
  over the channel; a missing path fails with `BLOCKED_ENVIRONMENT` before
  the run starts. This replaces the old hard-coded Windows-only
  `C:\Program Files (x86)\...\msedge.exe` default (25 scripts carried it as
  inert decoration; `chrome-launcher`-based `scripts/lighthouse-audit.mjs`
  still consumes `CHROME_PATH` and keeps its documented override).
- Evidence directories: `openEvidenceDir` refuses a non-empty directory
  unless `ALLOW_EVIDENCE_OVERWRITE=1`, and an allowed overwrite is a clean
  slate (no stale artifacts). `scripts/release-regression.mjs` — the owner of
  the battery's date-derived directories — sets the override for its own
  child harnesses; a hand-run harness still gets the refusal.
- Receipts: `receiptMeta()` stamps the beta SHA (`QA_BETA_SHA` override),
  timestamp, real browser build, viewport, route, role, locale and the honest
  auth-mode label into every JSON receipt.

Representative harness (preview mode, no `VITE_AUTH_MODE=firebase`):

```bash
npx vite --port 4197 --strictPort --host 127.0.0.1 &   # preview-mode dev server
ROUTE_REVIEW_EVIDENCE_DIR=docs/visionary/baseline/<run-dir>/route-review \
  node scripts/route-direct-url-review.mjs
```

`scripts/release-gate.mjs` (the release battery's integrator) runs the same
way with `GATE_BASE_URL` / `GATE_EVIDENCE_DIR`.

## Test accounts and credentials

- Preview mode (local preview repository, `VITE_AUTH_MODE` unset): accounts
  are created through the product's own register → OTP → onboarding UI in the
  run's browser context; the OTP accepts any six digits by design. No
  credential is needed.
- Firebase mode (`VITE_AUTH_MODE=firebase`): the recorded synthetic QA
  identities (`qa.designer@example.test`, `qa.onboarding@example.test`) are
  `.test`-domain fixtures documented in the FAP-67 receipts; supply real
  values through `QA_EMAIL` / `QA_PASSWORD` / `QA_ONBOARDING_EMAIL` instead of
  committing new credentials. Never use real customer or student data.
- The synthetic defaults in `scripts/qa-session.mjs` are intentional,
  documented, `.test`-domain fixture accounts — not production secrets.

## Honest result semantics

- A run in preview mode proves the product's local behavior; it is NOT hosted
  Firebase acceptance. `authModeLabel()` enforces that wording in receipts.
- `BLOCKED_ENVIRONMENT` / refusal exits are correct outcomes, not failures to
  hide: fix the environment or pass an explicit fresh evidence directory.
- Skipped or unexecuted checks must be listed in the run's receipt, never
  folded into a pass count.
