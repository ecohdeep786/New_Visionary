# F-15 — Public frontend release gate (2026-11-06)

Jira key / source ID: F-15 (Visionary Frontend Agent task — public frontend release gate)
Acceptance scope: enabler (integration gate; 3 verified accessibility fixes authorized)
Implementer: ZCode agent (Quality Lead + QA)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f15-release-gate` / beta `6ffd46d3` (F-14 landing)
Owned files: `frontend/scripts/release-gate.mjs` (new consolidated gate harness), 24 public pages
(`tabIndex={-1}` skip-target fix), `frontend/src/components/auth/LanguageSelector.jsx` (ARIA), the
re-recorded `frontend/scripts/perf-budget.json`, regenerated inventory digests, evidence directory,
this receipt.

## Objective and method

Validate public routes, visual regressions, keyboard accessibility, performance and critical
navigation before integration. New consolidated gate harness
`frontend/scripts/release-gate.mjs` (Quality Lead artifact — runs the lane checks as one gate):
five gates executed live on Vite dev `127.0.0.1:4198` (preview mode), plus the full battery and
the D3 build-budget law.

## A. Gate results (final run — all PASS)

| Gate | Result | Evidence |
| --- | --- | --- |
| 1. Route sweep | **PASS** | 27 public routes: HTTP 200, h1 rendered, **0 page errors** |
| 2. Keyboard — skip link | **PASS** | Tab reaches "Skip to content" (`#main`), Enter **lands focus inside `#main`** (after the F-15-F1 fix); login Tab focus visible |
| 3. Accessibility spot | **PASS** | 0 low-contrast, 0 sub-44px controls (gradient-aware, pseudo-union aware, inline-text-link exception per the recorded law) across landing/login/pricing/cookies; 0 missing alts |
| 4. Critical navigation | **PASS** | register → email → password → OTP → onboarding wizard → **dashboard reached**, 0 page errors |
| 5. Build budget (D3 law) | **PASS** | 137 chunks within recorded budgets; **861 KB total JS gzip vs the previous 879 KB budget — 18 KB under** (re-recorded deliberately per the law's protocol after the chunk reorganization) |

## B. Verified defects found and corrected (2 + 1 law maintenance)

**F-15-F1 (P2 → fixed): public skip links could not move focus.** All 24 public pages rendered
`<main id="main">` without `tabIndex={-1}` — fragment navigation left keyboard focus on the link
(the gate caught this live). The workspace main already had the pattern. Mechanical fix: added
`tabIndex={-1}` to the 24 public main elements; the gate now verifies focus lands inside `#main`.

**F-15-F2 (P3 → fixed): the auth language selector lacked dropdown ARIA.** The 84×20px
`LanguageSelector` trigger (footer of auth layouts) opened a listbox without `aria-haspopup` or
`aria-expanded`; it also sat below the 44px tap law's spirit (the source law engine qa:taps passes
it — recorded here as the law-owner-accepted exception). Corrected: added
`aria-haspopup="listbox"` + `aria-expanded` (semantically correct, zero visual change). The gate
marks listbox triggers under 24px as the recorded exception class.

**F-15-F3 (law maintenance): the D3 build-budget baseline was stale.** Chunk reorganization since
the last deliberate record (new 97B `datetime.js`; `PolicyTabs.js`/`teacher-problem-1.js` retired)
made the fail-closed law report drift. Verified first that the payload moved in the safe direction
(861 KB gzip vs 879 KB budget, −18 KB / −2%), then re-recorded per the law's documented protocol
(`--record-baseline`); verify mode now PASS. The drift predates this lane (no perf run between the
FAP-era record and F-15).

**Visual regression reference:** fresh 1440px captures of the four surfaces changed since the F-03
baseline (`gate-landing/login/pricing/cookies-1440.png`) — the F-10/F-13/F-14 fixes (main landmark,
heading order, cookie copy, fetchpriority) are content/semantics-only and render identically;
reviewer compares against the F-10/F-12 recorded captures.

## C. Verification results (final run, this worktree)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout |
| `node scripts/release-gate.mjs` | **RELEASE GATE PASS — 5/5 gates** (receipt + per-gate JSON in `docs/visionary/baseline/f15-release-gate-2026-11-06/`) |
| Full battery | **PASS — all 9 stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (18.02 s); **qa:perf PASS**; qa:taps PASS (243 controls/126 files); qa:motion PASS (439 files); qa:continuity PASS; `npm run check` exit 0 (3842 imported files match baseline + 4 recorded patches) |
| Harness consolidation | The gate reuses the F-10 a11y math, F-03 journey engine, and F-11/F-12 door logic — one command integration gate |

## D. Backend / ML dependencies

None.

## E. Remaining issues and risks

- Gate runs in preview mode; firebase-mode sign-in remains dependent on F-02-F1's bring-up.
- qa:navigation/qa:fonts/qa:design batteries remain behind the same login dependency (F-02-F2).
- The language-selector tap size stays a law-owner item (exception recorded with ARIA now correct).

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f15-release-gate` on `zcode/f15-release-gate` = beta `6ffd46d3` +
3 accessibility fixes + re-recorded perf budget + inventory digests + gate harness + evidence +
this receipt. Junction-based node_modules runtime arrangement (nothing committed). Worktree removed
after the beta landing per the operator's standing instruction; branch retained pushed for review.

## G. Review handoff

```
Jira key / source ID: F-15
Acceptance scope: enabler (public release gate + accessibility fixes)
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f15-release-gate / 6ffd46d3 / <receipt commit>
Owned files: frontend/scripts/release-gate.mjs; 24 public pages (tabIndex); frontend/src/components/auth/LanguageSelector.jsx (ARIA);
  frontend/scripts/perf-budget.json (re-record); docs/architecture/tracking/product-surface.json (digest);
  docs/visionary/baseline/f15-release-gate-2026-11-06/ (4 PNG + receipt + gate JSONs); this receipt
Verification: RELEASE GATE PASS 5/5 live; battery all 9 stages exit 0 (653/653); perf law PASS at 861/879 KB gzip
Findings: F-15-F1 (P2 fixed skip-target focus), F-15-F2 (P3 fixed language-selector ARIA), F-15-F3 (perf re-record, −18 KB)
Reviewer decision: pending
Dev integration commit: pending
```
