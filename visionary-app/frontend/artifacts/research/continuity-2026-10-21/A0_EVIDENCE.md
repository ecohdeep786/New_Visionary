# A0 · Baseline freeze — evidence record (FAP-41)

**Task:** FAP-41 (Epic A / FAP-36) · **Branch:** `gl-kan-201-a0-baseline` from verified `origin/dev` `84a432ec`
**Captured at:** 2026-10-21 14:43–15:07 UTC · **Accepted by:** standing founder authorization recorded on the ticket chain.

## Acceptance criteria (ticket AC)

| AC | Result |
| --- | --- |
| Audit + reference docs merged | ✅ `FRONTEND_PRODUCTION_AUDIT_2026-10-21.md`, `APPLE_MEASURED_REFERENCE_2026-10-21.md`, `FRONTEND_AGI_TASK_REBUILD_2026-10-21.md` added under `docs/visionary/design/` (git diff vs origin/dev: exactly 3 files, +341/−0 tracked) |
| ≥60 baseline shots (23 public pages × 3 widths), errors tolerated with receipts | ✅ **81/81** route@width files exist (27 public routes × 1440/1024/390), `git verify` style coverage assertion run against receipts |
| No CSS/JSX changed | ✅ tracked diff is docs-only; artifacts are untracked-then-added files under `frontend/artifacts/` |

## What was captured

- **Routes (27):** `/`, `/signin`, `/login`, `/register`, `/student`, `/teacher`, `/parent`, `/help`, `/professional`, `/how-it-works`, `/organization`, `/download`, `/about`, `/pricing`, `/careers`, `/research`, `/community`, `/contact`, `/partners`, `/updates`, `/referral`, `/safety`, `/privacy`, `/terms`, `/security`, `/accessibility`, `/cookies`
- **Widths:** 1440 / 1024 / 390 (full-page, JPEG q80, light scheme, reduced-motion so scroll-reveal blocks render statically)
- Host: headless Edge (`playwright-core`), product served by Vite dev (`npm run dev -- --port 5180`) from the **origin/dev** worktree — this is the true pre-chain baseline.
- Naming: `<slug>-<width>.jpeg`, slug `home` for `/`.

## Receipts

- `baseline-receipts.json` — main run: 78 direct successes, **0 loading-stuck**, 4 transient failures (`/partners@1440` goto-timeout; `/accessibility@1440`, `/signin@1024`, `/partners@1024` shot-failed).
- `retry-receipts.json` — retry pass: **all 4 re-captured successfully**; final on-disk assertion: 81/81 present, 0 missing.
- Tooling notes recorded for later tasks:
  - `/pricing` and `/download` render fully in headless Edge (they previously appeared stuck on the desktop-visible browser with ad/recaptcha extensions — environment, not product).
  - A first-run path bug (script wrote to `artifacts/artifacts/…`) was fixed in `capture.mjs` after the main run; outputs were relocated to this directory and the committed script is now path-correct and reproducible.
  - Capture pace ≈ 30–50 s/page at 1440 full-page; later tasks use **targeted** route captures (only changed surfaces) instead of full sweeps, to keep loops fast; E1 restores full sweeps as `qa:continuity`.

## Baseline follow-ups this evidence creates for the chain

- 27 baselines now exist to diff against after each task; A3 (`FAP-43`) hex sweep and B/C tasks diff route@width shots against these.
- No product CSS/JSX was touched; no Jira tickets were closed by this task other than FAP-41 itself.
