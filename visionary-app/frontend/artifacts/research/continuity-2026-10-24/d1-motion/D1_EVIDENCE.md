# D1 — One motion law · EVIDENCE

Task: D1 (FAP board) — one product motion law: `--ease-out-apple` resolve curve + one
duration scale, scroll-driven statement reveals kept intact, reduced-motion =
static-and-visible, no bounce. New motion audit script wired into `npm run check`.
Branch `opencode/fap-d1-motion` (worktree from `origin/dev` @ `0306703e`).
Implementer session: opencode, 2026-10-24.

## 1. what D1 found

The motion system was real but forked. Inventory at branch start (static recon of
`frontend/src` + `tailwind.config.js`):

| site family | count | state at start |
| --- | --- | --- |
| `--ease-out-apple` (0.16,1,0.3,1) | 1 def (premium.css `:root`) + ~30 uses | correct curve, wrong home |
| `--ease-spring` (0.22,**1.4**,0.36,1) | 1 def + uses | **bounce curve** (y1 overshoot) — law violation |
| `--ease-google` (0.22,1,0.36,1) | 1 def + uses + ~26 `ease-google` utility classes | duplicate curve family fork |
| literal `cubic-bezier(0.22, 1, 0.36, 1)` | ~9 (JSX `<style>`, template transitions, hero keyframes) | second curve family |
| bare `ease` / `ease-in-out` / `ease-out` keywords | ~18 across 9 CSS sheets + 4 JSX inline/`<style>` | off-law curves |
| transition with duration but **no timing** | ~20 (`var(--v-motion)` pattern + `.15s,` pairs) | CSS default `ease` sneaks in |
| Tailwind default utility curve | framework-wide | `cubic-bezier(0.4,0,0.2,1)` inside every `transition-*` utility |
| generated accordion animations | 2 (`0.2s ease-out`) | off-law curve from tailwind config |

Two curve families, one banned bounce spring, a dead-google naming family, framework
defaults and hand-written keywords — D1 collapses all of it into one law.

## 2. the law (recorded)

`src/styles/tokens.css` is now the single token home:

- **Curve**: `--ease-out-apple: cubic-bezier(0.16, 1, 0.3, 1)` — the one resolve-out
  curve for every transition and entrance animation. No other cubic-bezier, no easing
  keywords, no bounce/elastic output (y outside 0–1).
- **Duration scale**: fast 180ms / base 280ms / slow 420ms / statement 650ms /
  cinematic 900ms. The five steps carry the reveals; ambient loops and micro-presses
  may keep their recorded durations (informational, not audit-failing).
- **linear exception**: legal only on self-running loops (`infinite`) — spinner,
  marquee, pointer-driven `ease-linear` drags.
- **Reduced motion**: static-and-visible — the global kill block (index.css) plus
  per-sheet contracts; the cast stage keeps a fade-only fallback (no movement).

## 3. conversions applied

- **tokens.css**: motion law block appends the curve + 5-step scale (single home;
  comment documents the exceptions and the audit).
- **premium.css**: spring + google curves deleted (retired); durations normalized onto
  `0.5s→slow`, `0.45s→slow`, `0.6s→statement`, `0.2s→fast`, `0.3s→slow`, `0.4s/0.42s→slow`;
  every `ease` keyword → the law var. Header records the retirement.
- **index.css**: lazy-loading fade, `hero-fade-right` (1.4s→cinematic), `hero-fade-up`
  (0.55s→slow), reveal system (`--reveal-ease` indirection REMOVED — reveal-item /
  stagger-group / media-settle now reference `var(--ease-out-apple)` + cinematic token
  directly).
- **workspace sheets** (`workspace.css` ×7 decl groups, `workspace-design.css` ×12,
  `workspace-premium.css` ×1, `guide-premium.css` ×1): every bare `--v-motion`
  transition and raw `ease`/`ease-out` keyword gets the law curve; `--v-motion`
  re-homed onto `var(--motion-duration-fast)`; `v-orb-in` bezier `(0.2,0,0,1)` retired;
  ambient voice loops (5s breathe / 2.1s bars) ride the law curve.
- **public-system.css** (public buttons, ×4 segments) and **App.css** (×2): law curve.
- **reduced-motion**: cast.css fallback now uses the statement token + law var
  (fade-only, static-and-visible).
