# Apple Type-Scale Spec for Visionary Frontend — 2026-10-20

**Purpose:** adopt Apple's typographic ladder (sizes, weights, line-heights, tracking, per-device behavior) across all public marketing pages + auth surfaces, keeping our brand font (**Google Sans / GoogleSansFlex — font names fixed, do not change**).
**Measured from:** `apple.com` + `apple.com/in/education-initiative/` at 390/768/1024/1440/1920 (30 live measurements; matrix: `frontend/artifacts/qa-2026-10-20/type-matrix.json`, comparison demo: `type-scale-demo.html` + `evidence/type-scale-demo.jpeg`).
**Scope:** public frontend only; dashboard is out of scope for this pass.

---

## 1. Apple's measured ladder (ground truth)

Values are per role, exactly as rendered on the education-initiative page (font = SF, for us = Google Sans):

| Role (Apple class) | 390 | 768 | 1024 | 1440–1920 | Weight | lh | letter-spacing |
| --- | --- | --- | --- | --- | --- | --- | --- |
| hero rotating words (`typography-hero-headline`) | 64 | 96 | 96 | **140** | 600 | 1.0 | −0.001…−0.002em |
| hero phrase line (`typography-hero-eyebrow`) | 40 | 40 | 40 | **56** | 600 | 1.0 | 0 |
| section headline (`typography-section-headline`) | 40 | 56 | 56 | **64** | 600 | 1.07 | −0.005em |
| story/chapter headline (`typography-story-headline`) | 28 | 40 | 40 | **48** | 600 | 1.08…1.1 | −0.003em |
| card/item headline (h3 `router-item-headline`) | 28 | 32 | 32 | **40** | 600 | 1.10…1.13 | 0…+0.004em |
| bold label above sections (`typography-label`) | 21 | 21 | 21 | **24** | 600 | 1.19 | +0.011em |
| intro copy (`typography-eyebrow-reduced`) | 19 | 21 | 21 | **21** | 400 | 1.19–1.21 | +0.011…+0.012em |
| `tout` (bold small row/CTA-ish) | 19 | 19 | 19 | **19** | 600 | 1.21 | +0.012em |
| lead copy under hero (home `main p`) | 19 | 24 | 24 | **28** | 400 | 1.24…1.4 | +0.007…+0.012em |
| body | 17 | 17 | 17 | **17** | 400 | 1.47 | −0.022em (SF) |
| caption (`typography-figure-caption`) | 12 | 12 | 12 | **12** | 600 | 1.33 | −0.010em |
| nav link (top bar) | 12 | 12 | 12 | **12** | 400 | 1.33 | −0.010em |
| button/chip text (`ac-ls-button`) | 14 | 14 | 14 | **14** | 400 | 1.29 | −0.016em |

**Key behaviors to copy:**
1. **Stepped, not continuous.** Apple changes size at breakpoints (64→96→140), one value per class of devices — not fluid `vw` scaling. Same ladder at 1024 as 768 for most roles; final growth stops at 1440 (140 for display, 64 for section heads — **section heads never exceed 64**).
2. **Hero = two lines.** Small phrase line (40→56) + giant rotating words (64→96→140). Education-initiative hero: "Education moves" then "learners, leaders, innovators".
3. **Weights: display/labels = 600 everywhere; intro/lead/body/buttons = 400.** Buttons are *regular* weight — calm premium.
4. **Tracking curve:** ~0 to −0.009em at display sizes; +0.004…+0.012em at 21–32; body slightly negative. (Apple SF body −0.022em; **for Google Sans we adapt to −0.011em**, since Google Sans is set slightly wider.)
5. **One line-height per role** (1.0–1.1 display, 1.19–1.21 labels/intro, 1.47 body, 1.33 caption).
6. **Footer/nav/captions fixed 12px** at every device — small type does not scale, large type does.

## 2. Where we stand (our measured values today)

| Role (ours) | 390 | 768 | 1024 | 1440+, | Issue vs Apple |
| --- | --- | --- | --- | --- | --- |
| hero display word | 48 | — | 57* | **80** | too small on phones, too weak authority on desktop (+ weight 500, lh 1.05, no tracking rule) |
| hero phrase | 56 | — | — | 48–56 varying | no ladder; odd values (*57 = clamp artifact) |
| section h2 | 40 | 64 | 64 | **72–80** | exceeds Apple cap of 64; inconsistent page-to-page |
| story h3 | 21 | 24 | 24 | **28** | desktop story heads too small (Apple 48) — hierarchy flat |
| card title h3 | 21 | 24 | 24 | **28** | undersized (Apple 40) |
| lead copy under hero | 32 | 32 | 40–48 | **48** | far above Apple's 28 cap |
| intro copy | 19–21 | 19 | 19 | **19–21** | roughly right |
| body | 17 / 1.47 | 17 | 17 | **17** | ✓ already correct |
| eyebrows/labels | 12–16 uppercase | … | … | … | meaning-carrying text at 12–16 with semibold; Apple uses 21–24/600 labels + 12 only for true captions |
| CTA button text | 14–15 / **500** | | | | Apple: 14 / **400** |
| nav links | **14 / 500** | | | 14/500 | Apple: 12 / 400 (44px target unchanged) |
| footer links | 12 / 400 ✓ | | | ✓ | matches |
| letter-spacing | ad-hoc −0.020…+0.011 | | | | no curve; display sizes over-tracked in places |

## 3. Proposed tokens (name → per-device values)

