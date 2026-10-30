# FAP-C9 — current-tree acceptance closeout evidence (FAP-34)

Status: **re-verified on beta 156d0bed; review acceptance pending (D-095)** ·
Lane: `opencode/fap-c9-closeout` (fresh per D-098 from verified origin/beta
156d0bed — the F1 delivery record tip; tree identical to the receipted F1
candidate 9dc944c5 · beta merge 44f1f15f).

## Why this closeout exists

FAP-34 was returned to In Progress by the founder on 2026-10-21 (00:18, right
after the author's spacing-pass handoff) and self-assigned — the review round
itself. Since then seven further receipted lanes landed on the same surfaces
(A1 token convergence FAP-58 Done, B1 voice-type ladder FAP-46, C3/C4, D1–D3,
E1, F1 final pass). This closeout re-runs the C9 acceptance gate on the exact
production tree so the reviewer reviews current reality, not October-21
evidence.

## Acceptance re-run (prod build served at 127.0.0.1:4188)

| Gate (spec §5) | Result on beta 156d0bed |
| --- | --- |
| Role-aware type probe (7 public pages × 390/768/1440: hero pairing, caps, ladder membership, nav, body, overflow) | **120/120 PASS** (`type-verify`, refreshed JSON in artifacts) |
| Vision-Pro category heroes (student/teacher: statement 40/700→56/600→64/600, tagline 17/24/28 @600, lh/ls curve) | **EXACT at all three viewports**, zero overflow (`hero-verify`, refreshed JSON) |
| No section head > 64px; no lead > 28px; no meaning text < 14px | enforced by the probe caps + recorded A4/B5 burn-downs — all PASS |
| Full battery on this exact tree | receipted green on the identical tree: F1 candidate 9dc944c5 — verify-layout/imports, qa:continuity/motion/taps, 54 script tests, scope:audit (237/1656), lint 0, typecheck ×2 0, 656/656, vite build ok |

## The one documented supersession (display role)

The 2026-10-20 spec's landing-display ladder verifies as 64/96/**140**
(`hero-verify` @C9 time, committed evidence). On the current tree the rotating
display word reads 117@1440 / 96@1024 / 41.5@390. This is **not drift, and not
a regression**: it is the later receipted **hero one-voice law** (B1, FAP-46,
commit 6d54b76b, 2026-10-21 19:34):

- Founder-reported bug it fixed: the per-word rotation rendered **mixed sizes**
  (140/~127 and 64/~44 at the same width) — words at different sizes in one
  cast line violates the ladder's own "one line-height per role" contract.
- The replacement law: the audience line is fitted **once per width** (widest
  word vs the 980px copy column; canvas measure; `fittedPx` state) so every
  word carries one identical size; the **stage line box keeps the spec anchor**
  (`--fs-hero-headline` = 64/96/140 × 1.05 clip height), so the hero's
  architecture remains the education-ladder composition.
- Machine receipted at the time: 559/559 tests, scoped eslint over the locked
  sources, rendered gate 0 unrole: `B1_EVIDENCE.md` + `b1-typography-*.json`.
- Every lane that touched the hero since (D1 motion law, D3 density split, F1
  spacing) kept the one-voice law; probes re-run here confirm it holds.

Reviewer judgement required: accept the display replacement as the governing
LAW for the display role (spec amendment), or direct the one-voice fit to
re-round toward the spec ladder at ≥1440. Either way the role-attention,
caps, weights, tracking and caps are within the spec today.

## Handoff

- D-095: the C9 acceptance decision is the founder/reviewer's (task was
  reopened for exactly that review; implementer cannot self-approve).
- FAP-34 remains **In Progress under the founder's reopen** — this closeout
  only refreshes the acceptance evidence and posts the status comment; no
  transition was performed by this lane.
- Split-tree note: `hero-verify`'s cast-vs-category contracts were recorded
  pre-B1; a follow-up probe amendment (list the one-voice law targets) can be
  attached to C9 when its verdict lands — deliberately NOT edited here so the
  reviewer sees the raw re-run against the committed probe contract.
