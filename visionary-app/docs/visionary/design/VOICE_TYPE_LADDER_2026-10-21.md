# Voice → type ladder (B1, FAP-46) — 2026-10-21

**Law:** assign a `data-type` role, never a new page-specific font size. Every landing
section carries roles from this page. Raw fluid sizes (`text-[clamp(…)]`) are retired
from the landing sources; the bridge's clamp-retag fallbacks no longer trigger there.

**Tier source:** `src/styles/rhythm.css` (FAP-34 measured ladder,
`APPLE_TYPE_SCALE_SPEC_2026-10-20` evidence `artifacts/qa-2026-10-20/type-matrix.json`).
**Rule layer:** `src/styles/apple-typography.css`, `@layer public-type-roles`, scoped to
`#main :where(section:not([data-section="01-hero"]):not(:has(h1)) …)` — heroes and
sections containing an h1 are deliberately outside the layer.

## Voice → role map (landing surface)

| Voice (what the text is) | `data-type` role | Measured tier (1440 / 1068 / 734) | Landing home |
| --- | --- | --- | --- |
| Hero headline (the one statement on the stage) | `display` | 64 / 56 / 40 · lh 1.0 · track −0.009em | NewPersona h1 (marker only — the hero keeps its cast/speech anatomy; the layer excludes `01-hero` and any section containing an h1 by design). **One-voice law for the rotating line:** the landing's audience size is fitted ONCE per width from the widest fragment (canvas measure vs the 980px copy column) and held in state — every word renders at the same size (117 / 96 / 41.5 measured); the earlier per-word fit that re-ranked words by length ("for students." larger than "for organizations.") is fixed as a B1 size bug |
| Persona page statement (64px rotating-accent statements) | `section` | 64 / 56 / 40 · lh 1.0625 · track −0.009em · 600 | persona `04-journey` h2s; Premium persona/CTA/closing statements (the `40px,5vw,64px` family) |
| Chapter head (education section head) | `section` | same ladder as above | Landing section h2s; Problem/Promise h2s (were bridge-retagged `40px,5.55vw,80px` → `--fs-h2` — roles now carry the same computed values, the bridge entry goes dormant) |
| Dark-intelligence statement (promo scene) | `section` (dark-scene ink/link flip automatically) | same | Premium `05-intelligence` h2s |
| Story-panel statement (journey modal title) | `story` | 48 / 40 / 28 · lh 1.083/1.1/1.143 · track −0.009em | PersonaSections `JourneyModal` h3 |
| Card/tab statement (accordion + mode card statements) | `feature` | 28 / 24 / 21 · lh 1.143 · track +0.007em | PersonaSections achievement accordion h3s |
| Featured question (language chapter live line) | `feature` | 28 / 24 / 21 | Premium language question span (keeps its `lang` attribute — Indic floor still applies through `[lang]`) |
| Intelligence drawer beat title | `feature-heading` | 32 flat · lh 1.125 · track +0.004em · 600 (token measured in FAP-34; role rule added by B1) | Premium `IntelligenceDrawer` h3s |
| Pull-quote (problem slides, quote cards) | `editorial-lead` | 24 / 21 / 19 · lh 1.167 · track +0.009em · 600 | Landing problem slide quote; PersonaSections spoken lines use `body` (they are read-aloud lines, not pull-quotes) |
| Body voice (chapter subs, spoken lines) | `body` | 17px · lh 1.19048 · track −0.022em · 400 | persona journey subs (18px), Premium chapter subs (18px), PersonaSections quote lines (17→21px) |
| Value cards (name + line) | `value-title` / `value-body` | 19px · lh 1.210526 · track +0.012em | Landing value rows; Premium value grids (already adopted in A5) |
| Promise/quote chapter statement | `card-chapter` | 48 / 40 / 32 · lh 1.0834 · track −0.009em · 600 | Landing promise quote (already adopted) |
| Numbered kicker, eyebrows, attribute captions | — | out of B1 | **B2** re-titrates eyebrows (sentence-case kill) and caption/attribute patterns; existing bridge label/body-life fallbacks keep serving them meanwhile |
| Scene word statements (meet/language overlay words) | `display` | 64 / 56 / 40 · lh 1.0 · track −0.009em · 600 | PersonaSections scene-overlay spans (the `40px,4.5vw,72px` rotating words) |
| Footer wordmark (decorative, aria-hidden) | — | bespoke scene anatomy | LandingFooter's wordmark stays measured; roles return chapter-by-chapter in D-tasks if ever needed |

## Review checklist (what a reviewer checks on a landing-diff)

1. Every `h1`/`h2`/`h3` inside the landing sources carries `data-type` from this page.
2. No `text-[clamp(…)]`, and no scale-bearing `text-[Npx]`/`tracking-[…]`/`leading-[…]`
   utilities on role-carrying headings — the role layer owns size/tracking/leading/weight.
3. Layout utilities (margins, max-width, balance, color) stay on the element.
4. Bridge clamp-retag selectors (`h2.text-[clamp(…)]` blocks in `public-bridge.css`)
   match **zero** elements on the landing routes (rendered probe receipt).
5. Typography fingerprint diffs are explained line-by-line by this map's drift column.

## Enforcement

- `eslint.config.js` — scoped `no-restricted-syntax` on the six landing sources:
  headings without `data-type` and any authored `text-[clamp(…)]` class fail lint.
- `tests/landing-type-roles.test.mjs` — source-scanned regression lock (the same two
  conditions, plus role-vocabulary membership).
- `scripts`-level rendered probe `b1-type-roles.mjs` — per route/width: zero headings
  without `data-type`, zero bridge-retag class matches, results in
  `artifacts/research/continuity-2026-10-21/b1-type-ladder/`.
