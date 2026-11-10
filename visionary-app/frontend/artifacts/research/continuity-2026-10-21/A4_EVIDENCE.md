# A4 — Retag-debt burn-down in public-bridge.css (FAP-44)

**Task:** Retag-debt burn-down in public-bridge.css — remove entries for pages converged in A3, keep entries still needed by unretagged surfaces (auth/onboarding until C1, dashboard until C3).
**Branch:** `gl-kan-201-a4-bridge` (base = origin/dev `773315d3`, which carries A0–A3 + the founder's update merge — no source conflicts with the task).
**Loop note:** first task merged under the founder's amended protocol — merges target **`beta`** (origin/beta seeded at `773315d3`), not `dev`.

## Method (evidence-led, not vibes)

Two independent instruments, both repo-scoped:

1. **DOM burn-down scan** — 23 selector clusters (every retag target in the file as written), queried against the **rendered** DOM of all 27 public routes × 3 widths (1440/1024/390, hydration-settled, per-width error flags recorded). Receipts: `a4-burndown-receipt.json` (raw counts), `a4-truth-table.json` (readable truth), `a4-spot-check.json` (settled spot verification).
2. **Source-authoring cross-check** — per-member grep of the public source set, to catch classes authored-but-dormant (conditional JSX branches the default render never mounts). Receipt: `a4-source-usage-receipt.txt`, `a4-source-usage.mjs`.

**Deletion rule applied:** remove an entry only with BOTH zero rendered matches AND zero authoring files across the public routes. Anything with either signal stays, pinned by a comment naming its evidence.

## First scan's lesson (process receipt)

The first scan's printed verdicts were corrupt: a report-filter bug (`startsWith('max')`, an artifact of an earlier bookkeeping fix) floored error states and printed false `DELETE — 0 matches` for every cluster while the raw counts were fine (446 non-zero evals). The truth table was re-derived from raw counts + a hydration-settled spot check before any edit. Recorded here so the loop's next scan harness fixes court, not vibes.

## What was removed (all with zero source files AND zero matches at every width)

| Removed | Evidence |
| --- | --- |
| Story-card base rule (`.text-[clamp(36/34/40/30/26…)]` bare-class list) | 0 matches all widths; every authored use is on an h2 (CoachingPage, PersonaSections). `font-weight: 600` folded into the live h2 rule — DOM-identical (specificity raise `(0,1,0)`→`(0,1,1)`, same computed value); its `-0.003em` member was already dead under the h2 tracking rule. |
| Display tier tracking rule (`.text-[clamp(48px,5.55vw,80px)]`) | 0 matches; 0 source files. |
| Story-card bare-class tracking/leading rule | 0 matches (same dead class list). |
| `rounded-[48px]`, `rounded-[50px]` members | 0 matches; 0 source files. |

## What stayed (live retags, per-cluster page evidence ×3 widths)

- **h2 story-card variants** → 1/page on home/student/teacher/parent/professional/organization (persona shells).
- **card-title clamps** (base 10-member list) → how-it-works 10, download 1, about 1, partners 2, referral 2, safety 2, accessibility 1; **h2 variants** → partners/referral/safety 2+2+2, accessibility 1; **p step-down** → how-it-works 5, download 1, about 1.
- **compact-20 pair** → download h2 2 / label 4, how-it-works label 1.
- **body-size law (15/16.5/14.5/17/17.5 → 16/14/17)** → 13–56 matches on every route at every width. The single most load-bearing retag block in the file.
- **h2 step law (30–56px → tiers)** → 3–14/page on 14 trust/narrative routes.
- **Radius retags**: `14` (4–17/page on 12 routes), `24` (help 10, community 24, partners 1, referral 3, safety 3), `28` (about 64 + 1 on each auth page) — all live; `14`+`28` merged (same token `--radius-media`). `32`/`60` **kept** though dormant: authored in PersonaSections.jsx behind conditional branches — unretagged surface, converges in B1. `48`/`50` gone (no authoring, no matches).
- **Uppercase-kicker retirement pair** (public slate + workspace-preserved verbatim) → 2–11/page on 20 routes.
- **h1.text-[48px] ladder (40/56/64)** → live on 14 trust/narrative routes.
- **Grey-lead ink rule** → live on 13+ routes via the legacy rgb-marker member. The `6e6e73` hex member stays verbatim (inert today: React serializes inline `#6e6e73` as `rgb(110, 110, 115)`; documents the intent for post-convergence states).
- **13px floor** → 4–25/page everywhere, plus a documented interior dependency: `workspace-typography.css:39` relies on this global while the dashboard keeps its legacy sizes — stays until C3.
- **Law carriers untouched:** `:root` tokens, section rhythm + chapter seam system, dark intelligence scene, narrow-screen law (320–480px), `main { overflow-x: clip }`.

Archive the remaining landmarks: the file ends the task at ~430 lines (from 492).

## Verification chain

1. **Typography fingerprint BEFORE/AFTER** (settled v2 probe: `waitForSelector` + content-wait + retry; 5 routes × 3 widths; h1/h2/h3 ≤14 each, p ≤10, pills ≤4; five fields per element: fs/fw/lh/ls/height) — **IDENTICAL, zero drift**. The before-state was re-captured by stashing the edit and letting vite HMR pick up the reverted file, so both sides are true.
2. **Post-edit rescan** — every live cluster's match set is equal to the pre-edit truth table. Nothing rendering was orphaned.
3. **Captures** — 18 (6 routes × 3 widths: home/student/pricing/terms/download/help); content check in-session on home@1440, help@1024 (SchoolPage card grid + `rounded-[24px]` grid + commerce/outline pair), student@390 (persona shell ladder). Healthy, lawed renders. (Wide quiet bands in fullPage captures are the known scroll-mount artifact, not regressions — fingerprint proves zero drift.)
4. **Checks:** lint ✓ · typecheck (jsconfig + tsconfig.domain) ✓ · `scope:audit:write` ✓ (68 routes / 35 endpoints / 1645 controls / 219 files) · build ✓ (46.7s) · tests **550/550** ✓.

## Bonus receipt (docs contract repair)

`PRODUCT_SURFACE_AUDIT.md` in `773315d3` shipped with unresolved merge-conflict markers (`<<<<<<< HEAD … >>>>>>> c979f5ad`). The audit regeneration writes that doc from code, so the markers are gone and the numbers are re-derived (35 endpoints / 1645 controls) from the merged tree. Do not hand-edit generated docs over merge edits — regenerating resolves markers by definition.

## Hand-forwards

- **rgba channel-form law leak:** sources carry ~397 hits of `rgba(95, 99, 104, α)` / `#5f6368` outside the A3 hex-swap's targetable forms (channel serforms). Public greys currently matching the grey-lead retag are being lawed by the retag until the B/C/D tasks sweep the channel forms themselves.
- Persona-shell dormant retags (`32`, `60`, h2 clamps) hand to **B1 (FAP-46)** with its headline-ladder convergence.
- C4 owns billing-knob + auth field geometry; A3 receipts already noted in A2_EVIDENCE.md.

## Merge

`gl-kan-201-a4-bridge` → `origin/beta` (fast-forward; beta's seed == this branch's base == `773315d3`). Ref-verified post-push. Worktree removed after the board receipt.
