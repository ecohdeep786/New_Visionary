# F-11 — Landing and persona pages (2026-11-06)

Jira key / source ID: F-11 (Visionary Frontend Agent task — landing and persona pages)
Acceptance scope: enabler (product + pixel review; findings only — no product changes required)
Implementer: ZCode agent (Product + Pixel Engineers)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f11-persona-pages` / beta `076e1fd6` (F-10 landing)
Owned files: `frontend/scripts/persona-review.mjs` (new reusable harness), evidence directory,
this receipt. No product source file changed.

## Objective and method

Review the homepage and the five role-facing experiences (`/student`, `/teacher`, `/parent`,
`/professional`, `/organization`) while preserving approved hero layouts and images. Two evidence
streams against beta `076e1fd6`:

1. **Live review harness** — new `frontend/scripts/persona-review.mjs`: all six pages × three
   sizes (desktop 1440 full-page, tablet 768, mobile 390 full-page), verifying per page: hero h1
   rendering, section inventory, every `<img>` loads (`naturalWidth > 0`), lazy-loading usage, and
   every internal door resolving against the canonical route table (hash-anchors resolved to their
   route). Evidence + receipt: `docs/visionary/baseline/f11-persona-2026-11-06/` (18 records).
2. **Pixel review** — visual inspection of the desktop captures plus dwell-position captures of
   reveal sections (`persona-student-problem-section.png`, `persona-organization-mid.png`).

## A. Verified-correct (protect)

| Area | Verified evidence |
| --- | --- |
| Hero layouts preserved | All six heroes render with the approved structure: staged word-reveal headline ("Learning, to master, to build." / "Teaching, to grow, to reach." / "Parenting, to see, to help." / "Building, to apply, to grow." / "Leading, to scale, to last."), persona cutout imagery, CTA doors; 0 broken images across every page/size |
| Persona-aware chrome | The landing nav reflects each page's persona ("Student"/"Organization" dropdown active; "For organizations" highlighted on /organization) with one shared 26-door link set identical across all pages |
| Images | 6–8 images per page, **0 broken** at any size; hero media + journey/problem imagery load; lazy-loading present where intended |
| Section system | Consistent structure: home 9 sections, persona pages 10 (problem → journey → dark intelligence band → values → closing), all rendering at lawful heights (measured 649–2825px per section) |
| Doors | Every internal door resolves; the two `/about#mission` and `/about#team` deep doors verified against real anchor targets (`AboutUsPage.jsx:88,95`, both with `scroll-mt-28` for the sticky nav) |
| Reveal behavior | Scroll-reveal sections fire on real scrolling (verified at dwell positions: "Every student struggles with understanding." reveals with `opacity: 1` and full content); content is never permanently hidden |

## B. Findings

**F-11-F1 (INFO, capture methodology):** fullPage screenshots of scroll-reveal pages capture
pre-reveal states for below-fold sections (empty-looking bands) — a harness artifact, not a product
defect. The harness walk was extended and section-level dwell captures prove the revealed states;
recorded so future reviewers don't misread fullPage captures of reveal-driven pages.

**F-11-F2 (INFO, already recorded elsewhere):** the known P3 precision items apply to these pages
and are not re-opened here: route→file naming drift (F-01-N1: `/professional`→CollegePage,
`/help`→SchoolPage, `/how-it-works`→CoachingPage) and page-local `COLORS` objects duplicating
`system/tokens.js` with one drifted `mist` channel (F-05-F4). Both carry their own acceptance
criteria in those receipts.

**No new product defects.** No changes were needed or made — the approved hero layouts and images
are preserved exactly.

## C. Verification results (this run)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout |
| `node scripts/persona-review.mjs` | **PASS** — 18 records (6 pages × 3 sizes): all h1s render, 0 broken images, all internal doors resolve, 0 page errors |
| Pixel review | Desktop full-page + dwell captures reviewed: approved hero layouts, persona-aware chrome, consistent section system |
| Full battery | **PASS — all stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0; qa:taps (243 controls/126 files) / qa:motion (439 files) / qa:continuity PASS; `npm run check` exit 0 (3842 imported files match baseline + 4 recorded patches) |

## D. Backend / ML dependencies

None.

## E. Remaining issues and risks

- FullPage captures of reveal-driven pages understate visual completeness (F-11-F1) — reviewers
  should use dwell captures or the F-03 device baseline for visual judgement.
- The persona pages remain subject to the already-recorded F-05-F4/F-01-N1 precision lanes; this
  review found no reason to re-prioritize them above the F-04 backlog (fonts/QA bring-up).

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f11-persona-pages` on `zcode/f11-persona-pages` = beta `076e1fd6` +
review harness + evidence + this receipt. Junction-based node_modules runtime arrangement (nothing
committed). Worktree removed after the beta landing per the operator's standing instruction;
branch retained pushed for review.

## G. Review handoff

```
Jira key / source ID: F-11
Acceptance scope: enabler (landing & persona pages review)
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f11-persona-pages / 076e1fd6 / <receipt commit>
Owned files: frontend/scripts/persona-review.mjs; docs/visionary/baseline/f11-persona-2026-11-06/ (18 PNG + receipt.json); this receipt
Verification: 18 records PASS (heroes/h1s/images/doors across 3 sizes) + pixel review of captures; battery all-exit-0; product on 4198 throughout
Findings: F-11-F1 (INFO capture methodology); F-11-F2 (INFO cross-references to F-01-N1/F-05-F4); no product changes
Reviewer decision: pending
Dev integration commit: pending
```
