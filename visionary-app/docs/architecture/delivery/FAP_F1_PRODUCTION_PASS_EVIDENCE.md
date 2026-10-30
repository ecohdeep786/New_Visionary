# FAP-F1 — final production pass evidence (FAP-35)

Status: **Testing pending D-095 external review** · Lane: `opencode/fap-f1-final-pass`
(base `beta@1550d5fa`, verified origin tip 2026-10-29) · Claimed live on the board
(To Do → In Progress, transition 31, 204 + readback; start comment **10345**).

## Assignment

Board summary (no ticket body): *"FAP-F1 Final production pass — apply the measured
Apple-premium spacing and composition system across every remaining public page."*

Interpretation kept to the words: **spacing + composition only** (the previous passes
already own the type ladder, CTA anatomy, ink palette and motion laws — receipts in
task-executions.json). The one remaining asymmetry was architectural: the public
*document surfaces* were never chapterized, so the canonical measured chapter law did
not reach them, and they ran hand-set band paddings (56/64/96/128px muddle) page by page.

## Measured source (new measurement, this pass)

Live CSSOM measurement of `apple.com/privacy/` on 2026-10-29 at the 1000×700 window
(Apple's *medium* band, 735–1068) — the same spirit as
`docs/visionary/design/APPLE_MEASURED_REFERENCE_2026-10-21.md`:

| Role (measured) | Value |
| --- | --- |
| chapter band padding-block | 128/128, 140/130, 140/128, 130/x px |
| statement→copy gap (after 58px/600 statement) | 43px |
| router/closing band | 140/140, statement 64px/600, gap 52px |
| dark ground | the whole page (ours keeps its own recorded surfaces) |

The tuned document-band clamp `clamp(6rem, 12.5vw, 10rem)` reproduces ~125px at the
medium band (measured: 128–140), keeps the shared 96px phone floor
(narrow-screen law: 80–104px) and the 160px desktop cap of the global chapter law.
Apple's phone band and the adjacent-chapter air therefore stay inside the recorded
system — no new floors were invented.

## Delta map (what changed, per surface)

The codemods (retained, dependency-free, exact-once rules, receipts in this repo):
`frontend/scripts/f1-policy-chapterize.mjs` (56/58 rules) +
`frontend/scripts/f1-policy-chapterize-fixup.mjs` (2 rules: summary plates + the
CRLF multi-line category opener). Net diff: 8 page files, 72+/71−.

| Page | Chapters joined into the law | Stays authored (by design) |
| --- | --- | --- |
| `PrivacyPage` | 02-summary … 12-grievance + 13-key-terms / 14-related / 15-questions (14/14 sections tagged) | hero plate paddings, internal row hairlines, scroll-mt anchors |
| `TermsPage` | 02-summary … 14-contact + 15/16/17 (16/16) | same |
| `SecurityPage` | 02-summary … 12-contact + 13/14/15 (14/14) | same |
| `CookiesPage` | 02-summary … 08-contact + 09/10/11 (10/10) | same |
| `AccessibilityPage` | 03-statement, 04-`{category}` ×4, 05-sync, 06-resources, 07-commitment, 08-closing (6/7) | the quiet tagline plate (hero-adjacent) |
| `SchoolPage` (`/help`) | 02-discover, 03-contact (2/3) | the search hero plate |
| `CareersPage` | strip `01b-life` joins the compact-band law (8/8) | the other 7 chapters were already on the law |
| `DownloadPage` | strips `02b-tray` + `04b-strip` (7/7) | the 5 content chapters were already on the law |

Everything the law already carried stays untouched: horizontal gutters
(`px-6 sm:px-8 lg:px-10`), authored mirrors, hairline seams, `divide-y` document
separators, CTA anatomy, D1/D2 laws, C4 honesty controls.

## Law carrier (public-bridge.css, the F1 block)

1. **Document band override** — `.page-privacy/.page-terms/.page-security/.page-cookies/
   .page-accessibility/.page-school` mains set
   `--public-section-py: clamp(6rem, 12.5vw, 10rem)`.
2. **Statement→copy gap** — in the six document mains the measured gap carries on
   the heading wrapper and on bare-h2 blocks (rendered DOM audit: 55/59 h2-chapters
   wrap eyebrow+h2 in one div with the copy as the wrapper's next sibling; the
   "at a glance" pattern is a bare h2 followed by its grid):
   `div:has(> h2) { margin-bottom: clamp(1.75rem, 4.3vw, 3.25rem) }` +
   `h2 + * { margin-top: … }`. (43px @1000 / 52px cap / 28px phone floor.)
3. **Strip trays** — careers `01b-life`, download `02b-tray` + `04b-strip` adopt the
   established compact-band law `clamp(3.5rem, min(7vw, 10svh), 6rem)` (the pattern
   already serving `page-updates 06-contact` and `page-referral 07-privacy`).

## Checks

All run on the exact candidate tree (`npm run check` composite, full battery):

| Check | Result |
| --- | --- |
| `verify-layout` / `verify-imports` | green (0 exit) |
| script tests | 54/54 pass |
| `qa:continuity` / `qa:motion` / `qa:taps` | green (0 exit) |
| `scope:audit` | green — 237 control files / 1656 declarations unchanged; only the 8 re-texted page digests + public-bridge.css re-digested in `product-surface.json` |
| frontend lint | 0 issues |
| frontend typecheck ×2 (jsconfig + tsconfig.domain) | 0 errors |
| frontend tests | 656/656 pass |
| vite production build | ✓ (PrivacyPage chunk 29.13 kB, gzip 7.90 kB) |

### Rendered verification (vite preview serving the built dist, window 1000×700)

Computed-style readbacks of every tagged chapter — the *after* values are the law,
the old values are the hand-set bands they replaced:

| Surface | Chip | Verdict |
| --- | --- | --- |
| privacy / terms / security / cookies / accessibility / help | all chapter bands 125/125 @1000 (was 56–128 hand-set muddle), carrier `clamp(6rem, 12.5vw, 10rem)` readable on `main` | law applied 14/14, 16/16, 14/14, 10/10, 9/9, 2/2 |
| statement→copy gap (privacy) | `02-summary` bare h2→grid **43px** (was 24); all wrapped chapters wrapper mb **43px** (was 24) | law applied |
| statement→copy gap (terms / cookies / security / accessibility) | 43px on every h2 chapter incl. the `max-w-[720px]` category wrappers | law applied |
| careers strip `01b-life`, download strips `02b-tray` + `04b-strip` | **70/70** @1000 — compact law `clamp(3.5rem, min(7vw, 10svh), 6rem)` at 7vw | law applied; neighbouring main chapters unchanged at 110/110 (careers) |
| horizontal overflow check | `scrollWidth > clientWidth` false on all seven swept pages | no layout break |
| jobs/carrier guards | careers/download keep their own carrier `min(11vw, 18svh)`; hero plates untouched (download hero 96/96, careers hero 0, authored) | exempted by design |

Screenshot note: full-page capture was blocked this session (desktop browser window
not visible to the harness — `browser.screenshot` requires a visible tab); the
computed-style readbacks above are the numeric evidence, and the D-095 reviewer
records their own walkthrough with the exact reviewed commit per house rules.

## Handoff

- D-095: implementer cannot self-approve — external reviewer records the exact
  reviewed commit before FAP-35 → Done.
- FAP lane convention: task branch merges to **beta** first, `dev` after review.
- After review acceptance the founder walkthrough (landing → pricing → download →
  trust → auth → dashboard → policy chain) may flip the audit doc production-ready.
