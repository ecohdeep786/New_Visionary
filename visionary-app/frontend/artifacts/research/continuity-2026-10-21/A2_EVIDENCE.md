# A2 · CTA law — evidence record (FAP-42)

**Task:** FAP-42 (Epic A / FAP-36) · **Branch:** `gl-kan-201-a2-cta` from verified `origin/dev` `c30eb5dc`.
**Accepted by:** standing founder authorization.

## Scope executed

1. **DownloadPage.jsx** — all 7 interactive pills + hero link pair to the recorded CTA law:
   `h-11 (44px) · text-[17px] · tracking-[-0.011em] · font-medium (500 fills) · rounded-full (980) · px-[21px] ·`
   primary fill `#1d1d1f→hover #272729→active #18181a`; secondary fill `rgba(0,0,0,0.08)→hover 0.13` with ink text (replaces illegible `#9AA0A6` text);
   focus `ring-2 #0066cc + offset-2` (removes every Google-blue `#4285F4` ring incl. email input focus).
   The final hero pair ("Continue on web" + "See how it works") to law, quiet link at `17px/400/#0066cc→#0071e3 hover`.
2. **Pricing (/pricing → AILearningPage.jsx)** — per-plan CTA column (highlight + regular variants) to full law (alpha secondary on white cards), billing segmented control knob fill `#121317→#1d1d1f` + law focus ring (anatomy = control tier, receipted for C4), final-CTA pair ("Get started"/"Talk to sales") to full law.
3. **AuthUI.jsx (all auth pages)** — sign-in/submit system from pure-Google fills (`#4285F4/#3367d6/h-12/16px`) to law: full + auto variants = commerce `#0071e3→hover #0077ed`, outline = white/ink on line `#d2d2d7`, hover ground `#f5f5f7`; all at 44px/17px/−0.011em/500/980/ring #0066cc. (Brand-logo SVG glyphs untouched — icon hexes are A3's sweep.)
4. **Bridge exemption (surgical, prevents mass-regression):** the pre-existing `apple-typography.css` typed layer force-pins **all** non-hero-section `a`, `.apple-btn-*`, and `.text-[17px]:not(h2):not(h3):not(p)` to body tier (`--track-body = −0.022em !important`, `--weight-body = 400` out-speccing `500`) — this sniped law pills inside sections (probes showed identical classes with divergent computed values). Added `:not([class*="rounded-full"])` to the three interactive bridge selectors so quiet links stay typed while law pills keep CTA anatomy. Generic bridge review remains FAP-44 (A4).

## Rework loop (self-feedback iterations)

- Probe run 1: 23 violations → read ground truth in browser (matched-rule dump) → bridge root cause + 3 exemptions; found the missed platform-grid pills ("Open in browser" + 5 platform pills + "Prepare email request"), missed pricing final pair, and the shared nature of the "Get started" legacy pill.
- Probe run 2: 1 violation (billing knob) → knob fill to law ink (+ law ring), file to full law in this iteration.
- Probe run 3 (`/signin` added): 2 false-positive px flags on `w-full` auth pills → probe contract corrected (full-width fill: padding not required; 44px + centered).
- Probe run 4 (final): **CTA-tier violations 0**, 1 documented control-tier exception (billing knob).

## Verification (all green)

| Check | Result |
| --- | --- |
| `scope:audit:write` | ✅ regenerated (×3) |
| lint / typecheck (both configs) / build | ✅ (31.15s) |
| `npm test` | ✅ **550/550** |
| Probe (final) | ✅ 0 CTA violations; 1 control-tier exception (billing knob); sees law values incl. `rgb(0,113,227)` commerce fills on auth |
| Captures | ✅ 9/9 (`/download`, `/pricing`, `/signin` × 1440/1024/390) in `a2-cta-after/` |

## Receipts handed to later tasks

- **A3 (FAP-43, hex sweep):** remaining `#4285F4`/`#121317`/`#9AA0A6`/`#e8f0fd`-family tokens on DownloadPage/AILearningPage/BrandIcon paths (non-CTA: icon chips, borders, copy text; legacy `COLORS` local maps).
- **C1 (FAP-49):** persona router tiles measured radius 20 on interactive cards — token card radius law is 12px/16px (not pills).
- **C4 (FAP-52):** billing segmented control (40px/14px knob = correct control anatomy now confirmed); email input geometry (`h-12`/14px/0.24px) — focus colors fixed here, geometry stays for the control law.
- **A4 (FAP-44):** bridge tier separation confirmed by probes; the `!important` inventory requires its own audit.
