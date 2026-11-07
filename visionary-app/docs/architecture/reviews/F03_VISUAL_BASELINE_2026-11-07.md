# F-03 Engineering Receipt — Device visual baseline across all experiences

Task: F-03 — Principal Cross-Device Visual & Browser Engineer (V5 specialist pack)
Date: 2026-11-07
Baseline beta SHA: ced425fa (fresh origin/beta; includes F-01 + F-02)
Worktree/branch: `C:/Users/Administrator/nv-worktrees/f03-visual` · branch `zcode/f03-visual-baseline-v5`
Governance: founder-authorized beta-only workflow; D-095 independent review remains PENDING.

## Harness work (packages 1–6, 8)

`scripts/device-visual-baseline.mjs` extended from a 12-route sample to the recorded matrix system:

- **All 26 route targets** (24 public experiences + login + register; no 404 aliases).
- **Public device matrix**: DOM facts measured at every recorded width (320/360/390/430/768/1024/1280/1440/1920 — 216 cells), screenshots at 320/390/768/1440 plus a 1440 footer capture per route. Facts: horizontal overflow, broken images (naturalWidth 0), unreachable controls, blank mains, page errors — each violation fails the receipt (S01/S02/S05).
- **Interaction checks** (S02/S03/S06): mobile drawer open/Escape-close/reopen with focus-return and body-scroll-lock assertions, 200% zoom emulated honestly as the half-size CSS viewport (640×450), reduced-motion persona capture, landscape 844×390 on the two densest surfaces.
- **Hashed manifest**: every capture records sha256 + bytes; receipt carries provenance via `receiptMeta` (betaSha, timestamp, Edge 156.0.4314.58, preview auth-mode label) and `INDEX.md` gives the per-route × width state table for later owners.
- Deterministic settle before capture (fonts/images/content readiness, not fixed delays).

## Defects found and fixed

1. **F-03-D2 (P2, real product defect, 320px family):** `HeroFanCards` — the static decorative fan clipped its horizontal bleed with `overflow-x-clip`, but the two left-hand cards stayed tabbable at EVERY width (fully offscreen even at 1920): keyboard focus disappeared onto invisible, unscrollable links. Fixed in the component with a measured `ResizeObserver` pass that marks fully-outside cards `inert` + `aria-hidden` + `tabindex -1` (exactly the treatment the design already gave its duplicate cards) and restores them when a resize brings them back into the window. Impact evidence across every page using the component: only invisible cards lose focus; visible cards unchanged; `/` `/about` `/community` `/contact` `/parent` verified through the final matrix run (zero unreachable controls, zero overflow).
2. **F-03-D1 (P2, harness):** the unreachable-control detector initially miscounted three legitimate patterns — controls inside intended snap-x carousels (reachable by scrolling the container), the fan's design-inert bleed cards, and partially-visible bleed cards (operable). Refined to: flag only controls with NO visible part, no scrollable-x ancestor, and not inert. Each refinement is recorded in the run history (107 → 10 → 0 flagged cells) and the final rule is the honest one: a required control must have a visible, operable part.
3. **F-03-D3 (P3, harness):** the 200% zoom check originally emulated with `style.zoom` (keeps desktop breakpoints active — wrong); replaced with the honest half-size CSS-viewport method and recorded as such.
4. **Inventory protocol:** `npm run scope:audit:write` refreshed after the source change (counts unchanged: 67 routes, 1651 declarations, 236 control files).

## Final run (preview server 4197, Edge 156.0.4314.58, preview-mode real register/OTP/onboarding journeys)

- **354 hashed captures / 358 PNGs / 216 matrix cells / 5 interaction checks — PASS with zero failures.**
- Interactions: mobile-drawer PASS · zoom-200-landing PASS · reduced-motion-student PASS · landscape `/` PASS · landscape `/pricing` PASS.
- Zero horizontal overflow anywhere (9 widths × 24 routes), zero broken images, zero blank mains, zero page errors across the entire matrix; five role journeys (student/teacher/parent/professional/organization × mobile/tablet/desktop) captured through the real preview flow with isolated per-run identities — labeled preview mode, never hosted acceptance (hosted Firebase journeys remain the recorded F-02-F1 boundary).
- Evidence: `docs/visionary/baseline/f03-device-visual-2026-11-07/` (receipt.json, INDEX.md, screenshots).

## Gates

lint 0 · typecheck 0 · npm test 673/673 · build 0 (40.6s) · scope inventory refreshed per protocol.

## Boundary kept

No art-direction or font/brand changes; no auth weakening (role dashboards captured through the product's own preview journeys); no dev/main/deploy changes; no Jira actions.

## Integration

Candidate SHA: this commit. Merged non-force into `beta` and PUSHED to origin per the founder's instruction; post-merge smoke: route-contract + harness suites on the merged checkout. Reviewer: PENDING per D-095.

Final status: DONE_AND_VERIFIED_BETA
