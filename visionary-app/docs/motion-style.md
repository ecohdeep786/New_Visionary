# Visionary Motion Style — Google × Apple

How Visionary moves, measured from live pages (2026-09-30, headless Chrome at
1440×900 with `prefers-reduced-motion` emulated): apple.com, apple.com/iphone-18-pro,
apple.com/apple-vision-pro, workspace.google.com, edu.google.com. Raw probe
output: `scripts-tmp/motion-study/`. Applies to every landing surface.

## The measured references

- **Apple** — links transition `color 320ms cubic-bezier(0.4, 0, 0.6, 1)`
  (their most-used transition, 230×); opacity micro-fades run 160–240ms `ease`;
  a below-fold headline revealed **opacity 0→1 in ~960ms with a 30px rise**,
  easing strongly decelerate (opacity 8% → 44% → 86% at 25/50/75% of the window).
- **Google** — the micro-transition is **200ms** (color, background, box-shadow
  all `ease`/`ease-in-out`); card hover lifts the shadow at 200ms; accordions
  run 300ms `ease-out`; Material standard curve `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Both, under reduced motion** — content renders at opacity 1 instantly, no
  entrance animation, nothing hidden below the fold.

## The Visionary system

| Token | Value | Where |
|---|---|---|
| Reveal duration | **700ms** | every scroll reveal (one grammar) |
| Reveal curve | **`ease-google` = cubic-bezier(0.22, 1, 0.36, 1)** | decelerate, the Apple-measured shape |
| Reveal distance | **translateY 24px** (`translate-y-6`), opacity paired | never distance without opacity |
| Keyed remount (word cyclers, slide swaps) | **`hero-fade-up` 550ms** same curve | cycling text, carousel slides |
| Hover/micro | **200ms** | g-card shadow lift, pill color shifts |
| Card hover | shadow lift only, **no scale** | g-card rest→hover per google.com |
| Press | `active:scale-[0.98]` on pill CTAs | subtle confirmation, never hover scale |
| Image hover | `scale-[1.02]` 500ms inside cards | the one allowed zoom, media only |
| Reduced motion | **instant visible** (opacity 1, no animation) | `.hero-fade-up` reduce rule; `motion-reduce:*` on reveals |

## Rules

1. **One reveal grammar.** Every scroll reveal is `transition duration-700
   ease-google` + `translate-y-6 opacity-0 → translate-y-0 opacity-100`.
   Never reveal with transform only; opacity leads.
2. **Never hide content from reduced-motion users.** Any animated entrance
   needs an opacity-visible fallback; keyed remounts must never sit at
   opacity 0 (see the `@media (prefers-reduced-motion: reduce)` block in
   `src/index.css`).
3. **Hover never scales surfaces.** Cards lift shadow (200ms); text links
   shift color; only media inside a card may zoom, and only 2%.
4. **Decelerate everything entrances do.** Fast start, long settle. If a
   transition needs `ease-in`, it is probably a bad idea on this product.
5. **Ambient motion is scarce.** Only deliberate ambient loops exist (the hero
   float, the One Intelligence rings). Nothing else loops infinitely.
6. **Heroes are frozen.** The approved hero entrance sequences
   (`appleRise`/`appleTextIn`/`appleFloat` + stagger, and the PersonaHero
   treatments) are read-only design.
7. **Autoplay rhythm.** Word cyclers 2.5–3.2s per beat, carousels 4–4.2s,
   progress fills 4s — paced for reading, all pausable/hover-safe where
   interactive.

## Voice checklist before shipping motion

- Does it settle (decelerate) instead of snapping or bouncing?
- Is 200ms the duration for any hover? Is 700ms the duration for any entrance?
- Under reduce, is everything readable with zero animation?
- Would Apple print this motion without blushing, and would Google ship the timing?

## The Vision Pro page grammar (added 2026-09-30)

Measured from live apple.com/apple-vision-pro: the page is ~36 viewports tall
in huge chapters (2.4–14.6 viewports) holding pinned full-viewport media
stages; the scroll animation lives in those pinned stages, while statement
headlines are static in flow. Transferable grammar now on our pages:

1. **Sheet-stack scroll** (`system/useSheetStack.js`, five persona pages) —
   every `main [data-section]` sheet scrolls normally, then pins
   (transform-only) with its bottom at the viewport bottom while the next
   sheet — rounded top 32px, opaque — slides up over it. The hero freezes at
   its natural top. Self-correcting per frame (heights re-derived from live
   rects), transform-only (layout and scroll length never change), disabled
   under reduced motion.
2. **Pinned scrub stage** (Landing One Intelligence, desktop) — a 280vh
   runway with a `sticky top-[10vh]` visual; scroll progress advances the
   four phases (0.24 each, finale ≥0.96). Mobile and reduced motion keep the
   autonomous timer. `overflow-hidden` on the section breaks `position:
   sticky` — use `[overflow-x:clip]`.