Stepped ladders via CSS custom properties set once (Tailwind arbitrary values ok). Font stack unchanged: `Google Sans` (+`Flex` where surfaces use it).

```css
/* brand font fixed; only sizes/weight/lh/ls change */
:root {
  --type-display-w: 600;  --type-display-lh: 1.0;  --type-display-ls: -0.002em;
  --type-hero-w: 600;     --type-hero-lh: 1.07;   --type-hero-ls: -0.005em;
  --type-story-w: 600;    --type-story-lh: 1.08;  --type-story-ls: -0.003em;
  --type-card-w: 600;     --type-card-lh: 1.10;   --type-card-ls: 0em;
  --type-label-w: 600;    --type-label-lh: 1.19;  --type-label-ls: 0.011em;
  --type-lead-w: 400;     --type-lead-lh: 1.24;   --type-lead-ls: 0.009em;
  --type-intro-w: 400;    --type-intro-lh: 1.21;  --type-intro-ls: 0.012em;
  --type-body-w: 400;     --type-body-lh: 1.47;   --type-body-ls: -0.011em;
  --type-cap-w: 600;      --type-cap-lh: 1.33;    --type-cap-ls: -0.010em;
  --type-btn-w: 400;      --type-btn-lh: 1.29;    --type-btn-ls: -0.016em;
  --type-nav-w: 400;      --type-nav-lh: 1.33;    --type-nav-ls: -0.010em;
}
/* sizes — stepped like Apple */
:root {
  --size-display: 64px;  /* ≥390 */
  --size-hero: 40px;
  --size-h2: 40px;
  --size-h3: 28px;
  --size-h4: 28px;
  --size-label: 21px;
  --size-lead: 19px;
  --size-intro: 19px;
  --size-body: 17px, lh 1.47;
  --size-cap: 12px; --size-btn: 14px; --size-nav: 12px;
}
@media (min-width: 768px) {
  --size-display: 96px;  --size-hero: 40px;  --size-h2: 56px;  --size-h3: 40px;
  --size-h4: 32px;       --size-label: 21px; --size-lead: 24px; --size-intro: 21px;
}
@media (min-width: 1440px) {
  --size-display: 140px; --size-hero: 56px;  --size-h2: 64px;  --size-h3: 48px;
  --size-h4: 40px;       --size-label: 24px; --size-lead: 28px; --size-intro: 21px;
}
```

**Names:** `type-display` (hero rotating word), `type-hero` (hero phrase line), `type-h2` (section headline, cap 64), `type-h3` (chapter/feature heading), `type-h4` (card titles), `type-label` (bold first-line labels 21–24 — replaces 12–16px meaning-carrying eyebrows), `type-lead` (hero support copy 19→24→28), `type-intro` (19/21), `type-body` (17 unchanged), `type-cap` (12 figure captions/legal only), `type-btn` (14/400), `type-nav` (12/400, 44px targets per FAP-12).

**Hero restructure (matches Apple's education hero):** phrase line (`type-hero`) + rotating word (`type-display`) as two spans inside the same h1; mobile hero display 64 (Apple exactly 64 @390 — pairs with 40px phrase line).

## 4. Component application map

| Component / surface | Token change |
| --- | --- |
| Landing hero (`Landing.jsx`, `NewPersona.jsx`, persona heroes) | phrase line → `type-hero`; rotating persona word → `type-display`; support copy 48→`type-lead`; CTA → `type-btn` |
| Section headlines everywhere (H2) | cap at 64 (today 72–80) → `type-h2` |
| Dark-chapter headings + feature rows | `type-h3` (48 @desktop — hierarchy restored) |
| Card grids (community, org pillars, plan cards, FAQ rows) | titles → `type-h4`; body → `type-body` |
| Eyebrow labels (12–16px uppercase introducing sections) | `type-label` 21/600 (+0.011em) — real text, not shouted uppercase |
| Charts/figure captions, photo credits | `type-cap` 12/600 |
| Auth screens titles/forms | page title → `type-hero` (40/56/64); inputs 17; button text `type-btn` |
| `LandingNav` | links → `type-nav` 12/400 (keep mega-menu descriptive rows at `type-intro`), height/44px targets unchanged |
| `LandingFooter` | column heads → `type-label`; links stay 12/400 |
| Trust/legal pages (privacy/terms/security/accessibility/cookies) | h1 → `type-hero`; section heads → `type-h2`; body stays 17; TOC/captions 12 |
| **Do NOT touch** | dashboard typography (separate surface), font-family declarations, colors, spacing scale |

## 5. Acceptance criteria (QA gate)

1. Re-run `type-matrix.mjs` against our pages after the change: every role matches Apple's table at 390/768/1024/1440 ±1px, weight/lh/ls per column §3.
2. No section headline > 64px desktop; no lead copy > 28px; no meaning-carrying text < 14px (captions/legal excepted).
3. Buttons/nav at 400 weight; display/labels show one consistent 600.
4. Type regression screenshot-diff (`shot-mobile-slice` pattern) on /, /student, /pricing, /help at 390 + 1440 for review.
5. Lint + typecheck + tests + production build pass (root npm runs delegate).

## 6. Out of scope / follow-ups

- Dashboard `data-font-surface` typography (needs its own pass with product-side conventions).
- Letter-spacing adaptations for hi/bn locales (verify shaping; Devanagari/Bengali tracking should be 0 to avoid breaking joinery) — verify visually at the two locales.
- AdSense/font/plan-parity blockers remain separate (FAP-6/7/8).
