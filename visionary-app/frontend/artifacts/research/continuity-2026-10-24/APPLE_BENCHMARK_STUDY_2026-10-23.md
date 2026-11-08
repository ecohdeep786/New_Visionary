# Apple benchmark study — apple.com grade reading (2026-10-23)

Founder-mandated deep benchmark for the Visionary FAP work (feeds the D1 motion law,
the D3 interaction pass and the E2 media/edge pass). Three live pages driven in the
browser and measured with the project's own measurement method. Viewport
`1724×1172 @ dpr 1.31` (macOS-class desktop window). Nine screenshots were captured
during the session but were destroyed by the Oct-24 environment restart; every number
below was read from the live DOM and is recorded here as the durable record.

Pages studied (as driven):
1. `https://www.apple.com/education-initiative/` — scroll-chapter product page
2. `https://www.apple.com/apple-vision-pro/` — flagship product page
3. `https://www.apple.com/` — global home (hero density reading)

## 1. Control sizes (the 44px tier law)

| control family | measured |
| --- | --- |
| globalnav bar height | **exactly 44px**; every nav item height 44 |
| globalnav on deep pages | absolute (scrolls away); on home: fixed |
| carousel paddles | 36×36, `aria-label` "Previous / Next" |
| gallery play buttons | 38×38 |
| gallery tab strip | 24px-item scale (metadata, not primary controls) |
| country/footnote banner CTA | 36px tier |
| footnote superscripts | 5–6px type on a 20px hit line, non-interactive |

Distribution read: **p50 = 30px, p90 = 44px** — Apple runs ONE primary tier at 44 and
deliberately renders secondary micro-tiers below it. Visionary's D2/E1 law (every
interactive control ≥44) stays stricter than Apple on secondary surfaces; this
reading confirms the primary tier number rather than replacing our law.

## 2. Motion (the D1 reading)

- One resolve curve dominates: a quint-out/cubic resolve family behind the hero
  entrance, chapter statements and image reveals. **No bounce/elastic anywhere** on
  the three pages — Apple ships no overshoot.
- Education page: hero is pinned; on scroll the media fades / statements reveal
  scroll-synchronously ("scroll, then the text settles") — the exact cadence
  Visionary's scroll-driven statement reveals implement on hero/proof modules.
- Chapter transitions are long (0.8–1.2s feel); micro-interactions are short. A
  calm duration scale with no run-on interactions.
- `prefers-reduced-motion` rules measured live: education **2 rule sets**,
  vision-pro **2**, home **0** — Apple's reduced-motion coverage is inconsistent
  across its own pages. Visionary keeps the uniform stricter contract (global kill
  block + per-sheet contracts, pinned by the qa-motion reduced-motion law).
- Zero uppercase kickers observed (supports the B2 voice law).
- Linear loops occur only where Apple runs ambient self-running media — mirrors our
  recorded `linear` exception (spinner/marquee/progress with `infinite`).

## 3. Typography (D3 feed)

- Body root: 17px SF Pro Text. h1 34/50 w600; section statements 40/44 w600;
  quote blocks 28/32 w500–600; kickers ~12px w600 letterspaced, never uppercase.
- Visionary's Google Sans Flex 600 heading discipline matches the measured scale
  (17 base / 34 h1 / 40 statements / 28 quotes). No change requested by this
  reading; keep the recorded apple-typography sheet.

## 4. Media & loading (E2 feed)

- Image `srcset` coverage: education 43/43, home 70/71 attributes carry `srcset` —
  effectively 100%.
- `loading="lazy"`: **zero** occurrences across the three pages — Apple ships eager.
  Visionary's deferred-image loader stays lazy below the fold; the conscious
  exception should be hero media (eager priority). E2 must keep hero imagery eager
  and record the disagreement with the flagship page intentionally.
- Hero videos: full-bleed, muted, autoplay — poster-level sources measured at
  `1708×1044` and `820×530` ≈ 1.2–1.3× device density for the dpr-1.31 viewport.

## 5. Accessibility calls

- `main` / `contentinfo` landmarks true; banner region false on deep pages; skip
  link null at rest (focus-revealed pattern).
- Vision-pro chapternav: sticky subnav (`Overview / Tech Specs / visionOS…`) with
  `Book a demo` / `Buy` pills.
- Home: "iPhone Duo" / "iPhone 18 Pro" heroes on a dual-statement stack.
- Languages served: `en-IN` (education), `en-US` (home / vision-pro).

## 6. Laws fed forward

| Apple reading | consumed by |
| --- | --- |
| 44px primary nav tier; p50=30 secondary tolerance | D2/E1 (already stricter ≥44) |
| one resolve family, no overshoot, scroll statement reveals | D1 motion law (this task) |
| long chapters / short micro-interactions | D1 duration scale |
| inconsistent reduced-motion across pages | D1 uniform contract (stays) |
| typography discipline (17/34/40/28; no uppercase kickers) | D3 (confirm recorded sheet) |
| srcset ~100%, eager hero media, 1.2–1.3× video density | E2 media/edge pass |
