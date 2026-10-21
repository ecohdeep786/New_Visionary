# Apple measured reference — 2026-10-21

Live measurements from `apple.com/apple-vision-pro/` and `apple.com/in/education-initiative/`.
Captured in-browser (CSSOM + computed styles), not from cached notes. Viewport ~1724×1172
(large), 1000×700 (medium sample), with responsive values verified from the shipped
stylesheets at Apple's three breakpoints (large ≥1069, medium 735–1068, small ≤734).

## 1. Type ladders

### Education Initiative — editorial ladder (weights @600 unless noted)

| Role | Large | Medium | Small | Tracking (L→S) |
| --- | --- | --- | --- | --- |
| hero-eyebrow | 56/56 | 40/40 | 32 (inferred) | -0.00028em → 0 |
| hero-headline | 140/140 | 96/96 | 64/64 | -0.0021em → -0.00058em |
| intro-copy | 28/32 | 24/28 | 21/25 | +0.007 → +0.011em |
| section-headline | 64/68 | 56/60 | 40/44 | -0.009 → 0em |
| headline | 48/52 | 40/44 | 32/36 | -0.003 → +0.004em |
| story-headline | 48/52 | 40/44 | 28/32 | -0.003 → +0.007em |
| story-card headline | — | 40/44 | 32/36 → 28/32 | +0.004em |
| label | 24/28 | 21/25 | — | +0.009 → +0.011em |
| tout | 19/23 | 19/23 | 19/23 | +0.012em |
| eyebrow-reduced | 21/25 | 21/25 | 19/23 | +0.011 → +0.012em |
| quote-copy | 28/32 | 28/32 | — | +0.007em |
| quote-caption | 17/21 | 17/21 | — | -0.022em @600 |
| body-reduced | 14/20 | 14/20 | 14/20 | -0.016em @400 |
| caption / figure-caption | 12/16 (600) | — | — | -0.01em |
| router-item-headline | 40/44 | 32/36 | 28/32 | 0 → +0.007em |

### Vision Pro — category ladder

| Role | Large | Medium | Small | Weight |
| --- | --- | --- | --- | --- |
| hero-tagline | 28/32 | 24/28 | 17/21 | 600 |
| foundation-headline | 48/52 | 40/44 | 28/32 | 600 → **700 phone** |
| section-eyebrow | 24/28 | 19/23 | 19/23 | **700** |
| section-headline | 80/84 | 64/68 | 40/44 | **700**, -0.015em |
| section-headline-design | 56/60 | 48/52 | 32/40 | 600 |
| section-headline-reduced | 32/36 | 24/28 | 21/25 | 700 |
| section-body | 21/29 | 17/21 | — | **600**, gray |
| router-headline | 56/60 | 32/36 | — | 600 |
| router-copy | 24/32 | 17/25 | — | 400 |
| highlight (feature title) | 24/32 | 19/23 | 21/25 | 600 |
| headline-elevated | 64/68 | 48/52 | 40/44 | 600 |
| stat numeral (strong) | 48/60 | — | — | 600 |

## 2. Colors (measured)

| Token | Value | Used for |
| --- | --- | --- |
| ink | `#1d1d1f` | headings, primary text, neutral button fill |
| secondary | `#86868b` | Vision Pro section body on dark+light; values copy |
| secondary-alt | `#6e6e73` | System fidelity context (education/tout family) |
| link | `#0066cc` | inline + tertiary text actions |
| commerce blue | `#0071e3` | `.button` fill (nav Buy); hover `#0077ed`, active `#006edb` |
| neutral button hover | `#272729` | `.button-neutral:hover` |
| secondary button | `#757579` | `.button-secondary` |
| alpha secondary | `rgba(0,0,0,0.08)` | `.button-secondary-alpha` (glass) |
| ground light | `#f5f5f7` | hero band, values cards, footer, story gallery |
| ground dark | `#000000` | theme-dark technology/values sections (white text) |
| footer text | `rgba(0,0,0,0.72)` | 12px footer links |
| footer hairline | `rgba(0,0,0,0.56)` border-top over `#f5f5f7` |

Almost **zero decorative accent** on content pages: headlines are pure ink; blue exists only
in links and commerce buttons. One gradient moment max, and only on dark scenes.

## 3. Buttons (exact anatomy, from Apple's shipped CSS)

| Tone | Fill | Text | Hover | Active |
| --- | --- | --- | --- | --- |
| `.button` (commerce) | `#0071e3` | white | `#0077ed` | `#006edb` |
| `.button-neutral` | `#1d1d1f` | white | `#272729` | `#18181a` |
| `.button-secondary` | `#757579` | white | `#79797d` | `#747478` |
| `.button-secondary-alpha` | `rgba(0,0,0,0.08)` | black | 0.07 | 0.09 |
| `.button-tertiary` | transparent | `#0066cc` | — | — |

Geometry: radius `980px`, page-pill size **44px height, padding 11px 21px**, text
**17px / 1.176 / -0.022em, weight 400** (Apple renders SF; for our Google Sans Flex we set
**500** on fills to keep presence — the single sanctioned divergence). Small variant
(nav): padding 7×15, 12px text.

## 4. Rhythm + chrome

- Global nav **44px**; local nav **52px**; both frosted.
- Content columns: **980px** statement column at large (gutter ≈ 364–89px grows with vw);
  **692px** editorial column at medium; 20px gutters on phones.
- Routers band: bg `#f5f5f7`, padding **146–160px top / 164px bottom**.
- Technology/values dark chapters: **180px** top padding; **140px** between adjacent dark chapters.
- Education hero → body gap; eyebrow→headline gap **13px** (L), **11px** (M), **14px** (S).
- Statement → copy gap: **48px** (L), **30px** (M), **28px** (S).
- Story gallery: **122px/130px** top/bottom on `#f5f5f7`, 120px trailing.

## 5. Page architecture pattern

1. **Quiet fixed chrome** — 44/52px, hairline only on scroll.
2. **Ceremonial hero** — wordmark/word lockup + 28/600 tagline + twin CTAs (tertiary + neutral).
3. **Category chapters** — 24px/700 eyebrow → 80px/700 statement → 21px/600 gray body → tiles.
4. **Cross-linked routers** — closing bands on `#f5f5f7` with 56px/600 headlines.
5. **Apple footer** — 12px link field, 5 columns, language select, legal caption band.

Sentence case everywhere. Every module ends with a door (link/CTA). No stacked card-ons-card;
seams are color changes, never stacked borders.
