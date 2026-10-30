# FAP-E2 lighthouse gate — evidence (2026-10-30)

## Final state (production build, vite preview :4199, mobile emulation)

| Route | Performance | Accessibility | Best-practices | SEO |
| --- | --- | --- | --- | --- |
| / | recorded* | **1.0** | 0.92 | **1.0** |
| /pricing | recorded* | **1.0** | 0.92 | **1.0** |
| /download | recorded* | **1.0** | 0.92 | **1.0** |
| /student | recorded* | **1.0** | 0.92 | **1.0** |
| /safety | recorded* | **1.0** | 0.92 | **1.0** |

Gates (per the task): a11y ≥ 0.95, SEO ≥ 0.95 — PASS on all routes. Best-practices and
performance are recorded, not gated.

\* Performance score is null in this environment: Edge 141's trace recorder is
incompatible with lighthouse 13.6.0 (NO_NAVSTART on every navigation — tested old
headless, new headless and headful, with and without proxy flags; no Chrome on this
machine). Perf receipts therefore live in the D3 Fast3G ledger (custom harness);
revisit when Chrome is available or lighthouse fixes the tracer.

## Defects the gate caught and fixed (all in this lane)

1. **color-contrast (a11y, /student)**: the dark intelligence section's frost captions
   (`PremiumIntelligenceSection.jsx` frostDim) rendered `rgba(245,247,250,0.45)` = 3.4:1
   composited on the darkest panel. Raised to 0.6 → 4.86:1. /student a11y 0.93 → 1.0.
2. **aria-prohibited-attr (a11y, /student)**: LazyImage loading placeholders carried
   `aria-label` on a plain div. Added `role="img"`. /student 0.96 → 1.0.
3. **link-text (SEO, / + /student)**: four trust links with visible "Learn more"
   (aria-label was descriptive — visible text was not) → "About {title}"; the language
   chapter door → "How Visionary works"; footer "Download" → "Download Visionary".
   SEO 0.92 → 1.0. NOTE: this corrects FAP-15's closure receipt — its grep was
   JSX-source-literal and missed these rendered links.
4. **heading-order (a11y, all public routes)**: footer column headings h4 → h3
   (h1→h4 skip); pricing sticky plan headers h3 → h2 (h1→h3 skip).

## Recorded, not gated

- Best-practices 0.92 on every route: the AdSense loader in index.html is blocked by the
  site's own CSP (`errors-in-console` + `inspector-issues: Content security policy`) — a
  console error on every page. This is direct evidence for the open FAP-6 founder
  decision: the script ships sitewide but ads never render, and it costs BP score +
  console noise. Removing it is a monetization call, not an implementer call.
- Performance: see * above; D3's honest boundary (Fast3G LCP > 2.5s) stands with the
  fast-LCP lever named as the next wave.