- **JSX inline motion**: NewPersona (`figIn`→cinematic, `heroLineUp`×2→cinematic,
  `heroFadeUp`→slow), PersonaSections (reveal templates → var + tokens, `1500ms`
  cross-fade → law curve, Tailwind arbitrary `animate-[heroFadeUp_…]` → law var,
  `--reveal-ease` per-element custom property REMOVED), PremiumPersonaSections
  (statement crossfade, `voiceDot` ambient → law var), Explore (press state → fast +
  law var), ui/sheet (dropped the `ease-in-out` utility class), BreathingExercise
  (dropped `ease-in-out` ×2), PartnersPage (dropped `ease-out` class).
- **Persona-class sweep**: `ease-google` utility name — no CSS definition exists (dead
  classes) — replaced by `ease-apple` (the law class) in 19 files / ~33 sites, Persona,
  premium persona sections and the full landing surface.
- **tailwind.config.js**: `transitionTimingFunction` override — `DEFAULT` +
  `apple`/`in`/`out`/`in-out` → `var(--ease-out-apple)`, `linear` kept only for drag
  classes; generated `accordion-down`/`-up` animations now carry the law curve. Every
  `transition-*` utility in the codebase resolves to the one curve from now on.

## 4. enforcement (the D1 acceptance gate)

- `frontend/scripts/qa-motion.mjs` (new, dependency-free): scans every src CSS/JS/JSX
  motion value — CSS declarations, inline style strings, reduced-motion conditional
  guards, curve constants, Tailwind `animate-[…]` values, template `<style>` text and
  tailwind config — plus length-preserving comment stripping so prose never trips and
  file:line reporting is exact. Laws: (1) curve + missing-timing, (2) linear-only-infinite,
  (3) analytic bounce ban (any bezier control y outside [0,1]; the old
  `(0.22,1.4,…)` spring fails this check by construction), (4) retired
  `--ease-spring`/`--ease-google` def/use ban, (5) single token home, (6) tailwind
  override + accordion law, (7) `ease-in/out/in-out/spring/google` class ban
  (`ease-linear` exempt), (8) reduced-motion contracts present.
- Wired: `npm run qa:motion` (frontend), `frontend:qa:motion` (product root),
  `scripts/check.mjs` runs it right after the continuity check, and
  `scripts/tests/motion-law.test.mjs` (16 tests, mirrors continuity-law) — in-check.
- Mid-conversion run (81 real — every off-law site detected, zero false positives in
  the final set): recorded in-session, superseded by the receipt pair below.
- Receipt pair (same scanner, both trees):
  `d1-before-scan.json` — scanned against the BASE commit `0306703e` (a temp
  worktree; the scanner is self-contained so it reads the pre-D1 source) →
  **123 motion-law failures** (curve forks, retired spring/google curve
  definitions and the pre-existing tailwind `google` key carrying the 0.22-family
  bezier, 33 dead `ease-google`/`ease-out` classes, bare no-timing transitions,
  tailwind default curves, token-home duplication);
  `d1-after-scan.json` — the D1 tree → **403 motion-bearing source files scanned;
  0 failures**; duration histogram recorded (120ms–70s; the five scale steps live in
  vars so they do not appear as literals).
- Reduced-motion sweep: the audit's law 8 pins the contract sheets (index.css global
  kill + premium/workspace/workspace-design/cast); E1-era browser sweeps recorded the
  static-and-visible behavior and those sheets are unchanged in behavior, only
  curve-var references converted.
- Scope-surface audit (`npm run scope:audit:write`, task KAN-28/SCOPE-01): states
  **512 connected / 931 preview / 59 missing / 154 intentionally-unreleased** —
  identical to the E1 baseline; the D1 motion work introduces zero scope drift
  (states re-baselined in-tree by `surface-audit.mjs --write`).

## 5. verification

- `node --test scripts/tests/motion-law.test.mjs` → 16/16 pass (includes the in-tree
  integration run asserting exit 0).
- `node frontend/scripts/qa-motion.mjs` → exit 0.
- Full `npm run check` (layout/import verification → continuity check → motion check →
  product script tests incl. motion-law → frontend lint → both typechecks → tests →
  production build): recorded at the merge receipt below.
- Scope-surface audit above ran via `npm run scope:audit:write` (separate, in this
  worktree) — receipts live in `frontend/artifacts/scope-audit/`.
- D-095 tension recorded (rule, not blocker): founder directed continuous progression
  between tasks while the D-095 reviewer-acceptance gate stays pending for this and
  the E1/D2 slice (`a364bf45`). Jira statuses remain founder-controlled (no live
  credentials). Reviewer must record the exact reviewed commit before Done.
