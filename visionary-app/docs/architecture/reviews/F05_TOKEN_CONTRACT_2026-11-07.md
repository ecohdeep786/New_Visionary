# F-05 Engineering Receipt — Token contract, CSS ownership and global-stylesheet law

Task: F-05 — Principal Design Systems & Component Architecture Engineer (V5 specialist pack)
Date: 2026-11-07
Baseline beta SHA: 4bd9933a (fresh origin/beta; includes F-01..F-04)
Worktree/branch: `C:/Users/Administrator/nv-worktrees/f05-tokens` · branch `zcode/f05-token-contract`
Governance: founder-authorized beta-only workflow; D-095 independent review remains PENDING.

## Cascade map (package 1, computed evidence)

`index.css` cascade recorded and regression-enforced: `tokens → rhythm → public-system → public-bridge → premium → apple-typography → public-icons`; workspace styles load via `DashboardLayout → workspace-design.css`. Font-surface law per `styles/README.md` stands unchanged (`--font-public` / `--font-product` / `--font-brand`).

## Defects found and fixed

1. **F-05-D1 (P2):** `src/index.css` global `::selection` carried `background: #rgba(0,102,204,0.10)` — the invalid hex-prefixed functional value (browser silently drops the declaration). F-31 fixed the `public-system.css` twin but missed this one: `qa:continuity` scans only the landing families, so the GLOBAL stylesheet had no law and the artifact survived two full battery runs. Fixed to the intended `rgba(0,102,204,0.10)`; **computed-neutral** (CSSOM now shows both `::selection` rules with the identical valid value `rgba(0, 102, 204, 0.1)` — the valid twin already won the cascade, so zero visual change).
2. **F-05-D2 (P2, law gap closed):** new `tests/css-contract.test.mjs` covers EVERY stylesheet: (a) no `#rgba(`-family invalid artifacts anywhere in src CSS; (b) `index.css` import order pinned (import order is load order); (c) media-aware token-conflict law — a same-selector custom property defined twice with DIFFERENT values in the SAME media context fails, while the recorded cross-media responsive `:root` steps (5rem→4rem→2.75rem unified h1 law) are enforced as the intentional pattern; (d) the unified-h1 steps pinned verbatim.

## Intentional exceptions recorded (not defects — do not "fix")

- The Apple-measured content-section typography block in `rhythm.css` redefines display-tier tokens (incl. hero-named ones) for non-hero content sections — scoped, measured, FAP-34 lineage; hero computes the unified law (verified live: 80px @1440, 44px @390). Renaming is F-06's call.
- `--v-*` workspace variables across four files are per-surface theme scopes inside `.visionary-workspace`.

## Deliverables

- `docs/visionary/design/F05_TOKEN_CONTRACT_2026-11-07.md` — authoritative token homes table, cascade law, intentional exceptions, downstream ownership (F-06 typography values, F-07 icons, F-08 responsive steps, F-11+ content).
- `tests/css-contract.test.mjs` — 4 laws.
- Evidence: `docs/visionary/baseline/f05-token-contract-2026-11-07/` (typography 9 records PASS with one recorded NOTE on `--lh-body` semantics; responsive 9 records PASS incl. 320/390/landscape zero-overflow).

## Verification (representative surfaces after the shared change)

- typography-verification PASS (surface families, hero weight/face, hi fallback) — preview-mode real workspace journey.
- responsive-verification PASS (no horizontal overflow at 320/390/landscape; mobile nav + dialog behavior) — preview-mode real workspace journey.
- design-quality-review: **BLOCKED_EXTERNAL boundary recorded** — it requires the Firebase-mode QA session (F-02-F1 bring-up), unavailable in the preview worktree; the preview-compatible coverage above plus the F-03 device matrix (354 captures incl. all five role shells) stands in for representative-surface proof.
- Gates: lint 0 · typecheck 0 · **npm test 682/682** (+4 CSS laws) · build 0 (8.3s).

## Boundary kept

No page editorial content/illustrations changed; no licensed assets touched; no business logic altered; token values preserved (the one value change repairs an invalid declaration to its intended constant).

## Integration

Candidate SHA: this commit. Merged non-force (fast-forward) into `beta` and PUSHED to origin per the founder's instruction; post-merge smoke: css-contract + cta-trace suites on the merged checkout; founder's browser server on :4199 serves the merged state. Reviewer: PENDING per D-095.

Final status: DONE_AND_VERIFIED_BETA
