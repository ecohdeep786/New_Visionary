# F-03 — Visual and device baseline (2026-11-06)

Jira key / source ID: F-03 (Visionary Frontend Agent task — visual and device baseline)
Acceptance scope: enabler (device visual baseline evidence) + founder-directed demo-surface removal
Implementer: ZCode agent (Cross-Browser QA + Pixel Engineer specialist)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit / candidate head commit: `zcode/f03-visual-baseline` / beta `b75a3f91` / candidate head = this receipt commit
Current beta commit at baseline time: `b75a3f91` (F-02 automated test baseline receipt)
Owned files: `frontend/scripts/device-visual-baseline.mjs` (new), demo-surface removal set (below), regenerated surface-audit inventories, this receipt, evidence directory.
Prerequisites recorded: Vite dev server `127.0.0.1:4198` in local preview mode (no `.env.local` in the worktree → `VITE_AUTH_MODE` unset → localStorage preview repository).

## Objective and scope

1. Capture screenshots for representative public pages, onboarding and all five role dashboards at
   mobile, tablet and desktop sizes (the F-03 task objective).
2. Founder mid-task instruction executed in the same lane: remove the demo surface from the product
   ("our product is working in production so demo no need in our product").

## Demo-surface removal (founder instruction, task-scoped)

Removed user-visible demo entry points entirely; kept the internal test-fixture engine that the suite
depends on (never user-reachable):

- Deleted `frontend/src/pages/DemoPreview.jsx` (the `/dev/scenarios` demo scenarios page).
- Removed the `DemoPreview` lazy import and the `/dev/scenarios` route from `frontend/src/App.jsx`.
- Removed `enterDemo` from the preview auth API in `frontend/src/api/appClient.js` (the product auth
  surface no longer exposes any demo-account entry; the dynamic `demoFixtures` import went with it).
- Removed the obsolete `frontend/src/pages/DemoPreview.jsx` review entry from
  `integration/contracts/product-surface-review.json` (surface-audit law: source and review contract
  must match) and regenerated the generated inventories
  (`docs/architecture/tracking/product-surface.json`, `docs/architecture/PRODUCT_SURFACE_AUDIT.md`):
  routes 68 → 67, control files 237 → 236, control declarations 1654 → 1652,
  intentionally-unreleased 154 → 152 (clean beta re-verified passing before regeneration).
- Kept `seedDemo`/`scenarioPersonas`/`configureMock` in `workspaceService.ts` and
  `src/api/demoFixtures.js` — they are the internal fixture engine used by 46 test files and are not
  reachable from any product route or auth path.

## Device visual baseline (F-03 objective)

New harness `frontend/scripts/device-visual-baseline.mjs`: captures the product through the REAL
preview-mode journey — register → OTP → onboarding wizard → role dashboards — with no API
interception and no fixture seeding. Wizard steps are driven deterministically by role answer maps
with an aria-pressed-aware fallback, and the D-066 three-screen welcome dialog is walked and captured
before the dashboard pass (its product-side completion persists for the session).

- Sizes: mobile 390×844, tablet 768×1024, desktop 1440×900 (deviceScaleFactor 1, Edge headless via
  `playwright-core` `msedge` channel).
- Public pass: 12 representative routes (`/`, `/about`, `/how-it-works`, `/pricing`, five role pages,
  `/login`, `/register`, `/privacy`) × 3 sizes = 36 captures.
- Onboarding pass: per role × size — identity step, about step, role-specific wizard steps (all steps
  at desktop), and the three welcome-dialog pages = 96 captures.
- Dashboard pass: five roles × four journey surfaces (student home/learn/ask/progress; teacher
  home/classes/prepare/insights; parent home/child/reports/notifications; professional
  home/career/build/settings; organization home/people/curriculum/analytics) × 3 sizes = 60 captures.
- Total: **192 PNG + receipt.json** in
  `docs/visionary/baseline/f03-device-visual-2026-11-05/` (18 MB; per-capture h1, route, size, role,
  wizard steps and page-error records).

Gates enforced by the harness (exit 1 on breach): every capture renders an h1/h2 heading; zero
`pageerror` events; every receipt file exists. Final run: **PASS 192/192**.

## Verified results (this run)

