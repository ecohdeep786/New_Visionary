# F-09 — Motion and interaction consistency (2026-11-06)

Jira key / source ID: F-09 (Visionary Frontend Agent task — motion and interaction consistency)
Acceptance scope: enabler (audit/verification; findings only, no product changes)
Implementer: ZCode agent (Motion Engineer specialist)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f09-motion` / beta `63ae88a0` (F-08 landing)
Owned files: `frontend/scripts/motion-verification.mjs` (new reusable harness), evidence
directory, this receipt. No source style/product file changed.

## Objective and method

Verify motion tokens, animations, interaction feedback, focus states and reduced-motion support.
Two evidence streams against beta `63ae88a0`, both produced this run:

1. **Static law audit** — the D1 motion law engine (`qa-motion.mjs`, 8 rules: curve law, self-running
   `linear` exception, bounce ban, retired curves, single token home, Tailwind easing redirect,
   ease-class ban, reduced-motion contract set) plus duration/focus/feedback sweeps.
2. **Live rendered verification** — new harness `frontend/scripts/motion-verification.mjs` drives
   the product on Vite dev `127.0.0.1:4198`: landing at 1440 in default and
   `prefers-reduced-motion: reduce` contexts, hover scans on visible controls, **real-keyboard**
   focus walk, and the preview-mode onboarding journey. Evidence + receipt:
   `docs/visionary/baseline/f09-motion-2026-11-06/`.

## A. Verified-correct (protect)

| Law | Verified evidence (this run) |
| --- | --- |
| D1 curve at runtime | Landing CTA computed `transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1)` — the one product curve, live |
| Curve law engine | `qa:motion` PASS (439 motion-bearing files): curve/single-home/bounce/retired/Tailwind/ease-class rules all hold |
| Reduced motion (global kill) | Under `prefers-reduced-motion: reduce` the hero element computes `animation-duration: 1e-05s` (the index.css:360 kill block: `0.01ms !important` + `delay 0s`, with the recorded L5 invisible-keyed-content fix) |
| Reduced motion (per-sheet contracts) | The only animations still running under reduce are `appleFadeIn` opacity-only fades from the documented cast.css contract ("keeps the cast visible with a fade only — no movement"); verified `transform: none` and content opacity → 1 on every animating node |
| Focus visibility (real keyboard) | Tab on the onboarding identity grid computes **`outline: 2px solid rgb(0,102,204)`** — the blue focus law renders via real key events; landing Tab walk reaches the visible skip-link outline |
| Interaction feedback | Hover scans show computed color feedback on visible controls (persona tabs slate `rgb(110,110,115)` → ink `rgb(31,31,33)`); press feedback law exists in code (`active:scale-[0.98]` ×24, AuthUI disabled-resets `active:scale-100`) |
| Motion is CSS-only | `framer-motion` remains a zero-usage dependency (F-04 D-05) — no JS animation runtime in the render path |

## B. Verified findings

**F-09-F1 (P3, the D1 duration scale is bypassed by Tailwind duration utilities).** The law
declares one five-step duration scale (180/280/420/650/900 ms, single-homed in tokens.css), and
`tailwind.config.js` redirects every **easing** key to the law curve — but not the **duration**
keys. JSX therefore ships `duration-200` ×106, `duration-700` ×28, `duration-500` ×19,
`duration-300` ×18, `duration-150` ×9, `duration-1000` ×1 — **181 interaction durations, none on
the law scale** (computed evidence: the landing CTA transition runs 0.2s on the law curve). The
deltas are sub-perceptual (200 vs 180 ms), so the cost is law integrity, not experience. The
mechanical fix mirrors the existing easing redirect.

**F-09-F2 (P3, two press-feedback scales coexist).** `active:scale-[0.98]` (24 — the AuthUI law)
and `active:scale-95` (14) both ship; two press depths for the same interaction class.

**F-09-F3 (INFO, verification-harness note).** Programmatic `.focus()` does not match
`:focus-visible` in Chromium; the harness uses real Tab key events for focus-law checks (the first
draft's "no visible ring" reading was this artifact, corrected this run). Reduced-motion gates
check for movement (`transform`) rather than animation presence, because the per-sheet opacity-only
fades are the documented static-and-visible contract.

## C. Acceptance criteria

| ID | Done when (measurable) |
| --- | --- |
| F-09-F1 | `tailwind.config.js` maps the duration keys to the law scale (or a documented nearest-step mapping); `grep duration-[0-9]+` in src resolves only to law steps; `qa:motion` still PASS; battery green; landing CTA computed duration ∈ {180,280,420,650,900} ms |
| F-09-F2 | One press-depth law documented; the other value swept; battery green |

## D. Implementation order (none authorized in this lane)

| Order | Task | Covers | Depends on |
| --- | --- | --- | --- |
| **T1** | Tailwind duration-scale redirect (config-level, mirrors the easing redirect; sweep any literal off-scale transition durations) | F-09-F1 | — |
| **T2** | Press-depth law (keep 0.98, sweep 95) | F-09-F2 | T1 (same sweep) |

Sub-perceptual deltas; standard battery + F-03 baseline comparison applies.

## E. Verification results (this run)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout |
| `node scripts/motion-verification.mjs` | **PASS** — 7 records: law curve computed on transitions; entrance animation present by default and collapsed (1e-05s) under reduce; reduce-context animations are opacity-only with `transform: none`; hover color feedback on visible controls; visible focus outline (2px solid #0066cc) via real Tab; zero page errors |
| Full battery | **PASS — all stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (18.52 s); qa:taps PASS (243 controls/126 files); qa:motion PASS (439 files); qa:continuity PASS; `npm run check` exit 0 (3842 imported files match baseline + 4 recorded patches) |
| Visual evidence | Landing default/hover/reduced captures + journey captures in `docs/visionary/baseline/f09-motion-2026-11-06/` |

## F. Backend / ML dependencies

None.

## G. Remaining issues and risks

- The duration-scale bypass grows with every new `duration-*` class until T1 lands.
- The per-sheet reduced contracts (cast.css) are load-bearing for static-and-visible; qa-motion
  rule 8 guards their presence — keep them in sync with any new animated section sheets.

## H. Worktree and change summary

`New_Visionary-worktrees/zcode-f09-motion` on `zcode/f09-motion` = beta `63ae88a0` + verification
harness + evidence + this receipt. Junction-based node_modules runtime arrangement (nothing
committed). Worktree removed after the beta landing per the operator's standing instruction;
branch retained pushed for review.

## I. Review handoff

```
Jira key / source ID: F-09
Acceptance scope: enabler (motion and interaction consistency audit)
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f09-motion / 63ae88a0 / <receipt commit>
Owned files: frontend/scripts/motion-verification.mjs; docs/visionary/baseline/f09-motion-2026-11-06/ (4 PNG + receipt.json); this receipt
Verification: D1 law live (curve/reduce/focus/hover) + qa-motion 8-rule PASS; battery all-exit-0; product on 4198 throughout
Findings: F-09-F1 (P3 duration-scale bypass, 181 instances), F-09-F2 (P3 press-depth split), F-09-F3 (INFO harness note)
Reviewer decision: pending
Dev integration commit: pending
Next dependent task: T1 config-level duration redirect
```
