# C2/FAP-50 — "Onboarding joins the one system" evidence pack

Date: 2026-10-22 · Branch: `gl-kan-201-c2-onboarding` · Worktree: `gl-kan-201-c2-onboarding`
Dev server: 127.0.0.1:5192 (preview build, bare worktree walk) · Fonts gate: 127.0.0.1:4197 (`vite preview` of the production build)

## Scope

Same ticket grammar as C1, applied to the onboarding surface:

1. **Same canvas/card** (C1 skin law): onboarding canvas `#f7f9fc` → `#f5f5f7`; ink text `#202124`/`#121317` → `#1d1d1f`; muted `#5f6368`/`#80868b` → `#6e6e73`; lines `#dadce0`/`#e3e7ee`/`#c6cbd3`/`#dfe4ed` → the `#d2d2d7` family; card shadows normalized to the C1 card law (`0 1px 2px rgba(60,64,67,.08), 0 2px 6px 2px rgba(60,64,67,.06)`); the Google-blue accent family (`#0b57d0`, `#4285F4`, `#e8f0fd`, hover fills `#0842a0`, focus tints `#d7e3fc`) is gone from the surface: progress fill, completed/current step circles, selected choice cards and check bubbles ride **ink** `#1d1d1f`, links/focus/icons ride **`#0066cc`** (C1's AuthUIKit back/skip/copy link grammar), error red unified to `#e30000`, notice panels calm to `#f5f5f7`, scrim `#1d1d1f/45`.
2. **Step labels ≥ 12px**: the shell's step labels were `text-[10px] leading-4 sm:text-xs` — 10px at base width. Now `text-xs leading-4` (12px) at every width. The whole product carries **zero** `text-[10px]` after this task (two dashboard chart labels, `FamilyProgress`/`MarketTrends`, still below the floor are bumped to `text-xs`; their *colours* are dashboard-cycle scope and intentionally untouched).
3. **Controls 44px**: continue/submit pills, back/skip links, chips and choice cards ride `min-h-11` (44px); setup fields selected at the auth-field presence (`min-h-12` → `min-h-14`, 56px ≥ 44 floor); the GettingStarted close control raised from `h-10` to `h-11`.
4. **Continue pill = ink**: bottom-of-card submits and the getting-started primary render the shared AuthUI token verbatim — `primaryBtnAutoClass` (17px/500/−0.011em, `#1d1d1f`, hover `#272729`, pressed `#18181a`, press scale, ring `#0066cc`, spinner gap) — not a re-derived copy. AuthUI's law comment records the extension (FAP-42 → C1 → C2).
5. **`product-onboarding.css` folded into one sheet**: the sheet remains the ONE stylesheet the onboarding surface adds beyond Tailwind (title-focus announcement rules inside), now with the C2 law comment; no per-component sheets. `data-font-surface="product"` preserved on the shell/`AGIIntro`-style mains.

Selected-state grammar: choice cards selected = ink 2px border on `#f5f5f7` fill with ink check bubble; unselected = `#d2d2d7` on white with hover `#86868b`; chips identical (border ink pill).

## Probes (c2-probes.mjs → c2-probe-after.json) — **18/18 stage-snapshots PASS the law**

Seeded preview account (`visionary_users` fixture, `onboarding_complete:false`), walked identity → about → focus → context → review → getting-started overlay at 1440/768/390. Per stage: min computed font ≥ 12px (`minFontSize` 12 — no 10px anywhere), canvas exactly `rgb(245,245,247)`, card white at radius **12px** (see the radius verdict below), submit pill exactly `rgb(29,29,31)` at 44px/9999px on onboarding pages, progress fill ink, selected card ink border + `#f5f5f7` fill, links exactly `rgb(0,102,204)`, fields/selects 56px (≥ 44 floor), and a computed-colour sweep per stage over background/colour/border — **zero hits** for `rgb(11,87,208)` (#0b57d0), `rgb(66,133,244)` (#4285F4), `rgb(232,240,253)` (#e8f0fd).

Getting-started overlay: open, card 12px/white, ink pill and close control at **48px** — that is the workspace's own portaled-dialog control law (`workspace-design.css` L466–468: controls inside `[role=dialog]` in the workspace get a 48px floor), which *satisfies* the ticket's 44px floor; min font inside the dialog 12px; zero off-law colours inside the dialog.

**Radius verdict (C1 reconciliation applies unchanged):** the card classes still say `rounded-[28px]`; the active A4 public-bridge law renders it at the system's canonical 12px (`--radius-media`). Same settled law, same verdict, nothing overridden.

## Captures (18, committed as receipts)

`c2-<identity|about|focus|context|review|getting-started>-<1440|768|390>.png` — the complete journey, three widths, including the ink selected state (identity/focus) and the workspace-scoped overlay.

## Surface archaeology (recorded, untouched)

`components/onboarding/steps/{AGIIntro,OrgInfo,CurriculumSummary,StudentContextForm,StudyRoutine,SubjectConfidence}.jsx` + `StarRating.jsx` are an **A-era goal-flow cluster with no live import path** (importer sweep: only the dormant intra-cluster edges survive; the live flow's steps come from `lib/productSetup.js`, options come from `stepConfigs`' list exports). They keep their old tokens by design — dormant code is not swept, consistent with "preserve unrelated work"; noted here so a future dead-flow removal task can find them. `stepConfigs`' live list-export label helpers (`#121317`/`#5f6368`) were harmonised anyway since they sit behind the same import edge.

## Gates

| Gate | Result |
| --- | --- |
| `npm run lint` (eslint --quiet) | 0 errors |
| `npm run typecheck` (jsconfig + tsconfig.domain) | exit 0 |
| `npm test` | **609/609 pass, exit 0** (`c2-tests-tap.txt`) |
| `npm run build` | exit 0 (14.9s) |
| `npm run qa:fonts` (font-surface-review on :4197 preview of `dist`) | PASS (product/body/controls/menus/tooltips, 390/1440) |
| `npm run scope:audit:write` | regenerated: controlDeclarations **1654** (unchanged from C1 — no control added/removed by this skin pass), controlFiles 220; `product-surface.json` + `PRODUCT_SURFACE_AUDIT.md` committed |
| `c2-probes.mjs` (playwright, :5192) | **18/18 stage-snapshots PASS**, exit 0 (`c2-probe-after.json`) |
| Off-law + 10px texture sweep (`Select-String` over live-src) | 0 hits in the live onboarding surface; `text-[10px]` 0 hits across all of `frontend/src` |

## Authorship note

Code-only pass: no backend, no contracts, no `package.json` (the worktree's `allowScripts` block remains uncommitted by policy).
