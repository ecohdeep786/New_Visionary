# E1 · Continuity law QA + D2 tap-target slice — evidence record

**Task:** E1 (continuity QA script) + the D2 responsive/tap-target slice of the FRONTEND_AGI task chain (`` `FRONTEND_AGI_TASK_REBUILD_2026-10-21.md` ``).
**Branch:** `opencode/fap-continuity-qa` from verified `origin/dev` `592d4752` (fresh worktree per D-098).
**Merge protocol:** amended founder protocol — task branch → `beta` → `dev`, both pushed and remote-verified.
**Review status:** implementer cannot self-approve (D-095) — separate reviewer acceptance pending; Jira transitions rest with the founder (no credentials in this session).

## What was built

`frontend/scripts/qa-continuity.mjs` — dependency-free static law checker over the public
landing system (`src/pages/landing` + `src/components/landing`, 42 files), exit-1 on any
law failure, `--out <file>` JSON receipts, `-q` quiet mode:

1. **tap-target-44px (D2)** — every interactive `<button>`/`<a>` on the public surface
   ≥44px (`h-11`+); `h-9`/`h-10` inside button/anchor tags fail. The tag walker balances
   quotes and any `{…}` scope (plain expressions + templates) so CRLF files and arrow
   functions parse exactly. `aria-hidden`/`pointer-events-none` marks exempt; icon SIZE
   inside a control is not the control size.
2. **no-uppercase-kickers (B2)** — `text-transform: uppercase` (CSS/style objects) and
   standalone `uppercase` utilities inside class attributes fail; prose mentioning
   uppercase is clean.
3. **legacy-hex-residue (A3 receipt)** — the recorded banned Google/legacy value set
   never appears in public UI files. `system/tokens.js` is the alias/definition site and
   is reported, not failed.
4. **unknown-law-hex freeze (E1)** — every raw hex must belong to the law palette:
   values defined in `tokens.js` (read dynamically), the recorded measured core, or
   receipt-justified file-scoped exceptions. Unknown values fail, so the palette cannot
   drift without a recorded decision.
5. **invalid-rba-artifact (A3 artifact pass)** — `#rgba(` invalid color artifacts fail.

Reported-only metrics: per-page raw-hex counts and raw `#0066cc` link sites (the A3
retag keeps law values inline intentionally).

Wiring: `frontend/package.json` → `"qa:continuity"`; root `scripts/check.mjs` runs the
scanner after `verify-imports.mjs` and registers `scripts/tests/continuity-law.test.mjs`
(5 node:test law probes: CRLF/template tag walking, tap-target detection + exemptions,
hex law incl. allowed sets, uppercase class-vs-prose distinction, `#rgba(` artifact).

## First-scan findings (e1-first-scan.json — 26 failures)

- **15 × tap-target-44px** — sub-44px interactive controls on the public surface
  (class-string line numbers):
  - `PersonaSections.jsx`: 385 play/pause journey (`h-9 w-9`), 404 + 413 carousel
    prev/next (`h-9 w-9`, template classNames), 487 close HUD (`h-9 w-9`);
  - `PremiumPersonaSections.jsx`: 452, 753 play/pause; 575, 583, 876, 884 language/stage
    arrows (`h-9 w-9`); 1353, 1363 destinations arrows (`h-10 w-10`);
  - `LandingNav.jsx`: 279 skip-link (`focus:h-10`);
  - `AILearningPage.jsx`: 81 segmented tab (`min-h-10`); `UpdatesPage.jsx`: 327 filter
    chip (`min-h-9`).
- **10 × unknown-law-hex** — off-law raw values: `#0059b4` (AILearning pressed state),
  `#f7f8fa` ×4 (Cookies/Privacy/Security/Terms page canvases), `#F5F6F8` (School),
  `#f5f7fa` ×2 (Premium stage ground), `#f3f4f6` ×2 (LazyImage placeholder default),
  `#1765cc` (FAQ link hover), `#e8eaed` (FAQ border).
- **1 × invalid-rba-artifact** — `bg-[#rgba(0,102,204,0.10)]` at
  `PersonaSections.jsx:715`: the `#` prefix makes the arbitrary value unparseable, so
  the active-tab tint silently never rendered. Real render bug, caught by the law.
- **0** uppercase kickers, **0** legacy-hex residue in UI files, **0** invalid artifacts
  elsewhere.

## Fixes applied

- 15 tap targets → 44px (`h-11 w-11` / `min-h-11` / `focus:h-11`), matching Apple's own
  minimum and the recorded D2 AC.
- Hex retags onto recorded law values (1:1, visually bounded):
  `#0059b4` → `#006edb` (tokens.js documents `#006edb` as the commerce *active* tone),
  `#f7f8fa`/`#F5F6F8`/`#f5f7fa`/`#f3f4f6` → `#f5f5f7` (law ground),
  `#1765cc` → `#0071e3` (law hover blue), `#e8eaed` → `#d2d2d7` (law line).
- Artifact fix: `bg-[#rgba(0,102,204,0.10)]` → `bg-[rgba(0,102,204,0.10)]`.
- **16th fix (render-gap, found in browser verification):** `src/styles/public-icons.css`
  `--icon-control-size: 2.25rem` → `2.75rem`. The landing design system pins public icon
  controls (carousel/gallery arrows, story-plus, dialog close) to this var with
  `!important` at ID-level specificity, so buttons that literally carried `h-11 w-11`
  still computed 36×36 (an inline `height:44px` override test stayed 36 too — `!important`
  beats it). Fixed at the single definition point; glyph tokens untouched (icon art stays
  24px in the 44px circle). See `render-check-receipts.json` for the cascade dump.