| # | Command (frontend package unless noted) | Result | Evidence |
|---|---|---|---|
| 1 | `npm test` | **PASS — 653 tests, 653 pass, 0 fail** | run log |
| 2 | `npm run lint` (`eslint . --quiet`) | **PASS** (exit 0) | run log |
| 3 | `npm run typecheck` (jsconfig + tsconfig.domain) | **PASS** (exit 0) | run log |
| 4 | `npm run build` | **PASS — exit 0, built in 20.75 s** | build log |
| 5 | `npm run check` (product root: layout + import provenance + frontend suite) | **PASS** (exit 0; 3842 imported files match baseline + 4 recorded patches; script tests 54/54; frontend suite re-run 653/653) | run log |
| 6 | `npm run scope:audit` (after regeneration) | **PASS** (67 routes / 236 control files) | audit output |
| 7 | `node scripts/device-visual-baseline.mjs` | **PASS — 192/192 captures, 0 page errors** | `receipt.json` + PNG set |
| 8 | `npm run qa:taps` / `qa:motion` / `qa:continuity` | **ALL PASS** — tap law holds (243 controls / 126 files; 3 recorded exceptions); motion law holds (**439** motion-bearing files — exactly one fewer than F-02's 440, the removed DemoPreview); all recorded public-surface laws pass | run logs |

## Findings

**F-03-F1 (recorded boundary, unchanged from F-02-F1): firebase-mode authenticated captures remain
dependent on the QA-login bring-up.** This baseline is captured in the product's local preview
repository mode (the worktree intentionally has no ignored `.env.local`). Firebase-mode sessions need
the recorded service bring-up (dev 4197 + auth API 3001 with backend `.env` + emulator) that F-02
found failing (F-02-F1); that dependency is unchanged and remains the honest boundary of this
evidence. The preview journey used here is the product's own development mode — every capture is a
real UI journey (register → OTP → wizard → dashboard), not a seeded state.

**F-03-F2 (observation, harness-covered): Vite dev first-load optimizer can serve a sparse
"Loading…" shell to a fresh context** (consistent with F-02's F-02-F1 observation). The harness now
waits for rendered content instead of a fixed delay; two early mobile-landing captures caught the
shell and were re-captured by the final run.

**F-03-F3 (observation, no action): the D-066 welcome dialog re-opens on every full page navigation
until its product-side completion runs.** Expected product behavior for a fresh account; the harness
walks and completes the dialog once, so dashboard captures show clean workspaces and the "Show
getting started" trigger remains available.

**F-03-F4 (observation): tablet (768px) uses the compact navigation (hamburger + icon rail).**
Recorded by this baseline for the first time (previous reviews used 1440/390 only); renders cleanly
on every captured dashboard surface.

## Backend / ML dependencies

None used. No backend/ML source touched, no endpoint invented, no ML output assumed; dashboards
render the product's own local fixtures and honest empty states.

## Remaining issues and risks

- F-02-F1 (firebase-mode QA login) stays open and now also bounds firebase-mode visual baselines.
- The fixture engine (`seedDemo`/`demoFixtures.js`) remains in the tree as test-only infrastructure;
  it has no product entry point after this lane, but a future hygiene pass could relocate it under
  `tests/fixtures/`.
- Evidence PNGs (18 MB) enter git per the established baseline convention
  (`docs/visionary/baseline/...` already tracks 352 PNGs).

## Worktree and change summary

`New_Visionary-worktrees/zcode-f03-visual-baseline` on `zcode/f03-visual-baseline` = beta `b75a3f91`
+ demo-surface removal + capture harness + regenerated inventories + evidence + this receipt.
Runtime note: the worktree used a node_modules junction to the primary checkout's clean
`npm ci` of the identical committed lockfile (748 packages, exit 0; runtime-only arrangement, nothing
committed). The pre-existing `opencode/f03-visual-baseline` branch/worktree from another agent was
left untouched. Worktree to be removed after the beta landing per the operator's standing instruction.

## Review handoff

```
Jira key / source ID: F-03
Acceptance scope: enabler (device visual baseline) + founder-directed demo removal
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f03-visual-baseline / b75a3f91 / <receipt commit>
Owned files: frontend/scripts/device-visual-baseline.mjs; deleted frontend/src/pages/DemoPreview.jsx;
  frontend/src/App.jsx; frontend/src/api/appClient.js; integration/contracts/product-surface-review.json;
  docs/architecture/tracking/product-surface.json; docs/architecture/PRODUCT_SURFACE_AUDIT.md;
  docs/visionary/baseline/f03-device-visual-2026-11-05/ (192 PNG + receipt.json); this receipt
Commands, exit codes, test counts: 653/653 tests; lint/typecheck/build/check exit 0; scope:audit PASS;
  device-visual-baseline PASS 192/192 (36 public + 96 onboarding + 60 dashboard; 390/768/1440)
Founder instruction executed: demo surface (/dev/scenarios + DemoPreview + enterDemo) removed from product
Remaining defects: F-02-F1 firebase-mode login bring-up (inherited); F-03-F2/F3/F4 observations recorded
Reviewer decision: pending
Verification result: pending
Dev integration commit: pending
Jira transition/comment receipt: pending (Jira not configured in this environment)
Next dependent task: assigned by operator after beta landing
```
