# B2 EVIDENCE — FAP-47 · kickers, labels, tier coherence + quiet next-step doors (2026-10-22)

Worktree `gl-kan-201-b2-kickers` seeded from `origin/beta` @ `6d54b76be4226d49be5a804b1174aae41ff523dd` (the B1 merge). Dev server `:5188`.
Scope: codify the kicker voice (role `data-type="label"` 21/600/0.011em/1.19, sentence-case), retire every public uppercase mask, unify the caption dial (12/600/−0.016em/1.333), re-author the off-ladder body tiers (15→16 aux, 16.5→16, 14.5→14, 17.5→17), zero the headline-blue outside the sanctioned moment, and add the approved per-module quiet next-step doors.

## 1. Kicker codification (the four founder consults)

- **Role law.** `apple-typography.css` carries the `data-type="label"` law: `font-size: var(--fs-label)` (21px at `:root`), 600, 0.011em, 1.19, `text-transform: none`. The **eleven** lead-ins (AboutUsHero + download/community/partners/updates/referral/accessibility str-heroes + the four policy header p's) declare the role; the verified measurement is exactly 21px / 0.231px track / 24.99px lh / none on all eleven (`b2-label-check.mjs` → `label sites: 11 bad: 0`).
- **Token-scope fix (rhythm.css `:root`).** The caption/meta voice tokens existed only on the plain-section scope, so chrome (asides, "In this policy" TOC, values strip, partner `th`) resolved nothing. Root-level mirrors added after the `--fs-label` block (`--fs-meta: 0.875rem; --fs-caption: 0.75rem; --lh-caption: 1.333333; --track-meta: -0.016em; --weight-heading: 600`) — values identical to the section scope, so in-section resolution is unchanged (verified by the pre/post law drift in §3).
- **Mask retirement.** All ~52 remaining public `uppercase` sites (≈20+ sources: policy pages, Contact, Safety, ResearchNews dark, AboutUs, referral chip, partners chips + `th`, download, careers, coaching) converge on `.apple-eyebrow`; zero `uppercase` classes left in `src/pages/landing` + `src/components/landing` (the test lock now forbids the string in all public .jsx). The old public `p.uppercase` mask law is deleted from `public-bridge.css` (workspace's own `p.uppercase` law kept, workspace-typography untouched).
- **Caption-dial unification.** The drift triage (§3) receipts every intended delta: numbered eyebrows / contact chips / honesty chips / `h3` kickers / policy `th` rows re-dial 14px/−0.224px/20lh → 12px/−0.192px/16lh (the `apple-eyebrow` caption dial).
- **Copy case.** The kicker copy was re-authored sentence-case; the literal all-caps regex sweep (`>[A-Z][A-Z0-9 ,&.'-]{3,}<`) across public pages + components reports **0** remaining.

## 2. Headline blue → ink; tier sweep

- 13 flat `#0066cc` headline spans inside headlines flipped to `#1d1d1f` (About "Our mission" eyebrow now grey; CoachingPage rotating word inherits ink; icon-tile spans keep blue). Blue survives only in the sanctioned accent-gradient moments on the stage.
- Tier sweep: **158 substitutions across 23 public files** (15→16, 16.5→16, 14.5→14, 17.5→17), chrome included (nav pills, ValuesStrip, LandingFooter, LandingFAQ, Breadcrumb), dashboard dirs excluded.

## 3. Retired laws + the full-body measurement chain

- `b2-bank.mjs` banked **24 routes** × settled an enumerable kicker/meta/body census. Before-bank = 1,101 tracked sites → after re-locate 1:1 (`b2-drift2.mjs`: paired=1101, unresolved=0, driftRows=39) — **all 39 deltas are the intended unifications above** (span-kicker caption dial, aside/`th` re-voicing, "Our mission" blue→grey, `text-transform` flips), none unexplained.
- **Retired laws** (applied after the re-authoring so every public rider first left the classes they enforced):
  - the public `p.uppercase` mask (was the 21px bridge voice) and the `.uppercase` arm of the caption law in `apple-typography.css`;
  - the public-bridge **body-size law** (`.text-[15px]/[16.5px] → 16`, `.text-[14.5px] → 14`, `.text-[17px]/[17.5px] → 17`, all `!important`) — it overrode authored responsive tiers on public pages and flattened the workspace's own declared rem key.
- **Workspace effect of the body-law retirement (receipted).** Public sources hold zero rider classes (grep), so no public render change. Inside the workspace, the bridge had flattened only `text-[15px]` (its other sizes were already covered by the workspace's own keys); the two last consumers (`AchievementsCard.jsx` L46, `SubjectHeroBanner.jsx` L67) now render the declared `.9375rem` and scale — the workspace-intended behavior, per `workspace-typography.css` L15–16 ("allow… every text role" to scale).
- **One authored restoration:** the research hero line `max-w-[480px] text-[17px] … sm:text-[18px]` renders 18px at ≥640px for the first time — the bridge had pinned it to 17. The page's own responsive intent; visible as a single-site 17→18 on `/research` (b3 dump line `research#11`).
- **b3 equality (pre-doors):** fresh dump after the two law retirements = 2,413 measured sites; `b2-equal.mjs` vs the pre-retirement dump = **1 delta** (the authored restoration) — every other site byte-equal.
- **b5 closure (post-doors):** fresh dump after the 26 door-source edits; multiset diff of measured-voice tuples (`b2-doors-closure2.mjs`): **lost=0**, every new tuple accounted for (29 door rows + the four legal "Questions about this policy?" lead-ins; one misclassified row verified by inspection = the accessibility statement door rendering the exact pre-existing quiet-link law — same measured voice as the standing `View product updates` link, `fs 17 / ls −0.374px / lh 20.2382 / tracking-[0]` class).

## 4. Quiet next-step doors (29/29 approved and implemented)

Founder-approved schedule (copy + targets), implemented verbatim; the anatomy is the A2 quiet link, lifted into a shared component:

- `components/landing/QuietLink.jsx` — router `Link`/plain-`a`/dark variants, 17px/400, `min-h-11` (44px hit), keyable focus ring, chevron gap. `ResearchNewsPage` now imports it (its former inline copy deleted — one anatomy, one source).
- Partners ×4 (02-what→`#who`, 03-who→`#includes`, 05-depth→`/contact`, 06-journey→`#faq`) · Accessibility ×6 (statement→`#sync`, vision→`/help`, voice→`/how-it-works`, motor→`/download`, language→`/contact`, commitment→`mailto:accessibility@`) · Download ×3 (platforms→`/how-it-works`, sync→`/contact`, requirements→`/help`) · Careers ×3 (why→`#teams`, teams→`/about`, hiring→`mailto:careers@` subject *Hiring process question*) · Research ×3 (mission→`#latest`, latest→`#areas`, projects→`/updates`) · Referral ×1 new (honesty→`mailto:hello@` subject *Referral question*; 02-how already carries its own quiet door) · Safety ×2 (statement→`#protections`, protections→`mailto:safety@` subject *Safety question*) · How-it-works ×1 (loop end→`/register`) · Home ×1 (03-promise, dark variant→`/how-it-works`) · Legal ×4 (one page-end contact door each after "Read them together": question lead-in + "Talk to a person"→`/contact`).
- **Render receipts.** `b2-doors-verify.mjs`: every approved label present as a real link with ≥40px hit box on all 13 door routes (`ALL DOORS RENDER ✓`). Raw-dump multiset diff: pre-door voices intact (`lost=0`).
- **Registry compliance.** `product-surface.test.mjs` initially failed closed: *Unreviewed control file: QuietLink.jsx*. `QuietLink` was added to `integration/contracts/product-surface-review.json` (profile `client-presentation`, the same record as Breadcrumb/LandingFAQ/LandingNav), and `npm run scope:audit:write` regenerated `docs/architecture/tracking/product-surface.json` + the audit MD (controlFiles 219→220).

## 5. Documentation + enforcement

- `docs/visionary/design/VOICE_TYPE_LADDER_2026-10-21.md`: the `label` role row, the `.apple-eyebrow` row, the resolved kicker/caption row, and the B2 receipts section (retired laws, probe chain, hand-forwards).
- `tests/landing-type-roles.test.mjs` extended (59–60 tests green): no public source authors `uppercase`; the label law pins the measured dial (`var(--fs-label)`, 600, 0.011em, 1.19, sentence-case); the eleven label sites keep their role; every `components/landing` + `pages/landing` .jsx carries the lock.

## 6. Gates

| gate | result |
|---|---|
| `npm run lint` | 0 errors (`--quiet` empty output) |
| `npm run typecheck` | both projects pass (`tsc -p jsconfig.json && tsc -p tsconfig.domain.json`) |
| `npm test` | **609/609 pass** (incl. product-surface inventory refreshed; landing-type-roles B2 locks) |
| `npm run build` | ✓ built in ~21s |
| rendered probes | doors-verify `ALL DOORS RENDER ✓`; closure diff `lost=0`; label check `11 bad:0` |

## 7. AC summary (FAP-47)

- **No uppercase kickers on public pages** — static lock + census zero; retired mask laws; sentence-case kickers on the 11 label sites + ~52 `apple-eyebrow` sites.
- **Blue in headlines = 0 outside the sanctioned moment** — 13 flat headline spans → ink.
- **Copy reviewed by the product owner** — the door schedule (29 rows, copy + targets) presented and approved via the question tool; anatomy sanity-checked (17px blue + chevron, 44px hit).
- **Screenshots recorded** — 15 settled full-page 1440 captures in `b2-screens/` (`*-1440.png`), four loaded in the Review pane for the founder (home promise door, partners doors, how-it-works loop door, privacy contact door).

## 8. Hand-forwards

C1 persona-router card radius → token · C4 billing knob + email-input geometry · rgba channel-form leaks (~397 hits) + box-shadow scans + premium dark-scene anatomy (B3/D2) · LandingFAQ `clamp(22, 2.2vw, 32)` span (tier-swept once) pitched to B3.