## Law-palette exceptions recorded (receipt-justified, not silent)

- Global: `#e8e8ed` (chip/hover depth above the `#f5f5f7` ground — greyPill/chipPill
  hover slot), `#188038` (success-ink green, AA-safe for 12–13px trust captions;
  `#34c759` remains the fill law for larger success surfaces).
- File-scoped: `PremiumPersonaSections.jsx` stage grounds `#0d1017`/`#0a0d14` + on-dark
  hover `#6bb6ff`; `AboutUsHero.jsx` persona door tints `#e9f5ef`/`#fef3df`/`#f3edff`/
  `#fcebe8`; `SpotIllustration.jsx` (whole-file editorial illustration palette — art,
  not UI law).
- Intentionally untouched (non-interactive, out of the law's scope): `PersonaSections`
  363 decorative badge, `:881` VoiceIcon default size, `ResearchNewsPage` 178 svg,
  `SchoolPage` 184 icon, `ValuesStrip` 36 span, `LandingNav` h-10 spans (icon size ≠
  control size).

## Open follow-ups recorded

- `tokens.js` still defines 5 legacy aliases (`#121317`, `#5f6368`, `#dadce0`, `#4285f4`,
  `#e8f0fe`) — alias site only, reported metric; a tokens-cleanup task should grep the
  full repo (including dashboard consumers) before removal.
- Metrics baseline (report-only): pages carry 0–96 raw law-value hexes inline (A3's
  1:1 remap keeps values inline by design); true convergence to token exports stays a
  listed bounty, not a law failure.

## Verification

- Law scan after fixes: `qa:continuity` → **all recorded public-surface laws pass**,
  exit 0 (`e1-after-scan.json`).
- Law unit tests: `node --test scripts/tests/continuity-law.test.mjs` → 5/5 pass.
- Full gate: `npm run check` (layout → imports → qa-continuity → 4 script-test files →
  surface audit → lint → typecheck → test → build): **GREEN twice** — first after the
  source fixes, then again after the `public-icons.css` render fix (624/624 app tests,
  23/23 script tests incl. 5 continuity-law probes, all public-surface laws pass,
  surface audit re-baselined, lint/typecheck ✓, production build ✓). The commit SHA is
  the gate-of-record; merge and remote refs follow the amended founder protocol.

### Render verification (browser measurement + screenshots — `render-check-receipts.json`)

- **Token-based scan vs render truth:** after the 15 JSX fixes, persona carousel arrows
  still computed 36×36 while carrying `h-11 w-11`. Root cause: the `public-icons.css`
  design-system pin (see the 16th fix). The scanner cannot see CSS-level defeats —
  recorded as its known blind spot; proposed follow-up: collect `--icon-control-size`
  from `public-icons.css` in the law scan and fail below 44px, plus an optional runtime
  verification pass on rendered pages.
- Before/after DOM measurements (transform-proof: offsetWidth/offsetHeight +
  getComputedStyle; entrance animations settled; fresh `h-11 w-11` probe div in body
  measured 44 — base utilities correct):
  - persona carousel arrows (student + teacher pages, both clusters): before 11 buttons
    @36×36 → after 44×44 (computed 43.99px);
  - updates email "You will receive" chips: before 4 @36 (`min-h-9`) → after 44
    (`min-h-11`); the top filter chip row and CTA chips already used `min-h-11` at HEAD
    (verified against `HEAD` source) — not part of this delta;
  - AILearningPage plan tabs (route `/pricing`): before 40 (`min-h-10`) → after 44
    (`min-h-11`).
- Paired screenshots, same scroll anchors in both states (cluster top − 280 px, 1.2 s
  settle): `screens/before/` vs `screens/after/` — index below.

## Evidence index (this folder — before/after, per founder request)

- `e1-first-scan.json` / `e1-after-scan.json` — machine receipts of the law scan.
- `e1-first-scan-console.txt` / `e1-after-scan-console.txt` — byte-faithful console
  transcripts (before: 26 failures listed; after: all laws pass, exit 0).</think><tool_call>edit<arg_key>newString</arg_key><arg_value>- `e1-source-diff.patch` — full tracked-file source diff of the task (13 files,
  +31/−31; includes the `public-icons.css` render fix — see renders below).
- `render-check-receipts.json` — render verification: both states' DOM measurements,
  the `public-icons.css` cascade dump, the render-gap cause/fix, and the paired
  screenshot index.
- `screens/before/` + `screens/after/` — 12 paired rendered captures (6 regions ×
  before/after): student/teacher carousel hero + voice rows (circles 36→44),
  updates email chips (36→44), AI-learning plan tabs (40→44). Founder's display scale
  (dpr 1.31) preserved in the captures.

## Workflow incident recorded (transparency)

At ~17:20 local an external process on this machine ran `npm install vite` at this
worktree's product root and then served port 5174 from that ROOT `node_modules`
(npm debug log `2026-10-23T17_20_17_594Z-debug-0.log`, PID 5764). That install violates
our own layout gate (`verify-layout` forbids `node_modules` at the product root) and
rooted the vite binary outside the sanctioned frontend package. Cleanup: root
`package.json`/`package-lock.json` restored via `git checkout --`, root `node_modules`
removed, serving process closed. The founder-facing preview on port 5174 was restored
through the sanctioned delegated path (`npm run dev` → `scripts/frontend.mjs` → vite
from `frontend/node_modules`), serving the FIXED pages.
