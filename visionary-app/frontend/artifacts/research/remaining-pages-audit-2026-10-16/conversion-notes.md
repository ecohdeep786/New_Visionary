# Public premium conversion — change log & findings (2026-10-16)

Method: per-page deep audit (dom probes + before-captures) → convert → verify (live probes,
after-captures 1440 + 390, eslint / typecheck / build / tests). Bar reference: approved
landing + six category pages. Evidence folders:

- `dom/*.json` — pre-change DOM audit probes (all 17 pages)
- `dom/_summary.txt`, `dom/_type.txt` — cross-page summaries
- `captures/before/**` — pre-change viewport segments
- `captures/after/**`, `captures/after-mobile/**` — post-change segments

## Cross-cutting fix — statement-tier selector (applies site-wide, proven scoped)

`apple-typography.css` statement rule matched `:is(h3,p)[class*="clamp(28px,2.78vw,40px)"]`.
The substring also matches HAT gap calcs living in margin utilities
(`mt-[calc(clamp(28px,2.78vw,40px)*0.857)]`), silently promoting body copy to the 40px
statement tier. Pre-existing — visible in `captures/before/how-it-works-before-seg02.jpg`.
Fix: scope the match to the text-size utility `[class*="text-[clamp(28px,2.78vw,40px)]"]`.

Scope proof:
- `grep calc(clamp(` → only `DownloadPage.jsx` (clamps `20px,2vw,26px` / `36px,5vw,72px`;
  no statement rule targets those on p) and `CoachingPage.jsx` (the false matches).
- After fix: step bodies 18/25 ink (accepted body tier); step h3s still 40/44 via their
  `text-` utility. Re-measured `/student` chapter values byte-identical (17/500 eyebrow,
  72/72 h2, 24/600 sub, 17/400 #0066cc quiet links, black pill CTA).

## 01 · `/how-it-works` — `CoachingPage.jsx` — DONE (proof page, awaiting user review)

### Chapters (bridge rhythm)
- Added `data-section`: `01-hero`, `04-journey`, `05-loop`, `06-people`, `07-cta`.
  Desktop rhythm lands canonical 158.4/158.4 at 1440 (was inner `py-24/32`).
- Joins: `04-journey` transparent (white→white, base rule); `06-people` transparent via
  new page-scoped rule (`public-bridge.css`, `.page-how-it-works`); `05-loop` / `07-cta`
  keep the whisper hairline (surface change, same as accepted `12-cta`/`13-explore`).
- `rounded-t-[32px]` added for source parity; renders 0 under the bridge `border-radius:0
  !important` (verified same on accepted pages — the "tuck" is theoretical site-wide).

### Chrome → premium vocabulary
- Palette: `#F5F6F8` → `#f5f5f7` (surface/soft); mock hairlines `#dadce0` →
  `rgba(18,19,23,0.12)`.
- `MockShell`: browser dots + border removed → grey module field (`rounded-[30px]`, p-4/6/10)
  + borderless white card (`rounded-[20px]`) + quiet 14px label. Product UI inside keeps its
  own borders (Apple showing iOS screenshots).
- Step copy: grey micro panels → plain 14px grey text under body.
- Loop: chips borderless (active ink pill / white inactive), demo card borderless with grey
  icon disc, caption 14px light-grey.
- People: accent-gradient on closing phrase; segmented control = grey track + ink pill
  (narrow screens: scrollable strip — 342/468px at 390, page overflow 0); scenario column
  chrome-less; quiet links `17/400 #0066cc` + chevron.
- CTA: PremiumCTASection anatomy — no eyebrow, display h2 (72/72), black pill
  (`h-12 bg-[#121317]`), quiet blue link beside it, fine print beneath.

### Verified
- Chapters table: 158.4/158.4 ×4, joins as above, radius 0, overflowX 0 @1440 and @390.
- Type: h1 64/600 (matches `/pricing` family), h2 72/72 ×3, step h3 40/44, body 18/25,
  links 17/400 `rgb(0,102,204)`, pill 17px / 48px tall. No failed requests.
- `eslint --quiet` clean · `tsc` both configs clean · `vite build` clean · 524/524 tests.
- Evidence: `dom/how-it-works.json` (before), `dom/how-paras-after.txt` (after),
  `captures/after/how-after-seg00..09.jpg`, `captures/after-mobile/how-after-m-seg00..10.jpg`.

### Open items (not defects, noted)
- Pre-existing lint warnings in `CoachingPage.jsx`: unused `HERO_WORDS`, unused `visible`
  (both predate this change — left untouched).
- `500 /api/auth/me` in dev = dev-backend baseline, not page related.
